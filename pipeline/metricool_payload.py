"""Print the Metricool post payload for a rendered short.

Used when scheduling each short. Every payload targets the History Pros
brand from config/brand.json and switches on each platform's AI label.

    python pipeline/metricool_payload.py episodes/001-black-death/shorts/w1-s2.json <commit-sha>
"""
import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())
REPO = "fwagtx/HistoryHistory"


def payload(short_path, sha):
    s = json.loads(Path(short_path).read_text())
    week = s["id"].split("-")[0]
    url = f"https://raw.githubusercontent.com/{REPO}/{sha}/media/{week}/{s['id']}.mp4"
    when = f"{s['date']}T{s['slot']}:00"
    info = {
        "autoPublish": True, "draft": False, "descendants": [], "firstCommentText": "", "hasNotReadNotes": False,
        "media": [url], "mediaAltText": [],
        "providers": [{"network": n} for n in ("instagram", "facebook", "tiktok", "youtube")],
        "publicationDate": {"dateTime": when, "timezone": BRAND["timezone"]},
        "shortener": False, "smartLinkData": {"ids": []}, "text": s["caption"],
        "instagramData": {"type": "REEL", "showReelOnFeed": True, "isAiGenerated": True},
        "facebookData": {"type": "REEL"},
        "tiktokData": {"privacyOption": "PUBLIC_TO_EVERYONE", "title": s["title"], "isAigc": True},
        "youtubeData": {"title": s["youtube_title"], "type": "short", "privacy": "public", "tags": s["tags"],
                        "category": "EDUCATION", "madeForKids": False, "isAiGeneratedContent": True},
    }
    # Offset from the brand timezone, so daylight saving (ends Nov 1) is handled.
    offset = datetime.fromisoformat(when).replace(tzinfo=ZoneInfo(BRAND["timezone"])).strftime("%z")
    return {"blogId": BRAND["metricool_brand_id"], "date": f"{when}{offset[:3]}:{offset[3:]}", "info": info}


if __name__ == "__main__":
    print(json.dumps(payload(sys.argv[1], sys.argv[2]), ensure_ascii=False))
