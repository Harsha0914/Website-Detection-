import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Globe,
  GlobeLock,
  CheckCircle2,
  Sparkles,
  FileCode2,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/statistics');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading platform analytics..." />;
  }

  const statCards = [
    {
      title: 'Total Businesses',
      value: stats?.total_businesses || 0,
      icon: Store,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      title: 'Websites Available',
      value: stats?.website_available || 0,
      icon: Globe,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'No Website Detected',
      value: stats?.no_website || 0,
      icon: GlobeLock,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Good Websites (80+)',
      value: stats?.good_websites || 0,
      icon: CheckCircle2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Needs Improvement',
      value: stats?.needs_improvement || 0,
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Website Proposals',
      value: stats?.total_website_requests || 0,
      icon: FileCode2,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Active Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Chat Sessions',
      value: stats?.total_conversations || 0,
      icon: MessageSquare,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  const total = stats?.total_businesses || 1;
  const webPercent = Math.round(((stats?.website_available || 0) / total) * 100);
  const noWebPercent = Math.round(((stats?.no_website || 0) / total) * 100);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Overview</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics for local business detection, website status, and user interactions.
        </p>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white">
                {card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Digital Presence Ratio Bar */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Website Presence Distribution</h3>
            <p className="text-xs text-slate-400">Total detected merchant breakdown</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Website Available: {webPercent}%
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              No Website: {noWebPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${webPercent}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
          />
          <div
            style={{ width: `${noWebPercent}%` }}
            className="h-full bg-rose-500 transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
}
