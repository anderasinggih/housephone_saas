import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Smartphone, 
    Layers, 
    Store, 
    UserCog, 
    History, 
    Users, 
    Clock,
    Sun,
    Moon,
    Menu,
    X,
    Settings as SettingsIcon
} from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    // Dark Mode State & Logic
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // Dynamic Navigation link classes using Shadcn UI theme variables
    const getLinkClass = (isActive: boolean) => {
        return isActive 
            ? "p-2.5 rounded-xl bg-accent text-accent-foreground transition-all duration-200" 
            : "p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200";
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
            <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50 transition-colors duration-300">
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-primary" />
                                </Link>
                            </div>

                            {/* Desktop Icon-Only Navbar using direct Links with Shadcn classes */}
                            <div className="hidden space-x-2 sm:flex items-center">
                                {(user.role === 'superadmin' || user.role === 'viewer') && (
                                    <Link
                                        href={route('dashboard')}
                                        className={getLinkClass(route().current('dashboard'))}
                                        title="Dashboard Analisis"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span className="sr-only">Dashboard</span>
                                    </Link>
                                )}
                                
                                <Link
                                    href={route('ready-stock.index')}
                                    className={getLinkClass(route().current('ready-stock.index'))}
                                    title="Ready Stock"
                                >
                                    <Smartphone className="h-5 w-5" />
                                    <span className="sr-only">Ready Stock</span>
                                </Link>

                                <Link
                                    href={route('manage-stock.index')}
                                    className={getLinkClass(route().current('manage-stock.index'))}
                                    title="Daftar Inventori"
                                >
                                    <Layers className="h-5 w-5" />
                                    <span className="sr-only">Daftar Inventori</span>
                                </Link>

                                <Link
                                    href={route('timeline.index')}
                                    className={getLinkClass(route().current('timeline.index'))}
                                    title="Timeline Aktivitas"
                                >
                                    <History className="h-5 w-5" />
                                    <span className="sr-only">Timeline Aktivitas</span>
                                </Link>

                                {user.role === 'superadmin' && (
                                    <>
                                        <Link
                                            href={route('stores.index')}
                                            className={getLinkClass(route().current('stores.index'))}
                                            title="Kelola Cabang"
                                        >
                                            <Store className="h-5 w-5" />
                                            <span className="sr-only">Kelola Cabang</span>
                                        </Link>
                                        
                                        <div className="relative inline-block text-left align-middle">
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button
                                                        type="button"
                                                        className={getLinkClass(route().current('users.index') || route().current('settings.parameters'))}
                                                        title="Pengaturan"
                                                    >
                                                        <SettingsIcon className="h-5 w-5" />
                                                        <span className="sr-only">Pengaturan</span>
                                                    </button>
                                                </Dropdown.Trigger>

                                                <Dropdown.Content>
                                                    <Dropdown.Link href={route('users.index')}>
                                                        Kelola User
                                                    </Dropdown.Link>
                                                    <Dropdown.Link href={route('settings.parameters')}>
                                                        Parameter Dropdown
                                                    </Dropdown.Link>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        </div>
                                    </>
                                )}

                                <Link
                                    href={route('sales-history.index')}
                                    className={getLinkClass(route().current('sales-history.index'))}
                                    title="Sales History"
                                >
                                    <History className="h-5 w-5" />
                                    <span className="sr-only">Sales History</span>
                                </Link>

                                <Link
                                    href={route('customers.index')}
                                    className={getLinkClass(route().current('customers.index'))}
                                    title="Customers"
                                >
                                    <Users className="h-5 w-5" />
                                    <span className="sr-only">Customers</span>
                                </Link>

                                <Link
                                    href={route('shifts.index')}
                                    className={getLinkClass(route().current('shifts.index'))}
                                    title={user.role === 'karyawan' ? 'Absensi & Shift' : 'Absensi & Shift (Review)'}
                                >
                                    <Clock className="h-5 w-5" />
                                    <span className="sr-only">Absensi & Shift</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top Right: Darkmode & User Profile Dropdown */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            {/* Dark Mode Toggle Button */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition duration-200"
                                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                            </button>

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-xl border border-transparent bg-muted/50 px-3 py-2 text-sm font-bold text-foreground transition hover:bg-accent hover:text-accent-foreground"
                                            >
                                                {user.name}
                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Hamburger mobile menu button */}
                        <div className="-me-2 flex items-center sm:hidden gap-2">
                            {/* Dark Mode Toggle on Mobile */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition rounded-xl"
                            >
                                {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                            </button>

                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
                            >
                                {showingNavigationDropdown ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={
                        (showingNavigationDropdown ? 'block animate-in fade-in slide-in-from-top-4 duration-200' : 'hidden') +
                        ' sm:hidden border-t border-border'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2 bg-card">
                        {(user.role === 'superadmin' || user.role === 'viewer') && (
                            <ResponsiveNavLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                                </div>
                            </ResponsiveNavLink>
                        )}
                        <ResponsiveNavLink
                            href={route('ready-stock.index')}
                            active={route().current('ready-stock.index')}
                        >
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" /> Ready Stock
                            </div>
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('manage-stock.index')}
                            active={route().current('manage-stock.index')}
                        >
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Daftar Inventori
                            </div>
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('timeline.index')}
                            active={route().current('timeline.index')}
                        >
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4" /> Timeline Aktivitas
                            </div>
                        </ResponsiveNavLink>
                        {user.role === 'superadmin' && (
                            <>
                                <ResponsiveNavLink
                                    href={route('stores.index')}
                                    active={route().current('stores.index')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4" /> Kelola Cabang
                                    </div>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('users.index')}
                                    active={route().current('users.index')}
                                >
                                    <div className="flex items-center gap-2">
                                        <UserCog className="h-4 w-4" /> Kelola User
                                    </div>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href={route('settings.parameters')}
                                    active={route().current('settings.parameters')}
                                >
                                    <div className="flex items-center gap-2">
                                        <SettingsIcon className="h-4 w-4" /> Parameter Dropdown
                                    </div>
                                </ResponsiveNavLink>
                            </>
                        )}
                        <ResponsiveNavLink
                            href={route('sales-history.index')}
                            active={route().current('sales-history.index')}
                        >
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4" /> Sales History
                            </div>
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('customers.index')}
                            active={route().current('customers.index')}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Customers
                            </div>
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('shifts.index')}
                            active={route().current('shifts.index')}
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Absensi & Shift
                            </div>
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-border pb-1 pt-4 bg-card">
                        <div className="px-4">
                            <div className="text-base font-bold text-foreground">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="transition-colors duration-300">
                {header && (
                    <div className="mx-auto max-w-none px-4 pt-6 sm:px-6 lg:px-8">
                        <div className="border-b border-border pb-4">
                            {header}
                        </div>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
