<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\Store;
use App\Models\DynamicParameter;
use App\Models\DynamicParameterValue;
use App\Models\StockTransfer;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function readyStock(Request $request): Response
    {
        $user = $request->user();
        $storeId = $user->store_id;

        // Superadmin and Viewer can view specific stores, otherwise default to all
        if ($user->role === 'superadmin' && $request->has('store_id')) {
            $storeId = $request->input('store_id');
        }

        $stocks = Stock::where('status', 'available')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->with(['brand', 'color', 'memory', 'license'])
            ->get();

        // Get list of other stores for Stock Transfer options
        $stores = Store::where('id', '!=', $user->store_id)->get();

        // Pending transfer requests incoming to this store or requested by this store
        $transfers = StockTransfer::with(['stock.brand', 'fromStore', 'toStore', 'requester'])
            ->where(function ($q) use ($user) {
                if ($user->store_id) {
                    $q->where('from_store_id', $user->store_id)
                      ->orWhere('to_store_id', $user->store_id);
                }
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $parameters = DynamicParameter::with(['values' => function($q) {
            $q->where('is_active', true);
        }])->get();

        return Inertia::render('Stocks/ReadyStock', [
            'stocks' => $stocks,
            'stores' => $stores,
            'transfers' => $transfers,
            'storesFilter' => Store::all(),
            'parameters' => $parameters,
            'users' => User::orderBy('name', 'asc')->get(),
            'filters' => [
                'store_id' => $storeId,
            ]
        ]);
    }

    public function manageStock(Request $request): Response
    {
        $user = $request->user();

        $stocks = Stock::with([
            'store',
            'brand',
            'color',
            'memory',
            'license',
            'saleItems.sale.buyer',
            'saleItems.sale.affiliateUser'
        ])->get();
        $stores = Store::all();
        
        $parameters = DynamicParameter::with(['values' => function($q) {
            $q->where('is_active', true);
        }])->get();

        return Inertia::render('Stocks/ManageStock', [
            'stocks' => $stocks,
            'stores' => $stores,
            'parameters' => $parameters
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403);
        }

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'category' => 'required|in:iphone,android,accessories,extra',
            'type' => 'required|in:new,second',
            'name' => 'required|string',
            'brand_id' => 'nullable|exists:dynamic_parameter_values,id',
            'color_id' => 'nullable|exists:dynamic_parameter_values,id',
            'memory_id' => 'nullable|exists:dynamic_parameter_values,id',
            'license_id' => 'nullable|exists:dynamic_parameter_values,id',
            'grade' => 'nullable|string',
            'serial_number' => 'nullable|string|unique:stocks,serial_number',
            'imei_1' => 'nullable|string|unique:stocks,imei_1',
            'imei_2' => 'nullable|string|unique:stocks,imei_2',
            'supplier' => 'nullable|string',
            'warranty_duration_days' => 'required|integer|min:0',
            'buy_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'sell_price_reseller' => 'nullable|numeric|min:0',
            'qty' => 'required|integer|min:1',
        ]);

        $stock = Stock::create($validated);
        ActivityLog::log('add_stock', Stock::class, $stock->id, $stock->toArray());

        return redirect()->back()->with('success', 'Stok berhasil ditambahkan.');
    }

    public function storeBatch(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403);
        }

        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'category' => 'required|in:iphone,android',
            'type' => 'required|in:new,second',
            'name' => 'required|string',
            'brand_id' => 'nullable|exists:dynamic_parameter_values,id',
            'color_id' => 'nullable|exists:dynamic_parameter_values,id',
            'memory_id' => 'nullable|exists:dynamic_parameter_values,id',
            'license_id' => 'nullable|exists:dynamic_parameter_values,id',
            'grade' => 'nullable|string',
            'supplier' => 'nullable|string',
            'warranty_duration_days' => 'required|integer|min:0',
            'buy_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'sell_price_reseller' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.serial_number' => 'required|string|unique:stocks,serial_number',
            'items.*.imei_1' => 'required|string|unique:stocks,imei_1',
            'items.*.imei_2' => 'nullable|string|unique:stocks,imei_2',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->input('items') as $item) {
                $stock = Stock::create([
                    'store_id' => $request->input('store_id'),
                    'category' => $request->input('category'),
                    'type' => $request->input('type'),
                    'name' => $request->input('name'),
                    'brand_id' => $request->input('brand_id'),
                    'color_id' => $request->input('color_id'),
                    'memory_id' => $request->input('memory_id'),
                    'license_id' => $request->input('license_id'),
                    'grade' => $request->input('grade'),
                    'serial_number' => $item['serial_number'],
                    'imei_1' => $item['imei_1'],
                    'imei_2' => $item['imei_2'] ?? null,
                    'supplier' => $request->input('supplier'),
                    'warranty_duration_days' => $request->input('warranty_duration_days'),
                    'buy_price' => $request->input('buy_price'),
                    'sell_price' => $request->input('sell_price'),
                    'sell_price_reseller' => $request->input('sell_price_reseller'),
                    'qty' => 1,
                    'status' => 'available',
                ]);
                ActivityLog::log('add_stock', Stock::class, $stock->id, $stock->toArray());
            }
        });

        return redirect()->back()->with('success', 'Batch stok berhasil ditambahkan.');
    }

    public function transfer(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            return redirect()->back()->withErrors(['error' => 'Hanya Superadmin yang memiliki akses untuk melakukan mutasi unit.']);
        }

        $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'to_store_id' => 'required|exists:stores,id',
        ]);

        $stock = Stock::findOrFail($request->input('stock_id'));
        if ($stock->status !== 'available') {
            return redirect()->back()->withErrors(['error' => 'Barang tidak tersedia untuk mutasi.']);
        }

        DB::transaction(function () use ($request, $stock) {
            // Create transfer record as already approved
            $transfer = StockTransfer::create([
                'stock_id' => $stock->id,
                'from_store_id' => $stock->store_id,
                'to_store_id' => $request->input('to_store_id'),
                'requested_by' => $request->user()->id,
                'approved_by' => $request->user()->id,
                'status' => 'approved',
            ]);

            // Instantly move the stock to the destination store
            $stock->update([
                'store_id' => $request->input('to_store_id'),
                'status' => 'available',
            ]);

            ActivityLog::log('stock_transfer_initiated', Stock::class, $stock->id, [
                'from_store_id' => $transfer->from_store_id,
                'to_store_id' => $transfer->to_store_id,
                'transfer_id' => $transfer->id,
                'stock_name' => $stock->name,
                'serial_number' => $stock->serial_number
            ]);
        });

        return redirect()->back()->with('success', 'Unit berhasil dimutasi secara langsung.');
    }

    public function approveTransfer(Request $request, $id): RedirectResponse
    {
        $transfer = StockTransfer::findOrFail($id);
        $user = $request->user();

        // Must be the owner of the destination store or Superadmin to approve/receive
        if ($user->role !== 'superadmin' && $user->store_id !== $transfer->to_store_id) {
            abort(403);
        }

        DB::transaction(function () use ($transfer, $user) {
            $transfer->update([
                'approved_by' => $user->id,
                'status' => 'approved',
            ]);

            $transfer->stock->update([
                'store_id' => $transfer->to_store_id,
                'status' => 'available',
            ]);

            ActivityLog::log('stock_transfer_approved', Stock::class, $transfer->stock_id, [
                'from_store_id' => $transfer->from_store_id,
                'to_store_id' => $transfer->to_store_id,
                'transfer_id' => $transfer->id,
                'stock_name' => $transfer->stock->name,
                'serial_number' => $transfer->stock->serial_number
            ]);
        });

        return redirect()->back()->with('success', 'Mutasi stok berhasil disetujui.');
    }

    public function storeParameterValue(Request $request): RedirectResponse
    {
        $request->validate([
            'parameter_id' => 'required|exists:dynamic_parameters,id',
            'value' => 'required|string',
        ]);

        DynamicParameterValue::create([
            'parameter_id' => $request->input('parameter_id'),
            'value' => $request->input('value'),
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Opsi parameter berhasil ditambahkan.');
    }

    public function toggleParameterValue(Request $request, $id): RedirectResponse
    {
        $val = DynamicParameterValue::findOrFail($id);
        $val->update(['is_active' => !$val->is_active]);

        return redirect()->back()->with('success', 'Status parameter berhasil diperbarui.');
    }

    public function parameters(Request $request): Response
    {
        $user = $request->user();
        if ($user->role !== 'superadmin') {
            abort(403, 'Unauthorized action.');
        }

        $parameters = DynamicParameter::with(['values' => function($q) {
            $q->orderBy('value', 'asc');
        }])->get();

        return Inertia::render('Settings/Parameters', [
            'parameters' => $parameters,
        ]);
    }
}
