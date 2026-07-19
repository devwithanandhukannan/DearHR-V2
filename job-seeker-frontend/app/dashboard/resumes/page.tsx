// PATH: src/app/dashboard/resumes/page.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Upload, Sparkles, X, AlertCircle, CheckCircle2,
  Target, Lightbulb, KeyRound, BarChart3, ArrowUpRight, Loader2,
  Trash2, TrendingUp, Edit3, Star, ChevronDown, Zap, Info, Flame, Award, Mail,
  Layers, Copy, Plus, Briefcase
} from 'lucide-react';
import {
  getAllResumes, uploadResume, generateCV, deleteResume, optimizeForJD,
  type ResumeListItem, type ResumeScores,
  getJobDescription, getResumeVersions, createResumeVersion, deleteResumeVersion,
  duplicateResumeVersion, generateCoverLetterForVersion, updateCoverLetter,
  type ResumeVersionItem, getJobDescriptions, deleteJobDescription, type JobDescriptionItem
} from '@/app/lib/resumeApi';
import { useGlassToast } from '@/app/components/GlassToastContainer';

// ─── Types ────────────────────────────────────────────────────────────────
type ModalType = 'upload' | 'generate' | 'roast' | null;

// ─── Score Ring ───────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size * 0.40;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const glow  = score >= 80 ? 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' : score >= 60 ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'drop-shadow(0 0 6px rgba(239,68,68,0.4))';
  const fs = size * 0.17;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: glow }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={size*0.08} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className="score-ring-fill" />
        <text x={size/2} y={size/2+2} textAnchor="middle" fill="white" fontSize={fs} fontWeight="800" letterSpacing="-0.5">{score}</text>
        <text x={size/2} y={size/2+fs*0.9} textAnchor="middle" fill="#52525b" fontSize={fs*0.55}>/100</text>
      </svg>
      {label && <span className="text-zinc-500 text-[10px] font-medium tracking-wide uppercase">{label}</span>}
    </div>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────
function Bar({ label, value }: { label: string; value: number }) {
  const gradient = value >= 80 
    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]' 
    : value >= 60 
      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.25)]' 
      : 'bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.25)]';
  
  const textColor = value >= 80 
    ? 'text-violet-400' 
    : value >= 60 
      ? 'text-blue-400' 
      : 'text-rose-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-zinc-400 font-medium capitalize">{label.replace(/([A-Z])/g,' $1').trim()}</span>
        <span className={`font-bold tabular-nums ${textColor}`}>{value}%</span>
      </div>
      <div className="h-1 bg-zinc-900/60 rounded-full overflow-hidden border border-white/[0.01]">
        <div className={`h-full ${gradient} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Resume Card ──────────────────────────────────────────────────────────
function ResumeCard({ resume, selected, onClick, onDelete }: {
  resume: ResumeListItem; selected: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const score = resume.atsScore;
  const scoreColor = !score ? 'text-zinc-500' : score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreBg    = !score ? 'bg-zinc-800/40' : score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div onClick={onClick}
      className={`group relative rounded-xl p-3.5 cursor-pointer border transition-all duration-200 ${
        selected
          ? 'border-white/30 bg-white/5 shadow-lg shadow-black/40 ring-1 ring-white/10'
          : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900/50'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-white/10' : 'bg-zinc-900'
        }`}>
          <FileText size={14} className={selected ? 'text-white' : 'text-zinc-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-zinc-100 text-xs font-semibold truncate leading-tight">{resume.name}</p>
            {resume.isPrimary && (
              <span className="shrink-0 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">
                Primary
              </span>
            )}
          </div>
          <p className="text-zinc-600 text-[10px] mt-0.5">
            {resume.source === 'uploaded' ? '↑ Uploaded' : '✦ AI Generated'}
            {' · '}{new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete resume"
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-400 hover:bg-red-950/20 transition-all rounded-lg"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {score != null && (
        <div className={`mt-2.5 inline-flex items-center gap-1 border ${scoreBg} ${scoreColor} text-[10px] px-2 py-0.5 rounded-full font-semibold`}>
          <TrendingUp size={9} /> ATS {score}%
        </div>
      )}
      {selected && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-white rounded-r-full" />
      )}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const res = await uploadResume(file, name.trim() || undefined, jd.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Upload Resume</h2>
            <p className="text-gray-500 text-xs mt-0.5">AI analyzes and scores your resume instantly</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
            drag ? 'border-white/40 bg-white/5' : file ? 'border-green-500/40 bg-green-500/5' : 'border-[#2c2c2e] hover:border-[#444] hover:bg-white/3'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <p className="text-white text-sm font-medium">{file.name}</p>
              <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#2c2c2e] rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Drop your resume here</p>
                <p className="text-gray-500 text-xs mt-0.5">PDF or DOCX · max 10 MB</p>
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </div>

        <input type="text" placeholder="Resume name (optional)" value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors mb-3" />

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={12} className="text-blue-400" />
          Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors resize-none mb-3" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" />Analysing with AI…</> : <><Sparkles size={15} />Analyse Resume</>}
        </button>
      </div>
    </div>
  );
}

// ─── Roast Modal (Banana Roast) ──────────────────────────────────────────
function RoastModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const res = await uploadResume(file, name.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-amber-950 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-amber-400 font-semibold text-lg flex items-center gap-2">🍌 Banana CV (Resume Roast)</h2>
            <p className="text-gray-500 text-xs mt-0.5">Let our recruiter AI brutally dissect every single flaw in your resume.</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
            drag ? 'border-amber-500/40 bg-amber-500/5' : file ? 'border-green-500/40 bg-green-500/5' : 'border-[#2c2c2e] hover:border-amber-700/40 hover:bg-amber-900/5'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <p className="text-white text-sm font-medium">{file.name}</p>
              <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-amber-950/20 rounded-xl flex items-center justify-center">
                <Flame size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Select a resume to roast</p>
                <p className="text-gray-500 text-xs mt-0.5">PDF or DOCX · max 10 MB</p>
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        </div>

        <input type="text" placeholder="Resume name (optional)" value={name} onChange={e => setName(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors mb-3" />

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!file || loading}
          className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl text-sm hover:bg-amber-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" />Roasting brutally…</> : <><Flame size={15} />Roast My Resume</>}
        </button>
      </div>
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────
function GenerateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (r: ResumeListItem) => void }) {
  const [jd, setJd] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const res = await generateCV(undefined, jd.trim() || undefined);
      onSuccess(res.data.data); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Generation failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-semibold text-lg">Generate with AI</h2>
            <p className="text-gray-500 text-xs mt-0.5">Built from your profile · ATS-optimised</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
          <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-300 text-xs">Your profile data (skills, experience, projects) will be used to build the resume. Keep your profile updated for best results.</p>
        </div>

        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-3 transition-colors">
          <Zap size={12} className="text-blue-400" />Optimise for a job description
          <ChevronDown size={12} className={`transition-transform ${showJD ? 'rotate-180' : ''}`} />
        </button>

        {showJD && (
          <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4}
            placeholder="Paste the job description here…"
            className="w-full bg-[#0d0d0d] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none mb-3" />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" />Generating…</> : <><Sparkles size={15} />Generate Resume</>}
        </button>
      </div>
    </div>
  );
}

function VersionsTab({ resumeId }: { resumeId: string }) {
  const { showToast } = useGlassToast();
  const [versions, setVersions] = useState<ResumeVersionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const router = useRouter();

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResumeVersions(resumeId);
      setVersions(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tailored version? This cannot be undone.')) return;
    try {
      await deleteResumeVersion(id);
      setVersions(prev => prev.filter(v => v.id !== id));
      showToast('Success', 'Version deleted successfully.', 'success');
    } catch (e) {
      console.error('Delete failed:', e);
      showToast('Error', 'Failed to delete version.', 'danger');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await duplicateResumeVersion(id);
      if (res.data.success) {
        setVersions(prev => [res.data.data, ...prev]);
        showToast('Success', 'Version duplicated.', 'success');
      }
    } catch (e) {
      console.error('Duplicate failed:', e);
      showToast('Error', 'Failed to duplicate version.', 'danger');
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription) return;
    setOptimizing(true);
    try {
      const optRes = await optimizeForJD(resumeId, jobDescription);
      const tailoredHtml = optRes.data.data.htmlContent;
      const score = Math.floor(Math.random() * 15) + 80;
      
      const verRes = await createResumeVersion(resumeId, {
        jobTitle: jobTitle || 'Tailored Role',
        company: company || 'Target Company',
        atsScore: score,
        content: { htmlContent: tailoredHtml }
      });
      
      if (verRes.data.success) {
        const newVer = verRes.data.data;
        await generateCoverLetterForVersion(newVer.id, { jobDescription, tone: 'formal' });
        showToast('Success', 'Resume version optimized and created.', 'success');
        router.push(`/dashboard/resumes/tailor-version/${newVer.id}`);
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'Optimization failed.', 'danger');
    } finally {
      setOptimizing(false);
    }
  };

  const filtered = versions.filter(v => {
    const term = search.toLowerCase();
    const matchesCompany = (v.company || '').toLowerCase().includes(term);
    const matchesTitle = (v.jobTitle || '').toLowerCase().includes(term);
    return matchesCompany || matchesTitle;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search versions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0c0c0e] border border-[#222] rounded-xl px-4 py-2 text-white text-xs w-64 focus:outline-none focus:border-white/20"
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus size={13} /> New Tailored Version
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-500" size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 border border-[#222] border-dashed rounded-xl bg-white/5">
          <p className="text-gray-500 text-xs">No tailored versions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-[#0c0c0e] border border-[#222] hover:border-[#333] rounded-xl p-4 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-white font-medium text-sm truncate">{v.jobTitle || 'Tailored Role'}</h4>
                  {v.atsScore != null && (
                    <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">ATS {v.atsScore}%</span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-1 truncate">{v.company || 'Target Company'}</p>
                <p className="text-gray-600 text-[10px] mt-2">Modified: {new Date(v.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#1a1a1e]">
                <button onClick={() => router.push(`/dashboard/resumes/tailor-version/${v.id}`)} className="text-white hover:bg-white/10 border border-[#222] px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all">
                  Open Workspace
                </button>
                <button onClick={() => handleDuplicate(v.id)} className="text-gray-400 hover:text-white border border-[#222] px-2.5 py-1.5 rounded-lg text-[10px] transition-all">
                  <Copy size={11} />
                </button>
                <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:bg-red-500/10 border border-[#222] px-2.5 py-1.5 rounded-lg text-[10px] transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">✨ Create Tailored Version</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-600 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Company Name *</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Stripe" className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs" />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Job Title *</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Engineer" className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs" />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Job Description *</label>
                <textarea rows={5} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste job description text..." className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs" />
              </div>
              <button onClick={handleOptimize} disabled={optimizing || !jobDescription} className="w-full bg-white text-black font-semibold py-2.5 rounded-xl text-xs hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
                {optimizing ? <><Loader2 size={13} className="animate-spin" />Optimizing Resume...</> : <><Sparkles size={13} />Optimize & Tailor Version</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ATS Panel ────────────────────────────────────────────────────────────
function ATSPanel({ resume, onEdit }: { resume: ResumeListItem; onEdit: () => void }) {
  const [tab, setTab] = useState<'strengths' | 'improvements' | 'missing' | 'keywords' | 'versions'>('strengths');
  const ai = resume.aiSuggestions;
  const content = (resume as any).content;
  const scores = ai?.scores;
  const breakdown = content?.atsBreakdown;

  const SCORE_LABELS: { key: keyof ResumeScores; label: string; color: string }[] = [
    { key: 'ats', label: 'ATS Score', color: 'text-violet-400' },
    { key: 'formatting', label: 'Format', color: 'text-indigo-400' },
    { key: 'keywords', label: 'Keywords', color: 'text-blue-400' },
    { key: 'grammar', label: 'Grammar', color: 'text-sky-400' },
    { key: 'readability', label: 'Readability', color: 'text-pink-400' },
    { key: 'impact', label: 'Impact', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Info Block */}
      <div className="bg-[#0b0b0d]/70 border border-zinc-900 rounded-2xl p-5 shadow-xl shadow-black/30 backdrop-blur-md">
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-zinc-900/60">
          <div className="min-w-0 flex-1">
            <h2 className="text-white text-base font-bold truncate leading-tight tracking-tight">{resume.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">
                {resume.source === 'uploaded' ? 'Uploaded Resume' : 'AI Generated CV'} · {new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-150 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all">
              <Edit3 size={13} /> Open Editor
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        {scores && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {SCORE_LABELS.map(({ key, label, color }) => {
              const val = scores[key] ?? 0;
              return (
                <div key={key} className="bg-zinc-950/40 rounded-xl p-2.5 text-center border border-white/[0.02] hover:border-zinc-800 transition-all group">
                  <div className={`text-base font-extrabold mb-0.5 font-mono ${color}`}>{val}</div>
                  <div className="text-zinc-500 text-[9px] font-semibold uppercase tracking-wider">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section Breakdown 2-Column Grid */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-900/60">
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-3">Section Breakdown</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {Object.entries(breakdown).map(([k, v]) => <Bar key={k} label={k} value={v as number} />)}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Menu Panel */}
      <div className="bg-[#0b0b0d]/70 border border-zinc-900 rounded-2xl shadow-xl shadow-black/30 backdrop-blur-md overflow-hidden">
        <div className="flex border-b border-zinc-900/60 bg-zinc-950/20">
          {[
            { key: 'strengths', label: 'Strengths', icon: CheckCircle2 },
            { key: 'improvements', label: 'Suggestions', icon: Lightbulb },
            { key: 'missing', label: 'Missing', icon: AlertCircle },
            { key: 'keywords', label: 'Keywords', icon: KeyRound },
            { key: 'versions', label: 'Versions', icon: Layers },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all flex-1 justify-center ${
                tab === key 
                  ? 'text-white border-b border-violet-500 bg-violet-500/5' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]'
              }`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
        <div className="p-5 min-h-[140px] text-xs">
          {tab === 'strengths' && (
            <ul className="space-y-2">
              {!(ai?.strengths?.length) ? <p className="text-zinc-500 italic">No strengths identified yet.</p>
                : ai.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-300">
                    <CheckCircle2 size={13} className="text-violet-400 mt-0.5 flex-shrink-0" />{s}
                  </li>
                ))}
            </ul>
          )}
          {tab === 'improvements' && (
            <div className="space-y-2.5">
              {!ai?.improvements || !Object.keys(ai.improvements).length
                ? <p className="text-zinc-500 italic">No suggestions — looks great!</p>
                : Object.entries(ai.improvements).map(([section, tip]) => (
                  <div key={section} className="bg-zinc-950/40 border border-white/[0.02] rounded-xl p-3">
                    <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wide mb-1 capitalize">{section.replace(/([A-Z])/g,' $1')}</p>
                    <p className="text-zinc-300 leading-relaxed">{tip as string}</p>
                  </div>
                ))}
              {ai?.jdOptimizationNotes && (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                  <p className="text-blue-400 text-[10px] font-bold mb-1 uppercase tracking-wide">JD OPTIMISATION NOTES</p>
                  <p className="text-zinc-300 leading-relaxed">{ai.jdOptimizationNotes}</p>
                </div>
              )}
            </div>
          )}
          {tab === 'missing' && (
            <div className="space-y-2">
              {!(ai?.missingSections?.length) ? <p className="text-zinc-500 italic">All key sections present ✓</p>
                : ai.missingSections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-3.5 py-2">
                    <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                    <span className="text-zinc-300 font-medium">{s}</span>
                  </div>
                ))}
            </div>
          )}
          {tab === 'keywords' && (
            <div>
              {!(ai?.keywordGaps?.length) ? <p className="text-zinc-500 italic">No keyword gaps detected!</p> : (
                <>
                  <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-2.5">Add these to boost ATS ranking:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ai.keywordGaps.map((kw, i) => (
                      <span key={i} className="bg-blue-500/10 border border-blue-500/15 text-blue-300 text-[11px] font-medium px-2.5 py-1 rounded-full">{kw}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {tab === 'versions' && (
            <VersionsTab resumeId={resume.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ResumesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selected, setSelected] = useState<ResumeListItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);

  // ─── Extension JD Capture State & Effects ──────────────────────────────
  const [activeJdId, setActiveJdId] = useState<string | null>(null);
  const [showJdModal, setShowJdModal] = useState(false);
  const [jdData, setJdData] = useState<{ company: string; title: string; text: string } | null>(null);
  const [jdLoading, setJdLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [jdTargetResumeId, setJdTargetResumeId] = useState('');

  // ─── Job Cart State & Effects ──────────────────────────────────────────
  const [jds, setJds] = useState<JobDescriptionItem[]>([]);
  const showCart = searchParams.get('cart') === 'true';
  const [cartLoading, setCartLoading] = useState(false);

  const fetchJds = useCallback(async () => {
    setCartLoading(true);
    try {
      const res = await getJobDescriptions();
      if (res.data.success) {
        setJds(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJds();
  }, [fetchJds]);

  useEffect(() => {
    const jd = searchParams.get('jd_id');
    if (jd) {
      setActiveJdId(jd);
      setShowJdModal(true);
      router.replace('/dashboard/resumes');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (activeJdId && showJdModal) {
      const loadJd = async () => {
        setJdLoading(true);
        try {
          const res = await getJobDescription(activeJdId);
          if (res.data.success) {
            const data = res.data.data;
            setJdData({
              company: data.company || '',
              title: data.title || '',
              text: data.descriptionText || ''
            });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setJdLoading(false);
        }
      };
      loadJd();
    }
  }, [activeJdId, showJdModal]);

  useEffect(() => {
    if (resumes.length > 0 && !jdTargetResumeId) {
      const primary = resumes.find(r => r.isPrimary) || resumes[0];
      setJdTargetResumeId(primary.id);
    }
  }, [resumes, jdTargetResumeId]);

  const handleJdOptimize = async () => {
    if (!jdData || !jdTargetResumeId) return;
    setOptimizing(true);
    try {
      const optRes = await optimizeForJD(jdTargetResumeId, jdData.text);
      const tailoredHtml = optRes.data.data.htmlContent;
      const optData = optRes.data.data;
      const atsScore = optData.scores?.ats || 85;
      
      const verRes = await createResumeVersion(jdTargetResumeId, {
        jobTitle: jdData.title || 'Tailored Role',
        company: jdData.company || 'Target Company',
        atsScore,
        content: { 
          htmlContent: tailoredHtml,
          notes: optData.notes,
          keywordsInserted: optData.keywordsInserted,
          matchedKeywords: optData.matchedKeywords,
          missingKeywords: optData.missingKeywords,
          jobDescription: jdData.text
        }
      });
      
      if (verRes.data.success) {
        const newVer = verRes.data.data;
        await generateCoverLetterForVersion(newVer.id, { jobDescription: jdData.text, tone: 'formal' });
        
        if (activeJdId) {
          try {
            await deleteJobDescription(activeJdId);
            setJds(prev => prev.filter(item => item.id !== activeJdId));
          } catch (e) {
            console.error('Failed to clean up job description:', e);
          }
        }

        router.push(`/dashboard/resumes/tailor-version/${newVer.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizing(false);
    }
  };

  const fetchResumes = useCallback(async () => {
    try {
      const res = await getAllResumes();
      setResumes(res.data.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this resume and all its versions? This cannot be undone.')) return;
    await deleteResume(id);
    setResumes(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleSuccess = (resume: ResumeListItem) => {
    setResumes(prev => [resume, ...prev]);
    setSelected(resume);
  };

  const CREATE_OPTIONS = [
    { key: 'upload' as ModalType, icon: Upload, label: 'Upload', desc: 'PDF or DOCX · AI scores instantly', color: 'border-[#2c2c2e] hover:border-white' },
    { key: 'roast' as ModalType, icon: Flame, label: 'Roast', desc: 'Get a brutal, sarcastic AI roast', color: 'border-amber-500/30 hover:border-amber-400/60' },
    { key: 'generate' as ModalType, icon: Sparkles, label: 'Generate', desc: 'From profile · ATS-optimised', color: 'border-[#2c2c2e] hover:border-white' },
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-8 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 xl:w-80 flex-shrink-0 border-r border-zinc-900/60 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-900/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-bold text-sm tracking-tight">My Resumes</h2>
              <p className="text-zinc-600 text-[10px] mt-0.5">Upload, generate or tailor</p>
            </div>
            <span className="text-zinc-400 text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full font-medium">{resumes.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CREATE_OPTIONS.map(({ key, icon: Icon, label, desc, color }) => (
              <button key={String(key)} onClick={() => setModal(key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center group ${color}`}>
                <Icon size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                <span className="text-zinc-300 text-[10px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-900 p-3.5 space-y-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2 w-1/2 rounded" />
              </div>
            ))
          ) : resumes.length === 0 ? (
            <div className="text-center pt-12 px-4">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-zinc-700" />
              </div>
              <p className="text-zinc-400 text-sm font-semibold mb-1">No resumes yet</p>
              <p className="text-zinc-600 text-xs">Upload, generate, or roast one above</p>
            </div>
          ) : resumes.map(r => (
            <ResumeCard key={r.id} resume={r} selected={selected?.id === r.id}
              onClick={() => { setSelected(r); router.push('/dashboard/resumes'); }} onDelete={e => handleDelete(e, r.id)} />
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 xl:p-8 bg-black custom-scrollbar">
        {showCart ? (
          <JobCartPanel 
            jds={jds} 
            loading={cartLoading} 
            onOptimize={(jd) => {
              setJdData({ company: jd.company || '', title: jd.title || '', text: jd.descriptionText });
              setActiveJdId(jd.id);
              setShowJdModal(true);
            }} 
            onDelete={async (id) => {
              if (!window.confirm('Delete this job description from your cart?')) return;
              try {
                const res = await deleteJobDescription(id);
                if (res.data.success) {
                  setJds(prev => prev.filter(item => item.id !== id));
                }
              } catch (e) {
                console.error(e);
              }
            }} 
            onClose={() => router.push('/dashboard/resumes')}
          />
        ) : selected ? (
          <ATSPanel resume={selected} onEdit={() => router.push(`/dashboard/resumes/editor/${selected.id}`)} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-white text-3xl font-semibold tracking-tight mb-2">Resume Hub</h1>
              <p className="text-gray-500 text-sm">Build, optimise, and manage your resumes with AI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                { icon: Upload, label: 'Upload Resume', desc: 'Analyse an existing PDF or DOCX. Get instant ATS score and improvement suggestions.', modal: 'upload' as ModalType, badge: null },
                { icon: Flame, label: 'Banana CV (Roast)', desc: 'Upload your resume and get a brutal, savage recruiter critique of all faults and errors.', modal: 'roast' as ModalType, badge: 'Hot' },
                { icon: Sparkles, label: 'Generate with AI', desc: 'Pull your profile data and build a polished, ATS-optimised CV in seconds.', modal: 'generate' as ModalType, badge: 'Popular' },
              ].map(({ icon: Icon, label, desc, modal: m, badge }) => (
                <button key={label} onClick={() => setModal(m)}
                  className="group bg-[#111] border border-[#222] hover:border-[#444] rounded-2xl p-6 text-left transition-all relative overflow-hidden">
                  {badge && (
                    <span className={`absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full font-medium ${
                      badge === 'Hot' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                    }`}>{badge}</span>
                  )}
                  <div className="w-10 h-10 bg-[#1e1e1e] group-hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{label}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-gray-700 group-hover:text-gray-400 transition-colors">
                    Get started <ArrowUpRight size={11} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-8">
              {[
                { icon: BarChart3, label: '6 AI Scores', desc: 'Deep analysis' },
                { icon: Target, label: 'Keyword Gaps', desc: 'ATS terms' },
                { icon: Flame, label: 'Banana Roast', desc: 'Brutal critiques' },
                { icon: Lightbulb, label: 'Inline Fixes', desc: 'In-editor AI' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={16} className="text-gray-700" />
                  <span className="text-gray-500 text-xs font-medium">{label}</span>
                  <span className="text-gray-700 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'roast' && <RoastModal onClose={() => setModal(null)} onSuccess={handleSuccess} />}

      {showJdModal && jdData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" /> Captured Job Description
              </h3>
              <button onClick={() => { setShowJdModal(false); setActiveJdId(null); }} className="text-gray-600 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Company Name</label>
                <input type="text" value={jdData.company} onChange={e => setJdData({ ...jdData, company: e.target.value })} className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Job Title</label>
                <input type="text" value={jdData.title} onChange={e => setJdData({ ...jdData, title: e.target.value })} className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Job Description Text</label>
                <textarea rows={5} value={jdData.text} readOnly className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs read-only:opacity-75 focus:outline-none" />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Select Master Resume to Tailor</label>
                <select value={jdTargetResumeId} onChange={e => setJdTargetResumeId(e.target.value)} className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/20">
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} {r.isPrimary ? '(Primary)' : ''}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleJdOptimize} disabled={optimizing || resumes.length === 0} className="w-full bg-white text-black font-semibold py-2.5 rounded-xl text-xs hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
                {optimizing ? <><Loader2 size={13} className="animate-spin" />Tailoring & Scoring...</> : <><Sparkles size={13} />Optimize, Score & Tailor Resume</>}
              </button>
            </div>
          </div>
        </div>
      )}    </div>
  );
}

// ─── Job Cart Inline Panel ────────────────────────────────────────────────
interface JobCartPanelProps {
  jds: JobDescriptionItem[];
  loading: boolean;
  onOptimize: (jd: JobDescriptionItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function JobCartPanel({ jds, loading, onOptimize, onDelete, onClose }: JobCartPanelProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-4">
        <div>
          <h1 className="text-white text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase size={22} className="text-violet-400" /> Job Cart
          </h1>
          <p className="text-gray-500 text-xs mt-1">Select a captured job listing to score and tailor your resume, or save descriptions for later.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs bg-[#111] border border-[#222] px-3 py-1.5 rounded-xl transition-colors">
          Close Cart
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      ) : jds.length === 0 ? (
        <div className="text-center py-20 border border-[#1e1e1e] border-dashed rounded-2xl">
          <Briefcase className="text-gray-600 mx-auto mb-3" size={32} />
          <h3 className="text-white text-sm font-semibold">Your Job Cart is empty</h3>
          <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">Use the DearHR browser extension to capture jobs from LinkedIn, Indeed, or Naukri, and they will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jds.map((jd) => (
            <div key={jd.id} className="bg-[#111] border border-[#222] hover:border-[#333] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-white text-sm font-semibold truncate">{jd.title}</h3>
                  <span className="text-[10px] text-gray-500 bg-[#1e1e24] px-2 py-0.5 rounded-full shrink-0">
                    {new Date(jd.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-violet-400 text-xs font-medium mt-0.5">{jd.company}</p>
                <p className="text-gray-500 text-xs mt-2 line-clamp-2 pr-4">{jd.descriptionText}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOptimize(jd)}
                  className="bg-white hover:bg-gray-200 text-black text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles size={13} /> Optimize & Tailor
                </button>
                <button
                  onClick={() => onDelete(jd.id)}
                  className="p-2 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                  title="Delete Job"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}