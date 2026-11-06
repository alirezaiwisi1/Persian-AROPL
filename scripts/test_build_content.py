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

print("test_build_content: ok")
