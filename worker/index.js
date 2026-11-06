/**
 * Persian-AROPL — Cloudflare Worker entrypoint.
 *
 * Serves the static site (public/) as Worker assets and exposes a /health
 * check. The TikTok LIVE detection lives 100% in the existing backend
 * (TikTok LIVE monitor), which the front-end calls directly.
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

    // Static assets (public/ folder is bound in wrangler.jsonc).
    // Ask the assets binding for the exact path first; only fall back to
    // directory-index handling for extensionless document URLs.
    // A malformed path (bad %-escape) is a 404, not a crash.
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return new Response("not found", { status: 404 });
    }
    if (path !== "/" && /\.[a-zA-Z0-9]+$/.test(path)) {
      const asset = await env.ASSETS.fetch(new Request(new URL(path, url.origin), request));
      if (asset.status !== 404) return asset;
    }
    return env.ASSETS.fetch(request);
  },
};
