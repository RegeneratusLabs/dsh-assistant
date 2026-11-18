#!/usr/bin/env python3
"""
Fetch real photos from Wikimedia Commons (public domain / CC) for the studio's "real images for content-led design" (Phase 3.5).

Why this script exists: content-led design (parrots / coffee / Malaysia …) needs real photos, not CSS colour blocks.
Having the model write the fetching logic from scratch every time is slow and trips the same traps (forget to clear the proxy → TLS blows up / forget a compliant UA → 429). Hard-coded here, so next time you only change the keywords.

Usage:
  python3 scripts/fetch_images.py --query "Petronas Towers" "Langkawi beach" "George Town street" \
      --out project/assets/img --count 2 --width 1600

For each query it takes the first count hits, scales them to width, downloads them to out, and prints a manifest (path | licence | author | source page) so you can check honesty.
Nothing fetched at all → exit code 1, pointing to the Phase 3.5 three-step image fallback (Unsplash/Pexels → generate → honest placeholder).
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request

# (1) clear the proxy: curl/urllib through a local proxy blows up TLS handshakes
for _k in ("ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"):
    os.environ.pop(_k, None)

API = "https://commons.wikimedia.org/w/api.php"
# (2) a compliant User-Agent is mandatory, otherwise Wikimedia returns 429
UA = "studio-image-fetcher/1.0 (dsh-studio skill; local contact)"


def _api_get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def _safe(name):
    return re.sub(r"[^\w\-.]", "_", name)[:60]


def fetch(query, out, count, width):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": query, "gsrnamespace": 6, "gsrlimit": count,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": width,
    }
    try:
        data = _api_get(params)
    except Exception as e:
        print(f"[FAIL search] {query}: {e}", file=sys.stderr)
        return []
    pages = (data.get("query", {}) or {}).get("pages", {})
    got = []
    for p in list(pages.values())[:count]:
        ii = (p.get("imageinfo") or [{}])[0]
        thumb = ii.get("thumburl") or ii.get("url")
        if not thumb:
            continue
        meta = ii.get("extmetadata", {}) or {}
        lic = (meta.get("LicenseShortName", {}) or {}).get("value", "?")
        artist = re.sub("<[^>]+>", "", (meta.get("Artist", {}) or {}).get("value", "?")).strip()
        ext = os.path.splitext(thumb)[1].split("?")[0] or ".jpg"
        fn = _safe(query) + "_" + _safe(p.get("title", "img").replace("File:", ""))
        fn = os.path.splitext(fn)[0][:55] + ext
        path = os.path.join(out, fn)
        try:
            req = urllib.request.Request(thumb, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
                f.write(r.read())
            got.append(path)
            print(f"[OK] {path}  | {lic} | {artist} | {ii.get('descriptionurl','')}")
        except Exception as e:
            print(f"[FAIL dl] {thumb}: {e}", file=sys.stderr)
    if not got:
        print(f'[EMPTY] nothing found for "{query}" — change the keywords, or use the Phase 3.5 fallback', file=sys.stderr)
    return got


def main():
    ap = argparse.ArgumentParser(description="Wikimedia Commons real-image fetcher (studio Phase 3.5)")
    ap.add_argument("--query", nargs="+", required=True, help="one or more English keywords (English hits better)")
    ap.add_argument("--out", required=True, help="output directory (project/assets/img suggested)")
    ap.add_argument("--count", type=int, default=2, help="how many images per keyword (default 2)")
    ap.add_argument("--width", type=int, default=1600, help="scale width in px (default 1600)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    allgot = []
    for q in a.query:
        allgot += fetch(q, a.out, a.count, a.width)
    print(f"\n=== downloaded {len(allgot)} images to {a.out} ===")
    print("⚠️ Honesty check: does dropping each image's info lose anything? Does the licence allow this use? Delete the ones that do not fit.")
    if not allgot:
        print("❌ all failed → use the Phase 3.5 three-step image fallback (Unsplash/Pexels → generate → honest placeholder, do not block the flow)", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
