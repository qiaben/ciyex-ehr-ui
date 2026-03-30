import { test, expect } from "@playwright/test";

const BASE = "https://app-dev.ciyex.org";

test("Check date fields and API responses for patient 6619", async ({ page }) => {
  // Collect API responses
  const apiResponses: Record<string, any> = {};

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/fhir-resource/") && url.includes("patient/6619")) {
      try {
        const json = await response.json();
        const tabKey = url.match(/fhir-resource\/([^/]+)\//)?.[1] || "unknown";
        apiResponses[tabKey] = json;
        console.log(`API [${tabKey}]: ${json.data?.content?.length || 0} records`);
        if (json.data?.content?.length > 0) {
          console.log(`  First record keys: ${Object.keys(json.data.content[0]).join(", ")}`);
          const record = json.data.content[0];
          // Log date-like fields
          for (const [k, v] of Object.entries(record)) {
            if (k.toLowerCase().includes("date") || k.toLowerCase().includes("onset") ||
                k.toLowerCase().includes("start") || k.toLowerCase().includes("end") ||
                k.toLowerCase().includes("effective") || k.toLowerCase().includes("resolved") ||
                k.toLowerCase().includes("sent") || k.toLowerCase().includes("severity")) {
              console.log(`  ${k}: ${JSON.stringify(v)}`);
            }
          }
        }
      } catch {}
    }
    // Encounters
    if (url.includes("/api/") && url.includes("/encounters") && !url.includes("fhir-resource")) {
      try {
        const json = await response.json();
        console.log(`API [encounters]: ${Array.isArray(json.data) ? json.data.length : 'N/A'} records`);
        if (Array.isArray(json.data) && json.data.length > 0) {
          const e = json.data[0];
          console.log(`  Encounter fields: ${Object.keys(e).join(", ")}`);
          for (const [k, v] of Object.entries(e)) {
            if (k.toLowerCase().includes("date") || k.toLowerCase().includes("start") || k.toLowerCase().includes("end")) {
              console.log(`  ${k}: ${JSON.stringify(v)}`);
            }
          }
        }
      } catch {}
    }
    // Tab field config
    if (url.includes("/api/tab-field-config/")) {
      try {
        const json = await response.json();
        const tabKey = url.match(/tab-field-config\/([^?]+)/)?.[1] || "unknown";
        console.log(`CONFIG [${tabKey}]: loaded`);
      } catch {}
    }
    // Encounter form config
    if (url.includes("/api/tab-field-config/encounter-form")) {
      try {
        const json = await response.json();
        const config = json.data || json;
        const fc = typeof config.fieldConfig === "string" ? JSON.parse(config.fieldConfig) : config.fieldConfig;
        const sections = fc?.sections || [];
        console.log(`ENCOUNTER CONFIG: ${sections.length} sections`);
        sections.forEach((s: any) => {
          console.log(`  Section: ${s.key} - visible: ${s.visible}`);
        });
      } catch {}
    }
  });

  // Login
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  // Check if Keycloak login
  if (page.url().includes("aran.me") || page.url().includes("auth")) {
    await page.fill('input[name="username"]', "michael.chen");
    await page.fill('input[name="password"]', "Test@123");
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForURL(/app-dev\.ciyex\.org/, { timeout: 15000 });
  }

  await page.waitForTimeout(3000);

  // Navigate to patient 6619
  await page.goto(`${BASE}/patients/6619`);
  await page.waitForTimeout(5000);

  // Take screenshot of patient page
  await page.screenshot({ path: "/home/debian/workspace/test-results/patient-overview.png", fullPage: true });

  // Check allergies tab
  await page.goto(`${BASE}/patients/6619?tab=allergies`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/allergies-tab.png", fullPage: true });

  // Check medical problems tab
  await page.goto(`${BASE}/patients/6619?tab=medicalproblems`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/medicalproblems-tab.png", fullPage: true });

  // Check insurance coverage tab
  await page.goto(`${BASE}/patients/6619?tab=insurance-coverage`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/insurance-tab.png", fullPage: true });

  // Check messaging tab
  await page.goto(`${BASE}/patients/6619?tab=messaging`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/messaging-tab.png", fullPage: true });

  // Check vitals tab
  await page.goto(`${BASE}/patients/6619?tab=vitals`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/vitals-tab.png", fullPage: true });

  // Check encounters
  await page.goto(`${BASE}/patients/6619?tab=encounters`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/encounters-tab.png", fullPage: true });

  // Check documents
  await page.goto(`${BASE}/patients/6619?tab=documents`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/documents-tab.png", fullPage: true });

  // Check encounter form config in settings
  await page.goto(`${BASE}/settings/encounter-settings`);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "/home/debian/workspace/test-results/encounter-settings.png", fullPage: true });

  console.log("\n=== API RESPONSES SUMMARY ===");
  for (const [key, val] of Object.entries(apiResponses)) {
    console.log(`${key}: ${val.data?.content?.length || 0} records`);
  }
});
