import { useQuery } from "@tanstack/react-query";
import { localeApi } from "../api";
import { qk } from "./keys";
import { formatPrice } from "../utils/currency";
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

/** Returns a price formatter function scoped to the current user's currency. */
export function usePriceFormatter() {
  const { currentUser } = useAuth();
  const { data: currencies = [] } = useCurrencies();
  const currencyCode = currentUser?.currencyCode ?? "USD";
  return (amountUsd: number) => formatPrice(amountUsd, currencyCode, currencies);
}
