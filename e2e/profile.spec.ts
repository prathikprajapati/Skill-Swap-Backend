import { test, expect } from "@playwright/test";

test.describe("Profile Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/auth");
    await page.click("text=Sign Up");
    const email = `profile${Date.now()}@example.com`;
    await page.fill('input[name="name"]', "Profile Test User");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should navigate to profile page", async ({ page }) => {
    // Click on profile link
    await page.click("text=Profile");

    // Wait for profile page to load
    await page.waitForURL("/profile");

    // Verify profile page elements
    await expect(page.locator("text=Your Skills")).toBeVisible();
    await expect(page.locator("text=Add Skill")).toBeVisible();
  });

  test("should add a skill to profile", async ({ page }) => {
    // Navigate to profile
    await page.click("text=Profile");
    await page.waitForURL("/profile");

    // Click add skill button
    await page.click("text=Add Skill");

    // Fill in skill form
    await page.fill('input[name="skillName"]', "JavaScript");
    await page.selectOption('select[name="skillType"]', "teach");
    await page.fill('input[name="proficiency"]', "5");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify skill was added
    await expect(page.locator("text=JavaScript")).toBeVisible();
  });

  test("should remove a skill from profile", async ({ page }) => {
    // Navigate to profile
    await page.click("text=Profile");
    await page.waitForURL("/profile");

    // First add a skill
    await page.click("text=Add Skill");
    await page.fill('input[name="skillName"]', "Python");
    await page.selectOption('select[name="skillType"]', "learn");
    await page.fill('input[name="proficiency"]', "3");
    await page.click('button[type="submit"]');

    // Wait for skill to appear
    await expect(page.locator("text=Python")).toBeVisible();

    // Remove the skill
    await page.click('[data-testid="remove-skill-Python"]');

    // Confirm removal
    await page.click("text=Confirm");

    // Verify skill was removed
    await expect(page.locator("text=Python")).not.toBeVisible();
  });

  test("should update profile information", async ({ page }) => {
    // Navigate to profile
    await page.click("text=Profile");
    await page.waitForURL("/profile");

    // Click edit profile
    await page.click("text=Edit Profile");

    // Update bio
    await page.fill('textarea[name="bio"]', "I love learning new skills!");

    // Save changes
    await page.click("text=Save Changes");

    // Verify success message
    await expect(page.locator("text=Profile updated")).toBeVisible();
  });
});
