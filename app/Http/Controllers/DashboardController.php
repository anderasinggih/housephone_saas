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

        // Custom time period (month & year)
        $month = (int)$request->input('month', now()->month);
        $year = (int)$request->input('year', now()->year);

        // Get periodic statistics (filtered by month, year, and store)
        $salesQuery = Sale::where('status', 'completed')
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year);

        $returnsQuery = ReturnLog::whereMonth('created_at', $month)
            ->whereYear('created_at', $year);

        $repairsQuery = WarrantyRepair::where('status', 'repaired')
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year);

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

        // Financial Math for the active period
        $totalRevenue = 0;
        $totalHpp = 0;

        foreach ($sales as $sale) {
            $totalRevenue += $sale->total_amount;
            foreach ($sale->items as $item) {
                $totalHpp += $item->buy_price_snap * $item->qty;
            }
            foreach ($sale->extras as $extra) {
                if ($extra->charge_to === 'seller') {
                    $totalHpp += $extra->buy_price;
                }
            }
        }

        $totalRepairs = $repairs->sum('repair_cost');
        $totalReturnPenalty = $returns->sum('restocking_fee');
        $netProfit = $totalRevenue - $totalHpp - $totalRepairs + $totalReturnPenalty;

        // Calculate Pending Profits (from booking sales) for current period
        $bookingSales = Sale::where('status', 'booking')
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->with(['items.stock', 'extras'])
            ->get();
            
        $pendingProfit = 0;
        foreach ($bookingSales as $sale) {
            $rev = $sale->total_amount;
            $hpp = 0;
            foreach ($sale->items as $item) {
                $hpp += ($item->stock->buy_price ?? 0) * $item->qty;
            }
            $pendingProfit += ($rev - $hpp);
        }

        // --- All Time (Global) Statistics ---
        $allTimeSales = Sale::where('status', 'completed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->with(['items.stock', 'extras'])
            ->get();
            
        $allTimeRevenue = $allTimeSales->sum('total_amount');
        $allTimeHpp = 0;
        foreach ($allTimeSales as $sale) {
            foreach ($sale->items as $item) {
                $allTimeHpp += $item->buy_price_snap * $item->qty;
            }
            foreach ($sale->extras as $extra) {
                if ($extra->charge_to === 'seller') {
                    $allTimeHpp += $extra->buy_price;
                }
            }
        }

        $allTimeRepairsQuery = WarrantyRepair::where('status', 'repaired');
        $allTimeReturnsQuery = ReturnLog::query();
        if ($storeId) {
            $allTimeRepairsQuery->whereHas('sale', fn($q) => $q->where('store_id', $storeId));
            $allTimeReturnsQuery->whereHas('sale', fn($q) => $q->where('store_id', $storeId));
        }

        $allTimeRepairs = $allTimeRepairsQuery->sum('repair_cost');
        $allTimeReturnPenalty = $allTimeReturnsQuery->sum('restocking_fee');
        $allTimeNetProfit = $allTimeRevenue - $allTimeHpp - $allTimeRepairs + $allTimeReturnPenalty;
        $allTimeSoldItems = $allTimeSales->flatMap(fn($s) => $s->items)->sum('qty');
        $allTimeAffiliatorFee = $allTimeSales->sum('affiliate_fee');

        // --- Type / Phone model distribution (filtered by active period) ---
        $typeData = Sale::where('status', 'completed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->with('items.stock')
            ->get()
            ->flatMap(function ($sale) {
                return $sale->items;
            })
            ->groupBy(function ($item) {
                return $item->stock->name ?? 'Unknown';
            })
            ->map(function ($group, $name) {
                return [
                    'type' => $name,
                    'total' => $group->sum('qty'),
                    'revenue' => (float)$group->sum(function ($item) {
                        return $item->actual_sell_price * $item->qty;
                    }),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->take(5);

        // --- Affiliator distribution (filtered by active period) ---
        $affiliatorData = Sale::where('status', 'completed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->whereNotNull('affiliate_user_id')
            ->with('affiliateUser')
            ->get()
            ->groupBy('affiliate_user_id')
            ->map(function ($group) {
                return [
                    'affiliator' => $group->first()->affiliateUser->name ?? 'Unknown',
                    'total_sales' => $group->count(),
                    'total_fee' => (float)$group->sum('affiliate_fee'),
                ];
            })
            ->sortByDesc('total_sales')
            ->values()
            ->take(5);

        // --- Monthly trends (last 8 months, scoped by store) ---
        $monthlyRevenue = Sale::where('status', 'completed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy(function ($sale) {
                return $sale->created_at->format('M Y');
            })
            ->map(function ($group) {
                return [
                    'month' => $group->first()->created_at->format('M Y'),
                    'revenue' => (float)$group->sum('total_amount'),
                ];
            })
            ->values();

        // --- Payment method distribution (filtered by active period and store) ---
        $paymentData = Sale::where('status', 'completed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->get()
            ->groupBy('payment_method')
            ->map(function ($group, $method) {
                return [
                    'method' => $method ?: 'Cash',
                    'count' => $group->count(),
                    'revenue' => (float)$group->sum('total_amount'),
                ];
            })
            ->values();

        // Fetch stores list for superadmin filter
        $stores = $user->role === 'superadmin' ? Store::all() : [];

        // Fetch recent sales (scoped by store, latest 5)
        $recentSales = Sale::with(['buyer', 'user'])
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Top Selling Products count (filtered by active period)
        $topProducts = DB::table('sale_items')
            ->join('stocks', 'sale_items.stock_id', '=', 'stocks.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select('stocks.name', DB::raw('SUM(sale_items.qty) as total_sold'))
            ->whereMonth('sales.created_at', $month)
            ->whereYear('sales.created_at', $year)
            ->when($storeId, fn($q) => $q->where('stocks.store_id', $storeId))
            ->groupBy('stocks.name', 'sale_items.stock_id')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get();

        $activeStoreName = 'Semua Cabang';
        if ($storeId) {
            $activeStore = Store::find($storeId);
            $activeStoreName = $activeStore ? $activeStore->name : 'Cabang';
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalRevenue' => (float)$totalRevenue,
                'totalHpp' => (float)$totalHpp,
                'totalRepairs' => (float)$totalRepairs,
                'totalReturnPenalty' => (float)$totalReturnPenalty,
                'netProfit' => (float)$netProfit,
                'totalAffiliatorFee' => (float)$sales->sum('affiliate_fee'),
                'soldItemsCount' => (int)$sales->flatMap(fn($s) => $s->items)->sum('qty'),
                'pendingProfit' => (float)$pendingProfit,
            ],
            'allTimeStats' => [
                'revenue' => (float)$allTimeRevenue,
                'actualProfit' => (float)($allTimeRevenue - $allTimeHpp),
                'affiliatorFee' => (float)$allTimeAffiliatorFee,
                'netProfit' => (float)$allTimeNetProfit,
                'soldItems' => (int)$allTimeSoldItems,
            ],
            'typeData' => $typeData,
            'affiliatorData' => $affiliatorData,
            'monthlyRevenue' => $monthlyRevenue,
            'paymentData' => $paymentData,
            'stores' => $stores,
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
            'activeStoreName' => $activeStoreName,
            'filters' => [
                'store_id' => $storeId,
                'month' => $month,
                'year' => $year,
            ]
        ]);
    }
}
