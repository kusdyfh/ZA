'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@za/shared';

export type ToastTone = 'success' | 'danger' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

const TONE_ICON: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: AlertCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-success-500/30 text-success-500',
  danger: 'border-danger-500/30 text-danger-500',
  info: 'border-info-500/30 text-info-500',
};

/**
 * App-wide toast host per docs/09-DESIGN-SYSTEM.md — mount once near
 * the root, then call `useToast().showToast(...)` from anywhere (form
 * submit success/error, bulk-action confirmations).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // `document` already exists during the client's first (hydration) render,
  // so gating the portal on `typeof document !== 'undefined'` alone renders
  // it immediately on that pass — one render ahead of the server's markup,
  // which had no `document` and thus no portal content. That mismatch made
  // React discard and remount the whole tree on every page load. Deferring
  // to a post-mount effect keeps the first client render identical to the
  // server's, so the portal only appears after hydration has succeeded.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted &&
        createPortal(
          <div className="fixed bottom-4 end-4 z-[100] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((toast) => {
              const Icon = TONE_ICON[toast.tone];
              return (
                <div
                  key={toast.id}
                  role="status"
                  aria-live="polite"
                  className={cn(
                    'flex items-start gap-3 rounded-md border bg-white p-4 shadow-md dark:bg-neutral-900',
                    TONE_CLASSES[toast.tone],
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{toast.title}</p>
                    {toast.description && (
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{toast.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(toast.id)}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
