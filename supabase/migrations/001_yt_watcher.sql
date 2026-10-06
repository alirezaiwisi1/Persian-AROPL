-- AROPL FARSI — YouTube watcher schema (Supabase Free tier)
-- Run in Supabase Dashboard → SQL Editor.

-- Videos already processed (dedupe, survives restarts & git force-pushes).
create table if not exists public.yt_seen (
  video_id   text primary key,
  lang       text not null check (lang in ('fa','en')),
  title      text,
  seen_at    timestamptz not null default now()
);

-- Run log (last 500 runs kept; helps debugging without Supabase logs).
create table if not exists public.yt_runs (
  id         bigint generated always as identity primary key,
  lang       text not null check (lang in ('fa','en')),
  status     text not null,
  added      int not null default 0,
  detail     text,
  ran_at     timestamptz not null default now()
);

-- Lock down: service role only (edge function uses service key; no public access).
alter table public.yt_seen enable row level security;
alter table public.yt_runs enable row level security;

-- Trim old run logs (call from the watcher or a nightly cron).
create or replace function public.trim_yt_runs()
returns void language sql as $$
  delete from public.yt_runs
  where id not in (select id from public.yt_runs order by ran_at desc limit 500);
$$;

-- ============================================================
-- SCHEDULE: every 30 minutes, call the edge function.
-- Requires pg_cron + pg_net extensions (both free, one click in
-- Dashboard → Database → Extensions).
-- Replace <PROJECT_REF> and <FUNCTION_ANON_OR_CRON_SECRET> below.
-- ============================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'aropl-yt-watcher',
--   '*/30 * * * *',
--   $$
--   select net.http_post(
--     url    := 'https://<PROJECT_REF>.supabase.co/functions/v1/youtube-watcher',
--     headers:= '{"Authorization": "Bearer <CRON_SECRET>", "Content-Type": "application/json"}'::jsonb,
--     body   := '{}'::jsonb
--   );
--   $$
-- );
