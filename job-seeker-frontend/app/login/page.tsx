'use client';
import { useState, useEffect } from 'react';
import { Smartphone, MessageCircle, ArrowRight, Shield, User, Mail } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';
import { useGlassToast } from '@/app/components/GlassToastContainer';

function LoginPageComponent() {
  const { showToast } = useGlassToast();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile_setup'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state vectors for custom structural data updates
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [showFullName, setShowFullName] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { login, isLoading: authLoading } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/auth/send-otp', { mobileNumber: phoneNumber, purpose: 'authentication' });
      setStep('otp');
      showToast('Success', 'OTP sent to your WhatsApp', 'success');
    } catch (error) {
      console.log(error);
      showToast('Failed', 'Failed to send OTP', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const enteredOtp = otp.join('');

      const response = await api.post('/auth/verify-otp', {
        mobileNumber: phoneNumber,
        otp: enteredOtp,
      });

      const { user, token } = response.data;

      // Commit token storage temporarily if your interceptor relies on localStorage
      if (token) {
        localStorage.setItem('token', token);
      }

      console.log('📊 Lean User Payload Check:', user);

      // ✅ FIXED: Rely strictly on our clean backend flags instead of heavy extra profile queries
      if (!user.hasEmail || !user.hasFullName) {
        console.log('⚠️ Profile incomplete, redirecting to setup');
        setFullName(user.fullName || '');
        setEmail(user.email || '');
        setShowFullName(!user.hasFullName);
        setShowEmail(!user.hasEmail);
        setStep('profile_setup');
      } else {
        console.log('✅ Profile complete, logging in');
        login(user);
      }
    } catch (error: any) {
      console.log('❌ OTP verification error:', error);
      showToast('Failed', error.response?.data?.message || 'Invalid OTP', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showEmail || !email) {
      setEmailError('');
      return;
    }
    
    const checkEmail = async () => {
      setIsCheckingEmail(true);
      try {
        const response = await api.post('/auth/check-email', { email });
        if (response.data.exists) {
          setEmailError('This email is already in use.');
        } else {
          setEmailError('');
        }
      } catch (error) {
        console.error('Email check error:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email, showEmail]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Structure object mapping precisely to your backend transaction expectations
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: [],
        preferences: {
          roles: [],
          industries: [],
          jobType: '',
          experience: '',
          expectedSalary: '',
          workLocationPreference: ''
        }
      };

      // Wrap compilation properties inside a valid form-data wrapper boundary
      const formData = new FormData();
      formData.append('profileData', JSON.stringify(payload));

      await api.put('/jobseeker/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Synchronize context tracking state vectors on complete
      // Passing flags as true since the user just successfully created them
      login({
        mobileNumber: phoneNumber,
        hasEmail: true,
        hasFullName: true
      });
      
      showToast('Success', 'Profile created successfully!', 'success');
    } catch (error: any) {
      console.log('❌ Profile submission error:', error);
      showToast('Failed', error.response?.data?.error || 'Failed to update registration profile details.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/auth/send-otp', { mobileNumber: phoneNumber, purpose: 'authentication' });
      setOtp(['', '', '', '', '', '']);
      showToast('Success', 'OTP resent via WhatsApp', 'success');
    } catch (error) {
      console.log(error);
      showToast('Failed', 'Failed to resend OTP', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-6">
            <span className="text-black font-semibold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            {step === 'profile_setup' ? 'Complete Profile' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 text-sm">
            {step === 'profile_setup' ? 'Enter credentials to finalize database indexing' : 'Sign in to access your job portal'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 flex items-start space-x-3">
                <MessageCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp Verification</p>
                  <p className="text-xs text-gray-500 mt-1">
                    We&apos;ll send a 6-digit OTP to your WhatsApp
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || phoneNumber.length < 10}
                className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-400">Enter OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Change number
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-5">Sent to {phoneNumber}</p>

                <div className="flex justify-between gap-2 mb-5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = document.getElementById(`otp-${index - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg font-medium bg-[#000000] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-xs">
                  <Shield size={14} className="text-gray-600" />
                  <span className="text-gray-500">Valid for 5 minutes</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.some((d) => !d)}
                className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="w-full text-sm text-gray-500 hover:text-white font-medium disabled:text-gray-700 transition-colors"
              >
                Didn&apos;t receive OTP? Resend
              </button>
            </form>
          )}

          {step === 'profile_setup' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {showFullName && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Anandhu Kannan"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {showEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-12 pr-4 py-3.5 bg-[#000000] border ${emailError ? 'border-red-500' : 'border-[#2c2c2e]'} rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm`}
                      required
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (showFullName && !fullName) || (showEmail && !email) || !!emailError || isCheckingEmail}
                className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <span>{isSubmitting ? 'Saving Profile...' : 'Complete Registration'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 space-y-2">
          <p>By continuing, you agree to our Terms &amp; Privacy Policy</p>
          <a
            href="/admin/login"
            className="block text-gray-700 hover:text-gray-400 transition-colors"
          >
            Platform Admin? Sign in here →
          </a>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPageComponent), { ssr: false });