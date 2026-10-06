"""Validate the complete static Pages artifact and its root/subpath compatibility."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.title = False
        self.noindex = False
        self.main = False
        self.h1 = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.title |= tag == "title"
        self.main |= tag == "main"
        self.h1 += tag == "h1"
        if tag == "meta" and attrs.get("name") == "robots":
            self.noindex |= "noindex" in attrs.get("content", "")
        if tag == "img" and "alt" not in attrs:
            errors.append(f"{self.path}: image lacks alt text")
        for key in ("src", "href"):
            url = attrs.get(key, "")
            parsed = urlsplit(url)
            if not url or parsed.scheme or parsed.netloc or not parsed.path:
                continue
            if url.startswith("/"):
                errors.append(f"{self.path}: root-absolute path breaks project Pages: {url}")
                continue
            target = (self.path.parent / unquote(parsed.path)).resolve()
            if not target.is_relative_to(SITE.resolve()):
                errors.append(f"{self.path}: reference leaves deployed site: {url}")
            elif not target.exists():
                errors.append(f"{self.path}: missing local reference: {url}")

for route in ("index.html", "broadcast/index.html", "coldwell/index.html", "contact/index.html"):
    path = SITE / route
    if not path.is_file():
        errors.append(f"Missing route: {route}")
        continue
    parser = Page(path)
    parser.feed(path.read_text())
    if not parser.title or not parser.main or parser.h1 != 1 or not parser.noindex:
        errors.append(f"{route}: requires title, main, one h1, and noindex")

manifest = SITE / "assets/portfolio.json"
if manifest.exists():
    data = json.loads(manifest.read_text())
    ids = set()
    frame_urls = set()
    for group, count in (("public", 10), ("coldwell", 7), ("broadcast", 5)):
        items = data.get(group, [])
        if len(items) != count:
            errors.append(f"{group}: expected {count} supplied assets, got {len(items)}")
        for item in items:
            if item.get("id") in ids or not item.get("id"):
                errors.append(f"Duplicate/missing item id: {item.get('id')}")
            ids.add(item.get("id"))
            if group in ("public", "coldwell"):
                frame_url = item.get("frameUrl", "")
                parsed_frame = urlsplit(frame_url)
                parts = parsed_frame.path.strip("/").split("/")
                if parsed_frame.scheme != "https" or parsed_frame.netloc != "next.frame.io" or len(parts) != 4 or parts[0] != "share" or parts[2] != "view" or parsed_frame.query:
                    errors.append(f"{item.get('id')}: requires a stable individual Frame.io share viewer URL")
                if frame_url in frame_urls:
                    errors.append(f"{item.get('id')}: duplicate Frame.io viewer URL")
                frame_urls.add(frame_url)
            if not item.get("title") or not item.get("filename"):
                errors.append(f"Missing asset identification: {item}")
            for key in ("poster", "image", "src"):
                value = item.get(key)
                if value and not urlsplit(value).scheme:
                    target = (SITE / value).resolve()
                    if not target.is_relative_to(SITE.resolve()) or not target.is_file():
                        errors.append(f"{item.get('id')}: missing or invalid {key}: {value}")
    public_files = {item.get("filename") for item in data.get("public", [])}
    if public_files & {"Jerry-Website-Bio-V3.mp4", "dj-nelson-clout_v1 (1080p).mp4"}:
        errors.append("Retired public videos must not be included")
    logo = data.get("logo")
    if logo and not (SITE / logo).is_file():
        errors.append("Logo references a missing file")
else:
    errors.append("Missing portfolio manifest")

size = 0
for path in SITE.rglob("*"):
    if path.is_file():
        size += path.stat().st_size
        if path.stat().st_size > 50 * 1024 * 1024:
            errors.append(f"Oversized Git asset: {path.relative_to(SITE)}")
        if path.suffix.lower() in (".md", ".env", ".toml"):
            errors.append(f"Private implementation document inside published artifact: {path}")
if size > 1024 ** 3:
    errors.append("Published artifact exceeds GitHub Pages 1 GB limit")
if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: four routes, supplied 10/7/5 inventory, local references, Pages paths; {size / 1024**2:.2f} MiB artifact")
