import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {}
      <div 
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {}
      <div className="relative bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-ambient border-ghost overflow-hidden flex flex-col max-h-[90vh]">

        {}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface">
          <h2 className="text-xl font-display font-bold text-on-surface">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {}
        <div className="p-6 overflow-y-auto bg-surface-bright flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
