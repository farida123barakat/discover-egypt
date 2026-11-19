import { json } from "@/lib/api";
import { parseRates, RATES_URL } from "@/lib/rates";

/** Exchange rates (see lib/rates.ts), cached for 6 hours. */
export const revalidate = 21600;

export async function GET() {
  try {
    const r = await fetch(RATES_URL, { next: { revalidate } });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const parsed = parseRates(await r.json());
    if (!parsed.ok) throw new Error("provider error");
    return json(
      { ok: true, toEgp: parsed.toEgp, updated: parsed.updated, source: { name: "ExchangeRate-API", url: "https://www.exchangerate-api.com" } },
      200,
      { "Cache-Control": "public, s-maxage=21600" },
    );
  } catch {
    return json({ ok: false, error: "Live exchange rates are unavailable right now." }, 503);
  }
}
