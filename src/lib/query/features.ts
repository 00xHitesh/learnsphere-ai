import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { featuresApi } from "../api";
import { qk } from "./keys";

export function useFeatureFlags() {
  return useQuery({ queryKey: qk.features.list(), queryFn: featuresApi.list });
}

export function useFeatureFlag(name: string) {
  const { data: flags = [] } = useFeatureFlags();
  const flag = flags.find((f) => f.name === name);
  // Default to enabled so the UI doesn't flash hidden while loading
  return flag?.enabled ?? true;
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => featuresApi.toggle(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.features.all() }),
  });
}
