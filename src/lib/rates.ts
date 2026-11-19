/**
 * Exchange rates from ExchangeRate-API's open endpoint (no key, daily updates, attribution required).
 * https://www.exchangerate-api.com/docs/free. Used by /api/rates, and straight from the browser on the
 * GitHub Pages build, which has no server. We never invent a rate: on failure the UI asks for one.
 */
export const RATES_URL = "https://open.er-api.com/v6/latest/EGP";
export const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export type RatesResult = { ok: true; toEgp: Record<string, number | null>; updated: string } | { ok: false; error: string };

export function parseRates(d: unknown): RatesResult {
  const data = d as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string } | null;
  if (!data || data.result !== "success" || !data.rates || typeof data.time_last_update_utc !== "string") {
    return { ok: false, error: "Live exchange rates are unavailable right now." };
  }
  const toEgp = Object.fromEntries(
    CURRENCIES.map((c) => {
      const per = data.rates![c];
      return [c, typeof per === "number" && per > 0 ? 1 / per : null];
    }),
  );
  return { ok: true, toEgp, updated: data.time_last_update_utc };
}
