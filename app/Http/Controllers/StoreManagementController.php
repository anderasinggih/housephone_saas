<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreManagementController extends Controller
{
    public function index(Request $request): Response
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403, 'Hanya Superadmin yang diperbolehkan mengelola cabang.');
        }

        $stores = Store::withCount('users', 'stocks')->get();

        return Inertia::render('Stores/Index', [
            'stores' => $stores,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:stores,name',
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'geofence_radius' => 'required|integer|min:10',
        ]);

        Store::create($validated);

        return redirect()->back()->with('success', 'Cabang baru berhasil ditambahkan.');
    }

    public function update(Request $request, Store $store): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:stores,name,' . $store->id,
            'address' => 'required|string|max:500',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'geofence_radius' => 'required|integer|min:10',
        ]);

        $store->update($validated);

        return redirect()->back()->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Request $request, Store $store): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        // Check if store has users or stocks
        if ($store->users()->count() > 0 || $store->stocks()->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menghapus cabang ini karena masih terdapat karyawan atau stok terkait.']);
        }

        $store->delete();

        return redirect()->back()->with('success', 'Cabang berhasil dihapus.');
    }
}
