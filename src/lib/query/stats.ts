import { useQuery } from "@tanstack/react-query";
import { statsApi } from "../api";
import { qk } from "./keys";

export function useAdminStats() {
  return useQuery({ queryKey: qk.stats.overview(), queryFn: statsApi.overview });
}
