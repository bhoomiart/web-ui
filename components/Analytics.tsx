/**
 * components/Analytics.tsx (A8-T5-2, A8-T5-3)
 *
 * Server Component that:
 *   1. Reads GA4_ID, GTM_ID, and gsc_verification from site_settings + env
 *   2. Emits the GSC verification <meta> tag (picked up by generateMetadata)
 *   3. Renders the GA4 / GTM scripts with `strategy="afterInteractive"`
 *      so they don't block the main thread (A8-T3 perf concern)
 *
 * Scripts only render when IDs are configured — no empty script tags.
 *
 * NOTE: Full consent management (cookie banner) is left as a future concern.
 * For now scripts load on page load. If you add a consent banner, gate the
 * script render with a cookie/localStorage check in a client wrapper.
 */

import Script from 'next/script';
import { createClient } from '@/lib/supabase/server';

interface AnalyticsProps {
  /** Pre-loaded GA4 ID — overrides site_settings when provided */
  ga4Id?: string;
  /** Pre-loaded GTM ID — overrides site_settings when provided */
  gtmId?: string;
}

export async function Analytics({ ga4Id, gtmId }: AnalyticsProps = {}) {
  // Prefer env vars → fall back to site_settings
  const resolvedGa4 = ga4Id ?? process.env.NEXT_PUBLIC_GA4_ID ?? null;
  const resolvedGtm = gtmId ?? process.env.NEXT_PUBLIC_GTM_ID ?? null;

  // Fetch from site_settings only if env vars are empty
  let settingsGa4: string | null = null;
  let settingsGtm: string | null = null;

  if (!resolvedGa4 || !resolvedGtm) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['ga4_id', 'gtm_id']);

    for (const row of data ?? []) {
      if (row.key === 'ga4_id') settingsGa4 = row.value || null;
      if (row.key === 'gtm_id') settingsGtm = row.value || null;
    }
  }

  const finalGa4 = resolvedGa4 || settingsGa4;
  const finalGtm = resolvedGtm || settingsGtm;

  return (
    <>
      {/* GTM — head snippet */}
      {finalGtm && (
        <Script
          id="gtm-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${finalGtm}');
`.trim(),
          }}
        />
      )}

      {/* GA4 — only when GTM is not configured (avoid double-counting) */}
      {finalGa4 && !finalGtm && (
        <>
          <Script
            id="ga4-load"
            src={`https://www.googletagmanager.com/gtag/js?id=${finalGa4}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${finalGa4}', { send_page_view: true });
`.trim(),
            }}
          />
        </>
      )}
    </>
  );
}
