<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Attendance;
use App\Models\PettyCash;
use App\Models\Store;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        $activeAttendance = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->first();

        // Get past shifts
        $shifts = Shift::with(['store', 'user'])
            ->when($user->role !== 'superadmin', fn($q) => $q->where('user_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->get();

        // Get active store if assigned
        $myStore = Store::find($user->store_id);

        return Inertia::render('Shifts/ShiftAttendance', [
            'activeShift' => $activeShift,
            'activeAttendance' => $activeAttendance,
            'myStore' => $myStore,
            'shifts' => $shifts,
        ]);
    }

    public function clockIn(Request $request): RedirectResponse
    {
        $request->validate([
            'start_cash' => 'required|numeric|min:0',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = $request->user();
        if (!$user->store_id) {
            return redirect()->back()->withErrors(['error' => 'User tidak terasosiasi dengan cabang mana pun.']);
        }

        $store = Store::findOrFail($user->store_id);

        // Distance math in meters (Haversine formula)
        $earthRadius = 6371000;
        $latFrom = deg2rad($request->input('latitude'));
        $lonFrom = deg2rad($request->input('longitude'));
        $latTo = deg2rad($store->latitude);
        $lonTo = deg2rad($store->longitude);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        $distance = $angle * $earthRadius;

        // Bypass geofence check if in local environment
        $isLocal = config('app.env') === 'local';
        if (!$isLocal && $distance > $store->geofence_radius) {
            return redirect()->back()->withErrors(['error' => 'Absensi ditolak. Anda berada di luar radius toko (' . round($distance) . 'm dari lokasi toko).']);
        }

        DB::transaction(function () use ($request, $user, $store) {
            // Open shift
            $shift = Shift::create([
                'store_id' => $store->id,
                'user_id' => $user->id,
                'start_cash' => $request->input('start_cash'),
                'status' => 'open',
                'opened_at' => now(),
            ]);

            // Open attendance
            Attendance::create([
                'store_id' => $store->id,
                'user_id' => $user->id,
                'clock_in' => now(),
                'clock_in_lat' => $request->input('latitude'),
                'clock_in_lng' => $request->input('longitude'),
                'status' => 'present',
            ]);

            ActivityLog::log('shift_clock_in', Shift::class, $shift->id, [
                'store_name' => $store->name,
                'start_cash' => $shift->start_cash,
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude')
            ]);
        });

        return redirect()->back()->with('success', 'Absen masuk & Shift berhasil dibuka.');
    }

    public function clockOut(Request $request): RedirectResponse
    {
        $request->validate([
            'end_cash' => 'required|numeric|min:0',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = $request->user();
        $shift = Shift::where('user_id', $user->id)->where('status', 'open')->first();
        $attendance = Attendance::where('user_id', $user->id)->whereNull('clock_out')->first();

        if (!$shift || !$attendance) {
            return redirect()->back()->withErrors(['error' => 'Tidak ada shift atau absensi aktif ditemukan.']);
        }

        DB::transaction(function () use ($request, $user, $shift, $attendance) {
            // Calculate system expected cash: start_cash + sales cash - returns cash - cash drops - petty cash out
            $salesCash = DB::table('sales')
                ->where('shift_id', $shift->id)
                ->where('payment_method', 'cash')
                ->where('status', 'completed')
                ->sum('total_amount');

            $returnsCash = DB::table('returns')
                ->join('sales', 'returns.sale_id', '=', 'sales.id')
                ->where('sales.shift_id', $shift->id)
                ->where('sales.payment_method', 'cash')
                ->sum('returns.refund_amount');

            $pettyOut = DB::table('petty_cashes')
                ->where('shift_id', $shift->id)
                ->where('type', 'out')
                ->sum('amount');

            $pettyIn = DB::table('petty_cashes')
                ->where('shift_id', $shift->id)
                ->where('type', 'in')
                ->sum('amount');

            $expectedEndCash = $shift->start_cash + $salesCash - $returnsCash - $pettyOut + $pettyIn;
            $difference = $request->input('end_cash') - $expectedEndCash;

            $shift->update([
                'end_cash' => $request->input('end_cash'),
                'expected_end_cash' => $expectedEndCash,
                'difference' => $difference,
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            $attendance->update([
                'clock_out' => now(),
                'clock_out_lat' => $request->input('latitude'),
                'clock_out_lng' => $request->input('longitude'),
            ]);

            ActivityLog::log('shift_clock_out', Shift::class, $shift->id, [
                'end_cash' => $shift->end_cash,
                'difference' => $shift->difference,
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude')
            ]);
        });

        return redirect()->back()->with('success', 'Tutup shift & absen keluar berhasil disimpan.');
    }

    public function cashDrop(Request $request): RedirectResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string',
        ]);

        $user = $request->user();
        $shift = Shift::where('user_id', $user->id)->where('status', 'open')->first();

        if (!$shift) {
            return redirect()->back()->withErrors(['error' => 'Tidak ada shift aktif untuk melakukan penarikan cash drop.']);
        }

        $petty = PettyCash::create([
            'store_id' => $shift->store_id,
            'shift_id' => $shift->id,
            'type' => 'out',
            'amount' => $request->input('amount'),
            'description' => 'Cash Drop: ' . $request->input('description'),
        ]);

        ActivityLog::log('shift_cash_drop', PettyCash::class, $petty->id, [
            'amount' => $petty->amount,
            'description' => $petty->description
        ]);

        return redirect()->back()->with('success', 'Setoran cash drop tengah shift berhasil disimpan.');
    }

    public function pettyCash(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => 'required|in:in,out',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string',
        ]);

        $user = $request->user();
        $shift = Shift::where('user_id', $user->id)->where('status', 'open')->first();

        if (!$shift) {
            return redirect()->back()->withErrors(['error' => 'Buka shift kasir terlebih dahulu untuk mencatat pengeluaran kas kecil.']);
        }

        $petty = PettyCash::create([
            'store_id' => $shift->store_id,
            'shift_id' => $shift->id,
            'type' => $request->input('type'),
            'amount' => $request->input('amount'),
            'description' => $request->input('description'),
        ]);

        ActivityLog::log('shift_petty_cash', PettyCash::class, $petty->id, [
            'type' => $petty->type,
            'amount' => $petty->amount,
            'description' => $petty->description
        ]);

        return redirect()->back()->with('success', 'Kas kecil operasional berhasil dicatat.');
    }
}
