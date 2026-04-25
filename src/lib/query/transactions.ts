import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api";
import { qk } from "./keys";

export function useMyTransactions(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.transactions.byUser(userId ?? ""),
    queryFn: () => transactionsApi.listByUser(userId!),
    enabled: !!userId,
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: qk.transactions.all(),
    queryFn: transactionsApi.listAll,
  });
}

export function usePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      transactionsApi.purchase(userId, courseId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: qk.transactions.byUser(userId) });
      qc.invalidateQueries({ queryKey: qk.enrollments.byUser(userId) });
      qc.invalidateQueries({ queryKey: qk.transactions.all() });
    },
  });
}
