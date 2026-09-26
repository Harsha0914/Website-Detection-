import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Copy, Check, ExternalLink, Edit3, Image, AlertCircle } from "lucide-react";
import { formatPhoneNumber, trackWhatsAppContact } from "../../services/whatsappService";

function buildMessage(business) {
  const name = business?.name || "your shop";
  const hasWebsite = business?.website_status === "WEBSITE_AVAILABLE";
  if (hasWebsite) {
    return `Hello ${name}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection. At Lexon IT, our main focus is helping local businesses with modern website designs, speed optimization, and online growth at low cost with guaranteed 100% customer satisfaction. I would love to connect and help boost your shop\u2019s online performance and customer reach!`;
  }
  return `Hello ${name}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection doesn\u2019t have an active website yet. At Lexon IT, our main focus is helping local businesses with high-quality, modern website designs at very low cost with guaranteed 100% customer satisfaction. We would love to build a custom website for your shop to grow your sales! Please reply if you are interested.`;
}

async function copyImageToClipboard() {
  try {
    const res = await fetch("/images/lexonit-flyer.jpg");
    const blob = await res.blob();
    // Convert to PNG for clipboard (required by Clipboard API)
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    canvas.toBlob(async (pngBlob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
      } catch (e) {
        console.warn("Clipboard image write failed:", e);
      }
    }, "image/png");
    return true;
  } catch (e) {
    console.warn("Copy image failed:", e);
    return false;
  }
}

export default function WhatsAppLaunchModal({ business, isOpen, onClose }) {
  const shopName = business?.name || "your shop";
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(0); // 0=ready, 1=image-copied hint shown

  const phoneDigits = business
    ? formatPhoneNumber(business.phone, shopName, business.id || business.external_place_id || "")
    : "";
  const phoneDisplay = phoneDigits ? `+${phoneDigits}` : "No number available";

  useEffect(() => {
    if (business) setMessage(buildMessage(business));
  }, [business]);

  useEffect(() => {
    if (isOpen) {
      setMessage(buildMessage(business));
      setCopied(false);
      setImgCopied(false);
      setSending(false);
      setStep(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
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

  const handleSend = async () => {
    setSending(true);
    // 1. Copy flyer image to clipboard so user can paste in WhatsApp
    await copyImageToClipboard();
    setImgCopied(true);
    // 2. Track contact
    try {
      await trackWhatsAppContact(phoneDigits, shopName, business?.id, message);
    } catch (err) {
      console.warn("track error:", err);
    }
    // 3. Open WhatsApp Web
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, "_blank");
    setSending(false);
    setStep(1); // show paste hint
    // Auto-close after hint shown
    setTimeout(() => onClose(), 4000);
  };

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: "relative", width: "100%", maxWidth: 460,
        background: "#fff", borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,.25)",
        display: "flex", flexDirection: "column",
        maxHeight: "92vh", overflow: "hidden",
        animation: "slideUp .25s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* -- Header -- */}
        <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#064e3b 60%,#0f172a 100%)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 18, flexShrink: 0 }}>
              {shopName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shopName}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6ee7b7" }}>{phoneDisplay}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,.35)" }}>? Lexon IT</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 10, color: "#94a3b8" }}
              onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="#94a3b8"}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* -- Body -- */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>

          {/* Step 1 done hint — paste image in WhatsApp */}
          {step === 1 && (
            <div style={{ margin: "14px 14px 0", padding: "12px 16px", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Check size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>WhatsApp opened! Flyer copied to clipboard</div>
                <div style={{ fontSize: 12, color: "#047857", marginTop: 3 }}>
                  In WhatsApp Web: click the <b>?? attachment</b> button or press <b>Ctrl+V</b> to paste the Lexon IT flyer image, then send it along with the message.
                </div>
              </div>
            </div>
          )}

          {/* Lexon IT Flyer */}
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,.07)" }}>
              <img
                src="/images/lexonit-flyer.jpg"
                alt="Lexon IT"
                style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 165, objectPosition: "top" }}
                onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 10, left: 14, right: 14 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Lexon IT — Digital Solutions Company</div>
                <div style={{ color: "#6ee7b7", fontSize: 11 }}>Website ? AI Chatbots ? Business Automation</div>
              </div>
              {/* Copy image button overlay */}
              <button
                onClick={handleCopyImage}
                style={{ position: "absolute", top: 10, right: 10, background: imgCopied ? "rgba(16,185,129,.9)" : "rgba(0,0,0,.55)", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#fff", fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}
              >
                {imgCopied ? <><Check size={12} /> Copied!</> : <><Image size={12} /> Copy Flyer</>}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 6 }}>
              ?? This flyer will be <b>copied to clipboard</b> when you click Send — paste it in WhatsApp after the message
            </p>
          </div>

          {/* Editable message */}
          <div style={{ padding: "12px 14px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em", display: "flex", alignItems: "center", gap: 4 }}>
                <Edit3 size={12} /> Message (editable)
              </div>
              <button onClick={handleCopyText} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: copied ? "#10b981" : "#64748b" }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div style={{ background: "#dcf8c6", borderRadius: "16px 16px 4px 16px", padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.1)", border: "1px solid rgba(16,185,129,.15)" }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, lineHeight: 1.65, color: "#1e293b", fontFamily: "system-ui,sans-serif", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <svg viewBox="0 0 16 11" style={{ width: 16, height: 12, fill: "#34d399" }}>
                  <path d="M11.071.653a.75.75 0 0 1 .001 1.06l-6.3 6.3a.75.75 0 0 1-1.06 0L1.47 5.77a.75.75 0 0 1 1.06-1.06l1.712 1.71 5.77-5.77a.75.75 0 0 1 1.06 0zm2.5 0a.75.75 0 0 1 .001 1.06l-6.3 6.3a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 1.06-1.06l5.77-5.77a.75.75 0 0 1 1.06 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* -- Footer -- */}
        <div style={{ padding: "10px 14px 16px", borderTop: "1px solid #f1f5f9", background: "#fff", flexShrink: 0 }}>
          <button
            onClick={handleSend}
            disabled={sending || !phoneDigits || !message.trim()}
            style={{
              width: "100%", padding: "15px", marginBottom: 10,
              background: sending || !phoneDigits || !message.trim() ? "#94a3b8" : "linear-gradient(135deg,#059669,#0d9488)",
              borderRadius: 16, color: "#fff", fontWeight: 800, fontSize: 15,
              border: "none", cursor: phoneDigits && message.trim() ? "pointer" : "not-allowed",
              boxShadow: "0 6px 20px rgba(16,185,129,.38)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {sending
              ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Copying flyer &amp; opening WhatsApp...</>
              : <><MessageCircle size={20} /> Send on WhatsApp + Copy Flyer</>
            }
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ExternalLink size={13} /> WhatsApp Web
            </a>
            <button
              onClick={handleCopyText}
              style={{ flex: 1, padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {copied ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy Message"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}
