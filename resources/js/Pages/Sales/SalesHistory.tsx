import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Receipt, 
    Search, 
    Ban, 
    RotateCcw, 
    ShieldAlert, 
    ArrowLeft,
    AlertTriangle,
    Coins,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from 'lucide-react';

interface StockItem {
    id: number;
    name: string;
    serial_number: string | null;
    imei_1: string | null;
    category?: string;
    brand?: { value: string };
}

interface SaleItem {
    id: number;
    sale_id: number;
    stock_id: number;
    qty: number;
    actual_sell_price: number;
    buy_price_snap: number;
    is_trade_in_item: boolean;
    stock: StockItem;
}

interface SaleExtra {
    id: number;
    sale_id: number;
    extra_id: number;
    charge_to: 'buyer' | 'seller' | 'free_promotion';
    sell_price: number;
    buy_price: number;
    extra: { name: string };
}

interface ReturnLog {
    id: number;
    sale_id: number;
    stock_id: number;
    restocking_fee: number;
    refund_amount: number;
    notes: string | null;
    created_at: string;
}

interface WarrantyRepair {
    id: number;
    sale_id: number;
    stock_id: number;
    damage_description: string;
    repair_cost: number;
    status: 'pending' | 'approved' | 'in_repair' | 'repaired' | 'rejected';
    notes: string | null;
    approved_by: number | null;
    created_at: string;
}

interface Sale {
    id: number;
    invoice_number: string;
    store_id: number;
    user_id: number;
    buyer_id: number;
    shift_id: number;
    payment_method: 'cash' | 'online';
    payment_detail: string | null;
    total_amount: number;
    dp_amount: number;
    status: 'booking' | 'completed' | 'cancelled';
    affiliate_user_id: number | null;
    affiliate_fee: number;
    void_requested: boolean;
    void_reason: string | null;
    created_at: string;
    buyer?: { name: string; phone: string; address: string | null };
    user?: { name: string };
    items: SaleItem[];
    extras: SaleExtra[];
    returns: ReturnLog[];
    repairs: WarrantyRepair[];
}

interface Store {
    id: number;
    name: string;
}

interface SalesHistoryProps {
    sales: Sale[];
    affiliates: any[];
    stores: Store[];
    filters: {
        store_id: string | null;
    };
}

const PAGE_SIZE = 50;

export default function SalesHistory({ sales, affiliates, stores, filters }: SalesHistoryProps) {
    const authUser = usePage().props.auth.user as any;

    const [searchQuery, setSearchQuery] = useState('');
    const [storeFilterId, setStoreFilterId] = useState(filters.store_id || '');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Form Modal states
    const [isVoidOpen, setIsVoidOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
    const [isRepairUpdateOpen, setIsRepairUpdateOpen] = useState(false);
    const [selectedRepair, setSelectedRepair] = useState<WarrantyRepair | null>(null);

    // Form handlers
    const voidForm = useForm({ void_reason: '' });
    const returnForm = useForm({
        sale_id: '',
        stock_id: '',
        restocking_fee: 0,
        notes: ''
    });
    const warrantyForm = useForm({
        sale_id: '',
        stock_id: '',
        damage_description: ''
    });
    const repairForm = useForm({
        status: 'pending' as any,
        repair_cost: 0,
        notes: ''
    });

    const filteredSales = sales.filter(s => {
        const q = searchQuery.toLowerCase();
        return (
            s.invoice_number.toLowerCase().includes(q) ||
            (s.buyer?.name && s.buyer.name.toLowerCase().includes(q)) ||
            (s.buyer?.phone && s.buyer.phone.includes(searchQuery))
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
    const paginatedSales = filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

    const handleSelectSale = (sale: Sale) => {
        setSelectedSale(sale);
        setMobileDetailOpen(true);
    };

    const submitVoid = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale) return;
        voidForm.post(route('sales.void', selectedSale.id), {
            onSuccess: () => {
                setIsVoidOpen(false);
                voidForm.reset();
                setSelectedSale(null);
                setMobileDetailOpen(false);
            }
        });
    };

    const openReturnModal = (sale: Sale) => {
        setSelectedSale(sale);
        const returnable = sale.items.filter(
            item => !sale.returns.some(r => r.stock_id === item.stock_id)
        );
        returnForm.setData({
            sale_id: sale.id.toString(),
            stock_id: returnable[0]?.stock_id.toString() || '',
            restocking_fee: (returnable[0]?.actual_sell_price || 0) * 0.1,
            notes: ''
        });
        setIsReturnOpen(true);
    };

    const submitReturn = (e: React.FormEvent) => {
        e.preventDefault();
        returnForm.post(route('sales.return'), {
            onSuccess: () => {
                setIsReturnOpen(false);
                setSelectedSale(null);
                setMobileDetailOpen(false);
            }
        });
    };

    const openWarrantyModal = (sale: Sale) => {
        setSelectedSale(sale);
        warrantyForm.setData({
            sale_id: sale.id.toString(),
            stock_id: sale.items[0]?.stock_id.toString() || '',
            damage_description: ''
        });
        setIsWarrantyOpen(true);
    };

    const submitWarranty = (e: React.FormEvent) => {
        e.preventDefault();
        warrantyForm.post(route('sales.warranty'), {
            onSuccess: () => {
                setIsWarrantyOpen(false);
                setSelectedSale(null);
            }
        });
    };

    const openRepairUpdateModal = (repair: WarrantyRepair) => {
        setSelectedRepair(repair);
        repairForm.setData({
            status: repair.status,
            repair_cost: repair.repair_cost,
            notes: repair.notes || ''
        });
        setIsRepairUpdateOpen(true);
    };

    const submitRepairUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRepair) return;
        repairForm.post(route('sales.warranty.update', selectedRepair.id), {
            onSuccess: () => {
                setIsRepairUpdateOpen(false);
                setSelectedSale(null);
            }
        });
    };

    const renderStatusBadge = (sale: Sale) => {
        if (sale.status === 'cancelled') {
            return (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    Batal (Void)
                </span>
            );
        }
        if (sale.status === 'booking') {
            return (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Booking
                </span>
            );
        }

        const returnedItemsCount = sale.items.filter(item => 
            sale.returns.some(r => r.stock_id === item.stock_id)
        ).length;

        const hasRepair = sale.repairs.length > 0;

        if (returnedItemsCount > 0) {
            if (returnedItemsCount === sale.items.length) {
                return (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-gray-500/10 text-gray-500 border border-gray-500/20">
                        Retur Total
                    </span>
                );
            } else {
                return (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Retur Sebagian
                    </span>
                );
            }
        }

        if (hasRepair) {
            const activeRepairs = sale.repairs.filter(r => ['pending', 'approved', 'in_repair'].includes(r.status));
            if (activeRepairs.length > 0) {
                return (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">
                        Servis Garansi ({activeRepairs.length})
                    </span>
                );
            } else {
                return (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Garansi Selesai
                    </span>
                );
            }
        }

        return (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Selesai
            </span>
        );
    };

    // ── Detail Panel (shared between mobile and desktop) ──
    const DetailPanel = ({ sale }: { sale: Sale }) => {
        const returnableItems = sale.items.filter(
            item => !sale.returns.some(r => r.stock_id === item.stock_id)
        );
        const isAllReturned = sale.items.length > 0 && returnableItems.length === 0;

        return (
            <div className="space-y-5 text-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-black text-foreground text-base leading-tight">{sale.invoice_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(sale.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {renderStatusBadge(sale)}
                        <a
                            href={route('public.invoice', sale.invoice_number)}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            title="Lihat Invoice"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </div>

                {/* Buyer + Kasir */}
                <div className="bg-muted/50 dark:bg-background rounded-xl p-3 space-y-1.5 border border-border/50">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold">Pelanggan</span>
                        <span className="text-foreground font-semibold">{sale.buyer?.name || 'Umum'}</span>
                    </div>
                    {sale.buyer?.phone && (
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold">No. HP</span>
                            <span className="text-indigo-600 font-bold">{sale.buyer.phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold">Kasir</span>
                        <span className="text-foreground font-semibold">{sale.user?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold">Pembayaran</span>
                        <span className="font-bold uppercase text-foreground">{sale.payment_method} {sale.payment_detail ? `(${sale.payment_detail})` : ''}</span>
                    </div>
                    {sale.dp_amount > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold">DP</span>
                            <span className="font-bold text-amber-600">{formatCurrency(sale.dp_amount)}</span>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-2 border-t border-border/50 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Item Terjual</p>
                    {sale.items.map(item => {
                        const isReturned = sale.returns.some(r => r.stock_id === item.stock_id);
                        return (
                            <div key={item.id} className="flex justify-between bg-muted dark:bg-background p-2.5 rounded-lg gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-xs leading-snug truncate">
                                        {item.stock?.name}
                                        {item.is_trade_in_item && <span className="ml-1 text-rose-500 text-[10px] font-black uppercase">(TT)</span>}
                                        {isReturned && <span className="ml-1.5 text-rose-600 text-[9px] font-black uppercase bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">Retur</span>}
                                    </p>
                                    {item.stock?.category !== 'extra' && item.stock?.serial_number && (
                                        <p className="text-[10px] text-gray-400 font-mono">SN: {item.stock?.serial_number}</p>
                                    )}
                                </div>
                                <div className="text-right text-xs flex-shrink-0">
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.actual_sell_price)}</p>
                                    {item.qty > 1 && <p className="text-gray-400">x{item.qty}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Extras */}
                {sale.extras.length > 0 && (
                    <div className="space-y-2 border-t border-border/50 pt-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Add-On / Jasa</p>
                        {sale.extras.map(ex => (
                            <div key={ex.id} className="flex justify-between text-xs font-bold bg-muted dark:bg-background p-2.5 rounded-lg">
                                <div>
                                    <p className="text-gray-800 dark:text-gray-200">{ex.extra?.name}</p>
                                    <p className="text-[10px] text-gray-400 font-normal">{ex.charge_to === 'buyer' ? 'Dibayar Pembeli' : ex.charge_to === 'seller' ? 'Toko Tanggung' : 'Gratis Promo'}</p>
                                </div>
                                <p className="text-indigo-600 dark:text-indigo-400">{ex.charge_to === 'buyer' ? formatCurrency(ex.sell_price) : '—'}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Total */}
                <div className="border-t border-border pt-2 flex justify-between items-center">
                    <span className="font-black text-slate-700 dark:text-slate-200">Total Bayar</span>
                    <span className="font-black text-indigo-600 text-lg">{formatCurrency(sale.total_amount)}</span>
                </div>

                {/* Returns */}
                {sale.returns.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-rose-100 dark:border-rose-950">
                        <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Catatan Retur</p>
                        {sale.returns.map(ret => (
                            <div key={ret.id} className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 p-2.5 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between font-bold">
                                    <span>Restocking Fee:</span>
                                    <span className="text-rose-600">{formatCurrency(ret.restocking_fee)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Refund:</span>
                                    <span className="text-indigo-600">{formatCurrency(ret.refund_amount)}</span>
                                </div>
                                {ret.notes && <p className="text-[10px] text-gray-400 italic">"{ret.notes}"</p>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-border">
                    {/* Return + Warranty */}
                    {sale.status === 'completed' && authUser.role !== 'viewer' && (
                        <div className="flex gap-2">
                            {!isAllReturned && (
                                <button
                                    onClick={() => openReturnModal(sale)}
                                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                                >
                                    <RotateCcw className="h-4 w-4" /> Retur
                                </button>
                            )}
                            <button
                                onClick={() => openWarrantyModal(sale)}
                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition"
                            >
                                <ShieldAlert className="h-4 w-4" /> Garansi
                            </button>
                        </div>
                    )}
                </div>

            {/* Warranty Repairs */}
            {sale.repairs.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status Servis Garansi</p>
                    {sale.repairs.map(rep => (
                        <div key={rep.id} className="border border-border dark:border-input p-3 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="truncate pr-2">{rep.damage_description}</span>
                                <span className="capitalize text-rose-500 flex-shrink-0">{rep.status}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>Biaya Servis:</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(rep.repair_cost)}</span>
                            </div>
                            <button
                                onClick={() => openRepairUpdateModal(rep)}
                                className="w-full rounded bg-gray-100 py-1 text-[10px] font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                            >
                                Update Status Servis
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

    // ── Pagination component ──
    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between px-2 pt-4 border-t border-border">
                <p className="text-xs text-gray-400 font-semibold">
                    {filteredSales.length} transaksi • Hal {currentPage}/{totalPages}
                </p>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Sales History" />

            <div className="py-6 sm:py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── MOBILE: Full-Screen Detail ── */}
                    {mobileDetailOpen && selectedSale && (
                        <div className="lg:hidden fixed inset-0 z-40 bg-card overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setMobileDetailOpen(false); }}
                                        className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Kembali
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-600">/</span>
                                    <span className="text-sm font-bold text-foreground truncate">History Transaksi</span>
                                    <span className="text-gray-300 dark:text-gray-600">/</span>
                                    <span className="text-sm font-bold text-gray-500 truncate">{selectedSale.invoice_number}</span>
                                </div>
                                <DetailPanel sale={selectedSale} />
                            </div>
                        </div>
                    )}

                    {/* ── Search & Filter ── */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari invoice, nama, atau nomor HP..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        {authUser.role === 'superadmin' && (
                            <div className="w-full sm:w-48">
                                <select
                                    value={storeFilterId}
                                    onChange={(e) => {
                                        setStoreFilterId(e.target.value);
                                        window.location.href = route('sales-history.index', { store_id: e.target.value });
                                    }}
                                    className="w-full rounded-xl border border-input bg-background py-2 px-3 text-sm font-semibold text-foreground focus:outline-none"
                                >
                                    <option value="">Semua Cabang</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* ── Main Layout ── */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">

                        {/* LEFT: Sales List */}
                        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm text-card-foreground space-y-3">
                            <h3 className="text-base font-bold text-foreground">
                                Daftar Transaksi
                                <span className="ml-2 text-xs font-semibold text-gray-400">({filteredSales.length})</span>
                            </h3>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedSales.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">Tidak ada transaksi ditemukan.</p>
                                ) : (
                                    paginatedSales.map((sale) => (
                                        <div
                                            key={sale.id}
                                            onClick={() => handleSelectSale(sale)}
                                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 px-2.5 my-1 cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-900/50 rounded-xl transition ${
                                                selectedSale?.id === sale.id ? 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-100 dark:ring-indigo-900/40' : ''
                                            }`}
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-sm text-foreground">{sale.invoice_number}</span>
                                                    {renderStatusBadge(sale)}
                                                </div>
                                                <p className="text-xs text-gray-400 font-semibold">
                                                    {sale.buyer?.name || 'Umum'} • {new Date(sale.created_at).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="mt-1.5 sm:mt-0 text-right">
                                                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.total_amount)}</p>
                                                <p className="text-[10px] font-bold uppercase text-gray-400">{sale.payment_method}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Pagination />
                        </div>

                        {/* RIGHT: Sticky Detail Panel (desktop only) */}
                        <div className="hidden lg:block lg:sticky lg:top-4">
                            <div className="rounded-lg border border-border bg-card p-5 shadow-sm text-card-foreground max-h-[calc(100vh-6rem)] overflow-y-auto">
                                <h3 className="text-base font-bold text-foreground mb-4">Detail Invoice</h3>
                                {selectedSale ? (
                                    <DetailPanel sale={selectedSale} />
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-12">Pilih transaksi untuk melihat detail.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ── RETURN MODAL ── */}
            {isReturnOpen && selectedSale && (() => {
                const returnableItems = selectedSale.items.filter(
                    item => !selectedSale.returns.some(r => r.stock_id === item.stock_id)
                );
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl dark:bg-background border dark:border-input">
                            <h4 className="text-lg font-bold text-foreground">Retur Barang</h4>
                            <p className="text-xs text-gray-500 mt-1 mb-4">Pengembalian unit dari Invoice {selectedSale.invoice_number}.</p>
                            <form onSubmit={submitReturn} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Item Yang Diretur</label>
                                    <select
                                        required
                                        value={returnForm.data.stock_id}
                                        onChange={(e) => {
                                            const stockId = e.target.value;
                                            const matchedItem = returnableItems.find(i => i.stock_id.toString() === stockId);
                                            const price = matchedItem ? matchedItem.actual_sell_price : 0;
                                            returnForm.setData(prev => ({ ...prev, stock_id: stockId, restocking_fee: price * 0.1 }));
                                        }}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                    >
                                        {returnableItems.map(item => (
                                            <option key={item.stock_id} value={item.stock_id}>
                                                {item.stock?.name} - {formatCurrency(item.actual_sell_price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Restocking Fee (default 10%)</label>
                                    <input
                                        type="number" required
                                        value={returnForm.data.restocking_fee === 0 ? '' : returnForm.data.restocking_fee}
                                        onChange={(e) => returnForm.setData('restocking_fee', parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Catatan Alasan</label>
                                    <input
                                        type="text"
                                        value={returnForm.data.notes}
                                        onChange={(e) => returnForm.setData('notes', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                        placeholder="Contoh: Kamera buram, tukar tipe lain"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2 border-t border-border">
                                    <button type="button" onClick={() => setIsReturnOpen(false)} className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted">Batal</button>
                                    <button type="submit" disabled={returnForm.processing} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">Proses Retur</button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* ── WARRANTY MODAL ── */}
            {isWarrantyOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-bold text-foreground">Klaim Garansi Servis</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Invoice {selectedSale.invoice_number}.</p>
                        <form onSubmit={submitWarranty} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Item Rusak</label>
                                <select
                                    required value={warrantyForm.data.stock_id}
                                    onChange={(e) => warrantyForm.setData('stock_id', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                >
                                    {selectedSale.items.map(item => (
                                        <option key={item.stock_id} value={item.stock_id}>
                                            {item.stock?.name} - SN: {item.stock?.serial_number || '-'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Deskripsi Kerusakan</label>
                                <textarea
                                    required rows={3}
                                    value={warrantyForm.data.damage_description}
                                    onChange={(e) => warrantyForm.setData('damage_description', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                    placeholder="Contoh: Layar green screen setelah update iOS"
                                />
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-border">
                                <button type="button" onClick={() => setIsWarrantyOpen(false)} className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted">Batal</button>
                                <button type="submit" disabled={warrantyForm.processing} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition">Ajukan Garansi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── REPAIR UPDATE MODAL ── */}
            {isRepairUpdateOpen && selectedRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-bold text-foreground">Update Status Servis</h4>
                        <form onSubmit={submitRepairUpdate} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Status</label>
                                <select value={repairForm.data.status} onChange={(e) => repairForm.setData('status', e.target.value as any)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="in_repair">In Repair</option>
                                    <option value="repaired">Selesai</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Biaya Servis</label>
                                <input type="number" value={repairForm.data.repair_cost} onChange={(e) => repairForm.setData('repair_cost', parseFloat(e.target.value) || 0)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Catatan</label>
                                <input type="text" value={repairForm.data.notes} onChange={(e) => repairForm.setData('notes', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background" placeholder="Keterangan tambahan" />
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-border">
                                <button type="button" onClick={() => setIsRepairUpdateOpen(false)} className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted">Batal</button>
                                <button type="submit" disabled={repairForm.processing} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
