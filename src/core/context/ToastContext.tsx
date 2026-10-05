import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import './ToastContext.css';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 120);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', durationMs = 3000, action?: ToastAction) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, message, type, isExiting: false, action };

    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

    if (durationMs > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toiloki-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toiloki-toast toast-${toast.type} ${toast.isExiting ? 'is-exiting' : ''}`}
            role="alert"
          >
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              {toast.type === 'warning' && <AlertTriangle size={16} />}
              {toast.type === 'error' && <XCircle size={16} />}
            </div>
            <span className="toast-message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
              type="button"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      showToast: (msg: string) => console.log('[Toast]', msg),
    };
  }
  return ctx;
};
