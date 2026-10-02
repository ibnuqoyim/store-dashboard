'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, action?: ToastAction) => void;
  success: (message: string, title?: string, action?: ToastAction) => void;
  error: (message: string, title?: string, action?: ToastAction) => void;
  info: (message: string, title?: string, action?: ToastAction) => void;
  toast: {
    success: (message: string, title?: string, action?: ToastAction) => void;
    error: (message: string, title?: string, action?: ToastAction) => void;
    info: (message: string, title?: string, action?: ToastAction) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const duration = toast.duration ?? (toast.action ? 6000 : 4000);
  const onDismissRef = React.useRef(onDismiss);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      onDismissRef.current(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, isPaused]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-600 shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-200 bg-white ring-1 ring-emerald-500/10 shadow-lg',
    error: 'border-rose-200 bg-white ring-1 ring-rose-500/10 shadow-lg',
    info: 'border-amber-200 bg-white ring-1 ring-amber-500/10 shadow-lg',
  };

  return (
    <div
      role="alert"
      data-toast={toast.type}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`flex items-start gap-3 p-3.5 rounded-xl border max-w-sm w-full transition-all duration-300 pointer-events-auto ${borderStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h5 className="font-bold text-xs text-gray-900 leading-tight mb-0.5">{toast.title}</h5>
        )}
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line break-words">
          {toast.message}
        </p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition inline-flex items-center cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-0.5 rounded-lg transition cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full sm:w-auto px-2 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItemComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, action?: ToastAction) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    setToasts((prev) => [...prev, { id, type, title, message, action }]);
  }, []);

  const success = useCallback(
    (message: string, title?: string, action?: ToastAction) => {
      showToast(message, 'success', title, action);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, action?: ToastAction) => {
      showToast(message, 'error', title, action);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, action?: ToastAction) => {
      showToast(message, 'info', title, action);
    },
    [showToast]
  );

  const contextValue: ToastContextValue = {
    showToast,
    success,
    error,
    info,
    toast: { success, error, info },
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    console.warn('[useToast] useToast called outside ToastProvider; fallback alert active');
    const fallbackAlert = (msg: string) => {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(msg);
      } else {
        console.warn('[Toast fallback alert]:', msg);
      }
    };
    return {
      showToast: (msg) => fallbackAlert(msg),
      success: (msg) => fallbackAlert(msg),
      error: (msg) => fallbackAlert(msg),
      info: (msg) => fallbackAlert(msg),
      toast: {
        success: (msg) => fallbackAlert(msg),
        error: (msg) => fallbackAlert(msg),
        info: (msg) => fallbackAlert(msg),
      },
    };
  }
  return ctx;
}
