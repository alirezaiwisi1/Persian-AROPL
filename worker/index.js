/**
 * Persian-AROPL — Cloudflare Worker entrypoint.
 *
 * Serves the static site (public/) as Worker assets and exposes a /health
 * check. The TikTok LIVE detection lives 100% in the existing backend
 * (TikTok LIVE monitor), which the front-end calls directly.
 *
 * 404 handling (SEO P0 fix): unknown URLs return a real 404 with the
 * custom 404.html page. The worker NEVER falls through to the assets
 * binding for an unknown path — the binding serves index.html as a
 * fallback, which is a soft 404 (HTTP 200 with the homepage).
 *
 * Secrets (set with `wrangler secret put`):
 *   TINA_TOKEN, NEXT_PUBLIC_TINA_CLIENT_ID are build-time only and are NOT
 *   used at runtime. Nothing sensitive lives in this file.
 */

// Pages and files that exist at the site root. Anything else at the root
// is not a real URL and must 404. If a new root-level file is added
// (for example llms.txt), add its path here.
const KNOWN_PAGES = new Set([
  "/",
  "/index.html",
  "/study",
  "/study.html",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/manifest.json",
  "/404.html",
  "/admin",
]);

// Real directories under public/. /admin is the TinaCMS admin SPA
// (robots-disallowed); it handles its own client-side routing.
// /books/ and /religion-of-peace-and-light/ hold the dedicated SEO pages
// (book detail pages + religion overview); a missing file under them still
// 404s via the ASSETS fetch below.
const KNOWN_PREFIXES = ["/assets/", "/admin/", "/books/", "/religion-of-peace-and-light/"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // A malformed path (bad %-escape) is a 404, not a crash.
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return new Response("not found", { status: 404 });
    }

    // Unknown path: return the custom 404 page with a real 404 status.
    // Do not fall through to the assets binding — it serves index.html
    // as a fallback (soft 404).
    const known =
      KNOWN_PAGES.has(path) ||
      KNOWN_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (!known) {
      return serve404(env, url, request);
    }

    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404) {
      return serve404(env, url, request);
    }
    return asset;
  },
};

// Serve the custom 404 page (public/404.html) with a real 404 status.
// Falls back to a plain-text 404 if the page itself is missing.
async function serve404(env, url, request) {
  const page = await env.ASSETS.fetch(
    new Request(new URL("/404.html", url.origin), request),
  );
  if (page.status === 200) {
    return new Response(page.body, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new Response("not found", { status: 404 });
}
