'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';
import api from '@/app/lib/axios';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/admin/login', { email, password });
      if (res.data?.success) {
        login(res.data);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(
        error.response?.data?.message ||
          'Invalid admin credentials or unauthorized account status.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4">
            <span className="text-black font-semibold text-xl">D</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">DearHR Admin Panel</h1>
          <p className="text-gray-500 text-sm">Sign in to manage the resume maker platform</p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-sm text-red-400 flex items-start space-x-3 font-medium">
            <ShieldAlert className="flex-shrink-0 mt-0.5 text-red-500" size={18} />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
          <form onSubmit={handleFormSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="admin@dearhr.com"
                  className="w-full pl-12 pr-4 py-3 bg-black border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter admin password"
                  className="w-full pl-12 pr-4 py-3 bg-black border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Platform Admin'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>

          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Not an admin? Sign in as job seeker →
          </a>
        </div>

      </div>
    </div>
  );
}
