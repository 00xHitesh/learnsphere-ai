import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "@/test/helpers";

vi.mock("../client", () => ({
  mockRequest: async <T>(fn: () => T) => fn(),
}));

// Import AFTER mocking so the mock is in place
const { authApi } = await import("../auth");

beforeEach(() => {
  resetDb();
});

describe("authApi.login", () => {
  it("returns the user on valid credentials", async () => {
    const user = await authApi.login("admin@lumen.io", "admin123");
    expect(user.email).toBe("admin@lumen.io");
    expect(user.role).toBe("admin");
  });

  it("is case-insensitive on email", async () => {
    const user = await authApi.login("ADMIN@LUMEN.IO", "admin123");
    expect(user.id).toBe("u-admin");
  });

  it("throws on wrong password", async () => {
    await expect(authApi.login("admin@lumen.io", "wrong")).rejects.toThrow(
      "Invalid email or password.",
    );
  });

  it("throws on unknown email", async () => {
    await expect(authApi.login("nobody@test.com", "pass")).rejects.toThrow(
      "Invalid email or password.",
    );
  });
});

describe("authApi.register", () => {
  it("creates and returns a new user", async () => {
    const user = await authApi.register("Alice", "alice@test.com", "password1");
    expect(user.name).toBe("Alice");
    expect(user.email).toBe("alice@test.com");
    expect(user.role).toBe("user");
    expect(user.interests).toEqual([]);
  });

  it("throws when email already exists", async () => {
    await expect(
      authApi.register("Dup", "admin@lumen.io", "pass"),
    ).rejects.toThrow("An account with that email already exists.");
  });

  it("is case-insensitive on duplicate email check", async () => {
    await expect(
      authApi.register("Dup", "DEMO@LUMEN.IO", "pass"),
    ).rejects.toThrow("An account with that email already exists.");
  });
});

describe("authApi.getUser", () => {
  it("returns user by id", async () => {
    const user = await authApi.getUser("u-demo");
    expect(user?.name).toBe("Demo Student");
  });

  it("returns null for unknown id", async () => {
    const user = await authApi.getUser("nonexistent");
    expect(user).toBeNull();
  });
});

describe("authApi.updateInterests", () => {
  it("updates and returns user with new interests", async () => {
    const updated = await authApi.updateInterests("u-demo", ["Design", "AI"]);
    expect(updated.interests).toEqual(["Design", "AI"]);
  });

  it("throws when user not found", async () => {
    await expect(
      authApi.updateInterests("ghost", ["Design"]),
    ).rejects.toThrow("User not found.");
  });
});

describe("authApi.requestReset / resetPassword", () => {
  it("requestReset returns a token for a known email", async () => {
    const token = await authApi.requestReset("demo@lumen.io");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("requestReset throws for unknown email", async () => {
    await expect(authApi.requestReset("nobody@test.com")).rejects.toThrow(
      "No account with that email.",
    );
  });

  it("resetPassword updates password then invalidates token", async () => {
    const token = await authApi.requestReset("demo@lumen.io");
    await authApi.resetPassword(token, "newpass");
    const user = await authApi.login("demo@lumen.io", "newpass");
    expect(user).toBeTruthy();

    // Token is now consumed
    await expect(authApi.resetPassword(token, "anotherpass")).rejects.toThrow(
      "Invalid or expired reset link.",
    );
  });

  it("resetPassword throws on invalid token", async () => {
    await expect(authApi.resetPassword("badtoken", "pass")).rejects.toThrow(
      "Invalid or expired reset link.",
    );
  });
});
