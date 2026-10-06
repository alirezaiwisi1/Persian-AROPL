// supabase/functions/youtube-watcher/index.ts
//
// AROPL FARSI — YouTube watcher (Edge Function, Supabase Free tier).
//
// Detects newly published videos on the two configured channels via the
// public YouTube RSS feed (no API key, no quota), dedupes against a Supabase
// table, and appends new videos to the site's content JSON via the GitHub
// Contents API. Pushing to GitHub triggers the Cloudflare Pages build, which
// runs scripts/build-content.py and regenerates the sliders — newest first.
//
// COMPLETELY INDEPENDENT from the TikTok LIVE system (separate backend,
// separate failure domain, separate deploy). The website frontend is NOT
// modified by this function in any way.
//
// Required secrets (supabase secrets set):
//   GITHUB_TOKEN   — a GitHub PAT with repo:contents write on Persian-AROPL
//   GITHUB_REPO    — "alirezaiwisi1/Persian-AROPL"
//   GITHUB_BRANCH  — "main"
//   CRON_SECRET    — shared secret; the cron request must send it as
//                    `Authorization: Bearer <CRON_SECRET>` (verifier override)
// Supabase automatically provides SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CHANNELS = [
  {
    lang: "fa",
    file: "content/youtube/youtube-fa.json",
    channelId: "UCVcoPlC8eaMcpkqareJShcQ", // @ahmadireligion_fa
    channelLabel: "ویدیوی فارسی",
    title: "ویدیوی منتخب فارسی",
    ctaLabel: "مشاهده در YouTube ↗",
    thumbAlt: "ویدیوی منتخب فارسی",
  },
  {
    lang: "en",
    file: "content/youtube/youtube-en.json",
    channelId: "UCyZ9Sq0VhcRYC6Yo9kvZiug", // @themahdihasappeared
    channelLabel: "Featured video",
    title: "Featured video",
    ctaLabel: "Watch on YouTube ↗",
    thumbAlt: "Featured video",
  },
];

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

async function fetchFeed(channelId: string): Promise<{ id: string; title: string }[]> {
  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    { headers: { "user-agent": "aropl-yt-watcher/1.0" } },
  );
  if (!res.ok) throw new Error(`feed ${channelId} HTTP ${res.status}`);
  const xml = await res.text();
  const entries = xml.split("<entry>").slice(1);
  const vids = entries.slice(0, 12).map((e) => {
    const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
    const title =
      e.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "")
        .trim() ?? "";
    return { id, title };
  }).filter((v) => /^[A-Za-z0-9_-]{6,}$/.test(v.id));
  // Only regular "Videos"-tab uploads — skip Shorts (and anything that redirects there).
  const isRegular: boolean[] = await Promise.all(vids.map((v) => isRegularVideo(v.id)));
  return vids.filter((_, i) => isRegular[i]);
}

/** true = regular upload (Videos tab); false = Short or unknown/removed. */
async function isRegularVideo(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "aropl-yt-watcher/1.0" },
    });
    // A Short resolves to a /shorts/ URL; a regular video redirects to /watch?v=…
    return !new URL(res.url).pathname.startsWith("/shorts/");
  } catch {
    return false; // unknown → do not add (safe default)
  }
}

async function getJsonFile(file: string): Promise<{ sha: string; data: any }> {
  const repo = Deno.env.get("GITHUB_REPO")!;
  const branch = Deno.env.get("GITHUB_BRANCH") || "main";
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`,
    { headers: {
      authorization: `Bearer ${Deno.env.get("GITHUB_TOKEN")}`,
      accept: "application/vnd.github+json",
      "user-agent": "aropl-yt-watcher",
    } },
  );
  if (!res.ok) throw new Error(`github get ${file}: ${res.status}`);
  const j = await res.json();
  const decoded = new TextDecoder().decode(
    Uint8Array.from(atob(j.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)),
  );
  return { sha: j.sha, data: JSON.parse(decoded) };
}

function toEntry(videoId: string, ch: (typeof CHANNELS)[number]) {
  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    autoTitle: true,
    thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    thumbAlt: ch.thumbAlt,
    channelLabel: ch.channelLabel,
    title: ch.title,
    ctaLabel: ch.ctaLabel,
  };
}

async function commitJson(
  file: string,
  sha: string,
  data: any,
  message: string,
): Promise<boolean> {
  const repo = Deno.env.get("GITHUB_REPO")!;
  const branch = Deno.env.get("GITHUB_BRANCH") || "main";
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${file}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${Deno.env.get("GITHUB_TOKEN")}`,
        "content-type": "application/json",
        "user-agent": "aropl-yt-watcher",
      },
      body: JSON.stringify({
        message,
        branch,
        sha,
        content: btoa(
          String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data, null, 2) + "\n")),
        ),
      }),
    },
  );
  if (!res.ok) {
    console.error(`commit ${file} failed: ${res.status}`, await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  // Auth: Supabase cron sends the service key; manual runs must send CRON_SECRET.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("authorization") || "";
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (cronSecret ? auth !== `Bearer ${cronSecret}` : auth !== `Bearer ${svcKey}`) {
    return jsonResp({ error: "unauthorized" }, 401);
  }

  const results: any = {};
  try {
    for (const ch of CHANNELS) {
      const out: any = { checked: 0, added: 0, committed: false };
      try {
        const feed = await fetchFeed(ch.channelId);
        out.checked = feed.length;

        // Dedupe against DB (survives restarts, independent of git history).
        const ids = feed.map((v) => v.id);
        const { data: known } = await supabase
          .from("yt_seen")
          .select("video_id")
          .in("video_id", ids);
        const knownSet = new Set((known ?? []).map((r: any) => r.video_id));
        // RSS is newest-first → iterate newest→oldest; keep only unknown ones.
        const fresh = feed.filter((v) => !knownSet.has(v.id));
        out.fresh = fresh.map((v) => v.id);

        if (fresh.length === 0) {
          await supabase.from("yt_runs").insert({ lang: ch.lang, status: "ok", added: 0 });
          results[ch.lang] = out;
          continue;
        }

        // Append at END of the videos array — build renders newest-first.
        const { sha, data } = await getJsonFile(ch.file);
        const existing = new Set(
          (data.videos ?? []).map((v: any) =>
            String(v.url || "").match(/[?&]v=([A-Za-z0-9_-]+)/)?.[1] || "",
          ),
        );
        const toAdd = fresh.filter((v) => !existing.has(v.id));
        out.skippedInJson = fresh.length - toAdd.length;
        if (toAdd.length > 0) {
          for (const v of toAdd) data.videos.push(toEntry(v.id, ch));
          out.committed = await commitJson(
            ch.file,
            sha,
            data,
            `automation: add ${toAdd.length} new ${ch.lang.toUpperCase()} video(s) (${toAdd.map((v) => v.id).join(", ")})`,
          );
          out.added = toAdd.length;
        }

        for (const v of toAdd) {
          await supabase.from("yt_seen").upsert({
            video_id: v.id,
            lang: ch.lang,
            title: v.title,
          });
        }
        await supabase.from("yt_runs").insert({
          lang: ch.lang,
          status: out.committed || toAdd.length === 0 ? "ok" : "commit_failed",
          added: out.added,
          detail: JSON.stringify(out),
        });
        results[ch.lang] = out;
      } catch (e) {
        console.error(`channel ${ch.lang} failed`, e);
        results[ch.lang] = { error: String(e) };
        await supabase.from("yt_runs").insert({ lang: ch.lang, status: "error", detail: String(e) });
      }
    }
    return jsonResp({ ok: true, results });
  } catch (e) {
    return jsonResp({ ok: false, error: String(e), results }, 500);
  }
});
