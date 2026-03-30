import { test, expect } from "@playwright/test";

const BASE = "https://app-dev.ciyex.org";

async function login(page: any) {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  // If redirected to Keycloak login
  if (page.url().includes("aran.me") || page.url().includes("auth")) {
    await page.fill('input[name="username"], #username', "Kiran@example.com");
    await page.fill('input[name="password"], #password', "Test@123");
    await page.click('input[type="submit"], button[type="submit"], #kc-login');
    await page.waitForTimeout(3000);
  }
  // Wait for app to load
  await page.waitForTimeout(2000);
}

// Test 1: Encounter reason for visit validation
test("1 - Encounter reason for visit column", async ({ page }) => {
  await login(page);
  // Navigate to patients
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/1-patients-page.png", fullPage: true });

  // Click first patient
  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/1-patient-detail.png", fullPage: true });

  // Look for encounters tab/section
  const encounterTab = page.locator("text=Encounters, text=Encounter").first();
  if (await encounterTab.isVisible()) {
    await encounterTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/1-encounters.png", fullPage: true });
});

// Test 2: Immunization validation
test("2 - Immunization lot number/dose validation", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);

  // Click first patient
  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }

  // Navigate to clinical tab
  const clinicalTab = page.locator("text=Clinical").first();
  if (await clinicalTab.isVisible()) {
    await clinicalTab.click();
    await page.waitForTimeout(1000);
  }

  // Look for immunization
  const immunizationLink = page.locator("text=Immunization, text=Immunizations").first();
  if (await immunizationLink.isVisible()) {
    await immunizationLink.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/2-immunizations.png", fullPage: true });
});

// Test 3: Demographics contact info - mobile phone mandatory asterisk
test("3 - Demographics mobile phone mandatory asterisk", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);

  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }

  // Look for demographics tab
  const demoTab = page.locator("text=Demographics").first();
  if (await demoTab.isVisible()) {
    await demoTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/3-demographics.png", fullPage: true });

  // Look for Contact Information section
  const contactSection = page.locator("text=Contact Information, text=Contact Info").first();
  if (await contactSection.isVisible()) {
    await contactSection.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: "test-results/3-contact-info.png", fullPage: true });
});

// Test 4: Emergency contact name validation
test("4 - Emergency contact name validation", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);

  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }

  const demoTab = page.locator("text=Demographics").first();
  if (await demoTab.isVisible()) {
    await demoTab.click();
    await page.waitForTimeout(2000);
  }

  // Look for Emergency Contact section
  const emergencySection = page.locator("text=Emergency Contact").first();
  if (await emergencySection.isVisible()) {
    await emergencySection.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: "test-results/4-emergency-contact.png", fullPage: true });
});

// Test 5: Additional identifiers showing values in empty fields
test("5 - Additional identifiers showing values when empty", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);

  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }

  const demoTab = page.locator("text=Demographics").first();
  if (await demoTab.isVisible()) {
    await demoTab.click();
    await page.waitForTimeout(2000);
  }

  // Look for Additional Identifiers section
  const additionalSection = page.locator("text=Additional Identifiers, text=Additional ID").first();
  if (await additionalSection.isVisible()) {
    await additionalSection.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: "test-results/5-additional-identifiers.png", fullPage: true });
});

// Test 6: Appointment pagination
test("6 - Appointment pagination buttons", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/appointments`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/6-appointments-page1.png", fullPage: true });

  // Try clicking Next button
  const nextBtn = page.locator("button:has-text('Next')").first();
  if (await nextBtn.isVisible()) {
    const isDisabled = await nextBtn.isDisabled();
    console.log("Next button disabled:", isDisabled);
    if (!isDisabled) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  await page.screenshot({ path: "test-results/6-appointments-page2.png", fullPage: true });

  // Try page size change
  const pageSizeSelect = page.locator("select").last();
  if (await pageSizeSelect.isVisible()) {
    await pageSizeSelect.selectOption("10");
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/6-appointments-size10.png", fullPage: true });
});

// Test 7: Authorization patient search
test("7 - Authorization patient name search", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/authorizations`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/7-authorizations.png", fullPage: true });

  // Click new prior auth button
  const newBtn = page.locator("button:has-text('New'), button:has-text('Add'), button:has-text('Create')").first();
  if (await newBtn.isVisible()) {
    await newBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: "test-results/7-new-auth-form.png", fullPage: true });

  // Try patient name search
  const patientInput = page.locator("input[placeholder*='patient'], input[placeholder*='Patient'], input[placeholder*='Search patient']").first();
  if (await patientInput.isVisible()) {
    await patientInput.fill("Jen");
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/7-patient-search.png", fullPage: true });
});

// Test 8: Care plans interventions
test("8 - Care plans interventions GET", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/care-plans`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/8-care-plans.png", fullPage: true });

  // Expand first care plan to see interventions
  const expandBtn = page.locator("button").filter({ hasText: /chevron|expand/i }).first();
  const carePlanCard = page.locator("[class*='card'], [class*='Card']").first();
  if (await carePlanCard.isVisible()) {
    await carePlanCard.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/8-care-plan-expanded.png", fullPage: true });
});

// Test 9: Edit patient - email asterisk + phone validation
test("9 - Edit patient email asterisk and phone validation", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/patients`);
  await page.waitForTimeout(3000);

  const patientRow = page.locator("table tbody tr").first();
  if (await patientRow.isVisible()) {
    await patientRow.click();
    await page.waitForTimeout(2000);
  }

  // Click edit button
  const editBtn = page.locator("button:has-text('Edit'), a:has-text('Edit')").first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: "test-results/9-edit-patient.png", fullPage: true });

  // Try entering 9 digit phone
  const phoneInput = page.locator("input[name='phoneNumber'], input#phoneNumber").first();
  if (await phoneInput.isVisible()) {
    await phoneInput.fill("");
    await phoneInput.type("123456789"); // 9 digits
    await page.waitForTimeout(500);
  }

  // Try submit
  const saveBtn = page.locator("button[type='submit'], button:has-text('Save')").first();
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: "test-results/9-phone-validation.png", fullPage: true });
});
