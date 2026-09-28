import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { X, Key, Shield, ArrowRight, ExternalLink } from 'lucide-react';

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
  onSuccess,
  showDivider = true,
  dividerPosition = 'top',
}) {
  const navigate = useNavigate();
  const { googleAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(
    localStorage.getItem('google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );

  const getActiveClientId = () => {
    return (
      (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() ||
      (localStorage.getItem('google_client_id') || '').trim()
    );
  };

  const handleSelectAccount = async (email, name) => {
    const finalEmail = (email || '').trim().toLowerCase();
    if (!finalEmail) return;

    setLoading(true);
    setError('');

    try {
      const finalName = name || finalEmail.split('@')[0];
      await googleAuth({
        email: finalEmail,
        full_name: finalName,
        role: role || 'USER',
      });

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

  const openGooglePopup = (clientIdToUse) => {
    const clientId = clientIdToUse || getActiveClientId();
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    setError('');
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const width = 500;
    const height = 650;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=select_account`;

    const popup = window.open(
      authUrl,
      'google_signin_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setError('Popup was blocked by your browser. Please allow popups for this site.');
      return;
    }

    const messageHandler = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        const { email, name } = event.data;
        await handleSelectAccount(email, name);
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        setError(event.data.error || 'Google sign-in was cancelled or encountered an error.');
      }
    };

    window.addEventListener('message', messageHandler);
  };

  const handleSaveAndLaunch = () => {
    const cleanId = (clientIdInput || '').trim();
    if (!cleanId) {
      setError('Please paste your Google OAuth Client ID.');
      return;
    }
    localStorage.setItem('google_client_id', cleanId);
    setShowConfigModal(false);
    openGooglePopup(cleanId);
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
      onClick={() => openGooglePopup()}
      disabled={loading}
      className="w-full py-3.5 px-4 rounded-xl border-2 border-[#4285F4] hover:border-blue-600 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer group active:scale-[0.99] disabled:opacity-60"
      title="Continue with Google"
    >
      <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
      <span className="text-sm font-semibold tracking-normal text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {loading ? 'Connecting Google...' : 'Continue with Google'}
      </span>
    </button>
  );

  return (
    <>
      <div className="w-full space-y-4">
        {showDivider && dividerPosition === 'top' && renderDivider()}
        {renderButton()}
        {showDivider && dividerPosition === 'bottom' && renderDivider()}

        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Google OAuth Client ID Input Modal (Shown if VITE_GOOGLE_CLIENT_ID not set yet) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Google OAuth Client ID
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Required for Google to detect accounts on your laptop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To open Google’s native <strong>accounts.google.com</strong> popup and detect the Google accounts signed into your laptop, paste your Google Cloud Client ID below:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Google Web Client ID
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxx-xxxxxxxx.apps.googleusercontent.com"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAndLaunch}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Launch Google Popup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved securely to your browser session</span>
              </span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                <span>Google Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
