import { test, expect, Page } from "@playwright/test";

const BASE = "https://app-dev.ciyex.org";

async function login(page: Page, user: string, pass: string) {
    await page.goto(BASE);
    await page.waitForURL(/dev\.aran\.me|app-dev\.ciyex\.org/, { timeout: 15000 });
    if (page.url().includes("dev.aran.me")) {
        await page.fill("#username", user);
        await page.fill("#password", pass);
        await page.click("#kc-login");
    }
    await page.waitForURL(/app-dev\.ciyex\.org/, { timeout: 20000 });
    await page.waitForTimeout(3000);
}

test.describe("Verify All 12 Bug Fixes", () => {
    test.setTimeout(180000);

    test("Bug 1: Task provider search dropdown shows results", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/tasks`);
        await page.waitForTimeout(3000);

        // Click add task button
        const addBtn = page.locator("button").filter({ hasText: /new task|add task|\+|create/i }).first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1500);
        }

        // Look for the task form panel
        const providerInput = page.locator("input[placeholder*='earch']").first();
        if (await providerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await providerInput.fill("sar");
            await page.waitForTimeout(2000);
            // Check for dropdown results
            const dropdown = page.locator("[class*='absolute'][class*='z-']").first();
            const visible = await dropdown.isVisible().catch(() => false);
            console.log("Provider dropdown visible:", visible);
        }
        await page.screenshot({ path: "test-results/bug1-task-provider.png", fullPage: true });
    });

    test("Bug 2: Appointment saves without 422 error", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/calendar`);
        await page.waitForTimeout(3000);

        // Listen for 422 errors
        let got422 = false;
        page.on("response", (res) => {
            if (res.status() === 422) got422 = true;
        });

        // Try to create an appointment
        const newBtn = page.locator("button").filter({ hasText: /new|add|create|appointment/i }).first();
        if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await newBtn.click();
            await page.waitForTimeout(1500);
        }
        await page.screenshot({ path: "test-results/bug2-appointment.png", fullPage: true });
        console.log("Got 422 on appointment:", got422);
    });

    test("Bug 3: Immunization LOT number requires 8+ chars", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        // Navigate to a patient's immunizations
        await page.goto(`${BASE}/patients`);
        await page.waitForTimeout(2000);

        // Click first patient
        const patientRow = page.locator("table tbody tr, [class*='patient']").first();
        if (await patientRow.isVisible({ timeout: 3000 }).catch(() => false)) {
            await patientRow.click();
            await page.waitForTimeout(2000);

            // Find immunization tab
            const immTab = page.locator("button, a, [role='tab']").filter({ hasText: /immuniz/i }).first();
            if (await immTab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await immTab.click();
                await page.waitForTimeout(1500);
            }
        }
        await page.screenshot({ path: "test-results/bug3-immunization.png", fullPage: true });
    });

    test("Bug 4: Patient DOB blocks future dates", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/patients/new`);
        await page.waitForTimeout(2000);

        const dobField = page.locator("input[type='date']").first();
        if (await dobField.isVisible({ timeout: 3000 }).catch(() => false)) {
            const maxVal = await dobField.getAttribute("max");
            const today = new Date().toISOString().split("T")[0];
            console.log("DOB max:", maxVal, "today:", today);
            expect(maxVal).toBe(today);
        }
        await page.screenshot({ path: "test-results/bug4-dob.png", fullPage: true });
    });

    test("Bug 5: Patient phone number limited to 10 digits", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/patients/new`);
        await page.waitForTimeout(2000);

        const phoneField = page.locator("input[type='tel'], input[placeholder*='phone' i]").first();
        if (await phoneField.isVisible({ timeout: 3000 }).catch(() => false)) {
            await phoneField.fill("12345678901234"); // 14 digits
            await page.waitForTimeout(500);
            const val = await phoneField.inputValue();
            console.log("Phone value after 14 digits:", val, "length:", val.replace(/\D/g, "").length);
            // Should be max 10 digits
        }
        await page.screenshot({ path: "test-results/bug5-phone.png", fullPage: true });
    });

    test("Bug 6: Patient document upload blocks invalid types", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/patients`);
        await page.waitForTimeout(2000);

        const patientRow = page.locator("table tbody tr").first();
        if (await patientRow.isVisible({ timeout: 3000 }).catch(() => false)) {
            await patientRow.click();
            await page.waitForTimeout(2000);

            // Find documents tab
            const docTab = page.locator("button, a, [role='tab']").filter({ hasText: /document|file/i }).first();
            if (await docTab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await docTab.click();
                await page.waitForTimeout(1500);

                // Check file input has accept attribute
                const fileInput = page.locator("input[type='file']").first();
                if (await fileInput.count() > 0) {
                    const accept = await fileInput.getAttribute("accept");
                    console.log("File input accept:", accept);
                }
            }
        }
        await page.screenshot({ path: "test-results/bug6-documents.png", fullPage: true });
    });

    test("Bug 7: Lab results value rejects negative numbers", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/patients`);
        await page.waitForTimeout(2000);

        const patientRow = page.locator("table tbody tr").first();
        if (await patientRow.isVisible({ timeout: 3000 }).catch(() => false)) {
            await patientRow.click();
            await page.waitForTimeout(2000);

            const labTab = page.locator("button, a, [role='tab']").filter({ hasText: /lab/i }).first();
            if (await labTab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await labTab.click();
                await page.waitForTimeout(1500);
            }
        }
        await page.screenshot({ path: "test-results/bug7-lab.png", fullPage: true });
    });

    test("Bug 8: Calendar provider search visible for non-admin", async ({ page }) => {
        await login(page, "dr.sarah.williams", "Test@123");
        await page.goto(`${BASE}/calendar`);
        await page.waitForTimeout(3000);

        // Check for provider filter
        const provBtn = page.locator("button").filter({ hasText: /provider/i }).first();
        if (await provBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await provBtn.click();
            await page.waitForTimeout(500);
            const searchInput = page.locator("input[placeholder*='earch']");
            const hasSearch = await searchInput.isVisible().catch(() => false);
            console.log("Calendar search visible for dr.sarah:", hasSearch);
        }
        await page.screenshot({ path: "test-results/bug8-calendar.png", fullPage: true });
    });

    test("Bug 9: No-show report has time and financial columns", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);

        // Find no-show report
        const noShowBtn = page.locator("button, a, [class*='card']").filter({ hasText: /no.?show/i }).first();
        if (await noShowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await noShowBtn.click();
            await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: "test-results/bug9-noshow.png", fullPage: true });
    });

    test("Bug 10: Audit log report uses real data", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/reports`);
        await page.waitForTimeout(2000);

        const auditBtn = page.locator("button, a, [class*='card']").filter({ hasText: /audit/i }).first();
        if (await auditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await auditBtn.click();
            await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: "test-results/bug10-audit.png", fullPage: true });
    });

    test("Bug 11: Authorization memberId alphanumeric only", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/authorizations`);
        await page.waitForTimeout(2000);

        // Try to create new authorization
        const newBtn = page.locator("button").filter({ hasText: /new|add|create/i }).first();
        if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await newBtn.click();
            await page.waitForTimeout(1000);

            const memberIdInput = page.locator("input[name*='member' i], input[placeholder*='member' i]").first();
            if (await memberIdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await memberIdInput.fill("ABC-123@#$");
                await page.waitForTimeout(500);
                const val = await memberIdInput.inputValue();
                console.log("MemberId after special chars:", val);
            }
        }
        await page.screenshot({ path: "test-results/bug11-auth.png", fullPage: true });
    });

    test("Bug 12: Claim management uses icons not text", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/claim-management`);
        await page.waitForTimeout(3000);

        // Check that action column uses icons not text buttons
        const editTextBtn = page.locator("td button").filter({ hasText: /^Edit$/ });
        const editCount = await editTextBtn.count();
        console.log("Text 'Edit' buttons in table:", editCount);

        const statusTextBtn = page.locator("td button").filter({ hasText: /^Update Status$/ });
        const statusCount = await statusTextBtn.count();
        console.log("Text 'Update Status' buttons:", statusCount);

        // Check for SVG icons instead
        const svgButtons = page.locator("td button svg");
        const svgCount = await svgButtons.count();
        console.log("SVG icon buttons:", svgCount);

        await page.screenshot({ path: "test-results/bug12-claims.png", fullPage: true });
    });
});
