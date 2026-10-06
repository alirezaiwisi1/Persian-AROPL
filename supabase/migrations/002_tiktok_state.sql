-- AROPL FARSI — TikTok LIVE realtime schema (Supabase Free tier)
-- SQL Editor → paste → Run.

-- One row per TikTok account: latest LIVE/OFFLINE snapshot.
create table if not exists public.tiktok_state (
  username        text primary key,
  is_live         boolean not null default false,
  connected       boolean not null default false,
  last_live_at    timestamptz,
  last_offline_at timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.tiktok_state enable row level security;

-- Public READ so the website's anon realtime subscription works.
create policy "public read tiktok_state"
  on public.tiktok_state for select
  to anon, authenticated
  using (true);

-- Writes only via service role (edge function). No insert/update policies → locked.

-- Realtime: enable change broadcast for the table.
alter publication supabase_realtime add table public.tiktok_state;

-- ============================================================
-- SCHEDULE — every minute (fastest sane cadence on free tier).
-- Requires pg_cron + pg_net (Dashboard → Database → Extensions → enable both).
-- Replace <CRON_SECRET> is not needed here: the function accepts the service
-- role key; pg_cron runs inside the DB and can use vault. Simpler alternative:
-- Supabase Dashboard → Edge Functions → Schedules → add 1-minute schedule.
-- ============================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'aropl-tiktok-watcher',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url    := 'https://lqimjiwxijzojtewcsar.supabase.co/functions/v1/tiktok-watcher',
--     headers:= jsonb_build_object('Authorization', 'Bearer ' || vault_get('service_role'), 'Content-Type', 'application/json'),
--     body   := '{}'::jsonb
--   );
--   $$
-- );
