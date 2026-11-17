import { json } from "@/lib/api";
import { listLivePartners } from "@/lib/print-store";

/** Verified, active printing partners. An empty list means printing is not offered. */
export async function GET() {
  return json({ partners: await listLivePartners() });
}
