"""Royalty-free music beds and sound effects for toon videos, synthesized locally.

Each episode gets its own key, tempo and chord progression (seeded by its id), so
the channel never repeats one loop. Styles: playful (plucked guitar-like arpeggios),
tense (minor, slower, low pulses) and warm (soft major pads for heartfelt moments).
"""
import hashlib

import numpy as np

SR = 48000
PROGS = {
    "playful": [[[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
                [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]],
    "tense": [[[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]], [[0, 3, 7], [5, 8, 12], [0, 3, 7], [7, 10, 14]]],
    "warm": [[[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]],
}


def _rng(seed):
    return np.random.default_rng(int(hashlib.sha1(seed.encode()).hexdigest()[:8], 16))


def pluck(freq, length, damp=.996, rng=None):
    rng = rng or np.random.default_rng(1)
    n, N = int(SR * length), max(2, int(SR / freq))
    buf, out = rng.uniform(-1, 1, N) * .5, np.zeros(n)
    for i in range(n):
        j = i % N
        out[i] = buf[j]
        buf[j] = (buf[j] + buf[(j + 1) % N]) * .5 * damp
    return out * np.linspace(1, 0, n) ** 1.5


def pad(freq, length):
    t = np.arange(int(SR * length)) / SR
    x = sum(np.sin(2 * np.pi * freq * k * t) / k ** 1.6 for k in (1, 2, 3))
    env = np.minimum(1, t / .4) * np.minimum(1, (length - t) / .6)
    return x * env * .35


def music(duration, seed, style="playful"):
    r = _rng(seed)
    prog = PROGS[style][int(r.integers(len(PROGS[style])))]
    key = 48 + int(r.integers(0, 7)) - (5 if style == "tense" else 0)
    bpm = {"playful": 96 + int(r.integers(0, 16)), "tense": 78 + int(r.integers(0, 10)), "warm": 72 + int(r.integers(0, 10))}[style]
    beat = 60 / bpm
    mix = np.zeros(int(SR * (duration + 3)))
    cache = {}

    def note(m, length, damp=.996):
        k = (m, length, damp)
        if k not in cache:
            cache[k] = pluck(440 * 2 ** ((m - 69) / 12), length, damp, r)
        return cache[k]

    def put(x, t, g):
        s = int(t * SR); e = min(len(mix), s + len(x))
        if s < len(mix):
            mix[s:e] += x[:e - s] * g
    pattern = [0, 1, 2, 1, 0, 2, 1, 2] if style == "playful" else [0, 2, 1, 2]
    bars = int(duration / (beat * 4)) + 1
    for b in range(bars):
        ch = [key + x for x in prog[b % len(prog)]]; t0 = b * beat * 4
        section = (b // 8) % 4  # vary density so long beds breathe
        if style == "warm":
            for m in ch:
                put(pad(440 * 2 ** ((m + 12 - 69) / 12), beat * 4), t0, .5)
            continue
        if section != 3 or style == "tense":
            step = beat / 2 if style == "playful" else beat
            for i, idx in enumerate(pattern):
                put(note(ch[idx] + 12, .6), t0 + i * step, .22 if i % 2 == 0 else .15)
        for i in range(4 if style == "playful" else 2):
            put(note(ch[0] - 12, .5, .99), t0 + i * beat * (1 if style == "playful" else 2), .35)
        if style == "playful" and section in (1, 2):
            for i in (1, 3):
                n = int(.03 * SR); put(r.uniform(-1, 1, n) * np.linspace(1, 0, n) ** 4, t0 + i * beat, .05)
    mix = mix[:int(SR * duration)]
    f = int(SR * 1.5); mix[-f:] *= np.linspace(1, 0, f)
    return mix / (np.max(np.abs(mix)) * 1.05 + 1e-9)


def pop():
    t = np.arange(int(.12 * SR)) / SR
    return np.sin(2 * np.pi * (900 - 3000 * t) * t) * np.exp(-t * 38) * .6


def whoosh(seed=1):
    n = int(.35 * SR); x = np.random.default_rng(seed).normal(0, 1, n)
    k = np.linspace(0, 1, n); env = np.sin(np.pi * k) ** 2
    y = np.convolve(x, np.ones(30) / 30, mode="same")  # soft low-pass
    return y * env * .25


def sfx_track(duration, pops=(), whooshes=()):
    out = np.zeros(int(SR * (duration + 1)))
    for t, x in [(t, pop()) for t in pops] + [(t, whoosh(int(t * 10))) for t in whooshes]:
        s = int(t * SR); e = min(len(out), s + len(x))
        if 0 <= s < len(out):
            out[s:e] += x[:e - s]
    return out[:int(SR * duration)]
