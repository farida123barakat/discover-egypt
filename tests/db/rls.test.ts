// @vitest-environment node
/**
 * Database permission tests: runs the real migration and seed on PGlite (Postgres compiled to WASM)
 * and checks Row Level Security as the anon / authenticated roles that Supabase uses.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const root = path.join(__dirname, "..", "..");
const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";

let db: PGlite;

async function as<T>(role: "anon" | "authenticated", sub: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(path.join(__dirname, "supabase-stub.sql"), "utf8"));
  const migDir = path.join(root, "supabase", "migrations");
  // Supabase grants table privileges to these roles by default (on creation), so a migration can still
  // revoke some (e.g. column-level grants on print_partners). RLS then decides row access.
  await db.exec(`grant usage on schema public to anon, authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;`);
  for (const f of readdirSync(migDir).sort()) await db.exec(readFileSync(path.join(migDir, f), "utf8"));
  await db.exec(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8"));
  await db.exec(`insert into auth.users (id, email) values ('${ALICE}','a@example.com'),('${BOB}','b@example.com'),('${ADMIN}','admin@example.com');
    update public.user_profiles set role = 'admin' where id = '${ADMIN}';`);
}, 60_000);

describe("schema and seed", () => {
  it("seeds content", async () => {
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.destinations");
    expect(r.rows[0].n).toBeGreaterThanOrEqual(12);
  });
  it("creates a visitor profile for every new user", async () => {
    const r = await db.query<{ role: string }>(`select role from public.user_profiles where id = '${ALICE}'`);
    expect(r.rows[0].role).toBe("visitor");
  });
  it("rejects a verified event without a source", async () => {
    await expect(db.exec(`insert into public.events (id,name,location,when_text,description,status) values ('x-test','X','Y','Z','described here','verified')`)).rejects.toThrow();
  });
});

describe("row level security", () => {
  it("lets anonymous visitors read public content", async () => {
    const r = await as("anon", null, () => db.query("select slug from public.destinations"));
    expect(r.rows.length).toBeGreaterThan(0);
  });

  it("blocks anonymous edits to content", async () => {
    await as("anon", null, () => db.exec(`update public.travel_prices set min_egp = 0`));
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.travel_prices where min_egp = 0");
    expect(r.rows[0].n).toBe(0);
  });

  it("lets anyone submit a pending question but not a pre-approved one", async () => {
    await as("anon", null, () => db.exec(`insert into public.submissions (kind,name,email,destination,body) values ('question','Sam Lee','s@example.com','cairo','Is the metro easy to use?')`));
    await expect(
      as("anon", null, () => db.exec(`insert into public.submissions (kind,name,email,destination,body,status) values ('question','Eve','e@example.com','cairo','Sneaky approved post','approved')`)),
    ).rejects.toThrow();
  });

  it("hides submissions (and emails) from the public until approved", async () => {
    const raw = await as("anon", null, () => db.query("select * from public.submissions"));
    expect(raw.rows).toHaveLength(0);
    const before = await as("anon", null, () => db.query("select * from public.public_submissions"));
    expect(before.rows).toHaveLength(0);
    await db.exec(`update public.submissions set status = 'approved', answer = 'Yes, very.'`);
    const after = await as("anon", null, () => db.query<Record<string, unknown>>("select * from public.public_submissions"));
    expect(after.rows).toHaveLength(1);
    expect(after.rows[0]).not.toHaveProperty("email");
    expect(after.rows[0].first_name).toBe("Sam");
  });

  it("keeps each visitor's itineraries private", async () => {
    await as("authenticated", ALICE, () => db.exec(`insert into public.itineraries (user_id,title,data) values ('${ALICE}','Alice trip','{"days":[]}')`));
    const bobSees = await as("authenticated", BOB, () => db.query("select * from public.itineraries"));
    expect(bobSees.rows).toHaveLength(0);
    const aliceSees = await as("authenticated", ALICE, () => db.query("select * from public.itineraries"));
    expect(aliceSees.rows).toHaveLength(1);
  });

  it("stops a visitor writing a trip into someone else's account (IDOR)", async () => {
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.itineraries (user_id,title,data) values ('${ALICE}','Planted','{}')`))).rejects.toThrow();
    await as("authenticated", BOB, () => db.exec(`delete from public.itineraries`));
    const left = await db.query<{ n: number }>("select count(*)::int as n from public.itineraries");
    expect(left.rows[0].n).toBe(1);
  });

  it("does not let a visitor promote themselves to admin", async () => {
    await as("authenticated", ALICE, () => db.exec(`update public.user_profiles set role = 'admin' where id = '${ALICE}'`));
    const r = await db.query<{ role: string }>(`select role from public.user_profiles where id = '${ALICE}'`);
    expect(r.rows[0].role).toBe("visitor");
  });

  it("lets admins manage content and read submissions", async () => {
    await as("authenticated", ADMIN, () => db.exec(`update public.travel_prices set max_egp = max_egp + 1 where id = 'water'`));
    const subs = await as("authenticated", ADMIN, () => db.query("select email from public.submissions"));
    expect(subs.rows.length).toBe(1);
  });

  it("makes contact messages write-only for the public", async () => {
    await as("anon", null, () => db.exec(`insert into public.contact_messages (name,email,topic,message) values ('Ana','a@example.com','other','Hello there, a test message')`));
    const r = await as("anon", null, () => db.query("select * from public.contact_messages"));
    expect(r.rows).toHaveLength(0);
  });
});

describe("Memory Hunt: private memories", () => {
  const M1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const M2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("lets a visitor back up a memory, and only they can see it — not other visitors, not admins", async () => {
    await as("authenticated", ALICE, () => db.exec(`insert into public.memories (id,user_id,challenge_id,destination_slug,caption,template,photo_path) values ('${M1}','${ALICE}','giza-scale','giza','Tiny me','papyrus','${ALICE}/${M1}.jpg')`));
    expect((await as("authenticated", ALICE, () => db.query("select id from public.memories"))).rows).toHaveLength(1);
    expect((await as("authenticated", BOB, () => db.query("select id from public.memories"))).rows).toHaveLength(0);
    expect((await as("authenticated", ADMIN, () => db.query("select id from public.memories"))).rows).toHaveLength(0);
    expect((await as("anon", null, () => db.query("select id from public.memories"))).rows).toHaveLength(0);
  });

  it("stops anyone writing into, changing or deleting another visitor's memories", async () => {
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.memories (id,user_id,template) values ('${M2}','${ALICE}','nile')`))).rejects.toThrow();
    await as("authenticated", BOB, () => db.exec(`update public.memories set caption = 'hacked'`));
    await as("authenticated", BOB, () => db.exec(`delete from public.memories`));
    await expect(as("anon", null, () => db.exec(`insert into public.memories (id,user_id,template) values ('${M2}','${ALICE}','nile')`))).rejects.toThrow();
    const r = await db.query<{ caption: string }>("select caption from public.memories");
    expect(r.rows).toEqual([{ caption: "Tiny me" }]);
  });

  it("only allows a photo path inside the owner's own folder, and enforces lengths and templates", async () => {
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.memories (id,user_id,template,photo_path) values ('${M2}','${BOB}','nile','${ALICE}/${M2}.jpg')`))).rejects.toThrow();
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.memories (id,user_id,template) values ('${M2}','${BOB}','comic-sans')`))).rejects.toThrow();
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.memories (id,user_id,template,caption) values ('${M2}','${BOB}','nile','${"x".repeat(121)}')`))).rejects.toThrow();
  });

  it("keeps memory photos in each visitor's own storage folder", async () => {
    await as("authenticated", ALICE, () => db.exec(`insert into storage.objects (bucket_id,name) values ('memories','${ALICE}/${M1}.jpg')`));
    await expect(as("authenticated", BOB, () => db.exec(`insert into storage.objects (bucket_id,name) values ('memories','${ALICE}/planted.jpg')`))).rejects.toThrow();
    await expect(as("anon", null, () => db.exec(`insert into storage.objects (bucket_id,name) values ('memories','${ALICE}/anon.jpg')`))).rejects.toThrow();
    expect((await as("authenticated", BOB, () => db.query("select name from storage.objects where bucket_id = 'memories'"))).rows).toHaveLength(0);
    expect((await as("authenticated", ALICE, () => db.query("select name from storage.objects where bucket_id = 'memories'"))).rows).toHaveLength(1);
    await as("authenticated", BOB, () => db.exec(`delete from storage.objects where bucket_id = 'memories'`));
    expect((await db.query("select name from storage.objects where bucket_id = 'memories'")).rows).toHaveLength(1);
  });

  it("creates the memories and print-jobs buckets as private, JPEG only", async () => {
    const r = await db.query<{ id: string; public: boolean; allowed_mime_types: string[] }>("select id, public, allowed_mime_types from storage.buckets where id in ('memories','print-jobs') order by id");
    expect(r.rows.map((b) => [b.id, b.public, b.allowed_mime_types])).toEqual([
      ["memories", false, ["image/jpeg"]],
      ["print-jobs", false, ["image/jpeg"]],
    ]);
  });
});

describe("Memory Hunt: printing partners and requests", () => {
  const LIVE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const DRAFT = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const REQ = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

  beforeAll(async () => {
    await db.exec(`insert into public.print_partners (id,name,kind,destination_slug,address,verification_note,verified,verified_on,active) values
      ('${LIVE}','Nile View Hotel','hotel','aswan','Corniche el-Nil, Aswan','Signed letter from the manager',true,'2026-11-12',true),
      ('${DRAFT}','Draft Cafe','cafe','luxor','Television Street, Luxor',null,false,null,false)`);
  });

  it("refuses an active partner that isn't verified, or a verified one without a date", async () => {
    await expect(db.exec(`insert into public.print_partners (name,kind,destination_slug,address,active) values ('Bad','cafe','luxor','Somewhere 1',true)`)).rejects.toThrow();
    await expect(db.exec(`insert into public.print_partners (name,kind,destination_slug,address,verified) values ('Bad','cafe','luxor','Somewhere 1',true)`)).rejects.toThrow();
  });

  it("shows visitors only partners that are verified and active", async () => {
    const r = await as("anon", null, () => db.query<{ id: string }>("select id from public.print_partners"));
    expect(r.rows.map((x) => x.id)).toEqual([LIVE]);
    const a = await as("authenticated", BOB, () => db.query<{ id: string }>("select id from public.print_partners"));
    expect(a.rows.map((x) => x.id)).toEqual([LIVE]);
  });

  it("hides the internal verification note from everyone but the server", async () => {
    await expect(as("anon", null, () => db.query("select verification_note from public.print_partners"))).rejects.toThrow(/permission denied/);
    await expect(as("authenticated", BOB, () => db.query("select * from public.print_partners"))).rejects.toThrow(/permission denied/);
  });

  it("does not let visitors create or change partners", async () => {
    await expect(as("anon", null, () => db.exec(`insert into public.print_partners (name,kind,destination_slug,address) values ('Mine','cafe','luxor','Somewhere 1')`))).rejects.toThrow();
    await as("authenticated", BOB, () => db.exec(`update public.print_partners set active = true, verified = true, verified_on = '2026-01-01' where id = '${DRAFT}'`));
    expect((await db.query<{ active: boolean }>(`select active from public.print_partners where id = '${DRAFT}'`)).rows[0].active).toBe(false);
  });

  it("keeps print requests server-side: visitors can't read others' or create their own directly", async () => {
    await db.exec(`insert into public.print_requests (id,code,partner_id,user_id,cancel_token_hash,image_path) values ('${REQ}','DE-7K3M-Q9TX','${LIVE}','${ALICE}','${"a".repeat(64)}','${REQ}.jpg')`);
    expect((await as("anon", null, () => db.query("select id from public.print_requests"))).rows).toHaveLength(0);
    expect((await as("authenticated", BOB, () => db.query("select id from public.print_requests"))).rows).toHaveLength(0);
    expect((await as("authenticated", ALICE, () => db.query("select id from public.print_requests"))).rows).toHaveLength(1); // their own
    expect((await as("authenticated", ADMIN, () => db.query("select id from public.print_requests"))).rows).toHaveLength(1);
    await expect(as("anon", null, () => db.exec(`insert into public.print_requests (code,partner_id,cancel_token_hash) values ('DE-AAAA-BBBB','${LIVE}','${"b".repeat(64)}')`))).rejects.toThrow();
    await as("authenticated", ALICE, () => db.exec(`update public.print_requests set status = 'ready'`));
    expect((await db.query<{ status: string }>(`select status from public.print_requests where id = '${REQ}'`)).rows[0].status).toBe("requested");
  });

  it("only accepts well-formed collection codes and known statuses", async () => {
    await expect(db.exec(`insert into public.print_requests (code,partner_id,cancel_token_hash) values ('DE-0000-1111','${LIVE}','${"c".repeat(64)}')`)).rejects.toThrow();
    await expect(db.exec(`insert into public.print_requests (code,partner_id,cancel_token_hash,status) values ('DE-CCCC-DDDD','${LIVE}','${"c".repeat(64)}','lost')`)).rejects.toThrow();
    await expect(db.exec(`insert into public.print_requests (code,partner_id,cancel_token_hash) values ('DE-7K3M-Q9TX','${LIVE}','${"d".repeat(64)}')`)).rejects.toThrow(); // codes are unique
  });

  it("gives visitors no access to postcard images awaiting print", async () => {
    await db.exec(`insert into storage.objects (bucket_id,name) values ('print-jobs','${REQ}.jpg')`);
    expect((await as("anon", null, () => db.query("select name from storage.objects where bucket_id = 'print-jobs'"))).rows).toHaveLength(0);
    expect((await as("authenticated", ALICE, () => db.query("select name from storage.objects where bucket_id = 'print-jobs'"))).rows).toHaveLength(0);
    await expect(as("authenticated", ALICE, () => db.exec(`insert into storage.objects (bucket_id,name) values ('print-jobs','${ALICE}/x.jpg')`))).rejects.toThrow();
  });
});

describe("editorial content: recipes, bucket list and films", () => {
  it("seeds every recipe, activity and film from src/content", async () => {
    const n = async (t: string) => (await db.query<{ n: number }>(`select count(*)::int as n from public.${t}`)).rows[0].n;
    expect(await n("recipes")).toBeGreaterThan(0);
    expect(await n("bucket_list_activities")).toBeGreaterThan(0);
    expect(await n("media_items")).toBeGreaterThan(0);
  });

  it("shows visitors only published activities and films, and every recipe's review status", async () => {
    const drafts = await db.query<{ n: number }>("select count(*)::int as n from public.media_items where status = 'draft'");
    expect(drafts.rows[0].n).toBeGreaterThan(0); // the seed has drafts, so this test means something
    const films = await as("anon", null, () => db.query<{ status: string }>("select status from public.media_items"));
    expect(films.rows.every((r) => r.status === "published")).toBe(true);
    const acts = await as("anon", null, () => db.query<{ published: boolean }>("select published from public.bucket_list_activities"));
    expect(acts.rows.length).toBeGreaterThan(0);
    expect(acts.rows.every((r) => r.published)).toBe(true);
    const all = (await db.query<{ n: number }>("select count(*)::int as n from public.recipes")).rows[0].n;
    expect((await as("anon", null, () => db.query("select slug, status from public.recipes"))).rows).toHaveLength(all);
  });

  it("lets admins, and only admins, change official content", async () => {
    await as("authenticated", ALICE, () => db.exec(`update public.recipes set status = 'approved'`));
    await as("anon", null, () => db.exec(`update public.media_items set featured = true`));
    expect((await db.query<{ n: number }>("select count(*)::int as n from public.recipes where status = 'approved'")).rows[0].n).toBe(0);
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.bucket_list_activities (id, title, published, data) values ('fake-activity', 'Fake one', true, '{}')`))).rejects.toThrow();
    await as("authenticated", ADMIN, () => db.exec(`insert into public.bucket_list_activities (id, title, published, data) values ('admin-activity', 'Admin made this', false, '{}')`));
    const seenByAdmin = await as("authenticated", ADMIN, () => db.query("select id from public.bucket_list_activities where id = 'admin-activity'"));
    expect(seenByAdmin.rows).toHaveLength(1); // admins see unpublished drafts
    expect((await as("anon", null, () => db.query("select id from public.bucket_list_activities where id = 'admin-activity'"))).rows).toHaveLength(0);
    const slug = (await db.query<{ slug: string }>("select slug from public.recipes limit 1")).rows[0].slug;
    await as("authenticated", ADMIN, () => db.exec(`update public.recipes set status = 'approved', reviewer = 'Discover Egypt editor' where slug = '${slug}'`));
    expect((await db.query<{ status: string }>(`select status from public.recipes where slug = '${slug}'`)).rows[0].status).toBe("approved");
  });

  it("keeps each visitor's bucket-list progress private, and sync can't write into someone else's", async () => {
    await as("authenticated", ALICE, () => db.exec(`insert into public.user_bucket_list (activity_id, added, completed, completed_at) values ('felucca-sunset', true, true, now())`));
    expect((await as("authenticated", ALICE, () => db.query("select activity_id from public.user_bucket_list"))).rows).toHaveLength(1);
    expect((await as("authenticated", BOB, () => db.query("select activity_id from public.user_bucket_list"))).rows).toHaveLength(0);
    expect((await as("authenticated", ADMIN, () => db.query("select activity_id from public.user_bucket_list"))).rows).toHaveLength(0);
    expect((await as("anon", null, () => db.query("select activity_id from public.user_bucket_list"))).rows).toHaveLength(0);
    await expect(as("authenticated", BOB, () => db.exec(`insert into public.user_bucket_list (user_id, activity_id, added) values ('${ALICE}', 'planted-one', true)`))).rejects.toThrow();
    await as("authenticated", BOB, () => db.exec(`delete from public.user_bucket_list`)); // what sync does first: may only touch Bob's rows
    expect((await db.query<{ n: number }>("select count(*)::int as n from public.user_bucket_list")).rows[0].n).toBe(1);
    await expect(as("authenticated", ALICE, () => db.exec(`insert into public.user_bucket_list (activity_id, completed) values ('khan-el-khalili', true)`))).rejects.toThrow(); // completed needs a date
  });
});
