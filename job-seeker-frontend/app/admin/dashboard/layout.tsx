'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import AdminSidebar from '@/app/components/AdminSidebar';
import { ToastProvider } from '@/app/components/GlassToastContainer';
import { Menu, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAdmin, isAuthenticated, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-t-amber-400 animate-spin" />
          </div>
          <p className="text-[11px] text-zinc-500 tracking-widest uppercase font-medium">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-black overflow-hidden font-sans text-zinc-200 antialiased">
        <AdminSidebar
          company={{ name: 'Platform Admin', email: user?.email || '', logoUrl: null }}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main area — margin adjusts with sidebar */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-[70px]' : 'md:ml-64'}`}
        >
          {/* Mobile Header */}
          <header className="flex md:hidden items-center justify-between px-5 h-14 bg-zinc-950 border-b border-zinc-900 shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold tracking-wide text-zinc-200 uppercase">Admin Console</span>
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
            <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
