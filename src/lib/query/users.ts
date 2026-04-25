import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api";
import { qk } from "./keys";

export function useUsers() {
  return useQuery({ queryKey: qk.users.list(), queryFn: usersApi.list });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.list() });
      qc.invalidateQueries({ queryKey: qk.stats.overview() });
    },
  });
}
