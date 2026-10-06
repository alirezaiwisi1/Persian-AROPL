// supabase/functions/tiktok-watcher/index.ts
//
// AROPL FARSI — TikTok LIVE watcher (Edge Function, Supabase Free tier).
//
// COMPLETELY INDEPENDENT from the YouTube watcher (own function, own table,
// own schedule, own failure domain).
//
// Flow:
//   1. Reads the EXISTING Render LIVE-detection backend (/api/status) — the
//      proven detector stays the single source of truth (spec: do not replace
//      working parts).
//   2. Upserts each account's LIVE/OFFLINE state into the `tiktok_state` table.
//   3. Frontend subscribes via Supabase Realtime → the site updates instantly,
//      no page refresh needed. The old 30s polling in tiktok-live.js remains
//      untouched as a safety net.
//
// Secrets:
//   TIKTOK_API_BASE — https://tiktok-live-monitor-hcc7.onrender.com
// Supabase auto-provides SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type Account = {
  username: string;
  isLive: boolean;
  connected: boolean;
  lastLiveAt: string | null;
  lastOfflineAt: string | null;
};

Deno.serve(async (req) => {
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${svcKey}`) return jsonResp({ error: "unauthorized" }, 401);

  try {
    const base = (Deno.env.get("TIKTOK_API_BASE") || "https://tiktok-live-monitor-hcc7.onrender.com").replace(/\/+$/, "");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(base + "/api/status", {
      headers: { accept: "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();

    const rows: any[] = [];
    for (const group of ["live", "offline"] as const) {
      for (const a of (data[group] ?? []) as Account[]) {
        rows.push({
          username: String(a.username || "").toLowerCase(),
          is_live: group === "live" ? true : !!a.isLive,
          connected: !!a.connected,
          last_live_at: a.lastLiveAt,
          last_offline_at: a.lastOfflineAt,
          updated_at: new Date().toISOString(),
        });
      }
    }
    // Merge any account the backend knows but didn't include → offline.
    const seen = new Set(rows.map((r) => r.username));
    for (const a of (data.unknown ?? []) as Account[]) {
      const u = String(a.username || "").toLowerCase();
      if (u && !seen.has(u)) {
        rows.push({
          username: u, is_live: false, connected: false,
          last_live_at: a.lastLiveAt ?? null, last_offline_at: a.lastOfflineAt ?? null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    const { error } = await supabase
      .from("tiktok_state")
      .upsert(rows, { onConflict: "username" });
    if (error) throw new Error(`upsert: ${error.message}`);

    return jsonResp({
      ok: true,
      accounts: rows.length,
      live: rows.filter((r) => r.is_live).map((r) => r.username),
      at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("tiktok-watcher error", e);
    return jsonResp({ ok: false, error: String(e) }, 500);
  }
});
