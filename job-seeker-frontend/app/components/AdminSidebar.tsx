'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Building2,
  ChevronLeft,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  company?: any;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function AdminSidebar({
  company,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredNav = useMemo(() => {
    const hasAccess = isMounted && !isLoading;
    return [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        visible: hasAccess,
      },
      {
        name: 'All Resumes',
        href: '/admin/dashboard/talent-pool',
        icon: FileText,
        visible: hasAccess,
      },
    ].filter(item => item.visible);
  }, [isMounted, isLoading]);

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {filteredNav.map(item => {
        const isActive =
          item.href === '/admin/dashboard'
            ? pathname === '/admin/dashboard'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClickItem}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group duration-200 ${
              isActive
                ? 'bg-zinc-900 border border-zinc-800 text-white shadow-md shadow-black/40'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30 border border-transparent'
            }`}
          >
            <item.icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
            />
            <span
              className={`transition-opacity duration-200 ${
                isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-zinc-950 border-r border-r-zinc-900 transition-all duration-300 relative z-30 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-zinc-900 h-auto min-h-[73px] py-4 flex items-center justify-between gap-3 overflow-hidden bg-zinc-900/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 border border-zinc-800 rounded-xl bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <Building2 className="w-4 h-4 text-zinc-300" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h2 className="font-semibold text-xs tracking-wide text-zinc-100 truncate uppercase">
                  DearHR Admin
                </h2>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {user?.email || 'admin@dearhr.com'}
                </p>
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
                    Platform Admin
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-xl"
        >
          <ChevronLeft
            className={`w-3 h-3 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar mt-2">
          <NavLinks />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-900">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-500/70 group-hover:text-red-400" />
            <span
              className={`transition-opacity duration-200 ${
                isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER ─── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-zinc-900 h-auto min-h-[73px] py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 border border-zinc-800 rounded-xl bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <Building2 className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-xs tracking-wide text-zinc-200 truncate uppercase">
                DearHR Admin
              </h2>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {user?.email || 'admin@dearhr.com'}
              </p>
              <div className="mt-1">
                <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
                  Platform Admin
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-500/70" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
