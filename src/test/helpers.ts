import { vi } from "vitest";

/** Wraps data in the API response envelope for fetch mocking */
export function apiOk<T>(data: T) {
  return { json: async () => ({ success: true, message: "ok", data }) };
}

/** Simulates an API error response */
export function apiErr(message: string) {
  return { json: async () => ({ success: false, message, data: null }) };
}
