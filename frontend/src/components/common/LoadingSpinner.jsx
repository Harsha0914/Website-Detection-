import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} text-brand-600 animate-spin mb-3`} />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}
