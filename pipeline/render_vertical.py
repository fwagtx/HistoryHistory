"""Render a 1080x1920 vertical short (TikTok, Reels, Shorts) to MP4.

Drives the canvas engine in engine/vertical.html with headless Chromium,
captures every frame and muxes it with the narration and a generated
ambient score.

    python pipeline/render_vertical.py --timings output/001-black-death/timings.json \
        --narration output/001-black-death/narration.wav --voice am_adam --style noir \
        --out output/001-black-death/short.mp4
"""
import argparse
import base64
import glob
import json
import os
import subprocess
from pathlib import Path

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
ENGINE = ROOT / "engine" / "vertical.html"
FONTS = ROOT / "assets" / "fonts"
FAMILIES = {"oswald": "Oswald", "archivo": "Archivo", "lora": "Lora", "cinzel": "Cinzel", "eb": "EB Garamond"}


def font_css():
    """Embed the bundled open-source fonts so rendering never depends on a font CDN."""
    rules = []
    for f in sorted(FONTS.glob("*.woff2")):
        # Files are named like oswald-latin-700-normal.woff2
        parts = f.stem.split("-")
        family, weight, style = FAMILIES[parts[0]], parts[-2], parts[-1]
        data = base64.b64encode(f.read_bytes()).decode()
        rules.append(f'@font-face{{font-family:"{family}";font-weight:{weight};font-style:{style};'
                     f'src:url(data:font/woff2;base64,{data}) format("woff2")}}')
    return "<style>" + "".join(rules) + "</style>"


# A low, slowly breathing drone for the Dark Chronicle look. Generated from
# sine waves, so there is nothing to license.
DRONE = (
    "aevalsrc='0.45*sin(2*PI*55*t)*(0.65+0.35*sin(2*PI*0.07*t))"
    "+0.28*sin(2*PI*82.41*t)*(0.6+0.4*sin(2*PI*0.05*t+1))"
    "+0.16*sin(2*PI*110*t+2*sin(2*PI*0.2*t))"
    "+0.08*sin(2*PI*164.8*t)*(0.5+0.5*sin(2*PI*0.11*t))':s=48000:d={dur}"
)


def chromium():
    found = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))
    return found[-1] if found else None


def render(timings, narration, voice, style, out, fps=30, meta=None):
    data = json.loads(Path(timings).read_text())
    if meta:
        # Per-short title, fact chips, scene order and cards for the engine.
        data["meta"] = meta
    duration = data[voice]["duration"]
    html = ENGINE.read_text().replace("__SDATA__", json.dumps(data)).replace("<body>", font_css() + "<body>", 1)
    page_path = Path(out).with_suffix(".engine.html")
    page_path.write_text(html)

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    frames = int(duration * fps)
    cmd = [
        ffmpeg, "-loglevel", "error", "-y",
        "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
        "-i", str(narration),
        "-f", "lavfi", "-i", DRONE.format(dur=duration),
        "-filter_complex",
        "[2:a]lowpass=f=420,volume=0.09,afade=t=in:d=1.5,"
        f"afade=t=out:st={max(0, duration - 2):.2f}:d=2[m];"
        "[1:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]",
        "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(out),
    ]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium())
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(page_path.resolve().as_uri())
        page.wait_for_timeout(500)
        page.evaluate("async()=>{await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
        page.evaluate(f"()=>{{styleKey={json.dumps(style)};voice={json.dumps(voice)};playing=false;}}")
        for i in range(frames):
            t = i / fps
            url = page.evaluate(
                "(t)=>{renderV(t);return master.toDataURL('image/jpeg',0.92);}", t
            )
            enc.stdin.write(base64.b64decode(url.split(",", 1)[1]))
            if i % (fps * 5) == 0:
                print(f"  {t:5.1f}s / {duration:.1f}s", flush=True)
        browser.close()
    enc.stdin.close()
    if enc.wait() != 0:
        raise SystemExit("ffmpeg failed")
    os.remove(page_path)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--timings", required=True)
    ap.add_argument("--narration", required=True)
    ap.add_argument("--voice", default="am_adam")
    ap.add_argument("--style", default="noir", choices=["archive", "atlas", "noir", "candle", "explainer"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--short", help="Short JSON whose 'meta' drives titles, chips and scenes")
    a = ap.parse_args()
    meta = json.loads(Path(a.short).read_text())["meta"] if a.short else None
    print(render(a.timings, a.narration, a.voice, a.style, a.out, a.fps, meta))


if __name__ == "__main__":
    main()
