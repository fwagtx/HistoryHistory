"""Host finished media for Metricool on Cloudflare R2 (History Pros bucket only).

Videos and thumbnails are uploaded through the Cloudflare API (api.cloudflare.com); the environment
adds the API token to those requests, so no key is stored here. Metricool downloads each file from
the bucket's public r2.dev link when a post is scheduled and keeps its own copy, and the bucket deletes
anything older than 14 days by itself. (Until Sep 29, 2026 media went on a GitHub branch; GitHub
flagged the account for it, so media never goes on GitHub again.)
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())
R2 = BRAND["media_host"]
assert BRAND["metricool_brand_id"] == "7081960" and R2["bucket"] == "historypros-media", "History Pros only"
API = f"https://api.cloudflare.com/client/v4/accounts/{R2['account_id']}/r2/buckets/{R2['bucket']}/objects"
TYPES = {".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".txt": "text/plain"}


def _curl(*args):
    for attempt in range(4):
        r = subprocess.run(["curl", "-sS", "-m", "600", *args], capture_output=True, text=True)
        if r.returncode == 0:
            return r.stdout
        if attempt == 3:
            raise SystemExit(f"R2 request failed: {r.stderr.strip()}")
        import time
        time.sleep(2 ** (attempt + 1))


def public_url(key):
    return f"{R2['public_url']}/{key}"


def upload(files, folder):
    """Upload files to <folder>/<name>, check each one landed at full size, and return the public base URL."""
    for f in files:
        key = f"{folder}/{f.name}"
        out = json.loads(_curl("-X", "PUT", f"{API}/{key}", "-H", f"Content-Type: {TYPES.get(f.suffix, 'application/octet-stream')}",
                               "--data-binary", f"@{f}"))
        if not out.get("success") or int(out["result"]["size"]) != f.stat().st_size:
            raise SystemExit(f"R2 upload of {key} failed: {out.get('errors')}")
    return f"{R2['public_url']}/{folder}"
