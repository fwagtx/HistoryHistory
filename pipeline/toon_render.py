"""Render a toon-style script (short 9:16 or long-form 16:9) to a finished MP4.

    python pipeline/toon_render.py episodes/005-emu-war/w5-s1.json            # full render
    python pipeline/toon_render.py episodes/005-emu-war/w5-l1.json --stills   # one still per shot for review

Writes media_out/<id>.mp4 (and <id>-thumb.jpg plus <id>-chapters.txt for long-form).
media_out/ is not committed: finished files are published on the 'media' branch (see docs/AUTOMATION.md).
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


def thumbnail(page_path, spec, out):
    with sync_playwright() as p:
        b, pg = _open(p, page_path, 1920, 1080)
        u = pg.evaluate("(o)=>renderThumb(o)", spec)
        Path(out).write_bytes(base64.b64decode(u.split(",", 1)[1]))
        b.close()


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


def encode(chunks, audio, fmt, duration, out, work):
    lst = work / "chunks.txt"
    lst.write_text("".join(f"file '{Path(c).resolve()}'\n" for c in chunks))
    joined = work / "video.mp4"
    subprocess.run([FF, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
    if fmt == "short":
        v = ["-c:v", "libx264", "-preset", "medium", "-tune", "animation", "-crf", "21", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p"]
        subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(joined), "-i", str(audio), *v, "-c:a", "aac", "-b:a", "160k",
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
    encode(chunks, audio, fmt, duration, final, work)
    dest = OUT / f"{script['id']}.mp4"
    final.replace(dest)
    if fmt == "long":
        if script.get("thumbnail"):
            thumbnail(page, script["thumbnail"], OUT / f"{script['id']}-thumb.jpg")
        write_chapters(script, tv)
    for c in chunks:
        Path(c).unlink(missing_ok=True)
    print(f"  {dest.name}: {duration:.1f}s, {dest.stat().st_size / 1e6:.1f} MB, {(time.time() - t0) / 60:.1f} min", flush=True)
    return dest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scripts", nargs="+", type=Path)
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--seconds", type=float)
    a = ap.parse_args()
    for s in a.scripts:
        print(s, flush=True)
        render(s, a.jobs, a.stills, a.seconds)


if __name__ == "__main__":
    main()
