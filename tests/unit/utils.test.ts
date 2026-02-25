import { describe, it, expect } from "vitest";
import { cn, formatBytes } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting tailwind classes (twMerge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });
});

describe("formatBytes()", () => {
  it("returns '0 Bytes' for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
  });

  it("formats kilobytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("respects the decimals parameter", () => {
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
  });

  it("handles large values", () => {
    expect(formatBytes(1099511627776)).toBe("1 TB");
  });

  it("uses 2 decimal places by default", () => {
    expect(formatBytes(1500)).toBe("1.46 KB");
  });

  it("clamps negative decimals to 0", () => {
    expect(formatBytes(1536, -1)).toBe("2 KB");
  });
});
