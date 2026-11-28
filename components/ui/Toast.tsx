'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  /** Auto-dismiss after ms. 0 = never. Default: 4000 */
  duration?: number;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
  success: {
    container: 'bg-white border-l-4 border-[var(--color-success)] text-[var(--color-success-dark)]',
    icon: (
      <svg
        className="w-5 h-5 text-[var(--color-success)]"
        fill="none"
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3 3 7-7" />
      </svg>
    ),
  },
  error: {
    container: 'bg-white border-l-4 border-[var(--color-error)] text-[var(--color-error-dark)]',
    icon: (
      <svg
        className="w-5 h-5 text-[var(--color-error)]"
        fill="none"
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M14 6l-8 8" />
      </svg>
    ),
  },
  info: {
    container: 'bg-white border-l-4 border-[var(--color-info)] text-[var(--color-info-dark)]',
    icon: (
      <svg
        className="w-5 h-5 text-[var(--color-info)]"
        fill="none"
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v5M10 6h.01" />
      </svg>
    ),
  },
  warning: {
    container: 'bg-white border-l-4 border-[var(--color-warning)] text-[var(--color-warning-dark)]',
    icon: (
      <svg
        className="w-5 h-5 text-[var(--color-warning)]"
        fill="none"
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 7v5M10 15h.01" />
      </svg>
    ),
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  add: (toast: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = React.useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.duration ?? 4000;
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      {mounted &&
        createPortal(<ToastContainer toasts={toasts} onDismiss={remove} />, document.body)}
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({
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
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
      className={
        'fixed bottom-[var(--spacing-6)] right-[var(--spacing-6)] ' +
        'z-[var(--z-index-toast)] flex flex-col gap-[var(--spacing-3)] ' +
        'w-full max-w-sm pointer-events-none'
      }
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Single toast ─────────────────────────────────────────────────────────────

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { container, icon } = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="alert"
      className={
        `${container} ` +
        'pointer-events-auto flex items-start gap-3 ' +
        'rounded-[var(--radius-md)] p-4 ' +
        'shadow-[var(--shadow-dropdown)] ' +
        'animate-slide-in-right'
      }
    >
      <span className="mt-0.5 shrink-0">{icon}</span>

      <div className="min-w-0 flex-1">
        <p className="text-[var(--font-size-sm)] font-semibold leading-snug text-[var(--color-earth-900)]">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-0.5 text-[var(--font-size-xs)] text-[var(--color-earth-600)]">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={
          'shrink-0 rounded p-1.5 -m-1 ' +
          'text-[var(--color-earth-600)] ' +
          'hover:text-[var(--color-earth-700)] ' +
          'focus-visible:outline-none focus-visible:ring-2 ' +
          'focus-visible:ring-[var(--color-brand-primary)]'
        }
      >
        <svg
          aria-hidden="true"
          className="w-3.5 h-3.5"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
