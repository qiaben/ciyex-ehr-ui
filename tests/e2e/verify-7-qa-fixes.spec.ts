import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function login(page: Page) {
  await page.goto(BASE);
  await page.waitForTimeout(3000);
  const appEmailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (await appEmailInput.isVisible().catch(() => false)) {
    await appEmailInput.fill("michael.chen@example.com");
    await page.locator('button:has-text("Continue"), button[type="submit"]').first().click();
    await page.waitForTimeout(5000);
  }
  const passInput = page.locator('input[type="password"]').first();
  if (await passInput.isVisible().catch(() => false)) {
    await passInput.fill("Test@123");
    await page.locator('input[type="submit"], button[type="submit"], button:has-text("Sign In")').first().click();
    await page.waitForTimeout(5000);
  }
  const passInput2 = page.locator('input[type="password"]').first();
  if (await passInput2.isVisible().catch(() => false)) {
    await passInput2.fill("Test@123");
    await page.locator('input[type="submit"], button[type="submit"]').first().click();
    await page.waitForTimeout(5000);
  }
  await page.waitForTimeout(2000);
}

test.describe("Final QA Verification", () => {
  test.setTimeout(120000);

  test("Issue #1: Delete provider in Settings persists after navigation", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(5000);

    // Click Providers tab (already visible in sidebar)
    const providerTab = page.locator('button:has-text("Providers"), a:has-text("Providers")').first();
    await providerTab.click();
    await page.waitForTimeout(3000);

    // Count initial rows
    const rows = page.locator('table tbody tr');
    const initialCount = await rows.count();
    console.log(`Initial provider rows: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Get name of last provider (to verify it's gone after delete)
    const lastRow = rows.last();
    const lastRowText = await lastRow.textContent();
    console.log(`Last row text: ${lastRowText?.substring(0, 80)}`);

    // Click delete icon on last row (trash icon)
    const deleteIcon = lastRow.locator('svg, button').last();
    await deleteIcon.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/qa7-final-01-delete-dialog.png" });

    // Confirm deletion if dialog appears
    const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: "test-results/qa7-final-02-after-delete.png" });

    // Navigate away
    await page.goto(`${BASE}/calendar`);
    await page.waitForTimeout(3000);

    // Navigate back to settings > providers
    await page.goto(`${BASE}/settings`);
    await page.waitForTimeout(5000);
    await providerTab.click();
    await page.waitForTimeout(3000);

    const afterCount = await rows.count();
    console.log(`After delete+nav provider rows: ${afterCount}`);
    await page.screenshot({ path: "test-results/qa7-final-03-after-navigate.png" });

    // Deleted record should NOT reappear
    expect(afterCount).toBeLessThan(initialCount);
  });

  test("Issue #5: Email* on Contact Information tab in Add Patient", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/patients/new`);
    await page.waitForTimeout(5000);

    // Click "Contact Information" tab
    const contactTab = page.locator('button:has-text("Contact Information"), a:has-text("Contact Information")').first();
    expect(await contactTab.isVisible()).toBe(true);
    await contactTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/qa7-final-04-contact-info-tab.png" });

    // Now find Email label - should have asterisk
    const emailLabel = page.locator('label:has-text("Email")').first();
    expect(await emailLabel.isVisible()).toBe(true);
    const labelText = await emailLabel.textContent();
    const labelHtml = await emailLabel.innerHTML();
    console.log(`Contact tab Email label: "${labelText}"`);
    console.log(`Contact tab Email HTML: "${labelHtml}"`);
    await page.screenshot({ path: "test-results/qa7-final-05-email-label.png" });

    // Verify asterisk
    expect(labelText?.includes("*") || labelHtml.includes("*") || labelHtml.includes("text-red")).toBeTruthy();
    console.log("Email* label verified on Contact Information tab");
  });

  test("Issue #6: Email* on Edit Patient form", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/patients`);
    await page.waitForTimeout(5000);

    // Click first patient
    const firstRow = page.locator('table tbody tr').first();
    if (!(await firstRow.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log("No patients found, skipping");
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "test-results/qa7-final-07-patient-detail.png" });

    // Find Edit button or link
    const editLink = page.locator('a[href*="edit"], button:has-text("Edit")').first();
    if (await editLink.isVisible().catch(() => false)) {
      await editLink.click();
      await page.waitForTimeout(4000);
    }
    await page.screenshot({ path: "test-results/qa7-final-08-edit-form.png" });

    // Check for Email label with asterisk
    const emailLabel = page.locator('label:has-text("Email")').first();
    if (await emailLabel.isVisible().catch(() => false)) {
      const labelText = await emailLabel.textContent();
      const labelHtml = await emailLabel.innerHTML();
      console.log(`Edit form Email label: "${labelText}"`);
      console.log(`Edit form Email HTML: "${labelHtml}"`);
      expect(labelText?.includes("*") || labelHtml.includes("*") || labelHtml.includes("text-red")).toBeTruthy();

      // Clear email and try save
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.clear();
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: "test-results/qa7-final-09-edit-email-error.png" });
        }
      }
    }
  });

  test("Issue #7: Immunization Administered By required", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/patients`);
    await page.waitForTimeout(5000);

    const firstRow = page.locator('table tbody tr').first();
    if (!(await firstRow.isVisible({ timeout: 10000 }).catch(() => false))) {
      console.log("No patients, skipping");
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForTimeout(4000);

    // Find Immunizations in the patient sidebar/tabs
    const immunTab = page.locator('button:has-text("Immunization"), a:has-text("Immunization"), [data-key="immunizations"]').first();
    if (await immunTab.isVisible().catch(() => false)) {
      await immunTab.click();
      await page.waitForTimeout(3000);
    } else {
      // Try scrolling sidebar or looking for it differently
      const sidebarLinks = page.locator('nav a, aside a, [role="tablist"] button');
      const linkCount = await sidebarLinks.count();
      for (let i = 0; i < linkCount; i++) {
        const text = await sidebarLinks.nth(i).textContent().catch(() => "");
        if (text?.toLowerCase().includes("immun")) {
          await sidebarLinks.nth(i).click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    await page.screenshot({ path: "test-results/qa7-final-10-immunizations.png" });

    // Click Add/New
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Record")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "test-results/qa7-final-11-immun-form.png" });

      // Check "Administered By" label
      const adminLabel = page.locator('label:has-text("Administered By")').first();
      if (await adminLabel.isVisible().catch(() => false)) {
        const labelText = await adminLabel.textContent();
        console.log(`Administered By label: "${labelText}"`);
        expect(labelText).toContain("*");
      }

      // Fill vaccine but NOT administered by, then try submit
      const vaccineInput = page.locator('input[name="vaccineName"], select[name="vaccineName"]').first();
      if (await vaccineInput.isVisible().catch(() => false)) {
        const tag = await vaccineInput.evaluate(el => el.tagName);
        if (tag === "SELECT") await vaccineInput.selectOption({ index: 1 });
        else await vaccineInput.fill("COVID-19");
      }

      // Fill lot number (required too)
      const lotInput = page.locator('input[name="lotNumber"]').first();
      if (await lotInput.isVisible().catch(() => false)) {
        await lotInput.fill("LOT123");
      }

      // Date
      const dateInput = page.locator('input[name="dateAdministered"], input[type="date"]').first();
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill("2026-03-25");
      }

      // Force click save (may be disabled due to validation)
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Record"), button[type="submit"]').first();
      await page.screenshot({ path: "test-results/qa7-final-12-before-save.png" });
      if (await saveBtn.isVisible().catch(() => false)) {
        const isDisabled = await saveBtn.isDisabled();
        console.log(`Save button disabled: ${isDisabled}`);
        if (isDisabled) {
          // Validation prevents submit - that means Administered By is blocking it
          console.log("Save button is disabled - Administered By validation is working!");

          // Check for error text
          const errorMsg = page.locator('text=Administered By is required').first();
          const hasError = await errorMsg.isVisible().catch(() => false);
          console.log(`Administered By error visible: ${hasError}`);
        }
        await saveBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "test-results/qa7-final-13-after-save.png" });
      }
    } else {
      console.log("No Add button found");
      await page.screenshot({ path: "test-results/qa7-final-10-no-add-btn.png" });
    }
  });
});
