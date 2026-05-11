import { apiFetch } from "./client";
import type { Currency, Region } from "../types";

export const localeApi = {
  getCurrencies: (): Promise<Currency[]> => apiFetch<Currency[]>("/locale/currencies"),
  getRegions: (): Promise<Region[]> => apiFetch<Region[]>("/locale/regions"),
};
