'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { setAccessToken } from '@/app/lib/axios';

// ─── Role Bitmasks ─────────────────────────────────────────────────────────
// globalRoles & 1 → Job Seeker
// globalRoles & 2 → Platform Admin
// ───────────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email?: string;
  mobileNumber?: string;
  globalRoles: number;
  fullName?: string;
  hasEmail?: boolean;
  hasFullName?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  isAdmin: boolean;
  login: (payload: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ─── Session Init ─────────────────────────────────────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          if (response.data.accessToken) {
            setAccessToken(response.data.accessToken);
            localStorage.setItem('token', response.data.accessToken);
          }
        } else {
          throw new Error('Not authenticated');
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // ─── Route Guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    const isAdminUser = Boolean(user && (user.globalRoles & 2) === 2);
    const isJobSeeker = Boolean(user && (user.globalRoles & 1) === 1);

    const onAdminLogin = pathname === '/admin/login';
    const onJobSeekerLogin = pathname === '/login';
    const onAdminDash = pathname.startsWith('/admin/dashboard');
    const onJobSeekerDash = pathname.startsWith('/dashboard');

    if (isAuthenticated) {
      // Redirect away from login pages
      if (onAdminLogin && isAdminUser) {
        router.replace('/admin/dashboard');
        return;
      }
      if (onJobSeekerLogin && isJobSeeker) {
        router.replace('/dashboard');
        return;
      }
      // Prevent job seekers from accessing admin area
      if (onAdminDash && !isAdminUser) {
        router.replace('/login');
        return;
      }
      // Prevent admins from accessing job seeker area (optional)
      if (onJobSeekerDash && isAdminUser && !isJobSeeker) {
        router.replace('/admin/dashboard');
        return;
      }
    } else {
      // Unauthenticated: redirect to appropriate login
      if (onAdminDash) {
        router.replace('/admin/login');
        return;
      }
      if (onJobSeekerDash) {
        router.replace('/login');
        return;
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  // ─── Login ────────────────────────────────────────────────────────────
  const login = (payload: any) => {
    if (payload.accessToken) {
      setAccessToken(payload.accessToken);
      localStorage.setItem('token', payload.accessToken);
    }
    const userData: UserProfile = payload.user || payload;
    setUser(userData);
    setIsAuthenticated(true);

    // Determine redirect based on role
    const roles = userData.globalRoles ?? 1;
    if ((roles & 2) === 2) {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // swallow
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken('');
      localStorage.removeItem('token');
      // Redirect to appropriate login based on who was logged in
      const wasAdmin = user && (user.globalRoles & 2) === 2;
      router.replace(wasAdmin ? '/admin/login' : '/login');
    }
  };

  const isAdmin = Boolean(user && (user.globalRoles & 2) === 2);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}