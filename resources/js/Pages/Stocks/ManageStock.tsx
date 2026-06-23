import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Smartphone, 
    Layers, 
    Plus, 
    List, 
    Trash, 
    Check, 
    Settings, 
    PlusCircle,
    Info,
    CheckCircle,
    AlertCircle,
    FileSpreadsheet
} from 'lucide-react';

interface ParameterValue {
    id: number;
    value: string;
    is_active: boolean;
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
    created_at?: string;
    store?: { name: string };
    brand?: { value: string };
    color?: { value: string };
    memory?: { value: string };
    license?: { value: string };
    sale_items?: Array<{
        id: number;
        qty: number;
        actual_sell_price: string | number;
        buy_price_snap: string | number;
        sale?: {
            id: number;
            invoice_number: string;
            created_at: string;
            affiliate_fee: string | number;
            buyer?: {
                id: number;
                name: string;
            };
            affiliate_user?: {
                id: number;
                name: string;
            };
        };
    }>;
}

interface Store {
    id: number;
    name: string;
    location?: string;
}

interface ManageStockProps {
    stocks: StockItem[];
    stores: Store[];
    parameters: Parameter[];
}

export default function ManageStock({ stocks, stores, parameters }: ManageStockProps) {
    const authUser = usePage().props.auth.user as any;
    const isSuperAdmin = authUser.role === 'superadmin';
    const [activeSubTab, setActiveSubTab] = useState<'list' | 'single' | 'batch' | 'params'>('list');

    // Single Stock Form
    const singleForm = useForm({
        store_id: stores[0]?.id || '',
        category: 'iphone' as 'iphone' | 'android' | 'accessories' | 'extra',
        type: 'new' as 'new' | 'second',
        name: '',
        brand_id: '' as string | number,
        color_id: '' as string | number,
        memory_id: '' as string | number,
        license_id: '' as string | number,
        grade: '',
        serial_number: '',
        imei_1: '',
        imei_2: '',
        supplier: '',
        warranty_duration_days: 0,
        buy_price: 0,
        sell_price: 0,
        sell_price_reseller: 0,
        qty: 1
    });

    // Batch Stock Form
    const batchForm = useForm({
        store_id: stores[0]?.id || '',
        category: 'iphone' as 'iphone' | 'android',
        type: 'new' as 'new' | 'second',
        name: '',
        brand_id: '' as string | number,
        color_id: '' as string | number,
        memory_id: '' as string | number,
        license_id: '' as string | number,
        grade: '',
        supplier: '',
        warranty_duration_days: 0,
        buy_price: 0,
        sell_price: 0,
        sell_price_reseller: 0,
        items: [{ serial_number: '', imei_1: '', imei_2: '' }]
    });

    // Filter values for specific parameters
    const getParamValues = (name: string) => {
        const param = parameters.find(p => p.name.toLowerCase() === name.toLowerCase());
        return param ? param.values : [];
    };

    const submitSingle = (e: React.FormEvent) => {
        e.preventDefault();
        singleForm.post(route('stocks.store'), {
            onSuccess: () => {
                singleForm.reset();
                alert('Stok unit berhasil ditambahkan!');
            }
        });
    };

    const submitBatch = (e: React.FormEvent) => {
        e.preventDefault();
        batchForm.post(route('stocks.store-batch'), {
            onSuccess: () => {
                batchForm.reset();
                batchForm.setData('items', [{ serial_number: '', imei_1: '', imei_2: '' }]);
                alert('Batch stok unit berhasil ditambahkan!');
            }
        });
    };

    const addBatchRow = () => {
        batchForm.setData('items', [
            ...batchForm.data.items,
            { serial_number: '', imei_1: '', imei_2: '' }
        ]);
    };

    const removeBatchRow = (index: number) => {
        if (batchForm.data.items.length > 1) {
            batchForm.setData('items', batchForm.data.items.filter((_, idx) => idx !== index));
        }
    };

    const updateBatchItem = (index: number, field: 'serial_number' | 'imei_1' | 'imei_2', value: string) => {
        const items = [...batchForm.data.items];
        items[index][field] = value;
        batchForm.setData('items', items);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Inventori" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Navigation Tabs */}
                    <div className="border-b border-input dark:border-input overflow-x-auto scrollbar-none">
                        <nav className="flex flex-nowrap space-x-8 min-w-max pb-1" aria-label="Tabs">
                            {([
                                { id: 'list', name: 'Daftar Semua Inventori', icon: List },
                                ...(isSuperAdmin ? [
                                    { id: 'single', name: 'Input Unit Tunggal', icon: Plus },
                                    { id: 'batch', name: 'Input Batch (Massal)', icon: FileSpreadsheet },
                                ] : [])
                            ] as const).map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id as any)}
                                        className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                            activeSubTab === tab.id
                                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
 
                    {/* TAB 1: LIST STOCKS */}
                    {activeSubTab === 'list' && (
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Semua Inventori Terdaftar</h3>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border dark:border-input text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                            <th className="pb-3 font-semibold pr-2">Stock Date</th>
                                            <th className="pb-3 font-semibold pr-2">Sold Date</th>
                                            <th className="pb-3 font-semibold pr-2">Stock For</th>
                                            <th className="pb-3 font-semibold pr-2">Type</th>
                                            <th className="pb-3 font-semibold pr-2">Color</th>
                                            <th className="pb-3 font-semibold pr-2">Memory</th>
                                            <th className="pb-3 font-semibold pr-2">Serial Number</th>
                                            <th className="pb-3 font-semibold pr-2">License</th>
                                            {isSuperAdmin && <th className="pb-3 font-semibold pr-2">Buy Price</th>}
                                            <th className="pb-3 font-semibold pr-2">Sell Price</th>
                                            {isSuperAdmin && <th className="pb-3 font-semibold pr-2">Actual Sell Price</th>}
                                            {isSuperAdmin && <th className="pb-3 font-semibold pr-2">Actual Affiliate Fee</th>}
                                            {isSuperAdmin && <th className="pb-3 font-semibold pr-2">Actual Profit - Affiliator Fee</th>}
                                            <th className="pb-3 font-semibold pr-2">Sold In</th>
                                            <th className="pb-3 font-semibold pr-2">Affiliator Name</th>
                                            <th className="pb-3 font-semibold pr-2">Buyer Name</th>
                                            <th className="pb-3 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        {stocks.length === 0 ? (
                                            <tr>
                                                <td colSpan={isSuperAdmin ? 17 : 13} className="py-8 text-center text-gray-400">Belum ada data unit dalam sistem.</td>
                                            </tr>
                                        ) : (
                                            stocks.map((item) => {
                                                const saleItem = item.sale_items && item.sale_items[0];
                                                const sale = saleItem?.sale;
                                                const stockDate = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                                                const soldDate = (item.status === 'sold' && sale?.created_at) ? new Date(sale.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                                                const stockFor = item.store?.name || 'Gudang Utama';
                                                const typeText = item.type;
                                                const colorText = item.color?.value || '-';
                                                const memoryText = item.memory?.value || '-';
                                                const licenseText = item.license?.value || '-';

                                                const buyPrice = item.buy_price ? parseFloat(item.buy_price as any) : 0;
                                                const sellPrice = item.sell_price ? parseFloat(item.sell_price as any) : 0;
                                                const actualSellPrice = saleItem?.actual_sell_price ? parseFloat(saleItem.actual_sell_price as any) : 0;
                                                const actualAffiliateFee = sale?.affiliate_fee ? parseFloat(sale.affiliate_fee as any) : 0;
                                                const actualProfit = actualSellPrice > 0 ? (actualSellPrice - buyPrice - actualAffiliateFee) : 0;

                                                const soldIn = sale?.invoice_number || '-';
                                                const affiliatorName = sale?.affiliate_user?.name || '-';
                                                const buyerName = sale?.buyer?.name || '-';

                                                return (
                                                    <tr key={item.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                        <td className="py-4 pr-2 font-medium">{stockDate}</td>
                                                        <td className="py-4 pr-2 font-medium">{soldDate}</td>
                                                        <td className="py-4 pr-2 font-bold text-xs">{stockFor}</td>
                                                        <td className="py-4 pr-2 uppercase text-[10px] font-bold text-indigo-500">{typeText}</td>
                                                        <td className="py-4 pr-2">{colorText}</td>
                                                        <td className="py-4 pr-2">{memoryText}</td>
                                                        <td className="py-4 pr-2 font-mono text-[11px]">
                                                            <p>{item.serial_number || '-'}</p>
                                                            {item.imei_1 && <p className="text-[10px] text-gray-400 font-normal">IMEI 1: {item.imei_1}</p>}
                                                        </td>
                                                        <td className="py-4 pr-2">{licenseText}</td>
                                                        {isSuperAdmin && (
                                                            <td className="py-4 pr-2 font-bold text-indigo-600 dark:text-indigo-400">
                                                                {formatCurrency(buyPrice)}
                                                            </td>
                                                        )}
                                                        <td className="py-4 pr-2 font-bold">
                                                            {formatCurrency(sellPrice)}
                                                        </td>
                                                        {isSuperAdmin && (
                                                            <td className="py-4 pr-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                {actualSellPrice > 0 ? formatCurrency(actualSellPrice) : '-'}
                                                            </td>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <td className="py-4 pr-2 font-medium text-amber-600 dark:text-amber-400">
                                                                {actualAffiliateFee > 0 ? formatCurrency(actualAffiliateFee) : '-'}
                                                            </td>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <td className={`py-4 pr-2 font-bold ${actualProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                {actualSellPrice > 0 ? formatCurrency(actualProfit) : '-'}
                                                            </td>
                                                        )}
                                                        <td className="py-4 pr-2 font-mono text-[10px]">{soldIn}</td>
                                                        <td className="py-4 pr-2">{affiliatorName}</td>
                                                        <td className="py-4 pr-2">{buyerName}</td>
                                                        <td className="py-4 text-right">
                                                            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                                item.status === 'available' 
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                                    : item.status === 'transit' 
                                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                            }`}>
                                                                {item.status}
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
                    )}

                    {/* TAB 2: SINGLE INPUT FORM */}
                    {activeSubTab === 'single' && (
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Tambah Stok Unit Baru</h3>
                            
                            <form onSubmit={submitSingle} className="space-y-6">
                                {/* Section 1: Lokasi & Kategori */}
                                <div className="p-4 rounded-xl border border-border dark:border-input bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">1. Lokasi & Kategori Unit</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang Toko</label>
                                            <select
                                                required
                                                value={singleForm.data.store_id}
                                                onChange={e => singleForm.setData('store_id', e.target.value)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kategori Barang</label>
                                            <select
                                                value={singleForm.data.category}
                                                onChange={e => singleForm.setData('category', e.target.value as any)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                <option value="iphone">iPhone</option>
                                                <option value="android">Android</option>
                                                <option value="accessories">Aksesoris (Bulk)</option>
                                                <option value="extra">Jasa / Add-on (Layanan)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kondisi Barang</label>
                                            <select
                                                value={singleForm.data.type}
                                                onChange={e => singleForm.setData('type', e.target.value as any)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                <option value="new">Baru (New)</option>
                                                <option value="second">Bekas (Second)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Spesifikasi & Identitas */}
                                <div className="p-4 rounded-xl border border-border dark:border-input bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">2. Detail Spesifikasi & Identitas Barang</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk / Jasa</label>
                                            <input
                                                type="text"
                                                required
                                                value={singleForm.data.name}
                                                onChange={e => singleForm.setData('name', e.target.value)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                placeholder="Contoh: iPhone 15 Pro Max / Jasa IMEI"
                                            />
                                        </div>

                                        {singleForm.data.category !== 'accessories' && singleForm.data.category !== 'extra' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Merek (Brand)</label>
                                                    <select
                                                        value={singleForm.data.brand_id}
                                                        onChange={e => singleForm.setData('brand_id', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    >
                                                        <option value="">-- Pilih Brand --</option>
                                                        {getParamValues('brand').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna</label>
                                                    <select
                                                        value={singleForm.data.color_id}
                                                        onChange={e => singleForm.setData('color_id', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    >
                                                        <option value="">-- Pilih Warna --</option>
                                                        {getParamValues('warna').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kapasitas Memori</label>
                                                    <select
                                                        value={singleForm.data.memory_id}
                                                        onChange={e => singleForm.setData('memory_id', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    >
                                                        <option value="">-- Pilih Memori --</option>
                                                        {getParamValues('kapasitas memori').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Lisensi / Sinyal</label>
                                                    <select
                                                        value={singleForm.data.license_id}
                                                        onChange={e => singleForm.setData('license_id', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    >
                                                        <option value="">-- Pilih Lisensi --</option>
                                                        {getParamValues('tipe lisensi').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Grade (BNIB / A / B)</label>
                                                    <input
                                                        type="text"
                                                        value={singleForm.data.grade}
                                                        onChange={e => singleForm.setData('grade', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        placeholder="Contoh: Grade A+"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Serial Number (SN)</label>
                                                    <input
                                                        type="text"
                                                        value={singleForm.data.serial_number}
                                                        onChange={e => singleForm.setData('serial_number', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        placeholder="Serial Number HP"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IMEI 1</label>
                                                    <input
                                                        type="text"
                                                        value={singleForm.data.imei_1}
                                                        onChange={e => singleForm.setData('imei_1', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        placeholder="Masukkan IMEI 1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IMEI 2 (Opsional)</label>
                                                    <input
                                                        type="text"
                                                        value={singleForm.data.imei_2}
                                                        onChange={e => singleForm.setData('imei_2', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        placeholder="Masukkan IMEI 2"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Accessories Color selection */}
                                        {(singleForm.data.category === 'accessories' || singleForm.data.category === 'extra') && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna (Opsional)</label>
                                                <select
                                                    value={singleForm.data.color_id}
                                                    onChange={e => singleForm.setData('color_id', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                >
                                                    <option value="">-- Pilih Warna --</option>
                                                    {getParamValues('warna').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 3: Harga & Finansial */}
                                <div className="p-4 rounded-xl border border-border dark:border-input bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">3. Finansial, Garansi & Distribusi</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                        <div className="lg:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Supplier / Pengirim</label>
                                            <input
                                                type="text"
                                                value={singleForm.data.supplier}
                                                onChange={e => singleForm.setData('supplier', e.target.value)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                placeholder="Contoh: PT Distributor Gadget"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Masa Garansi Toko (Hari)</label>
                                            <input
                                                type="number"
                                                required
                                                value={singleForm.data.warranty_duration_days}
                                                onChange={e => singleForm.setData('warranty_duration_days', parseInt(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                        {singleForm.data.category === 'accessories' && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Quantity (Stok Bulk)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={1}
                                                    value={singleForm.data.qty}
                                                    onChange={e => singleForm.setData('qty', parseInt(e.target.value) || 1)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Modal Beli (HPP)</label>
                                            <input
                                                type="number"
                                                required
                                                value={singleForm.data.buy_price}
                                                onChange={e => singleForm.setData('buy_price', parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Toko (Retail)</label>
                                            <input
                                                type="number"
                                                required
                                                value={singleForm.data.sell_price}
                                                onChange={e => singleForm.setData('sell_price', parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Reseller (Opsional)</label>
                                            <input
                                                type="number"
                                                value={singleForm.data.sell_price_reseller}
                                                onChange={e => singleForm.setData('sell_price_reseller', parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border dark:border-input flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={singleForm.processing}
                                        className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                    >
                                        {singleForm.processing ? 'Menyimpan...' : 'Simpan Stok Unit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: BATCH INPUT FORM */}
                    {activeSubTab === 'batch' && (
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center gap-1.5 mb-2">
                                <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                                <h3 className="text-lg font-semibold text-foreground">Input Batch / Massal (Khusus HP)</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-6">Metode penginputan massal di mana spesifikasi utama didefinisikan sekali, lalu Anda menginputkan Serial Number & IMEI unit satu per satu.</p>

                            <form onSubmit={submitBatch} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang Toko</label>
                                        <select
                                            required
                                            value={batchForm.data.store_id}
                                            onChange={e => batchForm.setData('store_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kategori Barang</label>
                                        <select
                                            value={batchForm.data.category}
                                            onChange={e => batchForm.setData('category', e.target.value as any)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="iphone">iPhone</option>
                                            <option value="android">Android</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kondisi Barang</label>
                                        <select
                                            value={batchForm.data.type}
                                            onChange={e => batchForm.setData('type', e.target.value as any)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="new">Baru (New)</option>
                                            <option value="second">Bekas (Second)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk Utama</label>
                                        <input
                                            type="text"
                                            required
                                            value={batchForm.data.name}
                                            onChange={e => batchForm.setData('name', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            placeholder="Contoh: iPhone 15 Pro Max"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Merek (Brand)</label>
                                        <select
                                            value={batchForm.data.brand_id}
                                            onChange={e => batchForm.setData('brand_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Brand --</option>
                                            {getParamValues('brand').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna</label>
                                        <select
                                            value={batchForm.data.color_id}
                                            onChange={e => batchForm.setData('color_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Warna --</option>
                                            {getParamValues('warna').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kapasitas Memori</label>
                                        <select
                                            value={batchForm.data.memory_id}
                                            onChange={e => batchForm.setData('memory_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Memori --</option>
                                            {getParamValues('kapasitas memori').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Lisensi / Sinyal</label>
                                        <select
                                            value={batchForm.data.license_id}
                                            onChange={e => batchForm.setData('license_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Lisensi --</option>
                                            {getParamValues('tipe lisensi').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Grade (BNIB / A / B)</label>
                                        <input
                                            type="text"
                                            value={batchForm.data.grade}
                                            onChange={e => batchForm.setData('grade', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            placeholder="Contoh: Grade A+"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Supplier</label>
                                        <input
                                            type="text"
                                            value={batchForm.data.supplier}
                                            onChange={e => batchForm.setData('supplier', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Masa Garansi Toko (Hari)</label>
                                        <input
                                            type="number"
                                            required
                                            value={batchForm.data.warranty_duration_days}
                                            onChange={e => batchForm.setData('warranty_duration_days', parseInt(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Modal Beli (HPP)</label>
                                        <input
                                            type="number"
                                            required
                                            value={batchForm.data.buy_price}
                                            onChange={e => batchForm.setData('buy_price', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Retail</label>
                                        <input
                                            type="number"
                                            required
                                            value={batchForm.data.sell_price}
                                            onChange={e => batchForm.setData('sell_price', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic items table for SN/IMEI */}
                                <div className="space-y-4 pt-4 border-t border-border dark:border-input">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Daftar Unit Serial Number & IMEI</h4>
                                        <button
                                            type="button"
                                            onClick={addBatchRow}
                                            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                        >
                                            <PlusCircle className="h-4 w-4" /> Tambah Unit Lagi
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {batchForm.data.items.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-muted dark:bg-background p-4 rounded-xl relative border dark:border-gray-900">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Serial Number (SN) #{idx + 1}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={item.serial_number}
                                                        onChange={e => updateBatchItem(idx, 'serial_number', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-sm font-bold dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">IMEI 1 #{idx + 1}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={item.imei_1}
                                                        onChange={e => updateBatchItem(idx, 'imei_1', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-sm font-bold dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">IMEI 2 #{idx + 1} (Opsional)</label>
                                                    <input
                                                        type="text"
                                                        value={item.imei_2}
                                                        onChange={e => updateBatchItem(idx, 'imei_2', e.target.value)}
                                                        className="w-full rounded-xl border border-input bg-card px-3 py-1.5 text-sm font-bold dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                                {batchForm.data.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBatchRow(idx)}
                                                        className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition dark:bg-rose-950/20 dark:text-rose-400"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border dark:border-input flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={batchForm.processing}
                                        className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                    >
                                        {batchForm.processing ? 'Menyimpan Batch...' : `Simpan ${batchForm.data.items.length} Unit`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}



                </div>
            </div>
        </AuthenticatedLayout>
    );
}
