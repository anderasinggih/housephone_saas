<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'checkedInToday' => $request->user() 
                    ? \App\Models\Attendance::where('user_id', $request->user()->id)
                        ->whereDate('clock_in', \Carbon\Carbon::today())
                        ->exists()
                    : false,
                'isClockedIn' => $request->user()
                    ? \App\Models\Attendance::where('user_id', $request->user()->id)
                        ->whereDate('clock_in', \Carbon\Carbon::today())
                        ->whereNull('clock_out')
                        ->exists()
                    : false,
                'isClockedOut' => $request->user()
                    ? \App\Models\Attendance::where('user_id', $request->user()->id)
                        ->whereDate('clock_in', \Carbon\Carbon::today())
                        ->whereNotNull('clock_out')
                        ->exists()
                    : false,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'invoice_number' => $request->session()->get('invoice_number'),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
