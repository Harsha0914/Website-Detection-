import React from 'react';
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  Smartphone,
  FileText,
  Phone,
  Mail,
  Share2,
  Menu,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export function WebsiteAnalysisCard({ analysis, onReanalyze, isReanalyzing = false }) {
  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
        <p className="text-sm text-slate-500">No website analysis data available for this business.</p>
      </div>
    );
  }

  const score = analysis.score || 0;

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Good Quality';
    if (score >= 60) return 'Average Quality';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor Quality';
  };

  const checks = [
    { label: 'Reachable & Online', passed: analysis.is_reachable, icon: ShieldCheck, pts: 15 },
    { label: 'HTTPS / SSL Security', passed: analysis.https_enabled, icon: ShieldCheck, pts: 15 },
    { label: 'Mobile Responsive Viewport', passed: analysis.mobile_viewport, icon: Smartphone, pts: 10 },
    { label: 'Page Title Tag', passed: analysis.has_title, icon: FileText, pts: 10 },
    { label: 'SEO Meta Description', passed: analysis.has_meta_description, icon: FileText, pts: 10 },
    { label: 'Contact Section / Page', passed: analysis.has_contact_info, icon: Phone, pts: 10 },
    { label: 'Phone Number Available', passed: analysis.has_phone, icon: Phone, pts: 8 },
    { label: 'Email Address Available', passed: analysis.has_email, icon: Mail, pts: 8 },
    { label: 'Navigation Menu', passed: analysis.has_navigation, icon: Menu, pts: 7 },
    { label: 'Social Media Links', passed: analysis.has_social_links, icon: Share2, pts: 4 },
    { label: 'Open Graph Social Tags', passed: analysis.has_open_graph, icon: Share2, pts: 3 },
  ];

  const recommendations = analysis.analysis_details?.recommendations || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header with Score */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Online Presence Evaluation</span>
          <h3 className="text-xl font-bold mt-0.5">Website Quality Analysis</h3>
          <p className="text-xs text-slate-300 mt-1 truncate max-w-md">
            URL: <span className="font-mono text-brand-300">{analysis.url || analysis.final_url || 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-extrabold tracking-tight">
              {score}<span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white mt-1">
              {getScoreLabel()}
            </span>
          </div>

          {onReanalyze && (
            <button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              title="Run Live Re-Analysis"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Checklist grid */}
      <div className="p-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Inspection Criteria & Checks</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {checks.map((chk, idx) => {
            const Icon = chk.icon;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                  chk.passed
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                    : 'bg-rose-50/40 border-rose-200/70 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${chk.passed ? 'text-emerald-600' : 'text-rose-500'}`} />
                  <span className="font-medium">{chk.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400">+{chk.pts}pts</span>
                  {chk.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 fill-rose-100" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Recommended Improvements</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-900/90 list-disc list-inside">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
