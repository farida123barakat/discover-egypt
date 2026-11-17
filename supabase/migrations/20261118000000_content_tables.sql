-- Tables the app already reads and writes in Supabase mode but that no earlier migration created:
-- recipe review status, bucket-list activities, visitors' bucket-list progress and Watch & Discover items.
-- Official content is public only once published; visitors' progress is private to each visitor.

-- ---------------------------------------------------------------- recipe review gate
-- Recipe text lives in src/content/food.ts; this table holds only the editorial review status.
create table public.recipes (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,60}$'),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  last_reviewed date not null default current_date,
  reviewer text check (char_length(reviewer) <= 120),
  updated_at timestamptz not null default now()
);
create trigger recipes_updated before update on public.recipes for each row execute function public.set_updated_at();
alter table public.recipes enable row level security;
-- Review status is not secret (the site only shows approved recipes), so anyone may read it.
create policy "public read" on public.recipes for select to anon, authenticated using (true);
create policy "admin manage" on public.recipes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- bucket list (official activities)
create table public.bucket_list_activities (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (char_length(title) between 3 and 120),
  destination_slug text references public.destinations (slug) on delete set null,
  published boolean not null default false,
  featured boolean not null default false,
  -- the full activity as the app uses it (description, categories, months, tips, season, link…)
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  last_reviewed date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bucket_list_activities_published_idx on public.bucket_list_activities (published, featured desc, created_at);
create trigger bucket_list_activities_updated before update on public.bucket_list_activities for each row execute function public.set_updated_at();
alter table public.bucket_list_activities enable row level security;
create policy "public reads published" on public.bucket_list_activities for select to anon, authenticated using (published);
create policy "admin manage" on public.bucket_list_activities for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- bucket list (each visitor's progress)
-- Stored apart from the official records, which visitors can never change.
-- No foreign key to the activities: a visitor's progress for an activity that is later unpublished or
-- removed is harmless (the app only shows published activities) and must not make a sync fail.
create table public.user_bucket_list (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_id text not null check (activity_id ~ '^[a-z0-9-]{3,60}$'),
  added boolean not null default false,
  completed boolean not null default false,
  favourite boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  constraint completed_has_date check (not completed or completed_at is not null)
);
alter table public.user_bucket_list enable row level security;
create policy "owner select" on public.user_bucket_list for select to authenticated using (user_id = auth.uid());
create policy "owner insert" on public.user_bucket_list for insert to authenticated with check (user_id = auth.uid());
create policy "owner update" on public.user_bucket_list for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner delete" on public.user_bucket_list for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- Watch & Discover
create table public.media_items (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (char_length(title) between 3 and 160),
  kind text not null check (kind in ('original', 'youtube')),
  destinations text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  last_reviewed date, -- null until an editor has reviewed it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index media_items_status_idx on public.media_items (status, featured desc, created_at);
create trigger media_items_updated before update on public.media_items for each row execute function public.set_updated_at();
alter table public.media_items enable row level security;
create policy "public reads published" on public.media_items for select to anon, authenticated using (status = 'published');
create policy "admin manage" on public.media_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
