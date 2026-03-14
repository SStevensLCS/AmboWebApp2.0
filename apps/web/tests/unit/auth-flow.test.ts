import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock functions so they're available inside vi.mock factories
const { mockFrom, mockSetSessionCookie, mockBcryptCompare } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSetSessionCookie: vi.fn(),
  mockBcryptCompare: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("@ambo/database/admin-client", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
  adminClient: {},
}));

vi.mock("@/lib/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/session")>("@/lib/session");
  return {
    ...actual,
    setSessionCookie: mockSetSessionCookie,
  };
});

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
    hash: vi.fn(),
  },
}));

process.env.SESSION_SECRET = "test-secret-for-auth-tests";

import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";

function buildLoginRequest(email: string, password: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });
}

// Helper to set up mockFrom for user lookup
function mockUserLookup(user: { id: string; role: string; password_hash: string | null; email: string } | null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: user,
          error: user ? null : { message: "No rows found", code: "PGRST116" },
        }),
      }),
    }),
  });
}

describe("Auth Flow - Login Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin login (role=admin) returns redirect to /admin", async () => {
    mockUserLookup({ id: "admin-user-id", role: "admin", password_hash: "$2a$12$hash", email: "admin@linfield.edu" });
    mockBcryptCompare.mockResolvedValue(true);

    const res = await POST(buildLoginRequest("admin@linfield.edu", "7604848038"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirect).toBe("/admin");
    expect(mockSetSessionCookie).toHaveBeenCalledWith({
      userId: "admin-user-id",
      role: "admin",
    });
  });

  it("superadmin login returns redirect to /admin", async () => {
    mockUserLookup({ id: "sa-user-id", role: "superadmin", password_hash: "$2a$12$hash", email: "super@linfield.edu" });
    mockBcryptCompare.mockResolvedValue(true);

    const res = await POST(buildLoginRequest("super@linfield.edu", "password"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirect).toBe("/admin");
  });

  it("student login returns redirect to /student", async () => {
    mockUserLookup({ id: "student-user-id", role: "student", password_hash: "$2a$12$hash", email: "student@linfield.edu" });
    mockBcryptCompare.mockResolvedValue(true);

    const res = await POST(buildLoginRequest("student@linfield.edu", "testpassword"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirect).toBe("/student");
    expect(mockSetSessionCookie).toHaveBeenCalledWith({
      userId: "student-user-id",
      role: "student",
    });
  });

  it("invalid credentials return 401 with error message", async () => {
    mockUserLookup({ id: "user-id", role: "student", password_hash: "$2a$12$hash", email: "bad@email.com" });
    mockBcryptCompare.mockResolvedValue(false);

    const res = await POST(buildLoginRequest("bad@email.com", "wrongpass"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid email or password.");
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
  });

  it("missing email returns 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password: "test" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Email and password are required.");
  });

  it("missing password returns 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Email and password are required.");
  });

  it("user not found returns 401", async () => {
    mockUserLookup(null);

    const res = await POST(buildLoginRequest("orphan@test.com", "pass"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid email or password.");
  });

  it("user with no password_hash returns 401", async () => {
    mockUserLookup({ id: "no-pass-id", role: "student", password_hash: null, email: "nopass@test.com" });

    const res = await POST(buildLoginRequest("nopass@test.com", "pass"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain("No password set");
  });
});
