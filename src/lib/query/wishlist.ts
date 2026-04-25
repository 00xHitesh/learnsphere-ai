import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api";
import { qk } from "./keys";

export function useMyWishlist(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.wishlist.byUser(userId ?? ""),
    queryFn: () => wishlistApi.listByUser(userId!),
    enabled: !!userId,
  });
}

export function useInWishlist(userId: string | null | undefined, courseId: string) {
  const { data = [] } = useMyWishlist(userId);
  return data.some((w) => w.courseId === courseId);
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      wishlistApi.toggle(userId, courseId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: qk.wishlist.byUser(userId) });
    },
  });
}
