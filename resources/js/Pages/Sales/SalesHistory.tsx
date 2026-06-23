import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Receipt, 
    Search, 
    FileText, 
    Printer, 
    Ban, 
    RotateCcw, 
    ShieldAlert, 
    User, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Coins,
    Smartphone,
    Info,
    Check
} from 'lucide-react';

interface StockItem {
    id: number;
    name: string;
    serial_number: string | null;
    imei_1: string | null;
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

interface Affiliate {
    id: number;
    name: string;
}

interface Store {
    id: number;
    name: string;
}

interface SalesHistoryProps {
    sales: Sale[];
    affiliates: Affiliate[];
    stores: Store[];
    filters: {
        store_id: string | null;
    };
}

export default function SalesHistory({ sales, affiliates, stores, filters }: SalesHistoryProps) {
    const authUser = usePage().props.auth.user as any;

    const [searchQuery, setSearchQuery] = useState('');
    const [storeFilterId, setStoreFilterId] = useState(filters.store_id || '');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Form Modals states
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
        const matchesSearch = 
            s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.buyer?.name && s.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.buyer?.phone && s.buyer.phone.includes(searchQuery));
        return matchesSearch;
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Print Receipt logic (thermal format)
    const printReceipt = (sale: Sale) => {
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (!printWindow) return;

        const itemsHtml = sale.items.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <div style="font-size:11px;">
                    ${item.stock?.name} ${item.is_trade_in_item ? '<b>(TT)</b>' : ''}<br/>
                    <small>${item.stock?.serial_number || ''}</small>
                </div>
                <div style="font-size:11px; text-align:right;">
                    ${item.qty} x ${formatCurrency(item.actual_sell_price)}
                </div>
            </div>
        `).join('');

        const extrasHtml = sale.extras.map(ex => `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
                <div>+ ${ex.extra?.name} (${ex.charge_to})</div>
                <div>${ex.charge_to === 'buyer' ? formatCurrency(ex.sell_price) : 'Rp0'}</div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 300px; padding: 10px; margin: 0; color: #000; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                    .header { font-size: 14px; margin-bottom: 2px; }
                    .footer { font-size: 10px; margin-top: 15px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="center bold header">HOUSEPHONE SAAS</div>
                <div class="center" style="font-size:10px;">Solusi Penjualan Gadget Terbaik</div>
                <div class="divider"></div>
                <div style="font-size:10px;">
                    Invoice: ${sale.invoice_number}<br/>
                    Tanggal: ${new Date(sale.created_at).toLocaleString('id-ID')}<br/>
                    Kasir  : ${sale.user?.name || '-'}<br/>
                    Pelanggan: ${sale.buyer?.name || 'Umum'} (${sale.buyer?.phone || '-'})
                </div>
                <div class="divider"></div>
                ${itemsHtml}
                ${extrasHtml}
                <div class="divider"></div>
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold;">
                    <div>TOTAL:</div>
                    <div>${formatCurrency(sale.total_amount)}</div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px;">
                    <div>Metode:</div>
                    <div>${sale.payment_method.toUpperCase()} (${sale.payment_detail || '-'})</div>
                </div>
                ${sale.dp_amount > 0 ? `
                    <div style="display:flex; justify-content:space-between; font-size:10px;">
                        <div>DP Booking:</div>
                        <div>${formatCurrency(sale.dp_amount)}</div>
                    </div>
                ` : ''}
                <div class="divider"></div>
                <div class="center bold" style="font-size:12px; margin-top:10px;">
                    *** LUNAS / TERIMA KASIH ***
                </div>
                <div class="footer">
                    Barang yang sudah dibeli dapat diretur dalam masa garansi toko dengan biaya pemotongan (restocking fee).
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const submitVoid = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale) return;
        voidForm.post(route('sales.void', selectedSale.id), {
            onSuccess: () => {
                setIsVoidOpen(false);
                voidForm.reset();
                setSelectedSale(null);
                alert('Permohonan void berhasil diajukan.');
            }
        });
    };

    const approveVoid = (saleId: number) => {
        if (confirm('Apakah Anda yakin ingin menyetujui pembatalan (void) transaksi ini? Semua unit akan dikembalikan ke ready stock.')) {
            useForm().post(route('sales.void.approve', saleId), {
                onSuccess: () => {
                    setSelectedSale(null);
                    alert('Void transaksi disetujui.');
                }
            });
        }
    };

    const openReturnModal = (sale: Sale) => {
        setSelectedSale(sale);
        returnForm.setData({
            sale_id: sale.id.toString(),
            stock_id: sale.items[0]?.stock_id.toString() || '',
            restocking_fee: (sale.items[0]?.actual_sell_price || 0) * 0.1, // default 10% restocking fee
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
                alert('Retur barang berhasil dicatat.');
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
                alert('Klaim garansi servis berhasil dicatat.');
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
                alert('Status perbaikan garansi berhasil diperbarui.');
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Sales History" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Search & Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Cari invoice, nama pelanggan, atau nomor SN..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Store filter dropdown */}
                        {authUser.role === 'superadmin' && (
                            <div className="w-full sm:w-48">
                                <select
                                    value={storeFilterId}
                                    onChange={(e) => {
                                        setStoreFilterId(e.target.value);
                                        window.location.href = route('sales-history.index', { store_id: e.target.value });
                                    }}
                                    className="w-full rounded-xl border border-input bg-background py-2 px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Cabang</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
                        {/* Sales Invoices List */}
                        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm text-card-foreground space-y-4">
                            <h3 className="text-base font-bold text-foreground">Daftar Transaksi</h3>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredSales.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">Tidak ada invoice transaksi ditemukan.</p>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <div 
                                            key={sale.id}
                                            onClick={() => setSelectedSale(sale)}
                                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 px-2.5 my-1.5 cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-900/50 rounded-xl transition ${
                                                selectedSale?.id === sale.id ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-foreground">{sale.invoice_number}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        sale.status === 'completed' 
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                            : sale.status === 'booking'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                        {sale.status}
                                                    </span>
                                                    {sale.void_requested && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 animate-pulse">
                                                            <AlertTriangle className="h-2.5 w-2.5" /> Butuh Void Approval
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 font-bold">Pelanggan: {sale.buyer?.name || 'Umum'} • {new Date(sale.created_at).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div className="mt-2 sm:mt-0 flex items-center gap-4 text-right">
                                                <div>
                                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.total_amount)}</p>
                                                    <p className="text-[10px] font-bold uppercase text-gray-400">{sale.payment_method}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Invoice Detail Panel */}
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground space-y-6">
                            <h3 className="text-lg font-semibold text-foreground">Detail Invoice</h3>

                            {selectedSale ? (
                                <div className="space-y-6 text-sm">
                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => printReceipt(selectedSale)}
                                            className="flex items-center justify-center gap-1.5 rounded-xl border border-input py-2 text-xs font-bold text-gray-700 hover:bg-muted dark:border-input dark:text-gray-300 dark:hover:bg-gray-900"
                                        >
                                            <Printer className="h-4 w-4 text-indigo-500" /> Cetak Thermal
                                        </button>
                                        
                                        {selectedSale.status !== 'cancelled' && authUser.role !== 'viewer' && (
                                            <button
                                                onClick={() => setIsVoidOpen(true)}
                                                className="flex items-center justify-center gap-1.5 rounded-xl border border-input py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-input dark:hover:bg-rose-950/20"
                                            >
                                                <Ban className="h-4 w-4" /> Void Transaksi
                                            </button>
                                        )}
                                    </div>

                                    {/* If superadmin & void requested */}
                                    {selectedSale.void_requested && authUser.role === 'superadmin' && (
                                        <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 space-y-2">
                                            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                                                <AlertTriangle className="h-4 w-4 animate-bounce" /> Usulan Void Masuk
                                            </p>
                                            <p className="text-xs text-muted-foreground italic">" {selectedSale.void_reason} "</p>
                                            <button
                                                onClick={() => approveVoid(selectedSale.id)}
                                                className="w-full rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                            >
                                                Setujui Pembatalan Transaksi
                                            </button>
                                        </div>
                                    )}

                                    {/* Sale stats */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">No. Invoice:</span>
                                            <span className="font-semibold text-foreground">{selectedSale.invoice_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">Tanggal:</span>
                                            <span className="text-gray-700 dark:text-gray-200">{new Date(selectedSale.created_at).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">Pelanggan:</span>
                                            <span className="text-gray-700 dark:text-gray-200">{selectedSale.buyer?.name} ({selectedSale.buyer?.phone})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">Kasir:</span>
                                            <span className="text-gray-700 dark:text-gray-200">{selectedSale.user?.name}</span>
                                        </div>
                                    </div>

                                    {/* Items list */}
                                    <div className="space-y-3 pt-4 border-t border-border dark:border-input">
                                        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Item Terjual</p>
                                        {selectedSale.items.map(item => (
                                            <div key={item.id} className="flex justify-between bg-muted dark:bg-background p-2.5 rounded-lg">
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{item.stock?.name} {item.is_trade_in_item && <span className="text-rose-500 text-[10px] font-bold uppercase">(Tukar Tambah)</span>}</p>
                                                    <p className="text-[10px] text-gray-400">SN: {item.stock?.serial_number || '-'}</p>
                                                </div>
                                                <div className="text-right text-xs">
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.actual_sell_price)}</p>
                                                    <p className="text-gray-400">Qty: {item.qty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Addons Extra */}
                                    {selectedSale.extras.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-border dark:border-input">
                                            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Layanan Tambahan (Add-On)</p>
                                            {selectedSale.extras.map(ex => (
                                                <div key={ex.id} className="flex justify-between text-xs font-bold bg-muted dark:bg-background p-2.5 rounded-lg">
                                                    <div>
                                                        <p className="text-gray-800 dark:text-gray-200">{ex.extra?.name}</p>
                                                        <p className="text-[10px] text-gray-400">Beban: {ex.charge_to}</p>
                                                    </div>
                                                    <p className="text-indigo-600 dark:text-indigo-400">{ex.charge_to === 'buyer' ? formatCurrency(ex.sell_price) : 'Rp0'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Return / Restock details */}
                                    {selectedSale.returns.length > 0 && (
                                        <div className="space-y-2 pt-4 border-t border-rose-100 dark:border-rose-950">
                                            <p className="text-xs font-semibold uppercase text-rose-500 tracking-wider">Catatan Retur Barang</p>
                                            {selectedSale.returns.map(ret => (
                                                <div key={ret.id} className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 p-2.5 rounded-lg text-xs space-y-1">
                                                    <div className="flex justify-between font-bold">
                                                        <span>Denda Restocking:</span>
                                                        <span className="text-rose-600">{formatCurrency(ret.restocking_fee)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold">
                                                        <span>Nilai Refund Pembeli:</span>
                                                        <span className="text-indigo-600">{formatCurrency(ret.refund_amount)}</span>
                                                    </div>
                                                    {ret.notes && <p className="text-[10px] text-gray-400 italic">Ket: "{ret.notes}"</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Return and Warranty buttons */}
                                    {selectedSale.status === 'completed' && authUser.role !== 'viewer' && (
                                        <div className="pt-4 border-t border-border dark:border-input flex gap-2">
                                            <button
                                                onClick={() => openReturnModal(selectedSale)}
                                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                                            >
                                                <RotateCcw className="h-4 w-4" /> Retur Barang
                                            </button>
                                            <button
                                                onClick={() => openWarrantyModal(selectedSale)}
                                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition"
                                            >
                                                <ShieldAlert className="h-4 w-4" /> Klaim Garansi
                                            </button>
                                        </div>
                                    )}

                                    {/* Warranty repairs list and status updates */}
                                    {selectedSale.repairs.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-border dark:border-input">
                                            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Status Perbaikan Servis Garansi</p>
                                            {selectedSale.repairs.map(rep => (
                                                <div key={rep.id} className="border border-border dark:border-input p-3 rounded-xl space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span>Kerusakan: {rep.damage_description}</span>
                                                        <span className="capitalize text-rose-500">{rep.status}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-gray-400">
                                                        <span>Biaya Servis Toko:</span>
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
                            ) : (
                                <p className="text-center text-sm text-gray-400 py-12">Pilih salah satu transaksi untuk melihat detail lengkap.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Void Modal */}
            {isVoidOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Ajukan Pembatalan (Void)</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Mohon isi alasan pembatalan untuk invoice <span className="font-bold text-indigo-600">{selectedSale.invoice_number}</span>.</p>

                        <form onSubmit={submitVoid} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Alasan Pembatalan</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={voidForm.data.void_reason}
                                    onChange={(e) => voidForm.setData('void_reason', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 focus:border-indigo-500 focus:outline-none dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="Contoh: Pembeli salah memilih model / unit retur manual"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsVoidOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={voidForm.processing}
                                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition animate-pulse"
                                >
                                    Kirim Void Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Retur / Return Modal */}
            {isReturnOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Retur Barang</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Proses pengembalian unit dari Invoice {selectedSale.invoice_number}.</p>

                        <form onSubmit={submitReturn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Item Yang Diretur</label>
                                <select
                                    required
                                    value={returnForm.data.stock_id}
                                    onChange={(e) => {
                                        const stockId = e.target.value;
                                        const matchedItem = selectedSale.items.find(i => i.stock_id.toString() === stockId);
                                        const price = matchedItem ? matchedItem.actual_sell_price : 0;
                                        returnForm.setData(prev => ({
                                            ...prev,
                                            stock_id: stockId,
                                            restocking_fee: price * 0.1 // 10% restocking fee recommendation
                                        }));
                                    }}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                >
                                    {selectedSale.items.map(item => (
                                        <option key={item.stock_id} value={item.stock_id}>
                                            {item.stock?.name} - {formatCurrency(item.actual_sell_price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Biaya Pemotongan / Restocking Fee (Standar 10% / Bisa Disesuaikan)</label>
                                <input
                                    type="number"
                                    required
                                    value={returnForm.data.restocking_fee === 0 ? '' : returnForm.data.restocking_fee}
                                    onChange={(e) => returnForm.setData('restocking_fee', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Catatan / Alasan Retur</label>
                                <input
                                    type="text"
                                    value={returnForm.data.notes}
                                    onChange={(e) => returnForm.setData('notes', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-foreground dark:border-input dark:bg-background"
                                    placeholder="Contoh: Kamera buram, tukar tipe lain"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsReturnOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={returnForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Proses Retur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Warranty Claim Modal */}
            {isWarrantyOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Klaim Garansi Servis</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Catat kerusakan unit garansi untuk Invoice {selectedSale.invoice_number}.</p>

                        <form onSubmit={submitWarranty} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Item Rusak</label>
                                <select
                                    required
                                    value={warrantyForm.data.stock_id}
                                    onChange={(e) => warrantyForm.setData('stock_id', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
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
                                    required
                                    rows={3}
                                    value={warrantyForm.data.damage_description}
                                    onChange={(e) => warrantyForm.setData('damage_description', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 focus:border-indigo-500 focus:outline-none dark:border-input dark:bg-background"
                                    placeholder="Contoh: Layar green screen setelah update iOS"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsWarrantyOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={warrantyForm.processing}
                                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                >
                                    Ajukan Klaim Servis
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Repair Update Modal */}
            {isRepairUpdateOpen && selectedRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Update Status Servis Garansi</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Pembaruan status pengerjaan unit garansi servis.</p>

                        <form onSubmit={submitRepairUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Status Pengerjaan</label>
                                <select
                                    value={repairForm.data.status}
                                    onChange={(e) => repairForm.setData('status', e.target.value as any)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                >
                                    <option value="pending">Pending (Mengantri)</option>
                                    <option value="approved">Approved (Diterima)</option>
                                    <option value="in_repair">In Repair (Sedang Diperbaiki)</option>
                                    <option value="repaired">Repaired (Selesai Servis)</option>
                                    <option value="rejected">Rejected (Ditolak)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Biaya Perbaikan Servis (HPP Toko)</label>
                                <input
                                    type="number"
                                    value={repairForm.data.repair_cost}
                                    onChange={(e) => repairForm.setData('repair_cost', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Catatan Pengerjaan</label>
                                <input
                                    type="text"
                                    value={repairForm.data.notes}
                                    onChange={(e) => repairForm.setData('notes', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                    placeholder="Keterangan tambahan sparepart dll"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsRepairUpdateOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={repairForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Simpan Status
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
