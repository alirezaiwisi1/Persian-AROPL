#!/usr/bin/env python3
"""One small test for the book-title allowlist in build-content.py.

Run: python3 scripts/test_build_content.py
"""
import importlib.util
import os

# build-content.py has a hyphen in its name, so it cannot be imported
# with a plain import statement; load it from its file path instead.
_HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "build_content", os.path.join(_HERE, "build-content.py")
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
allow_title_html = _mod.allow_title_html
section_id = _mod.section_id
must_search = _mod.must_search

# Real titles keep their <br> and <em>.
assert allow_title_html("هدف<br><em>حکیم</em>") == "هدف<br><em>حکیم</em>"
assert allow_title_html("مانیفست<br><em>مهدی</em>") == "مانیفست<br><em>مهدی</em>"

# Everything else is escaped, so it shows as text instead of running.
assert allow_title_html('<script>alert(1)</script>') == "&lt;script&gt;alert(1)&lt;/script&gt;"
assert allow_title_html('<img src=x onerror=alert(1)>') == "&lt;img src=x onerror=alert(1)&gt;"
assert allow_title_html('<a href="https://example.com">x</a>') == (
    '&lt;a href=&quot;https://example.com&quot;&gt;x&lt;/a&gt;'
)

# A typed-out "&lt;br&gt;" must not smuggle a real <br> through.
assert "<br>" not in allow_title_html("&lt;br&gt;")

# Section ids: a real id wins; a missing one falls back to the canonical id,
# so the article and the TOC always agree on the anchor.
assert section_id({"id": "custom"}, "fa", 1) == "custom"
assert section_id({}, "fa", 1) == "fa-platform"
assert section_id({}, "en", 1) == "en-platform"

# must_search returns the match, and names the missing marker instead of
# crashing with a bare AttributeError.
assert must_search(r"(ab)", "xab", "demo").group(1) == "ab"
try:
    must_search(r"(zz)", "xab", "demo-marker")
except SystemExit as e:
    assert "demo-marker" in str(e)
else:
    raise AssertionError("must_search did not raise on a missing marker")

# --- Re-audit 2026-11-07 fixes ---

# Finding 2: write_roster tolerates a TikTok account without displayName.
import tempfile
_tmp = tempfile.mkdtemp()
os.makedirs(os.path.join(_tmp, "assets", "js"), exist_ok=True)
_old_pub = _mod.PUB
_mod.PUB = _tmp
try:
    _mod.write_roster([
        {"username": "no-name", "avatar": "assets/images/tiktok/no-name.webp"},
        {"username": "has-name", "displayName": "Has Name"},
    ])
    _roster = open(os.path.join(_tmp, "assets", "js", "tiktok-accounts.js"), encoding="utf-8").read()
    assert 'name: ""' in _roster, _roster
    assert "no-name" in _roster and "Has Name" in _roster
finally:
    _mod.PUB = _old_pub

# Finding 3: render_source_line renders chapter and URL, extra wins, and
# escapes user input (it returns safe HTML; callers must not escape it).
render_source_line = _mod.render_source_line
_s = render_source_line({"sources": [{"book": "غیبت طوسی", "author": "شیخ طوسی", "chapter": "۳", "url": "https://example.com/book"}]})
assert "باب ۳" in _s, _s
assert '<a href="https://example.com/book"' in _s, _s
_s = render_source_line({"sources": [{"book": "کتاب", "extra": "متن کامل"}]})
assert _s == "متن کامل", _s
_s = render_source_line({"sources": [{"book": "<script>alert(1)</script>"}]})
assert "<script>" not in _s and "&lt;script&gt;" in _s, _s
assert render_source_line({"source": "منبع <b>قدیمی</b>"}) == "منبع &lt;b&gt;قدیمی&lt;/b&gt;"

# Finding 6: hero title suffix — missing key keeps the template default
# (None), empty clears the parentheses, a value is wrapped in parens.
assert _mod.hero_title_suffix_repl(None) is None
assert _mod.hero_title_suffix_repl("") == ""
assert _mod.hero_title_suffix_repl("متن") == "(متن)"

# Finding 8: normalize_avatar converts once, then skips when the target is
# at least as new as the source.
from PIL import Image as _Image
_tmp2 = tempfile.mkdtemp()
_src_dir = os.path.join(_tmp2, "up")
os.makedirs(_src_dir, exist_ok=True)
_src = os.path.join(_src_dir, "a.png")
_Image.new("RGBA", (4, 4), (255, 0, 0, 255)).save(_src, "PNG")
_a = {"username": "a", "avatar": "up/a.png"}
assert _mod.normalize_avatar(_a, _tmp2) is True
_target = os.path.join(_tmp2, "assets", "images", "tiktok", "a.webp")
assert os.path.isfile(_target)
assert _a["avatar"] == "assets/images/tiktok/a.webp"
_mtime = os.path.getmtime(_target)
assert _mod.normalize_avatar(_a, _tmp2) is False
assert os.path.getmtime(_target) == _mtime

print("test_build_content: ok")
