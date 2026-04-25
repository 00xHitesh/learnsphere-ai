import { db } from "./db";
import { mockRequest } from "./client";

export const wishlistApi = {
  listByUser: (userId: string) =>
    mockRequest(() => db.wishlists.filter((w) => w.userId === userId).map((w) => ({ ...w }))),

  toggle: (userId: string, courseId: string) =>
    mockRequest(() => {
      const idx = db.wishlists.findIndex(
        (w) => w.userId === userId && w.courseId === courseId,
      );
      if (idx >= 0) {
        db.wishlists.splice(idx, 1);
        return false;
      }
      db.wishlists.push({ userId, courseId });
      return true;
    }),
};
