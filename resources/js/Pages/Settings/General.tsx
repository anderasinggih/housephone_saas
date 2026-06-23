import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Settings, ShieldAlert, Clock, MapPin, Trash2, Plus, Calendar, Save } from 'lucide-react';
import { FormEvent } from 'react';

interface GeneralSetting {
    id: number;
    company_name: string;
    work_start_time: string;
    work_end_time: string;
    grace_period_minutes: number;
    geofence_lock_enabled: boolean;
    notification_emails?: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    store_id: number | null;
}

interface Store {
    id: number;
    name: string;
}

interface EmployeeSchedule {
    id: number;
    user_id: number;
    store_id: number;
    work_start_time: string | null;
    work_end_time: string | null;
    grace_period_minutes: number | null;
    user?: User;
    store?: Store;
}

interface GeneralProps {
    settings: GeneralSetting;
    schedules: EmployeeSchedule[];
    employees: User[];
    stores: Store[];
}

export default function General({ settings, schedules, employees, stores }: GeneralProps) {
    const settingsForm = useForm({
        company_name: settings.company_name || 'Housephone',
        work_start_time: settings.work_start_time || '09:00:00',
        work_end_time: settings.work_end_time || '18:00:00',
        grace_period_minutes: settings.grace_period_minutes || 15,
        geofence_lock_enabled: settings.geofence_lock_enabled,
        notification_emails: settings.notification_emails || '',
    });

    const scheduleForm = useForm({
        user_id: '',
        store_id: '',
        work_start_time: '',
        work_end_time: '',
        grace_period_minutes: '',
    });

    const submitGeneralSettings = (e: FormEvent) => {
        e.preventDefault();
        settingsForm.post(route('settings.general.update'), {
            onSuccess: () => {
                alert('Pengaturan umum berhasil diperbarui.');
            }
        });
    };

    const submitSchedule = (e: FormEvent) => {
        e.preventDefault();
        if (!scheduleForm.data.user_id || !scheduleForm.data.store_id) {
            alert('Mohon pilih karyawan dan cabang.');
            return;
        }

        scheduleForm.post(route('settings.schedule.store'), {
            onSuccess: () => {
                scheduleForm.reset();
                alert('Jadwal shift karyawan berhasil disimpan.');
            }
        });
    };

    const deleteSchedule = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal khusus ini?')) {
            useForm().delete(route('settings.schedule.destroy', id), {
                onSuccess: () => {
                    alert('Jadwal khusus berhasil dihapus.');
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Umum & Shift Kerja" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <Settings className="h-6 w-6 text-indigo-500" />
                            Pengaturan Umum & Shift Kerja
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        
                        {/* GENERAL SETTINGS CARD */}
                        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                                <Clock className="h-5 w-5 text-indigo-500" />
                                <h3 className="text-base font-semibold text-foreground">Kebijakan Jam Kerja</h3>
                            </div>

                            <form onSubmit={submitGeneralSettings} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Nama Perusahaan</label>
                                    <input 
                                        type="text" 
                                        value={settingsForm.data.company_name}
                                        onChange={e => settingsForm.setData('company_name', e.target.value)}
                                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                    />
                                    {settingsForm.errors.company_name && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.company_name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Jam Masuk</label>
                                        <input 
                                            type="time" 
                                            step="1"
                                            value={settingsForm.data.work_start_time}
                                            onChange={e => settingsForm.setData('work_start_time', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Jam Pulang</label>
                                        <input 
                                            type="time" 
                                            step="1"
                                            value={settingsForm.data.work_end_time}
                                            onChange={e => settingsForm.setData('work_end_time', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Toleransi Keterlambatan (Menit)</label>
                                    <input 
                                        type="number" 
                                        value={settingsForm.data.grace_period_minutes}
                                        onChange={e => settingsForm.setData('grace_period_minutes', parseInt(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Email Penerima Notifikasi</label>
                                    <textarea 
                                        rows={2}
                                        value={settingsForm.data.notification_emails}
                                        onChange={e => settingsForm.setData('notification_emails', e.target.value)}
                                        placeholder="owner@housephone.com, admin@housephone.com"
                                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Pisahkan dengan tanda koma (`,`) jika ingin mengirim ke lebih dari satu email.
                                    </p>
                                    {settingsForm.errors.notification_emails && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.notification_emails}</p>}
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={settingsForm.data.geofence_lock_enabled}
                                            onChange={e => settingsForm.setData('geofence_lock_enabled', e.target.checked)}
                                            className="rounded border-input text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        />
                                        <span className="text-sm font-medium text-foreground">Wajibkan Geofencing Radius Toko</span>
                                    </label>
                                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                                        Jika diaktifkan, karyawan tidak bisa Clock-in & Clock-out di luar jangkauan GPS toko.
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={settingsForm.processing}
                                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    <Save className="h-4 w-4" /> Simpan Pengaturan
                                </button>
                            </form>
                        </div>

                        {/* SHIFT SCHEDULE CARD */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                                    <Calendar className="h-5 w-5 text-indigo-500" />
                                    <h3 className="text-base font-semibold text-foreground">Atur Jadwal Shift Karyawan</h3>
                                </div>

                                <form onSubmit={submitSchedule} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Pilih Karyawan</label>
                                        <select 
                                            value={scheduleForm.data.user_id} 
                                            onChange={e => scheduleForm.setData('user_id', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Pilih --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Pilih Toko/Cabang</label>
                                        <select 
                                            value={scheduleForm.data.store_id} 
                                            onChange={e => scheduleForm.setData('store_id', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Pilih --</option>
                                            {stores.map(st => (
                                                <option key={st.id} value={st.id}>{st.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Jam Masuk (Opsional)</label>
                                        <input 
                                            type="time" 
                                            step="1"
                                            value={scheduleForm.data.work_start_time}
                                            onChange={e => scheduleForm.setData('work_start_time', e.target.value)}
                                            placeholder="Default"
                                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <button 
                                            type="submit" 
                                            disabled={scheduleForm.processing}
                                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                                        >
                                            <Plus className="h-4 w-4" /> Tambah
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                                <h3 className="text-base font-semibold text-foreground mb-4">Jadwal Shift Khusus Terdaftar</h3>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Karyawan</th>
                                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Cabang</th>
                                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Jam Kerja khusus</th>
                                                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {schedules.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                                        Belum ada jadwal khusus terdaftar. Karyawan akan menggunakan jam kerja default perusahaan.
                                                    </td>
                                                </tr>
                                            ) : (
                                                schedules.map(sch => (
                                                    <tr key={sch.id} className="hover:bg-muted/10 transition">
                                                        <td className="px-4 py-3 font-medium text-foreground">
                                                            {sch.user?.name || 'User Terhapus'}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {sch.store?.name || 'Store Terhapus'}
                                                        </td>
                                                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                                                            {sch.work_start_time || settings.work_start_time} - {sch.work_end_time || settings.work_end_time}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button 
                                                                onClick={() => deleteSchedule(sch.id)}
                                                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition"
                                                                title="Hapus jadwal khusus"
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
        </AuthenticatedLayout>
    );
}
