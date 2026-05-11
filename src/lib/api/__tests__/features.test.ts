import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk } from "@/test/helpers";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { BASE_URL } = await import("../client");
const { featuresApi } = await import("../features");

const flagResp = { id: "f-1", name: "live_sessions", label: "Live Sessions", description: "Enable live sessions", enabled: true };

beforeEach(() => fetchMock.mockReset());

describe("featuresApi.list", () => {
  it("calls GET /features and returns mapped flags", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([flagResp]));
    const result = await featuresApi.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("live_sessions");
    expect(result[0].enabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/features`,
      expect.any(Object),
    );
  });
});

describe("featuresApi.toggle", () => {
  it("calls PATCH /features/{name}/toggle and returns toggled flag", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ ...flagResp, enabled: false }));
    const result = await featuresApi.toggle("live_sessions");
    expect(result.name).toBe("live_sessions");
    expect(result.enabled).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/features/live_sessions/toggle`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("toggling true flag returns false", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ ...flagResp, enabled: false }));
    const result = await featuresApi.toggle("live_sessions");
    expect(result.enabled).toBe(false);
  });
});
