'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

// ─── Focus trap hook ──────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  React.useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Move focus into modal
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [active, ref]);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Prevents closing on backdrop click when true */
  persistent?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  /** Extra classes on the panel */
  className?: string;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  persistent = false,
  size = 'md',
  children,
  className = '',
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Portal mount — avoids SSR mismatch
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Focus trap
  useFocusTrap(panelRef, open);

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Keyboard close
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !persistent) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, persistent, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={
        'fixed inset-0 z-[var(--z-index-modal)] flex items-center justify-center p-4 ' +
        'animate-fade-in'
      }
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-brand-charcoal)]/60 backdrop-blur-sm"
        onClick={persistent ? undefined : onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={
          `relative w-full ${SIZE_CLASSES[size]} ` +
          'rounded-[var(--radius-modal)] bg-white ' +
          'shadow-[var(--shadow-modal)] ' +
          'animate-scale-in ' +
          className
        }
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-earth-100)]">
            <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-earth-900)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className={
                'rounded-[var(--radius-sm)] p-1.5 ' +
                'text-[var(--color-earth-400)] ' +
                'hover:bg-[var(--color-earth-100)] hover:text-[var(--color-earth-700)] ' +
                'transition-colors duration-[var(--duration-fast)] ' +
                'focus-visible:outline-none focus-visible:ring-2 ' +
                'focus-visible:ring-[var(--color-brand-primary)]'
              }
            >
              {/* ✕ close icon */}
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

Modal.displayName = 'Modal';
