/**
 * lib/cart/constants.ts
 *
 * Shared by server and client code. No server-only imports here.
 */

/** Show "Only N left in stock" when available stock is below this number. */
export const LOW_STOCK_DISPLAY_THRESHOLD = 5;

/** Hard cap per cart line, also used for made-to-order and untracked stock. */
export const MAX_LINE_QTY = 99;

/** Maximum distinct lines accepted in one request. */
export const MAX_CART_LINES = 50;

/** Fallback row in `shipping_rates` used when a state has no active rate. */
export const SHIPPING_FALLBACK_STATE = '*';
