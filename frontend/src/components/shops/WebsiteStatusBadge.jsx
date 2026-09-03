import React from 'react';
import { Globe, GlobeLock, AlertCircle, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';

export function WebsiteStatusBadge({ status, score, quality, showScore = true }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'WEBSITE_AVAILABLE':
        return {
          label: 'Website Available',
          icon: Globe,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'NO_WEBSITE':
        return {
          label: 'No Website Detected',
          icon: GlobeLock,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'WEBSITE_UNREACHABLE':
        return {
          label: 'Website Unreachable',
          icon: AlertCircle,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      default:
        return {
          label: 'Unknown Status',
          icon: HelpCircle,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const getQualityBadge = () => {
    if (score === null || score === undefined || status !== 'WEBSITE_AVAILABLE') return null;

    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          Good ({score}/100)
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          Average ({score}/100)
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Sparkles className="w-3 h-3" />
          Needs Improvement ({score}/100)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
        Poor Quality ({score}/100)
      </span>
    );
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
      {showScore && getQualityBadge()}
    </div>
  );
}
