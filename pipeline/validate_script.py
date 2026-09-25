"""Check short and documentary scripts against docs/SCRIPT_SPEC.md.

    python pipeline/validate_script.py episodes/002-pompeii
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES = {"volcano", "bay", "forum", "ruins", "walls", "hagia", "cannon", "warship", "village", "meetinghouse",
          "gallows", "street", "cellar", "trench", "snow", "shipdead", "dock", "storm"}
PLAGUE = {"dead", "arrive", "ship", "dock", "micro", "messina", "spread"}
CAST = set(re.findall(r"^  (\w+): \{ name:", (ROOT / "engine" / "people.js").read_text(), re.M))
EXPR = {"shock", "fear", "grim", "sad", "neutral"}
DOC_KINDS = {"scene", "person", "map", "quote", "stat", "text", "title", "chapter", "end"}


def check_short(p, errs):
    s = json.loads(p.read_text())
    e = lambda m: errs.append(f"{p.name}: {m}")
    for k in ("id", "date", "slot", "title", "sentences", "meta", "caption", "youtube_title", "tags", "sources"):
        if k not in s:
            e(f"missing {k}")
    sents, m = s.get("sentences", []), s.get("meta", {})
    shots, chips = m.get("shots", []), m.get("chips", [])
    words = sum(len(x.split()) for x in sents)
    if not 6 <= len(sents) <= 8:
        e(f"{len(sents)} sentences (want 6-8)")
    if not 55 <= words <= 100:
        e(f"{words} words (want 60-90)")
    if len(shots) != len(sents) or len(chips) != len(sents):
        e(f"shots {len(shots)} / chips {len(chips)} / sentences {len(sents)} must match")
    if shots and shots[-1] != "end":
        e("last shot must be 'end'")
    for i, sh in enumerate(shots):
        k = sh if isinstance(sh, str) else sh.get("s")
        card = k in ("text", "stat", "end")
        if card and i < len(chips) and chips[i] is not None:
            e(f"shot {i}: chip must be null on a {k} card")
        if not card and i < len(chips) and chips[i] and len(chips[i]) > 26:
            e(f"shot {i}: chip over 26 chars")
        if k == "lf" and sh.get("scene") not in SCENES:
            e(f"shot {i}: unknown scene {sh.get('scene')}")
        elif k == "person":
            if sh.get("who") not in CAST:
                e(f"shot {i}: unknown cast {sh.get('who')}")
            if sh.get("bg", "dock") not in SCENES | PLAGUE:
                e(f"shot {i}: unknown bg {sh.get('bg')}")
            if sh.get("expr") and sh["expr"] not in EXPR:
                e(f"shot {i}: unknown expr")
        elif k == "stat" and "stat" not in m:
            e("stat shot without meta.stat")
        elif k not in {"lf", "person", "map", "text", "stat", "end"} | PLAGUE:
            e(f"shot {i}: unknown shot {k}")
    if not sents or not sents[-1].startswith("Follow for more"):
        e("last sentence must be 'Follow for more from ...'")
    if not s.get("caption", "").count("#history"):
        e("caption needs #history")


def check_doc(p, errs):
    d = json.loads(p.read_text())
    e = lambda m: errs.append(f"{p.name}: {m}")
    beats = d.get("beats", [])
    words = sum(len(b.get("say", "").split()) for b in beats)
    if not 1700 <= words <= 2300:
        e(f"{words} narrated words (want 1,900-2,100)")
    if not beats or "show" not in beats[0]:
        e("first beat needs a show")
    kinds = [b["show"]["k"] for b in beats if "show" in b]
    for k in kinds:
        if k not in DOC_KINDS:
            e(f"unknown show kind {k}")
    for b in beats:
        sh = b.get("show", {})
        if sh.get("k") == "scene" and sh.get("scene") not in SCENES | PLAGUE - {"messina", "spread"}:
            e(f"unknown scene {sh.get('scene')}")
        if sh.get("k") == "person" and sh.get("who") not in CAST:
            e(f"unknown cast {sh.get('who')}")
        if sh.get("k") == "person" and sh.get("bg", "dock") not in SCENES:
            e(f"unknown bg {sh.get('bg')}")
    if kinds.count("chapter") != 6:
        e(f"{kinds.count('chapter')} chapters (want 6)")
    if "title" not in kinds or kinds[-1] != "end":
        e("needs a title beat and must finish on end")
    for k, n in (("map", 3), ("quote", 2), ("stat", 2)):
        if kinds.count(k) < n:
            e(f"only {kinds.count(k)} {k} beats (want {n}+)")
    if len({b['show'].get('scene') for b in beats if b.get('show', {}).get('k') == 'scene'}) < 6:
        e("use more different scenes")
    if not d.get("sources"):
        e("missing sources")


def main():
    folder = Path(sys.argv[1])
    errs = []
    for p in sorted((folder / "shorts").glob("*.json")):
        check_short(p, errs)
    if (folder / "documentary.json").exists():
        check_doc(folder / "documentary.json", errs)
    print("\n".join(errs) or "OK")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
