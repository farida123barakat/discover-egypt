import { json } from "@/lib/api";

/**
 * Exchange rates from ExchangeRate-API's open endpoint (no key, daily updates, attribution required).
 * https://www.exchangerate-api.com/docs/free — cached for 6 hours. If the provider is unreachable
 * we return an error and the UI asks the user to enter a rate; we never invent one.
 */
export const revalidate = 21600;

export async function GET() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/EGP", { next: { revalidate } });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const d = (await r.json()) as { result: string; rates: Record<string, number>; time_last_update_utc: string };
    if (d.result !== "success") throw new Error("provider error");
    const perEgp = (c: string) => d.rates[c];
    const toEgp = Object.fromEntries(["USD", "EUR", "GBP"].map((c) => [c, perEgp(c) ? 1 / perEgp(c) : null]));
    return json(
      { ok: true, toEgp, updated: d.time_last_update_utc, source: { name: "ExchangeRate-API", url: "https://www.exchangerate-api.com" } },
      200,
      { "Cache-Control": "public, s-maxage=21600" },
    );
  } catch {
    return json({ ok: false, error: "Live exchange rates are unavailable right now." }, 503);
  }
}
