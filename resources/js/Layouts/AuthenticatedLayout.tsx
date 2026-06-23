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
    Settings as SettingsIcon,
    Activity,
    MoreHorizontal,
    LogOut,
    User
} from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showMobileMore, setShowMobileMore] = useState(false);
    const [showMobileSettings, setShowMobileSettings] = useState(false);

    const toggleMobileMore = () => {
        setShowMobileMore(!showMobileMore);
        setShowMobileSettings(false);
    };

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved === 'dark' || saved === 'light') return saved;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const checkedInToday = (usePage().props.auth as any).checkedInToday;
    const isKaryawanNotCheckedIn = user.role === 'karyawan' && !checkedInToday;

    // Dynamic Navigation link classes using Shadcn UI theme variables
    const getLinkClass = (isActive: boolean) => {
        if (isKaryawanNotCheckedIn) {
            return isActive 
                ? "p-2.5 rounded-full bg-white/20 border border-white/40 text-white font-bold shadow-sm transition-all duration-200" 
                : "p-2.5 rounded-full text-white/80 border border-transparent hover:bg-white/10 hover:text-white transition-all duration-200";
        }
        return isActive 
            ? "p-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold shadow-sm transition-all duration-200" 
            : "p-2.5 rounded-full text-muted-foreground border border-transparent hover:bg-foreground/10 hover:text-foreground hover:border-foreground/20 transition-all duration-200";
    };

    // Dynamically build bottom navbar tabs based on role
    const getMobileTabs = () => {
        return [
            { name: 'Selling', href: route('selling.index'), icon: Smartphone, current: route().current('selling.index') },
            { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: route().current('dashboard') },
            { name: 'Sale Data', href: route('sale-data.index'), icon: Layers, current: route().current('sale-data.index') },
        ];
    };

    const getMoreMenuItems = () => {
        const items = [];
        
        // Show Dashboard in More if not superadmin but is viewer
        if (user.role === 'viewer') {
            items.push({ name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: route().current('dashboard') });
        }
        
        items.push({ name: 'Activities', href: route('timeline.index'), icon: Activity, current: route().current('timeline.index') });
        items.push({ name: 'History', href: route('sales-history.index'), icon: History, current: route().current('sales-history.index') });
        items.push({ name: 'Customers', href: route('customers.index'), icon: Users, current: route().current('customers.index') });
        items.push({ name: 'Shifts', href: route('shifts.index'), icon: Clock, current: route().current('shifts.index') });
        
        if (user.role === 'superadmin') {
            items.push({ name: 'Stores', href: route('stores.index'), icon: Store, current: route().current('stores.index') });
        }
        
        return items;
    };

    const mobileTabs = getMobileTabs();

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
            {/* Top Navbar: Hidden on mobile, visible on desktop with Liquid Glass design */}
            <nav className={`hidden sm:block border-b sticky top-0 z-50 transition-all duration-300 ${
                isKaryawanNotCheckedIn 
                    ? 'bg-rose-600 border-rose-700 text-white' 
                    : 'border-white/20 dark:border-white/5 bg-background/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]'
            }`}>
                <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className={`block h-9 w-auto fill-current ${isKaryawanNotCheckedIn ? 'text-white' : 'text-primary'}`} />
                                </Link>
                            </div>

                            {/* Desktop Icon-Only Navbar using direct Links with Shadcn classes */}
                            <div className="hidden space-x-2 sm:flex items-center">
                                {(user.role === 'superadmin' || user.role === 'viewer' || user.role === 'karyawan') && (
                                    <Link
                                        href={route('dashboard')}
                                        className={getLinkClass(route().current('dashboard'))}
                                        title="Dashboard"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span className="sr-only">Dashboard</span>
                                    </Link>
                                )}
                                
                                <Link
                                    href={route('selling.index')}
                                    className={getLinkClass(route().current('selling.index'))}
                                    title="Selling"
                                >
                                    <Smartphone className="h-5 w-5" />
                                    <span className="sr-only">Selling</span>
                                </Link>

                                <Link
                                    href={route('sale-data.index')}
                                    className={getLinkClass(route().current('sale-data.index'))}
                                    title="Sale Data"
                                >
                                    <Layers className="h-5 w-5" />
                                    <span className="sr-only">Sale Data</span>
                                </Link>

                                <Link
                                    href={route('timeline.index')}
                                    className={getLinkClass(route().current('timeline.index'))}
                                    title="Activities"
                                >
                                    <Activity className="h-5 w-5" />
                                    <span className="sr-only">Activities</span>
                                </Link>

                                {user.role === 'superadmin' && (
                                    <Link
                                        href={route('stores.index')}
                                        className={getLinkClass(route().current('stores.index'))}
                                        title="Stores"
                                    >
                                        <Store className="h-5 w-5" />
                                        <span className="sr-only">Stores</span>
                                    </Link>
                                )}

                                <Link
                                    href={route('sales-history.index')}
                                    className={getLinkClass(route().current('sales-history.index'))}
                                    title="History"
                                >
                                    <History className="h-5 w-5" />
                                    <span className="sr-only">History</span>
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
                                    title="Shifts"
                                >
                                    <Clock className="h-5 w-5" />
                                    <span className="sr-only">Shifts</span>
                                </Link>
                            </div>
                        </div>

                        {/* Top Right: Darkmode, Settings, User Profile */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-full text-muted-foreground border border-transparent hover:bg-foreground/10 hover:text-foreground hover:border-foreground/20 transition-all duration-200"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>

                            {/* Settings Dropdown */}
                            {user.role === 'superadmin' && (
                                <div className="relative inline-block text-left align-middle">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className={getLinkClass(route().current('users.index') || route().current('settings.parameters') || route().current('settings.general'))}
                                                title="Settings"
                                            >
                                                <SettingsIcon className="h-5 w-5" />
                                                <span className="sr-only">Settings</span>
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('users.index')}>
                                                Users
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('settings.parameters')}>
                                                Parameters
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('settings.general')}>
                                                General Settings
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            )}

                            {/* Profile Dropdown */}
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
                    </div>
                </div>
            </nav>

            {/* Mobile Floating Bottom Navbar: Slim, Liquid Glass, & Rounded-full */}
            <div className={`sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 h-16 rounded-full border shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-between px-3 py-1 w-[94%] max-w-md transition-all duration-300 ${
                isKaryawanNotCheckedIn 
                    ? 'bg-rose-600 border-rose-700 text-white' 
                    : 'bg-background/60 backdrop-blur-xl border-white/20 dark:border-white/10'
            }`}>
                {mobileTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <div key={tab.name} className="flex-1 flex justify-center">
                            <Link
                                href={tab.href}
                                className={`flex flex-col items-center justify-center w-16 h-12 rounded-full border transition-all duration-200 ${
                                    isKaryawanNotCheckedIn
                                        ? tab.current 
                                            ? 'text-white bg-white/20 border-white/30 font-bold shadow-sm' 
                                            : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                                        : tab.current 
                                            ? 'text-primary bg-primary/10 border-primary/20 font-bold shadow-sm' 
                                            : 'border-transparent text-muted-foreground hover:bg-foreground/10 hover:text-foreground hover:border-foreground/20'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-[9px] font-bold mt-0.5">{tab.name}</span>
                            </Link>
                        </div>
                    );
                })}
 
                <div className="flex-1 flex justify-center">
                    <button
                        onClick={toggleMobileMore}
                        className={`flex flex-col items-center justify-center w-16 h-12 rounded-full border transition-all duration-200 ${
                            isKaryawanNotCheckedIn
                                ? showMobileMore 
                                    ? 'text-white bg-white/20 border-white/30 font-bold shadow-sm' 
                                    : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                                : showMobileMore 
                                    ? 'text-primary bg-primary/10 border-primary/20 font-bold shadow-sm' 
                                    : 'border-transparent text-muted-foreground hover:bg-foreground/10 hover:text-foreground hover:border-foreground/20'
                        }`}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[9px] font-bold mt-0.5">More</span>
                    </button>
                </div>
            </div>

            {/* Mobile More Overlay Panel */}
            {showMobileMore && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="sm:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
                        onClick={toggleMobileMore}
                    />
                    
                    {/* Panel */}
                    <div className="sm:hidden fixed bottom-24 left-4 right-4 z-40 p-5 rounded-2xl bg-card border border-border shadow-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                            <h3 className="font-bold text-lg text-foreground">Menu</h3>
                            <button 
                                onClick={toggleMobileMore}
                                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {!showMobileSettings ? (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {getMoreMenuItems().map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setShowMobileMore(false)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition duration-200 ${item.current ? 'bg-primary/10 border-primary/30 text-primary font-bold' : 'bg-muted/50 border-transparent hover:bg-foreground/5 text-foreground'}`}
                                        >
                                            <Icon className="h-6 w-6 mb-2" />
                                            <span className="text-sm font-semibold">{item.name}</span>
                                        </Link>
                                    );
                                })}

                                {user.role === 'superadmin' && (
                                    <button
                                        onClick={() => setShowMobileSettings(true)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border bg-muted/50 border-transparent hover:bg-foreground/5 text-foreground transition duration-200"
                                    >
                                        <SettingsIcon className="h-6 w-6 mb-2" />
                                        <span className="text-sm font-semibold">Settings</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <button 
                                        onClick={() => setShowMobileSettings(false)}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        &larr; Back to Menu
                                    </button>
                                </div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Settings</h4>
                                <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-xl">
                                    <Link
                                        href={route('users.index')}
                                        onClick={() => setShowMobileMore(false)}
                                        className={`flex items-center justify-center py-2.5 px-1 rounded-lg text-[10px] font-bold transition duration-200 ${route().current('users.index') ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <UserCog className="h-3.5 w-3.5 mr-1" /> Users
                                    </Link>
                                    <Link
                                        href={route('settings.parameters')}
                                        onClick={() => setShowMobileMore(false)}
                                        className={`flex items-center justify-center py-2.5 px-1 rounded-lg text-[10px] font-bold transition duration-200 ${route().current('settings.parameters') ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <SettingsIcon className="h-3.5 w-3.5 mr-1" /> Params
                                    </Link>
                                    <Link
                                        href={route('settings.general')}
                                        onClick={() => setShowMobileMore(false)}
                                        className={`flex items-center justify-center py-2.5 px-1 rounded-lg text-[10px] font-bold transition duration-200 ${route().current('settings.general') ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <SettingsIcon className="h-3.5 w-3.5 mr-1" /> General
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-border pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm font-bold text-foreground">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    onClick={() => setShowMobileMore(false)}
                                    className="p-2 rounded-xl bg-muted text-foreground hover:bg-accent"
                                    title="Profile"
                                >
                                    <User className="h-4 w-4" />
                                </Link>
                            </div>

                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-sm transition duration-200"
                            >
                                <LogOut className="h-4 w-4" /> Log Out
                            </Link>
                        </div>
                    </div>
                </>
            )}

            <main className="pb-28 sm:pb-0 transition-colors duration-300">
                {header && (
                    <div className="mx-auto max-w-none px-4 pt-6 sm:px-6 lg:px-8">
                        <div className="pb-4">
                            {header}
                        </div>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
