import React from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isClaim = toast.type === 'claim';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-fadeIn ${
              isClaim
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-medium'
                : isSuccess
                ? 'bg-emerald-800 text-white border-emerald-700'
                : isError
                ? 'bg-rose-800 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="mt-0.5">
              {isClaim ? (
                <Sparkles className="w-5 h-5 text-amber-200 fill-current" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5 text-rose-300" />
              ) : (
                <Info className="w-5 h-5 text-slate-300" />
              )}
            </div>

            <div className="flex-1 text-xs">
              {toast.title && <div className="font-extrabold text-sm mb-0.5">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

