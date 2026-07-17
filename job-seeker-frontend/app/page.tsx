'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { redirect } from 'next/navigation';
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  // Route authenticated users straight to their tracking environment
  if (isAuthenticated) {
    redirect('/dashboard');
  }

  // Simplified simulated login flow for the web landing interface
  const handleWhatsAppLogin = () => {
    // In production, this targets your /auth/send-otp pipeline
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white font-sans flex flex-col justify-between">
      
      {/* ─── NAVIGATION BAR ────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <div className="h-2 w-2 bg-black rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-semibold tracking-tight uppercase text-white">
              Interviewer
            </span>
          </div>

          <button
            onClick={handleWhatsAppLogin}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-white transition-all duration-200 shadow-sm"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ─── HERO HERO HERO ────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-20 pb-16 flex flex-col items-center justify-center text-center">
        
        {/* Micro Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800/80 mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] font-medium text-zinc-400 tracking-wide">
            Next-Gen AI Placements
          </span>
        </div>

        {/* Hero Header */}
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-[1.1] mb-6">
          The shortest distance <br />
          <span className="text-zinc-500">between you and your next role.</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-light leading-relaxed mb-10">
          Build an immaculate, ATS-optimized profile, clear proctored coding assessments, and attend real-time technical video sessions natively.
        </p>

        {/* Primary Action Button */}
        <button
          onClick={handleWhatsAppLogin}
          className="group inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-full text-xs font-medium hover:bg-zinc-800/60 hover:border-zinc-700 transition-all duration-200 shadow-xl"
        >
          Secure Access via WhatsApp OTP
          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* ─── GRID PRODUCT CAPABILITIES ─────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-24 text-left">
          
          {/* Card 1: Resume Parser */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Groq AI Parser & Analysis
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Upload your document to immediately receive structured section analysis, real-time keyword grading, and actionable suggestions to clear strict technical screening barriers.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span>0–100 Live Scoring Engine</span>
            </div>
          </div>

          {/* Card 2: Immediate Spot Jobs */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Rapid Spot Job Systems
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Toggle availability to instantly open single-day, immediate technical or engineering assignments near your current location. Confirm placement requests with a single tap.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span>Real-Time Deployment Ready</span>
            </div>
          </div>

          {/* Card 3: LiveKit Assessments */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Secure Live Assessment
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Participate in structured multi-language coding rooms and interactive video streams natively backed by client-side MediaPipe integrity frameworks.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span>Privacy-Centric Tracking</span>
            </div>
          </div>

        </section>

        {/* ─── TRACKING TIMELINE PREVIEW ─────────────────────── */}
        <section className="w-full max-w-3xl mt-16 p-6 border border-zinc-900 bg-zinc-950/30 rounded-2xl text-left">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Application Tracker Roadmap
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-light">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" /> Applied
            </div>
            <div className="h-px bg-zinc-900 flex-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" /> Under Review
            </div>
            <div className="h-px bg-zinc-900 flex-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" /> Shortlisted
            </div>
            <div className="h-px bg-zinc-900 flex-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" /> Live Interview
            </div>
          </div>
        </section>

      </main>

      {/* ─── FOOTER LAYER ──────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-6 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-600 font-light tracking-wide gap-3">
          <p>© 2026 Interviewer Ecosystem. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Platform Architecture</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}