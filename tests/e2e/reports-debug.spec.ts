import { test, expect } from "@playwright/test";

const BASE = "https://app-dev.ciyex.org";

async function login(page: any, email: string, password: string) {
  await page.goto(`${BASE}/signin`);
  await page.waitForLoadState("networkidle");
  // Enter email
  await page.fill('input[type="email"]', email);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  // Enter password
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");
}

test("debug-reports: michael.chen login - check localStorage and reports data", async ({ page }) => {
  await login(page, "michael.chen@example.com", "Test@123");

  // Check localStorage state
  const tenant = await page.evaluate(() => localStorage.getItem("selectedTenant"));
  const token = await page.evaluate(() => localStorage.getItem("token"));
  console.log("=== michael.chen LOGIN ===");
  console.log("selectedTenant:", tenant);
  console.log("token exists:", !!token);

  // Decode JWT to check org claims
  if (token) {
    const payload = await page.evaluate((t: string) => {
      try {
        const base64 = t.split(".")[1];
        return JSON.parse(atob(base64));
      } catch { return null; }
    }, token);
    console.log("JWT org-related claims:");
    console.log("  organization:", payload?.organization);
    console.log("  org_alias:", payload?.org_alias);
    console.log("  realm_access:", JSON.stringify(payload?.realm_access));
    console.log("  groups:", JSON.stringify(payload?.groups));
  }

  // Navigate to reports
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");

  // Check for data filters section
  const dataFiltersVisible = await page.locator("text=Data Filters").isVisible().catch(() => false);
  console.log("Data Filters section visible:", dataFiltersVisible);

  // Check for filter bar (From/To inputs)
  const fromInput = await page.locator('input[type="date"]').first().isVisible().catch(() => false);
  console.log("Date inputs visible:", fromInput);

  // Check KPI cards
  const kpiCards = await page.locator('.grid .bg-white').count();
  console.log("KPI cards count:", kpiCards);

  // Take screenshot
  await page.screenshot({ path: "/tmp/reports-michael.png", fullPage: true });
  console.log("Screenshot saved to /tmp/reports-michael.png");
});

test("debug-reports: fresh login david.thompson - check localStorage and reports data", async ({ page }) => {
  // Clear localStorage first to simulate fresh login
  await page.goto(`${BASE}/signin`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");

  await login(page, "david.thompson@example.com", "Test@123");

  // Check localStorage state
  const tenant = await page.evaluate(() => localStorage.getItem("selectedTenant"));
  const token = await page.evaluate(() => localStorage.getItem("token"));
  console.log("=== david.thompson LOGIN (fresh) ===");
  console.log("selectedTenant:", tenant);
  console.log("token exists:", !!token);

  // Decode JWT
  if (token) {
    const payload = await page.evaluate((t: string) => {
      try {
        const base64 = t.split(".")[1];
        return JSON.parse(atob(base64));
      } catch { return null; }
    }, token);
    console.log("JWT org-related claims:");
    console.log("  organization:", payload?.organization);
    console.log("  org_alias:", payload?.org_alias);
    console.log("  groups:", JSON.stringify(payload?.groups));
  }

  // Navigate to reports
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");

  // Check for data filters section
  const dataFiltersVisible = await page.locator("text=Data Filters").isVisible().catch(() => false);
  console.log("Data Filters section visible:", dataFiltersVisible);

  // Check for filter bar
  const fromInput = await page.locator('input[type="date"]').first().isVisible().catch(() => false);
  console.log("Date inputs visible:", fromInput);

  // Check KPI cards
  const kpiCards = await page.locator('.grid .bg-white').count();
  console.log("KPI cards count:", kpiCards);

  // Capture API response for patients
  const apiResponses: any[] = [];
  page.on("response", async (response: any) => {
    const url = response.url();
    if (url.includes("/api/patients") || url.includes("/api/encounters")) {
      const status = response.status();
      let body = "";
      try { body = await response.text(); } catch {}
      const bodyLen = body.length;
      const parsed = body ? JSON.parse(body) : null;
      const dataLen = Array.isArray(parsed?.data) ? parsed.data.length : (Array.isArray(parsed) ? parsed.length : "N/A");
      console.log(`API ${url.split("/api/")[1]?.split("?")[0]} -> status=${status}, bodyLen=${bodyLen}, records=${dataLen}`);
      apiResponses.push({ url, status, dataLen });
    }
  });

  // Re-click on a report to trigger API call and log it
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(6000);

  // Take screenshot
  await page.screenshot({ path: "/tmp/reports-david.png", fullPage: true });
  console.log("Screenshot saved to /tmp/reports-david.png");
});
