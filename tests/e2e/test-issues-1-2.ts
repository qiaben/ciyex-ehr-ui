import { chromium, Page } from "playwright";

const BASE = "http://localhost:3000";

async function login(page: Page) {
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"], input[name="email"]', "Kiran@example.com");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  await page.locator('input[type="password"]').fill("Test@123");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await login(page);
  console.log("Logged in:", page.url());

  // ====== ISSUE 1: Encounter Reason for Visit ======
  console.log("\n=== ISSUE 1: Encounter Reason for Visit Negative Test ===");
  try {
    await page.goto(`${BASE}/patients`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('button[title="View Chart"]').first().click();
    await page.waitForTimeout(5000);

    // Navigate to Encounters sub-tab
    await page.locator('button:has-text("ENCOUNTERS")').first().click();
    await page.waitForTimeout(1000);
    const encBtns = page.locator("button").filter({ hasText: /^Encounters$/ });
    await encBtns.nth(1).click();
    await page.waitForTimeout(4000);

    // Click Add button (last one, in the encounters table area)
    const addBtn = page.locator('button:has-text("Add")').last();
    await addBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "/tmp/issue1-form.png" });

    // Fill required fields:
    // 1. Encounter Type select - pick first valid option
    const encounterTypeSelect = page.locator("select").first();
    const options = await encounterTypeSelect.locator("option").all();
    for (const opt of options) {
      const val = await opt.getAttribute("value");
      if (val && val !== "") {
        await encounterTypeSelect.selectOption(val);
        console.log("  Encounter Type: selected value '" + val + "'");
        break;
      }
    }
    await page.waitForTimeout(500);

    // 2. Status select
    const allSelects = await page.locator("select:visible").all();
    if (allSelects.length >= 2) {
      const statusSelect = allSelects[1];
      const statusOpts = await statusSelect.locator("option").all();
      for (const opt of statusOpts) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") {
          await statusSelect.selectOption(val);
          console.log("  Status: selected value '" + val + "'");
          break;
        }
      }
    }
    await page.waitForTimeout(500);

    // 3. Start Date
    const startDateInput = page.locator('input[type="datetime-local"]:visible').first();
    if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startDateInput.fill("2026-03-18T10:00");
      console.log("  Start Date: 2026-03-18T10:00");
    } else {
      const dateInput = page.locator('input[type="date"]:visible').first();
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill("2026-03-18");
        console.log("  Start Date: 2026-03-18");
      }
    }
    await page.waitForTimeout(500);

    // Now test Reason for Visit negative cases
    const reasonField = page.locator('input[placeholder="Chief complaint"]').first();

    // Test 1: Numbers only
    console.log("\n  --- Test: Numbers only '12345' ---");
    await reasonField.fill("12345");
    const saveBtn = page.locator('button:has-text("Save")').first();
    await saveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/issue1-numbers.png" });

    let errors = await page.locator(".text-red-500, .text-xs.text-red-500").allTextContents();
    let filtered = errors.filter(e => e.trim() && e.length > 2 && e.length < 100);
    console.log("  Errors:", filtered.join("; "));

    // Test 2: Special chars only
    console.log("\n  --- Test: Special chars '!@#$%^' ---");
    await reasonField.fill("!@#$%^");
    await saveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/issue1-special.png" });

    errors = await page.locator(".text-red-500, .text-xs.text-red-500").allTextContents();
    filtered = errors.filter(e => e.trim() && e.length > 2 && e.length < 100);
    console.log("  Errors:", filtered.join("; "));

    // Test 3: Valid input
    console.log("\n  --- Test: Valid 'Annual checkup' ---");
    await reasonField.fill("Annual checkup");
    await saveBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/issue1-valid.png" });

    errors = await page.locator(".text-red-500, .text-xs.text-red-500").allTextContents();
    const reasonErrors = errors.filter(e => e.trim() && e.toLowerCase().includes("reason"));
    console.log("  Reason errors:", reasonErrors.length === 0 ? "none (PASS)" : reasonErrors.join("; "));

  } catch (err: any) {
    console.log("  Error:", err.message?.substring(0, 300));
    await page.screenshot({ path: "/tmp/issue1-error.png" });
  }

  // ====== ISSUE 2: Immunization Lot/Dose ======
  console.log("\n=== ISSUE 2: Immunization Lot Number / Dose Validation ===");
  try {
    await page.goto(`${BASE}/immunizations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);

    const recordBtn = page.locator('button:has-text("Record Immunization")').first();
    await recordBtn.click();
    await page.waitForTimeout(3000);

    // Select patient from dropdown
    const patientSearch = page.locator('input[placeholder="Search patient by name..."]').first();
    await patientSearch.fill("kiran");
    await page.waitForTimeout(3000);

    // Click the first patient result
    const kiranResult = page.locator("li").filter({ hasText: /kiranpatient/ }).first();
    if (await kiranResult.isVisible({ timeout: 3000 }).catch(() => false)) {
      await kiranResult.click();
      console.log("  Selected patient: kiranpatient");
      await page.waitForTimeout(1000);
    }

    // Fill vaccine name (required)
    const vaccineField = page.locator('input[placeholder*="Influenza"]').first();
    if (await vaccineField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await vaccineField.fill("Test Flu Vaccine");
      console.log("  Vaccine: Test Flu Vaccine");
    }

    // Test 1: Invalid lot number
    console.log("\n  --- Test: Invalid lot number 'LOT@#$%' ---");
    const lotField = page.locator('input[placeholder="ABC123"]').first();
    await lotField.fill("LOT@#$%");

    const doseField = page.locator('input[placeholder="1"]').first();
    await doseField.fill("1");

    // Click Record button at bottom of form
    const recordSubmit = page.locator('button:has-text("Record")').last();
    await recordSubmit.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/issue2-lot-invalid.png" });

    // Check for toast - capture quickly before it disappears
    let pageText = await page.evaluate(() => document.body.innerText);
    const lotError = pageText.includes("alphanumeric");
    console.log("  'alphanumeric' validation shown:", lotError);

    // Test 2: Invalid dose
    console.log("\n  --- Test: Invalid dose '-1' ---");
    await lotField.fill("ABC123");
    await doseField.fill("-1");
    await recordSubmit.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/issue2-dose-invalid.png" });

    pageText = await page.evaluate(() => document.body.innerText);
    const doseError = pageText.includes("positive whole number");
    console.log("  'positive whole number' validation shown:", doseError);

    // Test 3: Dose = 0
    console.log("\n  --- Test: Dose '0' ---");
    await doseField.fill("0");
    await recordSubmit.click();
    await page.waitForTimeout(2000);

    pageText = await page.evaluate(() => document.body.innerText);
    const zeroError = pageText.includes("positive whole number");
    console.log("  Zero dose rejected:", zeroError);

    // Test 4: Valid lot and dose
    console.log("\n  --- Test: Valid lot 'ABC-123' dose '2' ---");
    await lotField.fill("ABC-123");
    await doseField.fill("2");
    console.log("  Set valid values");

  } catch (err: any) {
    console.log("  Error:", err.message?.substring(0, 300));
    await page.screenshot({ path: "/tmp/issue2-error.png" });
  }

  console.log("\n=== Done ===");
  await browser.close();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
