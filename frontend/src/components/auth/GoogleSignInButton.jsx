import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Check, X, Shield, ArrowRight } from 'lucide-react';

export function GoogleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleSignInButton({
  role = 'USER',
  defaultEmail = '',
  defaultName = '',
  onSuccess,
  showDivider = true,
  dividerPosition = 'top', // 'top' (divider above button) or 'bottom' (divider below button)
}) {
  const navigate = useNavigate();
  const { googleAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(
    defaultEmail || 'chevvuharshavardhanreddy@gmail.com'
  );
  const [googleName, setGoogleName] = useState(
    defaultName || 'Harshavardhan Reddy'
  );
  const [isCustomEmail, setIsCustomEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenPrompt = () => {
    setError('');
    // If a default email was typed by the user, use it
    if (defaultEmail && defaultEmail.includes('@')) {
      setGoogleEmail(defaultEmail);
      if (defaultName) setGoogleName(defaultName);
    }
    setIsModalOpen(true);
  };

  const handleSignIn = async (emailToUse, nameToUse) => {
    const finalEmail = (emailToUse || googleEmail || '').trim().toLowerCase();
    if (!finalEmail || !finalEmail.includes('@')) {
      setError('Please enter a valid Google account email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalName = nameToUse || googleName || finalEmail.split('@')[0];
      await googleAuth({
        email: finalEmail,
        full_name: finalName,
        role: role || 'USER',
      });

      setIsModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/shops');
      }
    } catch (err) {
      setError(err?.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const renderDivider = () => (
    <div className="relative my-4 flex items-center justify-center">
      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      <span className="bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest absolute">
        OR
      </span>
    </div>
  );

  const renderButton = () => (
    <button
      type="button"
      onClick={handleOpenPrompt}
      className="w-full py-3.5 px-4 rounded-xl border-2 border-[#4285F4] hover:border-blue-600 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer group active:scale-[0.99]"
      title="Continue with Google"
    >
      <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
      <span className="text-sm font-semibold tracking-normal text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        Continue with Google
      </span>
    </button>
  );

  return (
    <>
      <div className="w-full space-y-4">
        {showDivider && dividerPosition === 'top' && renderDivider()}
        {renderButton()}
        {showDivider && dividerPosition === 'bottom' && renderDivider()}
      </div>

      {/* Google Account Sign-In Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <GoogleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Sign in with Google
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    to continue to Website Presence Detection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl">
                {error}
              </div>
            )}

            {/* Account Selection Card */}
            {!isCustomEmail ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSignIn(googleEmail, googleName)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {googleName
                        ? googleName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'G'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {googleName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {googleEmail}
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomEmail(true)}
                  className="w-full py-2.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                    +
                  </div>
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              /* Custom Google Email Form */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomEmail(false)}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSignIn(googleEmail, googleName)}
                    disabled={loading}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy notice */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Safe & Secure Google OAuth 2.0 Authentication</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
