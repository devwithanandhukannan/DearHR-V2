'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, Plus, Trash2, Loader2, X, ExternalLink, FileText, 
  Calendar, Check, AlertCircle, Clock, StickyNote, Award
} from 'lucide-react';
import Link from 'next/link';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getAllResumes,
  getResumeVersions,
  type JobApplicationItem,
  type ResumeVersionItem
} from '@/app/lib/resumeApi';

const COLUMNS = [
  { id: 'wishlist', title: 'Wishlist', bg: 'bg-zinc-950/40', border: 'border-zinc-800/40', accent: 'text-gray-400 bg-gray-500/10' },
  { id: 'applied', title: 'Applied', bg: 'bg-[#0b0c10]/40', border: 'border-blue-950/30', accent: 'text-blue-400 bg-blue-500/10' },
  { id: 'interviewing', title: 'Interviewing', bg: 'bg-[#0f0e15]/40', border: 'border-amber-950/30', accent: 'text-amber-400 bg-amber-500/10' },
  { id: 'offers', title: 'Offers', bg: 'bg-[#09110d]/40', border: 'border-green-950/30', accent: 'text-green-400 bg-green-500/10' },
  { id: 'archive', title: 'Archive', bg: 'bg-zinc-950/60', border: 'border-zinc-900', accent: 'text-zinc-500 bg-zinc-800/10' },
];

export default function TrackerPage() {
  const { showToast } = useGlassToast();
  const [apps, setApps] = useState<JobApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<JobApplicationItem | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStatus, setNewStatus] = useState('wishlist');
  const [newNotes, setNewNotes] = useState('');
  const [newJdText, setNewJdText] = useState('');
  const [newVersionId, setNewVersionId] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit fields inside Drawer
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVersionId, setEditVersionId] = useState('');
  const [updating, setUpdating] = useState(false);

  // Resume Versions lookup
  const [allVersions, setAllVersions] = useState<ResumeVersionItem[]>([]);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const res = await getApplications();
      if (res.data.success) {
        setApps(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const resumesRes = await getAllResumes();
      if (resumesRes.data.success) {
        const list: ResumeVersionItem[] = [];
        for (const r of resumesRes.data.data) {
          const vRes = await getResumeVersions(r.id);
          if (vRes.data.success) {
            list.push(...vRes.data.data);
          }
        }
        setAllVersions(list);
      }
    } catch (e) {
      console.error('Failed to fetch versions:', e);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    fetchVersions();
  }, [fetchApps, fetchVersions]);

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedId) return;
    const targetId = draggedId;
    setDraggedId(null);

    // Optimistic update
    setApps(prev => prev.map(app => app.id === targetId ? { ...app, status } : app));

    try {
      await updateApplication(targetId, { status });
    } catch (e) {
      console.error(e);
      // Revert on failure
      fetchApps();
    }
  };

  // Create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;
    setCreating(true);

    try {
      const res = await createApplication({
        title: newTitle,
        company: newCompany,
        status: newStatus,
        notes: newNotes,
        descriptionText: newJdText,
        resumeVersionId: newVersionId || undefined
      });

      if (res.data.success) {
        setApps(prev => [res.data.data, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewCompany('');
        setNewNotes('');
        setNewJdText('');
        setNewVersionId('');
        showToast('Success', 'Application card created successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to create application card.', 'danger');
    } finally {
      setCreating(false);
    }
  };

  // Drawer Edit load
  const openDrawer = (app: JobApplicationItem) => {
    setActiveCard(app);
    setEditTitle(app.title);
    setEditCompany(app.company);
    setEditNotes(app.notes || '');
    setEditDate(app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : '');
    setEditVersionId(app.resumeVersionId || '');
  };

  const handleUpdate = async () => {
    if (!activeCard) return;
    setUpdating(true);

    try {
      const res = await updateApplication(activeCard.id, {
        title: editTitle,
        company: editCompany,
        notes: editNotes,
        appliedAt: editDate || null,
        resumeVersionId: editVersionId || null
      });

      if (res.data.success) {
        const updated = res.data.data;
        setApps(prev => prev.map(app => app.id === updated.id ? updated : app));
        setActiveCard(updated);
        showToast('Success', 'Details updated successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to update details.', 'danger');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job application?')) return;
    try {
      const res = await deleteApplication(id);
      if (res.data.success) {
        setApps(prev => prev.filter(app => app.id !== id));
        setActiveCard(null);
        showToast('Success', 'Application deleted successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to delete application.', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="animate-spin text-gray-500" size={32} />
        <p className="text-gray-500 text-sm">Loading applications board...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] -m-4 md:-m-8 flex flex-col bg-[#070709] overflow-hidden select-none">
      
      {/* Header */}
      <header className="p-6 border-b border-[#1a1a24] bg-[#0c0c10]/40 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Applications Tracker</h1>
          <p className="text-gray-500 text-xs mt-1">Organize your job hunt pipeline and track tailored resume documents</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-white hover:bg-gray-200 text-black text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus size={14} /> Add Job Application
        </button>
      </header>

      {/* Board Columns container */}
      <div className="flex-1 overflow-hidden p-6 flex gap-3.5 items-stretch bg-[#070709]">
        {COLUMNS.map(col => {
          const colApps = apps.filter(app => app.status === col.id);

          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className={`flex-1 min-w-0 flex flex-col rounded-2xl border border-white/[0.02] p-3.5 ${col.bg} ${col.border}`}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.accent}`}>{colApps.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px] pr-1">
                {colApps.map(app => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => handleDragStart(app.id)}
                    onClick={() => openDrawer(app)}
                    className="bg-[#111116] border border-[#1e1e26] hover:border-zinc-700/80 rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:shadow-black/20 group relative"
                  >
                    <h4 className="text-white text-xs font-bold truncate group-hover:text-violet-400 transition-colors">{app.title}</h4>
                    <p className="text-gray-400 text-[10px] font-medium mt-0.5">{app.company}</p>

                    {/* Meta linked tag */}
                    {app.resumeVersion ? (
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-900/60 pt-2 text-[9px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <FileText size={10} className="text-indigo-400" /> Tailored
                        </span>
                        {app.resumeVersion.atsScore != null && (
                          <span className="bg-green-500/10 text-green-400 font-semibold px-1.5 py-0.5 rounded">
                            {app.resumeVersion.atsScore}% ATS
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 border-t border-zinc-900/60 pt-2 text-[9px] text-zinc-600 italic">
                        No resume linked
                      </div>
                    )}
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-zinc-800/40 rounded-xl text-zinc-700 text-[10px]">
                    Drag cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── JOB CREATION MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0c0c10] border border-[#1e1e26] rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
            <h3 className="text-white font-bold text-sm mb-4">Add Job Application</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Job Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Trainee Software Engineer"
                  className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Company</label>
                <input 
                  type="text" 
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. Alignminds Technologies"
                  className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Status Column</label>
                  <select 
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offers">Offers</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Link Tailored CV</label>
                  <select 
                    value={newVersionId}
                    onChange={e => setNewVersionId(e.target.value)}
                    className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="">-- No Tailored CV --</option>
                    {allVersions.map(v => (
                      <option key={v.id} value={v.id}>{v.jobTitle} @ {v.company}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Personal Notes</label>
                <textarea 
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Salary details, interview dates, contacts..."
                  className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500/40 resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-white text-black font-semibold py-2 rounded-xl text-xs hover:bg-gray-150 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {creating ? <Loader2 size={13} className="animate-spin" /> : null}
                Create Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── SIDE DRAWER DETAIL CARD ─── */}
      {activeCard && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="flex-1" onClick={() => setActiveCard(null)} />
          
          <div className="w-[450px] max-w-full h-full bg-[#0c0c10] border-l border-[#1a1a24] flex flex-col shadow-2xl relative z-50 animate-slide-in">
            <header className="p-4 border-b border-[#1a1a24] flex items-center justify-between">
              <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                Application Details
              </span>
              <button onClick={() => setActiveCard(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={e => { setEditTitle(e.target.value); }}
                    onBlur={handleUpdate}
                    className="w-full bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500/50 hover:bg-[#121216]/50 rounded-xl px-3 py-2 text-white text-sm font-semibold transition-all focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Company</label>
                  <input 
                    type="text" 
                    value={editCompany}
                    onChange={e => { setEditCompany(e.target.value); }}
                    onBlur={handleUpdate}
                    className="w-full bg-transparent border border-transparent hover:border-zinc-800 focus:border-indigo-500/50 hover:bg-[#121216]/50 rounded-xl px-3 py-2 text-white text-xs font-semibold transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/60 pt-4">
                <div>
                  <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Applied Date</label>
                  <input 
                    type="date"
                    value={editDate}
                    onChange={e => { setEditDate(e.target.value); }}
                    onBlur={handleUpdate}
                    className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Linked Tailored CV</label>
                  <select 
                    value={editVersionId}
                    onChange={e => { setEditVersionId(e.target.value); }}
                    onBlur={handleUpdate}
                    className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="">-- No linked CV --</option>
                    {allVersions.map(v => (
                      <option key={v.id} value={v.id}>{v.jobTitle} @ {v.company}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeCard.resumeVersion && (
                <div className="bg-[#111116] border border-[#1e1e26] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-indigo-400" /> Tailored Workspace Documents
                    </span>
                    {activeCard.resumeVersion.atsScore != null && (
                      <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded">
                        {activeCard.resumeVersion.atsScore}% ATS Match
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-[10px] leading-relaxed">
                    A tailored CV version and custom Cover Letter were configured for this application.
                  </p>
                  <Link 
                    href={`/dashboard/resumes/tailor-version/${activeCard.resumeVersionId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Open Tailored Workspace <ExternalLink size={11} />
                  </Link>
                </div>
              )}

              <div className="space-y-1.5 border-t border-zinc-900/60 pt-4">
                <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <StickyNote size={12} /> Personal Tracking Notes
                </label>
                <textarea 
                  rows={6}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Record contact info, interviewer names, key questions asked, callback timelines..."
                  className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-indigo-500/40 resize-none leading-relaxed"
                />
              </div>
            </div>

            <footer className="p-4 border-t border-[#1a1a24] bg-[#0c0c10]/40 flex items-center justify-between shrink-0">
              <button 
                onClick={() => handleDelete(activeCard.id)}
                className="text-red-400 hover:bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} /> Delete Card
              </button>
              {updating ? (
                <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> Auto-saving...
                </span>
              ) : (
                <span className="text-green-500 text-[10px] flex items-center gap-1">
                  ✓ Saved to pipeline
                </span>
              )}
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}
