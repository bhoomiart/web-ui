'use client';

/**
 * StockAdjustModal
 *
 * Modal form for manually adjusting a product's stock quantity.
 * Calls PATCH /api/admin/inventory/[id] with action="adjust".
 *
 * Props:
 *   open          — whether the modal is visible
 *   onClose       — close handler
 *   onSuccess     — called after a successful adjustment; parent should revalidate
 *   inventoryId   — the inventory row UUID
 *   productName   — shown in the modal title
 *   availableStock — current available quantity (shown for context)
 */

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/Form';

interface StockAdjustModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryId: string;
  productName: string;
  availableStock: number;
}

const CHANGE_TYPE_OPTIONS = [
  { value: 'restock', label: 'Restock (received inventory)' },
  { value: 'production', label: 'New production batch' },
  { value: 'damaged', label: 'Damaged / write-off' },
  { value: 'manual_correction', label: 'Manual correction' },
  { value: 'return_restocked', label: 'Customer return restocked' },
];

export function StockAdjustModal({
  open,
  onClose,
  onSuccess,
  inventoryId,
  productName,
  availableStock,
}: StockAdjustModalProps) {
  type FormState = {
    mode: 'add' | 'remove';
    qty: string;
    changeType: string;
    reason: string;
    error: string | null;
  };

  const initialFormState: FormState = {
    mode: 'add',
    qty: '',
    changeType: 'restock',
    reason: '',
    error: null,
  };

  type FormAction =
    | { type: 'reset' }
    | { type: 'set_mode'; value: 'add' | 'remove' }
    | { type: 'set_qty'; value: string }
    | { type: 'set_change_type'; value: string }
    | { type: 'set_reason'; value: string }
    | { type: 'set_error'; value: string | null };

  function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
      case 'reset':
        return initialFormState;
      case 'set_mode':
        return {
          ...state,
          mode: action.value,
          changeType: action.value === 'add' ? 'restock' : 'damaged',
        };
      case 'set_qty':
        return { ...state, qty: action.value };
      case 'set_change_type':
        return { ...state, changeType: action.value };
      case 'set_reason':
        return { ...state, reason: action.value };
      case 'set_error':
        return { ...state, error: action.value };
    }
  }

  const [form, dispatch] = React.useReducer(formReducer, initialFormState);
  const { mode, qty, changeType, reason, error } = form;
  const [loading, setLoading] = React.useState(false);

  // Reset form when modal opens — dispatch is stable so this doesn't trigger the
  // react-hooks/set-state-in-effect lint rule (which only flags useState setters)
  React.useEffect(() => {
    if (open) {
      dispatch({ type: 'reset' });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'set_error', value: null });

    const qtyNum = parseInt(qty, 10);
    if (!qtyNum || qtyNum <= 0) {
      dispatch({ type: 'set_error', value: 'Quantity must be a positive whole number.' });
      return;
    }

    const changeQty = mode === 'remove' ? -qtyNum : qtyNum;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${inventoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          change_qty: changeQty,
          change_type: changeType,
          reason: reason.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        dispatch({ type: 'set_error', value: data.error ?? 'Something went wrong.' });
        return;
      }

      onSuccess();
      onClose();
    } catch {
      dispatch({ type: 'set_error', value: 'Network error — please try again.' });
    } finally {
      setLoading(false);
    }
  }

  // Filter change type options by mode (can't "restock" a removal, etc.)
  const filteredOptions =
    mode === 'add'
      ? CHANGE_TYPE_OPTIONS.filter((o) =>
          ['restock', 'production', 'manual_correction', 'return_restocked'].includes(o.value)
        )
      : CHANGE_TYPE_OPTIONS.filter((o) => ['damaged', 'manual_correction'].includes(o.value));

  return (
    <Modal open={open} onClose={onClose} title={`Adjust Stock — ${productName}`} size="md">
      <div className="text-[var(--font-size-sm)] text-[var(--color-earth-500)] mb-[var(--spacing-5)]">
        Current available stock:{' '}
        <span className="font-semibold text-[var(--color-earth-800)]">{availableStock}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Add / Remove toggle */}
        <div className="mb-[var(--spacing-5)]">
          <p className="text-[var(--font-size-sm)] font-semibold text-[var(--color-earth-700)] mb-[var(--spacing-2)]">
            Adjustment type
          </p>
          <div className="flex gap-[var(--spacing-3)]">
            <label className="flex items-center gap-[var(--spacing-2)] cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="add"
                checked={mode === 'add'}
                onChange={() => dispatch({ type: 'set_mode', value: 'add' })}
                className="accent-[var(--color-brand-primary)]"
              />
              <span className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                Add stock
              </span>
            </label>
            <label className="flex items-center gap-[var(--spacing-2)] cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="remove"
                checked={mode === 'remove'}
                onChange={() => dispatch({ type: 'set_mode', value: 'remove' })}
                className="accent-[var(--color-brand-primary)]"
              />
              <span className="text-[var(--font-size-sm)] text-[var(--color-earth-700)]">
                Remove stock
              </span>
            </label>
          </div>
        </div>

        {/* Quantity */}
        <FormField label="Quantity" htmlFor="adjust-qty" required className="mb-[var(--spacing-4)]">
          <Input
            id="adjust-qty"
            type="number"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => dispatch({ type: 'set_qty', value: e.target.value })}
            placeholder="e.g. 10"
            required
          />
        </FormField>

        {/* Reason type */}
        <FormField
          label="Reason"
          htmlFor="adjust-change-type"
          required
          className="mb-[var(--spacing-4)]"
        >
          <Select
            id="adjust-change-type"
            value={changeType}
            onChange={(e) => dispatch({ type: 'set_change_type', value: e.target.value })}
          >
            {filteredOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Optional notes */}
        <FormField
          label="Notes (optional)"
          htmlFor="adjust-reason"
          className="mb-[var(--spacing-6)]"
        >
          <Textarea
            id="adjust-reason"
            value={reason}
            onChange={(e) => dispatch({ type: 'set_reason', value: e.target.value })}
            placeholder="e.g. Received 20 units from supplier, 2 found damaged on inspection"
            rows={3}
          />
        </FormField>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-[var(--spacing-4)] px-[var(--spacing-4)] py-[var(--spacing-3)] rounded-[var(--radius-md)] bg-[var(--color-error-light)] text-[var(--color-error)] text-[var(--font-size-sm)]"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-[var(--spacing-3)]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {mode === 'add' ? 'Add Stock' : 'Remove Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
