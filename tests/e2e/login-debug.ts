import { chromium } from "playwright";

const BASE = "https://app-dev.ciyex.org";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Listen for console messages
  page.on("console", msg => console.log("  [CONSOLE]", msg.type(), msg.text()));

  console.log("Step 1: goto /signin");
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle" });
  console.log("  URL:", page.url());

  // Wait longer for JS redirect
  await page.waitForTimeout(8000);
  console.log("  URL after 8s:", page.url());

  // Check page content
  const bodyText = await page.locator("body").textContent().catch(() => "EMPTY");
  console.log("  Body text:", bodyText?.substring(0, 500));

  // Check for Keycloak form
  const hasUsername = await page.locator("#username").isVisible().catch(() => false);
  console.log("  Has #username:", hasUsername);

  // Maybe we need to wait for redirect
  if (page.url().includes("aran.me") || hasUsername) {
    console.log("Step 2: Filling Keycloak form");
    await page.fill("#username", "michael.chen");
    await page.fill("#password", "Test@123");
    await page.click("#kc-login");
    await page.waitForTimeout(10000);
    console.log("  URL after login:", page.url());
  } else {
    // Try clicking sign in button if present
    const signInBtn = page.locator("button:has-text('Sign In'), a:has-text('Sign In')").first();
    if (await signInBtn.isVisible().catch(() => false)) {
      console.log("  Found Sign In button, clicking...");
      await signInBtn.click();
      await page.waitForTimeout(8000);
      console.log("  URL after click:", page.url());
    }

    // Check if there's a Keycloak redirect now
    if (page.url().includes("aran.me")) {
      console.log("Step 2b: Now at Keycloak");
      await page.fill("#username", "michael.chen");
      await page.fill("#password", "Test@123");
      await page.click("#kc-login");
      await page.waitForTimeout(10000);
      console.log("  URL after login:", page.url());
    }
  }

  // Handle practice selection
  const url = page.url();
  console.log("Step 3: Current URL:", url);
  if (url.includes("select-practice") || url.includes("practice")) {
    const practiceBtn = page.locator("button, div[role='button'], a").filter({ hasText: /sunrise|family/i }).first();
    if (await practiceBtn.isVisible().catch(() => false)) {
      console.log("  Clicking practice...");
      await practiceBtn.click();
      await page.waitForTimeout(5000);
      console.log("  URL after practice select:", page.url());
    }
  }

  // Navigate to reports
  console.log("Step 4: goto /reports");
  await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" });
  await page.waitForTimeout(8000);
  console.log("  URL:", page.url());

  // Get full page HTML
  const html = await page.content();
  console.log("  HTML length:", html.length);
  console.log("  Has 'Clinical':", html.includes("Clinical"));
  console.log("  Has 'reports available':", html.includes("reports available"));
  console.log("  Has 'Generate':", html.includes("Generate"));

  await page.screenshot({ path: "/tmp/reports-debug.png", fullPage: true });
  console.log("  Screenshot: /tmp/reports-debug.png");

  await browser.close();
}

main().catch(console.error);
