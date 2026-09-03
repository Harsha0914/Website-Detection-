import React from 'react';
import { SearchX, Store } from 'lucide-react';

export function EmptyState({
  title = 'No shops found',
  description = 'Try widening your search distance or choosing a different category.',
  actionLabel = null,
  onAction = null,
  icon: Icon = SearchX,
}) {
  return (
    <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
