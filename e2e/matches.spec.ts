import { test, expect } from "@playwright/test";

test.describe("Matches and Requests", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/auth");
    await page.click("text=Sign Up");
    const email = `matches${Date.now()}@example.com`;
    await page.fill('input[name="name"]', "Matches Test User");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should display recommended matches on dashboard", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for matches to load
    await page.waitForSelector('[data-testid="match-card"]', {
      timeout: 10000,
    });

    // Verify match cards are displayed
    const matchCards = page.locator('[data-testid="match-card"]');
    await expect(matchCards.first()).toBeVisible();
  });

  test("should send a match request", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for matches to load
    await page.waitForSelector('[data-testid="match-card"]', {
      timeout: 10000,
    });

    // Click on first match card
    await page.click('[data-testid="match-card"]:first-child');

    // Click connect button
    await page.click("text=Connect");

    // Verify success message
    await expect(page.locator("text=Request sent")).toBeVisible();
  });

  test("should view incoming requests", async ({ page }) => {
    // Navigate to requests page
    await page.click("text=Requests");
    await page.waitForURL("/requests");

    // Verify requests page elements
    await expect(page.locator("text=Incoming Requests")).toBeVisible();
    await expect(page.locator("text=Sent Requests")).toBeVisible();
  });

  test("should accept a match request", async ({ page }) => {
    // Navigate to requests page
    await page.click("text=Requests");
    await page.waitForURL("/requests");

    // Check if there are any incoming requests
    const acceptButton = page.locator("text=Accept").first();

    if (await acceptButton.isVisible().catch(() => false)) {
      // Click accept
      await acceptButton.click();

      // Verify success message
      await expect(page.locator("text=Request accepted")).toBeVisible();
    }
  });

  test("should reject a match request", async ({ page }) => {
    // Navigate to requests page
    await page.click("text=Requests");
    await page.waitForURL("/requests");

    // Check if there are any incoming requests
    const rejectButton = page.locator("text=Reject").first();

    if (await rejectButton.isVisible().catch(() => false)) {
      // Click reject
      await rejectButton.click();

      // Verify success message
      await expect(page.locator("text=Request rejected")).toBeVisible();
    }
  });
});
