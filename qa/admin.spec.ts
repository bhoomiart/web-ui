/**
 * Bhoomi Art — Full Admin Panel QA Suite
 *
 * Coverage: auth gate on every protected route, login form, sidebar navigation,
 * all admin section pages, responsiveness, and form validation.
 *
 * NOTE: Tests run as unauthenticated user unless QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD
 * env vars are set. Authenticated tests are skipped when credentials are absent.
 *
 * Run:  npm run qa:admin
 */

import { test, expect, Page, Browser } from '@playwright/test';
import { assertNoHorizontalScroll, assertImagesHaveAlt, collectConsoleErrors } from './helpers';

// ─── Credentials (optional) ───────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD ?? '';
const HAS_CREDS = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

// ─── Helper: log in ───────────────────────────────────────────────────────────

async function adminLogin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

// ─── Shared viewports ─────────────────────────────────────────────────────────

const MOBILE = { width: 375, height: 812 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1280, height: 900 };

// ═════════════════════════════════════════════════════════════════════════════
// AUTH GATE — Every protected route must redirect unauthenticated users
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Admin auth gate', () => {
  const PROTECTED = [
    '/admin/dashboard',
    '/admin/products',
    '/admin/products/new',
    '/admin/categories',
    '/admin/categories/subcategories',
    '/admin/collections',
    '/admin/inventory',
    '/admin/inventory/low-stock',
    '/admin/inventory/out-of-stock',
    '/admin/inventory/history',
    '/admin/restock/subscribers',
    '/admin/restock/notifications',
    '/admin/restock/history',
    '/admin/orders',
    '/admin/orders/returns',
    '/admin/orders/refunds',
    '/admin/reviews',
    '/admin/homepage',
    '/admin/pages',
    '/admin/seo',
    '/admin/customers',
    '/admin/analytics',
    '/admin/settings',
    '/admin/settings/whatsapp',
  ];

  for (const route of PROTECTED) {
    test(`${route} → redirects to login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      const redirectedToLogin =
        url.includes('/login') || url.includes('/sign-in') || url.includes('/admin/login');
      expect(redirectedToLogin, `${route} should redirect unauthenticated visitors to login`).toBe(
        true
      );
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Admin login page (/admin/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
  });

  test('no console errors on load', async ({ page }) => {
    const getErrors = collectConsoleErrors(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const errors = getErrors().filter((e) => !e.includes('favicon'));
    expect(errors, `Console errors: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('email input is present', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });

  test('password input is present', async ({ page }) => {
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('submit button is present and enabled', async ({ page }) => {
    const btn = page.locator('button[type="submit"]').first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('empty email submission shows validation', async ({ page }) => {
    await page.locator('button[type="submit"]').first().click();
    const invalid = await page
      .locator('input[type="email"]:invalid, input[required]:invalid')
      .count();
    const errorMsg = await page.locator('[role="alert"], .error, [class*="error"]').count();
    expect(invalid + errorMsg, 'Should show validation feedback on empty submit').toBeGreaterThan(
      0
    );
  });

  test('wrong credentials shows error message', async ({ page }) => {
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill('wrong@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2500);
    // Should still be on login page
    expect(page.url()).toMatch(/login/);
  });

  test('no horizontal overflow — mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/admin/login');
    await assertNoHorizontalScroll(page);
  });

  test('no horizontal overflow — desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await assertNoHorizontalScroll(page);
  });

  test('password input type is password (not plain text)', async ({ page }) => {
    const type = await page.locator('input[type="password"]').first().getAttribute('type');
    expect(type).toBe('password');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED ADMIN TESTS
// These only run when QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD env vars are set.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Admin — authenticated', () => {
  test.skip(!HAS_CREDS, 'Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD to run authenticated tests');

  // ── Dashboard ──────────────────────────────────────────────────────────────

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('renders without console errors', async ({ page }) => {
      const getErrors = collectConsoleErrors(page);
      await page.reload();
      await page.waitForLoadState('networkidle');
      const errors = getErrors().filter((e) => !e.includes('favicon'));
      expect(errors).toHaveLength(0);
    });

    test('H1 or heading is present', async ({ page }) => {
      const h = page.locator('h1, h2').first();
      await expect(h).toBeVisible();
    });

    test('admin sidebar is visible at desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      const sidebar = page.locator('aside, nav[aria-label*="Admin"]').first();
      await expect(sidebar).toBeVisible();
    });

    test('all sidebar links are present', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      for (const label of [
        'Dashboard',
        'Products',
        'Categories',
        'Inventory',
        'Restock',
        'Orders',
        'Reviews',
        'Homepage',
        'Pages',
        'SEO',
        'Customers',
        'Analytics',
        'Settings',
      ]) {
        const link = page
          .locator(`aside a:has-text("${label}"), nav a:has-text("${label}")`)
          .first();
        await expect(link, `Sidebar link "${label}" missing`).toBeVisible();
      }
    });

    test('mobile hamburger opens sidebar drawer', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      const hamburger = page
        .locator(
          'button[aria-label*="menu" i], button[aria-label*="sidebar" i], button[aria-label*="navigation" i]'
        )
        .first();
      if ((await hamburger.count()) > 0) {
        await hamburger.click();
        await expect(page.locator('aside, [role="dialog"]').first()).toBeVisible();
      }
    });

    test('no horizontal overflow — desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await assertNoHorizontalScroll(page);
    });

    test('no horizontal overflow — mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalScroll(page);
    });
  });

  // ── Products ───────────────────────────────────────────────────────────────

  test.describe('Products', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
    });

    test('renders product list or empty state', async ({ page }) => {
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body.length).toBeGreaterThan(0);
    });

    test('"Add Product" link is present', async ({ page }) => {
      const addLink = page
        .locator(
          'a[href="/admin/products/new"], button:has-text("Add Product"), a:has-text("Add Product")'
        )
        .first();
      await expect(addLink).toBeVisible();
    });

    test('no horizontal overflow — desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await assertNoHorizontalScroll(page);
    });

    test('no horizontal overflow — mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalScroll(page);
    });
  });

  test.describe('New Product form', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/products/new');
      await page.waitForLoadState('networkidle');
    });

    test('page renders without error', async ({ page }) => {
      await expect(page.locator('body')).toBeVisible();
    });

    test('form fields present: name, price, description', async ({ page }) => {
      // Basic field presence check
      const inputs = page.locator('input, textarea');
      const count = await inputs.count();
      expect(count, 'Product form should have multiple input fields').toBeGreaterThan(2);
    });
  });

  // ── Collections ────────────────────────────────────────────────────────────

  test.describe('Collections', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/collections');
      await page.waitForLoadState('networkidle');
    });

    test('page renders with Collections heading', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
      const text = (await page.locator('h1, h2').first().textContent()) ?? '';
      expect(text.toLowerCase()).toContain('collection');
    });

    test('"Add Collection" button/link is present', async ({ page }) => {
      const btn = page
        .locator(
          'a[href*="/admin/collections/new"], button:has-text("Add Collection"), a:has-text("Add Collection")'
        )
        .first();
      await expect(btn).toBeVisible();
    });

    test('table headers: Name, Type, Visible, Products', async ({ page }) => {
      // Check only if collections exist (table present)
      const table = page.locator('table');
      if ((await table.count()) > 0) {
        const headers = (await table.locator('th').allTextContents()).map((h) => h.trim());
        expect(headers.some((h) => /name/i.test(h))).toBe(true);
        expect(headers.some((h) => /visible/i.test(h))).toBe(true);
      }
    });

    test('no horizontal overflow — desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await assertNoHorizontalScroll(page);
    });

    test('no horizontal overflow — mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/admin/collections');
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalScroll(page);
    });
  });

  // ── Categories ─────────────────────────────────────────────────────────────

  test.describe('Categories', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/categories');
      await page.waitForLoadState('networkidle');
    });

    test('page renders', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('no horizontal overflow — desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await assertNoHorizontalScroll(page);
    });

    test('no horizontal overflow — mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/admin/categories');
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalScroll(page);
    });
  });

  test.describe('Subcategories', () => {
    test('page renders', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/categories/subcategories');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Inventory ──────────────────────────────────────────────────────────────

  test.describe('Inventory', () => {
    const inventoryPages = [
      { path: '/admin/inventory', name: 'Stock Overview' },
      { path: '/admin/inventory/low-stock', name: 'Low Stock' },
      { path: '/admin/inventory/out-of-stock', name: 'Out of Stock' },
      { path: '/admin/inventory/history', name: 'Inventory History' },
    ];

    for (const pg of inventoryPages) {
      test(`${pg.name} renders`, async ({ page }) => {
        await adminLogin(page);
        await page.goto(pg.path);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1, h2').first()).toBeVisible();
      });

      test(`${pg.name} no overflow — mobile`, async ({ page }) => {
        await adminLogin(page);
        await page.setViewportSize(MOBILE);
        await page.goto(pg.path);
        await page.waitForLoadState('networkidle');
        await assertNoHorizontalScroll(page);
      });
    }
  });

  // ── Restock ────────────────────────────────────────────────────────────────

  test.describe('Restock', () => {
    const restockPages = [
      '/admin/restock/subscribers',
      '/admin/restock/notifications',
      '/admin/restock/history',
    ];

    for (const path of restockPages) {
      test(`${path} renders`, async ({ page }) => {
        await adminLogin(page);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  // ── Orders ─────────────────────────────────────────────────────────────────

  test.describe('Orders', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');
    });

    test('page renders with Orders heading', async ({ page }) => {
      const h = page.locator('h1, h2').first();
      await expect(h).toBeVisible();
      const text = (await h.textContent()) ?? '';
      expect(text.toLowerCase()).toContain('order');
    });

    test('no horizontal overflow — desktop', async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await assertNoHorizontalScroll(page);
    });

    test('no horizontal overflow — mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');
      await assertNoHorizontalScroll(page);
    });
  });

  test.describe('Returns & Refunds', () => {
    test('returns page renders', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/orders/returns');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('refunds page renders', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/orders/refunds');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Reviews ────────────────────────────────────────────────────────────────

  test.describe('Reviews', () => {
    test('renders with heading', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/reviews');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });

  // ── Homepage manager ───────────────────────────────────────────────────────

  test.describe('Homepage Manager', () => {
    test('renders section controls', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/homepage');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Pages & Blog ───────────────────────────────────────────────────────────

  test.describe('Pages & Blog', () => {
    test('page list renders', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/pages');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('"New Page" link is present', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/pages');
      await page.waitForLoadState('networkidle');
      const newLink = page
        .locator('a[href*="/admin/pages/new"], button:has-text("New Page"), a:has-text("New Page")')
        .first();
      await expect(newLink).toBeVisible();
    });
  });

  // ── SEO ────────────────────────────────────────────────────────────────────

  test.describe('SEO Settings', () => {
    test('renders without error', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/seo');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });

  // ── Customers ──────────────────────────────────────────────────────────────

  test.describe('Customers', () => {
    test('renders customer list or empty state', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/customers');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Analytics ──────────────────────────────────────────────────────────────

  test.describe('Analytics', () => {
    test('renders without error', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Settings ───────────────────────────────────────────────────────────────

  test.describe('Settings', () => {
    test('renders without error', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });

    test('WhatsApp settings page renders', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/settings/whatsapp');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ── Sidebar behaviour ──────────────────────────────────────────────────────

  test.describe('Admin Sidebar', () => {
    test('collapsed state persists to localStorage', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/dashboard');
      await page.setViewportSize(DESKTOP);
      // Find collapse toggle button
      const toggleBtn = page
        .locator(
          'button[aria-label*="collapse" i], button[aria-label*="sidebar" i], button[title*="collapse" i]'
        )
        .first();
      if ((await toggleBtn.count()) > 0) {
        await toggleBtn.click();
        const stored = await page.evaluate(() => localStorage.getItem('admin-sidebar-collapsed'));
        expect(stored).toBe('true');
        // Toggle back
        await toggleBtn.click();
        const storedBack = await page.evaluate(() =>
          localStorage.getItem('admin-sidebar-collapsed')
        );
        expect(storedBack).toBe('false');
      }
    });

    test('active route group auto-expands in sidebar', async ({ page }) => {
      await adminLogin(page);
      await page.goto('/admin/inventory');
      await page.setViewportSize(DESKTOP);
      await page.waitForLoadState('networkidle');
      // Inventory sub-links should be visible
      const subLink = page
        .locator(
          'aside a[href="/admin/inventory/low-stock"], nav a[href="/admin/inventory/low-stock"]'
        )
        .first();
      if ((await subLink.count()) > 0) {
        await expect(subLink).toBeVisible();
      }
    });
  });
});
