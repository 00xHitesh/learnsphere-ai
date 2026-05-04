import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { liveSessionsApi } from "../api";
import { qk } from "./keys";
import type { LiveSession } from "../types";

export function useLiveSessions() {
  return useQuery({ queryKey: qk.liveSessions.list(), queryFn: liveSessionsApi.list });
}

export function useUpsertLiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session: LiveSession) => liveSessionsApi.upsert(session),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.liveSessions.all() }),
  });
}

export function useDeleteLiveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveSessionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.liveSessions.all() }),
  });
}
