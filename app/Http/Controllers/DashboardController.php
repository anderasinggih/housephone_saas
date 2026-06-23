<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\ReturnLog;
use App\Models\WarrantyRepair;
use App\Models\Store;
use App\Models\Stock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Viewers and Employees are scoped to their store. Superadmin can filter.
        $storeId = $user->store_id;
        if ($user->role === 'superadmin' && $request->has('store_id')) {
            $storeId = $request->input('store_id');
        }

        // Get basic statistics
        $salesQuery = Sale::where('status', 'completed');
        $returnsQuery = ReturnLog::query();
        $repairsQuery = WarrantyRepair::where('status', 'repaired');

        if ($storeId) {
            $salesQuery->where('store_id', $storeId);
            $returnsQuery->whereHas('sale', function ($q) use ($storeId) {
                $q->where('store_id', $storeId);
            });
            $repairsQuery->whereHas('sale', function ($q) use ($storeId) {
                $q->where('store_id', $storeId);
            });
        }

        $sales = $salesQuery->with(['items.stock', 'extras'])->get();
        $returns = $returnsQuery->get();
        $repairs = $repairsQuery->get();

        // Financial Math
        $totalRevenue = 0;
        $totalHpp = 0;

        foreach ($sales as $sale) {
            // Actual Sell Price + Extras charged to Buyer
            $totalRevenue += $sale->total_amount;
            
            // HPP: Snapshot price of sold items
            foreach ($sale->items as $item) {
                $totalHpp += $item->buy_price_snap * $item->qty;
            }

            // HPP of extras if absorbed by seller
            foreach ($sale->extras as $extra) {
                if ($extra->charge_to === 'seller') {
                    $totalHpp += $extra->buy_price;
                }
            }
        }

        $totalRepairs = $repairs->sum('repair_cost');
        $totalReturnPenalty = $returns->sum('restocking_fee');
        $netProfit = $totalRevenue - $totalHpp - $totalRepairs + $totalReturnPenalty;

        // Fetch stores list for superadmin filter
        $stores = $user->role === 'superadmin' ? Store::all() : [];

        // Fetch recent sales
        $recentSales = Sale::with(['buyer', 'user'])
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Top Selling Products count
        $topProducts = DB::table('sale_items')
            ->join('stocks', 'sale_items.stock_id', '=', 'stocks.id')
            ->select('stocks.name', DB::raw('SUM(sale_items.qty) as total_sold'))
            ->when($storeId, fn($q) => $q->where('stocks.store_id', $storeId))
            ->groupBy('stocks.name', 'sale_items.stock_id')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalRevenue' => (float)$totalRevenue,
                'totalHpp' => (float)$totalHpp,
                'totalRepairs' => (float)$totalRepairs,
                'totalReturnPenalty' => (float)$totalReturnPenalty,
                'netProfit' => (float)$netProfit,
            ],
            'stores' => $stores,
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
            'filters' => [
                'store_id' => $storeId,
            ]
        ]);
    }
}
