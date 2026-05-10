import { db } from "./db";
import { mockRequest } from "./client";
import type { User } from "../types";

const RESET_TOKENS: Record<string, string> = {};

export const authApi = {
  login: (email: string, password: string) =>
    mockRequest(() => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!user) throw new Error("Invalid email or password.");
      return user;
    }),

  register: (name: string, email: string, password: string) =>
    mockRequest(() => {
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
        throw new Error("An account with that email already exists.");
      const user: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        password,
        role: "user",
        interests: [],
        createdAt: new Date().toISOString(),
        points: 0,
        regionCode: "US",
        currencyCode: "USD",
      };
      db.users.push(user);
      return user;
    }),

  getUser: (id: string) => mockRequest(() => db.users.find((u) => u.id === id) ?? null),

  updateInterests: (userId: string, interests: string[]) =>
    mockRequest(() => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found.");
      user.interests = interests;
      return { ...user };
    }),

  updateLocale: (userId: string, regionCode: string, currencyCode: string) =>
    mockRequest(() => {
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found.");
      user.regionCode = regionCode;
      user.currencyCode = currencyCode;
      return { ...user };
    }),

  requestReset: (email: string) =>
    mockRequest(() => {
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("No account with that email.");
      const token = Math.random().toString(36).slice(2, 10);
      RESET_TOKENS[token] = user.email;
      return token;
    }),

  resetPassword: (token: string, password: string) =>
    mockRequest(() => {
      const email = RESET_TOKENS[token];
      if (!email) throw new Error("Invalid or expired reset link.");
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) user.password = password;
      delete RESET_TOKENS[token];
    }),
};
