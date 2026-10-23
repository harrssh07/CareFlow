'use client';

import React from 'react';
import { useCareFlow } from '@/context/CareFlowContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useCareFlow();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
        let borderColor = 'border-emerald-200 bg-emerald-50';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
          borderColor = 'border-rose-200 bg-rose-50';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
          borderColor = 'border-amber-200 bg-amber-50';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />;
          borderColor = 'border-sky-200 bg-sky-50';
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${borderColor}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-gray-900">{toast.title}</h4>
              <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
