import { test } from "@playwright/test";

const BASE = "https://app-dev.ciyex.org";

test("debug all tab columns", async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(BASE);
    await page.waitForTimeout(3000);

    // If on signin page, use PKCE flow
    if (page.url().includes("signin")) {
        await page.evaluate(async () => {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            const codeVerifier = btoa(String.fromCharCode(...array))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const encoder = new TextEncoder();
            const data = encoder.encode(codeVerifier);
            const digest = await crypto.subtle.digest('SHA-256', data);
            const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            sessionStorage.setItem('pkce_code_verifier', codeVerifier);
            const params = new URLSearchParams({
                client_id: 'ciyex-app',
                redirect_uri: window.location.origin + '/callback',
                response_type: 'code',
                scope: 'openid profile email organization',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            });
            window.location.href = `https://dev.aran.me/realms/ciyex/protocol/openid-connect/auth?${params}`;
        });
        await page.waitForTimeout(5000);
    }

    // Keycloak step 1: Enter username
    const usernameField = page.locator('#username').first();
    if (await usernameField.isVisible({ timeout: 10000 }).catch(() => false)) {
        await usernameField.fill("michael.chen");
        // Click Sign In (first step - just username)
        await page.locator('#kc-login, button[type="submit"]').first().click();
        await page.waitForTimeout(3000);
    }

    console.log("After username step URL:", page.url());
    await page.screenshot({ path: "test-results/debug-kc-step2.png", fullPage: true });

    // Keycloak step 2: Enter password
    const passwordField = page.locator('#password').first();
    if (await passwordField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await passwordField.fill("Test@123");
        await page.locator('#kc-login, button[type="submit"]').first().click();
        await page.waitForTimeout(10000);
    }

    console.log("After login URL:", page.url());
    await page.screenshot({ path: "test-results/debug-after-login.png", fullPage: true });

    // Practice selection
    const practiceBtn = page.locator('text=Sunrise Family Medicine').first();
    if (await practiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await practiceBtn.click();
        await page.waitForTimeout(5000);
    }

    console.log("After practice URL:", page.url());
    await page.screenshot({ path: "test-results/debug-dashboard.png", fullPage: true });

    // Navigate to patients
    await page.goto(`${BASE}/patients`);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "test-results/debug-patients.png", fullPage: true });

    // Click first patient
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    console.log(`Patient rows: ${rowCount}`);
    if (rowCount > 0) {
        const txt = await rows.first().textContent().catch(() => "");
        console.log("First patient:", txt?.substring(0, 120));
        await rows.first().click();
        await page.waitForTimeout(5000);
    }

    console.log("Patient chart URL:", page.url());
    await page.screenshot({ path: "test-results/debug-patient-chart.png", fullPage: true });

    // Test each tab
    const tabsToTest = ["Allergies", "Appointments", "Encounters", "Labs", "Procedures", "Claims", "Billing", "Transactions", "Issues"];

    for (const tabName of tabsToTest) {
        console.log(`\n=== Tab: ${tabName} ===`);
        const tabBtn = page.locator(`span:text-is("${tabName}")`).first();
        if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await tabBtn.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: `test-results/debug-tab-${tabName.toLowerCase()}.png`, fullPage: true });

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
                    for (let i = 0; i < Math.min(cells.length, headers.length); i++) {
                        if (cells[i].trim() === "-" || cells[i].trim() === "") {
                            console.log(`  *** EMPTY: "${headers[i].trim()}" = "${cells[i].trim()}"`);
                        }
                    }
                }
            } else {
                console.log(`  No table visible`);
            }
        } else {
            console.log(`  Tab not found`);
        }
    }
});
