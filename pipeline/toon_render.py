"""Render a toon-style script (short 9:16 or long-form 16:9) to a finished MP4.

    python pipeline/toon_render.py episodes/005-emu-war/w5-s1.json            # full render
    python pipeline/toon_render.py episodes/005-emu-war/w5-l1.json --stills   # one still per shot for review

    python pipeline/toon_render.py episodes/2026w41/*.json --thumbs       # thumbnails only (no narration or video)

Writes media_out/<id>.mp4 and <id>-thumb.jpg (plus <id>-chapters.txt for long-form).
Long-form thumbnails come from the script's "thumbnail"; shorts get a 1080x1920 cover built from
their hook, first place banner and most dramatic scene (override with a short "thumbnail", see the spec).
media_out/ is not committed: finished files are uploaded to the History Pros R2 bucket (pipeline/r2.py, docs/AUTOMATION.md).
Script format: docs/TOON_SPEC.md.
"""
import argparse
import base64
import hashlib
import json
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import toon_audio  # noqa: E402
import tts  # noqa: E402
from render_vertical import chromium, font_css  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
ENGINE = ["shared.js", "toon/core.js", "toon/wardrobe.js", "toon/scenes.js", "toon/presets.js", "toon/objects.js", "toon/director.js", "toon/thumbs.js"]
OUT = ROOT / "media_out"
MAX_MB = 95
FPS = {"short": 30, "long": 24}
SIZE = {"short": (1080, 1920), "long": (1920, 1080)}


def voice_timeline(script, work):
    """Narrate (cached on text + voices) and return timed beats."""
    voices = tts.assign_voices([k for k in script.get("cast", {})], script.get("voices"))
    items = [{"who": b.get("who", "N"), "say": b.get("say", ""), "hold": b.get("hold")} for b in script["beats"]]
    key = hashlib.sha1(json.dumps([items, voices, tts.NARRATOR, tts.NARRATOR_SPEED]).encode()).hexdigest()[:12]
    cache = work / "timings.json"
    if cache.exists() and (work / "voice.wav").exists():
        data = json.loads(cache.read_text())
        if data.get("key") == key:
            return data
    print(f"  narrating {len(items)} beats…", flush=True)
    data = tts.toon_narrate(items, voices, work)
    data["key"] = key
    cache.write_text(json.dumps(data))
    return data


def build_tv(script, tm):
    beats = tm["beats"]
    shots = []
    for b, bt in zip(script["beats"], beats):
        if "show" in b:
            s0 = 0 if not shots else max(shots[-1]["s0"] + .4, bt["t0"] - .15)
            shots.append({"s0": round(s0, 3), "show": b["show"]})
    if not shots:
        raise SystemExit("script has no 'show' beats")
    for i, sh in enumerate(shots):
        sh["s1"] = shots[i + 1]["s0"] if i + 1 < len(shots) else tm["duration"]
    return {"format": script["format"], "duration": tm["duration"], "hook": script.get("hook", ""), "cast": script.get("cast", {}),
            "beats": beats, "shots": shots, "id": script["id"]}


def page_html(tv, work):
    js = "\n".join((ROOT / "engine" / f).read_text() for f in ENGINE)
    html = (f"<!doctype html><html><head><meta charset='utf-8'>{font_css()}</head><body style='margin:0;background:#000'>"
            f"<script>{js}\nconst TV={json.dumps(tv)};</script></body></html>")
    p = work / "page.html"
    p.write_text(html)
    return p


def _open(p, page_path, w, h):
    b = p.chromium.launch(executable_path=chromium())
    pg = b.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(Path(page_path).resolve().as_uri())
    pg.evaluate("async()=>{await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
    pg.evaluate(f"()=>{{window.CV=document.createElement('canvas');CV.width={w};CV.height={h};window.CX=CV.getContext('2d');}}")
    if errs:
        raise RuntimeError("page error: " + errs[0])
    return b, pg


def render_chunk(args):
    page_path, fmt, i0, i1, out = args
    w, h = SIZE[fmt]; fps = FPS[fmt]
    enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "15", "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg = _open(p, page_path, w, h)
        for i in range(i0, i1, 4):
            ts = [f / fps for f in range(i, min(i1, i + 4))]
            for u in pg.evaluate("(ts)=>ts.map(t=>{tvFrame(CX,t);return CV.toDataURL('image/jpeg',.92)})", ts):
                enc.stdin.write(base64.b64decode(u.split(",", 1)[1]))
        b.close()
    enc.stdin.close()
    if enc.wait() != 0:
        raise RuntimeError(f"ffmpeg failed on {out}")
    return str(out)


def stills(page_path, tv, out_dir, fmt):
    w, h = SIZE[fmt]
    out_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, pg = _open(p, page_path, w, h)
        for i, sh in enumerate(tv["shots"]):
            t = min(sh["s1"] - .05, sh["s0"] + max(1.0, (sh["s1"] - sh["s0"]) * .6))
            u = pg.evaluate("(t)=>{tvFrame(CX,t);const s=document.createElement('canvas');s.width=CV.width/2;s.height=CV.height/2;s.getContext('2d').drawImage(CV,0,0,s.width,s.height);return s.toDataURL('image/jpeg',.85)}", t)
            (out_dir / f"{i:03d}-{sh['show']['k']}.jpg").write_bytes(base64.b64decode(u.split(",", 1)[1]))
        b.close()


DRAMA = ("shock", "shout", "scared", "angry", "smug")


def short_thumb_spec(script):
    """Cover for a short: hook text, where/when tag, and the subject's most dramatic scene (people, background, object).
    The subject is the cast member named in the hook or title; a short's own "thumbnail" overrides any field."""
    shows = [b["show"] for b in script["beats"] if b.get("show")]
    scenes = [sh for sh in shows if sh["k"] == "scene"]
    named = f"{script.get('hook', '')} {script.get('title', '')} {script.get('youtube_title', '')}".lower()
    cast_def = script.get("cast", {})
    subject = lambda i: i.lower() in named or any(w in named for w in str((cast_def.get(i) or {}).get("name", "")).lower().split() if len(w) > 3)
    def score(sh):
        ids = [m["id"] for m in sh.get("cast", [])]
        return (any(subject(i) for i in ids), any(m.get("mood") in DRAMA for m in sh.get("cast", [])), len(ids) > 0)
    pick = max(scenes, key=score, default={})    # first scene wins ties
    cast = sorted(pick.get("cast", []), key=lambda m: (not subject(m["id"]), m["id"] != pick.get("focus"), m.get("mood") not in DRAMA))
    faces = []
    for m in cast[:2]:
        f = {k: m[k] for k in ("id", "mood", "hold") if m.get(k)}
        if f.get("mood") in (None, "neutral", "smug", "sad", "angry"):   # half-closed or flat faces read as bored in a feed
            f["mood"] = {"smug": "happy", "angry": "shout"}.get(f.get("mood"), "shock")
        faces.append(f)
    objs = [o for sh in [pick] + scenes for o in sh.get("objects", [])]
    topic = script.get("topic")
    if not topic:   # fall back to the subject's name, trimmed: "King Edward III of England" -> "King Edward III"
        who = next((m["id"] for m in cast if subject(m["id"])), None) or next((m["id"] for m in cast if (cast_def.get(m["id"]) or {}).get("name")), None)
        name = str((cast_def.get(who) or {}).get("name") or "").split(",")[0].split(" (")[0]
        topic = name.split(" of ")[0] if len(name) > 22 else name
    spec = {"text": script["hook"], "topic": topic, "sub": next((sh["place"] for sh in shows if sh.get("place")), ""),
            "bg": pick.get("bg") or "field", "faces": faces,
            "object": {k: v for k, v in objs[0].items() if k in ("k", "flag", "load")} if objs else None}
    spec.update(script.get("thumbnail") or {})
    return spec


def thumbnail(page_path, spec, out, fmt="long"):
    with sync_playwright() as p:
        b, pg = _open(p, page_path, 1920, 1080)
        u = pg.evaluate("(o)=>renderShortThumb(o)" if fmt == "short" else "(o)=>renderThumb(o)", spec)
        Path(out).write_bytes(base64.b64decode(u.split(",", 1)[1]))
        b.close()


def render_thumb(script_path):
    """Thumbnail only: needs the cast, not the narration."""
    script = json.loads(Path(script_path).read_text())
    work = ROOT / "output" / "toon" / script["id"]
    work.mkdir(parents=True, exist_ok=True)
    tv = {"format": script["format"], "duration": 1, "hook": script.get("hook", ""), "cast": script.get("cast", {}),
          "beats": [], "shots": [], "id": script["id"]}
    page = page_html(tv, work)
    OUT.mkdir(exist_ok=True)
    out = OUT / f"{script['id']}-thumb.jpg"
    if script["format"] == "short":
        thumbnail(page, short_thumb_spec(script), out, "short")
        video = OUT / f"{script['id']}.mp4"
        if video.exists():   # a redrawn cover replaces the one baked into the video's first frames
            rebake_cover(video, out, work)
    elif script.get("thumbnail"):
        thumbnail(page, script["thumbnail"], out)
    print(f"  thumbnail → {out}")
    return out


def rebake_cover(video, cover, work):
    """Swap the cover in a finished short's first frames (re-encodes the picture, copies the sound)."""
    tmp = work / "rebake.mp4"
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(video), "-i", str(cover), "-filter_complex",
                    f"[1:v]scale={SIZE['short'][0]}:{SIZE['short'][1]},setsar=1[cv];[0:v][cv]overlay=0:0:enable='lt(t,{COVER_SECONDS})'[v]",
                    "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-tune", "animation", "-crf", "21",
                    "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(video)


def mix_audio(script, tv, work):
    dur = tv["duration"]
    style = script.get("music", "playful")
    bed = toon_audio.music(dur, script["id"], style)
    pops = [sh["s0"] + (s.get("at", .3)) for sh in tv["shots"] for s in sh["show"].get("stickers", [])]
    pops += [sh["s0"] + .1 for sh in tv["shots"] if sh["show"]["k"] in ("card", "chapter", "list")]
    wh = [sh["s0"] for sh in tv["shots"][1:]] if script["format"] == "short" else [sh["s0"] for sh in tv["shots"] if sh["show"]["k"] in ("chapter", "list")]
    fx = toon_audio.sfx_track(dur, pops, wh)
    voice, sr = sf.read(work / "voice.wav")
    if voice.ndim > 1:
        voice = voice.mean(1)
    n = max(len(voice), len(bed))
    v = np.pad(voice, (0, n - len(voice)))
    gain = .16 if script["format"] == "short" else .10
    m = np.pad(bed, (0, n - len(bed))) * gain + np.pad(fx, (0, n - len(fx))) * .5
    out = v + m
    out /= max(1.0, np.max(np.abs(out)) / .95)
    sf.write(work / "mix.wav", out.astype(np.float32), toon_audio.SR)
    return work / "mix.wav"


COVER_SECONDS = 0.1   # the short's cover fills its first 3 frames: TikTok (personal accounts ignore custom covers) shows frame 0


def encode(chunks, audio, fmt, duration, out, work, cover=None):
    lst = work / "chunks.txt"
    lst.write_text("".join(f"file '{Path(c).resolve()}'\n" for c in chunks))
    joined = work / "video.mp4"
    subprocess.run([FF, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
    if fmt == "short":
        v = ["-c:v", "libx264", "-preset", "medium", "-tune", "animation", "-crf", "21", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p"]
        inputs, maps = ["-i", str(joined), "-i", str(audio)], []
        if cover:
            inputs += ["-i", str(cover)]
            maps = ["-filter_complex", f"[2:v]scale={SIZE['short'][0]}:{SIZE['short'][1]},setsar=1[cv];"
                    f"[0:v][cv]overlay=0:0:enable='lt(t,{COVER_SECONDS})'[v]", "-map", "[v]", "-map", "1:a"]
        subprocess.run([FF, "-loglevel", "error", "-y", *inputs, *maps, *v, "-c:a", "aac", "-b:a", "160k",
                        "-movflags", "+faststart", "-shortest", str(out)], check=True)
        return
    kbps = int(min(3500, MAX_MB * 8e3 / duration - 170))
    common = ["-c:v", "libx264", "-preset", "medium", "-tune", "animation", "-b:v", f"{kbps}k", "-maxrate", f"{kbps * 2}k",
              "-bufsize", f"{kbps * 4}k", "-pix_fmt", "yuv420p", "-g", "48"]
    log = str(work / "x264pass")
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(joined), *common, "-pass", "1", "-passlogfile", log, "-an", "-f", "mp4", "/dev/null"], check=True)
    subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(joined), "-i", str(audio), *common, "-pass", "2", "-passlogfile", log,
                    "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(out)], check=True)


def write_chapters(script, tv):
    """YouTube chapters from chapter cards ("1347 The Ships of Death") and list cards ("#7 The Kettle War")."""
    def name(show):
        if show["k"] == "list":
            return f"#{show.get('n', '')} {show.get('title', '')}"
        return (f"{show.get('year', '')} " if show.get("year") else "") + show.get("title", "")
    chapters = [(0.0, "Intro")] + [(sh["s0"], name(sh["show"])) for sh in tv["shots"] if sh["show"]["k"] in ("chapter", "list")]
    (OUT / f"{script['id']}-chapters.txt").write_text("\n".join(f"{int(s // 60)}:{int(s % 60):02d} {n.strip()}" for s, n in chapters) + "\n")


def render(script_path, jobs=4, only_stills=False, seconds=None):
    script = json.loads(Path(script_path).read_text())
    fmt = script["format"]
    work = ROOT / "output" / "toon" / script["id"]
    work.mkdir(parents=True, exist_ok=True)
    tm = voice_timeline(script, work)
    tv = build_tv(script, tm)
    page = page_html(tv, work)
    if only_stills:
        stills(page, tv, work / "stills", fmt)
        print(f"  stills → {work / 'stills'}")
        return work / "stills"
    duration = min(seconds, tv["duration"]) if seconds else tv["duration"]
    frames = int(duration * FPS[fmt])
    step = -(-frames // jobs)
    t0 = time.time()
    args = [(str(page), fmt, i, min(frames, i + step), work / f"chunk{n}.mp4") for n, i in enumerate(range(0, frames, step))]
    with ProcessPoolExecutor(jobs) as ex:
        chunks = list(ex.map(render_chunk, args))
    audio = mix_audio(script, tv, work)
    OUT.mkdir(exist_ok=True)
    final = work / "final.mp4"
    cover = None
    if fmt == "short":   # the cover is drawn first so it can open the video too
        cover = OUT / f"{script['id']}-thumb.jpg"
        thumbnail(page, short_thumb_spec(script), cover, "short")
    encode(chunks, audio, fmt, duration, final, work, cover)
    dest = OUT / f"{script['id']}.mp4"
    final.replace(dest)
    if fmt == "long":
        if script.get("thumbnail"):
            thumbnail(page, script["thumbnail"], OUT / f"{script['id']}-thumb.jpg")
        write_chapters(script, tv)
    for c in chunks:
        Path(c).unlink(missing_ok=True)
    for tmp in ("video.mp4", "mix.wav", "chunks.txt"):      # the disk is small: keep only the narration cache
        (work / tmp).unlink(missing_ok=True)
    for tmp in work.glob("x264pass*"):
        tmp.unlink()
    print(f"  {dest.name}: {duration:.1f}s, {dest.stat().st_size / 1e6:.1f} MB, {(time.time() - t0) / 60:.1f} min", flush=True)
    return dest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scripts", nargs="+", type=Path)
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--seconds", type=float)
    ap.add_argument("--thumbs", action="store_true", help="thumbnails only")
    a = ap.parse_args()
    for s in a.scripts:
        print(s, flush=True)
        if a.thumbs:
            render_thumb(s)
        else:
            render(s, a.jobs, a.stills, a.seconds)


if __name__ == "__main__":
    main()
