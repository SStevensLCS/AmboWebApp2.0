import { describe, it, expect, vi } from "vitest";

// Mock googleapis and the Supabase admin client (they're imported at module level)
vi.mock("googleapis", () => ({
  google: {
    auth: { OAuth2: vi.fn() },
    calendar: vi.fn(),
  },
}));
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn(),
}));
vi.mock("@ambo/database/admin-client", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(),
    })),
  })),
}));

import { buildGoogleEvent, type AppEvent } from "@/lib/googleCalendar";

describe("buildGoogleEvent()", () => {
  const baseEvent: AppEvent = {
    title: "Campus Tour",
    description: "A guided campus tour for prospective students.",
    start_time: "2026-03-15T10:00:00Z",
    end_time: "2026-03-15T11:00:00Z",
    location: "Main Entrance",
  };

  it("maps title to summary", () => {
    const result = buildGoogleEvent(baseEvent);
    expect(result.summary).toBe("Campus Tour");
  });

  it("maps location", () => {
    const result = buildGoogleEvent(baseEvent);
    expect(result.location).toBe("Main Entrance");
  });

  it("formats start and end times as ISO strings", () => {
    const result = buildGoogleEvent(baseEvent);
    expect(result.start?.dateTime).toBe(new Date("2026-03-15T10:00:00Z").toISOString());
    expect(result.end?.dateTime).toBe(new Date("2026-03-15T11:00:00Z").toISOString());
    expect(result.start?.timeZone).toBe("America/Los_Angeles");
    expect(result.end?.timeZone).toBe("America/Los_Angeles");
  });

  it("prepends event type to description", () => {
    const event: AppEvent = { ...baseEvent, type: "tour" };
    const result = buildGoogleEvent(event);
    expect(result.description).toContain("[tour]");
    expect(result.description).toContain("A guided campus tour");
  });

  it("appends uniform info to description", () => {
    const event: AppEvent = { ...baseEvent, uniform: "Business Casual" };
    const result = buildGoogleEvent(event);
    expect(result.description).toContain("Uniform: Business Casual");
  });

  it("includes RSVP summary with yes, maybe, and no", () => {
    const event: AppEvent = {
      ...baseEvent,
      rsvps: {
        yes: ["Alice Smith", "Bob Jones"],
        maybe: ["Carol White"],
        no: ["Dave Brown"],
      },
    };
    const result = buildGoogleEvent(event);
    expect(result.description).toContain("RSVPs:");
    expect(result.description).toContain("Yes (2): Alice Smith, Bob Jones");
    expect(result.description).toContain("Maybe (1): Carol White");
    expect(result.description).toContain("No (1): Dave Brown");
  });

  it("shows 'No RSVPs yet' when all RSVP lists are empty", () => {
    const event: AppEvent = {
      ...baseEvent,
      rsvps: { yes: [], maybe: [], no: [] },
    };
    const result = buildGoogleEvent(event);
    expect(result.description).toContain("(No RSVPs yet)");
  });

  it("omits RSVP section when rsvps is undefined", () => {
    const result = buildGoogleEvent(baseEvent);
    expect(result.description).not.toContain("RSVPs:");
  });

  it("returns undefined for description when empty after trimming", () => {
    const event: AppEvent = {
      ...baseEvent,
      description: null,
    };
    const result = buildGoogleEvent(event);
    // description should just be empty string trimmed to undefined if no type/uniform/rsvps
    // Actually, since description is "" and no type/uniform/rsvps, it will be empty → undefined
    expect(result.description).toBeUndefined();
  });

  it("returns undefined for location when null", () => {
    const event: AppEvent = { ...baseEvent, location: null };
    const result = buildGoogleEvent(event);
    expect(result.location).toBeUndefined();
  });

  it("combines type, description, uniform, and RSVPs in correct order", () => {
    const event: AppEvent = {
      ...baseEvent,
      type: "meeting",
      uniform: "Polo Shirt",
      rsvps: { yes: ["Alice"], maybe: [], no: [] },
    };
    const result = buildGoogleEvent(event);
    const desc = result.description!;

    const typeIdx = desc.indexOf("[meeting]");
    const bodyIdx = desc.indexOf("A guided campus tour");
    const uniformIdx = desc.indexOf("Uniform: Polo Shirt");
    const rsvpIdx = desc.indexOf("RSVPs:");

    expect(typeIdx).toBeLessThan(bodyIdx);
    expect(bodyIdx).toBeLessThan(uniformIdx);
    expect(uniformIdx).toBeLessThan(rsvpIdx);
  });
});
