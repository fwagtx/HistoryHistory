"""Narrate a script with the free, offline Kokoro voice model.

Writes a mastered narration WAV plus sentence timings that the render engine
uses to sync scenes and captions.

    python pipeline/tts.py episodes/001-black-death/short_script.json \
        --voice am_adam --mode short --out output/001-black-death
"""
import argparse
import json
import subprocess
import urllib.request
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "assets" / "models"
MODEL_URLS = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}
SR = 24000

# Custom voices are weighted blends of Kokoro's built-in voices.
BLENDS = {
    "mix_scholar": {"bm_george": 0.6, "bm_lewis": 0.4},
    "mix_storyteller": {"am_onyx": 0.5, "am_fenrir": 0.5},
}

# Pacing: shorts are brisk, documentaries are measured. Short, dramatic
# sentences are read a little slower and followed by a longer pause.
PACING = {
    "short": {"lead": 0.4, "speed": 0.995, "gap": 0.3, "dramatic_gap": 0.5},
    "long": {"lead": 2.4, "speed": 0.93, "gap": 0.5, "dramatic_gap": 0.8},
}

# Warmth EQ, gentle compression, a faint room and room tone, then loudness
# normalised to -16 LUFS so every episode sounds the same.
MASTER_FILTER = (
    "[0:a]highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=6800:t=q:w=2:g=-2.5,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90:makeup=2,"
    "aecho=0.9:0.9:22|37:0.06|0.04[v];"
    "[v][1:a]amix=inputs=2:duration=first:weights=1 1:normalize=0,"
    "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000"
)


def ensure_models():
    MODELS.mkdir(parents=True, exist_ok=True)
    for name, url in MODEL_URLS.items():
        path = MODELS / name
        if not path.exists():
            print(f"Downloading {name}…")
            urllib.request.urlretrieve(url, path)


def load_voice(kokoro, voice):
    if voice in BLENDS:
        return sum(kokoro.get_voice_style(n) * w for n, w in BLENDS[voice].items()).astype(np.float32)
    return voice


def load(voice):
    from kokoro_onnx import Kokoro

    ensure_models()
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    lang = "en-gb" if voice.startswith("b") or voice == "mix_scholar" else "en-us"
    return kokoro, load_voice(kokoro, voice), lang


def synth(engine, items, mode):
    """Speak each item in turn. A string is narrated; a number is held as that many
    seconds of silence (title and chapter cards). Returns audio and [start, end] per item."""
    kokoro, style, lang = engine
    pace = PACING[mode]
    parts = [np.zeros(int(pace["lead"] * SR), np.float32)]
    t = pace["lead"]
    timings = []
    for item in items:
        if not isinstance(item, str):
            timings.append([round(t, 3), round(t + item, 3)])
            parts.append(np.zeros(int(item * SR), np.float32))
            t += item
            continue
        dramatic = len(item.split()) <= 9
        speed = pace["speed"] * (0.97 if dramatic else 1)
        audio, _ = kokoro.create(item, voice=style, speed=speed, lang=lang)
        voiced = np.where(np.abs(audio) > 0.01)[0]
        audio = audio[max(0, voiced[0] - 400): voiced[-1] + 800]
        dur = len(audio) / SR
        timings.append([round(t, 3), round(t + dur, 3)])
        gap = pace["dramatic_gap"] if dramatic else pace["gap"]
        t += dur + gap
        parts += [audio.astype(np.float32), np.zeros(int(gap * SR), np.float32)]
    parts.append(np.zeros(int(1.5 * SR), np.float32))
    return np.concatenate(parts), timings


def master(raw, out_dir):
    """Write the raw take and the mastered 48 kHz narration."""
    out_dir.mkdir(parents=True, exist_ok=True)
    raw_path = out_dir / "narration_raw.wav"
    sf.write(raw_path, raw, SR)
    mastered = out_dir / "narration.wav"
    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(raw_path),
         "-f", "lavfi", "-i", f"anoisesrc=color=brown:amplitude=0.0012:sample_rate={SR}",
         "-filter_complex", MASTER_FILTER, "-ac", "1", str(mastered)],
        check=True,
    )
    return mastered


def narrate(sentences, voice, mode, out_dir):
    raw, timings = synth(load(voice), sentences, mode)
    mastered = master(raw, out_dir)
    timing_data = {"sentences": sentences, voice: {"duration": round(len(raw) / SR, 3), "timings": timings}}
    (out_dir / "timings.json").write_text(json.dumps(timing_data, indent=1))
    return mastered, timing_data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script", type=Path, help="JSON list of sentences, or a short/episode JSON with a 'sentences' field")
    ap.add_argument("--voice", default="am_adam")
    ap.add_argument("--mode", choices=PACING, default="short")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    script = json.loads(args.script.read_text())
    sentences = script["sentences"] if isinstance(script, dict) else script
    path, data = narrate(sentences, args.voice, args.mode, args.out)
    print(f"{path} · {data[args.voice]['duration']}s")


if __name__ == "__main__":
    main()
