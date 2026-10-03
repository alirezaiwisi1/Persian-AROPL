/**
 * Persian-AROPL — Cloudflare Worker entrypoint.
 *
 * Serves the static site (public/) as Worker assets and exposes a tiny
 * /api/tiktok-status proxy so the front-end can read LIVE status without
 * depending on the backend's CORS setup. The LIVE detection itself stays
 * 100% in the existing backend (TikTok LIVE monitor) — this Worker only
 * forwards the response untouched.
 *
 * Secrets (set with `wrangler secret put`):
 *   TINA_TOKEN, NEXT_PUBLIC_TINA_CLIENT_ID are build-time only and are NOT
 *   used at runtime. Nothing sensitive lives in this file.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // Optional same-origin proxy for the TikTok LIVE status endpoint.
    // The site keeps calling the backend directly via assets/js/config.js;
    // this proxy is a fallback for strict CORS environments.
    if (url.pathname === "/api/tiktok-status") {
      const base = (env.TIKTOK_API_BASE || "https://tiktok-live-monitor-hcc7.onrender.com").replace(/\/+$/, "");
      const upstream = await fetch(base + "/api/status", {
        headers: { "accept": "application/json" },
        cf: { cacheTtl: 15, cacheEverything: false },
      });
      const resp = new Response(upstream.body, upstream);
      resp.headers.set("access-control-allow-origin", url.origin);
      resp.headers.set("content-type", "application/json");
      return resp;
    }

    // Static assets (public/ folder is bound in wrangler.jsonc).
    // Ask the assets binding for the exact path first; only fall back to
    // directory-index handling for extensionless document URLs.
    const path = decodeURIComponent(url.pathname);
    if (path !== "/" && /\.[a-zA-Z0-9]+$/.test(path)) {
      const asset = await env.ASSETS.fetch(new Request(new URL(path, url.origin), request));
      if (asset.status !== 404) return asset;
    }
    return env.ASSETS.fetch(request);
  },
};
