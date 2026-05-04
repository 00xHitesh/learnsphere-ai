import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";
import { db } from "../db";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

const { usersApi } = await import("../users");

beforeEach(() => {
  resetDb();
});

describe("usersApi.list", () => {
  it("returns all users from the db", async () => {
    const users = await usersApi.list();
    expect(users.length).toBe(db.users.length);
  });

  it("returns copies — mutations do not affect db", async () => {
    const users = await usersApi.list();
    users[0].name = "Mutated";
    const again = await usersApi.list();
    expect(again[0].name).not.toBe("Mutated");
  });

  it("includes both admin and regular users", async () => {
    const users = await usersApi.list();
    expect(users.some((u) => u.role === "admin")).toBe(true);
    expect(users.some((u) => u.role === "user")).toBe(true);
  });
});

describe("usersApi.delete", () => {
  it("removes the user from the db", async () => {
    const before = db.users.length;
    await usersApi.delete("u-demo");
    expect(db.users.length).toBe(before - 1);
    expect(db.users.find((u) => u.id === "u-demo")).toBeUndefined();
  });

  it("cascades — removes the user's enrollments", async () => {
    db.enrollments.push({
      id: "e-1",
      userId: "u-demo",
      courseId: db.courses[0].id,
      completedLessonIds: [],
      passedQuizIds: [],
      enrolledAt: "",
      timeSpentSeconds: 0,
    });
    await usersApi.delete("u-demo");
    expect(db.enrollments.find((e) => e.userId === "u-demo")).toBeUndefined();
  });

  it("cascades — removes the user's transactions", async () => {
    db.transactions.push({
      id: "t-1",
      userId: "u-demo",
      courseId: db.courses[0].id,
      amount: 29,
      status: "success",
      date: "",
    });
    await usersApi.delete("u-demo");
    expect(db.transactions.find((t) => t.userId === "u-demo")).toBeUndefined();
  });

  it("cascades — removes the user's wishlist entries", async () => {
    db.wishlists.push({ userId: "u-demo", courseId: db.courses[0].id });
    await usersApi.delete("u-demo");
    expect(db.wishlists.find((w) => w.userId === "u-demo")).toBeUndefined();
  });

  it("does not affect other users' data", async () => {
    db.enrollments.push({
      id: "e-admin",
      userId: "u-admin",
      courseId: db.courses[0].id,
      completedLessonIds: [],
      passedQuizIds: [],
      enrolledAt: "",
      timeSpentSeconds: 0,
    });
    await usersApi.delete("u-demo");
    expect(db.enrollments.find((e) => e.userId === "u-admin")).toBeTruthy();
  });

  it("is a no-op for a non-existent user id", async () => {
    const before = db.users.length;
    await usersApi.delete("ghost");
    expect(db.users.length).toBe(before);
  });
});
