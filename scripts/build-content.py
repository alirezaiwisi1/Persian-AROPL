#!/usr/bin/env python3
"""AROPL build step — STRICT PRESERVATION build.

Renders public/index.html and public/study.html FROM the pristine templates in
templates/ (byte-identical copies of the original working ZIP) using the JSON
content that TinaCMS edits in content/.

Guarantees:
  * CSS, JS behaviour files, images, PDFs come from the original ZIP untouched
    (only config.js / tiktok-accounts.js are regenerated with the same globals).
  * HTML edits are value substitutions INSIDE the existing markup: same tags,
    same classes, same order. No new wrappers, no client-side templating, no
    visible data blobs.
  * The public site is plain static HTML + the original JS; it never depends
    on Tina. Tina only edits content/*.json.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
TPL = os.path.join(ROOT, "templates")
CONTENT = os.path.join(ROOT, "content")
BR = "\n"


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_dir(sub):
    d = os.path.join(CONTENT, sub)
    return [load(os.path.join(d, n)) for n in sorted(os.listdir(d)) if n.endswith(".json")]


def esc(s):
    return (str(s if s is not None else "")
            .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


# --- card templates: VERBATIM markup from the original index.html; only data differs ---
BOOK_TPL = """        <article class="book-card book-card--{variant} reveal">
          <div class="book-stage spine-{spine}" style="--ratio:{ratio}" data-ry="{ry}" data-rx="{rx}">
            <div class="stage-glow" aria-hidden="true"></div>
            <div class="book-float"><div class="book3d">
              <div class="face face-front"><img src="{cover}" alt="{coverAlt}" width="{coverWidth}" height="1280" loading="lazy" draggable="false"></div>
              <div class="face face-back"></div>
              <div class="face face-spine"><span>{spineLabel}</span></div>
              <div class="face face-pages"></div><div class="face face-top"></div><div class="face face-bottom"></div>
            </div></div>
            <div class="book-shadow" aria-hidden="true"></div>
            <p class="stage-hint" aria-hidden="true">برای چرخاندن بکشید</p>
          </div>
          <div class="book-body">
{blank}
            <h3>{titleFa}</h3>
            <p>{descriptionFa}</p>
            <div class="book-actions">
              <a class="gold-button small" href="{pdfUrl}" target="_blank" rel="noopener">مطالعه PDF ↗</a>
              <a class="outline-button small" href="{audioUrl}" target="_blank" rel="noopener">خوانش صوتی ↗</a>
              <a class="text-link" href="{officialUrl}" target="_blank" rel="noopener">دانلود رسمی ↗</a>
            </div>
          </div>
        </article>"""

VIDEO_TPL = ('          <article class="video-card reveal"><a href="{url}" target="_blank" rel="noopener"{auto}>'
             '<div class="video-thumb"><img src="{thumb}" alt="{thumbAlt}" loading="lazy"></div>'
             '<div class="video-meta"><span>{channelLabel}</span><h3>{title}</h3><p>{ctaLabel}</p></div></a></article>')

CHANNEL_TPL = """          <article class="video-card channel-card reveal">
            <a href="{channelUrl}" target="_blank" rel="noopener" aria-label="{channelAriaLabel}">
              <div class="channel-hero-card"><img src="{channelImage}" alt="{channelImageAlt}" loading="lazy"><span class="channel-overlay"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8Z" fill="currentColor"/><path d="m9.6 15.5 6.2-3.5-6.2-3.5v7Z" fill="#111"/></svg><span>{channelCta}</span></span></div>
            </a>
          </article>"""

LIVECARD_PLAIN = """        <a class="live-card reveal" data-username="{username}" data-state="loading" href="{profileUrl}" target="_blank" rel="noopener" aria-label="{ariaLabel}">
          <span class="live-avatar" aria-hidden="true"><span class="live-avatar-ring"></span><img src="{avatar}" alt="" width="58" height="58" loading="lazy" decoding="async"><span class="live-avatar-live"></span></span>
          <span class="live-body">
            <strong class="live-name" dir="auto">{displayName}</strong>
            <span class="live-handle" dir="ltr">@{username}</span>
            <span class="live-badge"><i class="live-dot" aria-hidden="true"></i><span class="live-badge-text">در حال بررسی</span></span>
          </span>
          <b class="net-arrow" aria-hidden="true">↗</b>
        </a>"""

LIVECARD_FEATURED = """        <a class="live-card live-card--featured reveal" data-username="{username}" data-featured="1" data-state="loading" href="{profileUrl}" target="_blank" rel="noopener" aria-label="{ariaLabel}">
          <span class="live-avatar" aria-hidden="true">
            <span class="live-avatar-ring"></span>
            <img src="{avatar}" alt="" width="128" height="128" loading="lazy" decoding="async">
            <span class="live-avatar-live"></span>
          </span>
          <span class="live-body">
            <span class="live-role"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.6 6.1 6.6.5-5 4.3 1.5 6.5L12 16.6 6.3 20l1.5-6.5-5-4.3 6.6-.5L12 2.6Z"/></svg>کانال رسمی فارسی</span>
            <strong class="live-name" dir="auto">{displayName}</strong>
            <span class="live-handle" dir="ltr">@{username}</span>
            <span class="live-badge"><i class="live-dot" aria-hidden="true"></i><span class="live-badge-text">در حال بررسی</span></span>
          </span>
          <span class="live-action"><span class="live-action-text">مشاهده پروفایل</span><b class="net-arrow" aria-hidden="true">↗</b></span>
        </a>"""

STUDY_SECTION_TPL = """      <section class="article-section" id="{sid}">
        <h2><i class="sec-num">{num}</i><span>{title}</span></h2>
{blocks}
      </section>"""

STUDY_BLOCK_TPLS = {
    "paragraph": "        <p>{text}</p>",
    "finalNote": '        <p class="final-note">{text}</p>',
    "subheading": "        <h3>{text}</h3>",
    "quote": '        <blockquote><p>{text}</p><small>{source}</small></blockquote>',
}


def render_books(books):
    out, spine_map = [], {"manifesto": "gold", "goal": "black"}
    for b in sorted(books, key=lambda x: (x.get("order", 0), x.get("variant", ""))):
        out.append(BOOK_TPL.format(
            variant=esc(b.get("variant", "")),
            spine=spine_map.get(b.get("variant", ""), "gold"),
            ratio=b.get("coverRatio", 0.65), coverWidth=b.get("coverWidth", 826), ry=b.get("restRotateY", -24), rx=b.get("restRotateX", 4),
            cover=esc(b.get("coverImage", "")), coverAlt=esc(b.get("coverAlt", "")),
            spineLabel=esc(b.get("spineLabel", "")),
            titleFa=b.get("titleFa", ""),  # may contain <br><em> inline (original markup)
            descriptionFa=esc(b.get("descriptionFa", "")),
            pdfUrl=esc(b.get("pdfUrl", "")), audioUrl=esc(b.get("audioUrl", "")),
            officialUrl=esc(b.get("officialUrl", "")), blank="            "))
    return BR.join(out)


YT_DEFAULTS = {
    "fa": {"thumbAlt": "ویدیوی منتخب فارسی", "channelLabel": "ویدیو منتخب",
           "title": "ویدیوی منتخب فارسی", "ctaLabel": "مشاهده در YouTube ↗"},
    "en": {"thumbAlt": "Featured video", "channelLabel": "THE MAHDI HAS APPEARED",
           "title": "Featured video", "ctaLabel": "Watch on YouTube ↗"},
}


def apply_video_defaults(vids, lang):
    """Fill empty video fields with per-language defaults (user only pastes the URL)."""
    d = YT_DEFAULTS.get(lang, YT_DEFAULTS["en"])
    for v in vids:
        for k, dv in d.items():
            if not (v.get(k) or "").strip():
                v[k] = dv
    return vids


def normalize_youtube(v):
    """Auto-fix any YouTube URL form (youtu.be/..., watch?v=..., with ?si=... etc.)
    to canonical watch URL and derive the thumbnail if missing/blank."""
    raw = (v.get("url") or "").strip()
    m = (re.search(r"youtu\.be/([A-Za-z0-9_-]{6,})", raw)
         or re.search(r"[?&]v=([A-Za-z0-9_-]{6,})", raw)
         or re.search(r"youtube\.com/(?:embed|shorts|live)/([A-Za-z0-9_-]{6,})", raw))
    if m:
        vid = m.group(1)
        v["url"] = "https://www.youtube.com/watch?v=" + vid
        if not (v.get("thumb") or "").strip():
            v["thumb"] = "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg"
    return v


def render_videos(vids):
    vids = [dict(v) for v in vids]
    for v in vids:
        normalize_youtube(v)
    return BR.join(VIDEO_TPL.format(
        url=esc(v.get("url", "")), auto=' data-auto-title' if v.get("autoTitle") else '',
        thumb=esc(v.get("thumb", "")), thumbAlt=esc(v.get("thumbAlt", "")),
        channelLabel=esc(v.get("channelLabel", "")), title=esc(v.get("title", "")),
        ctaLabel=esc(v.get("ctaLabel", ""))) for v in vids)


def render_channel(blk):
    return CHANNEL_TPL.format(channelUrl=esc(blk.get("channelUrl", "")),
                              channelAriaLabel=esc(blk.get("channelAriaLabel", "")),
                              channelImage=esc(blk.get("channelImage", "")),
                              channelImageAlt=esc(blk.get("channelImageAlt", "")),
                              channelCta=esc(blk.get("channelCta", "")))


def render_livecards(accounts):
    out = []
    for a in sorted([a for a in accounts if a.get("username")],
                    key=lambda x: (x.get("order", 0), x.get("username", ""))):
        av = (a.get("avatar") or "").lstrip("/")
        if not av or not os.path.exists(os.path.join(PUB, av)):
            av = "assets/images/tiktok/%s.webp" % a.get("username", "")
        data = dict(username=esc(a.get("username", "")), profileUrl=esc(a.get("profileUrl", "")),
                    ariaLabel=esc(a.get("ariaLabel", "")), avatar=esc(av),
                    displayName=esc(a.get("displayName", "")))
        out.append((LIVECARD_FEATURED if (a.get("official") or a.get("featured")) else LIVECARD_PLAIN).format(**data))
    return BR.join(out)


def render_study_article(doc, lang):
    parts = []
    # Canonical section ids per language (template TOC anchors); Tina may drop 'id' on save.
    CANON_IDS = ["prophecies", "platform", "west", "king", "banners", "age", "soul", "duties"]
    for i, sec in enumerate(doc.get("sections", [])):
        sid = sec.get("id") or f"{lang}-{CANON_IDS[i] if i < len(CANON_IDS) else i + 1}"
        blocks = []
        for b in sec.get("blocks", []):
            btype = b.get("_template") or b.get("type") or "paragraph"
            src = render_source_line(b) if btype == "quote" else b.get("source", "")
            blocks.append(STUDY_BLOCK_TPLS.get(btype, STUDY_BLOCK_TPLS["paragraph"])
                          .format(text=esc(b.get("text", "")), source=esc(src)))
        parts.append(STUDY_SECTION_TPL.format(sid=sid, num=esc(sec.get("num", "")),
                                              title=esc(sec.get("title") or sec.get("heading") or sec.get("headingFa") or ""), blocks=BR.join(blocks)))
    return ("\n\n").join(parts)


def study_intro(html, lang, doc=None):
    art = re.search(r'<article class="article-wrap study-version" id="study-' + lang + r'"[^>]*>(.*?)</article>', html, re.S)
    intro = re.search(r'[ \t]*<div class="article-intro">.*?</div>\s*</div>', art.group(1), re.S)
    block = intro.group(0) if intro else ""
    if not doc:
        return block
    d = doc.get("intro") or {}
    def sub(pat, val, s, flags=0):
        if not val:
            return s
        return re.sub(pat, lambda m: m.group(1) + val + m.group(2), s, count=1, flags=flags)
    block = re.sub(r'(<div class="intro-media"><img src=")[^"]*(" alt=")[^"]*(")',
                   lambda m: m.group(1) + esc(d.get("image") or "") + m.group(2) + esc(d.get("imageAlt") or "") + m.group(3),
                   block, count=1)
    block = sub(r'(<span class="intro-badge">)[^<]*(</span>)', esc(d.get("badge")), block)
    block = sub(r'(<div class="intro-body">\s*<span class="kicker">)[^<]*(</span>)', esc(d.get("kicker")), block)
    block = sub(r'(<span class="kicker">[^<]*</span>\s*<h2>).*?(</h2>)', esc(d.get("title")), block, re.S)
    block = sub(r'(<p class="lead">).*?(</p>)', esc(d.get("lead")), block, re.S)
    block = sub(r'(<span class="titles-label">)[^<]*(</span>)', esc(d.get("titlesLabel")), block)
    if d.get("titleChips"):
        chips = BR.join("              <li>%s %s</li>" % (
            esc(c.get("name", "")), ("<small>%s</small>" % esc(c["meaning"])) if c.get("meaning") else "")
            for c in d["titleChips"])
        block = re.sub(r'(<ul class="title-chips">\s*\n).*?(\n\s*</ul>)',
                       lambda m: m.group(1) + chips + m.group(2), block, count=1, flags=re.S)
    block = sub(r'(<p class="intro-note">).*?(</p>)', esc(d.get("note")), block, re.S)
    return block



NET_ICONS = {
    "globe": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19"/></svg>',
    "telegram": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 3.6 2.7 11c-1.2.5-1.2 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.6.1.8.7.8.4 0 .6-.2.9-.4l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.7-.8L23 5c.3-1.3-.5-1.900-1.100-1.400ZM8.500 13.500l9.500-6c.4-.3.9-.1.5.2l-7.700 7-.3 3.200-2-4.400Z"/></svg>',
    "tiktok": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.600 3c.3 2.400 1.700 4 4 4.200v3.100a7 7 0 0 1-4-1.300v6.200a5.600 5.600 0 1 1-5.600-5.600c.3 0 .6 0 .9.100v3.200a2.500 2.500 0 1 0 1.600 2.300V3h3.100Z"/></svg>',
    "youtube": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.600 15.500v-7l6.200 3.500-6.200 3.500Z"/></svg>',
}
NET_CARD_TPL = ('<a class="net-card{cls} reveal" href="{url}" target="_blank" rel="noopener">'
                '<span class="net-icon" aria-hidden="true">{icon}</span>'
                '<span class="net-text"><strong>{label}</strong><small>{sublabel}</small></span>'
                '<b class="net-arrow" aria-hidden="true">↗</b></a>')


def render_net_cards(links, st_icons=None):
    out = []
    for l in links or []:
        size = l.get("size") or "normal"
        cls = " net-wide" if size == "wide" else (" net-half" if size == "half" else " ")
        out.append(NET_CARD_TPL.format(cls=cls, url=esc(l.get("url", "")),
                                       icon=(st_icons or NET_ICONS).get(l.get("icon", "globe"), (st_icons or NET_ICONS)["globe"]),
                                       label=esc(l.get("label", "")), sublabel=esc(l.get("sublabel", ""))))
    return BR.join(["        " + x for x in out])


def render_footer_links(links):
    return "".join('<a href="%s"%s>%s</a>' % (
        esc(l.get("url", "")),
        ' target="_blank" rel="noopener"' if l.get("url", "").startswith("http") else "",
        esc(l.get("label", ""))) for l in links or [])


def render_source_line(quote):
    """Render the <small> source exactly as before; structured sources[] if present."""
    srcs = quote.get("sources")
    if srcs:
        parts = []
        for s2 in srcs:
            if s2.get("extra") and not s2.get("book"):
                parts.append(s2["extra"])
            else:
                bits = [s2.get("book"), s2.get("author")]
                if s2.get("volume"):
                    bits.append("جلد " + s2["volume"])
                if s2.get("page"):
                    bits.append("ص. " + s2["page"])
                if s2.get("hadithNo"):
                    bits.append("حدیث " + s2["hadithNo"])
                p = "، ".join(x for x in bits if x)
                parts.append(p or s2.get("extra") or "")
        return "؛ ".join(p for p in parts if p)
    return quote.get("source", "")


def render_toc(html, fa_doc, en_doc):
    """Rebuild the study TOC labels/anchors from Tina section titles (FA visible + data-fa, EN data-en)."""
    def grab(doc):
        return [(esc(s.get("id") or ""), esc(s.get("num") or ""), esc(s.get("title") or "")) for s in doc.get("sections", [])]
    fa, en = grab(fa_doc), grab(en_doc)
    n = min(len(fa), len(en), 8)
    if n == 0:
        return html
    lis = []
    for i in range(n):
        fid, fnum, ftitle = fa[i]
        eid, enum, etitle = en[i]
        num = fnum or enum
        lis.append(
            '        <li><a class="toc-link" href="#{fid}" data-href-fa="#{fid}" data-href-en="#{eid}">'
            '<i data-fa="{num}" data-en="{enum}">{num}</i>'
            '<span data-fa="{ftitle}" data-en="{etitle}">{ftitle}</span></a></li>'.format(
                fid=fid, eid=eid, num=num, enum=enum, ftitle=ftitle, etitle=etitle))
    new_block = "\n".join(lis)
    return re.sub(r'(      <ol class="toc-list">\n).*?(\n      </ol>)',
                  lambda m: m.group(1) + new_block + m.group(2), html, count=1, flags=re.S)


def apply_shell_copy(html, st):
    """1:1 value substitutions inside the original shell markup."""
    def sub(pat, val, s, flags=0):
        if not val:
            return s
        return re.sub(pat, lambda m: m.group(1) + val + m.group(2), s, count=1, flags=flags)

    html = sub(r'(<meta name="description" content=")[^"]*(">)', esc(st.get("metaDescriptionFa")), html)
    html = sub(r'(<div class="eyebrow">)[^<]*(</div>)', esc(st.get("heroKicker")), html)
    html = sub(r'(<h1 id="hero-title">)[^<]*(<br>)', esc(st.get("heroTitle")), html)
    html = sub(r'(<h1 id="hero-title">[^<]*<br><span>)\([^<]*\)(</span></h1>)',
               "(" + esc(st.get("heroTitleSuffix")) + ")", html)
    # hero paragraph: preserve <br> structure from JSON newlines
    hp = esc(st.get("heroParagraph") or "").replace("\n", "<br>")
    html = sub(r'(<h1 id="hero-title">.*?</h1>\s*\n\s*<p>).*?(</p>)', hp, html, re.S)
    html = sub(r'(<a class="gold-button" href="study.html">)[^<]*(</a>)', esc(st.get("heroCtaLabel")), html)
    html = re.sub(r'(<small>)(?:اسکرول کنید|Scroll)(</small>)',
                  lambda m: m.group(1) + esc(st.get("scrollCueText") or "اسکرول کنید") + m.group(2), html, count=1)
    # CTA section (ending)
    def _cta(m):
        return (m.group(1) + esc(st.get("ctaKicker") or "KEEP EXPLORING") + m.group(2) +
                esc(st.get("ctaTitle") or "") + m.group(3) + esc(st.get("ctaParagraph") or "") + m.group(4))
    html = re.sub(r'(<section class="cta-section[^"]*">.*?<span class="kicker">)[^<]*(</span><h2>)[^<]*(</h2><p>)[^<]*(</p>)',
                  _cta, html, count=1, flags=re.S)
    for sec_id, prefix in (("about", "about"), ("books", "books"), ("videos", "videos"),
                           ("live", "live"), ("channels", "channels")):
        blk = re.search(r'<section[^>]*\sid="' + sec_id + r'"[^>]*>(.*?)</section>', html, re.S)
        if not blk:
            continue
        inner = blk.group(1)
        new_inner = re.sub(r'(<span class="kicker">)[^<]*(</span>)',
                           lambda m: m.group(1) + esc(st.get(prefix + "Kicker") or "") + m.group(2), inner, count=1)
        new_inner = re.sub(r'(<h2[^>]*>)[^<]*(</h2>)',
                           lambda m: m.group(1) + esc(st.get(prefix + "Title") or "") + m.group(2), new_inner, count=1)
        new_inner = re.sub(r'(<h2>[^<]*</h2>\s*<p>).*?(</p>)',
                           lambda m: m.group(1) + esc(st.get(prefix + "Paragraph") or "") + m.group(2), new_inner, count=1)
        html = html.replace(inner, new_inner)
    return html


def write_roster(accounts):
    ordered = sorted([a for a in accounts if a.get("username")],
                     key=lambda a: (a.get("order", 0), a.get("username", "")))
    lines = [
        "/* Official TikTok accounts — GENERATED from content/tiktok/*.json (names must stay in sync with the #live cards).",
        "   Static profile metadata only; LIVE/OFFLINE status comes from the backend. */",
        "window.AROPL_TIKTOK_ACCOUNTS = [",
    ]
    for i, a in enumerate(ordered):
        off = a.get("official")
        fields = ["username: %s" % json.dumps(a["username"], ensure_ascii=False),
                  "name: %s" % json.dumps(a["displayName"], ensure_ascii=False)]
        if off:
            fields.append("official: true")
        lines.append("  { %s }%s" % (", ".join(fields), "," if i < len(ordered) - 1 else ""))
    lines.append("];")
    with open(os.path.join(PUB, "assets", "js", "tiktok-accounts.js"), "w", encoding="utf-8") as fh:
        fh.write(BR.join(lines) + BR)


def main():
    st = load(os.path.join(CONTENT, "settings", "site.json"))
    books = load_dir("books")
    youtube = {b["slug"]: b for b in load_dir("youtube")}
    accounts = load_dir("tiktok")
    study_fa = load(os.path.join(CONTENT, "study", "study-fa.json"))
    study_en = load(os.path.join(CONTENT, "study", "study-en.json"))

    write_roster(accounts)
    with open(os.path.join(PUB, "assets", "js", "config.js"), "w", encoding="utf-8") as fh:
        fh.write(
            "/* Site configuration — GENERATED from content/settings/site.json.\n"
            "   TIKTOK_API_BASE is the public base URL of the tiktok-live-monitor backend\n"
            "   (no trailing slash). LIVE/OFFLINE detection always comes from that backend. */\n"
            "window.AROPL_CONFIG = {\n"
            "  TIKTOK_API_BASE: %s,\n"
            "  TIKTOK_REFRESH_MS: %s\n"
            "};\n" % (json.dumps(st.get("tiktokApiBase", "")), json.dumps(st.get("tiktokRefreshMs", 30000))))

    # ================= index.html =================
    idx = open(os.path.join(TPL, "index.html"), encoding="utf-8").read()

    m = re.search(r'(<div class="books-stack">\n).*?(\n      </div>\n    </section>)', idx, re.S)
    idx = idx[:m.start(1) + len(m.group(1))] + render_books(books) + idx[m.start(2):]

    for label, slug in (("youtube-fa-title", "youtube-fa"), ("youtube-en-title", "youtube-en")):
        blk = re.search(r'(aria-labelledby="' + label + r'">\s*\n\s*<div class="youtube-block-heading">.*?<div class="video-scroller youtube-scroller">\s*\n).*?(\n        </div>\n      </div>\n)(?=\s*\n?\s*(?:<div class="youtube-block|</section>))', idx, re.S)
        data = youtube[slug]
        lang = "en" if slug.endswith("-en") else "fa"
        vids = apply_video_defaults([dict(v) for v in data.get("videos", [])], lang)
        inner = render_channel(data) + BR + render_videos(vids)
        idx = idx[:blk.start(1) + len(blk.group(1))] + inner + idx[blk.start(2):]

    m3 = re.search(r'(<div class="live-grid">\s*\n).*?(\n      </div>\n\n      <p class="live-note")', idx, re.S)
    idx = idx[:m3.start(1) + len(m3.group(1))] + render_livecards(accounts) + idx[m3.start(2):]

    idx = apply_shell_copy(idx, st)

    # --- net-cards (social links) ---
    mnc = re.search(r'(<div class="net-grid">\s*\n).*?(\n\s*</section>)', idx, re.S)
    if mnc and st.get("socialLinks"):
        idx = idx[:mnc.start(1) + len(mnc.group(1))] + render_net_cards(st["socialLinks"], st.get("socialIcons")) + idx[mnc.start(2):]
    # --- footer links + brand ---
    mfl = re.search(r'(<nav class="footer-links"[^>]*>).*?(</nav>)', idx, re.S)
    if mfl and st.get("footerLinks"):
        idx = idx[:mfl.start(1) + len(mfl.group(1))] + render_footer_links(st["footerLinks"]) + idx[mfl.start(2):]
    fb = st.get("footerBrand") or {}
    if fb:
        idx = re.sub(r'(<footer class="site-footer">.*?<strong>)[^<]*(</strong><small>)[^<]*(</small>)',
                     lambda m: m.group(1) + esc(fb.get("name") or "") + m.group(2) + esc(fb.get("sub") or "") + m.group(3),
                     idx, count=1, flags=re.S)
        idx = re.sub(r'(footer-brand"><img src=")[^"]*(" alt="[^"]*")',
                     lambda m: m.group(1) + esc(fb.get("logo") or "assets/images/logo.webp") + m.group(2), idx, count=1)
    mfn = re.search(r'(<div class="footer-note"><p>).*?(</p>)', idx, re.S)
    if mfn:
        idx = idx[:mfn.start(1) + len(mfn.group(1))] + esc(st.get("footerNote") or "") + idx[mfn.start(2):]
    # --- official-site URLs inside books CTA + CTA section (single source of truth: officialUrl) ---
    if st.get("officialUrl"):
        idx = idx.replace('href="https://theahmadireligion.org/" target="_blank"',
                          'href="%s" target="_blank"' % esc(st["officialUrl"]))
    home_title = st.get("homeTitle") or st.get("siteName")
    idx = re.sub(r'(<title>)[^<]*(</title>)', lambda m: m.group(1) + esc(home_title) + m.group(2), idx, count=1)
    with open(os.path.join(PUB, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(idx)

    # ================= study.html =================
    std = open(os.path.join(TPL, "study.html"), encoding="utf-8").read()
    fa = re.search(r'(<article class="article-wrap study-version" id="study-fa"[^>]*>\s*\n)(.*?)(\n    </article>)', std, re.S)
    std = std[:fa.start(2)] + study_intro(std, "fa", study_fa) + BR + BR + render_study_article(study_fa, "fa") + std[fa.end(2):]
    en = re.search(r'(<article class="article-wrap study-version" id="study-en"[^>]*>\s*\n)(.*?)(\n    </article>)', std, re.S)
    std = std[:en.start(2)] + study_intro(std, "en", study_en) + BR + BR + render_study_article(study_en, "en") + std[en.end(2):]
    std = render_toc(std, study_fa, study_en)
    std = apply_shell_copy(std, st)
    std = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                 lambda m: m.group(1) + esc(study_fa.get("metaDescription") or st.get("metaDescriptionFa")) + m.group(2), std, count=1)
    # <title> stays the baseline Persian one; study.js swaps it per language at runtime.
    fa_title = study_fa.get("pageTitle")
    if fa_title:
        std = re.sub(r'(<title>)[^<]*(</title>)', lambda m: m.group(1) + esc(fa_title) + m.group(2), std, count=1)
    with open(os.path.join(PUB, "study.html"), "w", encoding="utf-8") as fh:
        fh.write(std)

    print("[build-content] books=%d youtube=%d accounts=%d study_fa=%d study_en=%d"
          % (len(books), len(youtube), len(accounts), len(study_fa["sections"]), len(study_en["sections"])))


if __name__ == "__main__":
    sys.exit(main())
