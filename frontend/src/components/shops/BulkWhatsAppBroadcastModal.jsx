import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Sparkles,
  Send,
  CheckCircle2,
  X,
  Bot,
  Store,
  Phone,
  Layers,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';
import { broadcastWhatsAppToAllShops, formatPhoneNumber, launchWhatsAppApp } from '../../services/whatsappService';

const PRESET_TEMPLATES = [
  {
    id: 'lexon_official',
    name: '🌟 Lexon IT Official Pitch (Recommended)',
    badge: 'High Conversion',
    text: `Hello {shop_name}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection doesn't have an active website yet. At Lexon IT, our main focus is helping local businesses with high-quality, modern website designs at very low cost with guaranteed 100% customer satisfaction. We would love to build a custom website for your shop to boost your sales! Please reply if you are interested.`,
  },
  {
    id: 'starter_package',
    name: '💰 Starter Offer (₹4,999 Special)',
    badge: 'Budget Friendly',
    text: `Hi {shop_name}! Lexon IT is offering custom mobile-friendly websites for {category} businesses starting at just ₹4,999, including Google Maps SEO, WhatsApp ordering, and free cloud hosting. Would you like a free live demo preview for your shop?`,
  },
  {
    id: 'growth_demo',
    name: '🚀 Free Demo & Sales Growth',
    badge: 'Fast Reply',
    text: `Hello {shop_name} team! Having a website can double your local customer inquiries in your area. We design high-speed websites with guaranteed 100% satisfaction. Reply 'YES' to get a free personalized demo layout created for your shop!`,
  },
];

export default function BulkWhatsAppBroadcastModal({ isOpen, onClose, shops = [], onBroadcastComplete }) {
  const navigate = useNavigate();

  const [selectedShopIds, setSelectedShopIds] = useState(() =>
    new Set(shops.map((s, idx) => s.id || `shop_${idx}`))
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState('lexon_official');
  const [messageText, setMessageText] = useState(PRESET_TEMPLATES[0].text);
  const [autoAIEnabled, setAutoAIEnabled] = useState(true);

  // Sending progress states
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSendingName, setCurrentSendingName] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync selected shops if shops prop updates when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedShopIds(new Set(shops.map((s, idx) => s.id || `shop_${idx}`)));
      setIsComplete(false);
      setProgress(0);
      setSendResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, shops]);

  if (!isOpen) return null;

  const toggleSelectShop = (shopId) => {
    setSelectedShopIds((prev) => {
      const next = new Set(prev);
      if (next.has(shopId)) {
        next.delete(shopId);
      } else {
        next.add(shopId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedShopIds.size === shops.length) {
      setSelectedShopIds(new Set());
    } else {
      setSelectedShopIds(new Set(shops.map((s, idx) => s.id || `shop_${idx}`)));
    }
  };

  const handleTemplateChange = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setMessageText(tmpl.text);
  };

  const insertTag = (tag) => {
    setMessageText((prev) => `${prev} ${tag}`);
  };

  const targetShops = shops.filter((s, idx) => selectedShopIds.has(s.id || `shop_${idx}`));

  const handleExecuteBroadcast = async () => {
    if (targetShops.length === 0) return;

    setIsSending(true);
    setErrorMsg(null);
    setProgress(15);
    setCurrentSendingName(targetShops[0]?.name || 'Initializing AI dispatch...');

    try {
      // Small visual timer for progress display
      const timer = setInterval(() => {
        setProgress((old) => (old < 85 ? old + Math.floor(Math.random() * 15) + 10 : old));
      }, 300);

      const result = await broadcastWhatsAppToAllShops({
        shops: targetShops,
        customMessage: messageText,
        autoAIEnabled: autoAIEnabled,
      });

      clearInterval(timer);
      setProgress(100);
      setSendResult(result);
      setIsComplete(true);

      if (onBroadcastComplete) {
        onBroadcastComplete(result);
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to dispatch bulk WhatsApp messages.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  1-Click AI WhatsApp Broadcast
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800">
                  Auto AI Bot Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outreach website pitch to <strong className="text-slate-900 dark:text-white">{shops.length}</strong> shops without a website
              </p>
            </div>
          </div>
          {!isSending && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isComplete ? (
            /* Complete State */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-300/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Outreach Broadcast Dispatched!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Successfully initiated AI website outreach messages to{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{sendResult?.total_sent || targetShops.length} shops</strong>.
                  The AI Sales Bot will automatically handle all incoming replies!
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Total Targeted:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{sendResult?.total_targeted || targetShops.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Outreach Delivered:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{sendResult?.total_sent || targetShops.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Auto AI Assistant Mode:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">🤖 Active 24/7</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/whatsapp-hub');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Bot className="w-4 h-4" />
                  <span>Open AI WhatsApp Sales Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {targetShops[0] && (
                  <button
                    onClick={() => {
                      launchWhatsAppApp(targetShops[0], messageText);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300/60 dark:border-emerald-800 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Launch in WhatsApp App</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Configure & Review State */
            <>
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Template Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>1. Choose AI Outreach Pitch Template</span>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {PRESET_TEMPLATES.length} presets available
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleTemplateChange(tmpl)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            {tmpl.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {tmpl.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    2. Pitch Message Content
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Insert tags:</span>
                    <button
                      type="button"
                      onClick={() => insertTag('{shop_name}')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      {'{shop_name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{category}')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      {'{category}'}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter custom AI outreach message..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none leading-relaxed transition-all resize-none font-medium"
                />
              </div>

              {/* Auto AI Bot Option */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Auto AI Sales Assistant Bot
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      When shop owners reply on WhatsApp, our AI bot will handle objections & answer quotes.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoAIEnabled}
                  onChange={(e) => setAutoAIEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Target Shop Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    3. Target Recipients ({targetShops.length} of {shops.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {selectedShopIds.size === shops.length ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Select All ({shops.length})</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40 p-1">
                  {shops.map((shop, idx) => {
                    const shopKey = shop.id || `shop_${idx}`;
                    const isChecked = selectedShopIds.has(shopKey);
                    const formattedPhone = formatPhoneNumber(shop.phone, shop.name, shop.id || shop.external_place_id);

                    return (
                      <div
                        key={shopKey}
                        onClick={() => toggleSelectShop(shopKey)}
                        className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white dark:bg-slate-800 shadow-2xs'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {shop.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>{shop.category || 'Local Shop'}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">+{formattedPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const personalized = messageText
                                .replace(/\{shop_name\}/gi, shop.name || 'Local Shop')
                                .replace(/\{category\}/gi, shop.category || 'Business');
                              launchWhatsAppApp(shop, personalized);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 transition-colors"
                            title={`Open directly in WhatsApp for ${shop.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                            No Website
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress bar during sending */}
              {isSending && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Broadcasting AI Pitch: {currentSendingName}...</span>
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-200/60 dark:bg-emerald-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isComplete && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteBroadcast}
              disabled={isSending || targetShops.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending to {targetShops.length} Shops...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send AI WhatsApp to All ({targetShops.length} Shops)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
