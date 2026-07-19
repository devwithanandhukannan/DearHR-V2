'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Calendar,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Home,
  ChevronLeft,
  Mail,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSidebar } from '@/app/contexts/SidebarContext';

import api from '@/app/lib/axios';

interface SidebarProps {
  user?: any;
}

const menuItems = [
  { icon: Home,      label: 'Dashboard',         href: '/dashboard',                  exact: true  },
  { icon: FileText,  label: 'My Resumes',         href: '/dashboard/resumes',          exact: false },
  { icon: Briefcase, label: 'Job Cart',           href: '/dashboard/resumes?cart=true',exact: false },
  { icon: Calendar,  label: 'Tracker Board',      href: '/dashboard/tracker',          exact: false },
  { icon: Mail,      label: 'Draft & Send',       href: '/dashboard/resumes/email-tailor', exact: false },
  { icon: User,      label: 'Profile',            href: '/dashboard/profile',          exact: false },
];

function NavLinks({ isCollapsed, onClickItem }: { isCollapsed: boolean; onClickItem?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartCount, setCartCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const res = await api.get('/jobseeker/job-descriptions');
        if (res.data.success) {
          setCartCount(res.data.data.length);
        }
      } catch (e) {
        console.error('Failed to fetch job description count for sidebar', e);
      }
    };
    fetchCartCount();
    window.addEventListener('focus', fetchCartCount);
    return () => window.removeEventListener('focus', fetchCartCount);
  }, []);

  return (
    <>
      {menuItems.map((item) => {
        const isCartActive  = item.label === 'Job Cart' && pathname === '/dashboard/resumes' && searchParams.get('cart') === 'true';
        const isResumeActive = item.label === 'My Resumes' && pathname === '/dashboard/resumes' && !searchParams.get('cart');
        const isActive = item.exact
          ? pathname === item.href
          : item.label === 'Job Cart'
            ? isCartActive
            : item.label === 'My Resumes'
              ? isResumeActive
              : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClickItem}
            data-tooltip={isCollapsed ? item.label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
              transition-all duration-200 group relative
              ${isCollapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-zinc-900 border border-zinc-800 text-white shadow-sm shadow-black/60'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 border border-transparent'
              }
            `}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            {!isCollapsed && (
              <span className="truncate flex-1">{item.label}</span>
            )}
            {item.label === 'Job Cart' && cartCount !== null && cartCount > 0 && (
              <span className={`bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}`}>
                {cartCount}
              </span>
            )}
            {/* Active indicator dot */}
            {isActive && isCollapsed && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => logout();

  const displayName  = user?.fullName || user?.jobSeekerProfile?.fullName || user?.name || 'User';
  const displayEmail = user?.email    || user?.jobSeekerProfile?.email    || '';
  const photoUrl     = user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl;

  return (
    <>
      {/* ─── MOBILE HEADER ──────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-900/80 px-4 flex items-center justify-between z-40 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-zinc-100 font-bold text-xs tracking-wider uppercase">DearHR</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white transition-colors"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── DESKTOP SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col h-screen bg-zinc-950 border-r border-zinc-900/80
          transition-all duration-300 fixed left-0 top-0 z-30 select-none
          ${isCollapsed ? 'w-[70px]' : 'w-64'}
        `}
      >
        {/* Brand */}
        <div className={`p-4 border-b border-zinc-900/80 h-[65px] flex items-center gap-3 overflow-hidden bg-zinc-900/10 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-sm text-zinc-100 tracking-tight block leading-tight">DearHR</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Career Studio</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute top-4 -right-3.5 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all shadow-xl z-10"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User Profile */}
        <div className="p-3 border-b border-zinc-900/60 bg-zinc-900/5">
          <div className="relative">
            <button
              onClick={() => !isCollapsed && setShowUserMenu(v => !v)}
              className={`w-full flex items-center gap-3 p-2 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-900 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-zinc-200 text-xs font-semibold truncate">{displayName}</p>
                    <p className="text-zinc-500 text-[10px] truncate mt-0.5">{displayEmail || 'No email set'}</p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {showUserMenu && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 p-1 space-y-0.5 animate-fade-in">
                <Link href="/dashboard/profile" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </Link>
                <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
                <div className="border-t border-zinc-900/60 mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors text-xs font-medium">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar mt-1">
          {!isCollapsed && (
            <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pb-2 pt-1">Navigation</p>
          )}
          <NavLinks isCollapsed={isCollapsed} />
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-zinc-900/60">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-zinc-500 truncate">Platform active</span>
            </div>
          </div>
        )}
      </aside>

      {/* ─── MOBILE OVERLAY ─────────────────────────────────────────── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transform transition-transform duration-300 md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xs text-zinc-100 truncate">DearHR</h2>
              <p className="text-[10px] text-zinc-500 truncate">{displayEmail}</p>
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          <NavLinks isCollapsed={false} onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        <div className="p-3 border-t border-zinc-900 grid grid-cols-2 gap-1.5">
          <Link href="/dashboard/settings" onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-zinc-900 text-zinc-400 hover:text-white bg-zinc-900/20 text-xs font-medium">
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-red-950/30 bg-red-950/5 text-red-400 text-xs font-medium">
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}