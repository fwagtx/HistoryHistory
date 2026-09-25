"""Narrate, render and compress every short in an episode folder.

Finished MP4s land in media/<week>/<id>.mp4, ready to push and schedule.

    python pipeline/produce_shorts.py episodes/001-black-death/shorts --week w1
"""
import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
BRAND = json.loads((ROOT / "config" / "brand.json").read_text())


def produce(short_path, week, force=False):
    short = json.loads(short_path.read_text())
    sid = short["id"]
    final = ROOT / "media" / week / f"{sid}.mp4"
    if final.exists() and not force:
        return f"{sid}: already done"
    work = ROOT / "output" / week / sid
    work.mkdir(parents=True, exist_ok=True)
    voice, style = BRAND["voice"], BRAND["look"]
    py = sys.executable
    subprocess.run([py, str(ROOT / "pipeline" / "tts.py"), str(short_path), "--voice", voice,
                    "--mode", "short", "--out", str(work)], check=True, capture_output=True)
    raw = work / "short.mp4"
    subprocess.run([py, str(ROOT / "pipeline" / "render_vertical.py"), "--timings", str(work / "timings.json"),
                    "--narration", str(work / "narration.wav"), "--voice", voice, "--style", style,
                    "--short", str(short_path), "--out", str(raw)], check=True, capture_output=True)
    final.parent.mkdir(parents=True, exist_ok=True)
    # Social-ready encode: small enough to host, sharp enough for 1080x1920 feeds.
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(raw),
                    "-c:v", "libx264", "-crf", "22", "-preset", "slow", "-maxrate", "6M", "-bufsize", "12M",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(final)],
                   check=True)
    return f"{sid}: {final.stat().st_size / 1e6:.1f} MB"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder", type=Path)
    ap.add_argument("--week", required=True)
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    shorts = sorted(a.folder.glob("*.json"), key=lambda p: int(p.stem.split("s")[-1]))
    with ThreadPoolExecutor(a.jobs) as ex:
        for line in ex.map(lambda p: produce(p, a.week, a.force), shorts):
            print(line, flush=True)


if __name__ == "__main__":
    main()
