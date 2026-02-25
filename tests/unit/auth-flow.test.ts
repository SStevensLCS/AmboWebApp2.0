import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock functions so they're available inside vi.mock factories
const { mockSignInWithPassword, mockFrom, mockSetSessionCookie } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockFrom: vi.fn(),
  mockSetSessionCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
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

describe("Auth Flow - Login Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin login (role=admin) returns redirect to /admin", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-user-id" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "admin-user-id", role: "admin" },
            error: null,
          }),
        }),
      }),
    });

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
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "sa-user-id" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "sa-user-id", role: "superadmin" },
            error: null,
          }),
        }),
      }),
    });

    const res = await POST(buildLoginRequest("super@linfield.edu", "password"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.redirect).toBe("/admin");
  });

  it("student login returns redirect to /student", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "student-user-id" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "student-user-id", role: "student" },
            error: null,
          }),
        }),
      }),
    });

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
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

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

  it("user profile not found returns 404", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "orphan-id" } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "No rows found" },
          }),
        }),
      }),
    });

    const res = await POST(buildLoginRequest("orphan@test.com", "pass"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("User profile not found.");
  });
});
