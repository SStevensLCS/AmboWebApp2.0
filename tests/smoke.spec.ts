import { test, expect } from "@playwright/test";

test.describe("Smoke Tests @smoke", () => {
  test("app loads without crashing", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });

  test("login page displays Ambassador Portal heading", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Ambassador Portal")).toBeVisible();
  });

  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("login page has sign in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
