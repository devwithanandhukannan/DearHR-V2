'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import {
  Users,
  Search,
  Trash2,
  Download,
  Award,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import api from '@/app/lib/axios';

interface Resume {
  id: string;
  name: string;
  atsScore: number | null;
  filePath: string | null;
  createdAt: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePhotoUrl?: string;
  location?: string;
  availabilityStatus: string;
  createdAt: string;
  resumes: Resume[];
  skills: { name: string }[];
}

const availabilityColors: Record<string, string> = {
  available: 'bg-green-950/40 text-green-400 border-green-900/30',
  not_available: 'bg-red-950/40 text-red-400 border-red-900/30',
  spot_available: 'bg-amber-950/40 text-amber-400 border-amber-900/30',
};

const availabilityLabels: Record<string, string> = {
  available: 'Available',
  not_available: 'Not Available',
  spot_available: 'Open to Offers',
};

export default function AdminTalentPoolPage() {
  const { showToast } = useGlassToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const res = await api.get('/auth/admin/candidates');
      setCandidates(res.data.data ?? []);
    } catch {
      setError('Failed to load candidate resumes from the platform.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDelete = async (candidate: Candidate) => {
    if (
      !confirm(
        `Delete candidate "${candidate.fullName}" and all associated resumes? This action is permanent.`
      )
    )
      return;
    setDeletingId(candidate.id);
    try {
      await api.delete(`/auth/admin/candidates/${candidate.id}`);
      setCandidates(prev => prev.filter(c => c.id !== candidate.id));
      showToast('Success', 'Candidate successfully purged from the platform.', 'success');
    } catch {
      showToast('Error', 'Failed to delete candidate.', 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (filePath: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.open(`${backendUrl}/${filePath}`, '_blank');
  };

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.location ?? '').toLowerCase().includes(q) ||
      c.skills.some(s => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
            All Candidates &amp; Resumes
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search, inspect, download, and manage all resume maker profiles.
          </p>
        </div>
        <div className="text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 px-3.5 py-2 rounded-xl">
          Total Candidates: {candidates.length}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      {!loading && candidates.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, location, or skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-32 bg-zinc-900/50 border border-zinc-800/40 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-300">
            {search
              ? 'No candidates match your search.'
              : 'No candidates registered on the platform yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(candidate => {
            const initials = candidate.fullName
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={candidate.id}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="shrink-0">
                    {candidate.profilePhotoUrl ? (
                      <img
                        src={candidate.profilePhotoUrl}
                        alt={candidate.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-sm">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">
                        {candidate.fullName}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          availabilityColors[candidate.availabilityStatus] ??
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {availabilityLabels[candidate.availabilityStatus] ??
                          candidate.availabilityStatus}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{candidate.email}</p>
                    {candidate.location && (
                      <p className="text-xs text-zinc-500">📍 {candidate.location}</p>
                    )}
                    {candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {candidate.skills.map(s => (
                          <span
                            key={s.name}
                            className="text-[10px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Resumes & Actions */}
                <div className="w-full md:w-auto shrink-0 flex flex-col items-stretch md:items-end justify-between gap-4 md:border-l md:border-zinc-800 md:pl-6">
                  {candidate.resumes.length === 0 ? (
                    <span className="text-xs text-zinc-600 italic py-1">
                      No resumes created yet
                    </span>
                  ) : (
                    <div className="space-y-2 w-full max-w-sm">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                        Resumes ({candidate.resumes.length})
                      </span>
                      {candidate.resumes.map(res => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between gap-4 bg-zinc-950 border border-zinc-800/60 rounded-xl p-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-300 font-medium truncate max-w-[150px]">
                              {res.name}
                            </p>
                            {res.atsScore !== null && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Award className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  ATS: {res.atsScore}%
                                </span>
                              </div>
                            )}
                          </div>
                          {res.filePath && (
                            <button
                              onClick={() => handleDownload(res.filePath!)}
                              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-lg text-zinc-400 transition-all shrink-0"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 md:pt-0">
                    <button
                      onClick={() => handleDelete(candidate)}
                      disabled={deletingId === candidate.id}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === candidate.id ? 'Deleting...' : 'Delete Profile'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
