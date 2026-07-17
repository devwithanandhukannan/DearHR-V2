'use client';

import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FcmProvider } from '../contexts/FcmContext';
import { ToastProvider } from '../components/GlassToastContainer'; // ⚡ ടോസ്റ്റ് പ്രൊവൈഡർ ഇമ്പോർട്ട് ചെയ്യുക

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
        <ToastProvider>
      <FcmProvider>
        <div className="min-h-screen bg-black text-zinc-200 font-sans antialiased flex">
          {/* Structural Nav Layer */}
          <Sidebar user={user} />
          
          {/* Content Stream Pipeline */}
          <main className="flex-1 min-w-0 overflow-y-auto md:pl-20 group-has-[aside:not(.w-\[70px\])]:md:pl-64 transition-all duration-300 pt-14 md:pt-0">
            <div className="p-5 sm:p-8 max-w-5xl mx-auto w-full min-h-screen">
              {children}
            </div>
          </main>
        </div>
      </FcmProvider>
    </ToastProvider>
  );
}