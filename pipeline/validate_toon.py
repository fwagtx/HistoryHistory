"""Check toon scripts before rendering (docs/TOON_SPEC.md).

    python pipeline/validate_toon.py episodes/2026w41/*.json

Checks fields, the engine vocabulary (read straight from engine/toon/*.js so it never
goes stale), word counts, variety rules, and renders one test frame of every shot
(plus the thumbnail) in a headless browser to catch errors before a long render.
Exits 1 if any script has errors.
"""
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_vertical import chromium, font_css  # noqa: E402
from tts import phrases  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
E = ROOT / "engine" / "toon"
ENGINE = ["shared.js", "toon/core.js", "toon/wardrobe.js", "toon/scenes.js", "toon/presets.js", "toon/objects.js", "toon/director.js", "toon/thumbs.js"]
KINDS = {"scene", "map", "title", "chapter", "card", "quote", "list", "compare", "end", "flag"}
MOODS = {"neutral", "happy", "shock", "angry", "scared", "smug", "sad", "shout", "talk"}
ANIMALS = {"emu", "pig", "horse", "rat", "elephant"}
EMBLEMS = {"star", "whitestar", "redstar", "cross", "roundel", "sun"}
MUSIC = {"playful", "tense", "warm"}


def vocab():
    core, wd, sc, pr, di, ob = (open(E / f).read() for f in ("core.js", "wardrobe.js", "scenes.js", "presets.js", "director.js", "objects.js"))
    cases = lambda text, a, b: set(re.findall(r"case '(\w+)':", text[text.index(a):text.index(b)]))
    return {
        "scenes": set(re.findall(r"^  (\w+)\(c(?:, t)?\) \{", core[core.index("const SCN"):], re.M)) | set(re.findall(r"^  (\w+)\(c, t\) \{", sc, re.M)),
        "hats": cases(core, "function hat(", "/* ---------- outfits") | cases(wd, "hat = function", "const _outfit0") | {"hood", "coif"},
        "outfits": cases(core, "function outfit(", "/* ---------- props") | cases(wd, "outfit = function", "/* ---------- more animals"),
        "props": cases(core, "function prop(", "/* ---------- animals") | cases(wd, "prop = function", "default: c.restore()") | {None},
        "presets": set(re.findall(r"^  (\w+): \{", pr, re.M)),
        "poses": cases(di, "function poseArms", "/* Place and draw") | {None, "stand"},
        "fx": set(re.findall(r"f === '(\w+)'", di)),
        "objects": set(re.findall(r"^  (\w+)\(c, o, t\) \{", ob, re.M)),
        "flags": set(re.findall(r"^  (\w+)\(c, w, h\) \{", ob, re.M)),
    }

MODERN_BG = {"city", "street", "factory"}          # 1800s+ looks: brick blocks, street lamps, smokestacks


def year_of(text):
    """The year a place banner or chapter card talks about ("Rome · 64 AD" → 64, "221 BC" → -221), or None."""
    m = re.search(r"(\d{1,4})\s*(?:s\b)?\s*(BC|BCE|AD|CE)?", str(text or ""))
    if not m:
        return None
    y = int(m.group(1))
    return -y if (m.group(2) or "").startswith("B") else y


def check(path, V):
    errs, warn = [], []
    try:
        s = json.loads(Path(path).read_text())
    except Exception as e:  # noqa: BLE001
        return [f"not valid JSON: {e}"], [], None
    fmt = s.get("format")
    req = ["id", "format", "title", "cast", "beats", "youtube_title", "tags", "sources", "date"]
    req += ["hook", "caption", "slot"] if fmt == "short" else ["description", "thumbnail"]
    errs += [f"missing field '{k}'" for k in req if k not in s]
    if fmt not in ("short", "long"):
        errs.append("format must be 'short' or 'long'")
        return errs, warn, s
    if s.get("music", "playful") not in MUSIC:
        errs.append(f"music must be one of {sorted(MUSIC)}")
    cast = s.get("cast", {})
    for cid, c in cast.items():
        if c.get("preset") and c["preset"] not in V["presets"]:
            errs.append(f"cast '{cid}': unknown preset '{c['preset']}'")
        if c.get("hat") and c["hat"] not in V["hats"]:
            errs.append(f"cast '{cid}': unknown hat '{c['hat']}'")
        if c.get("outfit") and c["outfit"] not in V["outfits"]:
            errs.append(f"cast '{cid}': unknown outfit '{c['outfit']}'")
        if c.get("hold") not in V["props"]:
            errs.append(f"cast '{cid}': unknown prop '{c.get('hold')}'")
        if c.get("animal") and c["animal"] not in ANIMALS:
            errs.append(f"cast '{cid}': unknown animal '{c['animal']}'")
        if c.get("mood") and c["mood"] not in MOODS:
            errs.append(f"cast '{cid}': unknown mood '{c['mood']}'")
    known = set(cast) | V["presets"] | ANIMALS
    beats = s.get("beats", [])
    if not beats or "show" not in beats[0]:
        errs.append("the first beat needs a 'show'")
    words, kinds, scenes, dialogue = 0, [], set(), 0
    vis, places, era = [], 0, None
    for i, b in enumerate(beats):
        who = b.get("who", "N")
        if who != "N" and who not in cast:
            errs.append(f"beat {i}: speaker '{who}' is not in cast")
        if who != "N" and b.get("say"):
            dialogue += 1
        if not b.get("say") and "hold" not in b:
            errs.append(f"beat {i}: needs 'say' or 'hold'")
        words += len(b.get("say", "").split())
        if b.get("say") and not phrases(b["say"]):
            errs.append(f"beat {i}: nothing speakable in 'say'")
        sh = b.get("show")
        if not sh:
            continue
        k = sh.get("k")
        kinds.append(k)
        vis.append(sh.get("bg") if k == "scene" else k)
        places += bool(sh.get("place"))
        for src in (sh.get("place"), sh.get("year") if k == "chapter" else None, sh.get("date") if k == "map" else None):
            y = year_of(src)
            if y is not None:
                era = y
        if k == "scene" and sh.get("bg") in MODERN_BG and era is not None and era < 1800:
            errs.append(f"beat {i}: '{sh['bg']}' is a modern background but the story is in {abs(era)}{' BC' if era < 0 else ''}; use an era-appropriate scene (rome, greek, egypt, town, village, market, castle, palace, japan…)")
        if k not in KINDS:
            errs.append(f"beat {i}: unknown shot kind '{k}'")
            continue
        for bgk in ("bg",):
            if sh.get(bgk) and sh[bgk] not in V["scenes"]:
                errs.append(f"beat {i}: unknown scene '{sh[bgk]}'")
        if k == "scene":
            if not sh.get("bg"):
                errs.append(f"beat {i}: scene needs 'bg'")
            scenes.add(sh.get("bg"))
        if k == "chapter" and sh.get("bg") and sh["bg"] not in V["scenes"]:
            errs.append(f"beat {i}: unknown chapter scene '{sh['bg']}'")
        if k == "map" and ("lon" not in sh or "lat" not in sh):
            errs.append(f"beat {i}: map needs lon and lat")
        if k == "map" and not (-14 <= sh.get("lon", 0) <= 70 and 10 <= sh.get("lat", 45) <= 71):
            errs.append(f"beat {i}: map centre is outside the map data (lon -14..70, lat 10..71)")
        for ob in sh.get("objects", []):
            if ob.get("k") not in V["objects"]:
                errs.append(f"beat {i}: unknown object '{ob.get('k')}'")
            for fk in ("flag", "emblem"):
                if ob.get(fk) and ob[fk] not in V["flags"] and not (fk == "emblem" and ob[fk] in EMBLEMS):
                    errs.append(f"beat {i}: unknown {fk} '{ob[fk]}'")
        flags_used = [sh.get("flag")] + [ob.get("flag") for ob in sh.get("objects", [])] + [ob.get("emblem") for ob in sh.get("objects", [])] + [e.get("flag") for e in sh.get("cast", [])]
        if k == "flag" and sh.get("flag") not in V["flags"]:
            errs.append(f"beat {i}: flag shot needs a known 'flag'")
        for e in sh.get("cast", []):
            if e.get("flag") and e["flag"] not in V["flags"]:
                errs.append(f"beat {i}: unknown flag '{e['flag']}'")
        if "nazi" in flags_used:
            if fmt == "short":
                errs.append(f"beat {i}: the Nazi flag can't go in a short: TikTok and Instagram remove hate symbols even in history videos (long-form YouTube only)")
            else:
                warn.append(f"beat {i}: Nazi flag shown; fine for YouTube in an educational context, but keep it brief and factual")
        if len(sh.get("stickers", [])) > 3:
            errs.append(f"beat {i}: more than 3 stickers")
        if sh.get("fx"):
            errs += [f"beat {i}: unknown fx '{f}'" for f in sh["fx"] if f not in V["fx"]]
        entries = list(sh.get("cast", [])) + [e for side in ("left", "right") for e in (sh.get(side) or {}).get("cast", [])]
        for e in entries:
            if e.get("id") not in known:
                errs.append(f"beat {i}: cast id '{e.get('id')}' is not defined")
            if e.get("pose") not in V["poses"]:
                errs.append(f"beat {i}: unknown pose '{e.get('pose')}'")
            if e.get("hold") not in V["props"]:
                errs.append(f"beat {i}: unknown prop '{e.get('hold')}'")
            if e.get("mood") and e["mood"] not in MOODS:
                errs.append(f"beat {i}: unknown mood '{e['mood']}'")
            if fmt == "short" and e.get("x") is not None and not (.05 <= e["x"] <= .9) and not e.get("walk"):
                warn.append(f"beat {i}: x={e['x']} is near the edge of a short (keep 0.12–0.82)")
    run, longest, prev = 0, 0, None
    for v in vis:
        run = run + 1 if v == prev and v not in ("map", "card", "chapter", "list", "quote", "title", "end") else 1
        longest, prev = max(longest, run), v
    if longest > (2 if fmt == "short" else 3):
        errs.append(f"the same background is used for {longest} shots in a row; change the picture when the story moves (docs/TOON_SPEC.md, Make it simple)")
    if fmt == "short":
        if len(set(v for v in vis if v != "end")) < 3:
            errs.append("a short needs at least 3 different backgrounds, maps or cards")
        if not places:
            errs.append("no 'place' banner: say where and when on the first shot of each new place")
        if not 75 <= words <= 115:
            errs.append(f"{words} words; a short needs 75–115")
        if kinds and kinds[-1] != "end":
            errs.append("the last shot of a short must be 'end'")
        if len(scenes) < 2:
            warn.append("use at least two different scenes")
    else:
        if places < 6:
            warn.append(f"only {places} 'place' banners; add one at each new place or year")
        if not 1300 <= words <= 1600:
            errs.append(f"{words} words; long-form needs 1,300–1,600 (about 10 minutes)")
        ch = kinds.count("chapter") + kinds.count("list")
        if not 4 <= ch <= 9:
            errs.append(f"{ch} chapter/list cards; use 5–8")
        for k, n in (("map", 4), ("card", 2), ("quote", 1), ("title", 1), ("end", 1)):
            if kinds.count(k) < n:
                (errs if k in ("title", "end") else warn).append(f"only {kinds.count(k)} '{k}' shots (want {n}+)")
        if len(scenes) < 10:
            warn.append(f"only {len(scenes)} different scenes (want 12+)")
        if dialogue < 4:
            warn.append(f"only {dialogue} dialogue lines (want 2+ skits)")
        t = s.get("thumbnail", {})
        if t.get("style") not in ("split", "faces", "redbox"):
            errs.append("thumbnail.style must be split, faces or redbox")
    if not s.get("sources"):
        errs.append("no sources listed")
    return errs, warn, s


def dry_run(scripts):
    """Render one frame per shot and each thumbnail with fake timings; returns {id: [errors]}."""
    js = "\n".join((ROOT / "engine" / f).read_text() for f in ENGINE)
    page = ROOT / "output" / "validate.html"
    page.parent.mkdir(exist_ok=True)
    page.write_text(f"<!doctype html><html><head><meta charset='utf-8'>{font_css()}</head><body><script>{js}\nvar TV;</script></body></html>")
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=chromium())
        pg = b.new_page()
        load_errs = []
        pg.on("pageerror", lambda e: load_errs.append(str(e)))
        pg.goto(page.resolve().as_uri())
        if load_errs:
            raise SystemExit("engine failed to load: " + load_errs[0])
        V = vocab()
        smoke = pg.evaluate("""(v)=>{window.TV={format:'long',cast:{},beats:[],shots:[]};const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const c=cv.getContext('2d');const bad=[];
          const tryit=(label,fn)=>{try{fn()}catch(e){bad.push(label+': '+e.message)}};
          Object.keys(SCN).forEach(s=>tryit('scene '+s,()=>{frameStart(1);SCN[s](c,1)}));
          v.hats.forEach(h=>tryit('hat '+h,()=>guy(c,500,400,1,{hat:h},1)));
          v.outfits.forEach(o=>tryit('outfit '+o,()=>guy(c,500,400,1,{outfit:o},1)));
          v.props.filter(Boolean).forEach(p=>tryit('prop '+p,()=>guy(c,500,400,1,{hold:p},1)));
          Object.keys(PRESET).forEach(k=>tryit('preset '+k,()=>guy(c,500,400,1,PRESET[k],1)));
          Object.keys(ANIMALS).forEach(a=>tryit('animal '+a,()=>ANIMALS[a](c,500,400,1,{run:true},1)));
          Object.keys(OBJECTS).forEach(k=>tryit('object '+k,()=>{c.save();c.translate(900,900);c.scale(.4,.4);OBJECTS[k](c,{moving:true,flag:'uk',emblem:'star',fire:true,launch:true,label:'x',text:'SIGN'},1);c.restore()}));
          Object.keys(FLAGS).forEach(k=>tryit('flag '+k,()=>drawFlag(c,k,100,100,300,200,1)));
          return bad;}""", {k: sorted(x for x in v if x) for k, v in V.items()})
        if smoke:
            raise SystemExit("engine problems:\n  " + "\n  ".join(smoke))
        for s in scripts:
            t, beats, shots = .3, [], []
            for bt in s["beats"]:
                d = 2.5 if not bt.get("say") else max(1.2, len(bt["say"].split()) * .38)
                words = [{"w": w, "s": t, "e": t + .3} for w in bt.get("say", "").split()]
                beats.append({"who": bt.get("who", "N"), "say": bt.get("say", ""), "t0": t, "t1": t + d, "words": words})
                if "show" in bt:
                    shots.append({"s0": t, "show": bt["show"]})
                t += d + .3
            for i, sh in enumerate(shots):
                sh["s1"] = shots[i + 1]["s0"] if i + 1 < len(shots) else t
            tv = {"format": s["format"], "duration": t, "hook": s.get("hook", ""), "cast": s.get("cast", {}), "beats": beats, "shots": shots}
            w, h = (1920, 1080) if s["format"] == "long" else (1080, 1920)
            errs = pg.evaluate("""([tv,w,h,thumb])=>{window.TV=tv;const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');const errs=[];
              tv.shots.forEach((sh,i)=>{for(const f of [.2,.7]){try{tvFrame(c,sh.s0+(sh.s1-sh.s0)*f)}catch(e){errs.push('shot '+i+' ('+sh.show.k+'): '+e.message);break;}}});
              if(thumb){try{renderThumb(thumb)}catch(e){errs.push('thumbnail: '+e.message)}}return errs;}""", [tv, w, h, s.get("thumbnail") if s["format"] == "long" else None])
            out[s["id"]] = errs
        b.close()
    return out


def main():
    V = vocab()
    paths = [Path(p) for p in sys.argv[1:] if not p.endswith("week.json")]
    bad, ok = 0, []
    for p in paths:
        errs, warn, s = check(p, V)
        for w in warn:
            print(f"  warn {p.name}: {w}")
        if errs:
            bad += 1
            for e in errs:
                print(f"  FAIL {p.name}: {e}")
        elif s:
            ok.append(s)
    if ok:
        for sid, errs in dry_run(ok).items():
            if errs:
                bad += 1
                for e in errs:
                    print(f"  FAIL {sid}: {e}")
    print(f"{len(paths) - bad}/{len(paths)} scripts OK")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
