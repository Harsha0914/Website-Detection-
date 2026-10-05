import React, { useState, useEffect } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { trackWhatsAppContact } from '../../services/whatsappService';

export default function WhatsAppSentConfirmToast() {
  const [promptData, setPromptData] = useState(null);
  const [directSentData, setDirectSentData] = useState(null);
  const [logging, setLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    const handlePrompt = (e) => {
      if (e?.detail) {
        setPromptData(e.detail);
        setJustLogged(false);
      }
    };

    const handleDirectSent = (e) => {
      if (e?.detail) {
        setDirectSentData(e.detail);
        setPromptData(null);
        setTimeout(() => {
          setDirectSentData(null);
        }, 9000);
      }
    };

    window.addEventListener('whatsapp-confirm-prompt', handlePrompt);
    window.addEventListener('whatsapp-direct-sent', handleDirectSent);
    return () => {
      window.removeEventListener('whatsapp-confirm-prompt', handlePrompt);
      window.removeEventListener('whatsapp-direct-sent', handleDirectSent);
    };
  }, []);

  if (directSentData) {
    return (
      <div className='fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-md text-white border border-emerald-500/50 rounded-2xl shadow-2xl p-4.5 animate-in slide-in-from-bottom duration-200 ring-1 ring-emerald-500/20'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-3 flex-1 min-w-0'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 mt-0.5'>
              <Check className='w-5 h-5 text-white stroke-[2.5]' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs font-black text-emerald-400 flex items-center gap-1.5'>
                <span>⚡ WhatsApp Message Sent Directly!</span>
              </div>
              <div className='text-sm font-bold text-white truncate mt-0.5'>
                {directSentData.shopName}
              </div>
              <div className='text-[11px] text-slate-300 font-mono mt-0.5'>
                +{directSentData.phone}
              </div>
              <div className='text-xs text-emerald-300/90 font-medium mt-1 leading-snug'>
                Pitch delivered directly to shop owner via WhatsApp Cloud API without manual steps.
              </div>

              {/* Direct links to view the live chat thread */}
              <div className='flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-800'>
                <a
                  href='https://www.mrlads.com/conversations'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all'
                >
                  <MessageCircle className='w-3.5 h-3.5' />
                  <span>View in WA Business ↗</span>
                </a>
                <a
                  href='/whatsapp'
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all'
                >
                  <span>In-App Chat Hub ↗</span>
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDirectSentData(null)}
            className='text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    );
  }



  if (!promptData) return null;

  const handleConfirm = async () => {
    setLogging(true);
    try {
      await trackWhatsAppContact(
        promptData.phone,
        promptData.shopName,
        promptData.businessId,
        promptData.message
      );
      setJustLogged(true);
      setTimeout(() => {
        setPromptData(null);
        setJustLogged(false);
      }, 2000);
    } catch (err) {
      console.warn('Could not record contact:', err);
      setPromptData(null);
    } finally {
      setLogging(false);
    }
  };

  const handleDismiss = () => {
    setPromptData(null);
  };

  return (
    <div className='fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-200'>
      {justLogged ? (
        <div className='flex items-center gap-3 text-emerald-600 dark:text-emerald-400 py-1'>
          <div className='w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0'>
            <Check className='w-5 h-5' />
          </div>
          <div>
            <div className='text-xs font-bold'>Message Logged!</div>
            <div className='text-[11px] text-slate-500'>
              Added to your Communications Log Stream.
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <div className='w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
                <MessageCircle className='w-4 h-4' />
              </div>
              <div>
                <span className='text-xs font-black text-slate-900 dark:text-white line-clamp-1'>
                  {promptData.shopName}
                </span>
                <span className='text-[10px] text-slate-400 font-mono'>
                  +{promptData.phone}
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1'
            >
              <X className='w-4 h-4' />
            </button>
          </div>

          <p className='text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed'>
            WhatsApp opened in a new tab. <strong>Did you send the message?</strong>
          </p>

          <div className='flex items-center gap-2 pt-1'>
            <button
              type='button'
              onClick={handleConfirm}
              disabled={logging}
              className='flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer'
            >
              <Check className='w-3.5 h-3.5' />
              <span>{logging ? 'Logging...' : 'Yes, I Sent It'}</span>
            </button>
            <button
              type='button'
              onClick={handleDismiss}
              className='py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer'
            >
              No, Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
