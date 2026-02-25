import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("admin login with seeded phone (7604848038) redirects to /admin", async ({
    page,
  }) => {
    // Intercept the login API to simulate a successful admin login
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ redirect: "/admin" }),
      });
    });

    // Also intercept the /admin page to avoid needing a real session in middleware
    await page.route("**/admin", (route) => {
      if (route.request().resourceType() === "document") {
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<html><body><h1>Admin Dashboard</h1></body></html>",
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@linfield.edu");
    await page.getByLabel("Password").fill("7604848038");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/admin");
    expect(page.url()).toContain("/admin");
  });

  test("student login redirects to /student", async ({ page }) => {
    // Intercept the login API to simulate a successful student login
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ redirect: "/student" }),
      });
    });

    // Intercept the /student page to avoid needing a real session in middleware
    await page.route("**/student", (route) => {
      if (route.request().resourceType() === "document") {
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<html><body><h1>Student Dashboard</h1></body></html>",
        });
      } else {
        route.continue();
      }
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("student@linfield.edu");
    await page.getByLabel("Password").fill("testpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/student");
    expect(page.url()).toContain("/student");
  });

  test("failed login shows error message", async ({ page }) => {
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid email or password." }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("bad@email.com");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByText("Invalid email or password.")
    ).toBeVisible();
  });
});
