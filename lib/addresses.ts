/**
 * lib/addresses.ts
 *
 * Saved delivery addresses: the shape the browser sees and the one validation
 * routine used by every route that writes an address. Pure code, safe on both sides.
 */
import { isIndiaState } from '@/lib/india-states';

export interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

/** Columns returned to the browser. */
export const ADDRESS_COLUMNS =
  'id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, is_default';

export interface AddressInput {
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
}

export type AddressParse =
  { ok: true; value: AddressInput } | { ok: false; error: string; field: string };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validate a full address. Every route that saves an address goes through this. */
export function parseAddress(raw: Record<string, unknown>): AddressParse {
  const full_name = text(raw.full_name, 120);
  const phone = text(raw.phone, 20).replace(/\s/g, '');
  const address_line1 = text(raw.address_line1, 200);
  const city = text(raw.city, 80);
  const state = text(raw.state, 60);
  const postal_code = text(raw.postal_code, 6);

  if (!full_name) return { ok: false, error: 'Full name is required.', field: 'full_name' };
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    return { ok: false, error: 'Enter a valid phone number (10 to 15 digits).', field: 'phone' };
  }
  if (!address_line1) {
    return { ok: false, error: 'Address line 1 is required.', field: 'address_line1' };
  }
  if (!city) return { ok: false, error: 'City is required.', field: 'city' };
  if (!state || !isIndiaState(state)) {
    return { ok: false, error: 'Select a state.', field: 'state' };
  }
  if (!/^[1-9][0-9]{5}$/.test(postal_code)) {
    return { ok: false, error: 'Enter a valid 6-digit postal code.', field: 'postal_code' };
  }

  return {
    ok: true,
    value: {
      label: text(raw.label, 40) || null,
      full_name,
      phone,
      address_line1,
      address_line2: text(raw.address_line2, 200) || null,
      city,
      state,
      postal_code,
    },
  };
}
