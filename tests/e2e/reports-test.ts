import { chromium } from "playwright";

const BASE = "https://app-dev.ciyex.org";
const KC_URL = "https://dev.aran.me";
const KC_REALM = "ciyex";
const KC_CLIENT = "ciyex-app";

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  // Step 1: Navigate to the app first to establish the origin for sessionStorage
  console.log("1. Setting up PKCE and auth...");
  await page.goto(`${BASE}/signin`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(5000);

  // Generate PKCE code verifier and challenge in the browser context
  const { codeVerifier, codeChallenge } = await page.evaluate(async () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const cv = btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(cv));
    const cc = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    // Store in sessionStorage for the callback page
    sessionStorage.setItem("pkce_code_verifier", cv);

    return { codeVerifier: cv, codeChallenge: cc };
  });

  console.log("   PKCE generated. Redirecting to Keycloak...");

  // Build auth URL with PKCE
  const redirectUri = `${BASE}/callback`;
  const params = new URLSearchParams({
    client_id: KC_CLIENT,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email organization",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  await page.goto(`${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/auth?${params}`, {
    waitUntil: "load",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  let url = page.url();
  console.log("   Keycloak URL:", url);

  // Fill login form
  const hasLoginForm = await page.locator("#username").isVisible().catch(() => false);
  if (hasLoginForm) {
    await page.fill("#username", "michael.chen");
    const hasPassword = await page.locator("#password").isVisible().catch(() => false);
    if (hasPassword) {
      await page.fill("#password", "Test@123");
      await page.click("#kc-login");
    } else {
      await page.click("#kc-login");
      await page.waitForTimeout(3000);
      await page.waitForSelector("#password", { timeout: 10000 });
      await page.fill("#password", "Test@123");
      await page.click("#kc-login");
    }
    console.log("   Credentials submitted...");
  }

  // Wait for callback to process
  console.log("   Waiting for auth callback to complete...");
  try {
    await page.waitForURL(/calendar|select-practice|dashboard|reports/, { timeout: 30000 });
    url = page.url();
    console.log("   Redirected to:", url);
  } catch {
    url = page.url();
    console.log("   Callback timeout. URL:", url);
    const visText = await page.evaluate(() => document.body.innerText?.substring(0, 500));
    console.log("   Page:", visText);

    // Check for errors
    if (url.includes("callback")) {
      const errors = await page.evaluate(() => {
        const consoleErrors: string[] = [];
        return document.body.innerText?.substring(0, 500);
      });
      console.log("   Still on callback. Page text:", errors);
      await page.screenshot({ path: "/tmp/reports-debug-callback.png", fullPage: true });
    }
  }

  // Handle practice selection
  url = page.url();
  if (url.includes("select-practice") || url.includes("practice-switch")) {
    console.log("   Practice selection needed...");
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/reports-debug-practice.png", fullPage: true });
    const practiceBtn = page.locator("button, div[role='button'], a").filter({ hasText: /sunrise|family/i }).first();
    if (await practiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await practiceBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  url = page.url();
  console.log("   Post-login URL:", url);

  // Step 2: Navigate to reports
  console.log("\n2. Navigating to /reports...");
  await page.goto(`${BASE}/reports`, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(10000);

  url = page.url();
  console.log("   URL:", url);

  if (url.includes("signin")) {
    console.log("   Redirected to signin - auth failed!");
    const cookies = await context.cookies();
    console.log("   Cookies:", cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`).join(", "));
    const ls = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        items[key] = localStorage.getItem(key)?.substring(0, 50) || "";
      }
      return items;
    });
    console.log("   LocalStorage keys:", Object.keys(ls).join(", "));
    console.log("   Token exists:", !!ls["token"]);
    await page.screenshot({ path: "/tmp/reports-debug-signin.png", fullPage: true });
    await browser.close();
    return;
  }

  // Wait for reports to render
  try {
    await page.waitForSelector("button:has-text('Generate')", { timeout: 15000 });
    console.log("   Reports page loaded!");
  } catch {
    console.log("   Generate button not found.");
    const visText = await page.evaluate(() => document.body.innerText?.substring(0, 500));
    console.log("   Page:", visText);
    await page.screenshot({ path: "/tmp/reports-01-main.png", fullPage: true });
    await browser.close();
    return;
  }

  await page.screenshot({ path: "/tmp/reports-01-main.png", fullPage: true });

  // Step 3: Test Patient Demographics
  console.log("\n3. Testing Patient Demographics...");
  const generateBtn = page.locator("button:has-text('Generate')");
  await generateBtn.click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: "/tmp/reports-02-demographics.png", fullPage: true });

  const hasDataFilters = await page.locator("text=Data Filters").isVisible().catch(() => false);
  const charts = await page.locator(".recharts-wrapper").count();
  const tableRows = await page.locator("table tbody tr").count();
  const kpis = await page.locator(".text-2xl").count();
  const selectCount = await page.locator("select").count();
  console.log(`   Data Filters: ${hasDataFilters}, Charts: ${charts}, Rows: ${tableRows}, KPIs: ${kpis}, Selects: ${selectCount}`);

  // Test a filter if available
  if (selectCount > 0 && hasDataFilters) {
    const dataFilterSelects = page.locator("select");
    const count = await dataFilterSelects.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const sel = dataFilterSelects.nth(i);
      const opts = await sel.locator("option").allTextContents();
      console.log(`   Filter ${i}: ${opts.slice(0, 5).join(", ")}`);
    }
    const lastSel = dataFilterSelects.last();
    const opts = await lastSel.locator("option").allTextContents();
    if (opts.length > 1) {
      await lastSel.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      const fRows = await page.locator("table tbody tr").count();
      console.log(`   After filter: ${fRows} rows (was ${tableRows})`);
      await page.screenshot({ path: "/tmp/reports-03-filtered.png", fullPage: true });
      await lastSel.selectOption({ index: 0 });
    }
  }

  // Helpers
  async function testReport(name: string, idx: number) {
    console.log(`\n${idx}. Testing ${name}...`);
    const btn = page.locator("button, span").filter({ hasText: name }).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3000);
      const gen = page.locator("button:has-text('Generate')");
      if (await gen.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gen.click();
        await page.waitForTimeout(6000);
      }
      const df = await page.locator("text=Data Filters").isVisible().catch(() => false);
      const cc = await page.locator(".recharts-wrapper").count();
      const rc = await page.locator("table tbody tr").count();
      console.log(`   Data Filters: ${df}, Charts: ${cc}, Rows: ${rc}`);
      const fname = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      await page.screenshot({ path: `/tmp/reports-${String(idx).padStart(2, "0")}-${fname}.png`, fullPage: true });
    } else {
      console.log(`   "${name}" NOT visible`);
    }
  }

  async function expandCategory(name: string) {
    console.log(`\n--- ${name.toUpperCase()} ---`);
    const catBtn = page.locator("button").filter({ hasText: new RegExp(name, "i") }).first();
    if (await catBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await catBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Clinical
  await testReport("Encounter Summary", 4);
  await testReport("Lab Orders & Results", 5);
  await testReport("Medication & Prescriptions", 6);
  await testReport("Referral Tracking", 7);
  await testReport("Immunization Report", 8);
  await testReport("Diagnosis & Problem List", 9);

  // Financial
  await expandCategory("Financial");
  await testReport("Revenue Overview", 10);
  await testReport("Accounts Receivable Aging", 11);
  await testReport("Denial Management", 12);
  await testReport("Payer Mix Analysis", 13);
  await testReport("CPT / Procedure Utilization", 14);

  // Operational
  await expandCategory("Operational");
  await testReport("Appointment Volume", 15);
  await testReport("No-Show", 16);
  await testReport("Provider Productivity", 17);
  await testReport("Scheduling Utilization", 18);

  // Compliance
  await expandCategory("Compliance");
  await testReport("Clinical Quality Measures", 19);
  await testReport("Care Gaps Analysis", 20);

  // Population Health
  await expandCategory("Population Health");
  await testReport("Disease Registry", 21);
  await testReport("Risk Stratification", 22);

  // Administrative
  await expandCategory("Administrative");
  await testReport("User Activity", 23);
  await testReport("Patient Portal Usage", 24);
  await testReport("Document & Note", 25);

  console.log("\n====== ALL REPORTS TESTED ======");
  await browser.close();
}

main().catch(console.error);
