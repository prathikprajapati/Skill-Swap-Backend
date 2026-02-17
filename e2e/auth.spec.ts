import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should allow user to sign up", async ({ page }) => {
    // Navigate to auth page
    await page.goto("/auth");

    // Click on Sign Up tab
    await page.click("text=Sign Up");

    // Fill in registration form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");

    // Verify we're on the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should allow user to log in", async ({ page }) => {
    // First sign up a user
    await page.goto("/auth");
    await page.click("text=Sign Up");
    const email = `login${Date.now()}@example.com`;
    await page.fill('input[name="name"]', "Login Test User");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Logout
    await page.click("text=Logout");
    await page.waitForURL("/auth");

    // Now log in
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");

    // Verify we're on the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth");

    // Fill in wrong credentials
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector("text=Invalid credentials");
  });

  test("should redirect to auth page when accessing protected route without login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should be redirected to auth page
    await page.waitForURL("/auth");
    await expect(page).toHaveURL("/auth");
  });
});
