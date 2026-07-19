'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, ArrowRight, ShieldCheck,
  FileText, Award, Info, PlusCircle, Trash2,
  TrendingUp, Star, ChevronRight, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '@/app/lib/axios';

// ─── Helpers ────────────────────────────────────────────────────────
function atsColor(score: number) {
  if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function StatCard({ label, value, sub, subColor = 'text-zinc-500', icon: Icon }: {
  label: string; value: string | number; sub: string;
  subColor?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.01] group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent transition-opacity duration-300 pointer-events-none" />
      <div className="flex justify-between items-start text-zinc-500 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <Icon size={16} className="text-zinc-400" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className={`text-[10px] font-medium mt-1.5 ${subColor}`}>{sub}</p>
    </div>
  );
}

// ─── Activity Calendar Component ──────────────────────────────────
function ActivityCalendar({ applications }: { applications: any[] }) {
  // 1. Calculate date bounds: 365 days ago (aligned to Sunday) up to today
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 365);
  const startDay = startDate.getDay();
  if (startDay > 0) {
    startDate.setDate(startDate.getDate() - startDay);
  }

  // 2. Aggregate count of applications per date string YYYY-MM-DD (local safe)
  const counts: Record<string, number> = {};
  applications.forEach(app => {
    if (!app.createdAt) return;
    const date = new Date(app.createdAt);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    counts[dateStr] = (counts[dateStr] || 0) + 1;
  });

  // 3. Build grid: 53 columns * 7 days
  const weeks: { date: Date; dateStr: string; count: number }[][] = [];
  const currentDate = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = counts[dateStr] || 0;

      week.push({
        date: new Date(currentDate),
        dateStr,
        count
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  // 4. Generate month labels
  const monthLabels: { label: string; index: number }[] = [];
  let prevMonth = -1;
  weeks.forEach((week, index) => {
    const m = week[0].date.getMonth();
    if (m !== prevMonth) {
      monthLabels.push({
        label: week[0].date.toLocaleString('default', { month: 'short' }),
        index
      });
      prevMonth = m;
    }
  });

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#0b0b0d]/70 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            📊 Application Consistency
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Visualization of job search applications tracked over the past year.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 self-end font-mono">
          <span>Less</span>
          <div className="w-2 h-2 rounded-sm bg-[#0e0e11] border border-zinc-900/40" />
          <div className="w-2 h-2 rounded-sm bg-[#2e1065] border border-violet-900/30" />
          <div className="w-2 h-2 rounded-sm bg-[#4c1d95] border border-violet-850/40" />
          <div className="w-2 h-2 rounded-sm bg-[#6d28d9] border border-violet-700/50" />
          <div className="w-2 h-2 rounded-sm bg-[#8b5cf6] shadow-[0_0_4px_rgba(139,92,246,0.3)]" />
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-col overflow-x-auto pb-1 custom-scrollbar select-none">
        {/* Month labels */}
        <div className="flex gap-[3px] text-[9px] text-zinc-500 mb-1.5 pl-8 relative h-3 w-max">
          {monthLabels.map((ml, idx) => (
            <div
              key={idx}
              className="absolute font-semibold"
              style={{ left: `${ml.index * 11}px` }}
            >
              {ml.label}
            </div>
          ))}
        </div>

        {/* Days and columns */}
        <div className="flex gap-[3px] items-start w-max">
          {/* Day column labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-[3px] pr-1.5 text-[8px] text-zinc-500 font-mono mt-0.5 select-none w-6 shrink-0">
            {DAY_LABELS.map((label, idx) => (
              <span key={idx} className="h-2 flex items-center leading-none">
                {idx % 2 === 1 ? label : ''}
              </span>
            ))}
          </div>

          {/* Grid columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dIdx) => {
                const count = day.count;
                const dateStr = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                
                // Set color class based on count
                let cellClass = 'bg-[#0e0e11] border border-zinc-900/40 hover:border-zinc-800';
                if (count === 1) cellClass = 'bg-[#2e1065] border border-violet-900/30';
                else if (count === 2) cellClass = 'bg-[#4c1d95] border border-violet-850/40';
                else if (count === 3) cellClass = 'bg-[#6d28d9] border border-violet-700/50';
                else if (count >= 4) cellClass = 'bg-[#8b5cf6] shadow-[0_0_4px_rgba(139,92,246,0.3)]';

                return (
                  <div
                    key={dIdx}
                    className={`w-2 h-2 rounded-sm transition-all duration-200 cursor-pointer ${cellClass}`}
                    title={`${count} application${count !== 1 ? 's' : ''} on ${dateStr}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [resumes, setResumes]             = useState<any[]>([]);
  const [applications, setApplications]   = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, resumesRes, appsRes] = await Promise.all([
        api.get('/jobseeker/dashboard'),
        api.get('/jobseeker/resumes'),
        api.get('/jobseeker/applications'),
      ]);
      if (dashRes.data?.success) setDashboardData(dashRes.data.data);
      if (resumesRes.data?.success) {
        setResumes(resumesRes.data.data || []);
      } else if (resumesRes.data) {
        setResumes(resumesRes.data || []);
      }
      if (appsRes.data?.success) {
        setApplications(appsRes.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume? This will delete all tailored versions as well.')) return;
    try {
      await api.delete(`/jobseeker/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete resume:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-black gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
        <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-medium">Syncing profile data…</p>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {profile?.fullName || 'there'} 👋
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Optimize, track, and tailor your resumes to land your dream job.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] font-semibold text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="capitalize">{profile?.availabilityStatus?.replace('_', ' ') || 'Available'}</span>
          </div>
        </div>
      </div>

      {/* Profile Completion Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Sparkles className="w-40 h-40 text-white animate-spin-slow" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Profile Completion</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-md">
              Keeping your work experience, skills, and projects complete helps our AI tailor resumes with high accuracy.
            </p>
          </div>
          <div className="shrink-0 flex items-baseline gap-0.5">
            <span className="text-3xl font-bold text-white tracking-tight">{profile?.completionScore ?? 0}</span>
            <span className="text-[10px] text-zinc-500">/ 100</span>
          </div>
        </div>

        <div className="w-full bg-zinc-950 border border-zinc-900 h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-white h-full transition-all duration-700"
            style={{ width: `${profile?.completionScore ?? 0}%` }}
          />
        </div>

        {profile?.completionTips?.length > 0 && (
          <div className="border-t border-zinc-900/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.completionTips.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-normal">
                <Info size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Resumes"
          value={resumes.length}
          sub="Build and optimize multiple versions"
          icon={FileText}
        />
        <StatCard
          label="Primary Resume Score"
          value={primaryResume?.atsScore ? `${primaryResume.atsScore}%` : 'N/A'}
          sub={primaryResume?.name || 'No resumes created yet'}
          icon={Award}
          subColor={primaryResume?.atsScore >= 80 ? 'text-green-400' : 'text-zinc-500'}
        />
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center gap-2 text-center">
          <Link
            href="/dashboard/resumes"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-semibold hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <PlusCircle size={14} /> Create / Upload Resume
          </Link>
        </div>
      </div>

      {/* Application activity calendar widget */}
      <ActivityCalendar applications={applications} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumes List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">All Resumes</h3>
          {resumes.length === 0 ? (
            <div className="border border-zinc-900/80 rounded-2xl p-10 text-center bg-zinc-950">
              <FileText size={28} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">You don't have any resumes yet.</p>
              <Link href="/dashboard/resumes" className="text-xs text-white underline mt-2 inline-block hover:text-zinc-300">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="border border-zinc-900/80 rounded-2xl divide-y divide-zinc-900/80 bg-zinc-950 overflow-hidden">
              {resumes.map((res: any) => (
                <div
                  key={res.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors group"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 border border-zinc-800/80 rounded-xl text-zinc-400">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white truncate leading-tight">{res.name}</p>
                        {res.isPrimary && (
                          <span className="text-[8px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Created {new Date(res.createdAt).toLocaleDateString()} · Source: <span className="capitalize">{res.source}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {res.atsScore !== null && (
                      <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded-full text-[10px] font-bold ${atsColor(res.atsScore)}`}>
                        <TrendingUp size={10} />
                        <span>ATS {res.atsScore}%</span>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/resumes/editor/${res.id}`}
                      className="text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg"
                    >
                      Workspace
                    </Link>
                    <button
                      onClick={() => handleDeleteResume(res.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950/20"
                      title="Delete Resume"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Skills & Profile Info) */}
        <div className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Skills Profile</h3>
              <Link href="/dashboard/profile" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                Edit <ChevronRight size={12} />
              </Link>
            </div>
            {profile?.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 text-[10px] font-medium rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-zinc-950 rounded-xl border border-zinc-900/60">
                <p className="text-xs text-zinc-500 font-medium">No skills added yet.</p>
                <Link href="/dashboard/profile" className="text-xs text-white underline mt-1.5 inline-block hover:text-zinc-300">
                  Add skills to profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}