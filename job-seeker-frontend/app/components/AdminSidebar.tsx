'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings2,
  ChevronLeft,
  X,
  LogOut,
  Sparkles,
  BarChart3,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  company?: any;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

const navItems = [
  { name: 'Overview',        href: '/admin/dashboard',               icon: LayoutDashboard, group: 'Platform'   },
  { name: 'Analytics',       href: '/admin/dashboard/analytics',     icon: BarChart3,       group: 'Platform'   },
  { name: 'Talent Pool',     href: '/admin/dashboard/talent-pool',   icon: Users,           group: 'Platform'   },
  { name: 'Resumes',         href: '/admin/dashboard/resumes',       icon: FileText,        group: 'Platform'   },
  { name: 'Platform Config', href: '/admin/dashboard/settings',      icon: Settings2,       group: 'System'     },
];

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

  useEffect(() => { setIsMounted(true); }, []);

  const filteredNav = useMemo(() => {
    if (!isMounted || isLoading) return [];
    return navItems;
  }, [isMounted, isLoading]);

  const groups = useMemo(() => {
    const g: Record<string, typeof navItems> = {};
    for (const item of filteredNav) {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    }
    return g;
  }, [filteredNav]);

  function NavLinks({ onClickItem }: { onClickItem?: () => void }) {
    return (
      <>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-4">
            {!isCollapsed && (
              <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pb-1.5">{group}</p>
            )}
            {items.map(item => {
              const isActive = item.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClickItem}
                  data-tooltip={isCollapsed ? item.name : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
                    transition-all duration-200 group relative mb-0.5
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 border border-transparent'
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  {isActive && isCollapsed && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-zinc-950 border-r border-zinc-900 transition-all duration-300 relative z-30 select-none ${isCollapsed ? 'w-[70px]' : 'w-64'}`}
      >
        {/* Brand */}
        <div className={`p-4 border-b border-zinc-900 h-[65px] flex items-center gap-3 overflow-hidden bg-zinc-900/10 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-zinc-100 truncate leading-tight">DearHR</h2>
              <span className="text-[9px] text-amber-400/80 uppercase tracking-widest font-semibold">Admin Console</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 -right-3.5 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all shadow-xl z-10"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Admin badge */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-zinc-900/60">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-amber-300 truncate">{user?.email || 'admin@dearhr.com'}</p>
                <p className="text-[9px] text-amber-500/60 uppercase tracking-wider">Platform Admin</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar mt-2">
          <NavLinks />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-900">
          <button
            onClick={logout}
            data-tooltip={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-red-400 transition-colors" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER ─── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transform transition-transform duration-300 md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-xs text-zinc-100">DearHR Admin</h2>
              <p className="text-[9px] text-amber-400/70 uppercase tracking-wider">Console</p>
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button onClick={() => { setIsMobileOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all duration-200">
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
