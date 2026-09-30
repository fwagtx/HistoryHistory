"""Host finished media for Metricool on Cloudflare R2 (History Pros bucket only).

Uploads use R2's S3 endpoint with the bucket-only key (environment variables R2_ACCESS_KEY_ID and
R2_SECRET_ACCESS_KEY; this key can reach historypros-media and nothing else). If those aren't set, it
falls back to the Cloudflare API (api.cloudflare.com), which needs an account-level R2 token that the
environment adds to those requests. No key is stored in this repo. Metricool downloads each file from
the bucket's public r2.dev link when a post is scheduled and keeps its own copy, and the bucket deletes
anything older than 14 days by itself. (Until Sep 29, 2026 media went on a GitHub branch; GitHub
flagged the account for it, so media never goes on GitHub again.)
"""
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())
R2 = BRAND["media_host"]
assert BRAND["metricool_brand_id"] == "7081960" and R2["bucket"] == "historypros-media", "History Pros only"
API = f"https://api.cloudflare.com/client/v4/accounts/{R2['account_id']}/r2/buckets/{R2['bucket']}/objects"
S3 = f"https://{R2['account_id']}.r2.cloudflarestorage.com/{R2['bucket']}"
TYPES = {".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".txt": "text/plain"}


def _s3_keys():
    k, s = os.environ.get("R2_ACCESS_KEY_ID", "").strip(), os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()
    return (k, s) if k and s else None


def _curl(*args, config=None):
    for attempt in range(4):
        r = subprocess.run(["curl", "-sS", "-m", "600", *(["-K", "-"] if config else []), *args],
                           input=config, capture_output=True, text=True)
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
    keys = _s3_keys()
    for f in files:
        key = f"{folder}/{f.name}"
        ctype = TYPES.get(f.suffix, "application/octet-stream")
        if keys:   # S3 endpoint, signed with the bucket-only key (read from stdin so it never shows in `ps`)
            cfg = f'user = "{keys[0]}:{keys[1]}"\naws-sigv4 = "aws:amz:auto:s3"\n'
            code = _curl("-o", "/dev/null", "-w", "%{http_code}", "-X", "PUT", f"{S3}/{key}", "-H", f"Content-Type: {ctype}",
                         "--data-binary", f"@{f}", config=cfg).strip()
            size = _curl("-o", "/dev/null", "-w", "%{size_download}", f"{S3}/{key}", config=cfg).strip()
            if code != "200" or int(size) != f.stat().st_size:
                raise SystemExit(f"R2 upload of {key} failed (HTTP {code}, {size} of {f.stat().st_size} bytes)")
            continue
        out = json.loads(_curl("-X", "PUT", f"{API}/{key}", "-H", f"Content-Type: {ctype}",
                               "--data-binary", f"@{f}"))
        if not out.get("success") or int(out["result"]["size"]) != f.stat().st_size:
            raise SystemExit(f"R2 upload of {key} failed: {out.get('errors')}")
    return f"{R2['public_url']}/{folder}"
