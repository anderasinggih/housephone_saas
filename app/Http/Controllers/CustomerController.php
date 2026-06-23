<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        $buyers = Buyer::with(['sales' => function($q) {
            $q->where('status', 'completed')->with('items');
        }])->get();

        $customers = $buyers->map(function ($buyer) {
            $totalSales = $buyer->sales->count();
            $totalSpent = $buyer->sales->sum('total_amount');
            
            $totalItems = 0;
            foreach ($buyer->sales as $sale) {
                $totalItems += $sale->items->sum('qty');
            }

            return [
                'id' => $buyer->id,
                'name' => $buyer->name,
                'phone' => $buyer->phone,
                'address' => $buyer->address,
                'total_purchases' => $totalSales,
                'total_spent' => (float)$totalSpent,
                'total_items_bought' => $totalItems,
                'created_at' => $buyer->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return Inertia::render('Customers', [
            'customers' => $customers
        ]);
    }
}
