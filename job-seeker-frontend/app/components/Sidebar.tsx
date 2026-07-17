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
  Search,
  Settings,
  Home,
  ChevronLeft,
  Compass,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface SidebarProps {
  user?: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'My Resumes', href: '/dashboard/resumes' },
    { icon: Mail, label: 'Draft & Send', href: '/dashboard/resumes/email-tailor' },
    { icon: User, label: 'Profile Workspace', href: '/dashboard/profile' },
  ];

  const handleLogout = () => {
    logout();
  };

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/dashboard' 
          ? pathname === '/dashboard' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClickItem}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
              isActive
                ? 'bg-zinc-900 border border-zinc-800 text-white shadow-md shadow-black/40'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ─── MOBILE CONTAINER HEADER ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-900/80 px-5 flex items-center justify-between z-40 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-md">
            <Compass className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-zinc-100 font-bold text-xs tracking-wider uppercase">Portal</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-zinc-950 border-r border-zinc-900/80 transition-all duration-300 fixed left-0 top-0 z-30 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Core Brand Header */}
        <div className="p-4 border-b border-zinc-900/80 h-[73px] flex items-center justify-between gap-3 overflow-hidden bg-zinc-900/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 shadow-inner">
              <Compass className="w-4 h-4 text-zinc-300" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xs tracking-wider text-zinc-100 uppercase transition-opacity duration-200">
                JobPortal
              </span>
            )}
          </div>
        </div>

        {/* Action Toggle Pin */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-xl"
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User Workspace Profile Component */}
        <div className="p-3 border-b border-zinc-900/60 bg-zinc-900/5">
          <div className="relative">
            <button
              onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 p-2 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-900 rounded-xl transition-all ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                  <img 
                    src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} 
                    alt={user?.fullName || user?.name || 'User'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-zinc-200 text-xs font-semibold truncate tracking-tight">
                      {user?.fullName || user?.jobSeekerProfile?.fullName || user?.name || 'User Profile'}
                    </p>
                    <p className="text-zinc-500 text-[10px] truncate mt-0.5">
                      {user?.email || user?.jobSeekerProfile?.email || 'unconfigured@identity.net'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-zinc-200' : ''}`} />
                </>
              )}
            </button>

            {/* User Dropdown Menu Card */}
            {showUserMenu && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 p-1 space-y-0.5 animate-fade-in">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border-t border-zinc-900/60 mt-1 pt-2 text-xs font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          <NavLinks />
        </nav>
      </aside>

      {/* ─── MOBILE DRAWER SHEET ───────────────────────────── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden">
              {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                <img src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-xs text-zinc-200 truncate">{user?.fullName || user?.jobSeekerProfile?.fullName || 'Candidate'}</h2>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email || user?.jobSeekerProfile?.email || 'unconfigured@identity.net'}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400"
          >
            <div className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        {/* Mobile Actions Drawer Footer */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 grid grid-cols-2 gap-1.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-zinc-900 text-zinc-400 hover:text-white bg-zinc-900/20 text-xs font-medium"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-red-950/30 bg-red-950/5 text-red-400 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}