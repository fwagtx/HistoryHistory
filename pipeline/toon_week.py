"""Plan, publish and build the Metricool posts for one toon week (docs/AUTOMATION.md).

    python pipeline/toon_week.py plan 2026w41       # dates/slots into every script + episodes/2026w41/week.json
    python pipeline/toon_week.py publish 2026w41    # media_out files → orphan commit on the 'media' branch (force-pushed)
    python pipeline/toon_week.py payloads 2026w41   # Metricool payloads → output/2026w41/payloads.json
    python pipeline/toon_week.py extra 2026w39-x1   # a one-off short outside the weekly grid

Every payload targets the History Pros brand only (blogId 7081960) and switches on each
platform's AI-content label.
"""
import json
import os
import subprocess
import sys
import tempfile
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())
REPO = "fwagtx/HistoryHistory"
MEDIA_BRANCH = "media"
SHORT_SLOTS = BRAND["cadence"]["short_slots"]           # 5 a day
N_SHORTS = 7 * len(SHORT_SLOTS)                         # 35 a week
LONG_DAYS = {"l1": 0, "l2": 2, "l3": 4}          # Mon, Wed, Fri
LONG_SLOTS = {"facebook": "11:00", "youtube": "16:00"}
assert BRAND["metricool_brand_id"] == "7081960", "History Pros only"


def monday(week_id):
    y, w = week_id.split("w")
    return date.fromisocalendar(int(y), int(w), 1)


def scripts(week_id):
    d = ROOT / "episodes" / week_id
    shorts = sorted(d.glob(f"{week_id}-s*.json"))
    longs = sorted(d.glob(f"{week_id}-l*.json"))
    return shorts, longs


def plan(week_id):
    """Shorts s01–s35 fill Mon 09:00 … Sun 21:00 in order, so each topic's shorts sit around its long-form."""
    mon = monday(week_id)
    shorts, longs = scripts(week_id)
    if len(shorts) != N_SHORTS or len(longs) != 3:
        raise SystemExit(f"{week_id}: expected {N_SHORTS} shorts and 3 long-form scripts, found {len(shorts)} and {len(longs)}")
    posts = []
    for i, p in enumerate(shorts):
        s = json.loads(p.read_text())
        s["date"] = (mon + timedelta(days=i // len(SHORT_SLOTS))).isoformat()
        s["slot"] = SHORT_SLOTS[i % len(SHORT_SLOTS)]
        p.write_text(json.dumps(s, indent=1, ensure_ascii=False) + "\n")
        posts.append({"id": s["id"], "kind": "short", "date": s["date"], "slot": s["slot"], "title": s["title"]})
    for p in longs:
        s = json.loads(p.read_text())
        s["date"] = (mon + timedelta(days=LONG_DAYS[s["id"].split("-")[1]])).isoformat()
        p.write_text(json.dumps(s, indent=1, ensure_ascii=False) + "\n")
        for net, slot in LONG_SLOTS.items():
            posts.append({"id": s["id"], "kind": f"long-{net}", "date": s["date"], "slot": slot, "title": s["title"]})
    week = {"week": week_id, "monday": mon.isoformat(), "posts": sorted(posts, key=lambda x: (x["date"], x["slot"]))}
    (ROOT / "episodes" / week_id / "week.json").write_text(json.dumps(week, indent=1, ensure_ascii=False) + "\n")
    print(f"{week_id}: {len(week['posts'])} posts from {mon} to {mon + timedelta(days=6)}")


def git(*args, env=None, **kw):
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True, env=env, **kw).stdout.strip()


def _push_media(files, folder, message):
    """Commit the files under <folder>/ as a fresh orphan commit on the media branch and force-push it."""
    with tempfile.TemporaryDirectory() as tmp:
        env = dict(os.environ, GIT_INDEX_FILE=str(Path(tmp) / "index"))
        for f in files:
            sha = git("hash-object", "-w", str(f))
            git("update-index", "--add", "--cacheinfo", f"100644,{sha},{folder}/{f.name}", env=env)
        tree = git("write-tree", env=env)
    commit = git("commit-tree", tree, "-m", message)
    for attempt in range(4):
        try:
            git("push", "-f", "origin", f"{commit}:refs/heads/{MEDIA_BRANCH}")
            break
        except subprocess.CalledProcessError:
            if attempt == 3:
                raise
            import time
            time.sleep(2 ** (attempt + 1))
    # The media only needs to live on GitHub: drop the local copy so the small session disk doesn't fill up.
    subprocess.run(["git", "update-ref", "-d", f"refs/remotes/origin/{MEDIA_BRANCH}"], cwd=ROOT, capture_output=True)
    subprocess.run(["git", "reflog", "expire", "--expire=now", "--all"], cwd=ROOT, capture_output=True)
    subprocess.run(["git", "prune", "--expire=now"], cwd=ROOT, capture_output=True)
    return commit


def publish(week_id, partial=False):
    """Put this week's finished files in a fresh orphan commit on the media branch and force-push it.
    Earlier weeks drop off the branch, which is fine once Metricool has copied them (it copies at scheduling)."""
    files = sorted((ROOT / "media_out").glob(f"{week_id}-*"))
    need = [f"{week_id}-s{i:02d}.mp4" for i in range(1, N_SHORTS + 1)] + [f"{week_id}-l{i}{x}" for i in (1, 2, 3) for x in (".mp4", "-thumb.jpg", "-chapters.txt")]
    missing = [n for n in need if not (ROOT / "media_out" / n).exists()]
    if missing and not partial:
        raise SystemExit(f"missing finished files: {missing[:6]}{'…' if len(missing) > 6 else ''}")
    if missing:
        print(f"partial publish: {len(missing)} files not rendered yet", file=sys.stderr)
    big = [f.name for f in files if f.stat().st_size > 99 * 1024 * 1024]
    if big:
        raise SystemExit(f"over GitHub's 100 MB limit: {big}")
    commit = _push_media(files, week_id, f"Media for {week_id} (History Pros)")
    (ROOT / "output" / week_id).mkdir(parents=True, exist_ok=True)
    (ROOT / "output" / week_id / "media_sha.txt").write_text(commit + "\n")
    print(commit)
    return commit


def extra(script_id):
    """One-off short outside the weekly grid (e.g. episodes/2026w39/2026w39-x1.json): publish its video and
    write its payload to output/<week>/<id>-payload.json. The media branch then holds only this file."""
    week_id = script_id.split("-")[0]
    s = json.loads((ROOT / "episodes" / week_id / f"{script_id}.json").read_text())
    video = ROOT / "media_out" / f"{script_id}.mp4"
    if not video.exists():
        raise SystemExit(f"missing {video}")
    commit = _push_media([video], week_id, f"Media for {script_id} (History Pros)")
    out = short_payload(s, f"https://raw.githubusercontent.com/{REPO}/{commit}/{week_id}/{video.name}")
    assert out["blogId"] == "7081960"
    dest = ROOT / "output" / week_id / f"{script_id}-payload.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(dest)


def _when(day, slot):
    when = f"{day}T{slot}:00"
    off = datetime.fromisoformat(when).replace(tzinfo=ZoneInfo(BRAND["timezone"])).strftime("%z")
    return when, f"{when}{off[:3]}:{off[3:]}"


def short_payload(s, url):
    when, stamp = _when(s["date"], s["slot"])
    info = {
        "autoPublish": True, "draft": False, "descendants": [], "firstCommentText": "", "hasNotReadNotes": False,
        "media": [url], "mediaAltText": [],
        "providers": [{"network": n} for n in ("instagram", "facebook", "tiktok", "youtube")],
        "publicationDate": {"dateTime": when, "timezone": BRAND["timezone"]},
        "shortener": False, "smartLinkData": {"ids": []}, "text": s["caption"],
        "instagramData": {"type": "REEL", "showReelOnFeed": True, "isAiGenerated": True},
        "facebookData": {"type": "REEL"},
        "tiktokData": {"privacyOption": "PUBLIC_TO_EVERYONE", "title": s["title"][:90], "isAigc": True},
        "youtubeData": {"title": s["youtube_title"][:100], "type": "short", "privacy": "public", "tags": s["tags"],
                        "category": "EDUCATION", "madeForKids": False, "isAiGeneratedContent": False},
    }
    return {"id": s["id"], "kind": "short", "blogId": BRAND["metricool_brand_id"], "date": stamp, "info": info}


def long_payloads(s, base, chapters):
    head, _, tail = s["description"].partition("Chapters are added automatically.")
    desc = head.rstrip() + "\n\nChapters:\n" + chapters.strip() + ("\n\n" + tail.strip() if tail.strip() else "")
    out = []
    for net, slot in LONG_SLOTS.items():
        when, stamp = _when(s["date"], slot)
        info = {
            "autoPublish": True, "draft": False, "descendants": [], "firstCommentText": "", "hasNotReadNotes": False,
            "media": [f"{base}/{s['id']}.mp4"], "mediaAltText": [], "providers": [{"network": net}],
            "publicationDate": {"dateTime": when, "timezone": BRAND["timezone"]},
            "shortener": False, "smartLinkData": {"ids": []}, "text": desc,
        }
        if net == "youtube":
            info["youtubeData"] = {"title": s["youtube_title"][:100], "type": "video", "privacy": "public", "tags": s["tags"],
                                   "category": "EDUCATION", "madeForKids": False, "isAiGeneratedContent": False}
            info["videoThumbnailUrl"] = f"{base}/{s['id']}-thumb.jpg"
        else:
            info["facebookData"] = {"type": "POST", "title": s["title"]}
        out.append({"id": s["id"], "kind": f"long-{net}", "blogId": BRAND["metricool_brand_id"], "date": stamp, "info": info})
    return out


def payloads(week_id, sha=None):
    sha = sha or (ROOT / "output" / week_id / "media_sha.txt").read_text().strip()
    base = f"https://raw.githubusercontent.com/{REPO}/{sha}/{week_id}"
    shorts, longs = scripts(week_id)
    done = lambda name: (ROOT / "media_out" / name).exists()
    out = [short_payload(json.loads(p.read_text()), f"{base}/{p.stem}.mp4") for p in shorts if done(f"{p.stem}.mp4")]
    for p in longs:
        s = json.loads(p.read_text())
        if done(f"{s['id']}.mp4") and done(f"{s['id']}-chapters.txt"):
            out += long_payloads(s, base, (ROOT / "media_out" / f"{s['id']}-chapters.txt").read_text())
    for x in out:
        assert x["blogId"] == "7081960"
    out.sort(key=lambda x: x["date"])
    dest = ROOT / "output" / week_id / "payloads.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(f"{len(out)} payloads → {dest}")


def target(today=None):
    """The week to produce now: the ISO week that starts 7–13 days from today (production runs two weeks ahead)."""
    today = today or date.today()
    mon = today + timedelta(days=(7 - today.weekday()) % 7 or 7) + timedelta(days=7)
    y, w, _ = mon.isocalendar()
    print(f"{y}w{w:02d}")
    return f"{y}w{w:02d}"


def pick_topics(week_id):
    """Take the top 'queued' topic per format from config/topics.json and mark it used for this week."""
    p = ROOT / "config" / "topics.json"
    t = json.loads(p.read_text())
    out = {}
    for fmt in ("monday", "wednesday", "friday"):
        done = [x for x in t[fmt] if x.get("week") == week_id]
        pick = done[0] if done else next((x for x in t[fmt] if x.get("status") == "queued"), None)
        if not pick:
            raise SystemExit(f"no queued {fmt} topics left: add more to config/topics.json (docs/AUTOMATION.md, step 2)")
        pick["status"], pick["week"] = "used", week_id
        out[fmt] = pick
    p.write_text(json.dumps(t, indent=1, ensure_ascii=False) + "\n")
    left = {f: sum(1 for x in t[f] if x.get("status") == "queued") for f in ("monday", "wednesday", "friday")}
    print(json.dumps({"week": week_id, "topics": {k: v["title"] for k, v in out.items()}, "queued_left": left}, indent=1))
    return out


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "target":
        target()
    else:
        args = [sys.argv[2]] + ([True] if cmd == "publish" and "--partial" in sys.argv else [])
        {"plan": plan, "publish": publish, "payloads": payloads, "topics": pick_topics, "extra": extra}[cmd](*args)
