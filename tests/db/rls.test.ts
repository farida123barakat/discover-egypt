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
  for (const f of readdirSync(migDir).sort()) await db.exec(readFileSync(path.join(migDir, f), "utf8"));
  await db.exec(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8"));
  // Supabase grants table privileges to these roles by default; RLS then decides row access.
  await db.exec(`grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);
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
