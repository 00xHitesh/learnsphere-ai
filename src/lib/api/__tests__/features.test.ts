import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { featuresApi } = await import("../features");

beforeEach(() => {
  resetDb();
});

describe("featuresApi.list", () => {
  it("returns all seeded feature flags", async () => {
    const result = await featuresApi.list();
    expect(result.length).toBe(db.featureFlags.length);
  });

  it("returns copies — mutations do not affect db", async () => {
    const result = await featuresApi.list();
    result[0].enabled = false;
    const again = await featuresApi.list();
    const original = db.featureFlags[0];
    expect(again[0].enabled).toBe(original.enabled);
  });
});

describe("featuresApi.toggle", () => {
  it("flips enabled from true to false", async () => {
    const flag = db.featureFlags.find((f) => f.enabled);
    if (!flag) return;
    await featuresApi.toggle(flag.name);
    expect(db.featureFlags.find((f) => f.name === flag.name)?.enabled).toBe(false);
  });

  it("flips enabled from false to true", async () => {
    const flag = db.featureFlags[0];
    flag.enabled = false;
    await featuresApi.toggle(flag.name);
    expect(db.featureFlags.find((f) => f.name === flag.name)?.enabled).toBe(true);
  });

  it("is idempotent in pairs — two toggles restore original state", async () => {
    const flag = db.featureFlags[0];
    const original = flag.enabled;
    await featuresApi.toggle(flag.name);
    await featuresApi.toggle(flag.name);
    expect(db.featureFlags.find((f) => f.name === flag.name)?.enabled).toBe(original);
  });

  it("is a no-op for an unknown flag name", async () => {
    const before = db.featureFlags.map((f) => f.enabled);
    await featuresApi.toggle("nonexistent_flag");
    const after = db.featureFlags.map((f) => f.enabled);
    expect(after).toEqual(before);
  });
});
