import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { X, Minus, Square, User, ArrowRight } from 'lucide-react';

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
  dividerPosition = 'top',
}) {
  const navigate = useNavigate();
  const { googleAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState('');
  const [error, setError] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // The exact laptop accounts from Image 1
  const accounts = [
    {
      id: 'harsha',
      name: 'Harshavardhanreddy Chevvu',
      email: 'chevvuharshavardhanreddy@gmail.com',
      avatarBg: 'bg-[#0f5132]',
      initials: 'H',
      isSunflower: false,
    },
    {
      id: 'sujitha',
      name: 'Sujitha Chevvu',
      email: 'sujithachevvu14@gmail.com',
      avatarBg: 'bg-[#b0003a]',
      initials: 'S',
      isSunflower: false,
    },
    {
      id: 'asin',
      name: 'Asin Shaik',
      email: 'asinshaik45@gmail.com',
      avatarBg: 'bg-amber-600',
      initials: 'A',
      isSunflower: true,
    },
  ];

  const handleOpenPrompt = () => {
    setError('');
    setIsCustomMode(false);

    // If client ID is present in environment, check if native Google popup can be triggered
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id');
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setLoadingEmail('loading');
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await res.json();
                if (googleProfile?.email) {
                  await handleSelectAccount(googleProfile.email, googleProfile.name);
                }
              } catch (err) {
                setError('Failed to fetch profile: ' + (err?.message || 'Error'));
              } finally {
                setLoadingEmail('');
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Google GSI error, opening account chooser:', err);
      }
    }

    // Opens Google Account Chooser matching Image 1
    setIsModalOpen(true);
  };

  const handleSelectAccount = async (email, name) => {
    const finalEmail = (email || '').trim().toLowerCase();
    if (!finalEmail) return;

    setLoadingEmail(finalEmail);
    setError('');

    try {
      const finalName = name || finalEmail.split('@')[0];
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
      setError(err?.message || 'Failed to sign in with Google account.');
      setLoadingEmail('');
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

      {/* Real Google Account Chooser Window Matching Image 1 Exactly */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#131314] text-white rounded-2xl sm:rounded-3xl max-w-[440px] w-full shadow-2xl border border-[#3c4043] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 font-[Roboto,Inter,sans-serif]">
            
            {/* Chrome Window Title Bar (Matching Image 1) */}
            <div className="bg-[#1e1f20] px-4 py-2 flex items-center justify-between border-b border-[#303134] select-none text-xs text-[#c4c7c5]">
              <div className="flex items-center gap-2 min-w-0">
                <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-medium text-[11.5px] text-[#e3e3e3]">
                  Sign in – Google accounts - Google Chrome
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[#8e918f]">
                <Minus className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => setIsModalOpen(false)} />
                <Square className="w-3 h-3 cursor-pointer hover:text-white" />
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => setIsModalOpen(false)} />
              </div>
            </div>

            {/* Browser Address Bar (Matching Image 1) */}
            <div className="bg-[#131314] px-4 py-1.5 border-b border-[#303134] flex items-center gap-2 text-[11px] text-[#9aa0a6] select-none">
              <span className="w-4 h-4 rounded-full bg-[#28292a] flex items-center justify-center text-[10px] text-[#8ab4f8]">
                🔒
              </span>
              <span className="truncate font-mono">
                accounts.google.com/v3/signin/accountchooser?access_type=offline
              </span>
            </div>

            {/* Google Loading Bar Indicator when an account is selected */}
            {loadingEmail && (
              <div className="w-full h-1 bg-[#1e1f20] overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 animate-pulse" />
              </div>
            )}

            {/* Main Window Content */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Header: Choose an account */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-[26px] font-normal tracking-tight text-white">
                  Choose an account
                </h2>
                <p className="text-sm text-[#e3e3e3]">
                  to continue to <span className="text-[#8ab4f8] font-medium">Website Presence Detection</span>
                </p>
              </div>

              {error && (
                <div className="p-3 text-xs bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl">
                  {error}
                </div>
              )}

              {/* Accounts List (Matching Image 1) */}
              {!isCustomMode ? (
                <div className="divide-y divide-[#3c4043] border-t border-b border-[#3c4043]">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc.email, acc.name)}
                      disabled={!!loadingEmail}
                      className="w-full py-3.5 px-1 hover:bg-[#202124] transition-colors flex items-center gap-3.5 text-left group cursor-pointer disabled:opacity-50"
                    >
                      {/* Avatar */}
                      {acc.isSunflower ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-sm shadow-xs shrink-0 border border-amber-300/40">
                          🌻
                        </div>
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full ${acc.avatarBg} text-white font-medium text-sm flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {acc.initials}
                        </div>
                      )}

                      {/* Name & Email */}
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-medium text-[#f1f3f4] group-hover:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[12.5px] text-[#9aa0a6] truncate font-normal">
                          {acc.email}
                        </div>
                      </div>

                      {loadingEmail === acc.email.toLowerCase() && (
                        <div className="w-4 h-4 border-2 border-[#8ab4f8]/30 border-t-[#8ab4f8] rounded-full animate-spin shrink-0" />
                      )}
                    </button>
                  ))}

                  {/* Use another account row */}
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className="w-full py-3.5 px-1 hover:bg-[#202124] transition-colors flex items-center gap-3.5 text-left group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full border border-[#5f6368] flex items-center justify-center text-[#9aa0a6] group-hover:text-white shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[14.5px] font-medium text-[#f1f3f4] group-hover:text-white">
                      Use another account
                    </span>
                  </button>
                </div>
              ) : (
                /* Use another account inline input */
                <div className="space-y-4 p-4 rounded-2xl bg-[#1e1f20] border border-[#3c4043]">
                  <div className="text-sm font-medium text-white">Enter Google Account</div>
                  <div>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Email or phone"
                      autoFocus
                      className="w-full px-3.5 py-2.5 text-sm bg-[#131314] border border-[#5f6368] focus:border-[#8ab4f8] rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Name (Optional)"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#131314] border border-[#5f6368] focus:border-[#8ab4f8] rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(false)}
                      className="text-xs font-medium text-[#8ab4f8] hover:underline"
                    >
                      Back to accounts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(customEmail, customName)}
                      disabled={!customEmail || !!loadingEmail}
                      className="py-2 px-5 text-xs font-semibold text-[#131314] bg-[#8ab4f8] hover:bg-[#a8c7fa] rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Footer text (Matching Image 1) */}
              <div className="text-[12px] text-[#9aa0a6] leading-relaxed pt-2">
                Before using this app, you can review Website Presence Detection’s{' '}
                <a
                  href="#privacy"
                  onClick={(e) => e.preventDefault()}
                  className="text-[#8ab4f8] hover:underline"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="#terms"
                  onClick={(e) => e.preventDefault()}
                  className="text-[#8ab4f8] hover:underline"
                >
                  Terms of Service
                </a>
                .
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
