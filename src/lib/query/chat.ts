import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api";
import { qk } from "./keys";
import type { ChatMessage } from "../types";

export function useChatMessages(userId: string | null | undefined) {
  return useQuery({
    queryKey: qk.chat.byUser(userId ?? ""),
    queryFn: () => chatApi.list(userId!),
    enabled: !!userId,
  });
}

export function useAppendChat(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msg: ChatMessage) => chatApi.append(userId!, msg),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.chat.byUser(userId) });
    },
  });
}

export function useResetChat(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.reset(userId!),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.chat.byUser(userId) });
    },
  });
}
