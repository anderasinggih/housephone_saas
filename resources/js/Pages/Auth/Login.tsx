import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Smartphone } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({
    status,
}: {
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    // Automatic dark mode system sync
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        handleChange(mediaQuery);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans transition-colors duration-300">
            {/* Soft decorative background gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

            <Head title="Log in" />

            <div className="w-full max-w-md z-10">
                {/* Branding / Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-card border border-border rounded-2xl shadow-sm mb-4">
                        <ApplicationLogo className="h-10 w-auto fill-current text-primary" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Welcome Back</h2>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Log in to manage your store inventory & sales</p>
                </div>

                {status && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {status}
                    </div>
                )}

                {/* Login Card */}
                <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 transition-all duration-300">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Mail className="h-4.5 w-4.5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    required
                                    placeholder="name@store.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition duration-200"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-[11px] font-bold text-destructive mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Lock className="h-4.5 w-4.5" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition duration-150"
                                >
                                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] font-bold text-destructive mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <label className="relative flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-input text-primary bg-background focus:ring-primary focus:ring-offset-background transition-all duration-200"
                                />
                                <span className="ms-2.5 text-xs font-bold text-muted-foreground">
                                    Remember my session
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-200"
                        >
                            {processing ? (
                                <div className="h-5 w-5 border-2 border-primary-foreground/35 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-[10px] font-semibold text-muted-foreground">
                    &copy; {new Date().getFullYear()} Housephone SaaS. All rights reserved.
                </div>
            </div>
        </div>
    );
}
