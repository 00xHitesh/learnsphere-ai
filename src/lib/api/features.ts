import { apiFetch } from "./client";
import type { FeatureFlag } from "../types";

interface FeatureFlagResponse {
  id: string;
  name: string;
  label: string;
  description: string;
  enabled: boolean;
}

function mapFlag(r: FeatureFlagResponse): FeatureFlag {
  return { id: r.id, name: r.name, label: r.label, description: r.description, enabled: r.enabled };
}

export const featuresApi = {
  list: async (): Promise<FeatureFlag[]> => {
    const res = await apiFetch<FeatureFlagResponse[]>("/features");
    return res.map(mapFlag);
  },

  toggle: async (name: string): Promise<FeatureFlag> => {
    const res = await apiFetch<FeatureFlagResponse>(`/features/${name}/toggle`, { method: "PATCH" });
    return mapFlag(res);
  },
};
