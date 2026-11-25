'use client';

/**
 * NotifyActions
 *
 * Per-subscriber action controls on the pending notifications page.
 *
 * Flow:
 *   1. Admin clicks "Open WhatsApp" → new tab opens with pre-filled message.
 *      Button state changes to "Mark Sent" to remind admin to confirm.
 *   2. Admin sends the WhatsApp message, comes back and clicks "Mark Sent".
 *   3. POST /api/admin/restock/notify records the notification and marks
 *      the subscription as "notified". Page refreshes.
 *
 * This two-step flow prevents accidental marking before the message is sent
 * and distinguishes "Open WhatsApp" from "Message confirmed sent" (A4-T6-4,
 * A4-T6-7, per spec note in A3-T7).
 */

import React from 'react';
import { useRouter } from 'next/navigation';

interface NotifyActionsProps {
  subscriptionId: string;
  inventoryId: string;
  whatsAppUrl: string | null;
  productName: string;
}

type Step = 'idle' | 'opened' | 'loading' | 'done' | 'error';

export function NotifyActions({
  subscriptionId,
  inventoryId,
  whatsAppUrl,
  productName,
}: NotifyActionsProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  async function handleMarkSent() {
    if (!inventoryId) {
      setErrorMsg('No inventory record found for this product.');
      setStep('error');
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/restock/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          inventory_id: inventoryId,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to record notification.');
        setStep('error');
        return;
      }

      setStep('done');
      router.refresh();
    } catch {
      setErrorMsg('Network error — please try again.');
      setStep('error');
    }
  }

  if (step === 'done') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[var(--font-size-xs)] font-semibold"
        style={{ color: 'var(--color-success)' }}
      >
        <svg
          aria-hidden="true"
          className="w-3.5 h-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sent
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-[var(--spacing-2)]">
        {/* Step 1 — always available if phone exists */}
        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setStep('opened')}
            className={`inline-flex items-center gap-1 px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
              step === 'opened'
                ? 'border-[var(--color-success)] text-[var(--color-success)] bg-[var(--color-success-light)]'
                : 'border-[var(--color-earth-200)] text-[var(--color-earth-700)] bg-white hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]'
            }`}
            aria-label={`Open WhatsApp to notify about ${productName}`}
          >
            {/* WhatsApp icon */}
            <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {step === 'opened' ? 'Opened' : 'Open WhatsApp'}
          </a>
        )}

        {/* Step 2 — only after WhatsApp was opened */}
        {step === 'opened' && (
          <button
            type="button"
            onClick={handleMarkSent}
            className="inline-flex items-center gap-1 px-[var(--spacing-3)] py-[var(--spacing-1)] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-semibold bg-[var(--color-brand-primary)] text-white border border-[var(--color-brand-primary)] hover:bg-[var(--color-earth-700)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
            aria-label={`Confirm notification sent for ${productName}`}
          >
            ✓ Mark Sent
          </button>
        )}

        {step === 'loading' && (
          <span className="text-[var(--font-size-xs)] text-[var(--color-earth-500)]">Saving…</span>
        )}
      </div>

      {step === 'error' && (
        <span className="text-[var(--font-size-xs)] text-[var(--color-error)]">{errorMsg}</span>
      )}
    </div>
  );
}
