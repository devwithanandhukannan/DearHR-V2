'use client';

import { useEffect, useState } from 'react';
import {
  User, MapPin, Briefcase, Code, Award, Plus, Save, Upload, X, Trash2,
  Link as LinkIcon, GraduationCap, CheckCircle2, Loader2, FileText, Mail, KeyRound
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { getSmtpConfig, saveSmtpConfig, type SmtpConfig } from '@/app/lib/resumeApi';

export default function ProfilePage() {
  const { showToast } = useGlassToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    fullName: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '', bio: '',
  });

  const [preferences, setPreferences] = useState({
    roles: [] as string[], industries: [] as string[],
    jobType: '', experience: '', expectedSalary: '', workLocationPreference: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [education, setEducation] = useState([{
    id: 1, institution: '', degree: '', field: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '', cgpa: '', description: '',
  }]);

  const [experience, setExperience] = useState([{
    id: 1, company: '', role: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '',
    current: false, description: '', skills: [] as string[],
  }]);

  const [projects, setProjects] = useState([{
    id: 1, name: '', description: '', technologies: [] as string[],
    githubLink: '', liveLink: '', startDate: '', endDate: '',
  }]);

  const [certifications, setCertifications] = useState([{
    id: 1, name: '', organization: '', issueDate: '', credentialUrl: '',
  }]);

  const [languages, setLanguages] = useState([{
    id: 1, language: '', proficiency: 'Beginner',
  }]);

  const [achievements, setAchievements] = useState([{
    id: 1, title: '', description: '', year: '',
  }]);

  const tabs = [
    { id: 'basic',          label: 'Basic Info',      icon: User },
    { id: 'preferences',    label: 'Job Preferences', icon: Briefcase },
    { id: 'skills',         label: 'Skills',          icon: Code },
    { id: 'experience',     label: 'Experience',      icon: Briefcase },
    { id: 'projects',       label: 'Projects',        icon: Code },
    { id: 'education',      label: 'Education',       icon: GraduationCap },
    { id: 'certifications', label: 'Certifications',  icon: Award },
    { id: 'languages',      label: 'Languages',       icon: CheckCircle2 },
    { id: 'achievements',   label: 'Achievements',    icon: Award },
    { id: 'smtp',           label: 'Mail Settings',   icon: Mail },
  ];

  const updateEducation     = (id: number, field: string, value: any) => setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  const updateExperience    = (id: number, field: string, value: any) => setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  const updateProject       = (id: number, field: string, value: any) => setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const updateCertification = (id: number, field: string, value: any) => setCertifications(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  const updateLanguage      = (id: number, field: string, value: any) => setLanguages(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  const updateAchievement   = (id: number, field: string, value: any) => setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get('/jobseeker/profile');
        const profileData = response.data.success ? response.data.data : response.data;
        setBasicInfo({
          fullName:  profileData.fullName  || '',
          email:     profileData.email     || '',
          phone:     profileData.phone     || '',
          location:  profileData.location  || '',
          linkedin:  profileData.linkedin  || '',
          github:    profileData.github    || '',
          portfolio: profileData.portfolio || '',
          bio:       profileData.bio       || '',
        });
        setProfileImage(profileData.profilePic || null);
        setPreferences({
          roles:                  profileData.preferences?.roles                  || [],
          industries:             profileData.preferences?.industries             || [],
          jobType:                profileData.preferences?.jobType                || '',
          experience:             profileData.preferences?.experience             || '',
          expectedSalary:         profileData.preferences?.expectedSalary         || '',
          workLocationPreference: profileData.preferences?.workLocationPreference || '',
        });
        setSkills(profileData.skills || []);
        if (profileData.education?.length > 0)      setEducation(profileData.education);
        if (profileData.experience?.length > 0)     setExperience(profileData.experience);
        if (profileData.projects?.length > 0)       setProjects(profileData.projects);
        if (profileData.certifications?.length > 0) setCertifications(profileData.certifications);
        if (profileData.languages?.length > 0)      setLanguages(profileData.languages);
        if (profileData.achievements?.length > 0)   setAchievements(profileData.achievements);
      } catch (error: any) {
        showToast('Error', error.response?.data?.error || 'Failed to load profile', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
      setProfileImageFile(file);
    }
  };

  const removePhoto = () => { setProfileImage(null); setProfileImageFile(null); };

  // ── Resume parse & auto-fill ──────────────────────────────────────────
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await api.post('/jobseeker/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.success) {
        const d = response.data.data;
        setBasicInfo(d.basicInfo);
        setSkills(d.skills);
        if (d.education?.length > 0)      setEducation(d.education);
        if (d.experience?.length > 0)     setExperience(d.experience);
        if (d.projects?.length > 0)       setProjects(d.projects);
        if (d.certifications?.length > 0) setCertifications(d.certifications);
        if (d.languages?.length > 0)      setLanguages(d.languages);
        if (d.achievements?.length > 0)   setAchievements(d.achievements);
        showToast('Success', 'Resume imported! Review the fields then click Save.', 'success');
        setActiveTab('basic');
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.error || 'Failed to parse resume', 'danger');
    } finally {
      setParsing(false);
      e.target.value = '';
    }
  };

  const addSkill    = () => { if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(''); } };
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));

  const addEducation     = () => setEducation([...education,     { id: Date.now(), institution: '', degree: '', field: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', cgpa: '', description: '' }]);
  const removeEducation  = (id: number) => setEducation(education.filter(e => e.id !== id));
  const addExperience    = () => setExperience([...experience,   { id: Date.now(), company: '', role: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', current: false, description: '', skills: [] }]);
  const removeExperience = (id: number) => setExperience(experience.filter(e => e.id !== id));
  const addProject       = () => setProjects([...projects,       { id: Date.now(), name: '', description: '', technologies: [], githubLink: '', liveLink: '', startDate: '', endDate: '' }]);
  const removeProject    = (id: number) => setProjects(projects.filter(p => p.id !== id));
  const addCertification    = () => setCertifications([...certifications, { id: Date.now(), name: '', organization: '', issueDate: '', credentialUrl: '' }]);
  const removeCertification = (id: number) => setCertifications(certifications.filter(c => c.id !== id));
  const addLanguage    = () => setLanguages([...languages,       { id: Date.now(), language: '', proficiency: 'Beginner' }]);
  const removeLanguage = (id: number) => setLanguages(languages.filter(l => l.id !== id));
  const addAchievement    = () => setAchievements([...achievements, { id: Date.now(), title: '', description: '', year: '' }]);
  const removeAchievement = (id: number) => setAchievements(achievements.filter(a => a.id !== id));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const profileData = {
        fullName:  basicInfo.fullName,
        email:     basicInfo.email,
        phone:     basicInfo.phone,
        location:  basicInfo.location,
        linkedin:  basicInfo.linkedin,
        github:    basicInfo.github,
        portfolio: basicInfo.portfolio,
        bio:       basicInfo.bio,
        profilePic: profileImage,
        preferences: {
          roles:                  preferences.roles.map(r => r.trim()).filter(Boolean),
          industries:             preferences.industries.map(i => i.trim()).filter(Boolean),
          jobType:                preferences.jobType,
          experience:             preferences.experience,
          expectedSalary:         preferences.expectedSalary,
          workLocationPreference: preferences.workLocationPreference,
        },
        skills, 
        education, 
        experience: experience.map(exp => ({ ...exp, skills: exp.skills.map(s => s.trim()).filter(Boolean) })), 
        projects: projects.map(proj => ({ ...proj, technologies: proj.technologies.map(t => t.trim()).filter(Boolean) })), 
        certifications, 
        languages, 
        achievements,
      };
      const formData = new FormData();
      formData.append('profileData', JSON.stringify(profileData));
      if (profileImageFile) formData.append('profileImage', profileImageFile);
      const response = await api.put('/jobseeker/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.success) showToast('Success', 'Profile saved successfully!', 'success');
    } catch (error: any) {
      showToast('Error', error.response?.data?.error || error.response?.data?.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years  = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        <div className="text-zinc-400 text-xs font-medium tracking-wide">Loading your workspace...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Professional Workspace</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Configure your dynamic profile summary and application rules.</p>
        </div>
        <div className="flex items-center gap-2">

          {/* Import from CV */}
          <label className={`flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer select-none ${parsing ? 'opacity-50 pointer-events-none' : ''}`}>
            {parsing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileText className="w-3.5 h-3.5" />
            }
            <span>{parsing ? 'Parsing CV...' : 'Import from CV'}</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={parsing} />
          </label>

          {/* Save */}
          <button onClick={handleSaveAll} disabled={saving}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-xs font-semibold">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Syncing...' : 'Save Workspace'}</span>
          </button>
        </div>
      </div>

      {/* Parsing overlay banner */}
      {parsing && (
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
          <div>
            <p className="text-zinc-200 text-xs font-semibold">Parsing your CV with AI...</p>
            <p className="text-zinc-500 text-[11px] mt-0.5">Extracting text then sending to Groq. This takes 5–10 seconds.</p>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

        {/* Left Tab Nav */}
        <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-1.5 md:sticky md:top-4">
          <nav className="flex flex-row md:flex-col gap-0.5 overflow-x-auto md:overflow-x-visible scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left whitespace-nowrap text-xs font-medium w-full ${
                    isSelected ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}>
                  <Icon size={14} className={isSelected ? 'text-zinc-950' : 'text-zinc-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel */}
        <div className="md:col-span-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm min-h-[480px]">

          {/* ── BASIC INFO ── */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in-40 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-zinc-800/60">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                    {profileImage
                      ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={24} className="text-zinc-600" />
                    }
                  </div>
                  <label className="absolute -bottom-1.5 -right-1.5 bg-zinc-100 text-zinc-950 p-1 rounded-md cursor-pointer hover:bg-zinc-200 transition-colors shadow">
                    <Upload size={12} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <div>
                  <h3 className="text-zinc-200 text-xs font-semibold">Avatar Presentation</h3>
                  <p className="text-zinc-500 text-[11px] mt-0.5">Square or circular canvas formats up to 4MB.</p>
                  {profileImage && (
                    <button onClick={removePhoto} className="text-rose-400 text-[11px] font-medium hover:underline mt-1 block">Purge Image</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Full Name *</label>
                  <input type="text" value={basicInfo.fullName} onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })} placeholder="John Doe" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Email Address *</label>
                  <input type="email" value={basicInfo.email} onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })} placeholder="john@example.com" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Phone Network</label>
                  <input type="tel" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Geographic Location *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="text" value={basicInfo.location} onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })} placeholder="San Francisco, CA" className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">LinkedIn Endpoint</label>
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="url" value={basicInfo.linkedin} onChange={e => setBasicInfo({ ...basicInfo, linkedin: e.target.value })} placeholder="linkedin.com/in/username" className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">GitHub Repository</label>
                  <div className="relative">
                    <Code size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="url" value={basicInfo.github} onChange={e => setBasicInfo({ ...basicInfo, github: e.target.value })} placeholder="github.com/username" className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Personal Portfolio</label>
                  <div className="relative">
                    <LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="url" value={basicInfo.portfolio} onChange={e => setBasicInfo({ ...basicInfo, portfolio: e.target.value })} placeholder="yourportfolio.com" className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Executive Summary</label>
                  <textarea value={basicInfo.bio} onChange={e => setBasicInfo({ ...basicInfo, bio: e.target.value })} placeholder="Brief outline detailing technical focus vectors..." rows={3} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700 resize-none leading-relaxed" />
                </div>
              </div>
            </div>
          )}

          {/* ── JOB PREFERENCES ── */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Job Preference Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Target Roles</label>
                  <input type="text" placeholder="Software Engineer, Product Manager" value={preferences.roles.join(',')} onChange={e => setPreferences({ ...preferences, roles: e.target.value.split(',') })} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  <p className="text-zinc-600 text-[10px] mt-1">Split items via comma separations.</p>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Preferred Industries</label>
                  <input type="text" placeholder="Technology, Healthcare, Finance" value={preferences.industries.join(',')} onChange={e => setPreferences({ ...preferences, industries: e.target.value.split(',') })} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Contract Architecture</label>
                  <select value={preferences.jobType} onChange={e => setPreferences({ ...preferences, jobType: e.target.value })} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs">
                    <option value="">Select allocation layout</option>
                    <option value="full-time">Full-time Layout</option>
                    <option value="part-time">Part-time Layout</option>
                    <option value="contract">Third-Party Contract</option>
                    <option value="freelance">Freelance Retainer</option>
                    <option value="internship">Educational Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Seniority Context</label>
                  <select value={preferences.experience} onChange={e => setPreferences({ ...preferences, experience: e.target.value })} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs">
                    <option value="">Select track range</option>
                    <option value="entry">Associate Level (0-2 YOE)</option>
                    <option value="mid">Mid Level Track (2-5 YOE)</option>
                    <option value="senior">Senior Track (5-10 YOE)</option>
                    <option value="lead">Principal Framework (10+ YOE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Expected Compensation</label>
                  <input type="text" placeholder="e.g., $100,000 - $150,000" value={preferences.expectedSalary} onChange={e => setPreferences({ ...preferences, expectedSalary: e.target.value })} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Location Matrix Rule</label>
                  <select value={preferences.workLocationPreference} onChange={e => setPreferences({ ...preferences, workLocationPreference: e.target.value })} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs">
                    <option value="">Select operational policy</option>
                    <option value="remote">Fully Remote Distributed</option>
                    <option value="onsite">On-Site Office Boundary</option>
                    <option value="hybrid">Hybrid Split Routine</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── SKILLS ── */}
          {activeTab === 'skills' && (
            <div className="space-y-5 animate-in fade-in-40 duration-200">
              <h2 className="text-sm font-semibold text-zinc-200">Skill Inventory Engine</h2>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                <label className="block text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-1.5">Append Core Competency</label>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Type skill term (e.g. TypeScript)..." className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700" />
                  <button onClick={addSkill} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg transition-colors text-xs font-semibold">Append</button>
                </div>
              </div>
              {skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-zinc-400 text-[11px] font-semibold tracking-wide uppercase">Active Registers ({skills.length})</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, index) => (
                      <div key={index} className="bg-zinc-950 border border-zinc-800 pl-2.5 pr-1.5 py-1 rounded-md flex items-center gap-1.5 text-xs text-zinc-300">
                        <span>{skill}</span>
                        <button onClick={() => removeSkill(index)} className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPERIENCE ── */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Work Experience Registers</h2>
                <button onClick={addExperience} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Block</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {experience.map((exp, index) => (
                  <div key={exp.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-zinc-400 font-mono rounded">POSITION #{index + 1}</span>
                      {experience.length > 1 && <button onClick={() => removeExperience(exp.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Corporate Entity *</label><input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company Name" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Functional Assignment Title *</label><input type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="e.g. Senior Developer" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Geographic Bounds</label><input type="text" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div className="flex items-center gap-2 pt-5"><input type="checkbox" id={`current-${exp.id}`} checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-0" /><label htmlFor={`current-${exp.id}`} className="text-zinc-400 text-xs select-none">Active Operational Tenancy</label></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Commencement *</label><div className="grid grid-cols-2 gap-2"><select value={exp.startMonth} onChange={e => updateExperience(exp.id, 'startMonth', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.startYear} onChange={e => updateExperience(exp.id, 'startYear', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Termination Sequence</label><div className="grid grid-cols-2 gap-2"><select value={exp.endMonth} onChange={e => updateExperience(exp.id, 'endMonth', e.target.value)} disabled={exp.current} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 disabled:opacity-35"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.endYear} onChange={e => updateExperience(exp.id, 'endYear', e.target.value)} disabled={exp.current} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 disabled:opacity-35"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Scope Manifest & Performance Metrics</label><textarea value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe core execution metrics..." rows={3} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 resize-none leading-relaxed" /></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Applied Tech Vector Array</label><input type="text" value={exp.skills.join(',')} onChange={e => updateExperience(exp.id, 'skills', e.target.value.split(','))} placeholder="React, Node.js (comma separated)" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROJECTS ── */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Project Registries</h2>
                <button onClick={addProject} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Index</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {projects.map((proj, index) => (
                  <div key={proj.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-zinc-400 font-mono rounded">PROJECT #{index + 1}</span>
                      {projects.length > 1 && <button onClick={() => removeProject(proj.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Project Identifier *</label><input type="text" value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="e.g. Distributed Ledger Platform" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Architecture Summary *</label><textarea value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} placeholder="Explain project runtime patterns..." rows={3} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 resize-none leading-relaxed" /></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Engine & Platform Context</label><input type="text" value={proj.technologies.join(',')} onChange={e => updateProject(proj.id, 'technologies', e.target.value.split(','))} placeholder="Next.js, Go, Redis (comma separated)" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Source Repository URI</label><div className="relative"><Code size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" /><input type="url" value={proj.githubLink} onChange={e => updateProject(proj.id, 'githubLink', e.target.value)} placeholder="https://github.com/..." className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Production Endpoint Link</label><div className="relative"><LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" /><input type="url" value={proj.liveLink} onChange={e => updateProject(proj.id, 'liveLink', e.target.value)} placeholder="https://..." className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EDUCATION ── */}
          {activeTab === 'education' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Academic Background Matrix</h2>
                <button onClick={addEducation} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Node</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {education.map((edu, index) => (
                  <div key={edu.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-zinc-400 font-mono rounded">ACADEMIC #{index + 1}</span>
                      {education.length > 1 && <button onClick={() => removeEducation(edu.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Institution Body *</label><input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} placeholder="University Name" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Degree Class *</label><input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.S. / M.S. / Ph.D." className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Department Specialization *</label><input type="text" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} placeholder="Computer Science" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Campus Boundaries</label><input type="text" value={edu.location} onChange={e => updateEducation(edu.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Inception *</label><div className="grid grid-cols-2 gap-2"><select value={edu.startMonth} onChange={e => updateEducation(edu.id, 'startMonth', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.startYear} onChange={e => updateEducation(edu.id, 'startYear', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Concurrence Conclusion *</label><div className="grid grid-cols-2 gap-2"><select value={edu.endMonth} onChange={e => updateEducation(edu.id, 'endMonth', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.endYear} onChange={e => updateEducation(edu.id, 'endYear', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Performance Scale / CGPA</label><input type="text" value={edu.cgpa} onChange={e => updateEducation(edu.id, 'cgpa', e.target.value)} placeholder="e.g. 3.8/4.0" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Coursework Focus Elements</label><textarea value={edu.description} onChange={e => updateEducation(edu.id, 'description', e.target.value)} placeholder="Research tracks, thesis definitions..." rows={3} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 resize-none leading-relaxed" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CERTIFICATIONS ── */}
          {activeTab === 'certifications' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Authority Endorsement Logs</h2>
                <button onClick={addCertification} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Token</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {certifications.map((cert, index) => (
                  <div key={cert.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-zinc-400 font-mono rounded">TOKEN #{index + 1}</span>
                      {certifications.length > 1 && <button onClick={() => removeCertification(cert.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Credential Name *</label><input type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="AWS Certified Architect" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Issuing Body *</label><input type="text" value={cert.organization} onChange={e => updateCertification(cert.id, 'organization', e.target.value)} placeholder="Amazon Web Services" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Validation Issue Date</label><input type="month" value={cert.issueDate} onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-zinc-500" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Verification URL Anchor</label><div className="relative"><LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" /><input type="url" value={cert.credentialUrl} onChange={e => updateCertification(cert.id, 'credentialUrl', e.target.value)} placeholder="https://..." className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LANGUAGES ── */}
          {activeTab === 'languages' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Linguistic Framework</h2>
                <button onClick={addLanguage} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Language</span></button>
              </div>
              <div className="space-y-3">
                {languages.map((lang) => (
                  <div key={lang.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Language Identity *</label>
                        <input type="text" value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)} placeholder="English, Spanish..." className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Fluency Level *</label>
                        <select value={lang.proficiency} onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500">
                          <option value="Beginner">Elementary Break</option>
                          <option value="Intermediate">Working Context</option>
                          <option value="Advanced">Advanced Architecture</option>
                          <option value="Fluent">Full Fluency</option>
                          <option value="Native">Native Scale</option>
                        </select>
                      </div>
                    </div>
                    {languages.length > 1 && (
                      <div className="flex items-center justify-end pt-4 sm:pt-5">
                        <button onClick={() => removeLanguage(lang.id)} className="text-zinc-600 hover:text-rose-400 transition-colors p-2 bg-zinc-950/50 border border-zinc-800 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h2 className="text-sm font-semibold text-zinc-200">Performance Distinctions & Awards</h2>
                <button onClick={addAchievement} className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium"><Plus size={12} /><span>Add Flag</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {achievements.map((ach, index) => (
                  <div key={ach.id} className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-zinc-400 font-mono rounded">AWARD #{index + 1}</span>
                      {achievements.length > 1 && <button onClick={() => removeAchievement(ach.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Honor Presentation Title *</label><input type="text" value={ach.title} onChange={e => updateAchievement(ach.id, 'title', e.target.value)} placeholder="e.g. Hackathon First Place" className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Context Manifest</label><textarea value={ach.description} onChange={e => updateAchievement(ach.id, 'description', e.target.value)} placeholder="Describe criteria parameters..." rows={3} className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 resize-none leading-relaxed" /></div>
                      <div><label className="block text-zinc-400 text-[11px] font-medium mb-1.5">Presentation Calendar Year *</label><select value={ach.year} onChange={e => updateAchievement(ach.id, 'year', e.target.value)} className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"><option value="">Select year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SMTP SETTINGS ── */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <SmtpSettingsForm showToast={showToast} />
              <ExtensionTokenCard showToast={showToast} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SmtpSettingsForm({ showToast }: { showToast: any }) {
  const [config, setConfig] = useState<SmtpConfig>({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSmtp = async () => {
      try {
        const res = await getSmtpConfig();
        if (res.data.success) {
          setConfig(res.data.data);
        }
      } catch {
        showToast('Error', 'Failed to load SMTP settings', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchSmtp();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser) {
      showToast('Validation Error', 'Host, Port, and User are required', 'danger');
      return;
    }
    setSaving(true);
    try {
      const res = await saveSmtpConfig(config);
      if (res.data.success) {
        showToast('Success', 'SMTP settings updated successfully', 'success');
        setConfig(prev => ({ ...prev, smtpPass: '••••••••', hasPassword: true }));
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to save SMTP settings', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in-40 duration-200">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">SMTP Configurations</h2>
        <p className="text-zinc-500 text-[11px] mt-0.5">SMTP credentials are used to dispatch tailored applications from your personal email client.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">SMTP Host / Server *</label>
          <input type="text" value={config.smtpHost} onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
            placeholder="smtp.gmail.com" required
            className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 text-xs placeholder-zinc-700" />
        </div>
        <div>
          <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">SMTP Port *</label>
          <input type="text" value={config.smtpPort} onChange={e => setConfig({ ...config, smtpPort: e.target.value })}
            placeholder="587" required
            className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 text-xs placeholder-zinc-700" />
        </div>
        <div>
          <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">SMTP User / Username *</label>
          <input type="text" value={config.smtpUser} onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
            placeholder="user@example.com" required
            className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 text-xs placeholder-zinc-700" />
        </div>
        <div>
          <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">SMTP Password *</label>
          <input type="password" value={config.smtpPass || ''}
            onChange={e => setConfig({ ...config, smtpPass: e.target.value })}
            placeholder={config.hasPassword ? '••••••••' : 'Enter SMTP password'}
            className="w-full px-3 py-1.5 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 text-zinc-200 text-xs placeholder-zinc-700" />
        </div>
      </div>

      <div className="flex justify-end border-t border-zinc-800/60 pt-4">
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save SMTP Settings
        </button>
      </div>
    </form>
  );
}

function ExtensionTokenCard({ showToast }: { showToast: any }) {
  const [copied, setCopied] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    showToast('Copied', 'Extension authentication token copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-zinc-950/20 border border-zinc-800 rounded-xl p-5 space-y-4 animate-in fade-in-40 duration-200">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <KeyRound size={15} className="text-indigo-400" /> Chrome Extension Integration
        </h2>
        <p className="text-zinc-500 text-[11px] mt-0.5">Use this token to authenticate the DearHR Job Description Capture Chrome Extension.</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="password"
          readOnly
          value={token || 'No token found (please log in again)'}
          className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 text-xs focus:outline-none select-all"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!token}
          className="bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Token'}
        </button>
      </div>
    </div>
  );
}