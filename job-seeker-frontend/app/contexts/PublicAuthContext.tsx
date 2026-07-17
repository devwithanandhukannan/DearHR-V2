'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PublicAuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (status: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // Default to false since no background API checks are ran on mount

  return (
    <PublicAuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, setLoading }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (!context) {
    throw new Error('usePublicAuth must be used within PublicAuthProvider');
  }
  return context;
}