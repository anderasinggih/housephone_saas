import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    Smartphone, 
    Coins, 
    Wrench, 
    RotateCcw, 
    Store as StoreIcon, 
    User as UserIcon,
    Calendar,
    ArrowRight,
    Clock as ClockIcon,
    History,
    Users
} from 'lucide-react';

interface DashboardProps {
    stats: {
        totalRevenue: number;
        totalHpp: number;
        totalRepairs: number;
        totalReturnPenalty: number;
        netProfit: number;
        totalAffiliatorFee: number;
        soldItemsCount: number;
        pendingProfit: number;
    };
    allTimeStats: {
        revenue: number;
        actualProfit: number;
        affiliatorFee: number;
        netProfit: number;
        soldItems: number;
    };
    typeData: Array<{ type: string; total: number; revenue: number }>;
    affiliatorData: Array<{ affiliator: string; total_sales: number; total_fee: number }>;
    paymentData: Array<{ method: string; count: number; revenue: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    stores: Array<{ id: number; name: string; location: string }>;
    recentSales: Array<{
        id: number;
        invoice_number: string;
        total_amount: number;
        payment_method: string;
        status: string;
        created_at: string;
        buyer?: { name: string };
        user?: { name: string };
    }>;
    topProducts: Array<{
        name: string;
        total_sold: number;
    }>;
    activeStoreName: string;
    filters: {
        store_id: string | null;
        month: number;
        year: number;
    };
}

// Custom Premium Donut Chart Component using SVG (proportional and mathematically correct)
function DonutChart({ data, title, isCurrency = false }: { data: Array<{ label: string; value: number; color: string }>; title: string; isCurrency?: boolean }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 36;
    const circumference = 2 * Math.PI * radius; // ~226.19
    let accumulatedPercentage = 0;

    const formatVal = (val: number) => {
        if (isCurrency) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(val);
        }
        return `${val} Unit`;
    };

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col justify-between h-[300px] text-card-foreground">
            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
            </div>
            
            {total === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs font-semibold text-muted-foreground">Tidak ada data</div>
            ) : (
                <div className="flex flex-1 items-center gap-4 justify-center min-h-0">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {data.map((item, idx) => {
                                const percentage = (item.value / total) * 100;
                                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                                const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
                                accumulatedPercentage += percentage;

                                return (
                                    <circle
                                        key={idx}
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth="10"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
                                    />
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-foreground">
                                {isCurrency ? 'Total' : total}
                            </span>
                            <span className="text-[7px] uppercase tracking-wider text-muted-foreground font-bold">
                                {isCurrency ? 'Proporsi' : 'Total Unit'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-1">
                        {data.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1 text-left">
                                <div className="h-2 w-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: item.color }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-bold text-foreground truncate">{item.label}</p>
                                    <p className="text-[8px] text-muted-foreground font-bold leading-none mt-0.5">
                                        {formatVal(item.value)} • {((item.value / total) * 100).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Custom Premium Bar Chart Component (Vercel/SaaS style vertical bars)
function BarChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col justify-center h-[300px] text-center text-muted-foreground">
                Tidak ada data tren bulanan
            </div>
        );
    }

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const maxVal = Math.max(...data.map(d => d.revenue), 1);

    return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col justify-between h-[300px] text-card-foreground">
            <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tren Omset Bulanan</h4>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Penjualan Selesai</span>
                </div>
            </div>

            <div className="h-52 w-full flex items-end gap-3 px-2 pt-6 pb-2">
                {data.map((d, i) => {
                    const percent = Math.min((d.revenue / maxVal) * 100, 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 animate-in fade-in duration-200">
                                <span className="bg-popover text-popover-foreground text-[9px] font-bold px-2 py-1 rounded shadow-md border border-border whitespace-nowrap">
                                    {formatIDR(d.revenue)}
                                </span>
                                <div className="w-1.5 h-1.5 bg-popover border-r border-b border-border rotate-45 -mt-1" />
                            </div>

                            {/* Bar */}
                            <div 
                                style={{ height: `${percent || 4}%` }} 
                                className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary/95 shadow-[0_0_12px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_16px_rgba(var(--primary),0.25)]"
                            />
                            
                            {/* Label */}
                            <span className="text-[8px] font-bold text-muted-foreground uppercase mt-2 whitespace-nowrap truncate max-w-full">
                                {d.month}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// StatCard Component for financial KPIs (more compact spacing)
function StatCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: React.ReactNode }) {
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);

    return (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {title}
                    </p>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                        {formatted}
                    </h3>
                </div>
                <div className="rounded-lg p-2 bg-muted text-muted-foreground shrink-0">
                    {icon}
                </div>
            </div>
            <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">
                {description}
            </p>
        </div>
    );
}

export default function Dashboard({ 
    stats, 
    allTimeStats, 
    typeData, 
    affiliatorData, 
    paymentData,
    monthlyRevenue, 
    stores, 
    recentSales, 
    topProducts, 
    activeStoreName,
    filters,
}: DashboardProps) {
    const authUser = usePage().props.auth.user as any;
    const isKaryawan = authUser.role === 'karyawan';

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const applyFilters = (storeId: string | null, m: number, y: number) => {
        router.get(route('dashboard'), { 
            store_id: storeId,
            month: m,
            year: y
        }, { preserveState: true });
    };

    // Live Clock State
    const [currentTime, setCurrentTime] = useState('');
    useEffect(() => {
        const updateClock = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Color definitions for charts
    const chartColors = [
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#ec4899', // pink-500
        '#8b5cf6'  // violet-500
    ];

    // Format typeData for Donut Chart
    const formattedTypeData = typeData.map((t, idx) => ({
        label: t.type,
        value: t.total,
        color: chartColors[idx % chartColors.length]
    }));

    // Format paymentData for Donut Chart (New Chart!)
    const formattedPaymentData = paymentData.map((p, idx) => ({
        label: p.method,
        value: p.count,
        color: chartColors[(idx + 4) % chartColors.length]
    }));

    // Format affiliatorData for Donut Chart
    const formattedAffiliatorData = affiliatorData.map((a, idx) => ({
        label: a.affiliator,
        value: a.total_sales,
        color: chartColors[(idx + 2) % chartColors.length]
    }));

    const maxVal = Math.max(stats.totalRevenue, 1);
    const hppPercent = Math.min((stats.totalHpp / maxVal) * 100, 100);
    const repairPercent = Math.min((stats.totalRepairs / maxVal) * 100, 100);
    const netProfitPercent = Math.min((stats.netProfit / maxVal) * 100, 100);

    const getMonthName = (m: number) => {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[m - 1] || '';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Analisis Finansial" />

            <div className="py-4">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-4">
                    
                    {/* All Time Summary - Individual Card Grid without Outer Container */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ALL TIME SUMMARY</h3>
                            <span className="text-[10px] font-bold text-muted-foreground">Waktu: {currentTime || 'Loading...'}</span>
                        </div>
                        <div className={`grid grid-cols-2 gap-3 ${isKaryawan ? 'sm:grid-cols-2 max-w-2xl' : 'sm:grid-cols-5'}`}>
                            <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Revenue All Time</p>
                                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mt-1">{formatIDR(allTimeStats.revenue)}</h3>
                                <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">Total omset sepanjang masa</p>
                            </div>
                            {!isKaryawan && (
                                <>
                                    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Actual Profit All Time</p>
                                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">{formatIDR(allTimeStats.actualProfit)}</h3>
                                        <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">Laba kotor sepanjang masa</p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Affiliator Fee All Time</p>
                                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 mt-1">{formatIDR(allTimeStats.affiliatorFee)}</h3>
                                        <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">Total komisi afiliasi terbayar</p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Net Profit All Time</p>
                                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-primary mt-1">{formatIDR(allTimeStats.netProfit)}</h3>
                                        <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">Laba bersih sepanjang masa</p>
                                    </div>
                                </>
                            )}
                            <div className={`rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm ${isKaryawan ? '' : 'col-span-2 sm:col-span-1'}`}>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sold Items All Time</p>
                                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mt-1">{allTimeStats.soldItems} Unit</h3>
                                <p className="mt-2 text-[10px] font-bold text-muted-foreground leading-normal">Total item terjual sepanjang masa</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Period Selector */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-foreground">Analisis Jangka Waktu</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                            {/* Store filter (Superadmin only) */}
                            {stores.length > 0 && (
                                <select
                                    value={filters.store_id || ''}
                                    onChange={(e) => applyFilters(e.target.value || null, filters.month, filters.year)}
                                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="">Semua Cabang</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Month Filter */}
                            <select
                                value={filters.month}
                                onChange={(e) => applyFilters(filters.store_id, parseInt(e.target.value, 10), filters.year)}
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-sm focus:border-primary focus:outline-none"
                            >
                                <option value={1}>Januari</option>
                                <option value={2}>Februari</option>
                                <option value={3}>Maret</option>
                                <option value={4}>April</option>
                                <option value={5}>Mei</option>
                                <option value={6}>Juni</option>
                                <option value={7}>Juli</option>
                                <option value={8}>Agustus</option>
                                <option value={9}>September</option>
                                <option value={10}>Oktober</option>
                                <option value={11}>November</option>
                                <option value={12}>Desember</option>
                            </select>

                            {/* Year Filter */}
                            <select
                                value={filters.year}
                                onChange={(e) => applyFilters(filters.store_id, filters.month, parseInt(e.target.value, 10))}
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-sm focus:border-primary focus:outline-none"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((yr) => (
                                    <option key={yr} value={yr}>
                                        {yr}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Centered Active Period & Store Display (Unboxed and Slightly Large) */}
                    <div className="text-center py-2">
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight uppercase text-foreground">
                            {getMonthName(filters.month)} {filters.year} — {activeStoreName}
                        </h2>
                    </div>

                    {/* Stat Grid for the Selected Period */}
                    <div className={`grid grid-cols-1 gap-3 ${isKaryawan ? 'sm:grid-cols-2 max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-5'}`}>
                        <StatCard 
                            title={`Omset (${getMonthName(filters.month)} ${filters.year})`} 
                            value={stats.totalRevenue} 
                            description="Total pendapatan dari penjualan selesai + addon berbayar"
                            icon={<Coins className="h-5 w-5" />}
                        />
                        {isKaryawan ? (
                            <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-bold">Item Terjual ({getMonthName(filters.month)})</p>
                                    <h3 className="text-xl font-extrabold tracking-tight text-foreground mt-1">{stats.soldItemsCount} Unit</h3>
                                    <p className="mt-2 text-[10px] text-muted-foreground leading-normal">Total unit terinput pada periode ini</p>
                                </div>
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <StatCard 
                                    title={`HPP (${getMonthName(filters.month)})`} 
                                    value={stats.totalHpp} 
                                    description="Harga beli awal stok HP & aksesoris terjual + addon terserap"
                                    icon={<Smartphone className="h-5 w-5" />}
                                />
                                <StatCard 
                                    title="Klaim Garansi" 
                                    value={stats.totalRepairs} 
                                    description="Biaya perbaikan/klaim garansi yang disetujui"
                                    icon={<Wrench className="h-5 w-5" />}
                                />
                                <StatCard 
                                    title="Restocking Fees" 
                                    value={stats.totalReturnPenalty} 
                                    description="Total denda pemotongan pengembalian barang (10%)"
                                    icon={<RotateCcw className="h-5 w-5" />}
                                />
                                <StatCard 
                                    title="Laba Bersih" 
                                    value={stats.netProfit} 
                                    description="Laba = Omset - HPP - Klaim + Restocking Fees"
                                    icon={<TrendingUp className="h-5 w-5" />}
                                />
                            </>
                        )}
                    </div>

                    {/* Breakdown Visualizer */}
                    {!isKaryawan && (
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm text-card-foreground">
                            <h4 className="text-xs font-bold text-foreground">Aliran Finansial & HPP ({getMonthName(filters.month)} {filters.year})</h4>
                            <p className="text-[10px] font-bold text-muted-foreground mb-4 mt-0.5">Visualisasi proporsi HPP, Pengeluaran Garansi, dan Laba Bersih dari Total Omset.</p>
                            
                            <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted flex">
                                <div style={{ width: `${hppPercent}%` }} className="bg-amber-500 transition-all duration-500" title={`HPP: ${hppPercent.toFixed(1)}%`} />
                                <div style={{ width: `${repairPercent}%` }} className="bg-rose-500 transition-all duration-500" title={`Biaya Perbaikan: ${repairPercent.toFixed(1)}%`} />
                                <div style={{ width: `${netProfitPercent}%` }} className="bg-cyan-500 transition-all duration-500" title={`Laba Bersih: ${netProfitPercent.toFixed(1)}%`} />
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-amber-500" />
                                    <span className="text-[10px] font-bold text-muted-foreground">Total HPP ({formatIDR(stats.totalHpp)})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-rose-500" />
                                    <span className="text-[10px] font-bold text-muted-foreground">Biaya Garansi ({formatIDR(stats.totalRepairs)})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded bg-cyan-500" />
                                    <span className="text-[10px] font-bold text-muted-foreground">Laba Bersih ({formatIDR(stats.netProfit)})</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Donut Charts Row: Type, Payment, and Affiliator */}
                    <div className={`grid grid-cols-1 gap-4 ${isKaryawan ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
                        <DonutChart data={formattedTypeData} title="Model Terlaris" />
                        <DonutChart data={formattedPaymentData} title="Metode Pembayaran" />
                        {!isKaryawan && <DonutChart data={formattedAffiliatorData} title="Komisi Afiliasi" />}
                    </div>

                    {/* Proportional Trend Chart (Bar Chart instead of Line Chart) */}
                    <div className="w-full">
                        <BarChart data={monthlyRevenue} />
                    </div>

                    {/* Bottom Section: Recent transactions & Top Selling Products */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Recent Transactions */}
                        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Aktivitas Penjualan Terbaru</h4>
                                <Link 
                                    href={route('sales-history.index')} 
                                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                >
                                    Lihat Semua &rarr;
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[650px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border dark:border-input text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <th className="pb-2 font-semibold">No. Invoice</th>
                                            <th className="pb-2 font-semibold">Pelanggan</th>
                                            <th className="pb-2 font-semibold">Kasir</th>
                                            <th className="pb-2 font-semibold">Total Transaksi</th>
                                            <th className="pb-2 font-semibold">Metode</th>
                                            <th className="pb-2 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {recentSales.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-6 text-center text-gray-400">
                                                    Belum ada transaksi terekam.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                    <td className="py-2 font-semibold text-foreground">{sale.invoice_number}</td>
                                                    <td className="py-2">{sale.buyer?.name || 'Umum'}</td>
                                                    <td className="py-2 flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3 text-gray-400" />
                                                        {sale.user?.name || '-'}
                                                    </td>
                                                    <td className="py-2 font-bold text-primary">
                                                        {formatIDR(sale.total_amount)}
                                                    </td>
                                                    <td className="py-2">
                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                                                            {sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                                            sale.status === 'completed' 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {sale.status === 'completed' ? 'Sukses' : 'Void'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Selling Products */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm text-card-foreground flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-foreground mb-3 border-b border-border/40 pb-2 uppercase tracking-wider">Produk Terlaris</h4>
                                <div className="space-y-3">
                                    {topProducts.length === 0 ? (
                                        <p className="text-center text-xs text-gray-400 py-6">Belum ada produk terjual.</p>
                                    ) : (
                                        topProducts.map((prod, idx) => {
                                            const totalSold = parseInt(prod.total_sold as any, 10);
                                            const highestSold = parseInt(topProducts[0]?.total_sold as any || 1, 10);
                                            const fillPercent = Math.min((totalSold / highestSold) * 100, 100);

                                            return (
                                                <div key={idx} className="space-y-0.5">
                                                    <div className="flex justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                        <span className="truncate max-w-[180px]">{prod.name}</span>
                                                        <span className="text-primary font-bold">{prod.total_sold} Unit</span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                                        <div 
                                                            style={{ width: `${fillPercent}%` }} 
                                                            className="h-full rounded-full bg-primary" 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 rounded bg-muted p-3 text-[10px] text-muted-foreground leading-normal">
                                <p className="font-bold flex items-center gap-1 text-foreground mb-0.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary" /> Informasi Rentang
                                </p>
                                Menampilkan total unit akumulatif dari semua transaksi dalam jangka waktu yang dipilih.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
