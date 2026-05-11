import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk, apiErr } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { clearTokens } = await import("../client");
const { authApi } = await import("../auth");

const userResp = {
  id: "u-1",
  name: "Alice",
  email: "alice@test.com",
  role: "user",
  interests: ["Design"],
  createdAt: "2025-01-01",
  points: 50,
  regionCode: "US",
  currencyCode: "USD",
};
const tokens = { accessToken: "tok-a", refreshToken: "tok-r" };

beforeEach(() => {
  fetchMock.mockReset();
  clearTokens();
  localStorage.clear();
});

describe("authApi.login", () => {
  it("returns mapped user", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ user: userResp, tokens }));
    const user = await authApi.login("alice@test.com", "password");
    expect(user.email).toBe("alice@test.com");
    expect(user.role).toBe("user");
    expect(user.interests).toEqual(["Design"]);
    expect(user.points).toBe(50);
  });

  it("calls POST /auth/login with credentials", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ user: userResp, tokens }));
    await authApi.login("alice@test.com", "password");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "alice@test.com", password: "password" }) }),
    );
  });

  it("throws on server error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Invalid email or password."));
    await expect(authApi.login("bad@test.com", "wrong")).rejects.toThrow("Invalid email or password.");
  });
});

describe("authApi.register", () => {
  it("returns mapped user", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ user: userResp, tokens }));
    const user = await authApi.register("Alice", "alice@test.com", "password");
    expect(user.name).toBe("Alice");
    expect(user.role).toBe("user");
  });

  it("calls POST /auth/register with name, email, password", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ user: userResp, tokens }));
    await authApi.register("Alice", "alice@test.com", "password");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/register",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Alice", email: "alice@test.com", password: "password" }) }),
    );
  });

  it("throws on server error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("An account with that email already exists."));
    await expect(authApi.register("Dup", "alice@test.com", "pass")).rejects.toThrow(
      "An account with that email already exists.",
    );
  });
});

describe("authApi.getUser", () => {
  it("returns mapped user when token is valid", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(userResp));
    const user = await authApi.getUser();
    expect(user?.name).toBe("Alice");
    expect(user?.regionCode).toBe("US");
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Unauthorized"));
    const user = await authApi.getUser();
    expect(user).toBeNull();
  });
});

describe("authApi.updateInterests", () => {
  it("sends interests and returns updated user", async () => {
    const updated = { ...userResp, interests: ["Design", "AI"] };
    fetchMock.mockResolvedValueOnce(apiOk(updated));
    const user = await authApi.updateInterests("u-1", ["Design", "AI"]);
    expect(user.interests).toEqual(["Design", "AI"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/interests",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ interests: ["Design", "AI"] }) }),
    );
  });
});

describe("authApi.updateLocale", () => {
  it("sends regionCode and currencyCode, returns updated user", async () => {
    const updated = { ...userResp, regionCode: "IN", currencyCode: "INR" };
    fetchMock.mockResolvedValueOnce(apiOk(updated));
    const user = await authApi.updateLocale("u-1", "IN", "INR");
    expect(user.regionCode).toBe("IN");
    expect(user.currencyCode).toBe("INR");
  });
});

describe("authApi.requestReset", () => {
  it("returns the reset token from the server", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ token: "abc123" }));
    const token = await authApi.requestReset("alice@test.com");
    expect(token).toBe("abc123");
  });
});

describe("authApi.resetPassword", () => {
  it("calls POST /auth/reset-password with token and password", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(null));
    await authApi.resetPassword("abc123", "newpass");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/reset-password",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "abc123", password: "newpass" }) }),
    );
  });
});
