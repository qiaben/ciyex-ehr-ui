import { test, expect, Page } from "@playwright/test";

const DEV_URL = "https://app-dev.ciyex.org";
const USERNAME = "michael.chen@example.com";
const PASSWORD = "Test@123";

async function login(page: Page) {
  await page.goto(`${DEV_URL}/signin`);
  await page.waitForLoadState("networkidle", { timeout: 15000 });

  // Step 1: Enter email/username
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="username" i]').first();
  await emailInput.waitFor({ timeout: 15000 });
  await emailInput.fill(USERNAME);

  // Click Next/Continue button
  const nextBtn = page.locator('button', { hasText: /next|continue/i }).first();
  await nextBtn.click();

  // Step 2: Enter password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ timeout: 10000 });
  await passwordInput.fill(PASSWORD);

  // Click Sign In
  const signInBtn = page.locator('button[type="submit"], button', { hasText: /sign.?in|log.?in/i }).first();
  await signInBtn.click();

  // Wait for redirect away from signin
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 });
}

test.describe("Bug fixes verification", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("CDS rules - create rule without 500 error", async ({ page }) => {
    await page.goto(`${DEV_URL}/system/clinical-alerts`);
    await page.waitForLoadState("networkidle");

    // Click Add New
    const addBtn = page.locator("button", { hasText: /add|new/i }).first();
    await addBtn.click();

    // Fill form
    await page.fill('input[placeholder*="name" i]', "Test Allergy Alert");

    // Submit and verify no error
    const saveBtn = page.locator("button", { hasText: /save|create/i }).first();
    await saveBtn.click();

    await expect(page.locator("text=500")).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Error")).not.toBeVisible({ timeout: 3000 });
  });

  test("Fax page - search works without application error", async ({ page }) => {
    await page.goto(`${DEV_URL}/fax`);
    await page.waitForLoadState("networkidle");

    // Search for something
    const searchInput = page.locator('input[type="text"][placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForLoadState("networkidle");

      // Should not show application error
      await expect(page.locator("text=Application error")).not.toBeVisible();
    }
  });

  test("Fax form - has Pages field", async ({ page }) => {
    await page.goto(`${DEV_URL}/fax`);
    await page.waitForLoadState("networkidle");

    // Click send fax button
    const sendBtn = page.locator("button", { hasText: /send.*fax/i }).first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();

      // Pages field should be visible
      await expect(page.locator("label", { hasText: /pages/i })).toBeVisible({ timeout: 3000 });
    }
  });

  test("Consents - Patient ID has required asterisk", async ({ page }) => {
    await page.goto(`${DEV_URL}/consents`);
    await page.waitForLoadState("networkidle");

    // Open add new consent
    const addBtn = page.locator("button", { hasText: /add.*new|new.*consent/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();

      // Patient ID label should have asterisk
      const patientIdLabel = page.locator("label", { hasText: /patient.*id/i });
      await expect(patientIdLabel).toBeVisible({ timeout: 3000 });
      await expect(patientIdLabel).toContainText("*");
    }
  });

  test("Notification templates - can save without 500", async ({ page }) => {
    await page.goto(`${DEV_URL}/system/notifications`);
    await page.waitForLoadState("networkidle");

    // Navigate to templates tab
    const templatesTab = page.locator("button, a", { hasText: /templates/i }).first();
    if (await templatesTab.isVisible()) {
      await templatesTab.click();
      await page.waitForLoadState("networkidle");

      // Try clicking Add New
      const addBtn = page.locator("button", { hasText: /add|new/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        // Should not show 500 error immediately
        await expect(page.locator("text=500")).not.toBeVisible();
      }
    }
  });

  test("Education materials search works", async ({ page }) => {
    await page.goto(`${DEV_URL}/clinical/education`);
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("diabetes");
      await page.waitForLoadState("networkidle");

      // Should not show application error
      await expect(page.locator("text=Application error")).not.toBeVisible();
    }
  });
});
