import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    User as UserIcon, 
    Plus, 
    Edit, 
    Trash2, 
    Shield, 
    Mail, 
    Store as StoreIcon, 
    Calendar,
    Key
} from 'lucide-react';

interface Store {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    store_id: number | null;
    created_at: string;
    store?: Store;
}

interface IndexProps {
    users: User[];
    stores: Store[];
}

export default function Index({ users, stores }: IndexProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const addForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'karyawan',
        store_id: '' as string | number
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '', // optional to change password
        role: 'karyawan',
        store_id: '' as string | number
    });

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('users.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
                alert('User baru berhasil ditambahkan!');
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        editForm.patch(route('users.update', editingUser.id), {
            onSuccess: () => {
                setEditingUser(null);
                alert('User berhasil diperbarui!');
            }
        });
    };

    const deleteUser = (user: User) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
            useForm().delete(route('users.destroy', user.id), {
                onSuccess: () => {
                    alert('User berhasil dihapus.');
                },
                onError: (errors: any) => {
                    if (errors.error) {
                        alert(errors.error);
                    }
                }
            });
        }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            store_id: user.store_id || ''
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col justify-end gap-4 sm:flex-row sm:items-center w-full">

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/10"
                    >
                        <Plus className="h-4 w-4" /> Tambah User
                    </button>
                </div>
            }
        >
            <Head title="Kelola Karyawan & User" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Users List Table */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Nama Pengguna</th>
                                        <th className="pb-3 font-semibold">Email</th>
                                        <th className="pb-3 font-semibold">Hak Akses (Role)</th>
                                        <th className="pb-3 font-semibold">Cabang Toko</th>
                                        <th className="pb-3 font-semibold">Tgl Dibuat</th>
                                        <th className="pb-3 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-400">Belum ada user terdaftar.</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <span className="font-semibold text-foreground">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                        {user.email}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                        user.role === 'superadmin' 
                                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs' 
                                                            : user.role === 'karyawan'
                                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-xs'
                                                                : 'bg-muted text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                        <Shield className="h-3 w-3" />
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="flex items-center gap-1 font-bold">
                                                        <StoreIcon className="h-3.5 w-3.5 text-gray-400" />
                                                        {user.store?.name || 'Semua Cabang (Global)'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEdit(user)}
                                                        className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user)}
                                                        className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition dark:bg-rose-950/20 dark:text-rose-400"
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

            {/* ADD USER MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Tambah Pengguna Baru</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Buat user baru, atur role, dan tentukan cabangnya.</p>

                        <form onSubmit={submitAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.data.name}
                                    onChange={e => addForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="Contoh: Budi Susanto"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={addForm.data.email}
                                    onChange={e => addForm.setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="budi@housephone.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={addForm.data.password}
                                    onChange={e => addForm.setData('password', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Hak Akses (Role)</label>
                                    <select
                                        value={addForm.data.role}
                                        onChange={e => addForm.setData('role', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                    >
                                        <option value="karyawan">Karyawan (Kasir)</option>
                                        <option value="viewer">Viewer (Owner)</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                </div>

                                {addForm.data.role !== 'superadmin' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang</label>
                                        <select
                                            required
                                            value={addForm.data.store_id}
                                            onChange={e => addForm.setData('store_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Cabang --</option>
                                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Simpan User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Edit Data Pengguna</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Perbarui peran atau asosiasi cabang.</p>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.data.email}
                                    onChange={e => editForm.setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password Baru (Kosongkan jika tidak diubah)</label>
                                <input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={e => editForm.setData('password', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Hak Akses (Role)</label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={e => editForm.setData('role', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                    >
                                        <option value="karyawan">Karyawan (Kasir)</option>
                                        <option value="viewer">Viewer (Owner)</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                </div>

                                {editForm.data.role !== 'superadmin' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Pilih Cabang</label>
                                        <select
                                            required
                                            value={editForm.data.store_id}
                                            onChange={e => editForm.setData('store_id', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-bold dark:border-input dark:bg-background"
                                        >
                                            <option value="">-- Pilih Cabang --</option>
                                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Perbarui User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
