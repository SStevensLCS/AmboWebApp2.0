import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing session module
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Set a test secret before importing the module
process.env.SESSION_SECRET = "test-secret-key-for-unit-tests-only";

import { createSession, verifySessionToken, type SessionPayload } from "@/lib/session";

describe("session", () => {
  describe("createSession()", () => {
    it("returns a JWT string", async () => {
      const payload: SessionPayload = { userId: "user-123", role: "student" };
      const token = await createSession(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("creates different tokens for different payloads", async () => {
      const token1 = await createSession({ userId: "user-1", role: "student" });
      const token2 = await createSession({ userId: "user-2", role: "admin" });
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifySessionToken()", () => {
    it("verifies a valid token and returns the payload", async () => {
      const payload: SessionPayload = { userId: "user-123", role: "admin" };
      const token = await createSession(payload);
      const result = await verifySessionToken(token);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe("user-123");
      expect(result!.role).toBe("admin");
    });

    it("returns null for an invalid token", async () => {
      const result = await verifySessionToken("invalid.jwt.token");
      expect(result).toBeNull();
    });

    it("returns null for an empty string", async () => {
      const result = await verifySessionToken("");
      expect(result).toBeNull();
    });

    it("preserves the superadmin role", async () => {
      const payload: SessionPayload = { userId: "sa-1", role: "superadmin" };
      const token = await createSession(payload);
      const result = await verifySessionToken(token);
      expect(result!.role).toBe("superadmin");
    });

    it("preserves the applicant role", async () => {
      const payload: SessionPayload = { userId: "app-1", role: "applicant" };
      const token = await createSession(payload);
      const result = await verifySessionToken(token);
      expect(result!.role).toBe("applicant");
    });

    it("returns null for a tampered token", async () => {
      const token = await createSession({ userId: "user-1", role: "student" });
      // Tamper with the payload portion (middle part)
      const parts = token.split(".");
      parts[1] = parts[1] + "tampered";
      const tampered = parts.join(".");
      const result = await verifySessionToken(tampered);
      expect(result).toBeNull();
    });
  });
});
