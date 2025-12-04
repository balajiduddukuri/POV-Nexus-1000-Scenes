import React, { useEffect } from 'react';
import { ToastMessage, ThemeMode } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
  theme: ThemeMode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast, theme }) => {
  return (
    <div 
      className="fixed bottom-8 right-4 z-[200] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} theme={theme} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: () => void; theme: ThemeMode }> = ({ toast, onRemove, theme }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const isHighContrast = theme === 'high-contrast';
  
  const bgColors = {
    success: isHighContrast ? 'bg-black border-2 border-white' : 'bg-green-900/95 border border-green-500/50 shadow-green-900/20',
    error: isHighContrast ? 'bg-white text-black border-4 border-black' : 'bg-red-900/95 border border-red-500/50 shadow-red-900/20',
    info: isHighContrast ? 'bg-black border-2 border-white' : 'bg-slate-800/95 border border-slate-600/50 shadow-slate-900/50'
  };

  return (
    <div 
      className={`
        pointer-events-auto px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] 
        transform transition-all duration-300 translate-y-0 opacity-100
        ${bgColors[toast.type]} ${isHighContrast ? '' : 'backdrop-blur-md text-white'}
      `}
      role="alert"
    >
      <div className={`p-1 rounded-full ${isHighContrast ? 'border border-current' : 'bg-white/10'}`}>
        <span className="text-lg block w-6 h-6 text-center leading-6">
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '!'}
          {toast.type === 'info' && 'i'}
        </span>
      </div>
      <p className="text-sm font-bold tracking-wide">{toast.message}</p>
    </div>
  );
};

export default ToastContainer;