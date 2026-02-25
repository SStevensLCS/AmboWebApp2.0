import { test, expect } from "@playwright/test";

test.describe("API Route Protection", () => {
  test("POST /api/admin/users without session returns 403", async ({
    request,
  }) => {
    const response = await request.post("/api/admin/users", {
      data: {
        first_name: "Test",
        last_name: "User",
        phone: "5551234567",
        email: "test@example.com",
      },
    });

    // requireAdmin() should reject because there's no ambo_session cookie
    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  });

  test("GET /api/admin/users without session returns 403", async ({
    request,
  }) => {
    const response = await request.get("/api/admin/users");

    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  });
});
