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


# ---------------------------------------------------------------------------
# Toon style (from Oct 2026): voice #3 (am_michael), paced phrase by phrase in
# the casual storyteller style, with separate voices for characters in skits.
# ---------------------------------------------------------------------------
import re

NARRATOR = "am_michael"
NARRATOR_SPEED = 1.02
CHARACTER_VOICES = ["bm_george", "am_fenrir", "bm_lewis", "am_puck", "af_heart", "am_echo", "bf_emma",
                    "am_eric", "af_bella", "bm_daniel", "am_liam", "bf_alice"]
POLISH = ("highpass=f=75,equalizer=f=140:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1.5:g=2,equalizer=f=7500:t=q:w=2:g=-3,"
          "deesser=i=0.35,acompressor=threshold=-22dB:ratio=3:attack=4:release=120:makeup=2.5,"
          "aecho=0.85:0.8:18|29:0.05|0.03,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000")
_KOKORO = None


def _kokoro():
    global _KOKORO
    if _KOKORO is None:
        from kokoro_onnx import Kokoro
        ensure_models()
        _KOKORO = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    return _KOKORO


def phrases(line):
    """Split a line into spoken phrases, each with a speed factor and the pause that follows it."""
    parts = re.findall(r"[^,;:?!.…]+(?:\.\.\.|…|[,;:?!.])*", line.replace("...", "…"))
    out = []
    for p in (x.strip() for x in parts):
        if not re.search(r"[A-Za-z0-9]", p):
            continue  # stray quotes or dashes carry nothing to speak
        words = len(p.split())
        speed = 0.92 if words <= 3 else 1.0
        if p.endswith("?"):
            speed *= 1.04
        end = p[-1]
        pause = {",": .12, ";": .2, ":": .25, "…": .38, "?": .32, "!": .3, ".": .28}.get(end, .1)
        out.append((p.replace("…", "..."), speed, pause))
    return out


def toon_narrate(beats, voices, out_dir):
    """Speak every beat. beats: [{"who": "N"|cast id, "say": str} or {"hold": seconds}].
    voices maps cast ids to Kokoro voices ("N" is the narrator). Returns timings with word times."""
    k = _kokoro()
    parts, t, timed = [np.zeros(int(.35 * SR), np.float32)], .35, []
    for b in beats:
        if not b.get("say"):
            hold = float(b.get("hold", 2.5))
            timed.append({"who": b.get("who", "N"), "say": "", "t0": round(t, 3), "t1": round(t + hold, 3), "words": []})
            parts.append(np.zeros(int(hold * SR), np.float32)); t += hold
            continue
        who = b.get("who", "N")
        voice = voices.get(who, NARRATOR)
        base = NARRATOR_SPEED if who == "N" else 1.0
        lang = "en-gb" if voice.startswith("b") else "en-us"
        t0, words = t, []
        for text, speed, pause in phrases(b["say"]):
            a, _ = k.create(text, voice=voice, speed=base * speed, lang=lang, trim=True)
            v = np.where(np.abs(a) > .008)[0]
            if len(v):
                a = a[max(0, v[0] - 300): v[-1] + 900]
            a = a.astype(np.float32); f = int(.012 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
            dur = len(a) / SR
            ws = text.split(); w8 = [len(w) + 2 for w in ws]; tot = sum(w8); acc = t
            for w, n in zip(ws, w8):
                words.append({"w": w, "s": round(acc, 3), "e": round(acc + dur * n / tot, 3)}); acc += dur * n / tot
            parts += [a, np.zeros(int(pause * SR), np.float32)]; t += dur + pause
        end_pause = .45 if len(b["say"].split()) <= 6 else .3
        parts.append(np.zeros(int(end_pause * SR), np.float32))
        timed.append({"who": who, "say": b["say"], "t0": round(t0, 3), "t1": round(t, 3), "words": words}); t += end_pause
    parts.append(np.zeros(int(1.2 * SR), np.float32))
    raw = np.concatenate(parts)
    out_dir.mkdir(parents=True, exist_ok=True)
    sf.write(out_dir / "voice_raw.wav", raw, SR)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i", str(out_dir / "voice_raw.wav"),
                    "-f", "lavfi", "-i", f"anoisesrc=color=pink:amplitude=0.0009:sample_rate={SR}",
                    "-filter_complex", f"[0:a][1:a]amix=inputs=2:duration=first:normalize=0,{POLISH}", "-ac", "1",
                    str(out_dir / "voice.wav")], check=True)
    (out_dir / "voice_raw.wav").unlink()
    return {"duration": round(len(raw) / SR, 3), "beats": timed}


def assign_voices(cast_ids, fixed=None):
    """Narrator plus a distinct voice per speaking character (scripts may pin voices)."""
    fixed = dict(fixed or {})
    out = {"N": fixed.pop("N", NARRATOR)}
    pool = [v for v in CHARACTER_VOICES if v not in fixed.values() and v != out["N"]]
    for cid in cast_ids:
        out[cid] = fixed.get(cid) or pool.pop(0) if (fixed.get(cid) or pool) else NARRATOR
    return out


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
