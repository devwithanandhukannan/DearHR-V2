'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import AdminSidebar from '@/app/components/AdminSidebar';
import { ToastProvider } from '@/app/components/GlassToastContainer';
import { Menu, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAdmin, isAuthenticated, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  // Extra client-side role guard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace('/login');
    }
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border border-zinc-900 border-t-zinc-400" />
          <p className="text-[11px] text-zinc-500 tracking-wider uppercase font-medium">
            Synchronizing Workspace Core...
          </p>
        </div>
      </div>
    );
  }

  const adminData = {
    name: 'Platform Admin',
    email: user?.email || '',
    logoUrl: null,
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-black overflow-hidden font-sans text-zinc-200 antialiased">
        <AdminSidebar
          company={adminData}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="flex md:hidden items-center justify-between px-5 h-14 bg-zinc-950 border-b border-zinc-900 shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-200 truncate max-w-[140px] uppercase">
                {adminData.name}
              </span>
            </div>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -mr-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 active:bg-zinc-900"
            >
              <Menu className="w-4 h-4" />
            </button>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-black custom-scrollbar">
            <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
