import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-sm")).toBe("text-sm");
  });

  it("joins multiple classes", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("ignores falsy values", () => {
    expect(cn("text-sm", undefined, false, null, "font-bold")).toBe("text-sm font-bold");
  });

  it("resolves conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional classes via objects", () => {
    expect(cn({ "text-red-500": true, "text-green-500": false })).toBe("text-red-500");
  });

  it("merges complex mixed inputs correctly", () => {
    const result = cn("px-4 py-2", { "bg-primary": true, "opacity-50": false }, "rounded-md");
    expect(result).toBe("px-4 py-2 bg-primary rounded-md");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
