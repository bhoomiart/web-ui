/**
 * lib/cart/types.ts
 *
 * Types shared by the cart API, the server cart and the client store.
 * No server-only imports here.
 */

export type LineStatus = 'ok' | 'low_stock' | 'adjusted' | 'out_of_stock' | 'unavailable';

/** What a client may send for a cart line. Prices are never accepted. */
export interface CartLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface ValidatedLine {
  /** `${productId}::${variantId ?? 'base'}` */
  key: string;
  /** cart_items.id for server carts, undefined for guest validation */
  itemId?: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  slug: string;
  sku?: string | null;
  image: string | null;
  availabilityType: string;
  /** Fresh price from the database. null when the line is unavailable. */
  unitPrice: number | null;
  /** Quantity the caller asked for. */
  requestedQty: number;
  /** Quantity after capping to stock. This is what totals use. */
  quantity: number;
  /** Units that can be bought now. null means not stock-limited. */
  availableQty: number | null;
  /** Highest quantity the stepper may offer. */
  maxQty: number;
  status: LineStatus;
  message: string | null;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  /** null until a delivery state is known */
  shippingFee: number | null;
  discount: number;
  total: number;
  shippingPending: boolean;
  /** Amount still needed for free shipping, null if not applicable */
  freeShippingRemaining: number | null;
  shippingState: string | null;
}

export interface CartSnapshot {
  lines: ValidatedLine[];
  totals: CartTotals;
  /** Total units across purchasable lines */
  itemCount: number;
  /** True only when every line is ok or low_stock at the requested quantity */
  checkoutReady: boolean;
}

/**
 * Live availability for one product, as shown on cards and the product page.
 * `null` means "not stock-limited" (made-to-order, or tracking switched off).
 */
export interface StockInfo {
  productId: string;
  availabilityType: string;
  hasVariants: boolean;
  /** Units available for the product without a variant */
  availableQty: number | null;
  /** Units available per usable variant id */
  variants: Record<string, number | null>;
}

export interface MergeReport {
  added: number;
  trimmed: Array<{ name: string; requested: number; kept: number }>;
  skipped: Array<{ name: string; reason: string }>;
}

export function cartLineKey(productId: string, variantId?: string | null): string {
  return `${productId}::${variantId ?? 'base'}`;
}

/** A line the customer can buy exactly as requested. Checkout requires this for every line. */
export function isPurchasable(status: LineStatus): boolean {
  return status === 'ok' || status === 'low_stock';
}

/**
 * A line that has a real quantity and price, so it counts in the displayed
 * subtotal. 'adjusted' lines count at their reduced quantity, but they still
 * block checkout until the customer accepts the change.
 */
export function countsTowardTotal(status: LineStatus): boolean {
  return status !== 'out_of_stock' && status !== 'unavailable';
}
