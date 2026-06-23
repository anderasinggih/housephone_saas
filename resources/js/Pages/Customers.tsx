import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Users, 
    Search, 
    User, 
    Phone, 
    MapPin, 
    TrendingUp, 
    Award, 
    Calendar,
    ShoppingBag,
    DollarSign
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    phone: string;
    address: string | null;
    total_purchases: number;
    total_spent: number;
    total_items_bought: number;
    created_at: string;
}

interface CustomersProps {
    customers: Customer[];
}

export default function Customers({ customers }: CustomersProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Calculate aggregated metrics
    const totalCustomers = customers.length;
    const totalSalesVolume = customers.reduce((acc, curr) => acc + curr.total_spent, 0);
    const avgSpent = totalCustomers > 0 ? totalSalesVolume / totalCustomers : 0;
    const vipCustomer = customers.reduce((prev, curr) => (prev.total_spent > curr.total_spent) ? prev : curr, {} as Customer);

    return (
        <AuthenticatedLayout>
            <Head title="Direktori Pelanggan" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pelanggan</span>
                                <Users className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h3 className="text-3xl font-semibold text-foreground mt-2">{totalCustomers} Orang</h3>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Pelanggan terekam di sistem</p>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Akumulasi Belanja</span>
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(totalSalesVolume)}</h3>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Total seluruh omset terkumpul</p>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rata-rata Pembelian</span>
                                <ShoppingBag className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(avgSpent)}</h3>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Pembelian per pelanggan</p>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pelanggan Kontributor Tertinggi</span>
                                <Award className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mt-2 truncate">
                                {vipCustomer?.name || 'Belum Ada'}
                            </h3>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-bold">
                                {vipCustomer?.total_spent ? formatCurrency(vipCustomer.total_spent) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari pelanggan berdasarkan nama, HP, atau alamat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Customers Table / Grid */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Nama Pelanggan</th>
                                        <th className="pb-3 font-semibold">No. HP</th>
                                        <th className="pb-3 font-semibold">Alamat</th>
                                        <th className="pb-3 font-semibold text-center">Frekuensi Transaksi</th>
                                        <th className="pb-3 font-semibold text-center">Total Item Dibeli</th>
                                        <th className="pb-3 font-semibold">Total Kontribusi (IDR)</th>
                                        <th className="pb-3 font-semibold text-right">Tgl Terdaftar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-400">Pelanggan tidak ditemukan.</td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((cust) => {
                                            // Reseller indicator (more than 3 items bought or spent > 40 million)
                                            const isResellerCandidate = cust.total_items_bought >= 3 || cust.total_spent > 40000000;

                                            return (
                                                <tr key={cust.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                    <td className="py-4 flex items-center gap-2">
                                                        <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                                                            <User className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                                                                {cust.name}
                                                                {isResellerCandidate && (
                                                                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                                                                        Mitra Reseller
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                            {cust.phone}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="flex items-center gap-1 truncate max-w-[200px]" title={cust.address || ''}>
                                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                            {cust.address || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-center font-semibold text-foreground">
                                                        {cust.total_purchases} Kali
                                                    </td>
                                                    <td className="py-4 text-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {cust.total_items_bought} Unit
                                                    </td>
                                                    <td className="py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                                        {formatCurrency(cust.total_spent)}
                                                    </td>
                                                    <td className="py-4 text-right text-xs text-gray-400">
                                                        <span className="flex items-center justify-end gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(cust.created_at).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
