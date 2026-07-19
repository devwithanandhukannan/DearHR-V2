// PATH: src/app/dashboard/resumes/email-tailor/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, FileText, Send, Sparkles, Loader2,
  AlertCircle, CheckCircle2, Lock, Save, X, MessageSquare, Check
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import {
  getSmtpConfig, saveSmtpConfig, draftEmailAndCV, sendEmailWithCV,
  getAllResumes, generateOutreachMessage, type SmtpConfig, type ResumeListItem
} from '@/app/lib/resumeApi';

export default function EmailTailorPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();

  // Resume Selection
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // SMTP States
  const [smtpSet, setSmtpSet] = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: ''
  });
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);

  // App/Generation States
  const [jobDescription, setJobDescription] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  // Output States
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [attachTailored, setAttachTailored] = useState(true);

  // Social Outreach & Channel states
  const [outreachChannel, setOutreachChannel] = useState<'email' | 'social'>('email');
  const [outreachType, setOutreachType] = useState<'linkedin_connection' | 'linkedin_inmail' | 'cold_email'>('linkedin_connection');
  const [recipientTitle, setRecipientTitle] = useState('Hiring Manager');
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachBody, setOutreachBody] = useState('');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [versionId, setVersionId] = useState<string>('');

  // CV/HTML Render
  const [originalHtml, setOriginalHtml] = useState('');
  const [tailoredHtml, setTailoredHtml] = useState('');

  // Fetch initial SMTP and Resume info
  useEffect(() => {
    const fetchInit = async () => {
      try {
        // 1. Check SMTP
        const smtpRes = await getSmtpConfig();
        if (smtpRes.data.success) {
          const config = smtpRes.data.data;
          setSmtpConfig(config);
          const isConfigured = !!(config.smtpHost && config.smtpPort && config.smtpUser && config.hasPassword);
          setSmtpSet(isConfigured);
        }

        // 2. Fetch all resumes
        const resumesRes = await getAllResumes();
        const resumeList = resumesRes.data.data;
        setResumes(resumeList);

        if (resumeList.length > 0) {
          const primary = resumeList.find(r => r.isPrimary) || resumeList[0];
          setSelectedResumeId(primary.id);
        }
      } catch (err: any) {
        console.error("fetchInit error:", err);
        showToast('Error', err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to initialize session data', 'danger');
      } finally {
        setSmtpLoading(false);
      }
    };
    fetchInit();
  }, [showToast]);

  // Load specific resume detail when selection changes
  useEffect(() => {
    if (!selectedResumeId) return;
    const fetchResumeDetail = async () => {
      try {
        const resumeRes = await api.get(`/jobseeker/resumes/${selectedResumeId}`);
        if (resumeRes.data.success) {
          setOriginalHtml(resumeRes.data.data.content?.htmlContent || '');
          setTailoredHtml('');
        }
      } catch {
        showToast('Error', 'Failed to load resume details.', 'danger');
      }
    };
    fetchResumeDetail();
  }, [selectedResumeId, showToast]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpConfig.smtpHost || !smtpConfig.smtpPort || !smtpConfig.smtpUser || !smtpConfig.smtpPass) {
      showToast('Validation Error', 'All SMTP fields are required.', 'danger');
      return;
    }
    setSmtpSaving(true);
    try {
      const res = await saveSmtpConfig(smtpConfig);
      if (res.data.success) {
        showToast('SMTP Configured', 'SMTP credentials saved securely.', 'success');
        setSmtpSet(true);
        setShowSmtpModal(false);
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to save SMTP settings.', 'danger');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTailorAndDraft = async () => {
    if (!smtpSet) {
      setShowSmtpModal(true);
      return;
    }
    if (!selectedResumeId) {
      showToast('Validation Error', 'Please select a resume first.', 'danger');
      return;
    }
    if (!jobDescription.trim()) {
      showToast('Validation Error', 'Please paste a job description first.', 'danger');
      return;
    }
    setDrafting(true);
    try {
      const res = await draftEmailAndCV(selectedResumeId, jobDescription);
      if (res.data.success) {
        const { emailSubject, emailBody, tailoredHtmlContent, versionId } = res.data.data;
        setEmailSubject(emailSubject);
        setEmailBody(emailBody);
        setTailoredHtml(tailoredHtmlContent);
        if (versionId) {
          setVersionId(versionId);
        }
        setOutreachBody('');
        showToast('Draft Generated', 'Cover email and tailored resume are ready.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to tailor application.', 'danger');
    } finally {
      setDrafting(false);
    }
  };

  const handleGenerateSocialOutreach = async () => {
    if (!versionId) {
      showToast('Validation Error', 'Please click Tailor & Draft first to create the tailored resume context.', 'danger');
      return;
    }
    setGeneratingOutreach(true);
    try {
      const res = await generateOutreachMessage(versionId, {
        type: outreachType,
        recipientTitle
      });
      if (res.data.success) {
        setOutreachSubject(res.data.data.subject || '');
        setOutreachBody(res.data.data.body);
        showToast('Outreach Drafted', 'Social message template generated successfully.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to generate outreach message.', 'danger');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleSendEmail = async () => {
    if (!smtpSet) {
      setShowSmtpModal(true);
      return;
    }
    if (!selectedResumeId) {
      showToast('Validation Error', 'Please select a resume.', 'danger');
      return;
    }
    if (!recipient.trim()) {
      showToast('Validation Error', 'Recipient email (To:) is required.', 'danger');
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast('Validation Error', 'Email subject and body cannot be empty.', 'danger');
      return;
    }

    setSending(true);
    try {
      const res = await sendEmailWithCV(selectedResumeId, {
        to: recipient,
        subject: emailSubject,
        body: emailBody,
        attachTailored,
        tailoredHtmlContent: tailoredHtml ? tailoredHtml : undefined
      });
      if (res.data.success) {
        showToast('Email Dispatched', 'Application sent successfully via personal SMTP.', 'success');
        router.push('/dashboard/resumes');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to dispatch application.', 'danger');
    } finally {
      setSending(false);
    }
  };

  if (smtpLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        <span className="text-zinc-500 text-xs">Loading tailoring studio...</span>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center mb-4">
          <FileText size={24} className="text-zinc-600" />
        </div>
        <h2 className="text-white text-sm font-semibold mb-1">No Resumes Found</h2>
        <p className="text-gray-500 text-xs max-w-sm mb-6 leading-relaxed">
          Please upload or generate a resume first to draft cover emails and tailor applications in this workspace.
        </p>
        <Link href="/dashboard/resumes" className="bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors">
          Go to Resume Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] -m-4 md:-m-8 overflow-hidden flex flex-col bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#1e1e1e] px-6 flex items-center justify-between flex-shrink-0 bg-[#080808]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/resumes" className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-white text-sm font-semibold flex items-center gap-1.5">
              <Mail size={14} className="text-amber-500" /> Application Outreach Studio
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!smtpSet ? (
            <button onClick={() => setShowSmtpModal(true)} className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <AlertCircle size={13} /> SMTP Config Missing
            </button>
          ) : (
            <button onClick={() => setShowSmtpModal(true)} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <CheckCircle2 size={13} /> SMTP Connected
            </button>
          )}
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - JD Input & Selection */}
        <section className="w-1/4 min-w-[280px] border-r border-[#1e1e1e] flex flex-col bg-[#0b0b0b]">
          <div className="p-4 border-b border-[#1e1e1e] flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase tracking-wider">
            <Sparkles size={12} className="text-amber-500" /> Step 1: Target Position
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col flex-shrink-0">
              <label className="block text-gray-500 text-xs font-medium mb-1.5">Select Resume</label>
              <select
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30 transition-colors"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isPrimary ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-gray-500 text-xs font-medium mb-1.5">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the target job description details here to tailor your profile cover letter and CV bullet points..."
                className="flex-1 w-full bg-[#070707] border border-[#1e1e1e] rounded-xl px-4 py-3 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors resize-none leading-relaxed"
              />
            </div>
            <button
              onClick={handleTailorAndDraft}
              disabled={drafting || !jobDescription.trim()}
              className="w-full bg-white text-black py-3 rounded-xl text-xs font-bold hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              {drafting ? <><Loader2 size={13} className="animate-spin" />Optimizing...</> : <><Sparkles size={13} />Tailor & Draft</>}
            </button>
          </div>
        </section>

        {/* Middle Pane - Outreach Email Composer */}
        <section className="w-2/5 min-w-[380px] border-r border-[#1e1e1e] flex flex-col bg-[#080808]">
          <div className="p-4 border-b border-[#1e1e1e] flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={12} className="text-blue-500" /> Step 2: Outreach Channel
            </span>
            {/* Toggle Channels */}
            <div className="flex bg-[#121216] border border-[#1e1e26] p-0.5 rounded-lg">
              <button 
                onClick={() => setOutreachChannel('email')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  outreachChannel === 'email' 
                    ? 'bg-zinc-800 text-white shadow' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                Email (SMTP)
              </button>
              <button 
                onClick={() => setOutreachChannel('social')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  outreachChannel === 'social' 
                    ? 'bg-zinc-800 text-white shadow' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                LinkedIn / Social
              </button>
            </div>
          </div>

          {outreachChannel === 'email' ? (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-gray-500 text-xs font-medium mb-1.5">Recipient Address (To:)</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-xs font-medium mb-1.5">Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Application for..."
                  className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-gray-500 text-xs font-medium mb-1.5">Cover Letter Body</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Email body cover letter will populate here after you click Tailor..."
                  className="flex-1 w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-3.5 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors resize-none leading-relaxed font-sans"
                />
              </div>

              {/* Attachments Configuration */}
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex flex-col gap-2 flex-shrink-0">
                <label className="block text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Attachment Options</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      checked={attachTailored}
                      onChange={() => setAttachTailored(true)}
                      disabled={!tailoredHtml}
                      className="w-3.5 h-3.5 border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0"
                    />
                    <span>Attach tailored CV</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      checked={!attachTailored}
                      onChange={() => setAttachTailored(false)}
                      className="w-3.5 h-3.5 border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0"
                    />
                    <span>Attach original CV</span>
                  </label>
                </div>
                {!tailoredHtml && (
                  <p className="text-[10px] text-gray-600">Tailored CV option becomes selectable once generated.</p>
                )}
              </div>

              <button
                onClick={handleSendEmail}
                disabled={sending || !recipient.trim() || !emailBody.trim()}
                className="w-full bg-amber-500 text-black py-3 rounded-xl text-xs font-bold hover:bg-amber-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {sending ? <><Loader2 size={13} className="animate-spin" />Sending via SMTP...</> : <><Send size={13} />Send Application</>}
              </button>
            </div>
          ) : (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-gray-500 text-xs font-medium mb-1.5">Social Platform</label>
                <select
                  value={outreachType}
                  onChange={e => setOutreachType(e.target.value as any)}
                  className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="linkedin_connection">LinkedIn Connection Request (300 Char limit)</option>
                  <option value="linkedin_inmail">LinkedIn InMail</option>
                  <option value="cold_email">Recruiter Cold Outreach Text</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 text-xs font-medium mb-1.5">Recipient Role Title</label>
                <input
                  type="text"
                  value={recipientTitle}
                  onChange={e => setRecipientTitle(e.target.value)}
                  placeholder="e.g. Engineering Manager, Technical Recruiter"
                  className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateSocialOutreach}
                disabled={generatingOutreach || !versionId}
                className="w-full bg-white text-black py-2.5 rounded-xl text-xs font-bold hover:bg-gray-150 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                {generatingOutreach ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Generate Social Message
              </button>

              {!versionId && (
                <p className="text-[10px] text-red-400 text-center">
                  ⚠️ Click "Tailor & Draft" on the left pane to initialize this tailored CV version first.
                </p>
              )}

              {outreachBody && (
                <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Social Draft Message</span>
                    <p className="text-zinc-200 text-xs whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-1">
                      {outreachBody}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(outreachBody);
                      showToast('Copied', 'Social outreach note copied to clipboard.', 'success');
                    }}
                    className="w-full bg-zinc-800 text-white py-2 rounded-xl text-xs font-semibold mt-3 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={13} /> Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Pane - Real-Time updated PDF/HTML Preview */}
        <section className="flex-1 flex flex-col bg-[#0e0e0e] overflow-hidden">
          <div className="p-4 border-b border-[#1e1e1e] flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider bg-[#0b0b0b]">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-green-500" /> Step 3: CV Attachment Preview
            </div>
            {tailoredHtml && attachTailored && (
              <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium uppercase font-mono">Tailored Version</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden bg-[#050505] flex items-center justify-center">
            <CVPreviewFrame html={getStyledCvHtml(attachTailored && tailoredHtml ? tailoredHtml : originalHtml)} />
          </div>
        </section>
      </div>

      {/* SMTP Configuration Dialog Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Lock size={15} className="text-amber-400" /> SMTP Configuration
                </h2>
                <p className="text-gray-500 text-[11px] mt-0.5">Please add your personal SMTP credentials to draft & send applications.</p>
              </div>
              <button onClick={() => setShowSmtpModal(false)} className="text-gray-600 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">SMTP Host / Server *</label>
                <input
                  type="text"
                  value={smtpConfig.smtpHost}
                  onChange={e => setSmtpConfig({ ...smtpConfig, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required
                  className="w-full px-3.5 py-2 bg-[#090909] border border-[#222] rounded-xl text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">SMTP Port *</label>
                <input
                  type="text"
                  value={smtpConfig.smtpPort}
                  onChange={e => setSmtpConfig({ ...smtpConfig, smtpPort: e.target.value })}
                  placeholder="587 or 465"
                  required
                  className="w-full px-3.5 py-2 bg-[#090909] border border-[#222] rounded-xl text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">SMTP User / Username *</label>
                <input
                  type="text"
                  value={smtpConfig.smtpUser}
                  onChange={e => setSmtpConfig({ ...smtpConfig, smtpUser: e.target.value })}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3.5 py-2 bg-[#090909] border border-[#222] rounded-xl text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5">SMTP Password *</label>
                <input
                  type="password"
                  value={smtpConfig.smtpPass || ''}
                  onChange={e => setSmtpConfig({ ...smtpConfig, smtpPass: e.target.value })}
                  placeholder={smtpConfig.hasPassword ? '••••••••' : 'Enter SMTP password'}
                  required={!smtpConfig.hasPassword}
                  className="w-full px-3.5 py-2 bg-[#090909] border border-[#222] rounded-xl text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-white/30"
                />
                <p className="text-[10px] text-gray-600 mt-1">Stored securely using symmetric key encryption.</p>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-[#1e1e1e] justify-end">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(false)}
                  className="px-4 py-2 border border-[#2c2c2e] text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  {smtpSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStyledCvHtml(cvHtml: string): string {
  if (!cvHtml) return '';
  
  let bodyContent = cvHtml;
  if (cvHtml.includes('<body')) {
    const match = cvHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match) bodyContent = match[1];
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
          
          body { 
            padding: 30px 36px !important; 
            max-width: 800px !important; 
            margin: 0 auto !important; 
            font-family: 'Inter', -apple-system, sans-serif !important;
            background: #ffffff !important;
            color: #1f2937 !important;
            line-height: 1.5 !important;
            font-size: 13px !important;
            box-sizing: border-box !important;
          }
          * {
            box-sizing: border-box !important;
          }
          
          h1, .name {
            font-family: 'Outfit', sans-serif !important;
            font-size: 24px !important;
            font-weight: 800 !important;
            text-align: center !important;
            color: #111827 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px 0 !important;
            text-transform: uppercase !important;
          }
          
          h2 {
            font-family: 'Outfit', sans-serif !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
            color: #111827 !important;
            border-bottom: 1.5px solid #e5e7eb !important;
            padding-bottom: 4px !important;
            margin-top: 20px !important;
            margin-bottom: 10px !important;
          }
          
          p, li {
            font-size: 13px !important;
            color: #374151 !important;
            line-height: 1.5 !important;
          }
          
          ul {
            margin: 4px 0 10px 0 !important;
            padding-left: 18px !important;
            list-style-type: disc !important;
            color: #4b5563 !important;
          }
          
          li {
            margin-bottom: 3px !important;
            line-height: 1.45 !important;
          }
          
          a {
            color: #2563eb !important;
            text-decoration: none !important;
            border-bottom: 1px dashed rgba(37,99,235,0.4) !important;
          }
          
          /* Custom scrollbar inside iframe */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 99px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

function CVPreviewFrame({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const targetWidth = 800;
      const targetHeight = 1130;
      
      const newScale = Math.min((containerWidth - 32) / targetWidth, (containerHeight - 32) / targetHeight, 1);
      setScale(newScale);
    };

    handleResize();
    const timer = setTimeout(handleResize, 100);

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const targetWidth = 800;
  const targetHeight = 1130;

  return (
    <div ref={containerRef} className="w-full h-full flex justify-center items-center overflow-hidden p-4">
      <div 
        style={{
          width: `${targetWidth * scale}px`,
          height: `${targetHeight * scale}px`,
          position: 'relative',
          overflow: 'hidden'
        }}
        className="shrink-0"
      >
        <div
          style={{
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="bg-white border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        >
          <iframe
            title="CV Preview"
            srcDoc={html}
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin"
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
