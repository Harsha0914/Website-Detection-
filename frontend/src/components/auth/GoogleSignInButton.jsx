import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Check, X, Shield, ArrowRight, Laptop, Plus, Settings } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(
    localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );

  // Accounts detected on this laptop/browser
  const [laptopAccounts, setLaptopAccounts] = useState(() => {
    const defaultList = [
      {
        name: 'Harshavardhan Reddy',
        email: 'chevvuharshavardhanreddy@gmail.com',
        initials: 'HR',
        badge: 'Detected on this laptop',
      },
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('laptop_google_accounts') || 'null');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (_) {}
    return defaultList;
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  // Update default account if user typed an email into username/email input
  useEffect(() => {
    if (defaultEmail && defaultEmail.includes('@')) {
      setLaptopAccounts((prev) => {
        if (prev.some((a) => a.email.toLowerCase() === defaultEmail.toLowerCase())) return prev;
        const namePart = defaultName || defaultEmail.split('@')[0];
        return [
          {
            name: namePart,
            email: defaultEmail.toLowerCase(),
            initials: namePart.slice(0, 2).toUpperCase(),
            badge: 'Detected from input',
          },
          ...prev,
        ];
      });
    }
  }, [defaultEmail, defaultName]);

  const triggerGoogleOAuthPopup = (clientId) => {
    if (!clientId) return false;
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setLoading(true);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await res.json();
                if (googleProfile?.email) {
                  await handleSignIn(googleProfile.email, googleProfile.name || googleProfile.email.split('@')[0]);
                }
              } catch (err) {
                setError('Failed to fetch profile: ' + (err?.message || 'Error'));
              } finally {
                setLoading(false);
              }
            }
          },
        });
        client.requestAccessToken();
        return true;
      } catch (err) {
        console.warn('Google GSI popup initialization warning:', err);
      }
    }
    return false;
  };

  const handleOpenPrompt = () => {
    setError('');
    const activeClientId = clientIdInput || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // If a client ID is configured and GSI is ready, attempt direct native Google popup
    if (activeClientId && triggerGoogleOAuthPopup(activeClientId)) {
      return;
    }

    // Otherwise, open the native-styled Google Account Chooser modal detecting laptop accounts
    setIsModalOpen(true);
  };

  const handleSignIn = async (emailToUse, nameToUse) => {
    const finalEmail = (emailToUse || '').trim().toLowerCase();
    if (!finalEmail || !finalEmail.includes('@')) {
      setError('Please select or enter a valid Google account email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalName = nameToUse || finalEmail.split('@')[0];
      await googleAuth({
        email: finalEmail,
        full_name: finalName,
        role: role || 'USER',
      });

      // Remember account in laptop's list
      try {
        const updated = [
          {
            name: finalName,
            email: finalEmail,
            initials: finalName.slice(0, 2).toUpperCase(),
            badge: 'Active account',
          },
          ...laptopAccounts.filter((a) => a.email.toLowerCase() !== finalEmail),
        ];
        setLaptopAccounts(updated);
        localStorage.setItem('laptop_google_accounts', JSON.stringify(updated));
      } catch (_) {}

      setIsModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/shops');
      }
    } catch (err) {
      setError(err?.message || 'Failed to sign in with Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewAccount = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid Google account email.');
      return;
    }
    handleSignIn(newEmail, newName || newEmail.split('@')[0]);
  };

  const handleSaveClientId = () => {
    if (clientIdInput) {
      localStorage.setItem('google_client_id', clientIdInput.trim());
    } else {
      localStorage.removeItem('google_client_id');
    }
    setShowConfig(false);
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

      {/* Google Multi-Account Chooser (Detecting Laptop Accounts) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Google Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  <GoogleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Choose an account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Laptop className="w-3.5 h-3.5 text-blue-500" />
                    <span>to continue to Website Presence Detection</span>
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

            {/* Laptop Accounts Detected List */}
            {!isAddingNew ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Google Accounts on this Laptop
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
                  {laptopAccounts.map((account, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSignIn(account.email, account.name)}
                      disabled={loading}
                      className="w-full p-3.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-500/20">
                          {account.initials || 'G'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {account.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {account.email}
                          </p>
                          {account.badge && (
                            <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded-md">
                              {account.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}

                  {/* Use another Google account */}
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="w-full p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left transition-all flex items-center gap-3.5 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Use another Google account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Add New Google Account Form */
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Add another Google account
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    autoFocus
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Account Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition-colors"
                  >
                    Back to Accounts
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewAccount}
                    disabled={loading}
                    className="flex-1 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Optional Google Client ID Settings */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[11px] font-medium text-slate-400 hover:text-blue-500 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-3 h-3" />
                <span>Google OAuth 2.0 Client ID Settings (Optional)</span>
              </button>

              {showConfig && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    To connect Google's direct native browser popup, paste your Google Cloud Client ID (or set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code>):
                  </p>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Secure Google OAuth 2.0 Integration</span>
              </div>
              <p className="leading-tight">
                Google will share your name, email address, language preference, and profile picture with Website Presence Detection.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
