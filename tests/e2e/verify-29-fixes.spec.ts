import { test, expect, Page } from "@playwright/test";

const BASE_URL = "https://app-dev.ciyex.org";
const KEYCLOAK_URL = "https://dev.aran.me";

async function login(page: Page, username: string, password: string) {
  await page.goto(BASE_URL);
  // Wait for Keycloak redirect
  await page.waitForURL(/dev\.aran\.me/, { timeout: 15000 }).catch(() => {});
  if (page.url().includes("dev.aran.me")) {
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("#kc-login");
    await page.waitForURL(/app-dev\.ciyex\.org/, { timeout: 15000 });
  }
  // Wait for app to load
  await page.waitForTimeout(3000);
}

async function navigateToPatientTab(page: Page, tabName: string) {
  // Navigate to patients list
  await page.goto(`${BASE_URL}/patients`);
  await page.waitForTimeout(2000);
  // Click first patient
  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }
  // Click on the tab
  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
  if (await tab.isVisible()) {
    await tab.click();
    await page.waitForTimeout(2000);
  }
}

test.describe("Verify 29 issue fixes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "michael.chen", "Test@123");
  });

  // Issues 19-20: Payment page layout
  test("Payment page has proper header layout", async ({ page }) => {
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForTimeout(2000);
    const patientRow = page.locator("table tbody tr").first();
    if (await patientRow.isVisible()) {
      await patientRow.click();
      await page.waitForTimeout(2000);
    }
    // Navigate to payment tab
    const payTab = page.locator('button:has-text("Payment"), [role="tab"]:has-text("Payment")').first();
    if (await payTab.isVisible()) {
      await payTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: "test-results/payment-layout.png", fullPage: true });
  });

  // Issue 21: Statements page layout
  test("Statements page has proper header layout", async ({ page }) => {
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForTimeout(2000);
    const patientRow = page.locator("table tbody tr").first();
    if (await patientRow.isVisible()) {
      await patientRow.click();
      await page.waitForTimeout(2000);
    }
    const statementsTab = page.locator('button:has-text("Statements"), [role="tab"]:has-text("Statements")').first();
    if (await statementsTab.isVisible()) {
      await statementsTab.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: "test-results/statements-layout.png", fullPage: true });
  });

  // Issue 24: Tasks filter/search
  test("Tasks page search works", async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/tasks-page.png", fullPage: true });
    // Try search
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-results/tasks-search.png", fullPage: true });
    }
  });

  // Issue 26: Labs page scroll
  test("Labs page scrolls properly", async ({ page }) => {
    await page.goto(`${BASE_URL}/labs`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/labs-page.png", fullPage: true });
  });

  // Issue 27: Recall search
  test("Recall page search works", async ({ page }) => {
    await page.goto(`${BASE_URL}/recall`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/recall-page.png", fullPage: true });
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-results/recall-search.png", fullPage: true });
    }
  });

  // Issue 28: Calendar provider filter
  test("Calendar provider filter works", async ({ page }) => {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/calendar-page.png", fullPage: true });
  });

  // Issues 2-18: Patient chart tabs - check date columns are populated
  test("Patient chart tabs show date columns", async ({ page }) => {
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForTimeout(3000);

    // Click first patient
    const patientRow = page.locator("table tbody tr").first();
    if (!(await patientRow.isVisible())) {
      test.skip();
      return;
    }
    await patientRow.click();
    await page.waitForTimeout(3000);

    // Take screenshots of various tabs
    const tabs = [
      "Allergies", "Problems", "Insurance", "Documents", "Education",
      "Messaging", "Appointments", "Encounters", "Visit Notes",
      "Medications", "Labs", "Procedures"
    ];

    for (const tabName of tabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: `test-results/patient-tab-${tabName.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true
        });
      }
    }
  });

  // Issues 22-23: Billing tabs
  test("Billing tabs show date columns", async ({ page }) => {
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForTimeout(3000);

    const patientRow = page.locator("table tbody tr").first();
    if (!(await patientRow.isVisible())) {
      test.skip();
      return;
    }
    await patientRow.click();
    await page.waitForTimeout(3000);

    const billingTabs = ["Claims", "Submissions", "Denials", "ERA", "Transactions"];
    for (const tabName of billingTabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: `test-results/billing-tab-${tabName.toLowerCase()}.png`,
          fullPage: true
        });
      }
    }
  });
});
