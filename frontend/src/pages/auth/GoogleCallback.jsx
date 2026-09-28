import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { googleAuth } = useAuthStore();
  const [status, setStatus] = useState('Completing Google Sign In...');

  useEffect(() => {
    async function processAuth() {
      try {
        // Parse access_token or id_token from hash fragment or query params
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash || window.location.search);
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (error) {
          throw new Error(params.get('error_description') || error);
        }

        if (!accessToken) {
          throw new Error('No access token received from Google.');
        }

        setStatus('Retrieving Google account details...');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve user info from Google.');
        }

        const profile = await res.json();
        const email = profile.email;
        const name = profile.name || profile.given_name || email.split('@')[0];

        // If opened as a popup window by GoogleSignInButton
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              email,
              name,
            },
            window.location.origin
          );
          window.close();
          return;
        }

        // Otherwise handle directly in same window
        setStatus('Signing in to your account...');
        await googleAuth({ email, full_name: name, role: 'USER' });
        navigate('/shops');
      } catch (err) {
        console.error('Google Callback Error:', err);
        setStatus('Authentication failed: ' + (err.message || 'Unknown error'));
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_ERROR',
              error: err.message,
            },
            window.location.origin
          );
          setTimeout(() => window.close(), 2000);
        } else {
          setTimeout(() => navigate('/login'), 2500);
        }
      }
    }

    processAuth();
  }, [googleAuth, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4 font-[Inter,sans-serif]">
      <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <div className="text-sm font-medium text-slate-300">{status}</div>
      <p className="text-xs text-slate-500">Please wait while Google finishes signing you in.</p>
    </div>
  );
}
