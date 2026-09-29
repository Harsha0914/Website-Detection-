import React, { useState, useEffect } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { trackWhatsAppContact } from '../../services/whatsappService';

export default function WhatsAppSentConfirmToast() {
  const [promptData, setPromptData] = useState(null);
  const [logging, setLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    const handlePrompt = (e) => {
      if (e?.detail) {
        setPromptData(e.detail);
        setJustLogged(false);
      }
    };

    window.addEventListener('whatsapp-confirm-prompt', handlePrompt);
    return () => {
      window.removeEventListener('whatsapp-confirm-prompt', handlePrompt);
    };
  }, []);

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
