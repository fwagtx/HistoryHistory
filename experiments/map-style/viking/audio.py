import sys, json, subprocess
from pathlib import Path
import numpy as np, soundfile as sf
sys.path.insert(0, "/home/user/HistoryHistory/pipeline")
import toon_audio, imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe(); V = Path(__file__).parent; L = json.load(open(V / "lines.json")); SR = 24000
PAUSE = [.3, .45, .6, .4, .45, .35, .35, .6, .35, .6, 1.2]
parts, t, lines = [np.zeros(int(.25 * SR), np.float32)], .25, []
for i, (spoken, shown) in enumerate(L):
    a, sr = sf.read(V / "vo" / f"{i}.wav", dtype="float32"); v = np.where(np.abs(a) > .008)[0]; a = a[max(0, v[0] - 200): v[-1] + 400]
    d = len(a) / sr; ws = shown.split(); w8 = [len(w) + 2 for w in ws]; tot = sum(w8); acc = 0; words = []
    for w, n in zip(ws, w8): words.append([w, round(t + d * acc / tot, 3), round(t + d * (acc + n) / tot, 3)]); acc += n
    lines.append(dict(i=i, text=shown, start=round(t, 3), end=round(t + d, 3), words=words)); parts += [a, np.zeros(int(PAUSE[i] * sr), np.float32)]; t += d + PAUSE[i]
voice = np.concatenate(parts); dur = len(voice) / SR; n = len(voice)
sf.write(V / "_v.wav", voice, SR)
subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(V / "_v.wav"), "-af", "highpass=f=60,acompressor=threshold=-22dB:ratio=2.2:attack=8:release=140:makeup=2,loudnorm=I=-15:TP=-1.5", "-ar", "24000", str(V / "_vm.wav")], check=True)
voice, _ = sf.read(V / "_vm.wav", dtype="float32"); voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
rng = np.random.default_rng(3)
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def flip(): x = rng.normal(0, 1, int(.14 * SR)); x = x - lp(x, 6); e = np.exp(-np.linspace(0, 9, len(x))); y = x * e * .25; y2 = np.zeros(int(.07 * SR)); return np.concatenate([y2, y])
def swish(): m = int(.28 * SR); x = lp(rng.normal(0, 1, m), 10) * np.sin(np.linspace(0, np.pi, m)) ** 2; return x * .18
def waves(): m = int(2.2 * SR); x = lp(rng.normal(0, 1, m), 60) * (np.sin(np.linspace(0, np.pi, m)) ** 1.5); return x * .9
def thunk(): m = int(.18 * SR); tt = np.arange(m) / SR; return (np.sin(2 * np.pi * 140 * tt) * np.exp(-tt * 30) + rng.normal(0, .3, m) * np.exp(-tt * 120)) * .55
W = lambda li, wi: lines[li]["words"][wi][1]
cues = [(0.05, flip), (W(0, 4), waves), (lines[3]["start"], swish), (W(3, 7), flip), (lines[4]["start"], waves), (W(4, 10), flip), (W(6, 13), thunk), (lines[8]["start"], swish), (W(9, 9), flip), (W(10, 6), flip)]
fx = np.zeros(n, np.float32)
for tc, f in cues:
    x = f(); s = int(tc * SR); e = min(n, s + len(x)); fx[s:e] += x[:e - s]
mus = toon_audio.music(dur, "viking-paper", "playful").astype(np.float32)[::2][:n]; mus = np.pad(mus, (0, n - len(mus)))
sp = lp(np.abs(voice), 2400); duck = lp(1 - .5 * np.clip(sp / (sp.max() * .25), 0, 1), 4800)
mix = voice + fx * .5 + mus * .07 * duck
sf.write(V / "_mix.wav", mix, SR)
subprocess.run([FF, "-loglevel", "error", "-y", "-i", str(V / "_mix.wav"), "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "48000", str(V / "mix.wav")], check=True)
json.dump(dict(duration=round(dur, 3), lines=lines), open(V / "timeline.json", "w"))
for l in lines: print(l["start"], l["end"], l["text"][:60])
print("dur", round(dur, 2))
