import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { 
    Clock, 
    Coins, 
    MapPin, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    ShieldAlert, 
    AlertCircle, 
    CheckCircle,
    UserCheck,
    Navigation
} from 'lucide-react';

interface Store {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    geofence_radius: number;
    address: string;
}

interface Shift {
    id: number;
    store_id: number;
    user_id: number;
    start_cash: number;
    end_cash: number | null;
    expected_end_cash: number | null;
    difference: number | null;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at: string | null;
    store?: Store;
    user?: { name: string };
    petty_cash?: Array<{
        id: number;
        type: 'in' | 'out' | 'drop';
        amount: number | string;
        description: string;
    }>;
}

interface Attendance {
    id: number;
    store_id: number;
    user_id: number;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

interface AttendanceStat {
    user_id: number;
    total_days: number;
    total_late_minutes: string | number;
    total_work_minutes: string | number;
    user?: {
        id: number;
        name: string;
        role: string;
    };
}

interface ShiftAttendanceProps {
    activeShift: Shift | null;
    activeAttendance: Attendance | null;
    myStore: Store | null;
    shifts: Shift[];
    attendanceStats: AttendanceStat[] | AttendanceStat | null;
}

export default function ShiftAttendance({ activeShift, activeAttendance, myStore, shifts, attendanceStats }: ShiftAttendanceProps) {
    const authUser = usePage().props.auth.user as any;
    const isSuperAdmin = authUser.role === 'superadmin';
    const isViewer = authUser.role === 'viewer';
    const canManageShifts = authUser.role === 'superadmin';
    const canSeeAllShifts = ['superadmin', 'viewer'].includes(authUser.role);
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Clock In Form
    const clockInForm = useForm({
        start_cash: 0,
        latitude: '',
        longitude: ''
    });

    // Clock Out Form
    const clockOutForm = useForm({
        end_cash: 0,
        latitude: '',
        longitude: ''
    });

    // Petty Cash Form
    const pettyForm = useForm({
        type: 'out' as 'in' | 'out',
        amount: 0,
        description: ''
    });

    // Edit Shift Form & State for Admin
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const editForm = useForm({
        start_cash: 0,
        end_cash: 0,
        status: 'closed' as 'open' | 'closed',
        opened_at: '',
        closed_at: '',
    });

    const startEdit = (sh: Shift) => {
        setEditingShift(sh);
        
        // Convert ISO format to datetime-local friendly format (YYYY-MM-DDTHH:MM)
        const formatForInput = (dateStr: string | null) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            // Adjust offset to local timezone
            const tzoffset = d.getTimezoneOffset() * 60000; 
            const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        };

        editForm.setData({
            start_cash: sh.start_cash,
            end_cash: sh.end_cash || 0,
            status: sh.status,
            opened_at: formatForInput(sh.opened_at),
            closed_at: formatForInput(sh.closed_at),
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingShift) return;
        editForm.put(route('shifts.update', editingShift.id), {
            onSuccess: () => {
                setEditingShift(null);
                alert('Shift berhasil diperbarui.');
            },
            onError: (errs) => {
                alert(Object.values(errs).join('\n'));
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data shift ini beserta data absensinya?')) {
            router.delete(route('shifts.destroy', id), {
                onSuccess: () => {
                    alert('Shift dan absensi terkait berhasil dihapus.');
                },
                onError: (errs) => {
                    alert(Object.values(errs).join('\n'));
                }
            });
        }
    };

    // Fetch GPS Coords
    const getGpsLocation = () => {
        if (!navigator.geolocation) {
            setGpsError('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
            return;
        }

        setGpsLoading(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setGpsCoords({ lat, lng });
                
                // Set form coordinates
                clockInForm.setData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
                clockOutForm.setData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
                
                setGpsLoading(false);
            },
            (error) => {
                console.error(error);
                setGpsError('Gagal mendeteksi lokasi GPS Anda. Mohon aktifkan izin GPS browser Anda.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        getGpsLocation();
    }, []);

    const submitClockIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gpsCoords) {
            alert('Lokasi GPS belum terdeteksi. Silakan muat ulang halaman atau klik "Ambil GPS".');
            return;
        }
        clockInForm.post(route('shifts.clock-in'), {
            onSuccess: () => {
                alert('Berhasil masuk absensi & shift dibuka.');
            },
            onError: (errs) => {
                alert(errs.error || Object.values(errs).join('\n'));
            }
        });
    };

    const submitClockOut = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gpsCoords) {
            alert('Lokasi GPS belum terdeteksi. Silakan muat ulang halaman atau klik "Ambil GPS".');
            return;
        }
        clockOutForm.post(route('shifts.clock-out'), {
            onSuccess: () => {
                alert('Shift berhasil ditutup & tercatat keluar.');
            },
            onError: (errs) => {
                alert(errs.error || Object.values(errs).join('\n'));
            }
        });
    };

    const submitPettyOrDrop = (e: React.FormEvent) => {
        e.preventDefault();
        pettyForm.post(route('shifts.petty-cash'), {
            onSuccess: () => {
                pettyForm.reset();
                alert('Pencatatan kas kecil operasional berhasil disimpan.');
            },
            onError: (errs) => {
                alert(errs.error || Object.values(errs).join('\n'));
            }
        });
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
        <AuthenticatedLayout>
            <Head title="Absensi GPS & Shift Kasir" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* GPS Location Banner */}
                    {!isViewer && (
                        <div className="rounded-lg border border-border bg-card p-5 shadow-sm text-card-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`rounded-xl p-3 ${gpsCoords ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                                    <Navigation className={`h-6 w-6 ${gpsLoading ? 'animate-spin' : ''}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Deteksi Lokasi GPS Anda</h4>
                                    {gpsCoords ? (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                            Koordinat Terdeteksi: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-amber-600 font-bold">
                                            {gpsError || 'Sedang mengambil koordinat lokasi satelit...'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={getGpsLocation}
                                className="rounded-xl border border-input px-4 py-2 text-xs font-bold text-gray-700 hover:bg-muted dark:border-input dark:text-gray-300 dark:hover:bg-gray-900"
                            >
                                Refresh GPS
                            </button>
                        </div>
                    )}

                    {/* Geofence Check Information */}
                    {!isViewer && (
                        myStore ? (
                            <div className="rounded-xl bg-muted p-4 dark:bg-background text-xs font-bold text-muted-foreground border dark:border-input flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <p className="text-gray-800 dark:text-gray-200">Cabang Terdaftar: {myStore.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Alamat: {myStore.address}</p>
                                </div>
                                <div>
                                    <p className="text-gray-800 dark:text-gray-200 text-right">Geofence Radius: {myStore.geofence_radius} Meter</p>
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">Target Kordinat: {myStore.latitude}, {myStore.longitude}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-3">
                                <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold">Akun Anda belum terasosiasi dengan cabang toko mana pun.</p>
                                    <p className="text-[10px] text-amber-500/80 font-semibold mt-0.5">
                                        Silakan hubungi administrator atau tetapkan Cabang Toko untuk user Anda di menu <a href="/users" className="underline hover:text-amber-700">Kelola Pengguna</a> agar dapat melakukan absensi masuk.
                                    </p>
                                </div>
                            </div>
                        )
                    )}

                    {!isViewer && (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {/* LEFT COLUMN: ACTIVE WORK PANEL */}
                            <div className="lg:col-span-2 space-y-6">
                            
                            {/* CASE 1: NOT CLOCKED IN */}
                            {!activeShift ? (
                                <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserCheck className="h-5 w-5 text-indigo-500" />
                                        <h3 className="text-lg font-semibold text-foreground">Buka Shift Kasir & Clock-In</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-6">Mulai jam kerja dan buka shift kasir Anda.</p>

                                    <form onSubmit={submitClockIn} className="space-y-4">
                                        <button
                                            type="submit"
                                            disabled={clockInForm.processing || gpsLoading || !myStore}
                                            className={`w-full rounded-2xl py-5 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${!myStore ? 'bg-gray-400 dark:bg-gray-800 cursor-not-allowed text-gray-200 shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'}`}
                                        >
                                            <UserCheck className="h-5 w-5 animate-pulse" />
                                            {!myStore ? 'Cabang Toko Belum Ditetapkan' : clockInForm.processing ? 'Memproses Absensi...' : 'Absen Masuk & Mulai Kerja'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                /* CASE 2: SHIFT OPEN (CLOCKED IN) */
                                <div className="space-y-6">
                                    
                                    {/* Active Shift Header Card */}
                                    <div className="rounded-lg bg-indigo-600 p-6 text-white shadow-sm relative overflow-hidden">
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="rounded bg-card/20 px-2 py-0.5 text-[10px] font-semibold uppercase">Shift Aktif</span>
                                                <span className="text-xs font-bold text-indigo-200">Mulai: {new Date(activeShift.opened_at).toLocaleTimeString('id-ID')}</span>
                                            </div>
                                        </div>
                                        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-card/10" />
                                    </div>

                                     {/* Petty Cash Input form */}
                                     <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                                         <div className="flex items-center gap-2 mb-4">
                                             <Coins className="h-5 w-5 text-indigo-500" />
                                             <h3 className="text-lg font-semibold text-foreground">Kas Kecil Operasional</h3>
                                         </div>
                                         <p className="text-xs text-gray-500 mb-6">Catat pengeluaran kecil (misal bensin, es batu) atau pemasukan kas kecil operasional cabang.</p>

                                         <form onSubmit={submitPettyOrDrop} className="space-y-4">
                                             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                 <div>
                                                     <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tipe Kas Kecil</label>
                                                     <select
                                                         value={pettyForm.data.type}
                                                         onChange={e => pettyForm.setData('type', e.target.value as any)}
                                                         className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                     >
                                                         <option value="out">Kas Operasional Keluar</option>
                                                         <option value="in">Kas Operasional Masuk</option>
                                                     </select>
                                                 </div>
                                                 <div>
                                                     <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nominal (IDR)</label>
                                                     <input
                                                         type="number"
                                                         required
                                                         value={pettyForm.data.amount}
                                                         onChange={e => pettyForm.setData('amount', parseFloat(e.target.value) || 0)}
                                                         className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                     />
                                                 </div>
                                                 <div className="sm:col-span-2">
                                                     <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Keterangan / Rincian</label>
                                                     <input
                                                         type="text"
                                                         required
                                                         value={pettyForm.data.description}
                                                         onChange={e => pettyForm.setData('description', e.target.value)}
                                                         className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background"
                                                         placeholder="Contoh: Beli meterai / bensin"
                                                     />
                                                 </div>
                                             </div>

                                             <button
                                                 type="submit"
                                                 disabled={pettyForm.processing}
                                                 className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                             >
                                                 {pettyForm.processing ? 'Menyimpan...' : 'Simpan Kas Kecil'}
                                             </button>
                                         </form>
                                     </div>
                                 </div>
                             )}
                         </div>

                         {/* RIGHT COLUMN: CLOSE SHIFT AUDIT */}
                         <div>
                             {activeShift && (
                                 <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground space-y-4">
                                     <div className="flex items-center gap-2 mb-2">
                                         <Clock className="h-5 w-5 text-indigo-500" />
                                         <h3 className="text-lg font-semibold text-foreground">Tutup Shift Kasir</h3>
                                     </div>
                                     <p className="text-xs text-gray-500 font-medium">Tutup shift kerja Anda untuk menyelesaikan hari.</p>

                                     <form onSubmit={submitClockOut} className="space-y-4">
                                         <button
                                             type="submit"
                                             disabled={clockOutForm.processing || gpsLoading}
                                             className="w-full rounded-2xl bg-rose-600 py-5 text-sm sm:text-base font-black uppercase tracking-wider text-white hover:bg-rose-700 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2"
                                         >
                                             <Clock className="h-5 w-5" />
                                             {clockOutForm.processing ? 'Memproses...' : 'Tutup Shift & Clock-Out'}
                                         </button>
                                     </form>
                                 </div>
                             )}
                         </div>
                     </div>
                    )}

                    {/* Rekapitulasi Shift & Absensi */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {canSeeAllShifts ? 'Rekapitulasi Shift & Absensi Karyawan' : 'Rekapitulasi Absensi Anda'}
                            </h3>
                        </div>

                        {canSeeAllShifts ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <th className="pb-3 font-semibold">Nama Karyawan</th>
                                            <th className="pb-3 font-semibold text-center">Total Shift (Hari)</th>
                                            <th className="pb-3 font-semibold text-center">Total Telat</th>
                                            <th className="pb-3 font-semibold text-center">Total Jam Kerja</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {!attendanceStats || (Array.isArray(attendanceStats) && attendanceStats.length === 0) ? (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-gray-400">Belum ada rekap absensi tersedia.</td>
                                            </tr>
                                        ) : (
                                            (Array.isArray(attendanceStats) ? attendanceStats : []).map((stat) => {
                                                const lateMins = parseInt(stat.total_late_minutes as string, 10) || 0;
                                                const workMins = parseInt(stat.total_work_minutes as string, 10) || 0;
                                                
                                                const formatMinutes = (mins: number) => {
                                                    if (mins <= 0) return 'Tepat Waktu';
                                                    const hrs = Math.floor(mins / 60);
                                                    const remainingMins = mins % 60;
                                                    if (hrs > 0) {
                                                        return `${hrs}j ${remainingMins}m`;
                                                    }
                                                    return `${remainingMins}m`;
                                                };

                                                const formatWorkTime = (mins: number) => {
                                                    const hrs = Math.floor(mins / 60);
                                                    const remainingMins = mins % 60;
                                                    return `${hrs}j ${remainingMins}m`;
                                                };

                                                return (
                                                    <tr key={stat.user_id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                        <td className="py-4 font-semibold text-foreground">{stat.user?.name || 'Unknown'}</td>
                                                        <td className="py-4 text-center font-bold">{stat.total_days} Hari</td>
                                                        <td className="py-4 text-center">
                                                            <span className={lateMins > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400"}>
                                                                {formatMinutes(lateMins)}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-center text-xs">{formatWorkTime(workMins)}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-border bg-muted/30 p-4">
                                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Shift Kerja</p>
                                    <p className="text-xl font-black text-foreground mt-1">
                                        {((attendanceStats as any)?.total_days) || 0} Hari
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/30 p-4">
                                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Keterlambatan</p>
                                    <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                        {(() => {
                                            const mins = parseInt((attendanceStats as any)?.total_late_minutes as string, 10) || 0;
                                            if (mins <= 0) return '0 Menit';
                                            const hrs = Math.floor(mins / 60);
                                            const remainingMins = mins % 60;
                                            if (hrs > 0) return `${hrs}j ${remainingMins}m`;
                                            return `${remainingMins}m`;
                                        })()}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/30 p-4">
                                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Durasi Kerja</p>
                                    <p className="text-xl font-black text-foreground mt-1">
                                        {(() => {
                                            const mins = parseInt((attendanceStats as any)?.total_work_minutes as string, 10) || 0;
                                            const hrs = Math.floor(mins / 60);
                                            const remainingMins = mins % 60;
                                            return `${hrs}j ${remainingMins}m`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Past Shift logs & Audits */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Riwayat Shift Kasir</h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Kasir / User</th>
                                        {canSeeAllShifts && <th className="pb-3 font-semibold">Cabang</th>}
                                        <th className="pb-3 font-semibold">Buka (Opened)</th>
                                        <th className="pb-3 font-semibold">Tutup (Closed)</th>
                                        {canSeeAllShifts && (
                                            <>
                                                <th className="pb-3 font-semibold">Modal Awal</th>
                                                <th className="pb-3 font-semibold">Uang Akhir</th>
                                                <th className="pb-3 font-semibold">Kas Kecil</th>
                                                <th className="pb-3 font-semibold">Status</th>
                                                {canManageShifts && <th className="pb-3 font-semibold text-right">Aksi</th>}
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {shifts.length === 0 ? (
                                        <tr>
                                            <td colSpan={canSeeAllShifts ? (canManageShifts ? 9 : 8) : 3} className="py-6 text-center text-gray-400">Belum ada riwayat shift terekam.</td>
                                        </tr>
                                    ) : (
                                        shifts.map((sh) => {
                                            return (
                                                <tr key={sh.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                    <td className="py-4 font-semibold text-foreground">{sh.user?.name}</td>
                                                    {canSeeAllShifts && <td className="py-4 text-xs">{sh.store?.name || '-'}</td>}
                                                    <td className="py-4 text-xs">{new Date(sh.opened_at).toLocaleString('id-ID')}</td>
                                                    <td className="py-4 text-xs">{sh.closed_at ? new Date(sh.closed_at).toLocaleString('id-ID') : '-'}</td>
                                                    {canSeeAllShifts && (
                                                        <>
                                                            <td className="py-4 text-xs">{formatCurrency(sh.start_cash)}</td>
                                                            <td className="py-4 text-xs">{sh.end_cash ? formatCurrency(sh.end_cash) : '-'}</td>
                                                            <td className="py-4 text-xs">
                                                                {(() => {
                                                                    const pettyList = sh.petty_cash || [];
                                                                    const pettyIn = pettyList.filter(p => p.type === 'in').reduce((sum, p) => sum + Number(p.amount), 0);
                                                                    const pettyOut = pettyList.filter(p => p.type === 'out').reduce((sum, p) => sum + Number(p.amount), 0);
                                                                    const cashDrop = pettyList.filter(p => p.type === 'drop').reduce((sum, p) => sum + Number(p.amount), 0);
                                                                    
                                                                    if (pettyIn === 0 && pettyOut === 0 && cashDrop === 0) return <span className="text-gray-400 font-semibold">—</span>;
                                                                    
                                                                    return (
                                                                        <div className="space-y-0.5 text-[10px] font-bold">
                                                                            {pettyIn > 0 && <p className="text-emerald-600">Masuk: +{formatCurrency(pettyIn)}</p>}
                                                                            {pettyOut > 0 && <p className="text-rose-600">Keluar: -{formatCurrency(pettyOut)}</p>}
                                                                            {cashDrop > 0 && <p className="text-indigo-600">Drop: -{formatCurrency(cashDrop)}</p>}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="py-4 text-xs">
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sh.status === 'open' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                                                                    {sh.status}
                                                                </span>
                                                            </td>
                                                            {canManageShifts && (
                                                                <td className="py-4 text-right space-x-2">
                                                                    <button
                                                                        onClick={() => startEdit(sh)}
                                                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(sh.id)}
                                                                        className="text-xs font-bold text-rose-600 hover:text-rose-900"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </>
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
            </div>
            {editingShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl text-card-foreground">
                        <h3 className="text-lg font-bold text-foreground mb-4">Edit Data Shift</h3>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Modal Awal (IDR)</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.data.start_cash}
                                    onChange={e => editForm.setData('start_cash', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground animate-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Uang Akhir (IDR)</label>
                                <input
                                    type="number"
                                    value={editForm.data.end_cash}
                                    onChange={e => editForm.setData('end_cash', parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground animate-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Status Shift</label>
                                <select
                                    value={editForm.data.status}
                                    onChange={e => editForm.setData('status', e.target.value as any)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground animate-none"
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Waktu Buka</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={editForm.data.opened_at}
                                    onChange={e => editForm.setData('opened_at', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground animate-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Waktu Tutup</label>
                                <input
                                    type="datetime-local"
                                    value={editForm.data.closed_at}
                                    onChange={e => editForm.setData('closed_at', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground animate-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingShift(null)}
                                    className="rounded-xl border border-input px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
