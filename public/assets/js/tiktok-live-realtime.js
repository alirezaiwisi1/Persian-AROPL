/* TikTok LIVE — Supabase Realtime layer (ADDITIVE; tiktok-live.js untouched).
   Subscribes to public.tiktok_state changes and applies LIVE/OFFLINE state to
   the EXISTING live cards instantly — no page refresh. Official-account
   priority, spotlight, alert and all styling stay with the existing code
   (same DOM contract: .live-card[data-username], .live-badge-text,
   .live-action-text, data-state).

   Activation: window.AROPL_CONFIG.SUPABASE_URL (+ optional
   SUPABASE_ANON_KEY; defaults to the well-known public anon key is NOT
   assumed — must be provided). If not configured, this file does nothing and
   the original polling behaviour remains the only mechanism. */
(() => {
  'use strict';
  const cfg = window.AROPL_CONFIG || {};
  const url = cfg.SUPABASE_URL;
  const key = cfg.SUPABASE_ANON_KEY;
  if (!url || !key || !window.supabase) return; // silently inert when not enabled

  const section = document.getElementById('live');
  let client;
  try {
    client = window.supabase.createClient(url, key, {
      realtime: { params: { eventsPerSecond: 2 } },
    });
  } catch (e) { console.warn('live-rt: client init failed', e); return; }

  /* Compose the full live list and hand it to the polling engine's shared
     presentation path (AROPL_LIVE.apply): badges + summary + reorder + alert. */
  const liveUsernames = new Set();
  const pushToEngine = () => {
    if (window.AROPL_LIVE && window.AROPL_LIVE.apply) {
      window.AROPL_LIVE.apply([...liveUsernames]);
    }
  };

  const applyRow = (row) => {
    if (!row || !row.username) return;
    const u = String(row.username).toLowerCase();
    if (row.is_live) liveUsernames.add(u);
    else liveUsernames.delete(u);
    pushToEngine();
  };

  const bootstrap = async () => {
    // Initial snapshot so a fresh page load shows current state instantly.
    try {
      const { data, error } = await client
        .from('tiktok_state')
        .select('username, is_live, updated_at')
        .order('username');
      if (error) throw error;
      liveUsernames.clear();
      (data || []).forEach(r => { if (r && r.username && r.is_live) liveUsernames.add(String(r.username).toLowerCase()); });
      pushToEngine();
    } catch (e) { console.warn('live-rt: bootstrap failed', e); }
  };

  // Channel subscription — realtime INSERT/UPDATE/DELETE on tiktok_state.
  const ch = client
    .channel('aropl-tiktok-live')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tiktok_state' },
      (payload) => {
        if (payload.eventType === 'DELETE' && payload.old && payload.old.username) {
          liveUsernames.delete(String(payload.old.username).toLowerCase());
          pushToEngine();
        } else if (payload.new) {
          applyRow(payload.new);
        }
      })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') bootstrap();
    });

  // Reconnect on wakeup (mobile tab return) — snapshot refresh.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ch.state === 'joined') bootstrap();
  });
})();
