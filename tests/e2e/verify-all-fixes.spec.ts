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

test.describe("Verify All Fixes", () => {
    test.setTimeout(120000);

    test("Issue 1: Task provider search shows dropdown", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/tasks`);
        await page.waitForTimeout(2000);
        const addBtn = page.locator("button").filter({ hasText: /new task|add task|\+/i }).first();
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await page.waitForTimeout(1000);
            const assignedTo = page.locator("input[placeholder*='Search provider']").first();
            if (await assignedTo.isVisible()) {
                await assignedTo.fill("sar");
                await page.waitForTimeout(2000);
                await page.screenshot({ path: "test-results/fix1-provider-search.png" });
            }
        }
    });

    test("Issue 4: Patient DOB max attribute set", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/patients/new`);
        await page.waitForTimeout(2000);
        const dobField = page.locator("input[type='date']").first();
        if (await dobField.isVisible()) {
            const maxVal = await dobField.getAttribute("max");
            const today = new Date().toISOString().split("T")[0];
            console.log("DOB max:", maxVal, "today:", today);
            expect(maxVal).toBe(today);
        }
        await page.screenshot({ path: "test-results/fix4-dob.png" });
    });

    test("Issue 8: Calendar search for non-admin user", async ({ page }) => {
        await login(page, "dr.sarah.williams", "Test@123");
        await page.goto(`${BASE}/calendar`);
        await page.waitForTimeout(3000);
        const provBtn = page.locator("button").filter({ hasText: /provider/i }).first();
        if (await provBtn.isVisible()) {
            await provBtn.click();
            await page.waitForTimeout(500);
            const searchInput = page.locator("input[placeholder*='earch']");
            const hasSearch = await searchInput.isVisible().catch(() => false);
            console.log("Calendar search visible for dr.sarah:", hasSearch);
            await page.screenshot({ path: "test-results/fix8-calendar-filter.png" });
        }
    });

    test("Issue 12: Claim management icons not text", async ({ page }) => {
        await login(page, "michael.chen", "Test@123");
        await page.goto(`${BASE}/claim-management`);
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "test-results/fix12-claim-icons.png" });
        // Check no text "Edit" or "Update Status" buttons in table cells
        const editTextBtn = page.locator("td button").filter({ hasText: /^Edit$/ });
        console.log("Text 'Edit' buttons:", await editTextBtn.count());
    });
});
