import { test } from "@playwright/test";

const BASE = "http://localhost:3006";

test("debug columns locally via proxy", async ({ page }) => {
    test.setTimeout(120000);

    // Intercept console logs
    page.on("console", (msg) => {
        if (msg.type() === "log" || msg.type() === "warn" || msg.type() === "error") {
            console.log(`[BROWSER ${msg.type()}]`, msg.text());
        }
    });

    // Get a token via password grant (bypass the PKCE flow)
    const tokenRes = await page.request.post("https://dev.aran.me/realms/ciyex/protocol/openid-connect/token", {
        form: {
            grant_type: "password",
            client_id: "ciyex-app",
            username: "michael.chen",
            password: "Test@123",
        },
    });
    const tokenData = await tokenRes.json();
    console.log("Token obtained:", !!tokenData.access_token);

    if (!tokenData.access_token) {
        console.log("Failed to get token:", JSON.stringify(tokenData));
        return;
    }

    // Navigate to app first to set localStorage on the correct origin
    await page.goto(BASE + "/signin");
    await page.waitForTimeout(1000);

    // Inject auth tokens into localStorage
    await page.evaluate((tokens) => {
        localStorage.setItem("token", tokens.access_token);
        localStorage.setItem("refreshToken", tokens.refresh_token || "");
        localStorage.setItem("authMethod", "keycloak");
        localStorage.setItem("selectedTenant", "sunrise-family-medicine");
        localStorage.setItem("userEmail", "michael.chen@sunrisefamilymedicine.com");
        localStorage.setItem("userFullName", "Michael Chen");
        localStorage.setItem("groups", JSON.stringify(["super_admin", "ADMIN"]));
    }, tokenData);

    // Go to patients page
    await page.goto(`${BASE}/patients`);
    await page.waitForTimeout(5000);

    console.log("Current URL:", page.url());
    await page.screenshot({ path: "test-results/local-patients.png", fullPage: true });

    // Check if we got redirected back to signin
    if (page.url().includes("signin")) {
        console.log("ERROR: Got redirected to signin despite setting token");
        return;
    }

    // Click a patient with seeded data (look for Thomas Moore or John Smith)
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    console.log(`Patient rows: ${rowCount}`);

    // Find and click a patient with known data
    let targetRow = null;
    for (let i = 0; i < Math.min(rowCount, 20); i++) {
        const txt = await rows.nth(i).textContent().catch(() => "");
        if (txt?.includes("Thomas Moore") || txt?.includes("John Smith") || txt?.includes("Sarah Johnson")) {
            targetRow = rows.nth(i);
            console.log(`Found patient at row ${i}: ${txt?.substring(0, 80)}`);
            break;
        }
    }

    if (!targetRow) {
        if (rowCount > 0) {
            targetRow = rows.first();
            const txt = await targetRow.textContent().catch(() => "");
            console.log("Using first patient:", txt?.substring(0, 80));
        } else {
            console.log("No patients found");
            return;
        }
    }

    // Click the view (eye) icon to navigate to patient chart
    const viewBtn = targetRow.locator('button, a, [role="button"]').first();
    if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewBtn.click();
    } else {
        // Direct navigation as fallback
        const patientId = await targetRow.locator("td").nth(1).textContent();
        console.log("Navigating to patient:", patientId?.trim());
        await page.goto(`${BASE}/patients/${patientId?.trim()}`);
    }
    await page.waitForTimeout(5000);

    console.log("Patient chart URL:", page.url());
    await page.screenshot({ path: "test-results/local-chart.png", fullPage: true });

    // The sidebar has collapsible sections. Expand all sections first.
    const sections = ["SYSTEM", "GENERAL", "ENCOUNTERS", "CLINICAL", "CLAIMS", "FINANCIAL", "OTHER"];
    for (const section of sections) {
        try {
            const sectionEl = page.locator(`text="${section}"`).first();
            await sectionEl.scrollIntoViewIfNeeded({ timeout: 2000 });
            await sectionEl.click({ timeout: 1000 });
            await page.waitForTimeout(300);
        } catch { /* section may not exist or already expanded */ }
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/local-sidebar-expanded.png", fullPage: true });

    // Tab names as they appear in sidebar menu
    const tabsToTest = [
        "Allergies", "Appointments", "Encounters", "Visit Notes",
        "Labs", "Procedures", "Claims", "Billing", "Transactions",
        "Issues", "Documents", "Education", "Messaging",
        "Denials", "ERA / Remittance"
    ];

    for (const tabName of tabsToTest) {
        console.log(`\n=== Tab: ${tabName} ===`);

        // Look for the sidebar link - scroll into view and click
        const link = page.locator(`text="${tabName}"`).first();
        try {
            await link.scrollIntoViewIfNeeded({ timeout: 3000 });
            await link.click({ timeout: 3000 });
        } catch {
            console.log(`  Tab "${tabName}" not found/clickable in sidebar`);
            continue;
        }

        await page.waitForTimeout(3000);
        await page.screenshot({ path: `test-results/local-tab-${tabName.toLowerCase().replace(/\s/g, '-')}.png`, fullPage: true });

        const table = page.locator("table").first();
        if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
            const headers = await page.locator("table thead th").allTextContents();
            console.log(`  Headers: ${headers.join(" | ")}`);
            const dataRows = page.locator("table tbody tr");
            const count = await dataRows.count();
            console.log(`  Rows: ${count}`);
            if (count > 0) {
                const cells = await dataRows.first().locator("td").allTextContents();
                console.log(`  Row 1: ${cells.join(" | ")}`);
                // Check for empty cells (dash or empty)
                for (let i = 0; i < Math.min(cells.length, headers.length); i++) {
                    if (cells[i].trim() === "-" || cells[i].trim() === "") {
                        console.log(`  *** EMPTY: "${headers[i].trim()}" = "${cells[i].trim()}"`);
                    }
                }
            }
        } else {
            console.log(`  No table visible`);
            const noRecords = page.locator('text="No records found"').first();
            if (await noRecords.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log(`  Shows "No records found"`);
            }
        }
    }
});
