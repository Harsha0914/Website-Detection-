import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Copy, Check, ExternalLink, Edit3, AlertCircle, CheckCircle2, RotateCcw, Zap, Loader2 } from 'lucide-react';
import { formatPhoneNumber, trackWhatsAppContact, sendDirectWhatsAppPitch, launchDirectWhatsAppChat, getLexonOutreachMessage } from '../../services/whatsappService';

function buildMessage(business) {
  return getLexonOutreachMessage(business?.name || 'Business Owner');
}

export default function WhatsAppLaunchModal({ business, isOpen, onClose }) {
  const shopName = business?.name || 'your shop';
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [directSending, setDirectSending] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(false);
  const [step, setStep] = useState(0); // 0 = compose, 1 = awaiting confirmation, 2 = confirmed sent
  const [targetType, setTargetType] = useState('shop'); // 'shop', 'my_phone', 'custom'
  const [customPhone, setCustomPhone] = useState('');

  const shopPhoneDigits = business
    ? formatPhoneNumber(business.phone || business.phone_number, shopName, business.id || business.external_place_id || '')
    : '';

  const activePhone = shopPhoneDigits;
  const phoneDisplay = activePhone ? '+' + activePhone : 'No number available';

  useEffect(() => {
    if (business) setMessage(buildMessage(business));
  }, [business]);

  useEffect(() => {
    if (isOpen) {
      setMessage(buildMessage(business));
      setTargetType('shop');
      setCustomPhone('');
      setCopied(false);
      setOpening(false);
      setRecording(false);
      setDirectSending(false);
      setDirectSuccess(false);
      setStep(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !business) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(message).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // Direct WhatsApp API Send (dispatches directly from website to shop owner or target phone)
  const handleDirectSendAPI = async (overrideNum = null) => {
    const numToUse = overrideNum || activePhone;
    if (!message.trim() || !numToUse) return;
    setDirectSending(true);
    try {
      await sendDirectWhatsAppPitch({
        ...business,
        phone: numToUse,
      }, message);
      setDirectSuccess(true);
      setStep(2);
    } catch (err) {
      console.error('Direct WhatsApp send failed:', err);
      alert('Could not send WhatsApp message: ' + (err.message || 'Check connection'));
    } finally {
      setDirectSending(false);
    }
  };

  // Direct WhatsApp Launch (opens web/app with pre-filled message directly so chat is visible in WhatsApp)
  const handleDirectLaunchWhatsApp = (mode = 'web', overrideNum = null) => {
    if (!message.trim()) return;
    const numToUse = overrideNum || activePhone;
    launchDirectWhatsAppChat(business, message, mode, numToUse);
    setDirectSuccess(true);
    setStep(2);
    setTimeout(() => {
      onClose();
    }, 1500);
  };


  // Step 2a: User confirms message was sent -> now log it
  const handleConfirmSent = async () => {
    setRecording(true);
    try {
      await trackWhatsAppContact(phoneDigits, shopName, business?.id, message);
      setStep(2);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('track error:', err);
      onClose();
    } finally {
      setRecording(false);
    }
  };

  // Step 2b: User didn't send -> close without any logging
  const handleCancelNotSent = () => {
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          overflow: 'hidden',
          animation: 'modalFadeIn .2s cubic-bezier(0.16,1,0.3,1)',
        }}
      >

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#064e3b 60%,#0f172a 100%)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 18, flexShrink: 0 }}>
              {shopName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, maxWidth: 230, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shopName}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#6ee7b7' }}>{phoneDisplay}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,.35)' }}>Lexon IT</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 10, color: '#94a3b8' }}
              onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>

          {/* STEP 1: Awaiting Confirmation */}
          {step === 1 && (
            <div style={{ padding: '24px 18px', textAlign: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
                <ExternalLink size={26} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                WhatsApp Opened For {shopName}
              </h4>
              <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>
                Review and send the message in your WhatsApp chat.
              </p>

              <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 14, padding: '14px 12px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                  Did you send the message in WhatsApp?
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Confirming will record this interaction in your Recent Communications Stream.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type='button'
                  onClick={handleConfirmSent}
                  disabled={recording}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'linear-gradient(135deg,#059669,#10b981)',
                    borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 13.5,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {recording ? <span>Logging message...</span> : <><Check size={16} /> Yes, I Sent the Message (Log It)</>}
                </button>

                <button
                  type='button'
                  onClick={handleCancelNotSent}
                  style={{
                    width: '100%', padding: '11px',
                    background: '#f1f5f9', borderRadius: 14,
                    color: '#475569', fontWeight: 700, fontSize: 12.5,
                    border: '1px solid #e2e8f0', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Confirmed Success */}
          {step === 2 && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,.25)' }}>
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
                ⚡ WhatsApp Message Sent Directly!
              </h4>
              <p style={{ fontSize: 13, color: '#047857', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Pitch successfully sent to <strong>{shopName}</strong> (+{activePhone}) via WhatsApp Cloud API without manual steps.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
                <a
                  href='https://www.mrlads.com/conversations'
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', background: 'linear-gradient(135deg,#059669,#10b981)',
                    color: '#fff', borderRadius: 14, fontWeight: 800, fontSize: 13,
                    textDecoration: 'none', boxShadow: '0 4px 12px rgba(16,185,129,.3)'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>View Chat in WA Business (mrlads.com) ↗</span>
                </a>

                <a
                  href='/whatsapp'
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 16px', background: '#f8fafc', color: '#1e293b',
                    borderRadius: 14, fontWeight: 700, fontSize: 13,
                    textDecoration: 'none', border: '1px solid #cbd5e1'
                  }}
                >
                  <span>Open In-App WhatsApp Hub ↗</span>
                </a>

                <button
                  type='button'
                  onClick={onClose}
                  style={{
                    padding: '9px', background: 'transparent', color: '#64748b',
                    border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginTop: 4
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* STEP 0: Compose & Preview */}
          {step === 0 && (
            <>


              {/* Recipient Target Selector */}
              {/* Recipient Target Shop */}
              <div style={{ padding: '12px 14px 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                  Recipient
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🏪 {shopName}</span>
                  <span style={{ fontFamily: 'monospace' }}>{phoneDisplay}</span>
                </div>
              </div>

              {/* Editable message */}
              <div style={{ padding: '10px 14px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={12} /> Message (editable)
                  </div>
                  <button onClick={handleCopyText} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: copied ? '#10b981' : '#64748b' }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ background: '#dcf8c6', borderRadius: '16px 16px 4px 16px', padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.1)', border: '1px solid rgba(16,185,129,.15)' }}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 13, lineHeight: 1.65, color: '#1e293b', fontFamily: 'system-ui,sans-serif', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer for Step 0 */}
        {step === 0 && (
          <div style={{ padding: '12px 14px 16px', borderTop: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* PRIMARY ACTION: Direct Cloud API dispatch */}
              <button
                type='button'
                onClick={() => handleDirectSendAPI()}
                disabled={!activePhone || !message.trim() || directSending}
                style={{
                  width: '100%', padding: '14px',
                  background: !activePhone || !message.trim() ? '#94a3b8' : 'linear-gradient(135deg,#059669,#0d9488)',
                  borderRadius: 16, color: '#fff', fontWeight: 800, fontSize: 14.5,
                  border: 'none', cursor: activePhone && message.trim() && !directSending ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 16px rgba(16,185,129,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                title="Dispatches outreach pitch directly via WhatsApp API (appears in Mr LAD WhatsApp inbox)"
              >
                {directSending ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Sending Directly via WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="#fff" />
                    <span>⚡ Send Directly via WhatsApp ({activePhone ? '+' + activePhone : 'Shop'})</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type='button'
                  onClick={() => handleDirectLaunchWhatsApp('web')}
                  disabled={!activePhone || !message.trim()}
                  style={{
                    flex: 1, padding: '9px 10px', fontSize: 11.5, fontWeight: 700,
                    color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0',
                    borderRadius: 12, cursor: activePhone && message.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                  title="Open in WhatsApp Web"
                >
                  <ExternalLink size={14} /> WhatsApp Web
                </button>

                <button
                  onClick={handleCopyText}
                  style={{
                    padding: '9px 16px', fontSize: 11.5, fontWeight: 700,
                    color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes modalFadeIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }' }} />
    </div>,
    document.body
  );
}
