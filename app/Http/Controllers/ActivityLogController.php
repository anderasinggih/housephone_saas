<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::with(['user.store']);

        // Apply search query
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply action filter
        if ($request->filled('action_type')) {
            $query->where('action', $request->input('action_type'));
        }

        // Apply date filter
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        $activities = $query->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Timeline/Index', [
            'activities' => $activities,
            'filters' => $request->only(['search', 'action_type', 'date']),
        ]);
    }
}
