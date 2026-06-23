import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { 
    Store as StoreIcon, 
    Plus, 
    Edit, 
    Trash2, 
    MapPin, 
    Navigation, 
    Users, 
    Smartphone, 
    Calendar,
    Settings
} from 'lucide-react';

interface Store {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    geofence_radius: number;
    users_count: number;
    stocks_count: number;
    created_at: string;
}

interface IndexProps {
    stores: Store[];
}

interface MapPickerProps {
    latitude: string | number;
    longitude: string | number;
    onChange: (lat: string, lng: string) => void;
}

function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
            return;
        }

        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                onChange(lat, lng);
                setGpsLoading(false);
            },
            (error) => {
                console.error(error);
                alert('Gagal mendeteksi lokasi GPS Anda. Mohon aktifkan izin GPS browser Anda.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        let active = true;

        Promise.all([
            import('leaflet'),
            import('leaflet/dist/leaflet.css' as any),
        ]).then(([L]) => {
            if (!active || !containerRef.current) return;

            const icon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            });

            const lat = parseFloat(latitude as string) || -6.200000;
            const lng = parseFloat(longitude as string) || 106.816666;

            const map = L.map(containerRef.current).setView([lat, lng], 13);
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
            markerRef.current = marker;

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
            });

            map.on('click', (e: any) => {
                const pos = e.latlng;
                marker.setLatLng(pos);
                onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
            });

            // Call multiple times to ensure container is fully rendered when invalidating size
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 500);
        });

        return () => {
            active = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        if (!isNaN(lat) && !isNaN(lng) && mapRef.current && markerRef.current) {
            const currentPos = markerRef.current.getLatLng();
            if (currentPos.lat.toFixed(6) !== lat.toFixed(6) || currentPos.lng.toFixed(6) !== lng.toFixed(6)) {
                markerRef.current.setLatLng([lat, lng]);
                mapRef.current.panTo([lat, lng]);
            }
        }
    }, [latitude, longitude]);

    return (
        <div className="space-y-1 my-3">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-gray-400">Pilih Titik di Peta (GPS)</label>
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gpsLoading}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                    <Navigation className={`h-3 w-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                    {gpsLoading ? 'Mengambil GPS...' : 'Gunakan Lokasi Saat Ini'}
                </button>
            </div>
            <div ref={containerRef} className="h-44 w-full rounded-xl border border-input overflow-hidden z-10" />
            <p className="text-[9px] text-gray-400 font-medium">Klik peta atau geser pin merah untuk memposisikan letak toko secara presisi.</p>
        </div>
    );
}

export default function Index({ stores }: IndexProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);

    const addForm = useForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        geofence_radius: 100
    });

    const editForm = useForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        geofence_radius: 100
    });

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('stores.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
                alert('Cabang berhasil ditambahkan!');
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStore) return;
        editForm.patch(route('stores.update', editingStore.id), {
            onSuccess: () => {
                setEditingStore(null);
                alert('Cabang berhasil diperbarui!');
            }
        });
    };

    const deleteStore = (store: Store) => {
        if (confirm(`Apakah Anda yakin ingin menghapus cabang ${store.name}? Tindakan ini tidak bisa dibatalkan.`)) {
            useForm().delete(route('stores.destroy', store.id), {
                onSuccess: () => {
                    alert('Cabang berhasil dihapus.');
                },
                onError: (errors: any) => {
                    if (errors.error) {
                        alert(errors.error);
                    }
                }
            });
        }
    };

    const openEdit = (store: Store) => {
        setEditingStore(store);
        editForm.setData({
            name: store.name,
            address: store.address,
            latitude: store.latitude.toString(),
            longitude: store.longitude.toString(),
            geofence_radius: store.geofence_radius
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
                        <Plus className="h-4 w-4" /> Tambah Cabang
                    </button>
                </div>
            }
        >
            <Head title="Kelola Cabang Toko" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Stores List Table */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-input text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 font-semibold">Nama Cabang</th>
                                        <th className="pb-3 font-semibold">Alamat</th>
                                        <th className="pb-3 font-semibold">Lokasi GPS (Lat/Lng)</th>
                                        <th className="pb-3 font-semibold text-center">Radius Geofence</th>
                                        <th className="pb-3 font-semibold text-center">Karyawan</th>
                                        <th className="pb-3 font-semibold text-center">Unit Stok</th>
                                        <th className="pb-3 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {stores.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-400">Belum ada cabang terdaftar.</td>
                                        </tr>
                                    ) : (
                                        stores.map((store) => (
                                            <tr key={store.id} className="hover:bg-muted/50 dark:hover:bg-gray-900/50">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <StoreIcon className="h-4 w-4 text-indigo-500" />
                                                        <span className="font-semibold text-foreground">{store.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="flex items-center gap-1 max-w-[200px] truncate" title={store.address}>
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                        {store.address}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="flex items-center gap-1 font-mono text-xs">
                                                        <Navigation className="h-3.5 w-3.5 text-gray-400" />
                                                        {store.latitude}, {store.longitude}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-center font-semibold text-foreground">
                                                    {store.geofence_radius} Meter
                                                </td>
                                                <td className="py-4 text-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {store.users_count} Orang
                                                    </span>
                                                </td>
                                                <td className="py-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Smartphone className="h-3.5 w-3.5" />
                                                        {store.stocks_count} Unit
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEdit(store)}
                                                        className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteStore(store)}
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

            {/* ADD STORE MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Tambah Cabang Toko Baru</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Buat cabang baru dan tetapkan target geofence GPS.</p>

                        <form onSubmit={submitAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Cabang</label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.data.name}
                                    onChange={e => addForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="Contoh: Housephone Cabang Depok"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Alamat Cabang</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={addForm.data.address}
                                    onChange={e => addForm.setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    placeholder="Alamat lengkap cabang..."
                                />
                            </div>

                            <MapPicker 
                                latitude={addForm.data.latitude} 
                                longitude={addForm.data.longitude} 
                                onChange={(lat, lng) => {
                                    addForm.setData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                }} 
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={addForm.data.latitude}
                                        onChange={e => addForm.setData('latitude', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                        placeholder="-6.12345"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={addForm.data.longitude}
                                        onChange={e => addForm.setData('longitude', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                        placeholder="106.12345"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Radius Geofence Absensi (Meter)</label>
                                <input
                                    type="number"
                                    required
                                    min={10}
                                    value={addForm.data.geofence_radius}
                                    onChange={e => addForm.setData('geofence_radius', parseInt(e.target.value) || 100)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
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
                                    Simpan Cabang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT STORE MODAL */}
            {editingStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-sm dark:bg-background border dark:border-input">
                        <h4 className="text-lg font-semibold text-foreground">Edit Detail Cabang Toko</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Ubah spesifikasi koordinat atau nama cabang.</p>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nama Cabang</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Alamat Cabang</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={editForm.data.address}
                                    onChange={e => editForm.setData('address', e.target.value)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
                            </div>

                            <MapPicker 
                                latitude={editForm.data.latitude} 
                                longitude={editForm.data.longitude} 
                                onChange={(lat, lng) => {
                                    editForm.setData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                }} 
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={editForm.data.latitude}
                                        onChange={e => editForm.setData('latitude', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={editForm.data.longitude}
                                        onChange={e => editForm.setData('longitude', e.target.value)}
                                        className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Radius Geofence Absensi (Meter)</label>
                                <input
                                    type="number"
                                    required
                                    min={10}
                                    value={editForm.data.geofence_radius}
                                    onChange={e => editForm.setData('geofence_radius', parseInt(e.target.value) || 100)}
                                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-bold dark:border-input dark:bg-background dark:text-gray-100"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border dark:border-input">
                                <button
                                    type="button"
                                    onClick={() => setEditingStore(null)}
                                    className="flex-1 rounded-xl border border-input py-2.5 text-xs font-semibold text-gray-500 hover:bg-muted dark:border-input"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Perbarui Cabang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
