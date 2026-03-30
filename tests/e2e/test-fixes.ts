import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "Kiran@example.com";
const PASSWORD = "Test@123";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  // Login
  console.log("=== Login ===");
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  const pw = page.locator('input[type="password"]');
  if (await pw.isVisible({ timeout: 5000 })) {
    await pw.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);
  }
  console.log("✅ Logged in, URL:", page.url());

  // ======= ISSUE 9: Edit Patient Form =======
  console.log("\n=== ISSUE 9: Edit Patient - Email asterisk + phone validation ===");
  try {
    // Go to first patient
    await page.goto(`${BASE}/patients`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('button[title="View Chart"]').first().click();
    await page.waitForTimeout(5000);

    // Get patient ID from URL
    const patientUrl = page.url();
    const match = patientUrl.match(/patients\/(\d+)/);
    if (match) {
      const pid = match[1];
      await page.goto(`${BASE}/patients/${pid}/edit`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: "/tmp/09-edit-patient.png" });

      // Check email label has asterisk
      const emailLabel = page.locator('label[for="email"]');
      if (await emailLabel.isVisible()) {
        const html = await emailLabel.innerHTML();
        console.log(`  Email label HTML: ${html}`);
        console.log(`  ✅ Email has mandatory asterisk: ${html.includes("*") || html.includes("text-red")}`);
      }

      // Test phone field strips non-digits and max 10
      const phoneInput = page.locator('#phoneNumber');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill("");
        await phoneInput.pressSequentially("abc12345def67890extra");
        const val = await phoneInput.inputValue();
        console.log(`  Phone value after mixed input: "${val}"`);
        console.log(`  ✅ Only digits: ${/^\d*$/.test(val)}`);
        console.log(`  ✅ Max 10 chars: ${val.length <= 10}`);
      }

      // Test email required validation
      const emailInput = page.locator('#email');
      if (await emailInput.isVisible()) {
        await emailInput.fill("");
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(1000);
        const errors = await page.locator('.text-xs.text-red-500').allTextContents();
        console.log(`  Validation errors: ${errors.join(", ")}`);
        console.log(`  ✅ Email required error shown: ${errors.some(e => e.toLowerCase().includes("email"))}`);
        await page.screenshot({ path: "/tmp/09-validation.png" });
      }
    }
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
    await page.screenshot({ path: "/tmp/09-error.png" });
  }

  // ======= ISSUE 6: Appointment Pagination =======
  console.log("\n=== ISSUE 6: Appointment Pagination ===");
  try {
    await page.goto(`${BASE}/appointments`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/06-appointments.png" });

    const text = await page.evaluate(() => document.body.innerText);
    // Check pagination text
    const pageMatch = text.match(/Page (\d+) of (\d+)/);
    if (pageMatch) {
      console.log(`  Pagination: Page ${pageMatch[1]} of ${pageMatch[2]}`);
    }

    // Find Next/Prev buttons (they contain chevron icons)
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      const nextDisabled = await nextBtn.isDisabled();
      console.log(`  Next button disabled: ${nextDisabled}`);

      if (!nextDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
        const text2 = await page.evaluate(() => document.body.innerText);
        const pageMatch2 = text2.match(/Page (\d+) of (\d+)/);
        console.log(`  After click: Page ${pageMatch2?.[1]} of ${pageMatch2?.[2]}`);
        console.log(`  ✅ Pagination Next works`);
        await page.screenshot({ path: "/tmp/06-page2.png" });

        const prevBtn = page.locator('button:has-text("Previous"), button:has-text("Prev")').first();
        if (await prevBtn.isVisible({ timeout: 3000 })) {
          const prevDisabled = await prevBtn.isDisabled();
          console.log(`  ✅ Prev button enabled: ${!prevDisabled}`);
        }
      }
    } else {
      console.log("  ⚠️ No Next button visible - checking for other pagination controls");
    }
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
    await page.screenshot({ path: "/tmp/06-error.png" });
  }

  // ======= ISSUE 7: Authorization Patient Search =======
  console.log("\n=== ISSUE 7: Authorization Patient Name Search ===");
  try {
    await page.goto(`${BASE}/authorizations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/07-authorizations.png" });

    const text = await page.evaluate(() => document.body.innerText);
    console.log(`  Page contains: ${text.substring(0, 300)}`);

    // Click New Prior Authorization
    const newBtn = page.locator('button:has-text("New Prior Authorization"), button:has-text("New Authorization"), button:has-text("New")').first();
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await newBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "/tmp/07-new-auth.png" });

      // Find patient search field
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const placeholder = await input.getAttribute("placeholder");
        const name = await input.getAttribute("name");
        if (placeholder) console.log(`  Input: placeholder="${placeholder}" name="${name}"`);
      }

      const patientInput = page.locator('input[placeholder*="patient" i], input[placeholder*="search" i], input[name*="patient" i]').first();
      if (await patientInput.isVisible({ timeout: 3000 })) {
        await patientInput.fill("kiran");
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "/tmp/07-search-results.png" });

        // Check for results
        const results = page.locator('ul li, [role="option"], div[class*="cursor-pointer"]');
        const count = await results.count();
        if (count > 0) {
          const firstText = await results.first().textContent();
          console.log(`  ✅ Patient search results: ${count} items`);
          console.log(`  First result: "${firstText?.trim().substring(0, 80)}"`);
        }
      }
    } else {
      console.log("  ⚠️ No New Authorization button");
    }
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
    await page.screenshot({ path: "/tmp/07-error.png" });
  }

  // ======= ISSUE 8: Care Plans Interventions =======
  console.log("\n=== ISSUE 8: Care Plans Interventions ===");
  try {
    await page.goto(`${BASE}/care-plans`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/08-care-plans.png" });

    const text = await page.evaluate(() => document.body.innerText);
    const hasInterventions = text.toLowerCase().includes("intervention");
    console.log(`  Page mentions interventions: ${hasInterventions}`);
    console.log(`  Page text preview: ${text.substring(0, 500)}`);
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
  }

  // ======= ISSUE 1: Encounter Reason for Visit =======
  console.log("\n=== ISSUE 1: Encounter Reason for Visit Negative Cases ===");
  try {
    await page.goto(`${BASE}/patients`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('button[title="View Chart"]').first().click();
    await page.waitForTimeout(5000);

    // Click ENCOUNTERS tab
    const encTab = page.locator('button:has-text("ENCOUNTERS"), button:has-text("Encounters")').first();
    if (await encTab.isVisible({ timeout: 5000 })) {
      await encTab.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "/tmp/01-encounters.png" });

      const text = await page.evaluate(() => document.body.innerText);
      console.log(`  Encounters tab text: ${text.substring(0, 500)}`);

      // Click Add/New button
      const addBtn = page.locator('button:has-text("Add"), button:has-text("New Encounter"), button:has-text("+")').first();
      if (await addBtn.isVisible({ timeout: 5000 })) {
        await addBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "/tmp/01-new-encounter.png" });

        const formText = await page.evaluate(() => document.body.innerText);
        console.log(`  New encounter form: ${formText.substring(0, 500)}`);
      } else {
        console.log("  ⚠️ No Add button for encounters");
      }
    } else {
      console.log("  ⚠️ Encounters tab not found");
      const allBtns = await page.locator('button').allTextContents();
      console.log("  Available buttons:", allBtns.filter(b => b.trim() && b.length < 30).join(", "));
    }
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
    await page.screenshot({ path: "/tmp/01-error.png" });
  }

  // ======= ISSUE 2: Immunization Lot/Dose Validation =======
  console.log("\n=== ISSUE 2: Immunization Lot/Dose Validation ===");
  try {
    await page.goto(`${BASE}/immunizations`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/02-immunizations.png" });

    const text = await page.evaluate(() => document.body.innerText);
    console.log(`  Immunizations page text: ${text.substring(0, 300)}`);
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
  }

  // ======= ISSUE 3: Demographics non-primary phone =======
  console.log("\n=== ISSUE 3: Demographics Non-Primary Phone Not Mandatory ===");
  try {
    await page.goto(`${BASE}/patients`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('button[title="View Chart"]').first().click();
    await page.waitForTimeout(5000);

    // Click Demographics
    const demoTab = page.locator('button:has-text("Demographics")').first();
    if (await demoTab.isVisible({ timeout: 5000 })) {
      await demoTab.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "/tmp/03-demographics.png" });

      const text = await page.evaluate(() => document.body.innerText);
      console.log(`  Demographics text: ${text.substring(0, 800)}`);

      // Look for phone fields with asterisks
      const labels = await page.locator('label').all();
      for (const label of labels) {
        const text = await label.textContent();
        if (text && text.toLowerCase().includes("phone")) {
          const html = await label.innerHTML();
          const mandatory = html.includes("*") || html.includes("text-red");
          console.log(`  Phone field: "${text.trim()}" mandatory=${mandatory}`);
        }
      }
    } else {
      console.log("  ⚠️ Demographics tab not found");
    }
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`);
    await page.screenshot({ path: "/tmp/03-error.png" });
  }

  console.log("\n=== All tests complete ===");
  await browser.close();
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
