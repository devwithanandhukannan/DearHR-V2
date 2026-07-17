// PATH: src/app/dashboard/resumes/tailor-version/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Loader2, Download, CheckCircle2, AlertCircle, FileText,
  Mail, Save, Flame, Layout, RefreshCw, Eye
} from 'lucide-react';
import {
  getResumeVersionById,
  generateCoverLetterForVersion,
  updateCoverLetter,
  type ResumeVersionItem
} from '@/app/lib/resumeApi';

export default function TailoredVersionPage() {
  const params = useParams();
  const router = useRouter();
  const versionId = params.id as string;

  const [version, setVersion] = useState<ResumeVersionItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Cover Letter fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState<'formal' | 'concise'>('formal');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');

  // Load version data
  const loadVersion = useCallback(async () => {
    try {
      const res = await getResumeVersionById(versionId);
      if (res.data.success) {
        const v = res.data.data;
        setVersion(v);
        if (v.coverLetter) {
          setSubject(v.coverLetter.subject || 'Cover Letter');
          setBody(v.coverLetter.body || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    loadVersion();
  }, [loadVersion]);

  // Save edited cover letter
  const handleSaveCoverLetter = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const res = await updateCoverLetter(versionId, { subject, body });
      if (res.data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  // Generate cover letter from inputs
  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    try {
      const res = await generateCoverLetterForVersion(versionId, {
        jobDescription: version?.content?.htmlContent || 'Please refer to candidate resume details.',
        tone
      });
      if (res.data.success) {
        setSubject(res.data.data.subject || 'Cover Letter');
        setBody(res.data.data.body || '');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (e) {
      console.error(e);
      alert('Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // Export CV PDF
  const handleExportCV = () => {
    if (!version?.content?.htmlContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(version.content.htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Export Cover Letter Text
  const handleExportCoverLetter = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${version?.company || 'Company'}_Tailored_Cover_Letter.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="animate-spin text-gray-500" size={32} />
        <p className="text-gray-500 text-sm">Loading tailored workspace...</p>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black gap-3 text-center p-4">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-white text-sm font-semibold">Workspace Not Found</p>
        <Link href="/dashboard/resumes" className="text-gray-500 hover:text-white transition-colors text-xs flex items-center gap-1">
          <ArrowLeft size={12} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const cvHtml = version.content?.htmlContent || '';

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-8 overflow-hidden bg-[#070709]">
      
      {/* ─── LEFT COLUMN: Job details & Controls ─── */}
      <aside className="w-80 border-r border-[#1a1a24] bg-[#0c0c10] p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <Link href="/dashboard/resumes" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors font-medium">
            <ArrowLeft size={13} /> Back to Resumes
          </Link>

          <div>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tailored Version
            </span>
            <h1 className="text-white font-bold text-lg mt-2 leading-tight">{version.jobTitle}</h1>
            <p className="text-gray-400 text-xs mt-1">{version.company}</p>
          </div>

          {version.atsScore != null && (
            <div className="bg-[#111116] border border-[#1e1e26] rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-green-500/35 flex items-center justify-center bg-green-500/5 text-green-400 font-bold text-sm">
                {version.atsScore}%
              </div>
              <div>
                <p className="text-white text-xs font-semibold">ATS Match Score</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Optimized with core keywords</p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-[#1a1a24]">
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Cover Letter AI settings</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setTone('formal')}
                className={`py-2 rounded-lg border text-center text-xs font-medium transition-all ${
                  tone === 'formal' ? 'border-white/20 bg-white/5 text-white' : 'border-[#1e1e26] text-gray-500 hover:text-gray-300'
                }`}
              >
                Formal
              </button>
              <button
                onClick={() => setTone('concise')}
                className={`py-2 rounded-lg border text-center text-xs font-medium transition-all ${
                  tone === 'concise' ? 'border-white/20 bg-white/5 text-white' : 'border-[#1e1e26] text-gray-500 hover:text-gray-300'
                }`}
              >
                Concise
              </button>
            </div>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={generating}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-40"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Generate Cover Letter
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-[#1a1a24]">
          <button
            onClick={handleExportCV}
            disabled={!cvHtml}
            className="w-full flex items-center justify-center gap-2 bg-[#121218] border border-[#1e1e26] hover:border-white/20 text-white font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
          >
            <Download size={13} /> Export CV PDF
          </button>
          <button
            onClick={handleExportCoverLetter}
            disabled={!body}
            className="w-full flex items-center justify-center gap-2 bg-[#121218] border border-[#1e1e26] hover:border-white/20 text-white font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
          >
            <FileText size={13} /> Export Cover Letter
          </button>
        </div>
      </aside>

      {/* ─── MIDDLE COLUMN: Rich Text Cover Letter Editor ─── */}
      <main className="flex-1 border-r border-[#1a1a24] bg-[#08080a] flex flex-col">
        <div className="p-4 border-b border-[#1a1a24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-indigo-400" />
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider">Cover Letter Workspace</h2>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-gray-500 text-[10px] flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> saving...</span>}
            {saveStatus === 'saved' && <span className="text-green-400 text-[10px] flex items-center gap-1">✓ saved</span>}
            <button
              onClick={handleSaveCoverLetter}
              disabled={saving}
              className="flex items-center gap-1 bg-[#121218] border border-[#1e1e26] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-white/25 transition-all"
            >
              <Save size={12} /> Save Draft
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Email / Letter Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Application for Frontend Engineer position"
              className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Letter Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write or generate cover letter contents..."
              className="flex-1 w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors font-sans resize-none leading-relaxed"
            />
          </div>
        </div>
      </main>

      {/* ─── RIGHT COLUMN: Printable CV Preview ─── */}
      <section className="w-[450px] bg-[#0c0c10] flex flex-col">
        <div className="p-4 border-b border-[#1a1a24] flex items-center gap-2">
          <Eye size={14} className="text-violet-400" />
          <h2 className="text-white text-xs font-semibold uppercase tracking-wider">Tailored CV Live Preview</h2>
        </div>
        <div className="flex-1 p-4 bg-[#070709] overflow-hidden">
          {cvHtml ? (
            <iframe
              srcDoc={cvHtml}
              className="w-full h-full border-none bg-white rounded-xl shadow-lg"
              title="Tailored CV Live Preview"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border border-[#1a1a24] border-dashed rounded-xl bg-white/2">
              <FileText className="text-gray-700 mb-2" size={28} />
              <p className="text-gray-500 text-xs">No tailored CV content generated.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
