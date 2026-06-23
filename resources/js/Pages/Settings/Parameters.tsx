import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Settings, Plus, ToggleLeft, ToggleRight, List } from 'lucide-react';

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

interface ParametersProps {
    parameters: Parameter[];
}

export default function Parameters({ parameters }: ParametersProps) {
    const [newParameterValue, setNewParameterValue] = useState<{ [paramId: number]: string }>({});

    const submitNewParameterValue = (paramId: number) => {
        const valueStr = newParameterValue[paramId];
        if (!valueStr || !valueStr.trim()) return;

        router.post(route('parameters.value.store'), {
            parameter_id: paramId,
            value: valueStr
        }, {
            onSuccess: () => {
                setNewParameterValue(prev => ({ ...prev, [paramId]: '' }));
                alert('Opsi parameter baru berhasil ditambahkan.');
            }
        });
    };

    const toggleParameterStatus = (valueId: number) => {
        if(confirm('Ubah status aktif opsi parameter ini?')) {
            router.post(route('parameters.value.toggle', valueId));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Parameter Dropdown" />

            <div className="py-8">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <Settings className="h-6 w-6 text-indigo-500" />
                            Pengaturan Parameter Dropdown
                        </h2>

                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {parameters.map((param) => (
                            <div key={param.id} className="rounded-lg border border-border bg-card p-6 shadow-sm text-card-foreground">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-base font-semibold text-foreground">
                                        Parameter: {param.name}
                                    </h4>
                                    <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Kategori: {param.category}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Opsi pilihan yang muncul saat input stok barang baru.
                                </p>

                                {/* Parameter values list */}
                                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                                    {param.values.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-3 text-center">Belum ada opsi.</p>
                                    ) : (
                                        param.values.map((val) => (
                                            <div key={val.id} className="flex justify-between items-center bg-muted/30 dark:bg-background p-2.5 rounded-lg border dark:border-input hover:bg-muted/50 transition">
                                                <span className={`text-xs font-semibold ${val.is_active ? 'text-foreground' : 'text-muted-foreground/60 line-through'}`}>
                                                    {val.value}
                                                </span>
                                                <button
                                                    onClick={() => toggleParameterStatus(val.id)}
                                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                                                        val.is_active 
                                                            ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400' 
                                                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {val.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add new parameter value form */}
                                <div className="flex gap-2 pt-4 border-t border-border dark:border-input">
                                    <input
                                        type="text"
                                        placeholder={`Tambah opsi ${param.name}...`}
                                        value={newParameterValue[param.id] || ''}
                                        onChange={e => setNewParameterValue(prev => ({ ...prev, [param.id]: e.target.value }))}
                                        className="flex-1 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-bold dark:border-input dark:bg-background dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={() => submitNewParameterValue(param.id)}
                                        className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition flex items-center gap-1"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Tambah
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
