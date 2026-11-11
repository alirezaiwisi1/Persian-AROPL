#!/usr/bin/env python3
"""YouTube watcher — GitHub Actions version (stdlib only).

Replaces the Supabase Edge Function (supabase/functions/youtube-watcher/
index.ts), which kept failing because the GitHub PAT it needs lives as a
Supabase secret, and the secret-setting helper stored a surrogate string
instead of the real token, so GitHub rejected every commit with 401.

Running inside GitHub Actions, this script needs no stored GitHub token
at all: the workflow commits with the built-in GITHUB_TOKEN, which GitHub
issues fresh for every run. No PAT to rotate, no secret to paste, no
Supabase Edge Function, no pg_cron schedule, no yt_seen database table.

What it does, mirroring the old watcher:
  1. Reads the public YouTube RSS feed for the FA and EN channels
     (no API key, no quota).
  2. Skips Shorts (a /shorts/<id> HEAD request that stays on /shorts/
     means Short; a redirect to /watch means a regular video).
  3. Dedupes against the video ids already in content/youtube/*.json
     (same extract rules as scripts/build-content.py: watch?v=,
     youtu.be/, embed/, shorts/, live/). A failed commit therefore
     retries on the next run, because the video is still not in the JSON.
  4. Appends new regular videos at the END of the videos array, with
     the real RSS title (autoTitle false) — the build renders newest
     first, so storage order newest-last is correct.

The workflow then runs scripts/build-content.py so the committed
public/index.html stays in sync (the CI drift check requires this),
and commits only if something changed.

Usage:
    python3 scripts/youtube-watcher.py [--dry-run]
        [--feed-file <path>] [--skip-shorts-check]
    --dry-run           print what would be added, change nothing.
    --feed-file <path>  read the FA feed from a local XML file instead
                        of the network (local testing only; in this mode
                        only the FA channel is processed).
                        Intended for offline tests, not production.
    --skip-shorts-check treat every feed video as regular (local
                        testing only; production always checks).
Exit code 0 even when nothing is new; 1 on a real error.
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CHANNELS = [
    {
        "lang": "fa",
        "file": "content/youtube/youtube-fa.json",
        "channel_id": "UCVcoPlC8eaMcpkqareJShcQ",  # @ahmadireligion_fa
        "channel_label": "ویدیوی فارسی",
        "title": "ویدیوی منتخب فارسی",
        "cta_label": "مشاهده در YouTube ↗",
        "thumb_alt": "ویدیوی منتخب فارسی",
    },
    {
        "lang": "en",
        "file": "content/youtube/youtube-en.json",
        "channel_id": "UCyZ9Sq0VhcRYC6Yo9kvZiug",  # @themahdihasappeared
        "channel_label": "Featured video",
        "title": "Featured video",
        "cta_label": "Watch on YouTube ↗",
        "thumb_alt": "Featured video",
    },
]

NS = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
ID_RE = re.compile(r"^[A-Za-z0-9_-]{6,}$")


def extract_video_id(url):
    """Mirror scripts/build-content.py normalize_youtube + the old watcher."""
    m = re.search(r"youtu\.be/([A-Za-z0-9_-]{6,})", url or "")
    if m:
        return m.group(1)
    m = re.search(r"[?&]v=([A-Za-z0-9_-]{6,})", url or "")
    if m:
        return m.group(1)
    m = re.search(r"youtube\.com/(?:embed|shorts|live)/([A-Za-z0-9_-]{6,})", url or "")
    if m:
        return m.group(1)
    return ""


def fetch_feed(channel_id, feed_file=None):
    if feed_file:
        with open(feed_file, encoding="utf-8") as fh:
            xml = fh.read()
    else:
        req = urllib.request.Request(
            f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}",
            headers={"User-Agent": "aropl-yt-watcher/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml = resp.read().decode("utf-8")
    root = ET.fromstring(xml)
    videos = []
    for entry in root.findall("atom:entry", NS)[:12]:
        vid_el = entry.find("yt:videoId", NS)
        title_el = entry.find("atom:title", NS)
        vid = vid_el.text.strip() if vid_el is not None and vid_el.text else ""
        title = html.unescape(title_el.text.strip()) if title_el is not None and title_el.text else ""
        if ID_RE.match(vid):
            videos.append({"id": vid, "title": title})
    return videos


def is_regular_video(video_id):
    """'regular' = Videos-tab upload, 'short' = Short, 'unknown' = check failed."""
    try:
        req = urllib.request.Request(
            f"https://www.youtube.com/shorts/{video_id}",
            headers={"User-Agent": "aropl-yt-watcher/1.0"},
            method="HEAD",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            final = resp.geturl()
        return "short" if urllib.parse.urlparse(final).path.startswith("/shorts/") else "regular"
    except Exception:
        return "unknown"


def to_entry(video_id, ch, title):
    return {
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "autoTitle": False,
        "thumb": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "thumbAlt": ch["thumb_alt"],
        "channelLabel": ch["channel_label"],
        "title": title or ch["title"],
        "ctaLabel": ch["cta_label"],
    }


def main(argv):
    dry_run = "--dry-run" in argv
    skip_shorts = "--skip-shorts-check" in argv
    feed_file = None
    if "--feed-file" in argv:
        feed_file = argv[argv.index("--feed-file") + 1]

    total_added = 0
    channels = CHANNELS
    if feed_file:
        # Offline test mode: only the FA channel, fed from the local file.
        channels = [c for c in CHANNELS if c["lang"] == "fa"]
    for ch in channels:
        try:
            feed = fetch_feed(ch["channel_id"], feed_file if ch["lang"] == "fa" else None)
        except Exception as exc:  # noqa: BLE001 - report and fail the run
            print(f"[{ch['lang']}] feed error: {exc}", file=sys.stderr)
            return 1
        if skip_shorts:
            regular, unknown = feed, []
        else:
            checks = [is_regular_video(v["id"]) for v in feed]
            regular = [v for v, c in zip(feed, checks) if c == "regular"]
            unknown = [v["id"] for v, c in zip(feed, checks) if c == "unknown"]
            if unknown:
                print(f"[{ch['lang']}] shorts check failed for: {', '.join(unknown)}", file=sys.stderr)
        path = os.path.join(ROOT, ch["file"])
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        existing = {extract_video_id(str(v.get("url", ""))) for v in data.get("videos", [])}
        existing.discard("")
        to_add = [v for v in regular if v["id"] not in existing]
        print(f"[{ch['lang']}] checked={len(regular)} fresh={len(to_add)} "
              f"({', '.join(v['id'] for v in to_add) or 'none'})")
        if not to_add:
            continue
        if dry_run:
            total_added += len(to_add)
            continue
        for v in to_add:
            data["videos"].append(to_entry(v["id"], ch, v["title"]))
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        total_added += len(to_add)
    print(f"total added: {total_added}{' (dry run)' if dry_run else ''}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
