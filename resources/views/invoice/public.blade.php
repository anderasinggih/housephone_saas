<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $sale->invoice_number }} - Housephone</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#4f46e5', // indigo-600
                        secondary: '#06b6d4', // cyan-500
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen py-6 sm:py-12 px-4">
    <div class="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white p-8 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-24 -translate-y-24"></div>
            <div class="absolute left-0 bottom-0 w-36 h-36 bg-indigo-500/10 rounded-full transform -translate-x-12 translate-y-12"></div>
            
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
                <div>
                    <h1 class="text-3xl font-extrabold tracking-tight">HOUSEPHONE</h1>
                    <p class="text-indigo-200 text-xs font-semibold uppercase tracking-widest mt-1">Premium Devices & Accessories</p>
                </div>
                <div class="text-left sm:text-right">
                    <span class="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-500/30 uppercase">
                        {{ $sale->status }}
                    </span>
                    <p class="text-sm font-bold mt-2 text-indigo-100">{{ $sale->invoice_number }}</p>
                </div>
            </div>
        </div>

        <div class="p-6 sm:p-8 space-y-8">
            
            <!-- Store and Buyer Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-100 pb-8 text-sm">
                <div class="space-y-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Cabang Penjualan</h3>
                    <p class="font-bold text-slate-700 text-base">{{ $sale->store->name ?? 'Housephone Store' }}</p>
                    @if($sale->store && $sale->store->location)
                        <p class="text-slate-500 leading-relaxed">{{ $sale->store->location }}</p>
                    @endif
                    <p class="text-slate-500 text-xs mt-1">Dilayani oleh: <strong class="text-slate-600 font-semibold">{{ $sale->user->name ?? 'Kasir' }}</strong></p>
                </div>
                <div class="space-y-2 text-left sm:text-right">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Pelanggan</h3>
                    <p class="font-bold text-slate-700 text-base">{{ $sale->buyer->name ?? 'Umum' }}</p>
                    @if($sale->buyer && $sale->buyer->phone)
                        <p class="text-indigo-600 font-bold select-all">{{ $sale->buyer->phone }}</p>
                    @endif
                    @if($sale->buyer && $sale->buyer->address)
                        <p class="text-slate-500 leading-relaxed">{{ $sale->buyer->address }}</p>
                    @endif
                    <p class="text-slate-400 text-xs mt-1">Tanggal: <strong class="text-slate-600 font-semibold">{{ $sale->created_at->format('d M Y, H:i') }}</strong></p>
                </div>
            </div>

            <!-- Items Table -->
            <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Item Pembelian</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <th class="pb-3 pr-2">Deskripsi Unit</th>
                                <th class="pb-3 px-2 text-center">Qty</th>
                                <th class="pb-3 px-2 text-right">Harga Satuan</th>
                                <th class="pb-3 pl-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-slate-700 text-sm">
                            @foreach($sale->items as $item)
                                @if(!$item->is_trade_in_item)
                                    <tr>
                                        <td class="py-4 pr-2">
                                            <p class="font-bold text-slate-800 text-base leading-snug">{{ $item->stock->name ?? 'Unit HP' }}</p>
                                            <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                                                @if($item->stock && $item->stock->serial_number)
                                                    <span>SN: <strong class="text-slate-700 font-semibold select-all">{{ $item->stock->serial_number }}</strong></span>
                                                @endif
                                                @if($item->stock && $item->stock->imei_1)
                                                    <span>IMEI: <strong class="text-slate-700 font-semibold select-all">{{ $item->stock->imei_1 }}</strong></span>
                                                @endif
                                                @if($item->stock && $item->stock->warranty_duration_days)
                                                    <span class="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide text-[9px] border border-indigo-100">
                                                        Garansi {{ $item->stock->warranty_duration_days }} Hari
                                                    </span>
                                                @endif
                                            </div>
                                        </td>
                                        <td class="py-4 px-2 text-center font-bold text-slate-800">{{ $item->qty }}</td>
                                        <td class="py-4 px-2 text-right font-semibold">Rp {{ number_format($item->actual_sell_price, 0, ',', '.') }}</td>
                                        <td class="py-4 pl-2 text-right font-bold text-slate-900">Rp {{ number_format($item->actual_sell_price * $item->qty, 0, ',', '.') }}</td>
                                    </tr>
                                @endif
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Extras Table (Optional) -->
            @php
                $hasExtras = $sale->extras->count() > 0;
            @endphp
            @if($hasExtras)
                <div class="border-t border-slate-100 pt-6">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Aksesoris & Layanan Add-on</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <th class="pb-2 pr-2">Deskripsi Layanan / Item</th>
                                    <th class="pb-2 px-2 text-center">Beban Biaya</th>
                                    <th class="pb-2 pl-2 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-700 text-sm">
                                @foreach($sale->extras as $extra)
                                    <tr>
                                        <td class="py-3 pr-2 font-semibold text-slate-800">
                                            {{ $extra->extra->name ?? 'Layanan Tambahan' }}
                                        </td>
                                        <td class="py-3 px-2 text-center">
                                            @if($extra->charge_to === 'buyer')
                                                <span class="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100 uppercase">Buyer</span>
                                            @elseif($extra->charge_to === 'seller')
                                                <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 uppercase">Toko (HPP)</span>
                                            @else
                                                <span class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100 uppercase">Promo</span>
                                            @endif
                                        </td>
                                        <td class="py-3 pl-2 text-right font-bold text-slate-950">
                                            @if($extra->charge_to === 'buyer')
                                                Rp {{ number_format($extra->sell_price, 0, ',', '.') }}
                                            @else
                                                Rp 0
                                            @endif
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            @endif

            <!-- Trade-In Section (Optional) -->
            @php
                $tradeInItem = $sale->items->firstWhere('is_trade_in_item', true);
            @endphp
            @if($tradeInItem)
                <div class="border-t border-slate-100 pt-6">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tukar Tambah (Trade-In)</h3>
                    <div class="flex justify-between items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div>
                            <p class="font-bold text-slate-800 text-base">{{ $tradeInItem->stock->name ?? 'HP Tukar Tambah' }}</p>
                            @if($tradeInItem->stock && $tradeInItem->stock->serial_number)
                                <p class="text-xs text-slate-500 mt-1">SN: <span class="font-semibold select-all">{{ $tradeInItem->stock->serial_number }}</span></p>
                            @endif
                        </div>
                        <div class="text-right">
                            <span class="text-rose-600 font-extrabold text-base">- Rp {{ number_format(abs($tradeInItem->actual_sell_price), 0, ',', '.') }}</span>
                            <p class="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Dipotong dari Omset</p>
                        </div>
                    </div>
                </div>
            @endif

            <!-- Grand Totals & Payment Method -->
            <div class="border-t border-slate-100 pt-8">
                <div class="flex flex-col md:flex-row md:justify-between gap-6 items-start">
                    
                    <!-- Left block: Payment detail -->
                    <div class="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50 text-xs w-full md:max-w-xs space-y-2">
                        <p class="font-bold text-slate-400 uppercase tracking-wide">Metode Pembayaran</p>
                        <p class="text-sm font-extrabold text-indigo-600 uppercase tracking-wide">{{ $sale->payment_method }}</p>
                        @if($sale->payment_detail)
                            <p class="text-slate-500 leading-relaxed font-semibold">Info: {{ $sale->payment_detail }}</p>
                        @endif
                        
                        <div class="pt-2 mt-2 border-t border-slate-200">
                            @if($sale->status === 'booking')
                                <p class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    DP Uang Muka: <strong class="font-extrabold text-xs">Rp {{ number_format($sale->dp_amount, 0, ',', '.') }}</strong>
                                </p>
                            @else
                                <p class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                    Lunas Dibayar Penuh
                                </p>
                            @endif
                        </div>
                    </div>

                    <!-- Right block: Math calculation -->
                    <div class="w-full md:max-w-xs space-y-3 text-sm font-semibold text-slate-500">
                        @php
                            $subtotalUnits = $sale->items->filter(fn($i) => !$i->is_trade_in_item)->sum(fn($i) => $i->actual_sell_price * $i->qty);
                            $subtotalExtras = $sale->extras->filter(fn($e) => $e->charge_to === 'buyer')->sum('sell_price');
                        @endphp
                        
                        <div class="flex justify-between">
                            <span>Subtotal Unit HP</span>
                            <span class="text-slate-700 font-bold">Rp {{ number_format($subtotalUnits, 0, ',', '.') }}</span>
                        </div>
                        
                        @if($subtotalExtras > 0)
                            <div class="flex justify-between">
                                <span>Layanan & Aksesoris</span>
                                <span class="text-slate-700 font-bold">Rp {{ number_format($subtotalExtras, 0, ',', '.') }}</span>
                            </div>
                        @endif

                        @if($tradeInItem)
                            <div class="flex justify-between text-rose-600">
                                <span>Potongan Tukar Tambah</span>
                                <span class="font-bold">- Rp {{ number_format(abs($tradeInItem->actual_sell_price), 0, ',', '.') }}</span>
                            </div>
                        @endif

                        <div class="flex justify-between items-center text-slate-800 pt-4 border-t border-slate-200">
                            <span class="text-base font-extrabold">Total Bayar</span>
                            <span class="text-2xl font-extrabold text-indigo-600">Rp {{ number_format($sale->total_amount, 0, ',', '.') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer terms -->
            <div class="border-t border-slate-100 pt-8 text-center text-xs text-slate-400 leading-relaxed font-semibold">
                <p>Terima kasih telah berbelanja di Housephone.</p>
                <p class="mt-1">Harap simpan invoice digital ini sebagai bukti garansi resmi produk Anda.</p>
                <p class="mt-4 font-bold text-slate-300">© {{ date('Y') }} Housephone. All rights reserved.</p>
            </div>
            
        </div>
    </div>
</body>
</html>
