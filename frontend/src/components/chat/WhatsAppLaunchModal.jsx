import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Copy, Check, ExternalLink, Edit3, Image, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatPhoneNumber, trackWhatsAppContact } from '../../services/whatsappService';

function buildMessage(business) {
  const name = business?.name || 'your shop';
  const hasWebsite = business?.website_status === 'WEBSITE_AVAILABLE';
  if (hasWebsite) {
    return 'Hello ' + name + ', I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection. At Lexon IT, our main focus is helping local businesses with modern website designs, speed optimization, and online growth at low cost with guaranteed 100% customer satisfaction. I would love to connect and help boost your shop\'s online performance and customer reach!';
  }
  return 'Hello ' + name + ', I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection doesn\'t have an active website yet. At Lexon IT, our main focus is helping local businesses with high-quality, modern website designs at very low cost with guaranteed 100% customer satisfaction. We would love to build a custom website for your shop to grow your sales! Please reply if you are interested.';
}

async function copyImageToClipboard() {
  try {
    const res = await fetch('/images/easybillbro-flyer.jpg');
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    canvas.toBlob(async (pngBlob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob }),
        ]);
      } catch (e) {
        console.warn('Clipboard image write failed:', e);
      }
    }, 'image/png');
    return true;
  } catch (e) {
    console.warn('Copy image failed:', e);
    return false;
  }
}

export default function WhatsAppLaunchModal({ business, isOpen, onClose }) {
  const shopName = business?.name || 'your shop';
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [step, setStep] = useState(0); // 0 = compose, 1 = awaiting confirmation, 2 = confirmed sent

  const phoneDigits = business
    ? formatPhoneNumber(business.phone, shopName, business.id || business.external_place_id || '')
    : '';
  const phoneDisplay = phoneDigits ? '+' + phoneDigits : 'No number available';

  useEffect(() => {
    if (business) setMessage(buildMessage(business));
  }, [business]);

  useEffect(() => {
    if (isOpen) {
      setMessage(buildMessage(business));
      setCopied(false);
      setImgCopied(false);
      setOpening(false);
      setRecording(false);
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

  const handleCopyImage = async () => {
    await copyImageToClipboard();
    setImgCopied(true);
    setTimeout(() => setImgCopied(false), 3000);
  };

  // Direct WhatsApp Desktop / Mobile App (bypasses browser landing page completely)
  const handleOpenDirectApp = async () => {
    setOpening(true);
    await copyImageToClipboard();
    setImgCopied(true);
    const appUrl = 'whatsapp://send?phone=' + phoneDigits + '&text=' + encodeURIComponent(message);
    const a = document.createElement('a');
    a.href = appUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setOpening(false);
    setStep(1);
  };

  // Direct WhatsApp Web (loads web.whatsapp.com directly without api.whatsapp.com landing page)
  const handleOpenDirectWeb = async () => {
    setOpening(true);
    await copyImageToClipboard();
    setImgCopied(true);
    const webUrl = 'https://web.whatsapp.com/send?phone=' + phoneDigits + '&text=' + encodeURIComponent(message);
    window.open(webUrl, '_blank');
    setOpening(false);
    setStep(1);
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
                Please switch to your WhatsApp tab to review and send.
                <br />
                <span style={{ color: '#059669', fontWeight: 600 }}>Flyer image copied to clipboard (Ctrl+V in WhatsApp chat).</span>
              </p>

              <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 14, padding: '14px 12px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                  Did you actually send the message in WhatsApp?
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Only messages you confirm will be added to your Recent Communications Stream.
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
                  <X size={14} /> No, I Didn't Send (Don't Log)
                </button>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
                  <button
                    type='button'
                    onClick={handleOpenDirectApp}
                    style={{
                      background: 'none', border: 'none', color: '#059669',
                      fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Re-open WhatsApp App</span>
                  </button>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <button
                    type='button'
                    onClick={handleOpenDirectWeb}
                    style={{
                      background: 'none', border: 'none', color: '#0d9488',
                      fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <ExternalLink size={12} />
                    <span>Re-open WhatsApp Web</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Confirmed Success */}
          {step === 2 && (
            <div style={{ padding: '36px 18px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={28} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
                Message Logged!
              </h4>
              <p style={{ fontSize: 12, color: '#047857' }}>
                {shopName} has been recorded in your Recent Communications Stream.
              </p>
            </div>
          )}

          {/* STEP 0: Compose & Preview */}
          {step === 0 && (
            <>
              {/* EasyBillBro Flyer */}
              <div style={{ padding: '14px 14px 0' }}>
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.07)', background: '#000' }}>
                  <img
                    src='/images/easybillbro-flyer.jpg'
                    alt='EasyBillBro - Restaurant Billing & POS'
                    style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 185, objectPosition: 'top' }}
                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 60%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                    <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 800 }}>EasyBillBro - Restaurant Billing & POS</div>
                    <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700 }}>POS • QR Ordering • Complete Restaurant Management</div>
                  </div>
                  <button
                    onClick={handleCopyImage}
                    style={{ position: 'absolute', top: 10, right: 10, background: imgCopied ? 'rgba(16,185,129,.9)' : 'rgba(0,0,0,.65)', border: 'none', borderRadius: 10, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}
                  >
                    {imgCopied ? <><Check size={12} /> Copied!</> : <><Image size={12} /> Copy Flyer</>}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 6 }}>
                  Flyer will be copied to clipboard when you open WhatsApp — paste with Ctrl+V
                </p>
              </div>

              {/* Editable message */}
              <div style={{ padding: '12px 14px 10px' }}>
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
          <div style={{ padding: '10px 14px 16px', borderTop: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleOpenDirectApp}
                disabled={opening || !phoneDigits || !message.trim()}
                style={{
                  width: '100%', padding: '13px',
                  background: opening || !phoneDigits || !message.trim() ? '#94a3b8' : 'linear-gradient(135deg,#059669,#0d9488)',
                  borderRadius: 16, color: '#fff', fontWeight: 800, fontSize: 14,
                  border: 'none', cursor: phoneDigits && message.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 16px rgba(16,185,129,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                title="Directly triggers the WhatsApp desktop/mobile app"
              >
                <MessageCircle size={19} />
                <span>Directly Open WhatsApp App</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type='button'
                  onClick={handleOpenDirectWeb}
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: 12, fontWeight: 700,
                    color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  title="Directly opens WhatsApp Web chat without any intermediate landing page"
                >
                  <ExternalLink size={13} /> Directly Open WhatsApp Web
                </button>
                <button
                  onClick={handleCopyText}
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: 12, fontWeight: 700,
                    color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy Message'}
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
