import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
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
}

interface Attendance {
    id: number;
    store_id: number;
    user_id: number;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

interface ShiftAttendanceProps {
    activeShift: Shift | null;
    activeAttendance: Attendance | null;
    myStore: Store | null;
    shifts: Shift[];
}

export default function ShiftAttendance({ activeShift, activeAttendance, myStore, shifts }: ShiftAttendanceProps) {
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

                    {/* Geofence Check Information */}
                    {myStore ? (
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
                    )}

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

                     {/* Past Shift logs & Audits */}
                     <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                         <h3 className="text-lg font-semibold text-foreground mb-4">Riwayat Shift Kasir</h3>
                         
                         <div className="overflow-x-auto">
                             <table className="w-full min-w-[600px] text-left border-collapse text-sm">
                                 <thead>
                                     <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                         <th className="pb-3 font-semibold">Kasir / User</th>
                                         <th className="pb-3 font-semibold">Buka (Opened)</th>
                                         <th className="pb-3 font-semibold">Tutup (Closed)</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                     {shifts.length === 0 ? (
                                         <tr>
                                             <td colSpan={3} className="py-6 text-center text-gray-400">Belum ada riwayat shift terekam.</td>
                                         </tr>
                                     ) : (
                                         shifts.map((sh) => {
                                             return (
                                                 <tr key={sh.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                     <td className="py-4 font-semibold text-foreground">{sh.user?.name}</td>
                                                     <td className="py-4 text-xs">{new Date(sh.opened_at).toLocaleString('id-ID')}</td>
                                                     <td className="py-4 text-xs">{sh.closed_at ? new Date(sh.closed_at).toLocaleString('id-ID') : '-'}</td>
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
        </AuthenticatedLayout>
    );
}
