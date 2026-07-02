<?php

namespace App\Http\Controllers;

use App\Models\MoneyNote;
use App\Models\MoneyNoteCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MoneyNoteController extends Controller
{
    public function index(Request $request): Response
    {
        // Enforce superadmin restriction (fallback check)
        if ($request->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized action.');
        }

        $logs = MoneyNote::orderBy('date', 'desc')->orderBy('created_at', 'desc')->get();
        $categories = MoneyNoteCategory::orderBy('name', 'asc')->get();

        $totalIncome = MoneyNote::where('type', 'in')->sum('amount');
        $totalExpense = MoneyNote::where('type', 'out')->sum('amount');
        $balance = $totalIncome - $totalExpense;

        return Inertia::render('MoneyNotes/MoneyNotes', [
            'logs' => $logs,
            'categories' => $categories,
            'summary' => [
                'total_income' => (float)$totalIncome,
                'total_expense' => (float)$totalExpense,
                'balance' => (float)$balance,
            ]
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:in,out',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        MoneyNote::create($validated);

        return redirect()->back()->with('success', 'Catatan keuangan berhasil disimpan.');
    }

    public function destroy(Request $request, MoneyNote $moneyNote): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $moneyNote->delete();

        return redirect()->back()->with('success', 'Catatan keuangan berhasil dihapus.');
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'superadmin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:in,out',
        ]);

        // Check if category already exists
        $exists = MoneyNoteCategory::where('name', $validated['name'])
            ->where('type', $validated['type'])
            ->exists();

        if (!$exists) {
            MoneyNoteCategory::create($validated);
        }

        return redirect()->back()->with('success', 'Kategori baru berhasil ditambahkan.');
    }
}
