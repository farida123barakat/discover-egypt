-- DISCOVER EGYPT — initial schema
-- Principles: RLS on every table; visitors can only insert pending submissions;
-- only admins (user_profiles.role = 'admin') can read private data or change content;
-- personal itineraries are visible to their owner only.

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- users & roles
create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'visitor' check (role in ('visitor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger user_profiles_updated before update on public.user_profiles for each row execute function public.set_updated_at();

-- New sign-ups always start as visitors. Promote admins manually (see DEPLOYMENT.md).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.user_profiles enable row level security;
create policy "read own profile" on public.user_profiles for select to authenticated using (id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: nobody can change their own role through the API.

-- ---------------------------------------------------------------- content
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique
);

create table public.destinations (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  region text not null,
  category_slug text not null references public.categories (slug),
  environment text not null check (environment in ('city', 'river', 'sea', 'desert', 'oasis')),
  lat double precision not null check (lat between 21 and 32),
  lng double precision not null check (lng between 24 and 37),
  tagline text not null,
  summary text not null,
  interests jsonb not null default '{}'::jsonb,
  min_budget_level smallint not null check (min_budget_level between 1 and 4),
  ideal_days int4range not null,
  best_months smallint[] not null default '{}',
  hidden_gem boolean not null default false,
  photo_key text,
  passport_fact text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index destinations_category_idx on public.destinations (category_slug);
create trigger destinations_updated before update on public.destinations for each row execute function public.set_updated_at();

create table public.attractions (
  id uuid primary key default gen_random_uuid(),
  destination_slug text not null references public.destinations (slug) on delete cascade,
  name text not null,
  note text not null,
  sort smallint not null default 0,
  unique (destination_slug, name)
);
create index attractions_destination_idx on public.attractions (destination_slug);

create table public.food (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  arabic text not null,
  kind text not null check (kind in ('main', 'street', 'dessert', 'drink')),
  description text not null,
  ingredients text[] not null default '{}',
  price_min_egp numeric(10, 2),
  price_max_egp numeric(10, 2),
  vegetarian text not null check (vegetarian in ('yes', 'no', 'often')),
  background text not null,
  check (price_max_egp is null or price_max_egp >= price_min_egp)
);

create table public.historical_stories (
  id text primary key,
  name text not null,
  dates text not null,
  summary text not null,
  child_version text not null,
  place_slugs text[] not null default '{}',
  sort smallint not null default 0,
  updated_at timestamptz not null default now()
);
create trigger historical_stories_updated before update on public.historical_stories for each row execute function public.set_updated_at();

create table public.walking_routes (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  duration text not null,
  distance_km numeric(5, 2) not null check (distance_km > 0),
  intro text not null,
  tips text[] not null default '{}',
  status text not null check (status in ('verified', 'estimate', 'awaiting'))
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_slug text not null references public.walking_routes (slug) on delete cascade,
  position smallint not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  minutes smallint not null check (minutes >= 0),
  story text not null,
  unique (route_slug, position)
);

create table public.events (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  location text not null,
  when_text text not null,
  date_iso date,
  description text not null,
  status text not null check (status in ('verified', 'estimate', 'awaiting')),
  last_verified date,
  source_name text,
  source_url text check (source_url is null or source_url like 'https://%'),
  updated_at timestamptz not null default now(),
  check (status <> 'verified' or (source_url is not null and last_verified is not null))
);
create index events_date_idx on public.events (date_iso);
create trigger events_updated before update on public.events for each row execute function public.set_updated_at();

create table public.travel_prices (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  item text not null,
  min_egp numeric(10, 2) not null check (min_egp >= 0),
  max_egp numeric(10, 2) not null,
  kind text not null check (kind in ('official', 'estimate')),
  status text not null check (status in ('verified', 'estimate', 'awaiting')),
  last_verified date,
  source_name text,
  source_url text check (source_url is null or source_url like 'https://%'),
  updated_at timestamptz not null default now(),
  check (max_egp >= min_egp)
);
create trigger travel_prices_updated before update on public.travel_prices for each row execute function public.set_updated_at();

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  alt text not null check (char_length(alt) >= 10),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Public read, admin write, for every content table.
do $$
declare t text;
begin
  foreach t in array array['categories','destinations','attractions','food','historical_stories','walking_routes','route_stops','events','travel_prices','site_settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.media enable row level security;
create policy "admin only" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- submissions (Ask a Local + traveller stories)
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('question', 'story')),
  name text not null check (char_length(name) between 2 and 60),
  email text not null check (char_length(email) <= 254),
  destination text not null,
  title text check (title is null or char_length(title) <= 120),
  body text not null check (char_length(body) between 10 and 3000),
  country text check (country is null or char_length(country) <= 60),
  answer text check (answer is null or char_length(answer) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);
create index submissions_status_idx on public.submissions (status, kind, created_at desc);

alter table public.submissions enable row level security;
-- Anyone may submit, but only as pending and unanswered.
create policy "submit pending" on public.submissions for insert to anon, authenticated
  with check (status = 'pending' and answer is null and moderated_at is null);
create policy "admin manage" on public.submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public projection: approved only, no email, first name only.
create view public.public_submissions with (security_barrier = true) as
  select id, kind, destination, title, body, country, answer, created_at,
         split_part(name, ' ', 1) as first_name
  from public.submissions
  where status = 'approved';
grant select on public.public_submissions to anon, authenticated;

-- ---------------------------------------------------------------- contact & newsletter (write-only for the public)
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  email text not null check (char_length(email) <= 254),
  topic text not null check (topic in ('planning', 'accessibility', 'press', 'feedback', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin read" on public.contact_messages for select to authenticated using (public.is_admin());

create table public.newsletter_subscribers (
  email text primary key check (char_length(email) <= 254),
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "admin read" on public.newsletter_subscribers for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- personal itineraries
-- A trip is edited and validated as one document (zod schema in src/lib/validation.ts),
-- so days and activities live in `data`. Ownership and access are relational and enforced by RLS.
create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index itineraries_user_idx on public.itineraries (user_id, created_at desc);
create trigger itineraries_updated before update on public.itineraries for each row execute function public.set_updated_at();

alter table public.itineraries enable row level security;
create policy "owner select" on public.itineraries for select to authenticated using (user_id = auth.uid());
create policy "owner insert" on public.itineraries for insert to authenticated with check (user_id = auth.uid());
create policy "owner update" on public.itineraries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner delete" on public.itineraries for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('destination-photos', 'destination-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
-- Reads are public (bucket is public). Writes only happen server-side with the service role after an admin check,
-- so no insert/update/delete policies are granted to anon or authenticated users.
