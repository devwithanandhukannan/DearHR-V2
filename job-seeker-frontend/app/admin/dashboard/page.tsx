'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import {
  Users, FileText, Briefcase, TrendingUp, Activity,
  Layers, Target, RefreshCw, ChevronRight, Trash2,
  AlertCircle, UserCheck, Calendar, BarChart2,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalResumes: number;
  totalVersions: number;
  totalApplications: number;
  totalJobDescriptions: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  avgAtsScore: number;
  avgResumesPerUser: string;
}

interface DailyPoint { date: string; count: number; }
interface Candidate {
  id: string;
  fullName: string | null;
  email: string | null;
  location: string | null;
  createdAt: string;
  resumes: { atsScore: number | null }[];
}

function StatCard({ icon: Icon, label, value, sub, color = 'zinc', trend }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; trend?: number;
}) {
  const colors: Record<string, string> = {
    zinc:   'bg-zinc-900/60 border-zinc-800',
    blue:   'bg-blue-500/5 border-blue-500/20',
    green:  'bg-green-500/5 border-green-500/20',
    amber:  'bg-amber-500/5 border-amber-500/20',
    purple: 'bg-purple-500/5 border-purple-500/20',
    rose:   'bg-rose-500/5 border-rose-500/20',
  };
  const iconColors: Record<string, string> = {
    zinc:   'text-zinc-400',
    blue:   'text-blue-400',
    green:  'text-green-400',
    amber:  'text-amber-400',
    purple: 'text-purple-400',
    rose:   'text-rose-400',
  };

  return (
    <div className={`relative rounded-2xl border p-5 ${colors[color] || colors.zinc} overflow-hidden transition-all hover:scale-[1.01] group`}>
      {/* Subtle gradient shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent transition-opacity duration-300 pointer-events-none" />
      
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]?.replace('bg-', 'bg-').replace('/5', '/10').replace('/60', '/80')}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColors[color] || 'text-zinc-400'}`} size={17} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs font-medium text-zinc-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full relative flex items-end" style={{ height: '48px' }}>
              <div
                className="w-full rounded-t-sm bg-amber-500/40 group-hover:bg-amber-400/60 transition-all duration-300"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.count}
              </div>
            </div>
            <span className="text-[8px] text-zinc-600 font-medium">{d.date.split(' ')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-48 rounded-2xl bg-zinc-900/60 border border-zinc-800 lg:col-span-1" />
        <div className="h-48 rounded-2xl bg-zinc-900/60 border border-zinc-800 lg:col-span-2" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { showToast } = useGlassToast();
  const [stats, setStats]       = useState<Stats | null>(null);
  const [daily, setDaily]       = useState<DailyPoint[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setDaily(res.data.dailyStats);
        setCandidates(res.data.recentCandidates);
      }
    } catch {
      setError('Failed to load platform stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this user and all their data?')) return;
    setDeleting(id);
    try {
      await api.delete(`/auth/admin/candidates/${id}`);
      setCandidates(prev => prev.filter(c => c.id !== id));
      showToast('Success', 'Candidate successfully deleted.', 'success');
    } catch {
      showToast('Error', 'Failed to delete candidate.', 'danger');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Real-time metrics across all DearHR users</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users}    label="Total Users"         value={stats.totalUsers}         color="blue"   trend={stats.newUsersThisWeek} />
            <StatCard icon={FileText} label="Resumes Created"     value={stats.totalResumes}        color="green"  sub={`${stats.avgResumesPerUser} avg/user`} />
            <StatCard icon={Layers}   label="Tailored Versions"   value={stats.totalVersions}       color="purple" />
            <StatCard icon={Briefcase}label="Applications"        value={stats.totalApplications}   color="amber"  />
            <StatCard icon={Target}   label="Avg ATS Score"       value={`${stats.avgAtsScore}%`}   color="rose"   />
            <StatCard icon={UserCheck}label="New This Week"       value={stats.newUsersThisWeek}    color="green"  />
            <StatCard icon={Calendar} label="New This Month"      value={stats.newUsersThisMonth}   color="blue"   />
            <StatCard icon={BarChart2}label="Job Descriptions"    value={stats.totalJobDescriptions}color="zinc"   />
          </div>

          {/* Chart + Quick Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily signups chart */}
            <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">New Users</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Last 7 days</p>
                </div>
                <Activity className="w-4 h-4 text-zinc-500" />
              </div>
              <MiniBarChart data={daily} />
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total this week</span>
                <span className="text-sm font-bold text-amber-400">{stats.newUsersThisWeek}</span>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Platform Health</h3>
              <div className="space-y-3">
                {[
                  { label: 'Resume coverage', value: stats.totalUsers > 0 ? Math.round((stats.totalResumes / stats.totalUsers) * 100) : 0, color: 'bg-green-500' },
                  { label: 'Avg ATS quality', value: stats.avgAtsScore, color: 'bg-amber-500' },
                  { label: 'Application activity', value: stats.totalUsers > 0 ? Math.min(Math.round((stats.totalApplications / stats.totalUsers) * 25), 100) : 0, color: 'bg-blue-500' },
                  { label: 'Version depth (tailoring)', value: stats.totalResumes > 0 ? Math.min(Math.round((stats.totalVersions / stats.totalResumes) * 20), 100) : 0, color: 'bg-purple-500' },
                ].map(m => (
                  <div key={m.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{m.label}</span>
                      <span className="text-zinc-300 font-medium">{m.value}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all duration-700`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{stats.avgResumesPerUser}</p>
                  <p className="text-[10px] text-zinc-500">Resumes/user</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{stats.newUsersThisMonth}</p>
                  <p className="text-[10px] text-zinc-500">New (30d)</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{stats.totalVersions}</p>
                  <p className="text-[10px] text-zinc-500">Total versions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Candidates */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Candidates</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Latest 10 registered users</p>
              </div>
              <a href="/admin/dashboard/talent-pool" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {candidates.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No candidates yet</p>
                </div>
              ) : (
                candidates.map(c => {
                  const avgAts = c.resumes.length > 0
                    ? Math.round(c.resumes.filter(r => r.atsScore != null).reduce((s, r) => s + (r.atsScore || 0), 0) / c.resumes.length)
                    : null;
                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-900/30 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-zinc-300">
                            {(c.fullName || c.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-200 truncate">{c.fullName || '—'}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{c.email || 'No email'} {c.location ? `· ${c.location}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-500">
                          <span>{c.resumes.length} resume{c.resumes.length !== 1 ? 's' : ''}</span>
                          {avgAts != null && (
                            <span className={`font-semibold ${avgAts >= 80 ? 'text-green-400' : avgAts >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              ATS {avgAts}%
                            </span>
                          )}
                          <span>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-50"
                        >
                          {deleting === c.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
