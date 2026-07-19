'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FcmProvider } from '../contexts/FcmContext';
import { ToastProvider } from '../components/GlassToastContainer';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  const isFullWidthPage = pathname.includes('/resumes/editor/') || pathname.includes('/resumes/tailor-version/');

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans antialiased flex">
      <Sidebar user={user} />
      {/* Main content — margin controlled by sidebar collapsed state */}
      <main
        className={`
          flex-1 min-w-0
          transition-all duration-300 ease-in-out
          ${isFullWidthPage ? '' : 'overflow-y-auto pt-14 md:pt-0'}
          ${isCollapsed ? 'md:ml-[70px]' : 'md:ml-64'}
        `}
      >
        {isFullWidthPage ? (
          children
        ) : (
          <div className="p-5 sm:p-8 max-w-5xl mx-auto w-full min-h-screen">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FcmProvider>
        <SidebarProvider>
          <DashboardInner>{children}</DashboardInner>
        </SidebarProvider>
      </FcmProvider>
    </ToastProvider>
  );
}