import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
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
    Share2,
    QrCode,
    MessageCircle,
    Send,
    ExternalLink,
    Filter
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
    default_charge_to?: 'buyer' | 'seller' | 'free_promotion';
    brand?: { value: string };
    color?: { value: string };
    memory?: { value: string };
    license?: { value: string };
}

interface Buyer {
    id: number;
    name: string;
    phone: string;
    address: string | null;
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
    buyers?: Buyer[];
    filters: {
        store_id: string | null;
    };
}

// Phone normalizer: strips non-numeric, converts +62/62 to 08...
const normalizePhone = (raw: string): string => {
    let phone = raw.replace(/[^\d+]/g, '');
    if (phone.startsWith('+62')) phone = '0' + phone.slice(3);
    else if (phone.startsWith('62') && phone.length > 10) phone = '0' + phone.slice(2);
    return phone;
};

// Convert local 08xxx to WA format 628xxx
const toWANumber = (phone: string): string => {
    const clean = normalizePhone(phone);
    if (clean.startsWith('0')) return '62' + clean.slice(1);
    return clean;
};

export default function ReadyStock({ stocks, stores, transfers, storesFilter, parameters, users = [], buyers = [], filters }: ReadyStockProps) {
    const authUser = usePage().props.auth.user as any;
    
    // Search and Category Tabs
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'iphone' | 'android' | 'accessories' | 'extra'>('all');
    const [storeFilterId, setStoreFilterId] = useState(filters.store_id || '');
    const [showFilters, setShowFilters] = useState(false);

    // Modals
    const [selectedStockDetail, setSelectedStockDetail] = useState<StockItem | null>(null);
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [showBuyerSearchModal, setShowBuyerSearchModal] = useState(false);
    const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
    // Success modal with WA/invoice
    const [successData, setSuccessData] = useState<{ invoiceNumber: string; buyerPhone: string; buyerName: string; total: number } | null>(null);

    // Barcode scanner ref
    const imeiInputRef = useRef<HTMLInputElement>(null);

    // Dynamic Lists for checkout dropdowns
    const brandOptions = parameters.find(p => p.name.toLowerCase() === 'brand' || p.name.toLowerCase() === 'merek')?.values || [];
    const colorOptions = parameters.find(p => p.name.toLowerCase() === 'warna')?.values || [];
    const memoryOptions = parameters.find(p => p.name.toLowerCase() === 'kapasitas memori' || p.name.toLowerCase() === 'memori')?.values || [];
    const licenseOptions = parameters.find(p => p.name.toLowerCase() === 'tipe lisensi' || p.name.toLowerCase() === 'lisensi')?.values || [];

    // Filter available Extra add-ons
    const extraAddons = stocks.filter(s => s.category === 'extra' && s.status === 'available');

    // Filter old customers based on modal search input
    const filteredBuyers = buyers.filter(b => 
        b.name.toLowerCase().includes(buyerSearchQuery.toLowerCase()) ||
        b.phone.includes(buyerSearchQuery)
    );

    const getLocalDateTimeString = () => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    };

    // Checkout Form — prices are strings to avoid "0" prefill issue
    const checkoutForm = useForm({
        store_id: '' as string | number,
        buyer_name: '',
        buyer_phone: '',
        buyer_address: '',
        payment_method: 'cash' as 'cash' | 'online',
        payment_detail: '',
        dp_amount: '' as string | number,
        status: 'completed' as 'booking' | 'completed',
        affiliate_user_id: '' as string | number,
        affiliate_fee: '' as string | number,
        transaction_date: getLocalDateTimeString(),
        items: [] as Array<{ stock_id: number; qty: number; actual_sell_price: string | number }>,
        trade_in: null as null | {
            name: string;
            brand_id: number | string;
            color_id: number | string;
            memory_id: number | string;
            license_id: number | string;
            serial_number: string;
            imei_1: string;
            buy_price: string | number;
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
        const matchesCategory = activeTab === 'all' 
            ? (item.category !== 'extra' && item.category !== 'accessories') 
            : item.category === activeTab;
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
            store_id: stock.store_id || '',
            buyer_name: '',
            buyer_phone: '',
            buyer_address: '',
            payment_method: 'cash',
            payment_detail: '',
            dp_amount: '',
            status: 'completed',
            affiliate_user_id: '',
            affiliate_fee: '',
            transaction_date: getLocalDateTimeString(),
            items: [{ stock_id: stock.id, qty: 1, actual_sell_price: stock.sell_price }],
            trade_in: null,
            extras: []
        });
        setIsCheckoutOpen(true);
    };

    // Global Keydown Barcode Scanner Listener
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if checkout modal is already open
            if (isCheckoutOpen) return;

            // Ignore if active element is a form input (unless it's the search input, where we handle Enter)
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
            
            // Ignore if inside an active form input
            if (isInput && target.id !== 'search-ready-stock-input') {
                return;
            }

            const currentTime = Date.now();
            
            // Barcode scanners type very quickly (usually less than 80ms between keys)
            if (currentTime - lastKeyTime > 80) {
                buffer = ''; // Reset buffer if manual typing
            }

            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length > 3) {
                    const cleanCode = buffer.trim();
                    const found = stocks.find(item => 
                        (item.serial_number && item.serial_number.toLowerCase() === cleanCode.toLowerCase()) ||
                        (item.imei_1 && item.imei_1 === cleanCode) ||
                        (item.imei_2 && item.imei_2 === cleanCode)
                    );
                    if (found) {
                        e.preventDefault();
                        openCheckout(found);
                    }
                    buffer = '';
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [stocks, isCheckoutOpen]);

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

    // Handle Checkout submit — after success show WA/Invoice modal
    const submitCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        // Grab data before submit for success modal
        const buyerName = checkoutForm.data.buyer_name;
        const buyerPhone = checkoutForm.data.buyer_phone;
        const total = calculateTotal();
        
        checkoutForm.post(route('sales.checkout'), {
            onSuccess: (page) => {
                setIsCheckoutOpen(false);
                setSelectedStock(null);
                // Try to extract invoice number from flash or generate a placeholder
                const flash = (page.props as any).flash;
                const invoiceNumber = flash?.invoice_number || '';
                setSuccessData({ invoiceNumber, buyerPhone, buyerName, total });
            },
            onError: () => {
                // Errors shown inline via checkoutForm.errors
            }
        });
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
                serial_number: '',
                imei_1: '',
                buy_price: ''
            });
        }
    };

    // Toggle Addon Extra
    const toggleAddon = (addon: StockItem) => {
        const exists = checkoutForm.data.extras.find(e => e.extra_id === addon.id);
        if (exists) {
            checkoutForm.setData('extras', checkoutForm.data.extras.filter(e => e.extra_id !== addon.id));
        } else {
            // Use the addon's default_charge_to if set, otherwise default to 'buyer'
            const defaultCharge = addon.default_charge_to || 'buyer';
            checkoutForm.setData('extras', [
                ...checkoutForm.data.extras,
                { extra_id: addon.id, charge_to: defaultCharge, sell_price: addon.sell_price, buy_price: addon.buy_price }
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
                addonsCost += Number(e.sell_price) || 0;
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(cleanVal);
    };

    const formatNumberInput = (val: string | number) => {
        if (val === undefined || val === null || val === '') return '';
        const num = val.toString().replace(/[^0-9]/g, '');
        if (!num) return '';
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(num));
    };

    const renderBadges = (item: StockItem) => {
        return (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {item.category !== 'accessories' && item.category !== 'extra' && (
                    <>
                        {item.type === 'new' ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                ✦ BARU
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                BEKAS
                            </span>
                        )}
                    </>
                )}
                {item.memory?.value && (
                    <span className="inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 dark:text-gray-400 border dark:border-gray-700">
                        {item.memory.value}
                    </span>
                )}
                {item.license?.value && (
                    <span className="inline-flex items-center rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {item.license.value}
                    </span>
                )}
            </div>
        );
    };

    // Select existing buyer
    const selectBuyer = (buyer: Buyer) => {
        checkoutForm.setData({
            ...checkoutForm.data,
            buyer_name: buyer.name,
            buyer_phone: buyer.phone,
            buyer_address: buyer.address || '',
        });
    };

    // WA helpers
    const openWAChat = (phone: string, buyerName: string) => {
        const waNum = toWANumber(phone);
        const msg = encodeURIComponent(`Halo ${buyerName}! Terima kasih sudah berbelanja di toko kami. 😊`);
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
    };

    const openWAInvoice = (phone: string, buyerName: string, invoiceNumber: string, total: number) => {
        const waNum = toWANumber(phone);
        const invoiceUrl = `${window.location.origin}/invoice/${invoiceNumber}`;
        const msg = encodeURIComponent(
            `Halo ${buyerName}! 🛍️\n\nTerima kasih sudah berbelanja di toko kami.\n\n` +
            `*Invoice:* ${invoiceNumber}\n*Total:* ${formatCurrency(total)}\n\n` +
            `Lihat invoice online Anda di:\n${invoiceUrl}\n\nSalam,\nTim Toko`
        );
        window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Selling" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Search & Actions Row */}
                    <div className="flex items-stretch gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <input
                                id="search-ready-stock-input"
                                type="text"
                                placeholder="Cari nama, serial number, IMEI..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim().length > 3) {
                                        const cleanQuery = searchQuery.trim().toLowerCase();
                                        const found = stocks.find(item => 
                                            (item.serial_number && item.serial_number.toLowerCase() === cleanQuery) ||
                                            (item.imei_1 && item.imei_1 === cleanQuery) ||
                                            (item.imei_2 && item.imei_2 === cleanQuery)
                                        );
                                        if (found) {
                                            e.preventDefault();
                                            openCheckout(found);
                                        }
                                    }
                                }}
                                className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-background"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center px-3 rounded-xl border transition shrink-0 ${
                                showFilters
                                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                                    : 'bg-card dark:bg-background hover:bg-muted border-input text-foreground'
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Expandable Filter Panel */}
                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-sm transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Kategori</label>
                                    <select
                                        value={activeTab}
                                        onChange={(e) => setActiveTab(e.target.value as any)}
                                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="all">Semua Stok</option>
                                        <option value="iphone">iPhone</option>
                                        <option value="android">Android</option>
                                        <option value="accessories">Accessories</option>
                                        <option value="extra">Add-On / Jasa</option>
                                    </select>
                                </div>

                                {authUser.role === 'superadmin' && (
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[10px] font-extrabold uppercase text-gray-400 mb-1">Cabang</label>
                                        <select
                                            value={storeFilterId}
                                            onChange={(e) => {
                                                setStoreFilterId(e.target.value);
                                                window.location.href = route('selling.index', { store_id: e.target.value });
                                            }}
                                            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">Semua Cabang</option>
                                            {storesFilter.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}                    {/* Stock Table & Detail Split Panel */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Table Column */}
                        <div className={`rounded-none sm:rounded-lg border-x-0 sm:border border-y sm:border-y-0 border-border bg-transparent sm:bg-card shadow-none sm:shadow-sm text-card-foreground -mx-4 sm:mx-0 transition-all duration-300 ${
                            selectedStockDetail ? 'hidden lg:block lg:col-span-2' : 'col-span-1 lg:col-span-3'
                        }`}>
                            <div className="p-0 sm:p-6">
                                {/* Mobile View (Stacked Cards) */}
                                <div className="md:hidden space-y-3 px-4 py-2">
                                    {filteredStocks.length === 0 ? (
                                        <div className="py-8 text-center text-gray-400">
                                            Stok unit tidak ditemukan.
                                        </div>
                                    ) : (
                                        filteredStocks.map((item) => {
                                            const isSelected = selectedStockDetail?.id === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedStockDetail(item)}
                                                    className={`p-4 rounded-xl border border-border bg-card/45 dark:bg-gray-900/10 hover:bg-muted/30 dark:hover:bg-gray-900/30 transition cursor-pointer space-y-2 ${
                                                        isSelected ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-foreground truncate block text-sm" title={item.name}>
                                                                {item.name} {item.color?.value ? `(${item.color.value})` : ''}
                                                            </p>
                                                            {renderBadges(item)}
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                                                                {item.category !== 'accessories' && item.category !== 'extra'
                                                                    ? `${item.serial_number || item.imei_1 || '-'} (${item.license?.value || item.supplier || 'N/A'})`
                                                                    : `${item.category} • ${item.brand?.value || '-'}`
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                                {formatCurrency(item.sell_price)}
                                                            </p>
                                                            <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                                                                Stok: {item.qty} Pcs
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full min-w-0 text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                                <th className="pb-3 px-4 font-semibold text-left">Unit</th>
                                                <th className="pb-3 px-4 font-semibold text-left">Harga</th>
                                                <th className="pb-3 px-4 font-semibold text-center">Stok</th>
                                                {authUser.role !== 'viewer' && <th className="pb-3 px-4 font-semibold text-right">Aksi</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {filteredStocks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-gray-400 px-4">
                                                        Stok unit tidak ditemukan.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStocks.map((item) => {
                                                    const isSelected = selectedStockDetail?.id === item.id;
                                                    return (
                                                        <tr 
                                                            key={item.id} 
                                                            onClick={() => setSelectedStockDetail(item)}
                                                            className={`cursor-pointer transition duration-150 hover:bg-muted/50 dark:hover:bg-gray-900/50 ${
                                                                isSelected ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : ''
                                                            }`}
                                                        >
                                                            <td className="py-2.5 px-4 text-left">
                                                                <p className="font-semibold text-foreground truncate block max-w-xs" title={item.name}>
                                                                    {item.name} {item.color?.value ? `(${item.color.value})` : ''}
                                                                </p>
                                                                {renderBadges(item)}
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate max-w-xs">
                                                                    {item.category !== 'accessories' && item.category !== 'extra'
                                                                        ? `${item.serial_number || item.imei_1 || '-'} (${item.license?.value || item.supplier || 'N/A'})`
                                                                        : `${item.category} • ${item.brand?.value || '-'}`
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td className="py-2.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap text-left">
                                                                {formatCurrency(item.sell_price)}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-center font-bold whitespace-nowrap">
                                                                {item.qty} Pcs
                                                            </td>
                                                            {authUser.role !== 'viewer' && (
                                                                <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <button
                                                                            onClick={() => openCheckout(item)}
                                                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition whitespace-nowrap"
                                                                        >
                                                                            Jual
                                                                        </button>
                                                                        {authUser.role === 'superadmin' && (
                                                                            <button
                                                                                onClick={() => openTransfer(item)}
                                                                                className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-muted dark:border-input dark:text-gray-300 dark:hover:bg-gray-900 transition whitespace-nowrap"
                                                                            >
                                                                                Mutasi
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Detail Panel Column */}
                        {selectedStockDetail && (
                            <div className="w-full lg:col-span-1 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground space-y-6 self-start lg:sticky lg:top-4 transition-all duration-300">
                                {/* Header / Breadcrumb & Close Button */}
                                <div className="flex items-center justify-between border-b border-border dark:border-input pb-3">
                                    <nav className="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 overflow-hidden" aria-label="Breadcrumb">
                                        <span className="hover:text-foreground cursor-pointer whitespace-nowrap" onClick={() => setSelectedStockDetail(null)}>Selling</span>
                                        <span className="mx-1.5 flex-shrink-0">/</span>
                                        <span className="hover:text-foreground cursor-pointer whitespace-nowrap" onClick={() => setSelectedStockDetail(null)}>Detail</span>
                                        <span className="mx-1.5 flex-shrink-0">/</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]" title={selectedStockDetail.name}>
                                            {selectedStockDetail.name} {selectedStockDetail.color?.value ? `${selectedStockDetail.color.value}` : ''} {selectedStockDetail.memory?.value ? `/ ${selectedStockDetail.memory.value}` : ''}
                                        </span>
                                    </nav>
                                    <button 
                                        onClick={() => setSelectedStockDetail(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-muted rounded-lg text-lg transition-colors font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Content Info */}
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">
                                        {selectedStockDetail.name} {selectedStockDetail.color?.value ? `${selectedStockDetail.color.value}` : ''} {selectedStockDetail.memory?.value ? `/ ${selectedStockDetail.memory.value}` : ''}
                                    </h4>
                                    <div className="flex gap-2 mt-2">
                                        <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            {selectedStockDetail.type}
                                        </span>
                                        <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Available
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-gray-400 uppercase text-[10px]">Kategori</span>
                                        <span className="text-right capitalize text-foreground">{selectedStockDetail.category === 'extra' ? 'Add-On / Jasa' : selectedStockDetail.category}</span>
                                    </div>
                                    {selectedStockDetail.category !== 'extra' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Merek</span>
                                                <span className="text-right text-foreground">{selectedStockDetail.brand?.value || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Warna</span>
                                                <span className="text-right text-foreground">{selectedStockDetail.color?.value || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Memori</span>
                                                <span className="text-right text-foreground">{selectedStockDetail.memory?.value || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Lisensi / Sinyal</span>
                                                <span className="text-right text-foreground">{selectedStockDetail.license?.value || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Serial Number</span>
                                                <span className="text-right font-mono text-foreground">{selectedStockDetail.serial_number || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">IMEI</span>
                                                <span className="text-right font-mono text-foreground">{selectedStockDetail.imei_1 || '-'}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-gray-400 uppercase text-[10px]">Harga Jual</span>
                                        <span className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(selectedStockDetail.sell_price)}
                                        </span>
                                    </div>
                                    {['superadmin', 'viewer'].includes(authUser.role) && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Harga Beli (HPP)</span>
                                                <span className="text-right font-semibold text-foreground">
                                                    {formatCurrency(selectedStockDetail.buy_price)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                                <span className="text-gray-400 uppercase text-[10px]">Ekspetasi Profit</span>
                                                <span className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency((selectedStockDetail.sell_price - selectedStockDetail.buy_price) * selectedStockDetail.qty)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-gray-400 uppercase text-[10px]">Garansi</span>
                                        <span className="text-right text-foreground">{selectedStockDetail.warranty_duration_days} Hari</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-gray-400 uppercase text-[10px]">Supplier</span>
                                        <span className="text-right text-foreground">{selectedStockDetail.supplier || '-'}</span>
                                    </div>
                                </div>

                                {authUser.role !== 'viewer' && (
                                    <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                        <button
                                            onClick={() => openCheckout(selectedStockDetail)}
                                            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                        >
                                            Proses Jual
                                        </button>
                                        {authUser.role === 'superadmin' && (
                                            <button
                                                onClick={() => openTransfer(selectedStockDetail)}
                                                className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-700 hover:bg-muted dark:border-input dark:text-gray-300 dark:hover:bg-gray-900 transition"
                                            >
                                                Mutasi
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Transfer Modal */}
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
                                <button type="button" onClick={() => setIsTransferOpen(false)} className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input dark:hover:bg-gray-950">
                                    Batal
                                </button>
                                <button type="submit" disabled={transferForm.processing} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition">
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
                                <p className="text-xs text-gray-400">Unit: {selectedStock.name} {selectedStock.color?.value ? `${selectedStock.color.value}` : ''} {selectedStock.memory?.value ? `/ ${selectedStock.memory.value}` : ''} ({selectedStock.serial_number || selectedStock.imei_1 || '-'})</p>
                            </div>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-muted rounded-lg text-lg transition-colors">✕</button>
                        </div>

                        {/* Global/Validation Errors List */}
                        {Object.keys(checkoutForm.errors).length > 0 && (
                            <div className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 text-xs font-bold text-rose-600 dark:text-rose-400 space-y-1">
                                {Object.entries(checkoutForm.errors).map(([key, err]) => (
                                    <div key={key}>• {err}</div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={submitCheckout} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Branch Selection (Superadmin only) */}
                            {authUser.role === 'superadmin' && (
                                <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 space-y-2">
                                    <label className="block text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                                        Cabang Penjualan (Superadmin Only)
                                    </label>
                                    <select
                                        required
                                        value={checkoutForm.data.store_id}
                                        onChange={e => checkoutForm.setData('store_id', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                    >
                                        <option value="">-- Pilih Cabang --</option>
                                        {storesFilter.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Buyer Info */}
                            <div className="space-y-4">
                                <h5 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <User className="h-4 w-4" /> Data Pelanggan
                                </h5>

                                {/* Existing Buyer Search Button */}
                                {buyers.length > 0 && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBuyerSearchQuery('');
                                                setShowBuyerSearchModal(true);
                                            }}
                                            className="w-full rounded-xl border border-dashed border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 transition"
                                        >
                                            <Search className="h-3.5 w-3.5" /> Cari Pelanggan Terdaftar
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={checkoutForm.data.buyer_name}
                                            onChange={e => checkoutForm.setData('buyer_name', e.target.value)}
                                            className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold bg-card text-gray-800 dark:bg-background dark:text-gray-100 focus:outline-none ${checkoutForm.errors.buyer_name ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            placeholder="Contoh: Andi Wijaya"
                                        />
                                        {checkoutForm.errors.buyer_name && <p className="mt-1 text-xs text-rose-500">{checkoutForm.errors.buyer_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">No. HP (WhatsApp)</label>
                                        <input
                                            type="text"
                                            required
                                            value={checkoutForm.data.buyer_phone}
                                            onChange={e => checkoutForm.setData('buyer_phone', normalizePhone(e.target.value))}
                                            className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold bg-card text-gray-800 dark:bg-background dark:text-gray-100 focus:outline-none ${checkoutForm.errors.buyer_phone ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                        {checkoutForm.errors.buyer_phone && <p className="mt-1 text-xs text-rose-500">{checkoutForm.errors.buyer_phone}</p>}
                                        <p className="text-[10px] text-gray-400 mt-0.5">Format: 08xxx / +62xxx / 62xxx → auto-convert</p>
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
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            required
                                            value={formatNumberInput(checkoutForm.data.items[0]?.actual_sell_price ?? '')}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                const items = [...checkoutForm.data.items];
                                                items[0].actual_sell_price = val === '' ? '' : parseFloat(val);
                                                checkoutForm.setData('items', items);
                                            }}
                                            className={`w-full rounded-xl border px-3.5 py-2 text-sm font-bold bg-card text-gray-800 dark:bg-background dark:text-gray-100 focus:outline-none ${checkoutForm.errors['items.0.actual_sell_price'] ? 'border-rose-400' : 'border-input dark:border-input'}`}
                                            placeholder="Masukkan harga"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 font-bold">Default retail: {formatCurrency(selectedStock.sell_price)}</p>
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
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={formatNumberInput(checkoutForm.data.dp_amount ?? '')}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                checkoutForm.setData('dp_amount', val === '' ? '' : parseFloat(val));
                                            }}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background dark:text-gray-100"
                                            placeholder="0"
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
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Komisi Affiliate</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={formatNumberInput(checkoutForm.data.affiliate_fee ?? '')}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                checkoutForm.setData('affiliate_fee', val === '' ? '' : parseFloat(val));
                                            }}
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
                                                                <option value="seller">Toko Tanggung</option>
                                                                <option value="free_promotion">Promosi Free</option>
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
                                                    placeholder="Contoh: iPhone 12 Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nilai Taksiran Beli Toko (IDR)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0}
                                                    value={checkoutForm.data.trade_in.buy_price ?? ''}
                                                    onChange={e => {
                                                        const ti = checkoutForm.data.trade_in!;
                                                        checkoutForm.setData('trade_in', { ...ti, buy_price: e.target.value === '' ? '' : parseFloat(e.target.value) });
                                                    }}
                                                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-bold text-gray-800 dark:border-input dark:bg-background"
                                                    placeholder="Nilai taksiran"
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
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">IMEI HP Trade-In</label>
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
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Total Math & Checkout button */}
                            <div className="bg-muted rounded-xl p-4 dark:bg-background border dark:border-input space-y-2">
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                    <span>Harga Unit:</span>
                                    <span>{formatCurrency(Number(checkoutForm.data.items[0]?.actual_sell_price) || 0)}</span>
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
                                        <span>-{formatCurrency(Number(checkoutForm.data.trade_in.buy_price) || 0)}</span>
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

            {/* Success Modal with WA / Invoice buttons */}
            {successData !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-card border border-border dark:bg-background dark:border-input shadow-2xl p-6 space-y-5 text-center">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-foreground">Transaksi Berhasil!</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Pembayaran dari <span className="font-bold text-foreground">{successData.buyerName}</span> telah berhasil diproses.
                            </p>
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                Total: {formatCurrency(successData.total)}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* Chat WA */}
                            <button
                                onClick={() => openWAChat(successData.buyerPhone, successData.buyerName)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition"
                            >
                                <MessageCircle className="h-4 w-4" /> Chat WA Pembeli
                            </button>

                            {/* Send Invoice via WA */}
                            {successData.invoiceNumber && (
                                <button
                                    onClick={() => openWAInvoice(successData.buyerPhone, successData.buyerName, successData.invoiceNumber, successData.total)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
                                >
                                    <Send className="h-4 w-4" /> Kirim Invoice via WA
                                </button>
                            )}

                            {/* View Invoice */}
                            {successData.invoiceNumber && (
                                <a
                                    href={`/invoice/${successData.invoiceNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-input py-3 text-sm font-bold text-foreground hover:bg-muted transition"
                                >
                                    <ExternalLink className="h-4 w-4" /> Lihat Invoice Online
                                </a>
                            )}

                            <button
                                onClick={() => setSuccessData(null)}
                                className="w-full rounded-xl py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Buyer Search Modal */}
            {showBuyerSearchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm border dark:border-input dark:bg-background">
                        <div className="flex justify-between items-center pb-4 border-b border-border dark:border-input mb-4">
                            <h4 className="text-lg font-bold text-foreground">Cari Pelanggan Terdaftar</h4>
                            <button 
                                onClick={() => setShowBuyerSearchModal(false)} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Masukkan nama atau nomor HP..."
                                    value={buyerSearchQuery}
                                    onChange={e => setBuyerSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm font-bold text-foreground shadow-sm focus:border-indigo-500 focus:outline-none dark:border-input dark:bg-background"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border rounded-xl dark:border-input">
                                {filteredBuyers.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-6">Pelanggan tidak ditemukan.</p>
                                ) : (
                                    filteredBuyers.map(b => (
                                        <div
                                            key={b.id}
                                            onClick={() => {
                                                selectBuyer(b);
                                                setShowBuyerSearchModal(false);
                                            }}
                                            className="p-3 hover:bg-muted/50 dark:hover:bg-gray-900/50 cursor-pointer flex justify-between items-center text-xs font-bold"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="text-foreground truncate">{b.name}</p>
                                                <p className="text-gray-400 font-normal truncate">{b.address || 'Tanpa alamat'}</p>
                                            </div>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono flex-shrink-0">{b.phone}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
