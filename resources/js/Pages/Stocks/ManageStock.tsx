import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, Fragment } from 'react';
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
    ExternalLink,
    RotateCcw
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
    deleted_at?: string | null;
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
    const canSeeFinancials = ['superadmin', 'viewer'].includes(authUser.role);
    const [storeFilterId, setStoreFilterId] = useState(filters?.store_id || '');
    const [isAddingNewStock, setIsAddingNewStock] = useState(false);
    const [isEditingStock, setIsEditingStock] = useState(false);
    const [trashFilter, setTrashFilter] = useState<'active' | 'trash'>('active');
    const [selectedStockDetail, setSelectedStockDetail] = useState<StockItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'created_at',
        direction: 'desc'
    });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, storeFilterId, trashFilter, categoryFilter]);

    const uniqueProductNames = Array.from(new Set(stocks.map(s => s.name).filter(Boolean)));

    const filteredStocks = stocks.filter(item => {
        // Filter by trash / active
        if (trashFilter === 'trash') {
            if (!item.deleted_at) return false;
        } else {
            if (item.deleted_at) return false;
        }

        // Filter by category
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
            return false;
        }

        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.serial_number && item.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.imei_1 && item.imei_1.includes(searchQuery)) ||
            (item.color?.value && item.color.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.brand?.value && item.brand.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.store?.name && item.store.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const getSortValue = (item: StockItem, key: string) => {
        const saleItem = item.sale_items && item.sale_items[0];
        const sale = saleItem?.sale;
        
        switch (key) {
            case 'created_at':
                return item.created_at ? new Date(item.created_at).getTime() : 0;
            case 'name':
                return item.name || '';
            case 'sold_date':
                return (item.status === 'sold' && sale?.created_at) ? new Date(sale.created_at).getTime() : 0;
            case 'store':
                return item.store?.name || 'Gudang Utama';
            case 'type':
                return item.type || '';
            case 'color':
                return item.color?.value || '';
            case 'memory':
                return item.memory?.value || '';
            case 'serial_number':
                return item.serial_number || '';
            case 'imei_1':
                return item.imei_1 || '';
            case 'license':
                return item.license?.value || '';
            case 'buy_price':
                return item.buy_price ? parseFloat(item.buy_price as any) : 0;
            case 'sell_price':
                return item.sell_price ? parseFloat(item.sell_price as any) : 0;
            case 'actual_sell_price':
                return (item.status === 'sold' && saleItem?.actual_sell_price) ? parseFloat(saleItem.actual_sell_price as any) : 0;
            case 'actual_affiliate_fee':
                return (item.status === 'sold' && sale?.affiliate_fee) ? parseFloat(sale.affiliate_fee as any) : 0;
            case 'actual_profit': {
                const buyPrice = item.buy_price ? parseFloat(item.buy_price as any) : 0;
                const actualSellPrice = (item.status === 'sold' && saleItem?.actual_sell_price) ? parseFloat(saleItem.actual_sell_price as any) : 0;
                const actualAffiliateFee = (item.status === 'sold' && sale?.affiliate_fee) ? parseFloat(sale.affiliate_fee as any) : 0;
                return actualSellPrice > 0 ? (actualSellPrice - buyPrice - actualAffiliateFee) : 0;
            }
            case 'sold_in':
                return (item.status === 'sold' && sale?.invoice_number) ? sale.invoice_number : '';
            case 'affiliator':
                return (item.status === 'sold' && sale?.affiliate_user?.name) ? sale.affiliate_user.name : '';
            case 'buyer':
                return (item.status === 'sold' && sale?.buyer?.name) ? sale.buyer.name : '';
            case 'status':
                return item.deleted_at ? 'trash' : item.status;
            default:
                return '';
        }
    };

    const sortedStocks = [...filteredStocks].sort((a, b) => {
        // Primary sort: non-sold (available, transit) first (0), sold middle (1), deleted/trash last (2)
        const aStatusOrder = a.deleted_at ? 2 : (a.status === 'sold' ? 1 : 0);
        const bStatusOrder = b.deleted_at ? 2 : (b.status === 'sold' ? 1 : 0);

        if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
        }

        const aVal = getSortValue(a, sortConfig.key);
        const bVal = getSortValue(b, sortConfig.key);

        if (aVal === bVal) return 0;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        return sortConfig.direction === 'asc' 
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
    });

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Barcode scan refs
    const imeiSingleRef = useRef<HTMLInputElement>(null);

    // Camera scanner state
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerInstance, setScannerInstance] = useState<any>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);

    useEffect(() => {
        let html5Qrcode: any = null;
        if (isScannerOpen) {
            import('html5-qrcode').then(({ Html5Qrcode }) => {
                const element = document.getElementById("reader");
                if (!element) return;
                
                html5Qrcode = new Html5Qrcode("reader");
                setScannerInstance(html5Qrcode);
                
                html5Qrcode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (width: number, height: number) => {
                            return { width: Math.floor(width * 0.85), height: Math.floor(height * 0.4) };
                        }
                    },
                    (decodedText: string) => {
                        singleForm.setData('imei_1', decodedText);
                        html5Qrcode.stop().then(() => {
                            setIsScannerOpen(false);
                        }).catch((err: any) => {
                            console.error(err);
                            setIsScannerOpen(false);
                        });
                    },
                    (errorMessage: string) => {
                        // Verbose scanning error logs can go here
                    }
                ).then(() => {
                    const videoElem = element.querySelector('video');
                    if (videoElem) {
                        videoElem.setAttribute('playsinline', 'true');
                        videoElem.setAttribute('webkit-playsinline', 'true');
                        videoElem.setAttribute('muted', 'true');
                        videoElem.muted = true;
                    }
                }).catch((err: any) => {
                    setScannerError("Gagal mengakses kamera: " + err.message);
                });
            }).catch((err) => {
                setScannerError("Gagal memuat modul scanner: " + err.message);
            });
        }

        return () => {
            if (html5Qrcode && html5Qrcode.isScanning) {
                html5Qrcode.stop().catch((err: any) => console.error(err));
            }
        };
    }, [isScannerOpen]);

    const closeScanner = () => {
        if (scannerInstance && scannerInstance.isScanning) {
            scannerInstance.stop().then(() => {
                setIsScannerOpen(false);
            }).catch((err: any) => {
                console.error(err);
                setIsScannerOpen(false);
            });
        } else {
            setIsScannerOpen(false);
        }
    };

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
        qty: 1,
        default_charge_to: 'buyer' as 'buyer' | 'seller' | 'free_promotion'
    });

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
        status: 'available' as 'available' | 'transit' | 'sold',
        default_charge_to: 'buyer' as 'buyer' | 'seller' | 'free_promotion',
        buyer_name: '',
        buyer_phone: '',
        buyer_address: ''
    });

    const openEditModal = (stock: StockItem) => {
        const sale = stock.sale_items?.[0]?.sale;
        const buyer = sale?.buyer as any;
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
            buy_price: stock.buy_price ? Math.round(parseFloat(stock.buy_price as any)) : '',
            sell_price: stock.sell_price ? Math.round(parseFloat(stock.sell_price as any)) : '',
            sell_price_reseller: stock.sell_price_reseller ? Math.round(parseFloat(stock.sell_price_reseller as any)) : '',
            qty: stock.qty || 1,
            status: stock.status || 'available',
            default_charge_to: (stock as any).default_charge_to || 'buyer',
            buyer_name: buyer?.name || '',
            buyer_phone: buyer?.phone || '',
            buyer_address: buyer?.address || ''
        });
        setIsEditingStock(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStockDetail) return;
        editForm.put(route('stocks.update', selectedStockDetail.id), {
            onSuccess: () => {
                setIsEditingStock(false);
                setSelectedStockDetail(null);
                alert('Stok unit berhasil diperbarui!');
            }
        });
    };

    const handleDeleteStock = (stockId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus stok unit ini? Unit akan dimasukkan ke tempat sampah (Soft Delete).')) {
            router.delete(route('stocks.destroy', stockId), {
                onSuccess: () => {
                    setSelectedStockDetail(null);
                    alert('Stok unit berhasil dimasukkan ke tempat sampah!');
                }
            });
        }
    };

    const handleRestoreStock = (stockId: number) => {
        if (confirm('Apakah Anda yakin ingin memulihkan unit stok ini dari tempat sampah?')) {
            router.post(route('stocks.restore', stockId), {}, {
                onSuccess: () => {
                    setSelectedStockDetail(null);
                    alert('Stok unit berhasil dipulihkan!');
                }
            });
        }
    };

    const handleQuickRestoreToAvailable = (stock: StockItem) => {
        if (confirm('Apakah Anda yakin ingin membatalkan status TERJUAL unit ini? Unit akan kembali TERSEDIA (available) dan transaksi penjualan unit ini akan DIHAPUS.')) {
            router.put(route('stocks.update', stock.id), {
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
                warranty_duration_days: stock.warranty_duration_days || 0,
                buy_price: stock.buy_price ? Math.round(parseFloat(stock.buy_price as any)) : 0,
                sell_price: stock.sell_price ? Math.round(parseFloat(stock.sell_price as any)) : 0,
                sell_price_reseller: stock.sell_price_reseller ? Math.round(parseFloat(stock.sell_price_reseller as any)) : 0,
                qty: stock.qty || 1,
                status: 'available'
            }, {
                onSuccess: () => {
                    setSelectedStockDetail(null);
                    alert('Status unit berhasil dikembalikan ke Tersedia (Available) & data penjualan telah dihapus.');
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end w-full">
                        {!isAddingNewStock && !isEditingStock && (
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
                        {!isAddingNewStock && !isEditingStock && (
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-background"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="iphone">iPhone</option>
                                <option value="android">Android</option>
                                <option value="accessories">Aksesoris (Bulk)</option>
                                <option value="extra">Add-On / Jasa</option>
                            </select>
                        )}
                        {isSuperAdmin && !isAddingNewStock && !isEditingStock && (
                            <select
                                value={trashFilter}
                                onChange={(e) => setTrashFilter(e.target.value as any)}
                                className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-background"
                            >
                                <option value="active">Unit Aktif</option>
                                <option value="trash">Tempat Sampah (Trash)</option>
                            </select>
                        )}
                        {isSuperAdmin && !isAddingNewStock && !isEditingStock && (
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
                        
                        {!isAddingNewStock && !isEditingStock ? (
                            <button
                                onClick={() => setIsAddingNewStock(true)}
                                className="flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition shadow-md whitespace-nowrap shrink-0"
                                title="Tambah Stok"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setIsAddingNewStock(false);
                                    setIsEditingStock(false);
                                }}
                                className="flex items-center justify-center rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition shadow-sm whitespace-nowrap shrink-0 dark:bg-background"
                            >
                                Kembali
                            </button>
                        )}
                </div>
            }
        >
            <Head title="Sale Data" />

            <div className="pb-8 pt-2">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* TAB 1: LIST STOCKS */}
                    {!isAddingNewStock && !isEditingStock ? (
                        <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
                                               {/* Table Column */}
                            <div className={`rounded-none sm:rounded-lg border-x-0 sm:border border-y sm:border-y-0 border-border bg-transparent sm:bg-card shadow-none sm:shadow-sm text-card-foreground -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full transition-all duration-300 ${
                                selectedStockDetail ? 'hidden lg:block lg:w-2/3' : ''
                            }`}>
                                <div className="p-0 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0 pt-4 sm:pt-0 mb-4">
                                    <h3 className="text-lg font-black text-foreground">All Sale Data</h3>
                                </div>
                                
                                <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                                    <div style={{ minWidth: 'max-content', width: '100%' }}>
                                    <table className="w-full min-w-[1050px] text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border dark:border-input text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                                                <th onClick={() => requestSort('created_at')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Stock Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('name')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Product Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('sold_date')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Sold Date {sortConfig.key === 'sold_date' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('store')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Stock For {sortConfig.key === 'store' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('type')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('color')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Color {sortConfig.key === 'color' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('memory')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Memory {sortConfig.key === 'memory' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('serial_number')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Serial Number {sortConfig.key === 'serial_number' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('imei_1')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    IMEI {sortConfig.key === 'imei_1' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('license')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    License {sortConfig.key === 'license' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                {isSuperAdmin && (
                                                    <th onClick={() => requestSort('buy_price')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                        Buy Price {sortConfig.key === 'buy_price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                )}
                                                <th onClick={() => requestSort('sell_price')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Sell Price {sortConfig.key === 'sell_price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                {isSuperAdmin && (
                                                    <th onClick={() => requestSort('actual_sell_price')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                        Actual Sell {sortConfig.key === 'actual_sell_price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                )}
                                                {isSuperAdmin && (
                                                    <th onClick={() => requestSort('actual_affiliate_fee')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                        Affiliate Fee {sortConfig.key === 'actual_affiliate_fee' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                )}
                                                {isSuperAdmin && (
                                                    <th onClick={() => requestSort('actual_profit')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                        Profit {sortConfig.key === 'actual_profit' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                    </th>
                                                )}
                                                <th onClick={() => requestSort('sold_in')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Sold In {sortConfig.key === 'sold_in' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('affiliator')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Affiliator {sortConfig.key === 'affiliator' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('buyer')} className="pb-3 font-semibold px-3 whitespace-nowrap text-left cursor-pointer hover:text-foreground">
                                                    Buyer {sortConfig.key === 'buyer' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                                <th onClick={() => requestSort('status')} className="pb-3 font-semibold text-right px-3 whitespace-nowrap cursor-pointer hover:text-foreground">
                                                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            {sortedStocks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isSuperAdmin ? 19 : 15} className="py-8 text-center text-gray-400">Belum ada data unit dalam sistem.</td>
                                                </tr>
                                            ) : (() => {
                                                // Sort: available/transit first, sold second, trash last
                                                const displayItems = [...sortedStocks].sort((a, b) => {
                                                    const order = { 'available': 1, 'transit': 2, 'sold': 3 };
                                                    const aOrder = a.deleted_at ? 4 : (order[a.status as keyof typeof order] || 4);
                                                    const bOrder = b.deleted_at ? 4 : (order[b.status as keyof typeof order] || 4);
                                                    return aOrder - bOrder;
                                                });
                                                const itemsPerPage = 50;
                                                const paginatedItems = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                                                return paginatedItems.map((item, idx) => {
                                                    const absoluteIdx = (currentPage - 1) * itemsPerPage + idx;
                                                    const prevItem = absoluteIdx > 0 ? displayItems[absoluteIdx - 1] : null;
                                                    const isFirstItem = absoluteIdx === 0;
                                                    // Show available header: first item AND it's available/transit (not sold, not trash)
                                                    const showAvailableHeader = isFirstItem && !item.deleted_at && item.status !== 'sold';
                                                    // Show sold divider: when transitioning from non-sold to sold, OR if first item is already sold
                                                    const showSoldDivider = !item.deleted_at && item.status === 'sold' && (
                                                        isFirstItem || (prevItem && prevItem.status !== 'sold' && !prevItem.deleted_at)
                                                    );
                                                    // Show trash divider: when transitioning from non-trash to trash, OR if first item is trash
                                                    const showTrashDivider = !!item.deleted_at && (
                                                        isFirstItem || (prevItem && !prevItem.deleted_at)
                                                    );

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
                                                        <Fragment key={item.id}>
                                                            {showAvailableHeader && (
                                                                <tr className="select-none">
                                                                    <td colSpan={isSuperAdmin ? 19 : 15} className="py-0">
                                                                        <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 border-y border-emerald-200 dark:border-emerald-900/50">
                                                                            <div className="w-1 h-5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                                            <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                                                                                ✓ Unit Tersedia (Available)
                                                                            </span>
                                                                            <div className="ml-auto text-[10px] font-bold text-emerald-500/60">
                                                                                {displayItems.filter(i => !i.deleted_at && i.status !== 'sold').length} unit
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {showSoldDivider && (
                                                                <tr className="select-none">
                                                                    <td colSpan={isSuperAdmin ? 19 : 15} className="py-0">
                                                                        <div className="flex items-center gap-3 px-3 py-2 bg-rose-500/10 border-y border-rose-200 dark:border-rose-900/50">
                                                                            <div className="w-1 h-5 rounded-full bg-rose-500 flex-shrink-0" />
                                                                            <span className="text-[11px] font-black tracking-wider uppercase text-rose-700 dark:text-rose-400">
                                                                                ✗ Unit Sudah Terjual (Sold)
                                                                            </span>
                                                                            <div className="ml-auto text-[10px] font-bold text-rose-500/60">
                                                                                {displayItems.filter(i => !i.deleted_at && i.status === 'sold').length} unit
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {showTrashDivider && (
                                                                <tr className="select-none">
                                                                    <td colSpan={isSuperAdmin ? 19 : 15} className="py-0">
                                                                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-500/10 border-y border-gray-200 dark:border-gray-800">
                                                                            <div className="w-1 h-5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span className="text-[11px] font-black tracking-wider uppercase text-gray-600 dark:text-gray-400">
                                                                                ⊘ Unit di Tempat Sampah (Trash)
                                                                            </span>
                                                                            <div className="ml-auto text-[10px] font-bold text-gray-400/60">
                                                                                {displayItems.filter(i => !!i.deleted_at).length} unit
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr 
                                                                onClick={() => setSelectedStockDetail(item)}
                                                                className={`cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors ${
                                                                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                                                }`}
                                                            >
                                                                <td className="py-4 px-3 font-medium whitespace-nowrap text-left">{stockDate}</td>
                                                                <td className="py-4 px-3 font-bold text-xs whitespace-nowrap text-left">{item.name}</td>
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
                                                                        item.deleted_at
                                                                            ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                                                                            : item.status === 'available' 
                                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                                                : item.status === 'transit' 
                                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                                    }`}>
                                                                        {item.deleted_at ? 'TRASH' : item.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </Fragment>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                                
                                {/* Pagination Controls */}
                                {Math.ceil(sortedStocks.length / 50) > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-border dark:border-input px-4 sm:px-0 pb-4 sm:pb-0">
                                        <div className="text-xs text-gray-500 font-medium">
                                            Menampilkan <span className="font-bold text-foreground">{Math.min(sortedStocks.length, (currentPage - 1) * 50 + 1)}</span> - <span className="font-bold text-foreground">{Math.min(sortedStocks.length, currentPage * 50)}</span> dari <span className="font-bold text-foreground">{sortedStocks.length}</span> unit
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3.5 py-2 rounded-xl border border-input bg-card text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 transition shadow-sm dark:bg-background"
                                            >
                                                Sebelumnya
                                            </button>
                                            {(() => {
                                                const totalPages = Math.ceil(sortedStocks.length / 50);
                                                const pages = [];
                                                const maxVisible = 5;
                                                let start = Math.max(1, currentPage - 2);
                                                let end = Math.min(totalPages, start + maxVisible - 1);
                                                if (end - start + 1 < maxVisible) {
                                                    start = Math.max(1, end - maxVisible + 1);
                                                }
                                                for (let i = start; i <= end; i++) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i)}
                                                            className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                                                                currentPage === i
                                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                                    : 'border border-input bg-card text-foreground hover:bg-muted shadow-sm dark:bg-background'
                                                            }`}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                }
                                                return pages;
                                            })()}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedStocks.length / 50), prev + 1))}
                                                disabled={currentPage === Math.ceil(sortedStocks.length / 50)}
                                                className="px-3.5 py-2 rounded-xl border border-input bg-card text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40 transition shadow-sm dark:bg-background"
                                            >
                                                Berikutnya
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>
 
                            {/* Detail Panel */}
                            {selectedStockDetail && (
                                <div className="w-full lg:w-1/3 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground space-y-6 self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto transition-all duration-300">
                                    
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
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-muted rounded-lg text-lg transition-colors font-bold"
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
                                            {selectedStockDetail.deleted_at ? (
                                                <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
                                                    TRASH / TERHAPUS
                                                </span>
                                            ) : (
                                                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    selectedStockDetail.status === 'available' 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                        : selectedStockDetail.status === 'transit' 
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                }`}>
                                                    {selectedStockDetail.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Cabang</span>
                                            <span className="text-right font-bold text-foreground">{selectedStockDetail.store?.name || 'Gudang Utama'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                            <span className="text-gray-400 uppercase text-[10px]">Kategori</span>
                                            <span className="text-right capitalize text-foreground">{selectedStockDetail.category === 'extra' ? 'Add-On / Jasa' : selectedStockDetail.category}</span>
                                        </div>
                                        {selectedStockDetail.category !== 'extra' && (
                                            <>
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
                                            </>
                                        )}
                                        
                                        {canSeeFinancials && (
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

                                        {canSeeFinancials && (
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Ekspetasi Profit</span>
                                                <span className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency((selectedStockDetail.sell_price - selectedStockDetail.buy_price) * selectedStockDetail.qty)}
                                                </span>
                                            </div>
                                        )}

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
                                        <div className="space-y-2 pt-4 border-t border-border dark:border-input">
                                            {selectedStockDetail.status === 'sold' && !selectedStockDetail.deleted_at && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickRestoreToAvailable(selectedStockDetail)}
                                                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                                                >
                                                    <RotateCcw className="h-4 w-4" /> Kembalikan ke Ready Stock
                                                </button>
                                            )}
                                            <div className="flex gap-3">
                                                {selectedStockDetail.deleted_at ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreStock(selectedStockDetail.id)}
                                                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                                    >
                                                        Restore Unit
                                                    </button>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : isAddingNewStock ? (
                        <div className="rounded-none sm:rounded-lg border-x-0 sm:border border-y-0 sm:border-y bg-transparent sm:bg-card p-0 sm:p-6 shadow-none sm:shadow-sm text-card-foreground">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Tambah Stok Unit Baru</h3>
                            
                            <form onSubmit={submitSingle} className="space-y-6">
                                {Object.keys(singleForm.errors).length > 0 && (
                                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4 text-xs font-bold text-rose-600 dark:text-rose-400 space-y-1.5">
                                        <p className="text-sm font-extrabold">Gagal menyimpan! Periksa kolom berikut:</p>
                                        {Object.entries(singleForm.errors).map(([key, err]) => (
                                            <div key={key}>• {key}: {err}</div>
                                        ))}
                                    </div>
                                )}
                                {/* Section 1: Lokasi & Kategori */}
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
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
                                                {singleForm.data.category === 'extra' && (
                                                    <option value="all">Semua Cabang</option>
                                                )}
                                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kategori Barang</label>
                                            <select
                                                value={singleForm.data.category}
                                                onChange={e => {
                                                    const cat = e.target.value as any;
                                                    singleForm.setData(data => ({
                                                        ...data,
                                                        category: cat,
                                                        store_id: cat === 'extra' ? 'all' : ((data.store_id === 'all') ? (stores[0]?.id || '') : data.store_id)
                                                    }));
                                                }}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                <option value="iphone">iPhone</option>
                                                <option value="android">Android</option>
                                                <option value="accessories">Aksesoris (Bulk)</option>
                                                <option value="extra">Jasa / Add-on (Layanan)</option>
                                            </select>
                                        </div>
                                        {singleForm.data.category !== 'extra' && (
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
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Spesifikasi & Identitas */}
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">2. Detail Spesifikasi & Identitas Barang</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk / Jasa</label>
                                            <input
                                                type="text"
                                                required
                                                list="product-names-list"
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
                                                        onChange={e => singleForm.setData('serial_number', e.target.value.toUpperCase())}
                                                        className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold uppercase dark:bg-background ${singleForm.errors.serial_number ? 'border-rose-400' : 'border-input dark:border-input'}`}
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
                                                            inputMode="numeric"
                                                            value={singleForm.data.imei_1}
                                                            onChange={e => singleForm.setData('imei_1', e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`flex-1 rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.imei_1 ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                                            placeholder="Scan atau ketik IMEI"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsScannerOpen(true)}
                                                            title="Scan IMEI dengan kamera"
                                                            className="rounded-xl border border-input bg-muted px-3 py-2 text-gray-500 hover:bg-accent transition"
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {singleForm.errors.imei_1 && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.imei_1}</p>}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Klik ikon QR untuk scan pakai kamera, atau fokus ke kolom untuk scan dengan scanner fisik.</p>
                                                </div>
                                            </>
                                        )}
 
                                        {/* Accessories Color selection */}
                                        {singleForm.data.category === 'accessories' && (
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
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
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
                                                type="text"
                                                required
                                                inputMode="numeric"
                                                value={singleForm.data.warranty_duration_days}
                                                onChange={e => singleForm.setData('warranty_duration_days', parseInt(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                        {(singleForm.data.category === 'accessories' || singleForm.data.category === 'extra') && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Quantity (Stok)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    inputMode="numeric"
                                                    value={singleForm.data.qty}
                                                    onChange={e => singleForm.setData('qty', parseInt(e.target.value) || 1)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                />
                                            </div>
                                        )}
                                        {singleForm.data.category === 'extra' && (
                                            <div className="sm:col-span-2 lg:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                                    Tanggung Biaya Default
                                                    <span className="ml-1 normal-case font-normal text-gray-400">(otomatis dipilih saat checkout)</span>
                                                </label>
                                                <select
                                                    value={singleForm.data.default_charge_to}
                                                    onChange={e => singleForm.setData('default_charge_to', e.target.value as any)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                >
                                                    <option value="buyer">Buyer (Pembeli Bayar)</option>
                                                    <option value="seller">Toko Tanggung (HPP)</option>
                                                    <option value="free_promotion">Promosi Free (Gratis)</option>
                                                </select>
                                                <p className="text-[10px] text-gray-400 mt-1">Pilihan ini akan muncul otomatis terisi saat add-on ini dipilih di form checkout — tidak perlu pilih ulang.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Modal Beli (HPP)</label>
                                            <input
                                                type="text"
                                                required
                                                inputMode="decimal"
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
                                                type="text"
                                                required
                                                inputMode="decimal"
                                                value={singleForm.data.sell_price ?? ''}
                                                onChange={e => singleForm.setData('sell_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="Masukkan harga jual"
                                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold dark:bg-background ${singleForm.errors.sell_price ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            />
                                            {singleForm.errors.sell_price && <p className="mt-1 text-xs text-rose-500">{singleForm.errors.sell_price}</p>}
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
                    ) : (
                        <div className="rounded-none sm:rounded-lg border-x-0 sm:border border-y-0 sm:border-y bg-transparent sm:bg-card p-0 sm:p-6 shadow-none sm:shadow-sm text-card-foreground">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Edit Unit Stok</h3>

                            <form onSubmit={submitEdit} className="space-y-6">
                                {/* Section 1: Lokasi & Kategori */}
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">1. Lokasi & Kategori Unit</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang Toko</label>
                                            <select
                                                required
                                                value={editForm.data.store_id}
                                                onChange={e => editForm.setData('store_id', e.target.value)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                {editForm.data.category === 'extra' && (
                                                    <option value="all">Semua Cabang</option>
                                                )}
                                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kategori Barang</label>
                                            <select
                                                value={editForm.data.category}
                                                onChange={e => {
                                                    const cat = e.target.value as any;
                                                    editForm.setData(data => ({
                                                        ...data,
                                                        category: cat,
                                                        store_id: cat === 'extra' ? 'all' : ((data.store_id === 'all') ? (stores[0]?.id || '') : data.store_id)
                                                    }));
                                                }}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            >
                                                <option value="iphone">iPhone</option>
                                                <option value="android">Android</option>
                                                <option value="accessories">Aksesoris (Bulk)</option>
                                                <option value="extra">Jasa / Add-on (Layanan)</option>
                                            </select>
                                        </div>
                                        {editForm.data.category !== 'extra' && (
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
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Spesifikasi & Identitas */}
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">2. Detail Spesifikasi & Identitas Barang</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Produk / Jasa</label>
                                            <input
                                                type="text"
                                                required
                                                list="product-names-list"
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
                                                        onChange={e => editForm.setData('serial_number', e.target.value.toUpperCase())}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold uppercase dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">IMEI</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={editForm.data.imei_1}
                                                        onChange={e => editForm.setData('imei_1', e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {editForm.data.category === 'accessories' && (
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
                                <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">3. Finansial, Garansi & Distribusi</h4>
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
                                                inputMode="numeric"
                                                value={editForm.data.warranty_duration_days}
                                                onChange={e => editForm.setData('warranty_duration_days', parseInt(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                        {(editForm.data.category === 'accessories' || editForm.data.category === 'extra') && (
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Quantity (Stok)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={1}
                                                    inputMode="numeric"
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

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Harga Beli (HPP)</label>
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                inputMode="numeric"
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
                                                inputMode="numeric"
                                                value={editForm.data.sell_price}
                                                onChange={e => editForm.setData('sell_price', parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {editForm.data.status === 'sold' && (
                                    <div className="p-0 sm:p-4 rounded-none sm:rounded-xl border-0 sm:border border-transparent sm:border-border dark:sm:border-input bg-transparent sm:bg-muted/20 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">4. Informasi Pembeli / Pelanggan</h4>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Pembeli</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editForm.data.buyer_name || ''}
                                                    onChange={e => editForm.setData('buyer_name', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    placeholder="Nama Pembeli"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">No. HP / WA Pembeli</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editForm.data.buyer_phone || ''}
                                                    onChange={e => editForm.setData('buyer_phone', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    placeholder="Contoh: 081234567890"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Alamat Pembeli</label>
                                                <textarea
                                                    value={editForm.data.buyer_address || ''}
                                                    onChange={e => editForm.setData('buyer_address', e.target.value)}
                                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                    placeholder="Alamat Pembeli (Opsional)"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-border dark:border-input justify-end">
                                    <button type="button" onClick={() => setIsEditingStock(false)} className="rounded-xl border border-input px-6 py-3 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={editForm.processing} className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition">
                                        {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <datalist id="product-names-list">
                        {uniqueProductNames.map(name => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                </div>
            </div>

            {/* ── CAMERA SCANNER MODAL ── */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-xl dark:bg-background border dark:border-input space-y-4">
                        <style>{`
                            #reader {
                                width: 100% !important;
                                height: 100% !important;
                            }
                            #reader video {
                                width: 100% !important;
                                height: 100% !important;
                                object-fit: cover !important;
                            }
                            #reader__border_path {
                                stroke: transparent !important;
                            }
                            #reader__scan_region {
                                border: none !important;
                            }
                        `}</style>
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Scan IMEI / Barcode</h4>
                            <button
                                type="button"
                                onClick={closeScanner}
                                className="text-gray-400 hover:text-foreground text-xs font-bold"
                            >
                                Tutup
                            </button>
                        </div>
                        
                        <p className="text-[10px] text-gray-400 leading-normal">
                            Arahkan kamera belakang HP ke barcode IMEI. Pastikan cahaya cukup dan barcode berada di dalam kotak area scan.
                        </p>

                        <div className="relative border border-input rounded-xl overflow-hidden bg-black h-64 sm:h-72 w-full flex items-center justify-center">
                            <div id="reader" className="w-full h-full"></div>
                            
                            {/* Scanning Overlays */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {/* Dimmed layer with centered clean viewport */}
                                <div className="w-[85%] h-[40%] border-2 border-indigo-500 rounded-lg relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br" />
                                    
                                    {/* Scanning laser animation */}
                                    <div className="w-[95%] h-0.5 bg-indigo-400 shadow-[0_0_6px_#818cf8] absolute animate-bounce" />
                                </div>
                            </div>

                            {scannerError && (
                                <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 text-center">
                                    <p className="text-xs text-rose-400 font-bold">{scannerError}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={closeScanner}
                                className="w-full rounded-xl border border-input py-2 text-xs font-semibold text-gray-500 hover:bg-muted"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

