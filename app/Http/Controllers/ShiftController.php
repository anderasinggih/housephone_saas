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

        $selectedMonth = $request->input('month', date('m'));
        $selectedYear = $request->input('year', date('Y'));

        $employees = User::where('role', 'karyawan')->get();

        // Get past shifts with attendance
        $shifts = Shift::with(['store', 'user', 'pettyCash'])
            ->when(!in_array($user->role, ['superadmin', 'viewer']), fn($q) => $q->where('user_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->get();

        $generalSettings = \App\Models\GeneralSetting::first() ?? \App\Models\GeneralSetting::create();
        $employeeSchedules = \App\Models\EmployeeSchedule::with(['user', 'store'])->get();

        // Attach corresponding attendance or calculate late minutes for each shift
        $shifts->transform(function($sh) use ($employeeSchedules, $generalSettings) {
            $att = Attendance::where('user_id', $sh->user_id)
                ->whereDate('clock_in', \Carbon\Carbon::parse($sh->opened_at)->toDateString())
                ->first();

            // Find matching schedule for user (by user_id and store_id if available)
            $sched = $employeeSchedules->first(function($item) use ($sh) {
                return (int)$item->user_id === (int)$sh->user_id && (int)$item->store_id === (int)$sh->store_id;
            }) ?? $employeeSchedules->first(fn($item) => (int)$item->user_id === (int)$sh->user_id);

            $workStartStr = ($sched && !empty($sched->work_start_time)) ? $sched->work_start_time : ($generalSettings->work_start_time ?? '09:00:00');
            if (strlen($workStartStr) === 5) {
                $workStartStr .= ':00';
            }

            // Grace period tolerance
            $graceMins = ($sched && !is_null($sched->grace_period_minutes)) ? (int)$sched->grace_period_minutes : (int)($generalSettings->grace_period_minutes ?? 15);

            $openedAt = \Carbon\Carbon::parse($sh->opened_at);
            $targetTime = \Carbon\Carbon::parse($openedAt->format('Y-m-d') . ' ' . $workStartStr);

            $lateMins = 0;
            if ($openedAt->gt($targetTime)) {
                $diffInSeconds = $openedAt->timestamp - $targetTime->timestamp;
                $diffInMinutes = (int)ceil($diffInSeconds / 60);
                if ($diffInMinutes > $graceMins) {
                    $lateMins = $diffInMinutes;
                }
            }

            // Calculate omset and profit during this shift
            $sales = \App\Models\Sale::with('items')->where('shift_id', $sh->id)->where('status', 'completed')->get();
            $totalOmset = $sales->sum('total_amount');
            $totalProfit = 0;
            foreach ($sales as $saleItemObj) {
                foreach ($saleItemObj->items as $item) {
                    if (!$item->is_trade_in_item) {
                        $sell = (float)$item->actual_sell_price * (int)$item->qty;
                        $buy = (float)$item->buy_price_snap * (int)$item->qty;
                        $totalProfit += ($sell - $buy);
                    }
                }
                // Subtract affiliate fee if any
                $totalProfit -= (float)($saleItemObj->affiliate_fee ?? 0);
            }

            $sh->late_minutes = $lateMins;
            $sh->total_omset = $totalOmset;
            $sh->total_profit = $totalProfit;
            return $sh;
        });

        // Get active store if assigned
        $myStore = Store::find($user->store_id);

        // Aggregate attendance statistics directly from computed shifts to guarantee 100% synchronization
        if (in_array($user->role, ['superadmin', 'viewer'])) {
            $attendanceStats = $employees->map(function($emp) use ($shifts, $selectedMonth, $selectedYear) {
                $userShifts = $shifts->filter(function($sh) use ($emp, $selectedMonth, $selectedYear) {
                    $d = \Carbon\Carbon::parse($sh->opened_at);
                    return (int)$sh->user_id === (int)$emp->id && $d->month == $selectedMonth && $d->year == $selectedYear;
                });

                $totalDays = $userShifts->count();
                $totalLateMins = $userShifts->sum('late_minutes');
                $totalWorkMins = 0;

                foreach ($userShifts as $sh) {
                    if ($sh->closed_at) {
                        $start = \Carbon\Carbon::parse($sh->opened_at);
                        $end = \Carbon\Carbon::parse($sh->closed_at);
                        if ($end->gt($start)) {
                            $totalWorkMins += $start->diffInMinutes($end);
                        }
                    }
                }

                return [
                    'user_id' => $emp->id,
                    'total_days' => $totalDays,
                    'total_late_minutes' => $totalLateMins,
                    'total_work_minutes' => $totalWorkMins,
                    'user' => $emp,
                ];
            })->filter(fn($stat) => $stat['total_days'] > 0)->values();
        } else {
            $userShifts = $shifts->filter(function($sh) use ($user, $selectedMonth, $selectedYear) {
                $d = \Carbon\Carbon::parse($sh->opened_at);
                return (int)$sh->user_id === (int)$user->id && $d->month == $selectedMonth && $d->year == $selectedYear;
            });

            $totalDays = $userShifts->count();
            $totalLateMins = $userShifts->sum('late_minutes');
            $totalWorkMins = 0;

            foreach ($userShifts as $sh) {
                if ($sh->closed_at) {
                    $start = \Carbon\Carbon::parse($sh->opened_at);
                    $end = \Carbon\Carbon::parse($sh->closed_at);
                    if ($end->gt($start)) {
                        $totalWorkMins += $start->diffInMinutes($end);
                    }
                }
            }

            $attendanceStats = [
                'user_id' => $user->id,
                'total_days' => $totalDays,
                'total_late_minutes' => $totalLateMins,
                'total_work_minutes' => $totalWorkMins,
            ];
        }

        // Fetch payrolls for the selected month/year
        $payrolls = \App\Models\Payroll::with(['user', 'creator'])
            ->where('month', $selectedMonth)
            ->where('year', $selectedYear)
            ->get();

        $generalSettings = \App\Models\GeneralSetting::first() ?? \App\Models\GeneralSetting::create();
        $employeeSchedules = \App\Models\EmployeeSchedule::with(['user', 'store'])->get();
        $stores = Store::all();
        $employees = \App\Models\User::where('role', 'karyawan')->get();

        return Inertia::render('Shifts/ShiftAttendance', [
            'activeShift' => $activeShift,
            'activeAttendance' => $activeAttendance,
            'myStore' => $myStore,
            'shifts' => $shifts,
            'attendanceStats' => $attendanceStats,
            'payrolls' => $payrolls,
            'generalSettings' => $generalSettings,
            'employeeSchedules' => $employeeSchedules,
            'stores' => $stores,
            'employees' => $employees,
            'filters' => [
                'month' => (int)$selectedMonth,
                'year' => (int)$selectedYear,
            ]
        ]);
    }

    public function storePayroll(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403, 'Hanya Superadmin yang berhak mengelola payroll.');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
            'basic_salary' => 'required|numeric|min:0',
            'commission' => 'nullable|numeric|min:0',
            'allowance' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $basicSalary = (float)$validated['basic_salary'];
        $commission = (float)($validated['commission'] ?? 0);
        $allowance = (float)($validated['allowance'] ?? 0);
        $deductions = (float)($validated['deductions'] ?? 0);
        $netSalary = max(0, $basicSalary + $commission + $allowance - $deductions);

        \App\Models\Payroll::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            [
                'basic_salary' => $basicSalary,
                'commission' => $commission,
                'allowance' => $allowance,
                'deductions' => $deductions,
                'net_salary' => $netSalary,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]
        );

        return redirect()->back()->with('success', 'Payroll slip gaji berhasil disimpan.');
    }

    public function sendPayrollEmail(Request $request, \App\Models\Payroll $payroll): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403, 'Hanya Superadmin yang berhak mengirim email slip gaji.');
        }

        $payroll->load(['user.store']);
        $employee = $payroll->user;

        if (!$employee || empty($employee->email)) {
            return redirect()->back()->with('error', 'Karyawan tidak memiliki alamat email yang valid.');
        }

        try {
            \Illuminate\Support\Facades\Mail::to($employee->email)->send(new \App\Mail\PayrollSlipMail($payroll));
            return redirect()->back()->with('success', "Slip gaji berhasil dikirim ke email {$employee->email}.");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send payroll slip email: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal mengirim email: ' . $e->getMessage());
        }
    }

    public function printPayroll(Request $request, \App\Models\Payroll $payroll)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'viewer']) && $user->id !== $payroll->user_id) {
            abort(403, 'Anda tidak berhak melihat slip gaji ini.');
        }

        $payroll->load(['user.store']);
        return view('emails.payroll_slip_print', ['payroll' => $payroll]);
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

        $settings = \App\Models\GeneralSetting::first() ?? \App\Models\GeneralSetting::create();
        
        // Check if geofence is enabled in general settings
        $geofenceEnabled = $settings->geofence_lock_enabled;
        if ($geofenceEnabled) {
            $isLocal = config('app.env') === 'local';
            if (!$isLocal && $distance > $store->geofence_radius) {
                return redirect()->back()->withErrors(['error' => 'Absensi ditolak. Anda berada di luar radius toko (' . round($distance) . 'm dari lokasi toko).']);
            }
        }

        // Calculate late minutes
        $schedule = \App\Models\EmployeeSchedule::where('user_id', $user->id)
            ->where('store_id', $user->store_id)
            ->first();

        $workStart = $schedule && $schedule->work_start_time ? $schedule->work_start_time : $settings->work_start_time;
        if (strlen($workStart) === 5) {
            $workStart .= ':00';
        }
        $graceMinutes = $schedule && !is_null($schedule->grace_period_minutes) ? $schedule->grace_period_minutes : $settings->grace_period_minutes;

        $now = now();
        $workStartDateTime = \Carbon\Carbon::parse($now->toDateString() . ' ' . $workStart);
        
        $lateMinutes = 0;
        if ($now->greaterThan($workStartDateTime)) {
            $diffInMinutes = $now->diffInMinutes($workStartDateTime);
            if ($diffInMinutes > $graceMinutes) {
                $lateMinutes = $diffInMinutes;
            }
        }

        DB::transaction(function () use ($request, $user, $store, $lateMinutes) {
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
                'late_minutes' => $lateMinutes,
            ]);

            ActivityLog::log('shift_clock_in', Shift::class, $shift->id, [
                'store_name' => $store->name,
                'start_cash' => $shift->start_cash,
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'late_minutes' => $lateMinutes
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

        $settings = \App\Models\GeneralSetting::first() ?? \App\Models\GeneralSetting::create();
        $geofenceEnabled = $settings->geofence_lock_enabled;
        
        if ($geofenceEnabled) {
            $store = Store::find($attendance->store_id);
            if ($store) {
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

                $isLocal = config('app.env') === 'local';
                if (!$isLocal && $distance > $store->geofence_radius) {
                    return redirect()->back()->withErrors(['error' => 'Absensi ditolak. Anda berada di luar radius toko (' . round($distance) . 'm dari lokasi toko).']);
                }
            }
        }

        DB::transaction(function () use ($request, $user, $shift, $attendance) {
            $completedCash = DB::table('sales')
                ->where('shift_id', $shift->id)
                ->where('payment_method', 'cash')
                ->where('status', 'completed')
                ->sum('total_amount');

            $bookingCash = DB::table('sales')
                ->where('shift_id', $shift->id)
                ->where('payment_method', 'cash')
                ->where('status', 'booking')
                ->sum('dp_amount');

            $salesCash = $completedCash + $bookingCash;

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

            $workMinutes = now()->diffInMinutes($attendance->clock_in);

            $attendance->update([
                'clock_out' => now(),
                'clock_out_lat' => $request->input('latitude'),
                'clock_out_lng' => $request->input('longitude'),
                'work_minutes' => $workMinutes,
            ]);

            ActivityLog::log('shift_clock_out', Shift::class, $shift->id, [
                'end_cash' => $shift->end_cash,
                'difference' => $shift->difference,
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'work_minutes' => $workMinutes
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

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403);
        }

        $request->validate([
            'start_cash' => 'required|numeric|min:0',
            'end_cash' => 'nullable|numeric|min:0',
            'status' => 'required|in:open,closed',
            'opened_at' => 'required|date',
            'closed_at' => 'nullable|date',
        ]);

        DB::transaction(function () use ($request, $shift) {
            $oldOpenedAt = $shift->opened_at;

            $shift->update([
                'start_cash' => $request->input('start_cash'),
                'end_cash' => $request->input('end_cash'),
                'status' => $request->input('status'),
                'opened_at' => $request->input('opened_at'),
                'closed_at' => $request->input('closed_at'),
            ]);

            // Try to find corresponding attendance and update it
            $attendance = Attendance::where('user_id', $shift->user_id)
                ->whereBetween('clock_in', [
                    $oldOpenedAt->copy()->subMinutes(30),
                    $oldOpenedAt->copy()->addMinutes(30)
                ])
                ->first();

            if ($attendance) {
                $attendance->update([
                    'clock_in' => $request->input('opened_at'),
                    'clock_out' => $request->input('closed_at'),
                ]);
            }
        });

        return redirect()->back()->with('success', 'Shift berhasil diperbarui.');
    }

    public function destroy(Request $request, Shift $shift): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403);
        }

        if ($shift->sales()->exists()) {
            return redirect()->back()->with('error', 'Shift tidak dapat dihapus karena terdapat transaksi penjualan yang tercatat pada shift ini.');
        }

        DB::transaction(function () use ($shift) {
            // Find and delete corresponding attendance
            $attendance = Attendance::where('user_id', $shift->user_id)
                ->whereBetween('clock_in', [
                    $shift->opened_at->copy()->subMinutes(30),
                    $shift->opened_at->copy()->addMinutes(30)
                ])
                ->first();

            if ($attendance) {
                $attendance->delete();
            }

            $shift->delete();
        });

        return redirect()->back()->with('success', 'Shift dan absensi terkait berhasil dihapus.');
    }
}
