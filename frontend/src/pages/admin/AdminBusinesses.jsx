import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { WebsiteStatusBadge } from '../../components/shops/WebsiteStatusBadge';
import api from '../../services/api';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingBiz, setEditingBiz] = useState(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.website_status = statusFilter;

      const res = await api.get('/admin/businesses', { params });
      setBusinesses(res.data);
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business record?')) return;
    try {
      await api.delete(`/admin/businesses/${id}`);
      setBusinesses(businesses.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete business', err);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingBiz) return;
    try {
      const res = await api.put(`/admin/businesses/${editingBiz.id}`, {
        website_status: editingBiz.website_status,
        website_quality: editingBiz.website_quality,
        website_score: parseInt(editingBiz.website_score) || 0,
      });
      setBusinesses(businesses.map((b) => (b.id === res.data.id ? res.data : b)));
      setEditingBiz(null);
    } catch (err) {
      console.error('Failed to update business', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Business Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View, audit, and manage all detected businesses and website classifications
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business by name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Website Statuses</option>
          <option value="WEBSITE_AVAILABLE">Website Available</option>
          <option value="NO_WEBSITE">No Website</option>
          <option value="WEBSITE_UNREACHABLE">Website Unreachable</option>
          <option value="WEBSITE_UNKNOWN">Website Unknown</option>
        </select>
      </div>

      {/* Businesses Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Fetching businesses..." />
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No businesses found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 font-bold">Business Name</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Website Status</th>
                  <th className="p-4 font-bold">Score</th>
                  <th className="p-4 font-bold">Website URL</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-white max-w-[200px] truncate">{b.name}</td>
                    <td className="p-4 text-slate-400">{b.category || 'N/A'}</td>
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
                    <td className="p-4 max-w-[180px] truncate">
                      {b.website_url ? (
                        <a
                          href={b.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{b.website_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingBiz(b)}
                          title="Edit classification"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          title="Delete business"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-slate-200">
            <h3 className="text-sm font-bold text-white">Edit Classification: {editingBiz.name}</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Website Status</label>
                <select
                  value={editingBiz.website_status}
                  onChange={(e) => setEditingBiz({ ...editingBiz, website_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl"
                >
                  <option value="WEBSITE_AVAILABLE">WEBSITE_AVAILABLE</option>
                  <option value="NO_WEBSITE">NO_WEBSITE</option>
                  <option value="WEBSITE_UNREACHABLE">WEBSITE_UNREACHABLE</option>
                  <option value="WEBSITE_UNKNOWN">WEBSITE_UNKNOWN</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quality Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingBiz.website_score || 0}
                  onChange={(e) => setEditingBiz({ ...editingBiz, website_score: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
