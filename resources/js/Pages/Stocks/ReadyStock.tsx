import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, 
    Smartphone, 
    Layers, 
    Plus, 
    ArrowLeftRight, 
    Check, 
    Info, 
    User, 
    Phone, 
    MapPin, 
    DollarSign, 
    CheckCircle,
    ArrowUpRight,
    Wrench,
    Tag,
    Share2
} from 'lucide-react';

interface ParameterValue {
    id: number;
    value: string;
}

interface Parameter {
    id: number;
    name: string;
    category: string;
    values: ParameterValue[];
}

interface StockItem {
    id: number;
    store_id: number;
    category: 'iphone' | 'android' | 'accessories' | 'extra';
    type: 'new' | 'second';
    name: string;
    brand_id: number | null;
    color_id: number | null;
    memory_id: number | null;
    license_id: number | null;
    grade: string | null;
    serial_number: string | null;
    imei_1: string | null;
    imei_2: string | null;
    supplier: string | null;
    warranty_duration_days: number;
    buy_price: number;
    sell_price: number;
    sell_price_reseller: number | null;
    qty: number;
    status: 'available' | 'transit' | 'sold';
    brand?: { value: string };
    color?: { value: string };
    memory?: { value: string };
    license?: { value: string };
}

interface Store {
    id: number;
    name: string;
    location?: string;
    address?: string;
}

interface Transfer {
    id: number;
    stock_id: number;
    from_store_id: number;
    to_store_id: number;
    requested_by: number;
    approved_by: number | null;
    status: 'transit' | 'approved' | 'rejected';
    created_at: string;
    stock: StockItem;
    from_store?: Store;
    to_store?: Store;
    requester?: { name: string };
}

interface UserOption {
    id: number;
    name: string;
    role: string;
}

interface ReadyStockProps {
    stocks: StockItem[];
    stores: Store[];
    transfers: Transfer[];
    storesFilter: Store[];
    parameters: Parameter[];
    users?: UserOption[];
    filters: {
        store_id: string | null;
    };
}

export default function ReadyStock({ stocks, stores, transfers, storesFilter, parameters, users = [], filters }: ReadyStockProps) {
    const authUser = usePage().props.auth.user as any;
    
    // Search and Category Tabs
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'iphone' | 'android' | 'accessories' | 'extra'>('all');
    const [storeFilterId, setStoreFilterId] = useState(filters.store_id || '');

    // Modals
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Dynamic Lists for checkout dropdowns
    const brandOptions = parameters.find(p => p.name.toLowerCase() === 'brand' || p.name.toLowerCase() === 'merek')?.values || [];
    const colorOptions = parameters.find(p => p.name.toLowerCase() === 'warna')?.values || [];
    const memoryOptions = parameters.find(p => p.name.toLowerCase() === 'kapasitas memori' || p.name.toLowerCase() === 'memori')?.values || [];
    const licenseOptions = parameters.find(p => p.name.toLowerCase() === 'tipe lisensi' || p.name.toLowerCase() === 'lisensi')?.values || [];

    // Filter available Extra add-ons
    const extraAddons = stocks.filter(s => s.category === 'extra' && s.status === 'available');

    const getLocalDateTimeString = () => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    };

    // Checkout Form
    const checkoutForm = useForm({
        buyer_name: '',
        buyer_phone: '',
        buyer_address: '',
        payment_method: 'cash' as 'cash' | 'online',
        payment_detail: '',
        dp_amount: 0,
        status: 'completed' as 'booking' | 'completed',
        affiliate_user_id: '' as string | number,
        affiliate_fee: 0,
        transaction_date: getLocalDateTimeString(),
        items: [] as Array<{ stock_id: number; qty: number; actual_sell_price: number }>,
        trade_in: null as null | {
            name: string;
            brand_id: number | string;
            color_id: number | string;
            memory_id: number | string;
            license_id: number | string;
            grade: string;
            serial_number: string;
            imei_1: string;
            imei_2: string;
            buy_price: number;
        },
        extras: [] as Array<{ extra_id: number; charge_to: 'buyer' | 'seller' | 'free_promotion'; sell_price: number; buy_price: number }>
    });

    // Transfer Form
    const transferForm = useForm({
        stock_id: '',
        to_store_id: ''
    });

    // Handle Search filter
    const filteredStocks = stocks.filter((item) => {
        const matchesCategory = activeTab === 'all' ? true : item.category === activeTab;
        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.imei_1 && item.imei_1.includes(searchQuery)) ||
            (item.color?.value && item.color.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.brand?.value && item.brand.value.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    // Open Checkout Modal
    const openCheckout = (stock: StockItem) => {
        setSelectedStock(stock);
        checkoutForm.setData({
            buyer_name: '',
            buyer_phone: '',
            buyer_address: '',
            payment_method: 'cash',
            payment_detail: '',
            dp_amount: 0,
            status: 'completed',
            affiliate_user_id: '',
            affiliate_fee: 0,
            transaction_date: getLocalDateTimeString(),
            items: [{ stock_id: stock.id, qty: 1, actual_sell_price: stock.sell_price }],
            trade_in: null,
            extras: []
        });
        setIsCheckoutOpen(true);
    };

    // Open Transfer Modal
    const openTransfer = (stock: StockItem) => {
        setSelectedStock(stock);
        transferForm.setData({
            stock_id: stock.id.toString(),
            to_store_id: ''
        });
        setIsTransferOpen(true);
    };

    // Handle Transfer submit
    const submitTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        transferForm.post(route('stocks.transfer'), {
            onSuccess: () => {
                setIsTransferOpen(false);
                setSelectedStock(null);
            }
        });
    };

    // Handle Checkout submit
    const submitCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        checkoutForm.post(route('sales.checkout'), {
            onSuccess: () => {
                setIsCheckoutOpen(false);
                setSelectedStock(null);
                alert('Transaksi berhasil disimpan!');
            },
            onError: (errs) => {
                alert(errs.error || Object.values(errs).join('\n'));
            }
        });
    };

    // Handle Approval of Mutation
    const approveTransfer = (transferId: number) => {
        if(confirm('Apakah Anda yakin ingin menyetujui mutasi unit ini ke cabang Anda?')) {
            useForm().post(route('stocks.transfer.approve', transferId));
        }
    };

    // Toggle Trade In
    const toggleTradeIn = () => {
        if (checkoutForm.data.trade_in) {
            checkoutForm.setData('trade_in', null);
        } else {
            checkoutForm.setData('trade_in', {
                name: '',
                brand_id: brandOptions[0]?.id || '',
                color_id: colorOptions[0]?.id || '',
                memory_id: memoryOptions[0]?.id || '',
                license_id: licenseOptions[0]?.id || '',
                grade: 'Grade A',
                serial_number: '',
                imei_1: '',
                imei_2: '',
                buy_price: 0
            });
        }
    };

    // Toggle Addon Extra
    const toggleAddon = (addon: StockItem) => {
        const exists = checkoutForm.data.extras.find(e => e.extra_id === addon.id);
        if (exists) {
            checkoutForm.setData('extras', checkoutForm.data.extras.filter(e => e.extra_id !== addon.id));
        } else {
            checkoutForm.setData('extras', [
                ...checkoutForm.data.extras,
                { extra_id: addon.id, charge_to: 'buyer', sell_price: addon.sell_price, buy_price: addon.buy_price }
            ]);
        }
    };

    // Update Addon Charge To
    const updateAddonCharge = (addonId: number, chargeTo: 'buyer' | 'seller' | 'free_promotion') => {
        checkoutForm.setData('extras', checkoutForm.data.extras.map(e => {
            if (e.extra_id === addonId) {
                return { ...e, charge_to: chargeTo };
            }
            return e;
        }));
    };

    // Calculate final invoice total
    const calculateTotal = () => {
        if (!selectedStock) return 0;
        const rawPrice = checkoutForm.data.items[0]?.actual_sell_price;
        const mainItemPrice = Number(rawPrice) || 0;
        
        let addonsCost = 0;
        checkoutForm.data.extras.forEach(e => {
            if (e.charge_to === 'buyer') {
                const sellPrice = e.sell_price;
                addonsCost += Number(sellPrice) || 0;
            }
        });

        const rawTradeIn = checkoutForm.data.trade_in?.buy_price;
        const tradeInDeduction = Number(rawTradeIn) || 0;
        
        return Math.max(0, mainItemPrice + addonsCost - tradeInDeduction);
    };

    const formatCurrency = (val: number) => {
        const cleanVal = isNaN(val) ? 0 : val;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(cleanVal);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Ready Stock Unit
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground">
                            Kelola unit siap jual dan ajukan mutasi stok antar cabang.
                        </p>
                    </div>

                    {/* Filter store if superadmin */}
                    {authUser.role === 'superadmin' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={storeFilterId}
                                onChange={(e) => {
                                    setStoreFilterId(e.target.value);
                                    window.location.href = route('ready-stock.index', { store_id: e.target.value });
                                }}
                                className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">Semua Cabang</option>
                                {storesFilter.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Ready Stock Unit Siap Jual" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'iphone', 'android', 'accessories', 'extra'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                                        activeTab === tab
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'bg-card text-gray-600 border border-input hover:bg-muted dark:bg-background dark:text-gray-400 dark:border-input'
                                    }`}
                                >
                                    {tab === 'all' ? 'Semua Stok' : tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, serial number, IMEI..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Stock Table Layout */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Nama Unit</th>
                                        <th className="pb-3 font-semibold">Kondisi / Grade</th>
                                        <th className="pb-3 font-semibold">Spesifikasi</th>
                                        <th className="pb-3 font-semibold">SN / IMEI</th>
                                        <th className="pb-3 font-semibold">Harga Jual</th>
                                        <th className="pb-3 font-semibold">Harga Reseller</th>
                                        <th className="pb-3 font-semibold text-center">Stok</th>
                                        {authUser.role !== 'viewer' && <th className="pb-3 font-semibold text-right">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {filteredStocks.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-gray-400">
                                                Stok unit tidak ditemukan. Sesuaikan kategori atau kata kunci pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStocks.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                <td className="py-4">
                                                    <p className="font-semibold text-foreground">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.category}</p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${
                                                        item.type === 'new' 
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs' 
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs'
                                                    }`}>
                                                        {item.type} {item.grade && `(${item.grade})`}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-xs">
                                                    {item.category !== 'accessories' && item.category !== 'extra' ? (
                                                        <span>
                                                            {item.brand?.value || '-'} • {item.memory?.value || '-'} • {item.license?.value || '-'}
                                                        </span>
                                                    ) : (
                                                        <span>Warna: {item.color?.value || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 font-mono text-xs">
                                                    {item.serial_number ? (
                                                        <div>
                                                            <p>SN: {item.serial_number}</p>
                                                            {item.imei_1 && <p className="text-gray-400">IMEI 1: {item.imei_1}</p>}
                                                            {item.imei_2 && <p className="text-gray-400">IMEI 2: {item.imei_2}</p>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurrency(item.sell_price)}
                                                </td>
                                                <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {item.sell_price_reseller ? formatCurrency(item.sell_price_reseller) : '-'}
                                                </td>
                                                <td className="py-4 text-center font-bold">
                                                    {item.qty} Pcs
                                                </td>
                                                {authUser.role !== 'viewer' && (
                                                    <td className="py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => openCheckout(item)}
                                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                                        >
                                                            Jual
                                                        </button>
                                                        {authUser.role === 'superadmin' && (
                                                            <button
                                                                onClick={() => openTransfer(item)}
                                                                className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-muted dark:border-input dark:text-gray-300 dark:hover:bg-gray-900 transition"
                                                            >
                                                                Mutasi
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stock Mutation & Approval Section */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Riwayat & Persetujuan Mutasi Cabang</h3>
                        <p className="text-xs text-muted-foreground mb-6">Berikut adalah usulan transfer barang masuk/keluar dari cabang Anda.</p>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Unit</th>
                                        <th className="pb-3 font-semibold">Dari Cabang</th>
                                        <th className="pb-3 font-semibold">Ke Cabang</th>
                                        <th className="pb-3 font-semibold">Pengaju</th>
                                        <th className="pb-3 font-semibold">Status</th>
                                        <th className="pb-3 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {transfers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-gray-400">
                                                Belum ada usulan mutasi terekam.
                                            </td>
                                        </tr>
                                    ) : (
                                        transfers.map((tr) => {
                                            const isDestination = tr.to_store_id === authUser.store_id || authUser.role === 'superadmin';
                                            const isTransit = tr.status === 'transit';
                                            
                                            return (
                                                <tr key={tr.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                    <td className="py-4">
                                                        <p className="font-semibold text-foreground">{tr.stock?.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{tr.stock?.serial_number}</p>
                                                    </td>
                                                    <td className="py-4">{tr.from_store?.name || 'Pusat'}</td>
                                                    <td className="py-4 font-bold text-indigo-600 dark:text-indigo-400">{tr.to_store?.name}</td>
                                                    <td className="py-4 text-xs">{tr.requester?.name || 'Sistem'}</td>
                                                    <td className="py-4">
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                                            tr.status === 'approved' 
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs' 
                                                                : tr.status === 'transit' 
                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs'
                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs'
                                                        }`}>
                                                            {tr.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        {isTransit && isDestination ? (
                                                            <button
                                                                onClick={() => approveTransfer(tr.id)}
                                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                                                            >
                                                                Terima Barang
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">-</span>
                                                        )}
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

            {/* Mutasi / Transfer Modal */}
            {isTransferOpen && selectedStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Propose Mutasi Unit</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Pindahkan unit <span className="font-bold text-gray-800 dark:text-gray-200">{selectedStock.name}</span> ke cabang mitra lainnya.</p>

                        <form onSubmit={submitTransfer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pilih Cabang Tujuan</label>
                                <select
                                    required
                                    value={transferForm.data.to_store_id}
                                    onChange={(e) => transferForm.setData('to_store_id', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-bold text-gray-800 focus:border-indigo-500 focus:outline-none dark:border-input dark:bg-background dark:text-gray-100"
                                >
                                    <option value="">-- Pilih Cabang --</option>
                                    {stores.map(store => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsTransferOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input dark:hover:bg-gray-950"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={transferForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    {transferForm.processing ? 'Mengirim...' : 'Kirim Usulan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sales Checkout Modal */}
            {isCheckoutOpen && selectedStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-border dark:border-input">
                            <div>
                                <h4 className="text-xl font-semibold text-foreground">Formulir Checkout Kasir</h4>
                                <p className="text-xs text-gray-400">Unit: {selectedStock.name}</p>
                            </div>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={submitCheckout} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Buyer Info */}
                            <div className="space-y-4">
                                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <User className="h-4 w-4" /> Data Pelanggan (Buyer)
                                </h5>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={checkoutForm.data.buyer_name}
                                            onChange={e => checkoutForm.setData('buyer_name', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="Contoh: Andi Wijaya"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">No. HP (WhatsApp)</label>
                                        <input
                                            type="text"
                                            required
                                            value={checkoutForm.data.buyer_phone}
                                            onChange={e => checkoutForm.setData('buyer_phone', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="Contoh: 08123456789"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Alamat (Opsional)</label>
                                        <input
                                            type="text"
                                            value={checkoutForm.data.buyer_address}
                                            onChange={e => checkoutForm.setData('buyer_address', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="Alamat lengkap pembeli"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Nego Price & Commission */}
                            <div className="space-y-4 pt-4 border-t border-border dark:border-input">
                                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <Tag className="h-4 w-4" /> Nego Harga & Transaksi
                                </h5>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Harga Kesepakatan (Nego)</label>
                                        <input
                                            type="number"
                                            required
                                            value={checkoutForm.data.items[0]?.actual_sell_price || 0}
                                            onChange={e => {
                                                const items = [...checkoutForm.data.items];
                                                items[0].actual_sell_price = parseFloat(e.target.value) || 0;
                                                checkoutForm.setData('items', items);
                                            }}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 font-bold">Harga default retail: {formatCurrency(selectedStock.sell_price)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Metode Pembayaran</label>
                                        <select
                                            value={checkoutForm.data.payment_method}
                                            onChange={e => checkoutForm.setData('payment_method', e.target.value as any)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        >
                                            <option value="cash">CASH / TUNAI</option>
                                            <option value="online">ONLINE (Transfer/QRIS)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tanggal Penjualan (Manual)</label>
                                        <input
                                            type="datetime-local"
                                            value={checkoutForm.data.transaction_date}
                                            onChange={e => checkoutForm.setData('transaction_date', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Keterangan Transfer/Tunai</label>
                                        <input
                                            type="text"
                                            value={checkoutForm.data.payment_detail}
                                            onChange={e => checkoutForm.setData('payment_detail', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="Contoh: Mandiri tf / Uang Pas"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Uang Muka / DP Booking (Opsional)</label>
                                        <input
                                            type="number"
                                            value={checkoutForm.data.dp_amount}
                                            onChange={e => checkoutForm.setData('dp_amount', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Status Transaksi</label>
                                        <select
                                            value={checkoutForm.data.status}
                                            onChange={e => checkoutForm.setData('status', e.target.value as any)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        >
                                            <option value="completed">SELESAI (Lunas)</option>
                                            <option value="booking">BOOKING (Sewa/DP)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">User Affiliate (Sales)</label>
                                        <select
                                            value={checkoutForm.data.affiliate_user_id}
                                            onChange={e => checkoutForm.setData('affiliate_user_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                        >
                                            <option value="">-- Tanpa Affiliate --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Komisi Affiliate (Affiliate Fee)</label>
                                        <input
                                            type="number"
                                            value={checkoutForm.data.affiliate_fee}
                                            onChange={e => checkoutForm.setData('affiliate_fee', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="Nominal komisi"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Addon Extras */}
                            <div className="space-y-4 pt-4 border-t border-border dark:border-input">
                                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <Wrench className="h-4 w-4" /> Layanan Tambahan (Add-On / Jasa)
                                </h5>
                                {extraAddons.length === 0 ? (
                                    <p className="text-xs text-gray-400 font-bold">Tidak ada jasa/add-on aktif di sistem saat ini.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {extraAddons.map(addon => {
                                            const selectedExtra = checkoutForm.data.extras.find(e => e.extra_id === addon.id);
                                            return (
                                                <div key={addon.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border dark:border-input p-3 rounded-xl">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!selectedExtra} 
                                                            onChange={() => toggleAddon(addon)} 
                                                            className="rounded text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        {addon.name} ({formatCurrency(addon.sell_price)})
                                                    </label>
                                                    {selectedExtra && (
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={selectedExtra.charge_to}
                                                                onChange={e => updateAddonCharge(addon.id, e.target.value as any)}
                                                                className="rounded-lg border border-input bg-card px-2 py-1 text-xs font-bold focus:outline-none dark:border-input dark:bg-background"
                                                            >
                                                                <option value="buyer">Bebankan ke Pembeli</option>
                                                                <option value="seller">Toko Tanggung (HPP Toko)</option>
                                                                <option value="free_promotion">Promosi Free (Toko Serap Rp0)</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Trade-in Section */}
                            <div className="space-y-4 pt-4 border-t border-border dark:border-input">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                        <ArrowLeftRight className="h-4 w-4" /> Tukar Tambah (Trade-in HP Pembeli)
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={toggleTradeIn}
                                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition dark:bg-indigo-950/20 dark:text-indigo-400"
                                    >
                                        {checkoutForm.data.trade_in ? 'Batalkan Tukar Tambah' : 'Aktifkan Tukar Tambah'}
                                    </button>
                                </div>

                                {checkoutForm.data.trade_in && (
                                    <div className="rounded-xl border border-border bg-muted/50 p-4 dark:border-input dark:bg-background space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nama Device HP Pembeli</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.data.trade_in.name}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, name: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                    placeholder="Contoh: iPhone 12 Pro Max"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nilai Taksiran Beli Toko (IDR)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={checkoutForm.data.trade_in.buy_price}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, buy_price: parseFloat(e.target.value) || 0 });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Merek (Brand)</label>
                                                <select
                                                    required
                                                    value={checkoutForm.data.trade_in.brand_id}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, brand_id: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                >
                                                    {brandOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Warna</label>
                                                <select
                                                    required
                                                    value={checkoutForm.data.trade_in.color_id}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, color_id: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                >
                                                    {colorOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Memori</label>
                                                <select
                                                    required
                                                    value={checkoutForm.data.trade_in.memory_id}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, memory_id: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                >
                                                    {memoryOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Lisensi Sinyal</label>
                                                <select
                                                    required
                                                    value={checkoutForm.data.trade_in.license_id}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, license_id: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                >
                                                    {licenseOptions.map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Grade (BNIB / A / B)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.data.trade_in.grade}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, grade: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                    placeholder="Contoh: Grade A+"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Serial Number HP Trade-In</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.data.trade_in.serial_number}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, serial_number: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">IMEI 1 HP Trade-In</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={checkoutForm.data.trade_in.imei_1}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, imei_1: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">IMEI 2 HP Trade-In (Opsional)</label>
                                                <input
                                                    type="text"
                                                    value={checkoutForm.data.trade_in.imei_2}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, imei_2: e.target.value });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Total Math & Checkout button */}
                            <div className="bg-muted rounded-xl p-4 dark:bg-background border dark:border-input space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                    <span>Harga Unit:</span>
                                    <span>{formatCurrency(checkoutForm.data.items[0]?.actual_sell_price || 0)}</span>
                                </div>
                                {checkoutForm.data.extras.length > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-gray-500">
                                        <span>Add-On Jasa (Dibayar Buyer):</span>
                                        <span>
                                            {formatCurrency(
                                                checkoutForm.data.extras.reduce((acc, curr) => curr.charge_to === 'buyer' ? acc + curr.sell_price : acc, 0)
                                            )}
                                        </span>
                                    </div>
                                )}
                                {checkoutForm.data.trade_in && (
                                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                                        <span>Potongan Tukar Tambah:</span>
                                        <span>-{formatCurrency(checkoutForm.data.trade_in.buy_price)}</span>
                                    </div>
                                )}
                                <div className="border-t border-dashed border-input dark:border-input pt-2 mt-2 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">TOTAL BAYAR:</span>
                                    <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(calculateTotal())}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsCheckoutOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={checkoutForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    {checkoutForm.processing ? 'Memproses...' : 'Selesaikan Pembayaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
