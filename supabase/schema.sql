create table if not exists whitelist_applications (
  id uuid primary key default gen_random_uuid(),
  x_username text unique not null,
  wallet_address text unique not null,
  followed boolean not null default false,
  liked boolean not null default false,
  retweeted boolean not null default false,
  quoted boolean not null default false,
  quote_post_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wl_wallet on whitelist_applications (wallet_address);
create index if not exists idx_wl_created on whitelist_applications (created_at desc);

-- Row Level Security: lock the table down. All writes/reads from the app go
-- through server-side routes using the service role key, which bypasses RLS,
-- so no public policies are needed here.
alter table whitelist_applications enable row level security;

-- Site config: the branding/task values the admin panel edits at runtime
-- (project name, X handle, tweet to promote). Single row, id always 1.
create table if not exists site_config (
  id int primary key default 1,
  project_name text not null default 'OUTBREAK',
  x_username text not null default 'youraccount',
  tweet_id text not null default '0000000000000000000',
  tweet_url text not null default '',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into site_config (id) values (1) on conflict (id) do nothing;

-- Application window: a manual kill switch plus an optional scheduled
-- open/close window. Effective open/closed status is computed from both.
alter table site_config add column if not exists applications_open boolean not null default true;
alter table site_config add column if not exists opens_at timestamptz;
alter table site_config add column if not exists closes_at timestamptz;

-- Public read is fine (it's just branding copy, nothing sensitive) so the
-- landing page can fetch it with the anon key. Writes only happen through
-- the admin API route using the service role key, which bypasses RLS.
alter table site_config enable row level security;
create policy "public can read site config" on site_config
  for select using (true);
