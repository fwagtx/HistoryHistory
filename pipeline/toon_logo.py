"""Channel logo drawn with the same toon engine as the videos.

    python pipeline/toon_logo.py        -> assets/logos/toon-*.png

The mascot is the engine's own 'legionary' character (the one that appears in
Roman stories), so the profile picture matches what viewers see in the shorts.
"""
import base64
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from toon_render import ENGINE, ROOT, chromium, font_css

OUT = ROOT / "assets" / "logos"

DRAW = r"""
const MASCOT = Object.assign({}, PRESET.legionary, { eyes: 'big', mood: 'happy', hatLift: 16, look: .12, gaze: .4, hold: null, ra: [-150, -40], la: [-18, -6] });

function sceneSquare(c, name, S, blur) {
  const tmp = document.createElement('canvas'); tmp.width = BW; tmp.height = BH; frameStart(.4); scene(tmp.getContext('2d'), name, 1);
  const k = S / BH; c.save(); if (blur) c.filter = `blur(${blur}px)`;
  c.drawImage(tmp, (S - BW * k) / 2, 0, BW * k, S); c.restore();
}
function bust(c, cx, cy, s) { frameStart(.4); guy(c, cx, cy, s, MASCOT, .4); }
function ring(c, S, col) {  // hand-drawn outline round the avatar
  hd(c, ell(S / 2, S / 2, S / 2 - 18, S / 2 - 18, 60), { w: 22, color: col, amp: 1.2 });
}

function banner(W, H) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = BW; tmp.height = BH; frameStart(.4); scene(tmp.getContext('2d'), 'rome', 1);
  c.drawImage(tmp, 0, 0, W, H);
  const k = W / BW; c.save(); c.scale(k, k);
  guy(c, 1440, 470, 3.3, Object.assign({}, MASCOT, { hold: 'spear', ra: [22, 8], look: -.25, gaze: -.6 }), .4);
  thumbText(c, 'HISTORY', 90, 400, 250, { align: 'left', sw: .09 });
  thumbText(c, 'PROS', 90, 640, 250, { align: 'left', sw: .09, fill: '#F2B632' });
  c.save(); c.translate(100, 760); c.rotate(-.03); hd(c, rect(0, 0, 760, 96), { fill: '#FFFFFF', w: 6 }); c.restore();
  marker(c, 'history, explained simply', 480, 828, 58, T.ink);
  c.restore(); return cv;
}
function hero(id, extra = {}) { return Object.assign({}, PRESET[id], { eyes: 'big', mood: 'happy', look: .12, gaze: .4, hold: null, hold2: null, ra: [-150, -40], la: [-18, -6] }, extra); }
function avatar(S, who, bg, sceneName, cy = .56) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 18, 0, TAU2); c.clip();
  if (sceneName) sceneSquare(c, sceneName, S, 3);
  else { c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(S / 2, S * .44, S * .36, 0, TAU2); c.fill(); }
  frameStart(.4); guy(c, S / 2, S * cy, S / 262, who, .4); c.restore();
  ring(c, S, T.ink); return cv;
}
function squad(S, bg) {  // three eras in one circle
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 18, 0, TAU2); c.clip();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(S / 2, S * .5, S * .40, 0, TAU2); c.fill();
  const k = S / 1024; frameStart(.4);
  guy(c, 250 * k, 600 * k, 2.6 * k, hero('viking', { hatLift: 10, look: .35, gaze: .6 }), .4);
  guy(c, 774 * k, 600 * k, 2.6 * k, hero('pharaoh', { hatLift: 14, look: -.35, gaze: -.6 }), .4);
  guy(c, 512 * k, 520 * k, 3.2 * k, hero('legionary', { hatLift: 16 }), .4);
  c.restore(); ring(c, S, T.ink); return cv;
}
function shoutAvatar(S, bg) {  // mascot shouting the name in a speech bubble
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 18, 0, TAU2); c.clip();
  const k = S / 1024; c.save(); c.scale(k, k);
  frameStart(.4); guy(c, 360, 690, 3.1, hero('legionary', { hatLift: 16, mood: 'shout', look: .3, gaze: .6 }), .4);
  c.save(); c.translate(500, 150); c.rotate(.05);
  const pts = poly([[0, 0], [360, 0], [360, 230], [140, 230], [40, 320], [80, 230], [0, 230]], 30); hd(c, pts, { fill: '#FFFFFF', w: 7 });
  thumbText(c, 'HISTORY', 180, 108, 84, { shadow: false, sw: 0, fill: T.ink }); thumbText(c, 'PROS!', 180, 205, 92, { shadow: false, sw: 0, fill: '#D63A2F' });
  c.restore(); c.restore(); c.restore(); ring(c, S, T.ink); return cv;
}
function watermark(W, H) {  // transparent corner mark for videos / end screens
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const k = H / 400; c.save(); c.scale(k, k);
  thumbText(c, 'HISTORY PROS', 285, 320, 150, { sw: .1, align: 'left' });
  frameStart(.4); guy(c, 140, 200, 1.9, hero('legionary', { hatLift: 16, look: .3, gaze: .6 }), .4);
  c.restore(); return cv;
}
window.LOGOS = () => ({
  'toon-avatar-gold': avatar(1024, hero('legionary', { hatLift: 16 }), '#F2B632').toDataURL(),
  'toon-avatar-teal': avatar(1024, hero('legionary', { hatLift: 16 }), '#2F8F86').toDataURL(),
  'toon-avatar-rome': avatar(1024, hero('legionary', { hatLift: 16 }), '#7CC4F0', 'rome').toDataURL(),
  'toon-avatar-viking': avatar(1024, hero('viking', { hatLift: 10 }), '#2F6FC2').toDataURL(),
  'toon-avatar-pharaoh': avatar(1024, hero('pharaoh', { hatLift: 14 }), '#7CC4F0', 'egypt').toDataURL(),
  'toon-avatar-samurai': avatar(1024, hero('samurai', { hatLift: 14 }), '#D63A2F', null, .63).toDataURL(),
  'toon-avatar-pirate': avatar(1024, hero('pirate'), '#1F2E55').toDataURL(),
  'toon-avatar-squad': squad(1024, '#F2B632').toDataURL(),
  'toon-avatar-shout': shoutAvatar(1024, '#2F8F86').toDataURL(),
  'toon-watermark': watermark(1240, 400).toDataURL(),
  'toon-banner': banner(2560, 1440).toDataURL(),
});
"""


def main():
    js = "\n".join((ROOT / "engine" / f).read_text() for f in ENGINE)
    page = OUT / "_toon_logo.html"
    page.write_text(f"<!doctype html><html><head><meta charset='utf-8'>{font_css()}</head><body>"
                    f"<script>{js}\nconst TV={json.dumps({'cast': {}, 'shots': [], 'beats': []})};\n{DRAW}</script></body></html>")
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path=chromium())
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(page.resolve().as_uri())
            pg.evaluate("async()=>{await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
            if errs:
                raise RuntimeError(errs[0])
            for name, url in pg.evaluate("LOGOS()").items():
                (OUT / f"{name}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
                print("wrote", f"assets/logos/{name}.png")
            b.close()
    finally:
        page.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
