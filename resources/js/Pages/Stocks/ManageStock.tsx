import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
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
    FileSpreadsheet,
    QrCode,
    MessageCircle,
    Send,
    ExternalLink
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
    serial_number: string | null;
    imei_1: string | null;
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
            buyer?: { id: number; name: string; phone?: string; };
            affiliate_user?: { id: number; name: string; };
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
    filters?: {
        store_id: string | number | null;
    };
}

export default function ManageStock({ stocks, stores, parameters, filters }: ManageStockProps) {
    const authUser = usePage().props.auth.user as any;
    const isSuperAdmin = authUser.role === 'superadmin';
    const [storeFilterId, setStoreFilterId] = useState(filters?.store_id || '');
    const [isAddingNewStock, setIsAddingNewStock] = useState(false);
    const [selectedStockDetail, setSelectedStockDetail] = useState<StockItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStocks = stocks.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.imei_1 && item.imei_1.includes(searchQuery)) ||
            (item.color?.value && item.color.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.brand?.value && item.brand.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.store?.name && item.store.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    // Barcode scan refs
    const imeiSingleRef = useRef<HTMLInputElement>(null);

    // Single Stock Form — use empty string for price fields to avoid 0 prefill
    const singleForm = useForm({
        store_id: stores[0]?.id || '',
        category: 'iphone' as 'iphone' | 'android' | 'accessories' | 'extra',
        type: 'new' as 'new' | 'second',
        name: '',
        brand_id: '' as string | number,
        color_id: '' as string | number,
        memory_id: '' as string | number,
        license_id: '' as string | number,
        serial_number: '',
        imei_1: '',
        supplier: '',
        warranty_duration_days: '' as string | number,
        buy_price: '' as string | number,
        sell_price: '' as string | number,
        sell_price_reseller: '' as string | number,
        qty: 1
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const editForm = useForm({
        store_id: '' as string | number,
        category: 'iphone' as 'iphone' | 'android' | 'accessories' | 'extra',
        type: 'new' as 'new' | 'second',
        name: '',
        brand_id: '' as string | number,
        color_id: '' as string | number,
        memory_id: '' as string | number,
        license_id: '' as string | number,
        serial_number: '',
        imei_1: '',
        supplier: '',
        warranty_duration_days: '' as string | number,
        buy_price: '' as string | number,
        sell_price: '' as string | number,
        sell_price_reseller: '' as string | number,
        qty: 1,
        status: 'available' as 'available' | 'transit' | 'sold'
    });

    const openEditModal = (stock: StockItem) => {
        editForm.setData({
            store_id: stock.store_id || '',
            category: stock.category || 'iphone',
            type: stock.type || 'new',
            name: stock.name || '',
            brand_id: stock.brand_id || '',
            color_id: stock.color_id || '',
            memory_id: stock.memory_id || '',
            license_id: stock.license_id || '',
            serial_number: stock.serial_number || '',
            imei_1: stock.imei_1 || '',
            supplier: stock.supplier || '',
            warranty_duration_days: stock.warranty_duration_days || '',
            buy_price: stock.buy_price || '',
            sell_price: stock.sell_price || '',
            sell_price_reseller: stock.sell_price_reseller || '',
            qty: stock.qty || 1,
            status: stock.status || 'available'
        });
        setIsEditModalOpen(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStockDetail) return;
        editForm.put(route('stocks.update', selectedStockDetail.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedStockDetail(null);
                alert('Stok unit berhasil diperbarui!');
            }
        });
    };

    const handleDeleteStock = (stockId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus stok unit ini secara permanen dari sistem?')) {
            router.delete(route('stocks.destroy', stockId), {
                onSuccess: () => {
                    setSelectedStockDetail(null);
                    alert('Stok unit berhasil dihapus!');
                }
            });
        }
    };

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
                singleForm.setData({
                    store_id: stores[0]?.id || '',
                    category: 'iphone',
                    type: 'new',
                    name: '', brand_id: '', color_id: '', memory_id: '', license_id: '',
                    serial_number: '', imei_1: '', supplier: '',
                    warranty_duration_days: '', buy_price: '', sell_price: '', sell_price_reseller: '', qty: 1
                } as any);
                setIsAddingNewStock(false);
                alert('Stok unit berhasil ditambahkan!');
            }
        });
    };

    // Convert local phone to WA format
    const toWANumber = (phone: string): string => {
        if (!phone) return '';
        const clean = phone.replace(/[^\d]/g, '');
        if (clean.startsWith('0')) return '62' + clean.slice(1);
        return clean;
    };

    const openWAChat = (phone: string, name: string) => {
        const waNum = toWANumber(phone);
        if (!waNum) return;
        const msg = encodeURIComponent(`Halo ${name}! Terima kasih sudah berbelanja di toko kami. 😊`);
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
    };

    const openWAInvoice = (phone: string, name: string, invoiceNumber: string) => {
        const waNum = toWANumber(phone);
        if (!waNum) return;
        const invoiceUrl = `${window.location.origin}/invoice/${invoiceNumber}`;
        const msg = encodeURIComponent(`Halo ${name}! 🛍️\n\nBerikut invoice belanja Anda:\n${invoiceUrl}`);
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center w-full">
                    <div className="flex flex-wrap items-center gap-2 ml-auto w-full sm:w-auto">
                        {!isAddingNewStock && (
                            <div className="relative w-full sm:w-60">
                                <input
                                    type="text"
                                    placeholder="Cari unit, SN, IMEI..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-background"
                                />
                            </div>
                        )}
                        {isSuperAdmin && (
                            <select
                                value={storeFilterId}
                                onChange={(e) => {
                                    setStoreFilterId(e.target.value);
                                    router.get(route('sale-data.index'), { store_id: e.target.value }, { preserveState: true });
                                }}
                                className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-background"
                            >
                                <option value="">Semua Cabang</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                        
                        {!isAddingNewStock ? (
                            <button
                                onClick={() => setIsAddingNewStock(true)}
                                className="flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition shadow-md whitespace-nowrap shrink-0"
                                title="Tambah Stok"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsAddingNewStock(false)}
                                className="flex items-center justify-center rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition shadow-sm whitespace-nowrap shrink-0 dark:bg-background"
                            >
                                Kembali
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Sale Data" />

            <div className="pb-8 pt-2">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* TAB 1: LIST STOCKS */}
                    {!isAddingNewStock ? (
                        <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
                            
                            {/* Table Column */}
                            <div className={`rounded-none sm:rounded-lg border-x-0 sm:border border-y sm:border-y-0 border-border bg-transparent sm:bg-card shadow-none sm:shadow-sm text-card-foreground -mx-4 sm:mx-0 transition-all duration-300 ${
                                selectedStockDetail ? 'hidden lg:block lg:w-2/3' : 'w-full'
                            }`}>
                                <div className="p-0 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0 pt-4 sm:pt-0 mb-4">
                                    <h3 className="text-lg font-black text-foreground">All Sale Data</h3>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px] text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border dark:border-input text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Stock Date</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Sold Date</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Stock For</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Type</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Color</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Memory</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Serial Number</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">IMEI</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">License</th>
                                                {isSuperAdmin && <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Buy Price</th>}
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Sell Price</th>
                                                {isSuperAdmin && <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Actual Sell Price</th>}
                                                {isSuperAdmin && <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Actual Affiliate Fee</th>}
                                                {isSuperAdmin && <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Actual Profit</th>}
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Sold In</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Affiliator</th>
                                                <th className="pb-3 font-semibold px-3 whitespace-nowrap text-left">Buyer</th>
                                                <th className="pb-3 font-semibold text-right px-3 whitespace-nowrap">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            {filteredStocks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isSuperAdmin ? 17 : 13} className="py-8 text-center text-gray-400">Belum ada data unit dalam sistem.</td>
                                                </tr>
                                            ) : (
                                                filteredStocks.map((item) => {
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
                                                    const actualSellPrice = (item.status === 'sold' && saleItem?.actual_sell_price) ? parseFloat(saleItem.actual_sell_price as any) : 0;
                                                    const actualAffiliateFee = (item.status === 'sold' && sale?.affiliate_fee) ? parseFloat(sale.affiliate_fee as any) : 0;
                                                    const actualProfit = actualSellPrice > 0 ? (actualSellPrice - buyPrice - actualAffiliateFee) : 0;

                                                    const soldIn = (item.status === 'sold' && sale?.invoice_number) ? sale.invoice_number : '-';
                                                    const affiliatorName = (item.status === 'sold' && sale?.affiliate_user?.name) ? sale.affiliate_user.name : '-';
                                                    const buyerName = (item.status === 'sold' && sale?.buyer?.name) ? sale.buyer.name : '-';

                                                    const isSelected = selectedStockDetail?.id === item.id;

                                                    return (
                                                        <tr 
                                                            key={item.id} 
                                                            onClick={() => setSelectedStockDetail(item)}
                                                            className={`cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors ${
                                                                isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                                            }`}
                                                        >
                                                            <td className="py-4 px-3 font-medium whitespace-nowrap text-left">{stockDate}</td>
                                                            <td className="py-4 px-3 font-medium whitespace-nowrap text-left">{soldDate}</td>
                                                            <td className="py-4 px-3 font-bold text-xs whitespace-nowrap text-left">{stockFor}</td>
                                                            <td className="py-4 px-3 uppercase text-[10px] font-bold text-indigo-500 whitespace-nowrap text-left">{typeText}</td>
                                                            <td className="py-4 px-3 whitespace-nowrap text-left">{colorText}</td>
                                                            <td className="py-4 px-3 whitespace-nowrap text-left">{memoryText}</td>
                                                            <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap max-w-[120px] text-left">
                                                                <span className="truncate block">{item.serial_number || '-'}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap max-w-[130px] text-left">
                                                                <span className="truncate block">{item.imei_1 || '-'}</span>
                                                            </td>
                                                            <td className="py-4 px-3 whitespace-nowrap text-left">{licenseText}</td>
                                                            {isSuperAdmin && (
                                                                <td className="py-4 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap text-left">
                                                                    {formatCurrency(buyPrice)}
                                                                </td>
                                                            )}
                                                            <td className="py-4 px-3 font-bold whitespace-nowrap text-left">
                                                                {formatCurrency(sellPrice)}
                                                            </td>
                                                            {isSuperAdmin && (
                                                                <td className="py-4 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-left">
                                                                    {actualSellPrice > 0 ? formatCurrency(actualSellPrice) : '-'}
                                                                </td>
                                                            )}
                                                            {isSuperAdmin && (
                                                                <td className="py-4 px-3 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap text-left">
                                                                    {actualAffiliateFee > 0 ? formatCurrency(actualAffiliateFee) : '-'}
                                                                </td>
                                                            )}
                                                            {isSuperAdmin && (
                                                                <td className={`py-4 px-3 font-bold whitespace-nowrap text-left ${actualProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                    {actualSellPrice > 0 ? formatCurrency(actualProfit) : '-'}
                                                                </td>
                                                            )}
                                                            <td className="py-4 px-3 font-mono text-[10px] whitespace-nowrap text-left">{soldIn}</td>
                                                            <td className="py-4 px-3 whitespace-nowrap text-left">{affiliatorName}</td>
                                                            <td className="py-4 px-3 whitespace-nowrap text-left">{buyerName}</td>
                                                            <td className="py-4 text-right px-3 whitespace-nowrap">
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
                            </div>

                            {/* Detail Panel */}
                            {selectedStockDetail && (
                                <div className="w-full lg:w-1/3 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground space-y-6 self-start lg:sticky lg:top-4 transition-all duration-300">
                                    
                                    {/* Breadcrumb & Close Button */}
                                    <div className="flex items-center justify-between border-b border-border dark:border-input pb-3">
                                        <nav className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 overflow-hidden" aria-label="Breadcrumb">
                                            <span className="hover:text-foreground cursor-pointer whitespace-nowrap" onClick={() => setSelectedStockDetail(null)}>Inventori</span>
                                            <span className="mx-1.5 flex-shrink-0">/</span>
                                            <span className="hover:text-foreground cursor-pointer whitespace-nowrap" onClick={() => setSelectedStockDetail(null)}>Detail</span>
                                            <span className="mx-1.5 flex-shrink-0">/</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]" title={selectedStockDetail.name}>{selectedStockDetail.name}</span>
                                        </nav>
                                        <button 
                                            onClick={() => setSelectedStockDetail(null)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">{selectedStockDetail.name}</h4>
                                        <div className="flex gap-2 mt-2">
                                            <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                {selectedStockDetail.type}
                                            </span>
                                            <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                selectedStockDetail.status === 'available' 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                    : selectedStockDetail.status === 'transit' 
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                            }`}>
                                                {selectedStockDetail.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Cabang</span>
                                            <span className="text-right font-bold text-foreground">{selectedStockDetail.store?.name || 'Gudang Utama'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Kategori</span>
                                            <span className="text-right capitalize text-foreground">{selectedStockDetail.category}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Spesifikasi</span>
                                            <span className="text-right text-foreground">
                                                {selectedStockDetail.memory?.value || '-'} / {selectedStockDetail.color?.value || '-'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Lisensi</span>
                                            <span className="text-right text-foreground">{selectedStockDetail.license?.value || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Serial Number</span>
                                            <span className="text-right font-mono text-foreground">{selectedStockDetail.serial_number || '-'}</span>
                                        </div>
                                        {selectedStockDetail.imei_1 && (
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">IMEI</span>
                                                <span className="text-right font-mono text-foreground">{selectedStockDetail.imei_1}</span>
                                            </div>
                                        )}
                                        
                                        {isSuperAdmin && (
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">Harga Beli (HPP)</span>
                                                <span className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurrency(selectedStockDetail.buy_price)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Harga Jual Standar</span>
                                            <span className="text-right font-bold text-foreground">
                                                {formatCurrency(selectedStockDetail.sell_price)}
                                            </span>
                                        </div>

                                        {isSuperAdmin && selectedStockDetail.supplier && (
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">Supplier</span>
                                                <span className="text-right text-foreground">{selectedStockDetail.supplier}</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Masa Garansi Toko</span>
                                            <span className="text-right text-foreground">{selectedStockDetail.warranty_duration_days} Hari</span>
                                        </div>
                                    </div>

                                    {/* Sale Info (If Sold) with WA buttons */}
                                    {selectedStockDetail.status === 'sold' && selectedStockDetail.sale_items?.[0] && (
                                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Rincian Transaksi Penjualan</h5>
                                            
                                            {(() => {
                                                const sItem = selectedStockDetail.sale_items[0];
                                                const sale = sItem.sale;
                                                const actPrice = sItem.actual_sell_price ? parseFloat(sItem.actual_sell_price as any) : 0;
                                                const affFee = sale?.affiliate_fee ? parseFloat(sale.affiliate_fee as any) : 0;
                                                const buyPr = selectedStockDetail.buy_price ? parseFloat(selectedStockDetail.buy_price as any) : 0;
                                                const netProf = actPrice > 0 ? (actPrice - buyPr - affFee) : 0;
                                                const buyerPhone = (sale?.buyer as any)?.phone || '';
                                                const buyerName = sale?.buyer?.name || '';
                                                const invoiceNumber = sale?.invoice_number || '';

                                                return (
                                                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">No. Invoice</span>
                                                            <span className="font-mono font-bold text-foreground">{invoiceNumber || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Tanggal Terjual</span>
                                                            <span className="text-foreground">
                                                                {sale?.created_at ? new Date(sale.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-400">Nama Pembeli</span>
                                                            <span className="text-foreground font-bold">{buyerName || '-'}</span>
                                                        </div>
                                                        {isSuperAdmin && (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span className="text-emerald-600">Harga Jual Real</span>
                                                                    <span className="text-emerald-600 font-bold">{formatCurrency(actPrice)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-amber-600">Komisi Afiliasi</span>
                                                                    <span className="text-amber-600 font-bold">{formatCurrency(affFee)}</span>
                                                                </div>
                                                                <div className="flex justify-between border-t border-emerald-500/20 pt-1.5 mt-1.5">
                                                                    <span className="text-teal-600 font-bold">Keuntungan Bersih</span>
                                                                    <span className="text-teal-600 font-bold">{formatCurrency(netProf)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {sale?.affiliate_user?.name && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Sales Affiliate</span>
                                                                <span className="text-foreground">{sale.affiliate_user.name}</span>
                                                            </div>
                                                        )}

                                                        {/* WA Buttons */}
                                                        {buyerPhone && (
                                                            <div className="flex gap-2 pt-2 border-t border-emerald-500/20">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openWAChat(buyerPhone, buyerName)}
                                                                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500 py-2 text-[10px] font-bold text-white hover:bg-emerald-600 transition"
                                                                >
                                                                    <MessageCircle className="h-3 w-3" /> Chat WA
                                                                </button>
                                                                {invoiceNumber && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openWAInvoice(buyerPhone, buyerName, invoiceNumber)}
                                                                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-[10px] font-bold text-white hover:bg-indigo-700 transition"
                                                                    >
                                                                        <Send className="h-3 w-3" /> Kirim Invoice
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {invoiceNumber && (
                                                            <a
                                                                href={`/invoice/${invoiceNumber}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-1 w-full rounded-lg border border-emerald-500/20 py-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition"
                                                            >
                                                                <ExternalLink className="h-3 w-3" /> Lihat Invoice Online
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {isSuperAdmin && (
                                        <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(selectedStockDetail)}
                                                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                            >
                                                Edit Unit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteStock(selectedStockDetail.id)}
                                                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                            >
                                                Hapus Unit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    ) : (
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
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna</label>
                                                    <select value={singleForm.data.color_id} onChange={e => singleForm.setData('color_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                        <option value="">-- Pilih Warna --</option>
                                                        {getParamValues('warna').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kapasitas Memori</label>
                                                    <select value={singleForm.data.memory_id} onChange={e => singleForm.setData('memory_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                        <option value="">-- Pilih Memori --</option>
                                                        {getParamValues('kapasitas memori').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Lisensi / Sinyal</label>
                                                    <select value={singleForm.data.license_id} onChange={e => singleForm.setData('license_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                        <option value="">-- Pilih Lisensi --</option>
                                                        {getParamValues('tipe lisensi').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Serial Number (SN)</label>
                                                    <input
                                                        type="text"
                                                        value={singleForm.data.serial_number}
                                                        onChange={e => singleForm.setData('serial_number', e.target.value)}
                                                        className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.serial_number ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                                        placeholder="Serial Number HP"
                                                    />
                                                    {singleForm.errors.serial_number && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.serial_number}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IMEI</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            ref={imeiSingleRef}
                                                            value={singleForm.data.imei_1}
                                                            onChange={e => singleForm.setData('imei_1', e.target.value)}
                                                            className={`flex-1 rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.imei_1 ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                                            placeholder="Scan atau ketik IMEI"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => imeiSingleRef.current?.focus()}
                                                            title="Klik lalu scan barcode IMEI"
                                                            className="rounded-xl border border-input bg-muted px-3 py-2 text-gray-500 hover:bg-accent transition"
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {singleForm.errors.imei_1 && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.imei_1}</p>}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Klik ikon QR lalu scan barcode untuk isi otomatis</p>
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
                                                min={0}
                                                value={singleForm.data.buy_price ?? ''}
                                                onChange={e => singleForm.setData('buy_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="Masukkan harga beli"
                                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.buy_price ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            />
                                            {singleForm.errors.buy_price && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.buy_price}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Retail</label>
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                value={singleForm.data.sell_price ?? ''}
                                                onChange={e => singleForm.setData('sell_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="Masukkan harga jual"
                                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.sell_price ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            />
                                            {singleForm.errors.sell_price && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.sell_price}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Reseller (Opsional)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={singleForm.data.sell_price_reseller ?? ''}
                                                onChange={e => singleForm.setData('sell_price_reseller', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="Masukkan harga reseller"
                                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.sell_price_reseller ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            />
                                            {singleForm.errors.sell_price_reseller && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.sell_price_reseller}</p>}
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

                    {/* Edit Stock Modal */}
                    {isEditModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input my-8">
                                <div className="flex justify-between items-center pb-4 border-b border-border dark:border-input">
                                    <h4 className="text-lg font-semibold text-foreground">Edit Unit Stok</h4>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                </div>

                                <form onSubmit={submitEdit} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                                    {/* Section 1: Lokasi & Kategori */}
                                    <div className="p-4 rounded-xl border border-border dark:border-input bg-muted/20 space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang Toko</label>
                                                <select
                                                    required
                                                    value={editForm.data.store_id}
                                                    onChange={e => editForm.setData('store_id', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                >
                                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kategori Barang</label>
                                                <select
                                                    value={editForm.data.category}
                                                    onChange={e => editForm.setData('category', e.target.value as any)}
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
                                                    value={editForm.data.type}
                                                    onChange={e => editForm.setData('type', e.target.value as any)}
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
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk / Jasa</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editForm.data.name}
                                                    onChange={e => editForm.setData('name', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    placeholder="Contoh: iPhone 15 Pro Max"
                                                />
                                            </div>

                                            {editForm.data.category !== 'accessories' && editForm.data.category !== 'extra' && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna</label>
                                                        <select value={editForm.data.color_id} onChange={e => editForm.setData('color_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                            <option value="">-- Pilih Warna --</option>
                                                            {getParamValues('warna').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kapasitas Memori</label>
                                                        <select value={editForm.data.memory_id} onChange={e => editForm.setData('memory_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                            <option value="">-- Pilih Memori --</option>
                                                            {getParamValues('kapasitas memori').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Lisensi</label>
                                                        <select value={editForm.data.license_id} onChange={e => editForm.setData('license_id', e.target.value)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background">
                                                            <option value="">-- Pilih Lisensi --</option>
                                                            {getParamValues('tipe lisensi').map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Serial Number (SN)</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.data.serial_number}
                                                            onChange={e => editForm.setData('serial_number', e.target.value)}
                                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IMEI</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.data.imei_1}
                                                            onChange={e => editForm.setData('imei_1', e.target.value)}
                                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {(editForm.data.category === 'accessories' || editForm.data.category === 'extra') && (
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Warna (Opsional)</label>
                                                    <select
                                                        value={editForm.data.color_id}
                                                        onChange={e => editForm.setData('color_id', e.target.value)}
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
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <div className="lg:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Supplier / Pengirim</label>
                                                <input
                                                    type="text"
                                                    value={editForm.data.supplier}
                                                    onChange={e => editForm.setData('supplier', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Garansi Toko (Hari)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={editForm.data.warranty_duration_days}
                                                    onChange={e => editForm.setData('warranty_duration_days', parseInt(e.target.value) || 0)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            {editForm.data.category === 'accessories' && (
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Quantity (Stok)</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min={1}
                                                        value={editForm.data.qty}
                                                        onChange={e => editForm.setData('qty', parseInt(e.target.value) || 1)}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Status Unit</label>
                                                <select
                                                    value={editForm.data.status}
                                                    onChange={e => editForm.setData('status', e.target.value as any)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                >
                                                    <option value="available">Tersedia (Available)</option>
                                                    <option value="transit">Transit / Usulan Mutasi</option>
                                                    <option value="sold">Terjual (Sold)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Beli (HPP)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0}
                                                    value={editForm.data.buy_price}
                                                    onChange={e => editForm.setData('buy_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Jual Standar</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0}
                                                    value={editForm.data.sell_price}
                                                    onChange={e => editForm.setData('sell_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Reseller (Opsional)</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={editForm.data.sell_price_reseller}
                                                    onChange={e => editForm.setData('sell_price_reseller', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input">
                                            Batal
                                        </button>
                                        <button type="submit" disabled={editForm.processing} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">
                                            {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
