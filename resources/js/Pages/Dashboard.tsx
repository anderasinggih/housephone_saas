import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    TrendingUp, 
    ArrowUpRight, 
    Smartphone, 
    Coins, 
    Wrench, 
    RotateCcw, 
    Store as StoreIcon, 
    User as UserIcon,
    DollarSign,
    CheckCircle,
    XCircle,
    Calendar,
    ArrowRight
} from 'lucide-react';

interface StatItemProps {
    title: string;
    value: number;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    bgColorClass: string;
}

function StatCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: React.ReactNode }) {
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(value);

    return (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {title}
                    </p>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {formatted}
                    </h3>
                </div>
                <div className="rounded-lg p-2.5 bg-muted/40 text-muted-foreground">
                    {icon}
                </div>
            </div>
            <p className="mt-4 text-[11px] font-medium text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

interface DashboardProps {
    stats: {
        totalRevenue: number;
        totalHpp: number;
        totalRepairs: number;
        totalReturnPenalty: number;
        netProfit: number;
    };
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
    filters: {
        store_id: string | null;
    };
}

export default function Dashboard({ stats, stores, recentSales, topProducts, filters }: DashboardProps) {
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get(route('dashboard'), { store_id: e.target.value }, { preserveState: true });
    };

    // Calculate percentage breakdown for a beautiful visual bar
    const maxVal = Math.max(stats.totalRevenue, 1);
    const hppPercent = Math.min((stats.totalHpp / maxVal) * 100, 100);
    const repairPercent = Math.min((stats.totalRepairs / maxVal) * 100, 100);
    const netProfitPercent = Math.min((stats.netProfit / maxVal) * 100, 100);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Dashboard Analisis
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground">
                            Pantau pergerakan finansial, HPP, return, dan laba bersih real-time.
                        </p>
                    </div>

                    {stores.length > 0 && (
                        <div className="flex items-center gap-2">
                            <StoreIcon className="h-5 w-5 text-indigo-500" />
                            <select
                                value={filters.store_id || ''}
                                onChange={handleStoreChange}
                                className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">Semua Cabang (Pusat & Mitra)</option>
                                {stores.map((store) => (
                                    <option key={store.id} value={store.id}>
                                        {store.name} - {store.location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard Analisis Finansial" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Stat Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard 
                            title="Total Omset (Revenue)" 
                            value={stats.totalRevenue} 
                            description="Total pendapatan dari penjualan selesai + addon berbayar"
                            icon={<Coins className="h-6 w-6" />}
                        />
                        <StatCard 
                            title="Total HPP" 
                            value={stats.totalHpp} 
                            description="Harga beli awal stok HP & aksesoris terjual + addon terserap"
                            icon={<Smartphone className="h-6 w-6" />}
                        />
                        <StatCard 
                            title="Total Klaim Garansi" 
                            value={stats.totalRepairs} 
                            description="Biaya perbaikan/klaim garansi yang disetujui"
                            icon={<Wrench className="h-6 w-6" />}
                        />
                        <StatCard 
                            title="Restocking Fees" 
                            value={stats.totalReturnPenalty} 
                            description="Total denda pemotongan pengembalian barang (10%)"
                            icon={<RotateCcw className="h-6 w-6" />}
                        />
                        <StatCard 
                            title="Laba Bersih (Net Profit)" 
                            value={stats.netProfit} 
                            description="Laba = Omset - HPP - Klaim + Restocking Fees"
                            icon={<TrendingUp className="h-6 w-6" />}
                        />
                    </div>

                    {/* Breakdown Visualizer */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <h4 className="text-lg font-semibold text-foreground">Aliran Finansial & HPP</h4>
                        <p className="text-sm text-muted-foreground mb-6">Visualisasi proporsi HPP, Pengeluaran Garansi, dan Laba Bersih dari Total Omset.</p>
                        
                        <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex">
                            <div style={{ width: `${hppPercent}%` }} className="bg-amber-500 transition-all duration-500" title={`HPP: ${hppPercent.toFixed(1)}%`} />
                            <div style={{ width: `${repairPercent}%` }} className="bg-rose-500 transition-all duration-500" title={`Biaya Perbaikan: ${repairPercent.toFixed(1)}%`} />
                            <div style={{ width: `${netProfitPercent}%` }} className="bg-cyan-500 transition-all duration-500" title={`Laba Bersih: ${netProfitPercent.toFixed(1)}%`} />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-amber-500" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Total HPP ({formatIDR(stats.totalHpp)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-rose-500" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Biaya Garansi ({formatIDR(stats.totalRepairs)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-cyan-500" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Laba Bersih ({formatIDR(stats.netProfit)})</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Recent Transactions */}
                        <div className="col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-semibold text-foreground">Aktivitas Penjualan Terbaru</h4>
                                <Link 
                                    href={route('sales-history.index')} 
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                                >
                                    Lihat Semua <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <th className="pb-3 font-semibold">No. Invoice</th>
                                            <th className="pb-3 font-semibold">Pelanggan</th>
                                            <th className="pb-3 font-semibold">Kasir</th>
                                            <th className="pb-3 font-semibold">Total Transaksi</th>
                                            <th className="pb-3 font-semibold">Metode</th>
                                            <th className="pb-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {recentSales.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-gray-400">
                                                    Belum ada transaksi terekam.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                    <td className="py-3 font-semibold text-foreground">{sale.invoice_number}</td>
                                                    <td className="py-3">{sale.buyer?.name || 'Umum'}</td>
                                                    <td className="py-3 flex items-center gap-1">
                                                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                                                        {sale.user?.name || '-'}
                                                    </td>
                                                    <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatIDR(sale.total_amount)}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold dark:bg-gray-800">
                                                            {sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                            sale.status === 'completed' 
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                                        }`}>
                                                            {sale.status === 'completed' ? (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3" /> Sukses
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-3 w-3" /> Void
                                                                </>
                                                            )}
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
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-foreground mb-6">Produk Terlaris</h4>
                                <div className="space-y-4">
                                    {topProducts.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 py-8">Belum ada produk terjual.</p>
                                    ) : (
                                        topProducts.map((prod, idx) => {
                                            const totalSold = parseInt(prod.total_sold as any, 10);
                                            const highestSold = parseInt(topProducts[0]?.total_sold as any || 1, 10);
                                            const fillPercent = Math.min((totalSold / highestSold) * 100, 100);

                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        <span className="truncate max-w-[200px]">{prod.name}</span>
                                                        <span className="text-indigo-600 dark:text-indigo-400">{prod.total_sold} Unit</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                        <div 
                                                            style={{ width: `${fillPercent}%` }} 
                                                            className="h-full rounded-full bg-indigo-500" 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl bg-muted p-4 dark:bg-background text-xs text-muted-foreground">
                                <p className="font-bold flex items-center gap-1.5 text-gray-700 dark:text-gray-300 mb-1">
                                    <Calendar className="h-4 w-4 text-indigo-500" /> Rentang Waktu
                                </p>
                                Menampilkan total unit akumulatif dari semua transaksi tersimpan.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
