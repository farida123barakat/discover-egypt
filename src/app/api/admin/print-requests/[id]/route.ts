import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { adminPrintImage } from "@/lib/print-store";

/** The postcard image for a print job — admins only, never cached. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "Not authorised" }, 401);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Not found" }, 404);
  const img = await adminPrintImage(id);
  if (!img) return json({ error: "Not found" }, 404);
  return new Response(Buffer.from(img), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename="postcard-${id}.jpg"`, "X-Content-Type-Options": "nosniff" },
  });
}
