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

function avatarFlat(S, bg) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 18, 0, TAU2); c.clip();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(S / 2, S * .44, S * .36, 0, TAU2); c.fill();
  bust(c, S / 2, S * .56, S / 262); c.restore();
  ring(c, S, T.ink); return cv;
}
function avatarScene(S, name) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = '#7CC4F0'; c.fillRect(0, 0, S, S);
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 18, 0, TAU2); c.clip();
  sceneSquare(c, name, S, 3);
  bust(c, S / 2, S * .56, S / 262); c.restore();
  ring(c, S, T.ink); return cv;
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
window.LOGOS = () => ({
  'toon-avatar-gold': avatarFlat(1024, '#F2B632').toDataURL(),
  'toon-avatar-teal': avatarFlat(1024, '#2F8F86').toDataURL(),
  'toon-avatar-rome': avatarScene(1024, 'rome').toDataURL(),
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
