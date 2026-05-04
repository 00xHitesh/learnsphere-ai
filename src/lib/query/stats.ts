import { useQuery } from "@tanstack/react-query";
import { statsApi, type StatPeriod } from "../api/stats";
import { qk } from "./keys";

export function useAdminStats() {
  return useQuery({ queryKey: qk.stats.overview(), queryFn: statsApi.overview });
}

export function useRevenueByPeriod(period: StatPeriod) {
  return useQuery({
    queryKey: qk.stats.revenue(period),
    queryFn: () => statsApi.revenueByPeriod(period),
  });
}

export function useActiveUsersByPeriod(period: StatPeriod) {
  return useQuery({
    queryKey: qk.stats.activeUsers(period),
    queryFn: () => statsApi.activeUsersByPeriod(period),
  });
}
