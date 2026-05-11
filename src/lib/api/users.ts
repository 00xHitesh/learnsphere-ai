import { apiFetch } from "./client";
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

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await apiFetch<UserResponse[]>("/users");
    return res.map(mapUser);
  },

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};
