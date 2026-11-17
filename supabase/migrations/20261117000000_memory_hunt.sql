-- Egypt Memory Hunt: private memory backups, postcard printing partners and print requests.
-- Memories are private by default: only their owner can read or change them (RLS + storage policies).

-- ---------------------------------------------------------------- memories (optional cloud backup)
create table public.memories (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  challenge_id text check (challenge_id ~ '^[a-z0-9-]{2,60}$'),
  destination_slug text references public.destinations (slug) on delete set null,
  visit_date date check (visit_date between date '1950-01-01' and date '2100-01-01'),
  caption text not null default '' check (char_length(caption) <= 120),
  story text not null default '' check (char_length(story) <= 600),
  template text not null check (template in ('golden-hour', 'papyrus', 'nile', 'cairo-night', 'desert')),
  arabic boolean not null default false,
  -- photos live in the private "memories" bucket under the owner's own folder
  photo_path text check (photo_path is null or photo_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.jpg$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memories_user_idx on public.memories (user_id, created_at desc);
create trigger memories_updated before update on public.memories for each row execute function public.set_updated_at();

alter table public.memories enable row level security;
-- No admin read: memories are personal. Admins cannot see them either.
create policy "owner select" on public.memories for select to authenticated using (user_id = auth.uid());
create policy "owner insert" on public.memories for insert to authenticated with check (user_id = auth.uid());
create policy "owner update" on public.memories for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner delete" on public.memories for delete to authenticated using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- Each visitor may only touch files inside a folder named after their own user id.
create policy "memories: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memories: owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memories: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memories: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- printing partners
-- A partner is shown to visitors only once it is verified (with a date) AND active.
create table public.print_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  kind text not null check (kind in ('hotel', 'museum', 'tourism-office', 'cafe')),
  destination_slug text not null references public.destinations (slug),
  address text not null check (char_length(address) between 5 and 300),
  opening_hours text check (char_length(opening_hours) <= 200),
  -- internal note on how the partnership was verified; never shown publicly
  verification_note text check (char_length(verification_note) <= 500),
  verified boolean not null default false,
  verified_on date,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verified_needs_date check (not verified or verified_on is not null),
  constraint active_needs_verified check (not active or verified)
);
create trigger print_partners_updated before update on public.print_partners for each row execute function public.set_updated_at();
alter table public.print_partners enable row level security;
create policy "public reads live partners" on public.print_partners for select to anon, authenticated using (verified and active);
create policy "admin manage" on public.print_partners for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Hide the internal note from everyone except admins (column privileges on top of RLS).
revoke select on public.print_partners from anon, authenticated;
grant select (id, name, kind, destination_slug, address, opening_hours, verified, verified_on, active, created_at, updated_at) on public.print_partners to anon, authenticated;

-- ---------------------------------------------------------------- print requests
-- The collection code is random and carries no personal data. Requests are created and looked up
-- through the server (service role) only; visitors never read other people's requests.
create table public.print_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^DE-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$'),
  partner_id uuid not null references public.print_partners (id),
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'printing', 'ready', 'collected', 'cancelled', 'expired')),
  cancel_token_hash text not null check (char_length(cancel_token_hash) = 64),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index print_requests_status_idx on public.print_requests (status, created_at desc);
create trigger print_requests_updated before update on public.print_requests for each row execute function public.set_updated_at();
alter table public.print_requests enable row level security;
create policy "owner read" on public.print_requests for select to authenticated using (user_id = auth.uid());
create policy "admin manage" on public.print_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Postcard images for printing: private, server-side only (no policies for anon/authenticated).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('print-jobs', 'print-jobs', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;
