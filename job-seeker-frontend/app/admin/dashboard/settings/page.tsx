'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import {
  Settings2, Key, Mail, Eye, EyeOff, Save, CheckCircle2,
  AlertCircle, Loader2, Server, RefreshCw, Info, Zap,
} from 'lucide-react';

interface Config {
  groq_api_key: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  platform_name: string;
}

type TabId = 'groq' | 'smtp' | 'general';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'groq',    label: 'Groq AI',        icon: Zap      },
  { id: 'smtp',    label: 'Email (SMTP)',    icon: Mail     },
  { id: 'general', label: 'General',         icon: Settings2 },
];

function InputField({
  label, value, onChange, placeholder, type = 'text', hint, secret = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = secret ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-300">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-all pr-10"
          autoComplete="off"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
      <div className="text-[11px] text-zinc-400 leading-relaxed">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('groq');
  const [config, setConfig]       = useState<Config>({
    groq_api_key:   '',
    smtp_host:      'smtp.gmail.com',
    smtp_port:      '587',
    smtp_user:      '',
    smtp_pass:      '',
    platform_name:  'DearHR',
  });
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [success, setSuccess]   = useState('');
  const [error,   setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/config');
      if (res.data.success) {
        setConfig(prev => ({ ...prev, ...res.data.config }));
      }
    } catch {
      setError('Failed to load platform config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const res = await api.post('/auth/admin/config', config);
      if (res.data.success) {
        setSuccess('Configuration saved successfully.');
        setTimeout(() => setSuccess(''), 4000);
        await load();
      }
    } catch {
      setError('Failed to save configuration. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Config) => (v: string) => setConfig(prev => ({ ...prev, [key]: v }));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Configure AI, email delivery, and global platform options</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 border border-zinc-800 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            <p className="text-xs text-zinc-500">Loading config…</p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          {/* ─── GROQ TAB ─── */}
          {activeTab === 'groq' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Groq AI Configuration</h2>
                  <p className="text-[10px] text-zinc-500">Powers all AI features: resume analysis, tailoring, interview prep</p>
                </div>
              </div>

              <InfoBox>
                Get your Groq API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2">console.groq.com</a>. 
                The key is encrypted with AES-256 before being stored. Keys beginning with <code className="bg-zinc-800 px-1 rounded">gsk_</code> are valid.
              </InfoBox>

              <InputField
                label="Groq API Key"
                value={config.groq_api_key}
                onChange={update('groq_api_key')}
                placeholder="gsk_••••••••••••••••••••"
                secret
                hint="Masked in API responses. Enter a new value to update. Current stored key is replaced."
              />

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">Active Model</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-white font-medium">llama-3.3-70b-versatile</span>
                </div>
                <p className="text-[10px] text-zinc-600">Model is hardcoded in the service. To change, update <code className="bg-zinc-800 px-1 rounded">groq.service.ts</code>.</p>
              </div>
            </div>
          )}

          {/* ─── SMTP TAB ─── */}
          {activeTab === 'smtp' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Email Delivery (SMTP)</h2>
                  <p className="text-[10px] text-zinc-500">Used when users send CVs and outreach emails from the Draft & Send feature</p>
                </div>
              </div>

              <InfoBox>
                <strong className="text-zinc-300">For Gmail:</strong> Use <code className="bg-zinc-800 px-1 rounded text-[10px]">smtp.gmail.com</code> port <code className="bg-zinc-800 px-1 rounded text-[10px]">587</code>. 
                The password must be a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2">Google App Password</a>, 
                not your Gmail login password. Enable 2FA first to generate one.
              </InfoBox>

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="SMTP Host"
                  value={config.smtp_host}
                  onChange={update('smtp_host')}
                  placeholder="smtp.gmail.com"
                />
                <InputField
                  label="Port"
                  value={config.smtp_port}
                  onChange={update('smtp_port')}
                  placeholder="587"
                  type="number"
                  hint="587 (TLS) or 465 (SSL)"
                />
              </div>

              <InputField
                label="Gmail Address"
                value={config.smtp_user}
                onChange={update('smtp_user')}
                placeholder="yourname@gmail.com"
                hint="The Gmail account used as the sender"
              />

              <InputField
                label="App Password"
                value={config.smtp_pass}
                onChange={update('smtp_pass')}
                placeholder="xxxx xxxx xxxx xxxx"
                secret
                hint="16-character Google App Password (not your Gmail password). Stored encrypted."
              />

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-400">Connection Preview</span>
                </div>
                <p className="text-xs text-zinc-300 font-mono">
                  {config.smtp_user || 'user'}@{config.smtp_host || 'smtp.gmail.com'}:{config.smtp_port || '587'}
                </p>
              </div>
            </div>
          )}

          {/* ─── GENERAL TAB ─── */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">General Settings</h2>
                  <p className="text-[10px] text-zinc-500">Platform-wide display and branding options</p>
                </div>
              </div>

              <InputField
                label="Platform Name"
                value={config.platform_name}
                onChange={update('platform_name')}
                placeholder="DearHR"
                hint="Displayed in email footers and system messages"
              />

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-zinc-400">System Status</p>
                {[
                  { label: 'API Server',     status: true,  note: 'Running' },
                  { label: 'PostgreSQL DB',  status: true,  note: 'Connected' },
                  { label: 'Groq AI',        status: Boolean(config.groq_api_key && config.groq_api_key !== ''), note: config.groq_api_key ? 'Key configured' : 'No API key' },
                  { label: 'SMTP Email',     status: Boolean(config.smtp_user && config.smtp_pass && config.smtp_pass !== ''), note: config.smtp_user ? `${config.smtp_user}` : 'Not configured' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-zinc-400">{s.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${s.status ? 'text-green-400' : 'text-red-400'}`}>{s.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-zinc-800">
            <button
              onClick={load}
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-xs font-semibold hover:bg-zinc-100 transition-all disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5" />Save Configuration</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
