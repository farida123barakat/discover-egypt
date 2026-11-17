"use client";
/**
 * Optional backup of memories to the visitor's own Supabase account. Runs in the browser as the
 * signed-in user, so Row Level Security and storage policies decide access: each person can only
 * read and write rows with their user id and files in a folder named after it. Admins cannot read them.
 */
import { supabaseBrowser } from "@/lib/supabase/browser";
import { TEMPLATES, type Memory, type TemplateId } from "./memories";

type Row = { id: string; challenge_id: string | null; destination_slug: string | null; visit_date: string | null; caption: string; story: string; template: string; arabic: boolean; photo_path: string | null; created_at: string; updated_at: string };

export async function cloudUser() {
  const sb = supabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ? { sb, id: data.user.id } : null;
}

export async function backupMemory(m: Memory) {
  const u = await cloudUser();
  if (!u) throw new Error("Sign in to back up your memories");
  let photo_path: string | null = null;
  if (m.photo) {
    photo_path = `${u.id}/${m.id}.jpg`;
    const { error } = await u.sb.storage.from("memories").upload(photo_path, m.photo, { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error("Photo upload failed");
  }
  const { error } = await u.sb.from("memories").upsert({
    id: m.id,
    user_id: u.id,
    challenge_id: m.challengeId,
    destination_slug: m.destination,
    visit_date: m.visitDate,
    caption: m.caption,
    story: m.story,
    template: m.template,
    arabic: m.arabic,
    photo_path,
    created_at: m.createdAt,
  });
  if (error) throw new Error("Backup failed");
}

export async function restoreMemories(): Promise<Memory[]> {
  const u = await cloudUser();
  if (!u) throw new Error("Sign in to restore your memories");
  const { data, error } = await u.sb.from("memories").select("*").order("created_at");
  if (error) throw new Error("Could not load your backup");
  const out: Memory[] = [];
  for (const r of (data ?? []) as Row[]) {
    let photo: Blob | null = null;
    if (r.photo_path) {
      const d = await u.sb.storage.from("memories").download(r.photo_path);
      photo = d.data ?? null;
    }
    out.push({
      id: r.id,
      challengeId: r.challenge_id,
      destination: r.destination_slug,
      visitDate: r.visit_date,
      caption: r.caption,
      story: r.story,
      template: (TEMPLATES as readonly string[]).includes(r.template) ? (r.template as TemplateId) : "golden-hour",
      arabic: r.arabic,
      photo,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      backedUpAt: r.updated_at,
    });
  }
  return out;
}

export async function deleteCloudMemory(id: string) {
  const u = await cloudUser();
  if (!u) return;
  await u.sb.storage.from("memories").remove([`${u.id}/${id}.jpg`]);
  await u.sb.from("memories").delete().eq("id", id);
}

export async function deleteAllCloudMemories() {
  const u = await cloudUser();
  if (!u) return;
  const { data } = await u.sb.storage.from("memories").list(u.id, { limit: 1000 });
  if (data?.length) await u.sb.storage.from("memories").remove(data.map((f: { name: string }) => `${u.id}/${f.name}`));
  await u.sb.from("memories").delete().eq("user_id", u.id);
}
