'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, ArrowRight, ShieldCheck,
  FileText, Award, Info, PlusCircle, Trash2, Download
} from 'lucide-react';
import api from '@/app/lib/axios';

// ─── Helpers ────────────────────────────────────────────────────────

function atsColor(score: number) {
  if (score >= 75) return 'bg-emerald-400';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor = 'text-zinc-500', icon: Icon }: {
  label: string; value: string | number; sub: string;
  subColor?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
      <div className="flex justify-between items-start text-zinc-500 mb-3">
        <span className="text-xs font-medium">{label}</span>
        <Icon size={15} />
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className={`text-[11px] mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [resumes, setResumes]             = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, resumesRes] = await Promise.all([
        api.get('/jobseeker/dashboard'),
        api.get('/jobseeker/resumes'),
      ]);
      if (dashRes.data?.success) setDashboardData(dashRes.data.data);
      if (resumesRes.data?.success) {
        setResumes(resumesRes.data.data || []);
      } else if (resumesRes.data) {
        setResumes(resumesRes.data || []);
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
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/jobseeker/resumes/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete resume:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border border-zinc-800 border-t-white" />
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 bg-black text-zinc-300 min-h-screen">

      {/* ── Header ── */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Welcome back, {profile?.fullName || 'there'} 
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage your resumes and professional profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{profile?.availabilityStatus?.replace('_', ' ') || 'Available'}</span>
          </div>
        </div>
      </div>

      {/* ── Profile Completion ── */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24 text-white" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Profile Completion</h3>
            <p className="text-xs text-zinc-500 mt-0.5 max-w-md">
              A complete profile helps parse resumes more accurately and speeds up the editing process.
            </p>
          </div>
          <div className="font-mono shrink-0">
            <span className="text-3xl font-bold text-white">{profile?.completionScore ?? 0}</span>
            <span className="text-xs text-zinc-600">/ 100</span>
          </div>
        </div>

        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${profile?.completionScore ?? 0}%` }}
          />
        </div>

        {profile?.completionTips?.length > 0 && (
          <div className="border-t border-zinc-900 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {profile.completionTips.map((tip: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                <Info size={12} className="text-zinc-600 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Resumes Created"
          value={resumes.length}
          sub="Build and optimize multiple versions"
          icon={FileText}
        />
        <StatCard
          label="Primary Resume Score"
          value={primaryResume?.atsScore ? `${primaryResume.atsScore}%` : 'N/A'}
          sub={primaryResume?.name || 'No resumes created yet'}
          icon={Award}
          subColor={primaryResume?.atsScore >= 75 ? 'text-emerald-400' : 'text-zinc-500'}
        />
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col justify-center gap-2">
          <Link
            href="/dashboard/resumes"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            <PlusCircle size={14} /> Create/Upload Resume
          </Link>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Resumes List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">All Resumes</h3>
          {resumes.length === 0 ? (
            <div className="border border-zinc-900 rounded-xl p-8 text-center bg-zinc-950">
              <FileText size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">You don't have any resumes yet.</p>
              <Link href="/dashboard/resumes" className="text-xs text-white underline mt-2 inline-block hover:text-zinc-300">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="border border-zinc-900 rounded-xl divide-y divide-zinc-900 bg-zinc-950 overflow-hidden">
              {resumes.map((res: any) => (
                <div
                  key={res.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors group"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{res.name}</p>
                        {res.isPrimary && (
                          <span className="text-[9px] bg-white/10 text-white border border-white/20 px-1.5 py-0.2 rounded font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Created {new Date(res.createdAt).toLocaleDateString()} · Source: {res.source}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {res.atsScore !== null && (
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 px-2 py-1 rounded-lg">
                        <span className="text-[10px] text-zinc-500">Score:</span>
                        <span className={`text-[10px] font-bold ${atsColor(res.atsScore)}`}>{res.atsScore}%</span>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/resumes/editor/${res.id}`}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteResume(res.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Skills & Profile Info) */}
        <div className="space-y-5">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Skills Profile</h3>
              <Link href="/dashboard/profile" className="text-xs text-zinc-400 hover:text-white transition-colors">
                Manage Profile →
              </Link>
            </div>
            {profile?.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-zinc-600">No skills added yet.</p>
                <Link href="/dashboard/profile" className="text-xs text-white underline mt-1 inline-block">
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