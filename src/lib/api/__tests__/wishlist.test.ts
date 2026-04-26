import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { wishlistApi } = await import("../wishlist");

const USER_ID = "u-demo";
const COURSE_ID = "c-seed-1";

beforeEach(() => {
  resetDb();
});

describe("wishlistApi.listByUser", () => {
  it("returns empty array when wishlist is empty", async () => {
    const result = await wishlistApi.listByUser(USER_ID);
    expect(result).toEqual([]);
  });

  it("returns only entries for the specified user", async () => {
    db.wishlists.push(
      { userId: USER_ID, courseId: COURSE_ID },
      { userId: "u-other", courseId: COURSE_ID },
    );
    const result = await wishlistApi.listByUser(USER_ID);
    expect(result.length).toBe(1);
    expect(result[0].userId).toBe(USER_ID);
  });

  it("returns copies — mutations do not affect the db", async () => {
    db.wishlists.push({ userId: USER_ID, courseId: COURSE_ID });
    const result = await wishlistApi.listByUser(USER_ID);
    result[0].courseId = "mutated";
    const again = await wishlistApi.listByUser(USER_ID);
    expect(again[0].courseId).toBe(COURSE_ID);
  });
});

describe("wishlistApi.toggle", () => {
  it("adds a course to the wishlist and returns true", async () => {
    const added = await wishlistApi.toggle(USER_ID, COURSE_ID);
    expect(added).toBe(true);
    expect(db.wishlists).toHaveLength(1);
    expect(db.wishlists[0]).toEqual({ userId: USER_ID, courseId: COURSE_ID });
  });

  it("removes a course from the wishlist and returns false", async () => {
    db.wishlists.push({ userId: USER_ID, courseId: COURSE_ID });
    const removed = await wishlistApi.toggle(USER_ID, COURSE_ID);
    expect(removed).toBe(false);
    expect(db.wishlists).toHaveLength(0);
  });

  it("toggling twice results in no net change", async () => {
    await wishlistApi.toggle(USER_ID, COURSE_ID);
    await wishlistApi.toggle(USER_ID, COURSE_ID);
    expect(db.wishlists).toHaveLength(0);
  });

  it("only removes the matching user+course pair", async () => {
    db.wishlists.push(
      { userId: USER_ID, courseId: COURSE_ID },
      { userId: "u-other", courseId: COURSE_ID },
    );
    await wishlistApi.toggle(USER_ID, COURSE_ID);
    expect(db.wishlists).toHaveLength(1);
    expect(db.wishlists[0].userId).toBe("u-other");
  });
});
