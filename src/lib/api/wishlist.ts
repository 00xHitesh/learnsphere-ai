import { apiFetch } from "./client";

export interface WishlistItem {
  userId: string;
  courseId: string;
  addedAt: string;
}

export const wishlistApi = {
  listByUser: (_userId: string): Promise<WishlistItem[]> =>
    apiFetch<WishlistItem[]>("/wishlist"),

  toggle: async (_userId: string, courseId: string): Promise<boolean> => {
    const res = await apiFetch<{ wishlisted: boolean }>("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    });
    return res.wishlisted;
  },
};
