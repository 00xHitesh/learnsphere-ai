import { apiFetch, setTokens } from "./client";
import type { User } from "../types";

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  interests: string[];
  createdAt: string;
  points: number;
  regionCode: string;
  currencyCode: string;
}

interface AuthResponse {
  user: UserResponse;
  tokens: { accessToken: string; refreshToken: string };
}

function mapUser(r: UserResponse): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: "",
    role: r.role as User["role"],
    interests: r.interests ?? [],
    createdAt: r.createdAt,
    points: r.points,
    regionCode: r.regionCode ?? "US",
    currencyCode: r.currencyCode ?? "USD",
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(res.tokens);
    return mapUser(res.user);
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const res = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setTokens(res.tokens);
    return mapUser(res.user);
  },

  getUser: async (): Promise<User | null> => {
    try {
      const res = await apiFetch<UserResponse>("/auth/me");
      return mapUser(res);
    } catch {
      return null;
    }
  },

  updateInterests: async (_userId: string, interests: string[]): Promise<User> => {
    const res = await apiFetch<UserResponse>("/auth/interests", {
      method: "PUT",
      body: JSON.stringify({ interests }),
    });
    return mapUser(res);
  },

  updateLocale: async (_userId: string, regionCode: string, currencyCode: string): Promise<User> => {
    const res = await apiFetch<UserResponse>("/auth/locale", {
      method: "PUT",
      body: JSON.stringify({ regionCode, currencyCode }),
    });
    return mapUser(res);
  },

  requestReset: async (email: string): Promise<string> => {
    const res = await apiFetch<{ token: string }>("/auth/reset-request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.token;
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiFetch<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};
