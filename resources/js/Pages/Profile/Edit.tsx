import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { User, Mail, Lock, ShieldAlert, CheckCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const authUser = usePage().props.auth.user as any;
    const isKaryawan = authUser.role === 'karyawan';

    // Profile Form
    const profileForm = useForm({
        name: authUser.name,
        email: authUser.email,
    });

    // Password Form
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Delete Form
    const deleteForm = useForm({ password: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'));
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const submitDelete: FormEventHandler = (e) => {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Karyawan Notice */}
                    {isKaryawan && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                            <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Akses Terbatas</p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                    Sebagai karyawan, Anda tidak dapat mengubah informasi profil atau password. Hubungi superadmin untuk melakukan perubahan.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Profile Info Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground space-y-5">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                <User className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Informasi Profil</h3>
                                <p className="text-xs text-muted-foreground">Nama dan alamat email akun Anda.</p>
                            </div>
                        </div>

                        {/* Read-only view for karyawan */}
                        {isKaryawan ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Nama</p>
                                    <p className="text-sm font-bold text-foreground">{authUser.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</p>
                                    <p className="text-sm font-bold text-foreground">{authUser.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Role</p>
                                    <span className="inline-flex rounded-full px-3 py-0.5 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 capitalize">
                                        {authUser.role}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitProfile} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                                    />
                                    {profileForm.errors.name && (
                                        <p className="mt-1 text-xs text-rose-500">{profileForm.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                        Alamat Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                                    />
                                    {profileForm.errors.email && (
                                        <p className="mt-1 text-xs text-rose-500">{profileForm.errors.email}</p>
                                    )}
                                </div>

                                {mustVerifyEmail && authUser.email_verified_at === null && (
                                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            Email Anda belum terverifikasi.{' '}
                                            <Link
                                                href={route('verification.send')}
                                                method="post"
                                                as="button"
                                                className="underline font-bold"
                                            >
                                                Kirim ulang verifikasi.
                                            </Link>
                                        </p>
                                        {status === 'verification-link-sent' && (
                                            <p className="text-xs font-bold text-green-600 mt-1">Link verifikasi telah dikirim.</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-60"
                                    >
                                        {profileForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                    <Transition
                                        show={profileForm.recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                            <CheckCircle className="h-4 w-4" /> Tersimpan
                                        </span>
                                    </Transition>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Password Card — hidden for karyawan */}
                    {!isKaryawan && (
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-card-foreground space-y-5">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <Lock className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Ubah Password</h3>
                                    <p className="text-xs text-muted-foreground">Gunakan password yang kuat dan unik.</p>
                                </div>
                            </div>

                            <form onSubmit={submitPassword} className="space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Password Saat Ini</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            required
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 pr-10 text-sm font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.errors.current_password && (
                                        <p className="mt-1 text-xs text-rose-500">{passwordForm.errors.current_password}</p>
                                    )}
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            required
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 pr-10 text-sm font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.errors.password && (
                                        <p className="mt-1 text-xs text-rose-500">{passwordForm.errors.password}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            required
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 pr-10 text-sm font-bold text-foreground focus:border-indigo-500 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-rose-500">{passwordForm.errors.password_confirmation}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition disabled:opacity-60"
                                    >
                                        {passwordForm.processing ? 'Memperbarui...' : 'Perbarui Password'}
                                    </button>
                                    <Transition
                                        show={passwordForm.recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                            <CheckCircle className="h-4 w-4" /> Password Diperbarui
                                        </span>
                                    </Transition>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Delete Account — superadmin only */}
                    {authUser.role === 'superadmin' && (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-card p-6 shadow-sm text-card-foreground space-y-4">
                            <div className="flex items-center gap-3 border-b border-rose-100 dark:border-rose-900 pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
                                    <Trash2 className="h-5 w-5 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Hapus Akun</h3>
                                    <p className="text-xs text-muted-foreground">Tindakan permanen — tidak dapat dipulihkan.</p>
                                </div>
                            </div>

                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="rounded-xl border border-rose-300 dark:border-rose-800 px-5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                                >
                                    Hapus Akun Saya
                                </button>
                            ) : (
                                <form onSubmit={submitDelete} className="space-y-4">
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                                        Masukkan password Anda untuk mengkonfirmasi penghapusan akun secara permanen.
                                    </p>
                                    <input
                                        type="password"
                                        required
                                        value={deleteForm.data.password}
                                        onChange={(e) => deleteForm.setData('password', e.target.value)}
                                        placeholder="Password Anda"
                                        className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-background px-3.5 py-2 text-sm font-bold text-foreground focus:outline-none"
                                    />
                                    {deleteForm.errors.password && (
                                        <p className="text-xs text-rose-500">{deleteForm.errors.password}</p>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 rounded-xl border border-input py-2 text-xs font-bold text-gray-500 hover:bg-muted transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={deleteForm.processing}
                                            className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
                                        >
                                            {deleteForm.processing ? 'Menghapus...' : 'Hapus Permanen'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
