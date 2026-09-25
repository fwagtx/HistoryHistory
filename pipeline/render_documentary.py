"""Narrate and render a weekly documentary (1920x1080) from episodes/<nnn-slug>/documentary.json.

    python pipeline/render_documentary.py episodes/001-black-death/documentary.json

Writes media/<week>/<week>-doc.mp4 (kept under GitHub's 100 MB file limit so it can
be hosted from the repo), a thumbnail PNG, and prints YouTube chapter timestamps.
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
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tts  # noqa: E402
from render_vertical import DRONE, chromium, font_css  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())
ROAD = json.loads((ROOT / "config" / "roadmap_q4.json").read_text())
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
HOLD = {"title": 5.0, "chapter": 3.6}
DPR = 1.5  # 1280x720 design space -> 1920x1080
MAX_MB = 95


def narrate(doc, work):
    """Narrate every beat (cached on the script text and voice)."""
    items = [b["say"] if b.get("say") else HOLD.get(b.get("show", {}).get("k"), 3.0) for b in doc["beats"]]
    key = hashlib.sha1(json.dumps([items, BRAND["voice"]]).encode()).hexdigest()[:12]
    cache = work / "timings.json"
    if cache.exists() and json.loads(cache.read_text()).get("key") == key and (work / "narration.wav").exists():
        return json.loads(cache.read_text())
    print("Narrating…", flush=True)
    raw, timings = tts.synth(tts.load(BRAND["voice"]), items, "long")
    tts.master(raw, work)
    data = {"key": key, "duration": round(len(raw) / tts.SR, 3), "timings": timings}
    cache.write_text(json.dumps(data))
    return data


def timeline(doc, tm):
    """Turn beats into shots. A beat with 'show' starts a new shot just before it is spoken."""
    beats = [{"say": b.get("say", ""), "t0": t0, "t1": t1} for b, (t0, t1) in zip(doc["beats"], tm["timings"])]
    shots = []
    for b, bt in zip(doc["beats"], beats):
        if "show" in b:
            s0 = 0 if not shots else max(shots[-1]["s0"] + .5, bt["t0"] - .25)
            shots.append({"show": b["show"], "s0": round(s0, 3)})
    for i, sh in enumerate(shots):
        sh["s1"] = shots[i + 1]["s0"] if i + 1 < len(shots) else tm["duration"]
    # Background scene for cards: the previous scene, or the next one for title/chapter cards.
    scenes = [sh["show"].get("scene") or sh["show"].get("bg") for sh in shots]
    for i, sh in enumerate(shots):
        after = next((s for s in scenes[i + 1:] if s), None)
        before = next((s for s in reversed(scenes[:i]) if s), None)
        pick = after if sh["show"]["k"] in ("title", "chapter") else before
        sh["bg"] = scenes[i] or pick or after or before or "dock"
    return beats, shots


def page_html(doc, beats, shots, duration):
    week = int(doc["week"])
    nxt = ROAD["weeks"][week] if week < len(ROAD["weeks"]) else None
    chapters = [sh["show"].get("title", "") for sh in shots if sh["show"]["k"] == "chapter"]
    data = {"title": doc["title"], "chapters": chapters, "next": nxt, "shots": shots, "beats": beats, "duration": duration}
    js = "\n".join((ROOT / "engine" / f).read_text() for f in ("shared.js", "longform.js", "people.js", "documentary.js"))
    return (f"<!doctype html><html><head><meta charset='utf-8'>{font_css()}</head><body style='margin:0;background:#000'>"
            f"<canvas id='out' width='{int(1280 * DPR)}' height='{int(720 * DPR)}'></canvas><script>{js}\n"
            f"DPR={DPR};const DOC={json.dumps(data)};const OUT=document.getElementById('out').getContext('2d');</script></body></html>")


def render_chunk(args):
    page_path, start, end, fps, out = args
    enc = subprocess.Popen([FFMPEG, "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg",
                            "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", str(out)],
                           stdin=subprocess.PIPE)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium())
        page = browser.new_page()
        page.goto(Path(page_path).resolve().as_uri())
        page.evaluate("async()=>{await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
        batch = 6
        for i in range(start, end, batch):
            ts = [f / fps for f in range(i, min(end, i + batch))]
            urls = page.evaluate("(ts)=>ts.map(t=>{docRender(OUT,t);return OUT.canvas.toDataURL('image/jpeg',0.93);})", ts)
            for u in urls:
                enc.stdin.write(base64.b64decode(u.split(",", 1)[1]))
        browser.close()
    enc.stdin.close()
    if enc.wait() != 0:
        raise RuntimeError(f"ffmpeg failed on chunk {out}")
    return str(out)


def still(page_path, t, out, fn="docRender(OUT,t)"):
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium())
        page = browser.new_page()
        page.goto(Path(page_path).resolve().as_uri())
        page.evaluate("async()=>{await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
        url = page.evaluate(f"(t)=>{{{fn};return OUT.canvas.toDataURL('image/png');}}", t)
        Path(out).write_bytes(base64.b64decode(url.split(",", 1)[1]))
        browser.close()


def encode(chunks, narration, duration, out, work):
    """Join chunks, mix narration with the drone score, and two-pass encode under MAX_MB."""
    lst = work / "chunks.txt"
    lst.write_text("".join(f"file '{Path(c).resolve()}'\n" for c in chunks))
    joined = work / "video.mp4"
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)], check=True)
    audio = work / "mix.m4a"
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", str(narration), "-f", "lavfi", "-i", DRONE.format(dur=duration),
                    "-filter_complex",
                    "[1:a]lowpass=f=420,volume=0.07,afade=t=in:d=3,"
                    f"afade=t=out:st={max(0, duration - 4):.2f}:d=4[m];"
                    "[0:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]",
                    "-map", "[a]", "-c:a", "aac", "-b:a", "128k", str(audio)], check=True)
    kbps = int(min(4000, MAX_MB * 8e3 / duration - 140))
    common = ["-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-b:v", f"{kbps}k", "-maxrate", f"{kbps * 2}k",
              "-bufsize", f"{kbps * 4}k", "-pix_fmt", "yuv420p", "-g", "60"]
    log = str(work / "x264pass")
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", str(joined), *common, "-pass", "1", "-passlogfile", log, "-an", "-f", "mp4", "/dev/null"], check=True)
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", str(joined), "-i", str(audio), *common, "-pass", "2", "-passlogfile", log,
                    "-map", "0:v", "-map", "1:a", "-c:a", "copy", "-movflags", "+faststart", "-shortest", str(out)], check=True)
    return kbps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=Path)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--seconds", type=float, help="Render only the first N seconds (for testing)")
    ap.add_argument("--stills", action="store_true", help="Only write one still per shot for review")
    a = ap.parse_args()
    doc = json.loads(a.script.read_text())
    week = doc["id"].split("-")[0]
    work = ROOT / "output" / week / "doc"
    work.mkdir(parents=True, exist_ok=True)
    tm = narrate(doc, work)
    beats, shots = timeline(doc, tm)
    duration = tm["duration"] if not a.seconds else min(a.seconds, tm["duration"])
    page = work / "doc.html"
    page.write_text(page_html(doc, beats, shots, tm["duration"]))

    chapters = [(0, "Cold open")] + [(sh["s0"], sh["show"].get("title", "")) for sh in shots if sh["show"]["k"] == "chapter"]
    stamps = "\n".join(f"{int(s // 60)}:{int(s % 60):02d} {name}" for s, name in chapters)
    (work / "chapters.txt").write_text(stamps + "\n")
    print(f"Duration {tm['duration'] / 60:.1f} min, {len(shots)} shots\n{stamps}", flush=True)

    if a.stills:
        sheet = work / "stills"
        sheet.mkdir(exist_ok=True)
        for i, sh in enumerate(shots):
            still(page, min(sh["s1"] - .1, sh["s0"] + max(1.2, (sh["s1"] - sh["s0"]) * .6)), sheet / f"{i:03d}-{sh['show']['k']}.png")
        return

    frames = int(duration * a.fps)
    step = -(-frames // a.jobs)
    jobs = [(str(page), i, min(frames, i + step), a.fps, work / f"chunk{n}.mp4") for n, i in enumerate(range(0, frames, step))]
    t0 = time.time()
    with ProcessPoolExecutor(a.jobs) as ex:
        chunks = list(ex.map(render_chunk, jobs))
    print(f"Rendered {frames} frames in {(time.time() - t0) / 60:.1f} min", flush=True)
    out = ROOT / "media" / week / f"{week}-doc.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    kbps = encode(chunks, work / "narration.wav", duration, out, work)
    thumb = ROOT / "media" / week / f"{week}-doc-thumb.png"
    wk = ROAD["weeks"][int(doc["week"]) - 1]
    still(page, 2.4, thumb, f"DPR=1.5;thumbBait(OUT,{json.dumps(wk)},t)")
    # YouTube thumbnails must be JPG/PNG under 2 MB.
    from PIL import Image
    jpg = thumb.with_suffix(".jpg")
    Image.open(thumb).convert("RGB").save(jpg, quality=90)
    thumb.unlink()
    print(f"{out} · {out.stat().st_size / 1e6:.1f} MB · {kbps} kbps video\n{jpg}", flush=True)


if __name__ == "__main__":
    main()
