import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Filter, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { WebsiteStatusBadge } from '../../components/shops/WebsiteStatusBadge';
import api from '../../services/api';

export default function AdminReports() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.website_status = statusFilter;
      if (qualityFilter) params.website_quality = qualityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/admin/businesses', { params });
      setBusinesses(res.data);
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [statusFilter, qualityFilter, categoryFilter]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('website_status', statusFilter);
      if (qualityFilter) params.append('website_quality', qualityFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await api.get(`/admin/reports/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shop_presence_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Website Presence Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate and export custom presence audit spreadsheets for offline stores
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
        >
          <option value="">All Website Statuses</option>
          <option value="WEBSITE_AVAILABLE">Website Available</option>
          <option value="NO_WEBSITE">No Website</option>
          <option value="WEBSITE_UNREACHABLE">Website Unreachable</option>
        </select>

        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value)}
          className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
        >
          <option value="">All Quality Tiers</option>
          <option value="GOOD">Good Quality (80-100)</option>
          <option value="AVERAGE">Average (60-79)</option>
          <option value="NEEDS_IMPROVEMENT">Needs Improvement (40-59)</option>
          <option value="POOR">Poor (0-39)</option>
        </select>

        <input
          type="text"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          placeholder="Filter by Category (e.g. Grocery Store)..."
          className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
        />
      </div>

      {/* Preview Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Generating report preview..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 font-bold">Business Name</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Address</th>
                  <th className="p-4 font-bold">Website Status</th>
                  <th className="p-4 font-bold">Score</th>
                  <th className="p-4 font-bold">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-white max-w-[200px] truncate">{b.name}</td>
                    <td className="p-4 text-slate-400">{b.category || 'N/A'}</td>
                    <td className="p-4 text-slate-400 max-w-[220px] truncate">{b.address || '—'}</td>
                    <td className="p-4">
                      <WebsiteStatusBadge
                        status={b.website_status}
                        score={b.website_score}
                        quality={b.website_quality}
                        showScore={false}
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400">
                      {b.website_score !== null ? `${b.website_score}/100` : '—'}
                    </td>
                    <td className="p-4 text-slate-300">{b.rating ? `★ ${b.rating.toFixed(1)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
