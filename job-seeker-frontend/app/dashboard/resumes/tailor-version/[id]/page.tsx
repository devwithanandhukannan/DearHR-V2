// PATH: src/app/dashboard/resumes/tailor-version/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Loader2, Download, CheckCircle2, AlertCircle, FileText,
  Mail, Save, Flame, RefreshCw, Eye, Award, Check, X, Clipboard, ExternalLink, Calendar, StickyNote
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import {
  getResumeVersionById,
  generateCoverLetterForVersion,
  updateCoverLetter,
  injectKeywordsForVersion,
  getMockInterviewQuestions,
  submitInterviewAnswer,
  generateOutreachMessage,
  getSalaryInsights,
  createApplication,
  type ResumeVersionItem
} from '@/app/lib/resumeApi';

export default function TailoredVersionPage() {
  const { showToast } = useGlassToast();
  const params = useParams();
  const router = useRouter();
  const versionId = params.id as string;

  const [version, setVersion] = useState<ResumeVersionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cv' | 'letter' | 'keywords' | 'interview' | 'salary'>('cv');

  // Cover Letter fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState<'formal' | 'concise'>('formal');
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const [letterSaveStatus, setLetterSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');

  // Outreach Message fields (inside Cover Letter tab)
  const [outreachType, setOutreachType] = useState<'linkedin_connection' | 'linkedin_inmail' | 'cold_email'>('linkedin_connection');
  const [recipientTitle, setRecipientTitle] = useState('Hiring Manager');
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachBody, setOutreachBody] = useState('');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);

  // ATS Keyword Checklist fields
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [injecting, setInjecting] = useState(false);

  // AI Mock Interview fields
  const [interviewQuestions, setInterviewQuestions] = useState<{ id: string; question: string; type: string }[]>([]);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingAnswerId, setSubmittingAnswerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { score: number; feedback: string; suggestedAnswer: string }>>({});

  // Salary Insights fields
  const [salaryData, setSalaryData] = useState<{ estimatedBrackets: string; leverageFactors: string[]; emailScript: string; liveScript: string } | null>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // Kanban Pushing fields
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'pushed'>('idle');
  const [kanbanColumn, setKanbanColumn] = useState('applied');

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

  // Load context-specific tab data
  useEffect(() => {
    if (activeTab === 'interview' && interviewQuestions.length === 0 && version) {
      const loadInterviewQuestions = async () => {
        setLoadingInterview(true);
        try {
          const res = await getMockInterviewQuestions(versionId);
          if (res.data.success) {
            setInterviewQuestions(res.data.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingInterview(false);
        }
      };
      loadInterviewQuestions();
    }

    if (activeTab === 'salary' && !salaryData && version) {
      const loadSalaryInsights = async () => {
        setLoadingSalary(true);
        try {
          const res = await getSalaryInsights(versionId);
          if (res.data.success) {
            setSalaryData(res.data.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSalary(false);
        }
      };
      loadSalaryInsights();
    }
  }, [activeTab, interviewQuestions.length, salaryData, version, versionId]);

  // Save edited cover letter
  const handleSaveCoverLetter = async () => {
    setSavingLetter(true);
    setLetterSaveStatus('saving');
    try {
      const res = await updateCoverLetter(versionId, { subject, body });
      if (res.data.success) {
        setLetterSaveStatus('saved');
        setTimeout(() => setLetterSaveStatus('idle'), 2000);
      }
    } catch (e) {
      console.error(e);
      setLetterSaveStatus('idle');
    } finally {
      setSavingLetter(false);
    }
  };

  // Generate cover letter from inputs
  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    try {
      const res = await generateCoverLetterForVersion(versionId, {
        jobDescription: (version?.content as any)?.jobDescription || 'Please refer to candidate resume details.',
        tone
      });
      if (res.data.success) {
        setSubject(res.data.data.subject || 'Cover Letter');
        setBody(res.data.data.body || '');
        setLetterSaveStatus('saved');
        setTimeout(() => setLetterSaveStatus('idle'), 2000);
        showToast('Success', 'Cover letter generated.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'Generation failed.', 'danger');
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Generate Cold Outreach LinkedIn message
  const handleGenerateOutreach = async () => {
    setGeneratingOutreach(true);
    try {
      const res = await generateOutreachMessage(versionId, {
        type: outreachType,
        recipientTitle
      });
      if (res.data.success) {
        setOutreachSubject(res.data.data.subject || '');
        setOutreachBody(res.data.data.body);
        showToast('Success', 'Outreach message generated.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'Failed to generate outreach template.', 'danger');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  // Auto-inject keywords
  const handleKeywordInject = async () => {
    if (selectedKeywords.length === 0) return;
    setInjecting(true);
    try {
      const res = await injectKeywordsForVersion(versionId, selectedKeywords);
      if (res.data.success) {
        setVersion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            atsScore: res.data.data.atsScore,
            content: res.data.data.content
          };
        });
        setSelectedKeywords([]);
        showToast('Success', 'Keywords successfully injected into resume HTML!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'Failed to inject keywords.', 'danger');
    } finally {
      setInjecting(false);
    }
  };

  // Submit interview answer
  const handleAnswerSubmit = async (qId: string, question: string) => {
    const ans = answers[qId];
    if (!ans || !ans.trim()) return;
    setSubmittingAnswerId(qId);

    try {
      const res = await submitInterviewAnswer(question, ans);
      if (res.data.success) {
        setFeedback(prev => ({
          ...prev,
          [qId]: res.data.data
        }));
        showToast('Success', 'Feedback received.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error', 'Failed to get feedback.', 'danger');
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  // Push version to Kanban board tracker
  const handlePushToKanban = async () => {
    if (!version) return;
    setPushStatus('pushing');
    try {
      const res = await createApplication({
        title: version.jobTitle || 'Tailored Role',
        company: version.company || 'Target Company',
        status: kanbanColumn,
        resumeVersionId: versionId,
        descriptionText: (version.content as any)?.jobDescription || ''
      });
      if (res.data.success) {
        setPushStatus('pushed');
        setVersion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            application: res.data.data
          };
        });
        showToast('Success', 'Successfully pushed to Kanban board!', 'success');
      }
    } catch (e) {
      console.error(e);
      setPushStatus('idle');
      showToast('Error', 'Failed to push to Kanban.', 'danger');
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
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#070709] gap-3">
        <Loader2 className="animate-spin text-gray-500" size={32} />
        <p className="text-gray-500 text-sm">Loading tailored workspace...</p>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-[#070709] gap-3 text-center p-4">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-white text-sm font-semibold">Workspace Not Found</p>
        <Link href="/dashboard/resumes" className="text-gray-500 hover:text-white transition-colors text-xs flex items-center gap-1">
          <ArrowLeft size={12} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const cvHtml = version.content?.htmlContent || '';

  // Inject professional styles into the tailored CV HTML document
  let bodyContent = cvHtml;
  if (cvHtml.includes('<body')) {
    const match = cvHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match) bodyContent = match[1];
  }

  const styledCvHtml = `
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

  // Extract matched and missing keywords from version content
  const contentJSON = version.content as any;
  const matchedKeywords: string[] = contentJSON?.matchedKeywords || contentJSON?.keywordsInserted || [];
  const missingKeywords: string[] = contentJSON?.missingKeywords || [];

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-8 overflow-hidden bg-[#070709]">
      
      {/* ─── LEFT COLUMN: Metadata & Sidebar Workspace navigation ─── */}
      <aside className="w-80 border-r border-[#1a1a24] bg-[#0c0c10] p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <Link href="/dashboard/resumes" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors font-medium">
            <ArrowLeft size={13} /> Back to Resumes
          </Link>

          <div>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Workspace Mode
            </span>
            <h1 className="text-white font-bold text-base mt-3 leading-tight truncate">{version.jobTitle}</h1>
            <p className="text-gray-400 text-xs mt-1">{version.company}</p>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="space-y-1.5 pt-4 border-t border-[#1a1a24]">
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Workspace Tools</p>
            <div className="space-y-1">
              {[
                { id: 'cv' as const, label: 'Tailored CV', icon: FileText },
                { id: 'letter' as const, label: 'Cover Letter', icon: Mail },
                { id: 'keywords' as const, label: 'ATS Keyword Check', icon: Sparkles },
                { id: 'interview' as const, label: 'AI Mock Interview', icon: Flame },
                { id: 'salary' as const, label: 'Salary Insights', icon: Award },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-white text-black shadow-md' 
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {version.atsScore != null && (
            <div className="bg-[#111116] border border-[#1e1e26] rounded-xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full border-2 border-green-500/35 flex items-center justify-center bg-green-500/5 text-green-400 font-bold text-sm">
                {version.atsScore}%
              </div>
              <div>
                <p className="text-white text-xs font-semibold">ATS Match Score</p>
                <p className="text-gray-500 text-[10px] mt-0.5">Optimized with core keywords</p>
              </div>
            </div>
          )}

          {/* Kanban Tracking status panel */}
          <div className="bg-[#111116] border border-[#1e1e26] rounded-xl p-4 space-y-3">
            <h4 className="text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-indigo-400" /> Pipeline Tracker
            </h4>
            {version.application ? (
              <div className="space-y-2">
                <span className="inline-block text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold uppercase">
                  Tracked: {version.application.status}
                </span>
                <Link href="/dashboard/tracker" className="text-gray-400 hover:text-white text-[10px] block font-semibold transition-colors underline flex items-center gap-0.5">
                  Go to Tracker Board <ExternalLink size={10} />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <select 
                  value={kanbanColumn}
                  onChange={e => setKanbanColumn(e.target.value)}
                  className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-lg px-2 py-1 text-white text-[10px] focus:outline-none"
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offers">Offers</option>
                </select>
                <button
                  onClick={handlePushToKanban}
                  disabled={pushStatus === 'pushing'}
                  className="w-full text-center text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white py-1.5 rounded-lg transition-colors"
                >
                  {pushStatus === 'pushing' ? 'Pushing...' : 'Push to Kanban Board'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Export panel context actions */}
        <div className="space-y-2 pt-4 border-t border-[#1a1a24]">
          {activeTab === 'cv' ? (
            <button
              onClick={handleExportCV}
              disabled={!cvHtml}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-150 font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
            >
              <Download size={13} /> Export CV PDF
            </button>
          ) : activeTab === 'letter' ? (
            <div className="space-y-2">
              <button
                onClick={handleSaveCoverLetter}
                disabled={savingLetter}
                className="w-full flex items-center justify-center gap-2 bg-[#121218] border border-[#1e1e26] hover:border-white/20 text-white font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
              >
                <Save size={13} /> Save Cover Letter Draft
              </button>
              <button
                onClick={handleExportCoverLetter}
                disabled={!body}
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-150 font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
              >
                <FileText size={13} /> Export Cover Letter (.txt)
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ─── DYNAMIC MAIN AREA: Switchable tab screens ─── */}
      <div className="flex-1 flex flex-col bg-[#08080a]">
        
        {activeTab === 'cv' && (
          /* ─── TAB 1: TAILORED CV LIVE PREVIEW ─── */
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-[#1a1a24] flex items-center justify-between bg-[#0c0c10]/40">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-violet-400" />
                <h2 className="text-white text-xs font-semibold uppercase tracking-wider font-bold">Tailored CV Live Preview</h2>
              </div>
              <button
                onClick={handleExportCV}
                disabled={!cvHtml}
                className="flex items-center gap-1.5 bg-[#121218] border border-[#1e1e26] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-white/25 transition-all"
              >
                <Download size={12} /> Download PDF
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-[#070709] flex items-center justify-center">
              {cvHtml ? (
                <CVPreviewFrame html={styledCvHtml} />
              ) : (
                <div className="w-full max-w-md aspect-video flex flex-col items-center justify-center border border-[#1a1a24] border-dashed rounded-xl bg-white/[0.02] p-6 text-center animate-fade-in">
                  <FileText className="text-gray-700 mb-2" size={28} />
                  <h3 className="text-white text-sm font-semibold">No tailored CV content generated</h3>
                  <p className="text-gray-500 text-xs mt-1">Please try tailoring again or check your master resume.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'letter' && (
          /* ─── TAB 2: COVER LETTER & OUTREACH WORKSPACE ─── */
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-6 xl:p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full">
              
              {/* Cover Letter Section */}
              <div className="space-y-4 border-b border-[#1a1a24] pb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-indigo-400" />
                    <h2 className="text-white text-sm font-bold uppercase tracking-wider">Cover Letter Builder</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={tone}
                      onChange={e => setTone(e.target.value as any)}
                      className="bg-[#0c0c10] border border-[#1e1e26] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                    >
                      <option value="formal">Tone: Formal</option>
                      <option value="concise">Tone: Concise</option>
                    </select>
                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={generatingLetter}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {generatingLetter ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Re-Generate
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Email Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Application for Frontend Engineer position"
                      className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Letter Body</label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={8}
                      placeholder="Cover letter body text will appear here..."
                      className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors font-sans resize-none leading-relaxed"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveCoverLetter}
                      disabled={savingLetter}
                      className="bg-white text-black hover:bg-gray-150 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      {savingLetter ? 'Saving...' : 'Save Draft'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Outreach templates Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-violet-400" />
                    <h2 className="text-white text-sm font-bold uppercase tracking-wider">LinkedIn & Cold Outreach Generator</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Outreach Medium</label>
                    <select
                      value={outreachType}
                      onChange={e => setOutreachType(e.target.value as any)}
                      className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    >
                      <option value="linkedin_connection">LinkedIn Connection Request (300 char limits)</option>
                      <option value="linkedin_inmail">LinkedIn InMail</option>
                      <option value="cold_email">Cold Email outreach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Recipient Title</label>
                    <input 
                      type="text"
                      value={recipientTitle}
                      onChange={e => setRecipientTitle(e.target.value)}
                      placeholder="e.g. Engineering Manager, Technical Recruiter"
                      className="w-full bg-[#0c0c10] border border-[#1e1e26] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateOutreach}
                      disabled={generatingOutreach}
                      className="w-full bg-[#121216] border border-[#1e1e26] hover:border-white/20 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {generatingOutreach ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Generate Outreach Draft
                    </button>
                  </div>
                </div>

                {(outreachSubject || outreachBody) && (
                  <div className="bg-[#111116] border border-[#1e1e26] rounded-xl p-4 space-y-3 animate-fade-in">
                    {outreachSubject && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Email Subject</span>
                        <h4 className="text-white text-xs font-bold">{outreachSubject}</h4>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Outreach Draft Message</span>
                      <p className="text-zinc-300 text-xs font-sans whitespace-pre-wrap leading-relaxed bg-[#0a0a0c] border border-zinc-900 rounded-lg p-3">
                        {outreachBody}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(outreachBody);
                          showToast('Copied', 'Outreach body copied to clipboard!', 'success');
                        }}
                        className="bg-zinc-800 text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Clipboard size={12} /> Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          /* ─── TAB 3: ATS KEYWORDS gap CHECKLIST ─── */
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-6 xl:p-8 max-w-4xl mx-auto w-full space-y-6">
              <div>
                <h2 className="text-white text-lg font-bold">ATS Keyword Checklist</h2>
                <p className="text-gray-500 text-xs mt-1">
                  We parsed these keywords directly from the Job Description. Select missing keywords to inject them naturally inside your tailored resume.
                </p>
              </div>

              {/* Action Buttons panel */}
              {selectedKeywords.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                  <span className="text-indigo-300 text-xs font-medium">
                    {selectedKeywords.length} missing keywords selected for auto-injection.
                  </span>
                  <button
                    onClick={handleKeywordInject}
                    disabled={injecting}
                    className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    {injecting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Auto-Inject Selection
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Missing Keywords (Unchecked) */}
                <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-4">
                  <h3 className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <X size={15} /> Missing Keywords ({missingKeywords.length})
                  </h3>
                  {missingKeywords.length === 0 ? (
                    <p className="text-zinc-600 text-xs italic">All targeted keywords successfully included!</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                      {missingKeywords.map(keyword => {
                        const isSelected = selectedKeywords.includes(keyword);
                        return (
                          <label 
                            key={keyword}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-950/20 border-indigo-500/30 text-white' 
                                : 'bg-[#111116] border-[#1e1e26] text-zinc-400 hover:border-zinc-700/50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedKeywords(prev => 
                                  isSelected ? prev.filter(k => k !== keyword) : [...prev, keyword]
                                );
                              }}
                              className="accent-indigo-500 w-3.5 h-3.5"
                            />
                            <span className="truncate">{keyword}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Column 2: Matched Keywords (Checked) */}
                <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-4">
                  <h3 className="text-green-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Check size={15} /> Matched Keywords ({matchedKeywords.length})
                  </h3>
                  {matchedKeywords.length === 0 ? (
                    <p className="text-zinc-600 text-xs italic">No matched keywords found yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                      {matchedKeywords.map(keyword => (
                        <div 
                          key={keyword}
                          className="bg-[#111116] border border-[#1e1e26]/30 text-green-300 p-2 rounded-lg flex items-center gap-2 text-xs"
                        >
                          <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                          <span className="truncate">{keyword}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          /* ─── TAB 4: MOCK INTERVIEW SIMULATOR ─── */
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-6 xl:p-8 max-w-4xl mx-auto w-full space-y-6">
              <div>
                <h2 className="text-white text-lg font-bold">AI Mock Interview Simulator</h2>
                <p className="text-gray-500 text-xs mt-1">
                  Practice answers to highly tailored behavioral and technical questions compiled based on this JD and your tailored resume.
                </p>
              </div>

              {loadingInterview ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-gray-600" size={28} />
                  <p className="text-zinc-500 text-xs">AI is formulating custom interview questions...</p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {interviewQuestions.map((q, idx) => {
                    const fb = feedback[q.id];
                    const submitting = submittingAnswerId === q.id;

                    return (
                      <div key={q.id} className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                              {q.type}
                            </span>
                            <h4 className="text-white text-sm font-semibold mt-2">{idx + 1}. {q.question}</h4>
                          </div>
                          {fb && (
                            <div className="shrink-0 flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${fb.score >= 80 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {fb.score}/100
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Input answering panel */}
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            placeholder="Type your response here (use STAR method Situation-Task-Action-Result for behavioral prompts)..."
                            value={answers[q.id] || ''}
                            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full bg-[#111116] border border-[#1e1e26] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500/50 resize-none font-sans leading-relaxed"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleAnswerSubmit(q.id, q.question)}
                              disabled={submitting || !answers[q.id]?.trim()}
                              className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                            >
                              {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                              Submit Answer
                            </button>
                          </div>
                        </div>

                        {/* Feedback presentation */}
                        {fb && (
                          <div className="bg-[#111116] border border-zinc-900 rounded-xl p-4 space-y-3 animate-fade-in">
                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <StickyNote size={12} /> Recruiter Feedback
                              </span>
                              <p className="text-zinc-300 text-xs font-sans leading-relaxed">{fb.feedback}</p>
                            </div>
                            <div className="space-y-1 border-t border-zinc-900 pt-3">
                              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={12} /> Suggested Exemplary Response (STAR Method)
                              </span>
                              <p className="text-zinc-300 text-xs font-sans leading-relaxed italic bg-black/30 border border-green-500/[0.03] rounded-lg p-3.5">
                                {fb.suggestedAnswer}
                              </p>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'salary' && (
          /* ─── TAB 5: SALARY INSIGHTS & COMPENSATION ─── */
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <div className="p-6 xl:p-8 max-w-4xl mx-auto w-full space-y-6">
              <div>
                <h2 className="text-white text-lg font-bold">Market Salary Insights & Negotiation</h2>
                <p className="text-gray-500 text-xs mt-1">
                  AI estimates based on skills found in the Job Description, along with customized scripts to negotiate salary offers.
                </p>
              </div>

              {loadingSalary ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-gray-600" size={28} />
                  <p className="text-zinc-500 text-xs">Analyzing compensation metrics...</p>
                </div>
              ) : salaryData ? (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Bracket Card */}
                  <div className="bg-[#09110d]/40 border border-green-950/30 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Estimated Market Salary Bracket</h4>
                      <p className="text-green-400 text-xl font-bold mt-1.5">{salaryData.estimatedBrackets}</p>
                    </div>
                    <Award size={32} className="text-green-400 opacity-60" />
                  </div>

                  {/* Leverage Factors */}
                  <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Your Key Bargaining Chips / Skills</h4>
                    <ul className="space-y-2">
                      {salaryData.leverageFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-zinc-300 text-xs font-medium">
                          <Check size={14} className="text-green-400 shrink-0 mt-0.5" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Scripts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Email Script */}
                    <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-3 flex flex-col">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Salary Negotiation Email Template</h4>
                      <p className="text-[11px] text-zinc-500">Perfect to draft in response to a written salary offer.</p>
                      <textarea
                        readOnly
                        rows={8}
                        value={salaryData.emailScript}
                        className="flex-1 w-full bg-[#111116] border border-[#1e1e26]/50 rounded-xl p-3 text-zinc-300 text-xs focus:outline-none resize-none font-sans leading-relaxed"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(salaryData.emailScript);
                          showToast('Copied', 'Email script copied!', 'success');
                        }}
                        className="bg-zinc-800 hover:text-white text-zinc-200 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
                      >
                        <Clipboard size={12} /> Copy Email Script
                      </button>
                    </div>

                    {/* Live discussion Script */}
                    <div className="bg-[#0c0c10] border border-[#1e1e26] rounded-2xl p-5 space-y-3 flex flex-col">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Live discussion talking points</h4>
                      <p className="text-[11px] text-zinc-500">Key talking points for phone discussions with HR.</p>
                      <textarea
                        readOnly
                        rows={8}
                        value={salaryData.liveScript}
                        className="flex-1 w-full bg-[#111116] border border-[#1e1e26]/50 rounded-xl p-3 text-zinc-300 text-xs focus:outline-none resize-none font-sans leading-relaxed"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(salaryData.liveScript);
                          showToast('Copied', 'Discussion script copied!', 'success');
                        }}
                        className="bg-zinc-800 hover:text-white text-zinc-200 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
                      >
                        <Clipboard size={12} /> Copy Talking Points
                      </button>
                    </div>

                  </div>

                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>

    </div>
  );
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
          className="bg-white border border-zinc-850 rounded-xl shadow-2xl overflow-hidden"
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
