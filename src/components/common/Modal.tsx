import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#080808]/85 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-xl bg-[#171923] text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidthClass} border border-[#2D3142]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2D3142] px-6 py-4 bg-[#171923]">
            <div>
              <h3 id="modal-title" className="text-xl font-serif text-white tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[#A0A0AA] mt-1 tracking-tight font-sans">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-[#A0A0AA] hover:bg-[#222431] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[82vh] overflow-y-auto bg-[#171923] text-white">{children}</div>
        </div>
      </div>
    </div>
  );
};
