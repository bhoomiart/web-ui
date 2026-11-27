'use client';
import React from 'react';
import { trackEvent } from '@/lib/analytics';

export function ProductViewTracker({
  productId,
  productName,
  value,
}: {
  productId: string;
  productName: string;
  value?: number;
}) {
  React.useEffect(() => {
    trackEvent('product_view', { product_id: productId, product_name: productName, value });
  }, [productId, productName, value]);
  return null;
}
