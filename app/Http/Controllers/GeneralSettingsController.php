<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use App\Models\EmployeeSchedule;
use App\Models\User;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class GeneralSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        // Enforce superadmin access
        if ($request->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized action.');
        }

        $settings = GeneralSetting::first() ?? GeneralSetting::create([
            'company_name' => 'Housephone',
            'work_start_time' => '09:00:00',
            'work_end_time' => '18:00:00',
            'grace_period_minutes' => 15,
            'geofence_lock_enabled' => true,
            'notification_emails' => null,
        ]);

        $schedules = EmployeeSchedule::with(['user', 'store'])->get();
        $employees = User::where('role', 'karyawan')->get();
        $stores = Store::all();

        return Inertia::render('Settings/General', [
            'settings' => $settings,
            'schedules' => $schedules,
            'employees' => $employees,
            'stores' => $stores,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $request->validate([
            'company_name' => 'required|string|max:255',
            'work_start_time' => 'required|string',
            'work_end_time' => 'required|string',
            'grace_period_minutes' => 'required|integer|min:0',
            'geofence_lock_enabled' => 'required|boolean',
            'notification_emails' => 'nullable|string',
        ]);

        $settings = GeneralSetting::first() ?? new GeneralSetting();
        $settings->fill($request->only([
            'company_name',
            'work_start_time',
            'work_end_time',
            'grace_period_minutes',
            'geofence_lock_enabled',
            'notification_emails',
        ]));
        $settings->save();

        return redirect()->back()->with('success', 'Pengaturan umum berhasil disimpan.');
    }

    public function storeSchedule(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'store_id' => 'required|exists:stores,id',
            'work_start_time' => 'nullable|string',
            'work_end_time' => 'nullable|string',
            'grace_period_minutes' => 'nullable|integer|min:0',
        ]);

        EmployeeSchedule::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'store_id' => $request->store_id,
            ],
            [
                'work_start_time' => $request->work_start_time,
                'work_end_time' => $request->work_end_time,
                'grace_period_minutes' => $request->grace_period_minutes,
            ]
        );

        return redirect()->back()->with('success', 'Jadwal shift karyawan berhasil disimpan.');
    }

    public function destroySchedule(EmployeeSchedule $schedule, Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $schedule->delete();

        return redirect()->back()->with('success', 'Jadwal shift karyawan berhasil dihapus.');
    }
}
