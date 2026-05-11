import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { usersApi } = await import("../users");

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

beforeEach(() => fetchMock.mockReset());

describe("usersApi.list", () => {
  it("calls GET /users and returns mapped users", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([userResp, { ...userResp, id: "u-2", role: "admin", name: "Admin" }]));
    const result = await usersApi.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users",
      expect.any(Object),
    );
  });

  it("includes both admin and regular users", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([userResp, { ...userResp, id: "u-2", role: "admin" }]));
    const result = await usersApi.list();
    expect(result.some((u) => u.role === "admin")).toBe(true);
    expect(result.some((u) => u.role === "user")).toBe(true);
  });
});

describe("usersApi.delete", () => {
  it("calls DELETE /users/{id}", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(null));
    await usersApi.delete("u-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/users/u-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
