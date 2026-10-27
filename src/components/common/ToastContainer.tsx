import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded bg-[#FFFFFF] text-[#142536] shadow-lg border border-[#E5E3DC] transition-all duration-200"
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#1D7055]" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-[#C4841D]" />}
              {isError && <AlertCircle className="w-4 h-4 text-[#E74732]" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#4A4A46]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold tracking-tight text-[#142536] font-sans">{toast.title}</h4>
              <p className="text-[11px] text-[#77766F] mt-0.5 leading-relaxed font-sans">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-[#77766F] hover:text-[#142536] p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
