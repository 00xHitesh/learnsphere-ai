import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { localeApi } from "../api";
import { qk } from "./keys";
import { detectRegionCode, formatPrice } from "../utils/currency";
import { useAuth } from "../auth-store";

export function useCurrencies() {
  return useQuery({
    queryKey: qk.locale.currencies(),
    queryFn: () => localeApi.getCurrencies(),
    staleTime: Infinity,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: qk.locale.regions(),
    queryFn: () => localeApi.getRegions(),
    staleTime: Infinity,
  });
}

/**
 * Returns a price formatter function scoped to the active currency.
 * For signed-in users: uses their saved currencyCode.
 * For guests: auto-detects from the browser locale; falls back to USD.
 */
export function usePriceFormatter() {
  const { currentUser } = useAuth();
  const { data: currencies = [] } = useCurrencies();
  const { data: regions = [] } = useRegions();

  const currencyCode = useMemo(() => {
    if (currentUser?.currencyCode) return currentUser.currencyCode;
    const detected = detectRegionCode();
    const region = detected ? regions.find((r) => r.code === detected) : null;
    return region?.defaultCurrencyCode ?? "USD";
  }, [currentUser?.currencyCode, regions]);

  return (amountUsd: number) => formatPrice(amountUsd, currencyCode, currencies);
}
