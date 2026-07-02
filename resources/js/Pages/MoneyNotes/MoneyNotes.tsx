import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    ArrowUpRight, 
    ArrowDownRight, 
    TrendingUp, 
    TrendingDown, 
    Wallet,
    Calendar,
    Tag,
    FileText,
    DollarSign,
    FolderPlus,
    X,
    Search,
    Filter
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
    type: 'in' | 'out';
}

interface MoneyLog {
    id: number;
    type: 'in' | 'out';
    amount: number;
    category: string;
    description: string | null;
    date: string;
    created_at: string;
}

interface MoneyNotesProps {
    logs: MoneyLog[];
    categories: Category[];
    summary: {
        total_income: number;
        total_expense: number;
        balance: number;
    };
}

export default function MoneyNotes({ logs, categories, summary }: MoneyNotesProps) {
    const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Transaction Form
    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'in' as 'in' | 'out',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Category Form State
    const [showNewCatModal, setShowNewCatModal] = useState(false);
    const catForm = useForm({
        name: '',
        type: 'in' as 'in' | 'out'
    });

    // Filter categories depending on transaction type
    const activeCategories = categories.filter(c => c.type === data.type);

    const submitTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('money-notes.store'), {
            onSuccess: () => {
                reset('amount', 'description');
                setShowTransactionModal(false);
                alert('Transaksi berhasil dicatat!');
            }
        });
    };

    const submitCategory = (e: React.FormEvent) => {
        e.preventDefault();
        catForm.post(route('money-notes.category.store'), {
            onSuccess: () => {
                setShowNewCatModal(false);
                catForm.reset();
                alert('Kategori baru berhasil ditambahkan!');
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan keuangan ini?')) {
            post(route('money-notes.destroy', id), {
                _method: 'DELETE',
                onSuccess: () => {
                    alert('Catatan berhasil dihapus.');
                }
            } as any);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    // Filter history logs
    const filteredLogs = logs.filter(log => {
        const matchesType = filterType === 'all' ? true : log.type === filterType;
        const matchesCategory = filterCategory === 'all' ? true : log.category === filterCategory;
        const matchesSearch = 
            log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.description && log.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && log.date >= startDate;
        }
        if (endDate) {
            matchesDate = matchesDate && log.date <= endDate;
        }
        
        return matchesType && matchesCategory && matchesSearch && matchesDate;
    });

    // Calculate dynamic summary based on active filters
    const dynamicSummary = filteredLogs.reduce((acc, log) => {
        const amt = Number(log.amount);
        if (log.type === 'in') {
            acc.total_income += amt;
            acc.balance += amt;
        } else {
            acc.total_expense += amt;
            acc.balance -= amt;
        }
        return acc;
    }, { total_income: 0, total_expense: 0, balance: 0 });

    return (
        <AuthenticatedLayout>
            <Head title="Money Notes - Keuangan Bisnis" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight">Money Notes</h2>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">Pencatatan pemasukan dan pengeluaran kas mandiri terpisah.</p>
                        </div>
                        <button
                            onClick={() => setShowTransactionModal(true)}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Catat Transaksi
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {/* Total Income */}
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Pemasukan</span>
                                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(dynamicSummary.total_income)}
                            </p>
                        </div>

                        {/* Total Expenses */}
                        <div className="relative overflow-hidden rounded-2xl border border-rose-500/10 bg-rose-500/5 p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Pengeluaran</span>
                                <div className="rounded-full bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-400">
                                {formatCurrency(dynamicSummary.total_expense)}
                            </p>
                        </div>

                        {/* Net Balance */}
                        <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm ${
                            dynamicSummary.balance >= 0 
                                ? 'border-indigo-500/10 bg-indigo-500/5' 
                                : 'border-amber-500/10 bg-amber-500/5'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Saldo Bersih</span>
                                <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </div>
                            <p className={`mt-2 text-2xl font-black ${
                                dynamicSummary.balance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-amber-700 dark:text-amber-400'
                            }`}>
                                {formatCurrency(dynamicSummary.balance)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* HISTORY SECTION */}
                        <div className="space-y-6">
                            
                            {/* Filter panel */}
                            <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-card-foreground flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Type filter */}
                                    <select
                                        value={filterType}
                                        onChange={e => setFilterType(e.target.value as any)}
                                        className="rounded-xl border border-input bg-card px-3.5 py-2 text-xs font-bold dark:border-input dark:bg-background"
                                    >
                                        <option value="all">Semua Tipe</option>
                                        <option value="in">Pemasukan (+)</option>
                                        <option value="out">Pengeluaran (-)</option>
                                    </select>

                                    {/* Category filter */}
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className="rounded-xl border border-input bg-card px-3.5 py-2 text-xs font-bold dark:border-input dark:bg-background"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        {Array.from(new Set(categories.map(c => c.name))).map(catName => (
                                            <option key={catName} value={catName}>{catName}</option>
                                        ))}
                                    </select>

                                    {/* Date range filters */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="rounded-xl border border-input bg-card px-2.5 py-2 text-[11px] font-bold dark:border-input dark:bg-background"
                                        />
                                        <span className="text-gray-400 font-bold">s/d</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="rounded-xl border border-input bg-card px-2.5 py-2 text-[11px] font-bold dark:border-input dark:bg-background"
                                        />
                                        {(startDate || endDate) && (
                                            <button
                                                onClick={() => {
                                                    setStartDate('');
                                                    setEndDate('');
                                                }}
                                                className="text-[10px] text-rose-500 hover:text-rose-600 font-black ml-1 uppercase"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari keterangan..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs font-bold dark:border-input dark:bg-background w-full md:w-60"
                                    />
                                </div>
                            </div>

                            {/* Logs History Table */}
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground">
                                <h3 className="text-base font-bold text-foreground mb-4">Riwayat Keuangan</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                                <th className="pb-3 font-semibold">Tanggal</th>
                                                <th className="pb-3 font-semibold">Kategori</th>
                                                <th className="pb-3 font-semibold">Keterangan</th>
                                                <th className="pb-3 font-semibold text-right">Nominal</th>
                                                <th className="pb-3 font-semibold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {filteredLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-gray-400">Belum ada catatan transaksi keuangan.</td>
                                                </tr>
                                            ) : (
                                                filteredLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                        <td className="py-4 font-semibold text-xs whitespace-nowrap">
                                                            {new Date(log.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 text-xs font-bold">
                                                                {log.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-xs font-semibold text-foreground max-w-xs truncate" title={log.description || '-'}>
                                                            {log.description || '-'}
                                                        </td>
                                                        <td className={`py-4 text-right font-black ${
                                                            log.type === 'in' 
                                                                ? 'text-emerald-600 dark:text-emerald-400' 
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {log.type === 'in' ? '+' : '-'} {formatCurrency(log.amount)}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={() => handleDelete(log.id)}
                                                                className="text-rose-600 hover:text-rose-900 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm border dark:border-input dark:bg-background my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-border dark:border-input mb-4">
                            <h4 className="text-lg font-bold text-foreground">Catat Transaksi Baru</h4>
                            <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTransaction} className="space-y-4">
                            {/* Type Toggle */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tipe Transaksi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(prev => ({ ...prev, type: 'in', category: '' }));
                                        }}
                                        className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                                            data.type === 'in'
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/15'
                                                : 'border-input hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        Pemasukan (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(prev => ({ ...prev, type: 'out', category: '' }));
                                        }}
                                        className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                                            data.type === 'out'
                                                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/15'
                                                : 'border-input hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        Pengeluaran (-)
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nominal (IDR)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                                        Rp
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="any"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                        placeholder="0"
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
                            </div>

                            {/* Category */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[10px] font-bold uppercase text-gray-400">Kategori</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            catForm.setData('type', data.type);
                                            setShowNewCatModal(true);
                                        }}
                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                    >
                                        <FolderPlus className="h-3 w-3" /> Tambah Kategori
                                    </button>
                                </div>
                                <select
                                    required
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {activeCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                />
                                {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Keterangan / Rincian</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-semibold dark:border-input dark:bg-background h-24 resize-none"
                                    placeholder="Contoh: Pembayaran internet bulanan..."
                                />
                                {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Category Modal */}
            {showNewCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm border dark:border-input dark:bg-background">
                        <div className="flex justify-between items-center pb-4 border-b border-border dark:border-input mb-4">
                            <h4 className="text-lg font-bold text-foreground">Tambah Kategori Baru</h4>
                            <button onClick={() => setShowNewCatModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Kategori</label>
                                <select
                                    required
                                    value={catForm.data.type}
                                    onChange={e => catForm.setData('type', e.target.value as any)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                >
                                    <option value="in">Pemasukan (+)</option>
                                    <option value="out">Pengeluaran (-)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    required
                                    value={catForm.data.name}
                                    onChange={e => catForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                    placeholder="Contoh: ATK, Listrik, Hiburan..."
                                />
                                {catForm.errors.name && <p className="text-xs text-rose-500 mt-1">{catForm.errors.name}</p>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setShowNewCatModal(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input dark:hover:bg-gray-950"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={catForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    {catForm.processing ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
