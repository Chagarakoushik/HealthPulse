import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-slide-up">
      <div
        className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
          isSuccess
            ? 'bg-white border-emerald-200 text-emerald-900'
            : isError
            ? 'bg-white border-rose-200 text-rose-900'
            : 'bg-white border-blue-200 text-blue-900'
        }`}
      >
        {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
        {isError && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
        {!isSuccess && !isError && <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}

        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
          {message}
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
