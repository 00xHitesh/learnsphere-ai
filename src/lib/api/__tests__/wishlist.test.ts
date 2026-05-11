import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { BASE_URL } = await import("../client");
const { wishlistApi } = await import("../wishlist");

const wishlistItemResp = { userId: "u-demo", courseId: "c-1", addedAt: "2025-05-01" };

beforeEach(() => fetchMock.mockReset());

describe("wishlistApi.listByUser", () => {
  it("calls GET /wishlist and returns items with courseId", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([wishlistItemResp]));
    const result = await wishlistApi.listByUser("u-demo");
    expect(result).toHaveLength(1);
    expect(result[0].courseId).toBe("c-1");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/wishlist`,
      expect.any(Object),
    );
  });
});

describe("wishlistApi.toggle", () => {
  it("calls POST /wishlist/toggle with courseId and returns wishlisted boolean", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ wishlisted: true }));
    const result = await wishlistApi.toggle("u-demo", "c-1");
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/wishlist/toggle`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ courseId: "c-1" }) }),
    );
  });

  it("returns false when un-wishlisting", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ wishlisted: false }));
    const result = await wishlistApi.toggle("u-demo", "c-1");
    expect(result).toBe(false);
  });
});
