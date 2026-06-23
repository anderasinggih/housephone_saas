import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ShoppingBag, 
    PlusCircle, 
    ArrowLeftRight, 
    CheckSquare, 
    LogIn, 
    LogOut, 
    ArrowDownCircle, 
    DollarSign, 
    AlertTriangle, 
    XCircle, 
    RotateCcw, 
    Wrench,
    Clock,
    User
} from 'lucide-react';

interface ActivityLog {
    id: number;
    user_id: number | null;
    action: string;
    model_type: string | null;
    model_id: number | null;
    new_values: any;
    old_values: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface TimelineProps {
    activities: PaginatedData<ActivityLog>;
}

export default function Timeline({ activities }: TimelineProps) {
    const formatCurrency = (val: any) => {
        const num = parseFloat(val) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays === 1) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionDetails = (log: ActivityLog) => {
        const vals = log.new_values || {};
        switch (log.action) {
            case 'add_stock':
                return {
                    title: 'Tambah Stok',
                    icon: PlusCircle,
                    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
                    desc: (
                        <span>
                            Menambahkan unit baru <strong className="text-foreground font-semibold">{vals.name || 'Unit'}</strong> ({vals.type || '-'}) dengan harga jual {formatCurrency(vals.sell_price)}.
                        </span>
                    )
                };
            case 'sale_checkout':
                return {
                    title: 'Penjualan',
                    icon: ShoppingBag,
                    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                    desc: (
                        <span>
                            Penyelesaian transaksi penjualan <strong className="text-foreground font-semibold">{vals.invoice_number}</strong> senilai <strong className="text-emerald-600 font-bold">{formatCurrency(vals.total_amount)}</strong> kepada buyer <strong className="text-foreground font-semibold">{vals.buyer_name || '-'}</strong>. {vals.items_detail && `(${vals.items_detail})`}
                        </span>
                    )
                };
            case 'stock_transfer_initiated':
                return {
                    title: 'Mutasi Stok Diajukan',
                    icon: ArrowLeftRight,
                    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                    desc: (
                        <span>
                            Mengajukan mutasi langsung unit <strong className="text-foreground font-semibold">{vals.stock_name || 'Unit'}</strong> {vals.serial_number && `(SN: ${vals.serial_number})`} ke cabang tujuan.
                        </span>
                    )
                };
            case 'stock_transfer_approved':
                return {
                    title: 'Mutasi Disetujui',
                    icon: CheckSquare,
                    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
                    desc: (
                        <span>
                            Mutasi unit <strong className="text-foreground font-semibold">{vals.stock_name || 'Unit'}</strong> {vals.serial_number && `(SN: ${vals.serial_number})`} telah disetujui dan berhasil diterima di cabang tujuan.
                        </span>
                    )
                };
            case 'shift_clock_in':
                return {
                    title: 'Clock In Shift',
                    icon: LogIn,
                    colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
                    desc: (
                        <span>
                            Memulai shift kerja di toko <strong className="text-foreground font-semibold">{vals.store_name || '-'}</strong> dengan modal awal kas laci <strong className="text-foreground font-semibold">{formatCurrency(vals.start_cash)}</strong>.
                        </span>
                    )
                };
            case 'shift_clock_out':
                return {
                    title: 'Clock Out Shift',
                    icon: LogOut,
                    colorClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20',
                    desc: (
                        <span>
                            Menutup shift kasir dengan uang akhir terhitung sebesar <strong className="text-foreground font-semibold">{formatCurrency(vals.end_cash)}</strong>. Selisih laci: <strong className={parseFloat(vals.difference) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(vals.difference)}</strong>.
                        </span>
                    )
                };
            case 'shift_cash_drop':
                return {
                    title: 'Setoran Cash Drop',
                    icon: ArrowDownCircle,
                    colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
                    desc: (
                        <span>
                            Melakukan setoran uang kas (cash drop) sebesar <strong className="text-rose-600 font-bold">{formatCurrency(vals.amount)}</strong>. Keterangan: {vals.description}.
                        </span>
                    )
                };
            case 'shift_petty_cash':
                return {
                    title: 'Kas Kecil (Petty)',
                    icon: DollarSign,
                    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
                    desc: (
                        <span>
                            Pencatatan kas operasional kecil bernilai <strong className="text-foreground font-semibold">{formatCurrency(vals.amount)}</strong> tipe <strong className="uppercase font-bold">{vals.type === 'in' ? 'Masuk (In)' : 'Keluar (Out)'}</strong>. Keperluan: {vals.description}.
                        </span>
                    )
                };
            case 'sale_void_requested':
                return {
                    title: 'Void Diajukan',
                    icon: AlertTriangle,
                    colorClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
                    desc: (
                        <span>
                            Mengajukan pembatalan transaksi (void) untuk invoice <strong className="text-foreground font-semibold">{vals.invoice_number}</strong>. Alasan: "{vals.void_reason}".
                        </span>
                    )
                };
            case 'sale_void_approved':
                return {
                    title: 'Void Disetujui',
                    icon: XCircle,
                    colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
                    desc: (
                        <span>
                            Persetujuan pembatalan transaksi (void) untuk invoice <strong className="text-foreground font-semibold">{vals.invoice_number}</strong>. Unit dikembalikan ke inventori cabang terkait.
                        </span>
                    )
                };
            case 'sale_return':
                return {
                    title: 'Retur Barang',
                    icon: RotateCcw,
                    colorClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
                    desc: (
                        <span>
                            Mencatat retur unit <strong className="text-foreground font-semibold">{vals.stock_name || 'Unit'}</strong> dari invoice <strong className="text-foreground font-semibold">{vals.invoice_number}</strong>. Pengembalian uang buyer: {formatCurrency(vals.refund_amount)} (Potongan retur: {formatCurrency(vals.restocking_fee)}).
                        </span>
                    )
                };
            case 'warranty_claim':
                return {
                    title: 'Klaim Garansi',
                    icon: Wrench,
                    colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
                    desc: (
                        <span>
                            Mengajukan klaim servis garansi unit <strong className="text-foreground font-semibold">{vals.stock_name || 'Unit'}</strong>. Deskripsi Kerusakan: "{vals.damage_description}".
                        </span>
                    )
                };
            case 'warranty_update':
                return {
                    title: 'Servis Diperbarui',
                    icon: Wrench,
                    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
                    desc: (
                        <span>
                            Klaim servis garansi unit <strong className="text-foreground font-semibold">{vals.stock_name || 'Unit'}</strong> diperbarui ke status <strong className="uppercase font-bold text-indigo-500">{vals.status}</strong> {vals.repair_cost > 0 && `dengan biaya perbaikan ${formatCurrency(vals.repair_cost)}`}.
                        </span>
                    )
                };
            default:
                return {
                    title: log.action.replace(/_/g, ' ').toUpperCase(),
                    icon: Clock,
                    colorClass: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20',
                    desc: <span>Melakukan aktivitas {log.action} pada sistem.</span>
                };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Timeline Aktivitas" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Timeline Aktivitas</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Lacak seluruh aktivitas dan transaksi operasional toko secara real-time.
                            </p>
                        </div>
                    </div>

                    {/* Timeline Feed Container */}
                    <div className="space-y-6">
                        {activities.data.length === 0 ? (
                            <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-500 shadow-sm text-card-foreground">
                                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="font-semibold text-sm">Belum ada rekaman aktivitas saat ini.</p>
                            </div>
                        ) : (
                            activities.data.map((log) => {
                                const details = getActionDetails(log);
                                const Icon = details.icon;
                                
                                // User display initials
                                const userName = log.user?.name || 'Sistem';
                                const userEmail = log.user?.email || 'system@housephone.com';
                                const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                return (
                                    <div 
                                        key={log.id} 
                                        className="rounded-2xl border border-border bg-card p-5 shadow-sm text-card-foreground hover:shadow-md transition-shadow duration-200"
                                    >
                                        {/* Card Header: User details */}
                                        <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Initial Circle Avatar */}
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold text-sm tracking-wider shadow-inner">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground leading-tight">{userName}</p>
                                                    <p className="text-[11px] text-gray-400 font-normal leading-none mt-1">{userEmail}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Date / Time */}
                                            <div className="text-right">
                                                <p className="text-[11px] font-semibold text-gray-400">{getRelativeTime(log.created_at)}</p>
                                            </div>
                                        </div>

                                        {/* Card Body: Action Badge and Description */}
                                        <div className="space-y-3 pl-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${details.colorClass}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {details.title}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                {details.desc}
                                            </p>
                                        </div>

                                        {/* Optional details (metadata/ip) */}
                                        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pl-1 pt-2 border-t border-border/20">
                                            <span>Cabang: {log.user?.role === 'superadmin' ? 'Superadmin Access' : (log.user?.role || 'Karyawan')}</span>
                                            <span>IP: {log.ip_address || '-'}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Links */}
                    {activities.last_page > 1 && (
                        <div className="flex justify-center gap-1.5 pt-4">
                            {activities.links.map((link, idx) => {
                                // Clear HTML entity tags
                                const labelClean = link.label
                                    .replace(/&laquo;/g, '«')
                                    .replace(/&raquo;/g, '»');
                                    
                                if (!link.url) {
                                    return (
                                        <span 
                                            key={idx}
                                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-gray-400 bg-muted/40 border border-border/50 cursor-not-allowed"
                                        >
                                            {labelClean}
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                                            link.active 
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-card text-gray-600 hover:bg-muted border-border hover:text-foreground dark:text-gray-300'
                                        }`}
                                    >
                                        {labelClean}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
