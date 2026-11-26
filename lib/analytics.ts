/**
 * lib/analytics.ts (A8-T5-1)
 *
 * Type-safe analytics event definitions.
 * Push events via `trackEvent()` which routes to the active provider
 * (GA4 via gtag, or GTM dataLayer, depending on what's configured).
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('add_to_cart', { product_id: '...', value: 1200 });
 *
 * No events fire if gtag / dataLayer is not loaded (consent not given,
 * or Analytics component not mounted).
 */

// ─── Event definitions ────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | {
      name: 'product_view';
      params: { product_id: string; product_name: string; value?: number };
    }
  | {
      name: 'add_to_cart';
      params: {
        product_id: string;
        product_name: string;
        variant_id?: string;
        quantity: number;
        value: number;
        currency: 'INR';
      };
    }
  | {
      name: 'remove_from_cart';
      params: { product_id: string; product_name: string };
    }
  | {
      name: 'checkout_start';
      params: { item_count: number; value: number; currency: 'INR' };
    }
  | {
      name: 'order_submit';
      params: {
        order_number: string;
        item_count: number;
        value: number;
        currency: 'INR';
      };
    }
  | {
      name: 'whatsapp_click';
      params: {
        context: 'product_enquiry' | 'custom_order' | 'general' | 'order_confirm' | 'restock';
      };
    }
  | {
      name: 'review_submit';
      params: { product_id: string; rating: number };
    }
  | {
      name: 'search';
      params: { query: string; result_count?: number };
    }
  | {
      name: 'restock_subscribe';
      params: { product_id: string };
    };

// ─── Type-safe dispatch ───────────────────────────────────────────────────────

export function trackEvent<E extends AnalyticsEvent>(name: E['name'], params: E['params']): void {
  if (typeof window === 'undefined') return;

  // GA4 via gtag
  if (typeof (window as unknown as { gtag?: unknown }).gtag === 'function') {
    (window as unknown as { gtag: (event: string, name: string, params: unknown) => void }).gtag(
      'event',
      name,
      params
    );
  }

  // GTM dataLayer fallback
  if (Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event: name, ...params });
  }
}
