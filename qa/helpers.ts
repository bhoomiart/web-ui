/**
 * Shared QA helper utilities for Bhoomi Art test suite.
 */
import { Page, expect } from '@playwright/test';

// ─── SEO ─────────────────────────────────────────────────────────────────────

export async function assertSEO(
  page: Page,
  opts: { titleContains?: string; expectCanonical?: boolean } = {}
) {
  const title = await page.title();
  expect(title.length, `[SEO] Page title missing on ${page.url()}`).toBeGreaterThan(0);
  if (opts.titleContains) {
    expect(title, `[SEO] Title should contain "${opts.titleContains}"`).toContain(
      opts.titleContains
    );
  }

  const metaDesc = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute('content') ?? '')
    .catch(() => '');
  expect(metaDesc.length, `[SEO] Meta description missing on ${page.url()}`).toBeGreaterThan(0);

  const h1Count = await page.locator('h1').count();
  expect(h1Count, `[SEO] Expected exactly 1 H1 on ${page.url()}`).toBe(1);

  if (opts.expectCanonical) {
    const canonical = await page
      .$eval('link[rel="canonical"]', (el) => el.getAttribute('href') ?? '')
      .catch(() => '');
    expect(canonical.length, `[SEO] Canonical tag missing on ${page.url()}`).toBeGreaterThan(0);
  }
}

// ─── Responsiveness ───────────────────────────────────────────────────────────

export async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    `[Responsive] Horizontal overflow on ${page.url()} at viewport ${overflow.clientWidth}px`
  ).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function assertImagesHaveAlt(page: Page) {
  const imgs = page.locator('img');
  const count = await imgs.count();
  for (let i = 0; i < count; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    const src = (await imgs.nth(i).getAttribute('src')) ?? 'unknown';
    // aria-hidden images are exempt
    const ariaHidden = await imgs.nth(i).getAttribute('aria-hidden');
    if (ariaHidden === 'true') continue;
    expect(alt, `[A11y] Image missing alt text: ${src}`).not.toBeNull();
  }
}

export async function assertImagesLoad(page: Page) {
  // Set all lazy images to eager so the browser loads them without needing manual scrolling
  await page
    .evaluate(() => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        (img as HTMLImageElement).loading = 'eager';
      });
    })
    .catch(() => {});

  const results = await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    return Promise.all(
      images.map(async (img) => {
        const src = img.currentSrc || img.src || img.getAttribute('src') || '';
        if (
          !src ||
          src.startsWith('data:') ||
          img.closest('[inert], .invisible, [aria-hidden="true"], [hidden]') ||
          (img.offsetParent === null && img.offsetWidth === 0 && img.offsetHeight === 0)
        ) {
          return { src, naturalWidth: 1, skipped: true };
        }
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2500);
          });
        }
        return {
          src,
          naturalWidth: img.naturalWidth,
          skipped: false,
        };
      })
    );
  });

  for (const res of results) {
    if (res.skipped) continue;
    expect(res.naturalWidth, `[IMG] Image failed to load: ${res.src}`).toBeGreaterThan(0);
  }
}

// ─── Console errors ───────────────────────────────────────────────────────────

export function collectConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return () => errors;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export async function assertBreadcrumbPresent(page: Page) {
  const breadcrumb = page
    .locator(
      'nav[aria-label*="breadcrumb" i], ol[aria-label*="breadcrumb" i], [data-testid="breadcrumb"]'
    )
    .first();
  await expect(breadcrumb, '[Nav] Breadcrumb should be present').toBeVisible();
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export async function assertFooterPresent(page: Page) {
  const footer = page.locator('footer').first();
  await expect(footer, '[Layout] Footer should be visible').toBeVisible();

  // Copyright text
  const footerText = (await footer.textContent()) ?? '';
  expect(footerText, '[Footer] Should contain brand name').toContain('Bhoomi Art');
}
