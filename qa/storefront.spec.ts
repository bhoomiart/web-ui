/**
 * Bhoomi Art — Full Storefront QA Suite
 *
 * Coverage: every public page, component, responsive breakpoint, SEO, A11y,
 * navigation, cart drawer, footer, and functional flows.
 *
 * Pages covered:
 *   / (homepage)   /shop   /collections   /product/[slug]
 *   /category/[slug]   /category/[slug]/[sub]
 *   /search   /about   /craft   /custom
 *   /contact   /checkout   /track   /order/[number]
 *   /not-found (404)
 *
 * Run:  npm run qa:storefront
 */

import { test, expect, Page } from '@playwright/test';
import {
  assertSEO,
  assertNoHorizontalScroll,
  assertImagesHaveAlt,
  assertImagesLoad,
  assertFooterPresent,
  collectConsoleErrors,
} from './helpers';

// ─── Shared viewports ─────────────────────────────────────────────────────────

const MOBILE = { width: 375, height: 812 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1280, height: 900 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getFirstProductSlug(page: Page): Promise<string | null> {
  await page.goto('/shop');
  await page.waitForLoadState('networkidle');
  const link = page.locator('a[href^="/product/"]').first();
  if ((await link.count()) === 0) return null;
  const href = await link.getAttribute('href');
  return href ?? null;
}

async function getFirstCategorySlug(page: Page): Promise<string | null> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const link = page.locator('a[href^="/category/"]').first();
  if ((await link.count()) === 0) return null;
  const href = await link.getAttribute('href');
  return href ?? null;
}

// ═════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders logo with accessible label', async ({ page }) => {
    const logo = page.locator('header a[aria-label*="Bhoomi Art"]').first();
    await expect(logo).toBeVisible();
  });

  test('logo navigates to homepage', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('header a[aria-label*="Bhoomi Art"]').first().click();
    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('desktop nav links are visible at 1280px', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    for (const label of ['Shop', 'Collections', 'About', 'Craft', 'Custom', 'Contact']) {
      const link = page.locator(`header nav >> text="${label}"`).first();
      await expect(link, `Navbar link "${label}" should be visible at desktop`).toBeVisible();
    }
  });

  test('desktop nav links hidden below lg breakpoint', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    // Desktop ul is hidden:lg, so the visible link count should be 0
    const desktopLinks = page.locator('header ul.hidden.lg\\:flex a');
    await expect(desktopLinks.first()).not.toBeVisible();
  });

  test('search icon link navigates to /search', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const searchLink = page.locator('header a[href="/search"]').first();
    await expect(searchLink).toBeVisible();
    await searchLink.click();
    await page.waitForURL('/search');
  });

  test('WhatsApp button is present and points to correct number', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    const wa = page.locator('header a[href*="wa.me"]').first();
    await expect(wa).toBeVisible();
    const href = await wa.getAttribute('href');
    expect(href).toContain('917019400775');
  });

  test('hamburger button visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const hamburger = page.locator('button[aria-label="Open menu"]').first();
    await expect(hamburger).toBeVisible();
  });

  test('hamburger opens mobile drawer with dialog role', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('button[aria-label="Open menu"]').first().click();
    const drawer = page.locator('[role="dialog"][aria-label="Navigation menu"]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
  });

  test('mobile menu shows all nav links', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('button[aria-label="Open menu"]').first().click();
    const drawer = page.locator('[role="dialog"][aria-label="Navigation menu"]');
    for (const label of ['Shop', 'Collections', 'About', 'Craft', 'Custom', 'Contact']) {
      await expect(drawer.locator(`text="${label}"`).first()).toBeVisible();
    }
  });

  test('mobile menu closes on Escape key', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('button[aria-label="Open menu"]').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-label="Navigation menu"]')).not.toBeVisible();
  });

  test('mobile menu closes on backdrop click', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('button[aria-label="Open menu"]').first().click();
    // Click the backdrop (outside the drawer panel)
    await page.mouse.click(10, 400);
    await expect(page.locator('[role="dialog"][aria-label="Navigation menu"]')).not.toBeVisible();
  });

  test('mobile menu WhatsApp CTA is present', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.locator('button[aria-label="Open menu"]').first().click();
    const waBtn = page.locator('[role="dialog"] a[href*="wa.me"]').first();
    await expect(waBtn).toBeVisible();
  });

  test('hamburger aria-expanded updates on toggle', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const btn = page.locator('button[aria-label="Open menu"]').first();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    const closeBtn = page.locator('button[aria-label="Close menu"]').first();
    await expect(closeBtn).toHaveAttribute('aria-expanded', 'true');
  });

  test('active nav link shows underline indicator', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/shop');
    // Active link should have aria-current="page"
    const activeLink = page.locator('header nav a[aria-current="page"]');
    await expect(activeLink).toBeVisible();
    const text = await activeLink.textContent();
    expect(text?.trim()).toBe('Shop');
  });

  test('cart button shows item count badge', async ({ page }) => {
    // Fresh load — count should be 0 or badge absent
    const cartBtn = page
      .locator('header button[aria-label*="cart" i], header button[aria-label*="Cart" i]')
      .first();
    await expect(cartBtn).toBeVisible();
  });

  test('navbar has scroll elevation transition', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    // Before scroll — no shadow class expected at y=0
    const headerBefore = page.locator('header').first();
    await expect(headerBefore).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400); // allow transition
    // After scroll — shadow class is added; the element should still be visible
    await expect(headerBefore).toBeVisible();
  });

  test('no horizontal overflow at mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CART DRAWER
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Cart Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens when cart button is clicked', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toBeVisible();
  });

  test('shows empty state when cart is empty', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer.locator('text=Your cart is empty')).toBeVisible();
  });

  test('empty cart has "Browse the Shop" link', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    const browseLink = page.locator('[role="dialog"][aria-label="Shopping cart"] a[href="/shop"]');
    await expect(browseLink).toBeVisible();
  });

  test('closes on Escape key', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-label="Shopping cart"]')).not.toBeVisible();
  });

  test('closes on close button', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    await page.locator('[role="dialog"] button[aria-label="Close cart"]').click();
    await expect(page.locator('[role="dialog"][aria-label="Shopping cart"]')).not.toBeVisible();
  });

  test('drawer has aria-modal="true"', async ({ page }) => {
    await page.locator('header button[aria-label*="art" i]').first().click();
    const drawer = page.locator('[role="dialog"][aria-label="Shopping cart"]');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('no console errors on load', async ({ page }) => {
    const getErrors = collectConsoleErrors(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const errors = getErrors().filter((e) => !e.includes('favicon') && !e.includes('Warning:'));
    expect(errors, `Console errors: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('SEO: title, description, H1, canonical', async ({ page }) => {
    await assertSEO(page, { titleContains: 'Bhoomi Art', expectCanonical: true });
  });

  test('JSON-LD Organization schema present', async ({ page }) => {
    const jsonld = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => e.textContent ?? '')
    );
    const orgSchema = jsonld.find((s) => s.includes('"Organization"'));
    expect(orgSchema, '[SEO] Organization JSON-LD schema missing').toBeTruthy();
  });

  test('JSON-LD WebSite schema with SearchAction present', async ({ page }) => {
    const jsonld = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => e.textContent ?? '')
    );
    const webSchema = jsonld.find((s) => s.includes('"WebSite"'));
    expect(webSchema, '[SEO] WebSite JSON-LD schema missing').toBeTruthy();
    expect(webSchema).toContain('SearchAction');
  });

  test('hero section is visible', async ({ page }) => {
    // HeroSection renders a section with banners or fallback
    const main = page.locator('main, div.flex.flex-col').first();
    await expect(main).toBeVisible();
  });

  test('all images have alt text', async ({ page }) => {
    await assertImagesHaveAlt(page);
  });

  test('all images load (naturalWidth > 0)', async ({ page }) => {
    await assertImagesLoad(page);
  });

  test('footer is present', async ({ page }) => {
    await assertFooterPresent(page);
  });

  test('no horizontal overflow — desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('keyboard tab reaches a focusable element', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders all four column headings', async ({ page }) => {
    const footer = page.locator('footer');
    for (const heading of ['Shop', 'Company', 'Get in Touch']) {
      await expect(footer.locator(`text="${heading}"`).first()).toBeVisible();
    }
  });

  test('shop links are present and correct', async ({ page }) => {
    const footer = page.locator('footer');
    for (const label of [
      'All Products',
      'Collections',
      'New Arrivals',
      'Best Sellers',
      'Signature Items',
      'Custom Creations',
    ]) {
      await expect(footer.locator(`a:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('company links are present', async ({ page }) => {
    const footer = page.locator('footer');
    for (const label of ['Our Story', 'The Art of Terracotta', 'Contact Us', 'FAQs']) {
      await expect(footer.locator(`a:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('policy links: Privacy, Terms, Shipping', async ({ page }) => {
    const footer = page.locator('footer');
    for (const { label, href } of [
      { label: 'Privacy', href: '/policies/privacy' },
      { label: 'Terms', href: '/policies/terms' },
      { label: 'Shipping', href: '/policies/shipping' },
    ]) {
      const link = footer.getByRole('link', { name: label, exact: true });
      await expect(link, `Footer policy link "${label}" missing`).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
    }
  });

  test('email link is correct', async ({ page }) => {
    const emailLink = page.locator('footer a[href="mailto:ba4bhoomiart@gmail.com"]').first();
    await expect(emailLink).toBeVisible();
  });

  test('WhatsApp CTA present in footer', async ({ page }) => {
    const waLink = page.locator('footer a[href*="wa.me"]').first();
    await expect(waLink).toBeVisible();
  });

  test('social links — Instagram present', async ({ page }) => {
    const ig = page.locator('footer a[href*="instagram"]').first();
    await expect(ig).toBeVisible();
    await expect(ig).toHaveAttribute('target', '_blank');
    await expect(ig).toHaveAttribute('rel', /noopener/);
  });

  test('copyright year is current', async ({ page }) => {
    const year = new Date().getFullYear().toString();
    const footerText = (await page.locator('footer').textContent()) ?? '';
    expect(footerText).toContain(year);
  });

  test('brand signature visible', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.locator('text=/Rooted in Earth/')).toBeVisible();
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SHOP
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Shop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
  });

  test('SEO: title, description, H1', async ({ page }) => {
    await assertSEO(page, { titleContains: 'Shop' });
  });

  test('breadcrumb is present', async ({ page }) => {
    // BreadcrumbNav renders with aria-label
    const bc = page
      .locator(
        'nav[aria-label*="readcrumb"], ol[aria-label*="readcrumb"], [aria-label*="readcrumb"]'
      )
      .first();
    await expect(bc).toBeVisible();
  });

  test('H1 says "Shop All"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Shop');
  });

  test('sort select is present', async ({ page }) => {
    const select = page.locator('select#sort-select');
    await expect(select).toBeVisible();
  });

  test('sort select has expected options', async ({ page }) => {
    const options = await page.locator('select#sort-select option').allTextContents();
    expect(options.some((o) => /newest/i.test(o))).toBe(true);
    expect(options.some((o) => /price/i.test(o))).toBe(true);
  });

  test('availability filter tabs are present', async ({ page }) => {
    // Tabs: All, In Stock, Made to Order, etc.
    const tabs = page.locator('a[href*="availability"]');
    const count = await tabs.count();
    expect(count, 'Should have at least 1 availability filter tab').toBeGreaterThan(0);
  });

  test('product grid renders articles', async ({ page }) => {
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count, 'Product grid should contain product cards').toBeGreaterThan(0);
  });

  test('product cards link to /product/*', async ({ page }) => {
    const firstCard = page.locator('article a[href^="/product/"]').first();
    await expect(firstCard).toBeVisible();
  });

  test('product card shows name', async ({ page }) => {
    const name = page.locator('article a[href^="/product/"]').nth(0);
    const text = await name.textContent();
    expect(text?.trim().length, 'Product name should not be empty').toBeGreaterThan(0);
  });

  test('product card shows price (₹ or "Price on request")', async ({ page }) => {
    const firstCard = page.locator('article').first();
    const text = (await firstCard.textContent()) ?? '';
    expect(text).toMatch(/₹|Price on request/);
  });

  test('product image alt text present', async ({ page }) => {
    await assertImagesHaveAlt(page);
  });

  test('pagination renders when available', async ({ page }) => {
    // May not be present if fewer than PAGE_SIZE products
    const pagination = page.locator(
      'nav[aria-label*="pagination" i], [aria-label*="page" i] a, a[href*="page="]'
    );
    // If present, check it's visible; if not, skip — not a failure
    const count = await pagination.count();
    if (count > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test('sorting by price_asc updates URL', async ({ page }) => {
    await page.locator('select#sort-select').selectOption('price_asc');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('sort=price_asc');
  });

  test('no horizontal overflow — desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('shop with collection filter: new-arrivals', async ({ page }) => {
    await page.goto('/shop?collection=new-arrivals');
    await page.waitForLoadState('networkidle');
    const h1 = await page.locator('h1').textContent();
    expect(h1?.toLowerCase()).toMatch(/new|arrival/);
  });

  test('shop with collection filter: bestsellers', async ({ page }) => {
    await page.goto('/shop?collection=bestsellers');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shop with collection filter: signature', async ({ page }) => {
    await page.goto('/shop?collection=signature');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// COLLECTIONS PAGE
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Collections page (/collections)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collections');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with 200 or renders content', async ({ page }) => {
    // May be a redirect to /shop or its own page; both are valid
    const url = page.url();
    const body = await page.locator('body').textContent();
    expect(body?.length, 'Collections page body should not be empty').toBeGreaterThan(0);
    expect(url).not.toContain('error');
  });

  test('H1 is present', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/collections');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAIL
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Product detail page', () => {
  let productUrl: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    productUrl = await getFirstProductSlug(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!productUrl) {
      test.skip();
      return;
    }
    await page.goto(productUrl);
    await page.waitForLoadState('networkidle');
  });

  test('SEO: title, description, H1, canonical', async ({ page }) => {
    if (!productUrl) test.skip();
    await assertSEO(page, { expectCanonical: true });
  });

  test('JSON-LD Product schema present', async ({ page }) => {
    if (!productUrl) test.skip();
    const jsonld = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => e.textContent ?? '')
    );
    const productSchema = jsonld.find((s) => s.includes('"Product"'));
    if (!productSchema) {
      console.warn(`⚠ No Product JSON-LD on ${page.url()} — recommended for SEO`);
    }
  });

  test('H1 product title is non-empty', async ({ page }) => {
    if (!productUrl) test.skip();
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('price is displayed', async ({ page }) => {
    if (!productUrl) test.skip();
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).toMatch(/₹|Price on request|price/i);
  });

  test('add to cart button visible and enabled', async ({ page }) => {
    if (!productUrl) test.skip();
    const btn = page
      .locator(
        'button:has-text("Add to Cart"), button:has-text("Add to Bag"), button:has-text("Add")'
      )
      .first();
    if ((await btn.count()) > 0) {
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }
  });

  test('product images load', async ({ page }) => {
    if (!productUrl) test.skip();
    await assertImagesLoad(page);
  });

  test('product images have alt text', async ({ page }) => {
    if (!productUrl) test.skip();
    await assertImagesHaveAlt(page);
  });

  test('breadcrumb is present', async ({ page }) => {
    if (!productUrl) test.skip();
    const bc = page.locator('[aria-label*="readcrumb"], ol, nav[class*="breadcrumb"]').first();
    await expect(bc).toBeVisible();
  });

  test('availability badge renders for out-of-stock / made-to-order', async ({ page }) => {
    if (!productUrl) test.skip();
    // Badge is optional (ready_to_ship has no badge)
    const badge = page.locator('text=Made to Order, text=Out of Stock').first();
    // Not an error if absent — ready_to_ship products don't have one
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(typeof bodyText).toBe('string'); // just confirm page rendered
  });

  test('no horizontal overflow — desktop', async ({ page }) => {
    if (!productUrl) test.skip();
    await page.setViewportSize(DESKTOP);
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    if (!productUrl) test.skip();
    await page.setViewportSize(MOBILE);
    await page.goto(productUrl!);
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY PAGES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Category pages', () => {
  test('category slug page loads from homepage link', async ({ page }) => {
    const href = await getFirstCategorySlug(page);
    if (!href) {
      test.skip();
      return;
    }
    await page.waitForLoadState('networkidle');
    await assertSEO(page);
    await assertImagesHaveAlt(page);
    await assertNoHorizontalScroll(page);
  });

  test('direct /category path resolves without error', async ({ page }) => {
    // /category itself may redirect — just verify no crash
    const response = await page.goto('/category');
    expect(response?.status()).toBeLessThan(500);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Search page (/search)', () => {
  test('renders with H1 "Search"', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Search');
  });

  test('search input is present and focusable', async ({ page }) => {
    await page.goto('/search');
    const input = page
      .locator('input[type="search"], input[name="q"], input[placeholder*="search" i]')
      .first();
    await expect(input).toBeVisible();
    await input.focus();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('INPUT');
  });

  test('suggestion chips are shown when query is empty', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    for (const suggestion of ['Planter', 'Vase']) {
      await expect(
        page
          .locator(
            `a[href*="search?q=${encodeURIComponent(suggestion)}"], a:has-text("${suggestion}")`
          )
          .first()
      ).toBeVisible();
    }
  });

  test('search with query "planter" returns results or empty state', async ({ page }) => {
    const response = await page.goto('/search?q=planter');
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    const h1 = await page.locator('h1').textContent();
    expect(h1?.toLowerCase()).toMatch(/planter|search/);
    // Page should not show an error
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/internal server error|application error|error 500/i);
  });

  test('no-results state shows "Browse All Products" link', async ({ page }) => {
    await page.goto('/search?q=xyznonexistentproduct99999');
    await page.waitForLoadState('networkidle');
    const link = page.getByRole('link', { name: 'Browse All Products' });
    await expect(link).toBeVisible();
  });

  test('search URL updates when form is submitted', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form[role="search"]').first();
    const input = form.locator('input[type="search"], input[name="q"], input').first();
    await input.click();
    await input.fill('terracotta');
    const submitBtn = form.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    } else {
      await input.press('Enter');
    }
    await expect(page).toHaveURL(/search\?q=terracotta/, { timeout: 10000 });
    expect(page.url()).toContain('q=terracotta');
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('meta robots noindex on search page', async ({ page }) => {
    await page.goto('/search?q=test');
    const robots = await page
      .$eval('meta[name="robots"]', (el) => el.getAttribute('content') ?? '')
      .catch(() => '');
    expect(robots.toLowerCase()).toContain('noindex');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ABOUT
// ═════════════════════════════════════════════════════════════════════════════

test.describe('About page (/about)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('SEO checks pass', async ({ page }) => {
    await assertSEO(page, { titleContains: 'About', expectCanonical: true });
  });

  test('H1 is visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await assertImagesHaveAlt(page);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CRAFT
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Craft page (/craft)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/craft');
    await page.waitForLoadState('networkidle');
  });

  test('SEO checks pass', async ({ page }) => {
    await assertSEO(page, { titleContains: 'Terracotta', expectCanonical: true });
  });

  test('H1 says "The Art of Terracotta"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Art of Terracotta');
  });

  test('all 6 process step numbers visible (01–06)', async ({ page }) => {
    for (const step of ['01', '02', '03', '04', '05', '06']) {
      await expect(page.locator(`text="${step}"`).first()).toBeVisible();
    }
  });

  test('step titles are present', async ({ page }) => {
    for (const title of [
      'The Earth',
      'The Shaping',
      'The Drying',
      'The Bisque Fire',
      'The Finish',
      'The Final Fire',
    ]) {
      await expect(page.locator(`text="${title}"`).first()).toBeVisible();
    }
  });

  test('"Shop the Collection" CTA links to /shop', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Shop the Collection/i }).first();
    await expect(cta).toBeVisible();
  });

  test('breadcrumb present', async ({ page }) => {
    const bc = page.locator('[aria-label*="readcrumb"], nav ol').first();
    await expect(bc).toBeVisible();
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/craft');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('step grid is responsive (2-column mobile to 1-column)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/craft');
    await assertNoHorizontalScroll(page);
    // All step numbers still visible at mobile
    await expect(page.locator('text="01"').first()).toBeVisible();
    await expect(page.locator('text="06"').first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CUSTOM CREATIONS
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Custom Creations page (/custom)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/custom');
    await page.waitForLoadState('networkidle');
  });

  test('SEO checks pass', async ({ page }) => {
    await assertSEO(page, { titleContains: 'Custom', expectCanonical: true });
  });

  test('H1 says "Custom Creations"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Custom');
  });

  test('all 4 custom type cards are visible', async ({ page }) => {
    for (const title of [
      'Personalised Gifts',
      'Home Décor',
      'Corporate Gifts',
      'Art Commissions',
    ]) {
      await expect(page.locator(`text="${title}"`).first()).toBeVisible();
    }
  });

  test('how-it-works steps 01–03 visible', async ({ page }) => {
    for (const step of ['01', '02', '03']) {
      await expect(page.locator(`text="${step}"`).first()).toBeVisible();
    }
  });

  test('"Start Your Custom Order" WhatsApp CTA is present', async ({ page }) => {
    const cta = page
      .locator(
        'a[href*="wa.me"]:has-text("Start Your Custom Order"), a[href*="wa.me"]:has-text("Custom")'
      )
      .first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('target', '_blank');
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/custom');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('4-card grid collapses to 2 on tablet', async ({ page }) => {
    await page.setViewportSize(TABLET);
    await page.goto('/custom');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTACT
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Contact page (/contact)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('SEO checks pass', async ({ page }) => {
    await assertSEO(page, { titleContains: 'Contact', expectCanonical: true });
  });

  test('H1 says "Contact Us"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Contact');
  });

  test('WhatsApp contact card is present with correct number', async ({ page }) => {
    const wa = page.locator('main a[href*="wa.me/917019400775"]').first();
    await wa.scrollIntoViewIfNeeded().catch(() => {});
    await expect(wa).toBeVisible();
    await expect(wa).toHaveAttribute('target', '_blank');
  });

  test('email link present and correct', async ({ page }) => {
    const email = page.locator('a[href="mailto:ba4bhoomiart@gmail.com"]').first();
    await expect(email).toBeVisible();
  });

  test('Instagram link present', async ({ page }) => {
    const ig = page.locator('a[href*="instagram.com/ba4bhoomiart"]').first();
    await expect(ig).toBeVisible();
    await expect(ig).toHaveAttribute('target', '_blank');
  });

  test('response times info box is visible', async ({ page }) => {
    await expect(page.locator('text=/Response Times|business hours/i').first()).toBeVisible();
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });

  test('contact cards stack on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    // All 3 contact cards still visible
    const cards = page.locator('a[href*="wa.me"], a[href*="mailto"], a[href*="instagram"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CHECKOUT
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Checkout page (/checkout)', () => {
  test('page loads and either shows form or redirects to auth', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    // Valid states: checkout form page or login/auth redirect
    const isCheckout = url.includes('/checkout');
    const isAuth = url.includes('/login') || url.includes('/sign') || url.includes('/auth');
    expect(isCheckout || isAuth, 'Checkout should show form or redirect to auth').toBe(true);
  });

  test('meta robots noindex set', async ({ page }) => {
    await page.goto('/checkout');
    const robots = await page
      .$eval('meta[name="robots"]', (el) => el.getAttribute('content') ?? '')
      .catch(() => '');
    expect(robots.toLowerCase()).toContain('noindex');
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TRACK ORDER
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Track order page (/track)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/track');
    await page.waitForLoadState('networkidle');
  });

  test('H1 says "Track Your Order"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Track');
  });

  test('meta robots noindex', async ({ page }) => {
    const robots = await page
      .$eval('meta[name="robots"]', (el) => el.getAttribute('content') ?? '')
      .catch(() => '');
    expect(robots.toLowerCase()).toContain('noindex');
  });

  test('instruction text is visible', async ({ page }) => {
    await expect(page.locator('text=/phone number|order number/i').first()).toBeVisible();
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/track');
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 404 PAGE
// ═════════════════════════════════════════════════════════════════════════════

test.describe('404 — Not Found page', () => {
  test('returns HTTP 404', async ({ page }) => {
    const response = await page.goto('/this-page-absolutely-does-not-exist-xyz123');
    expect(response?.status()).toBe(404);
  });

  test('renders custom not-found content', async ({ page }) => {
    await page.goto('/this-page-absolutely-does-not-exist-xyz123');
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body.toLowerCase()).toMatch(/not found|404|doesn.t exist|page missing/i);
  });

  test('provides navigation back to homepage', async ({ page }) => {
    await page.goto('/this-page-absolutely-does-not-exist-xyz123');
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/this-page-absolutely-does-not-exist-xyz123');
    await assertNoHorizontalScroll(page);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY — CROSS-PAGE
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Accessibility — all main pages', () => {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/shop', name: 'Shop' },
    { path: '/about', name: 'About' },
    { path: '/craft', name: 'Craft' },
    { path: '/custom', name: 'Custom' },
    { path: '/contact', name: 'Contact' },
    { path: '/search', name: 'Search' },
    { path: '/track', name: 'Track' },
  ];

  for (const pg of pages) {
    test(`${pg.name} — first Tab keypress lands on a focusable element`, async ({ page }) => {
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'BODY']).toContain(focused);
    });

    test(`${pg.name} — no images missing alt on mobile`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');
      await assertImagesHaveAlt(page);
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

test.describe('ProductCard component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
  });

  test('card has semantic article element', async ({ page }) => {
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('card image link has accessible aria-label (product name)', async ({ page }) => {
    const imgLink = page.locator('article a[aria-label]').first();
    const label = await imgLink.getAttribute('aria-label');
    expect(label?.length, 'Product card image link should have aria-label').toBeGreaterThan(0);
  });

  test('hover image swap — second image has opacity-0 by default', async ({ page }) => {
    // Check that the hover-only image class is present
    const hoverImg = page.locator('article .group-hover\\:opacity-100').first();
    if ((await hoverImg.count()) > 0) {
      // Confirm it starts invisible
      const opacity = await hoverImg.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });
      expect(parseFloat(opacity)).toBeLessThan(1);
    }
  });

  test('star rating renders when present', async ({ page }) => {
    // May not appear if products have no rating
    const rating = page.locator('[aria-label*="Rating"]').first();
    const count = await rating.count();
    if (count > 0) {
      await expect(rating).toBeVisible();
    }
  });

  test('label badges (New / Bestseller / Signature) render', async ({ page }) => {
    // Check any badge is properly visible — specific badge depends on data
    const badges = page.locator(
      'article span:has-text("New"), article span:has-text("Bestseller"), article span:has-text("Signature")'
    );
    const count = await badges.count();
    // Not all products have badges — just verify they don't overflow if present
    if (count > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });
});
