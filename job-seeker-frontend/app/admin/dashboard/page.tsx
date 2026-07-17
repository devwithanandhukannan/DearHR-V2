'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Users, FileText, BarChart3, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';

interface DashboardSummary {
  totalJobSeekers: number;
  totalResumes: number;
  averageResumes: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    totalJobSeekers: 0,
    totalResumes: 0,
    averageResumes: '0.0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/auth/admin/dashboard');
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to resolve admin dashboard metrics:', err);
      setError('Failed to sync platform parameters from the core network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = [
    {
      label: 'Total Job Seekers',
      value: loading ? '...' : String(summary.totalJobSeekers),
      context: 'Registered profiles on the platform',
      icon: Users,
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    },
    {
      label: 'Total Resumes',
      value: loading ? '...' : String(summary.totalResumes),
      context: 'Resumes generated or uploaded',
      icon: FileText,
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    },
    {
      label: 'Average Resumes / User',
      value: loading ? '...' : summary.averageResumes,
      context: 'Versions per registered candidate',
      icon: BarChart3,
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800',
    },
  ];

  return (
    <div className="space-y-8 min-h-screen bg-zinc-950 text-zinc-100 p-1">

      {/* Header */}
      <div className="border-b border-zinc-800/60 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-50 tracking-tight sm:text-2xl">
            Welcome back, Platform Admin
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">
            Review the dynamic metrics and usage parameters of the Resume Maker platform.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
          <p className="text-xs text-zinc-500">Resolving platform telemetry metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {metrics.map((stat, idx) => (
            <div
              key={idx}
              className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between w-full">
                <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl border ${stat.accent}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-50 tracking-tight">
                  {stat.value}
                </span>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">{stat.context}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
