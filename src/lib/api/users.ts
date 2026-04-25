import { db } from "./db";
import { mockRequest } from "./client";

export const usersApi = {
  list: () => mockRequest(() => db.users.map((u) => ({ ...u }))),

  delete: (id: string) =>
    mockRequest(() => {
      db.users = db.users.filter((u) => u.id !== id);
      db.enrollments = db.enrollments.filter((e) => e.userId !== id);
      db.transactions = db.transactions.filter((t) => t.userId !== id);
      db.wishlists = db.wishlists.filter((w) => w.userId !== id);
    }),
};
