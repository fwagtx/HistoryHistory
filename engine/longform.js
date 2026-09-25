/* History Pros long-form engine (16:9, Dark Chronicle).
 * Needs the shared canvas engine (W, H, PAL, STYLES, SCENES, drawMap, mapCam,
 * grain, vignette, rng, ellipse, rrect, wrap, spacing, fog...) loaded first.
 * Scenes are drawn at 1280x720; frame() composes a documentary frame and
 * thumb() a YouTube thumbnail from a roadmap week (config/roadmap_q4.json). */
const NS = STYLES.noir;
const RED = '#E0463A', INK = '#F2F2F2', DIM = '#BFC5CA';
const DISPLAY = "Oswald, 'Arial Narrow', Impact, sans-serif";

function nightSky(c, top, mid, bot) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(.6, mid); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600); }
function glowAt(c, x, y, r, rgb, a) { const g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
function drift(c, t, n, seed, col, vy, vx, size) { const r = rng(seed); c.fillStyle = col; for (let i = 0; i < n; i++) { const x = ((r() * W * 1.2 + t * vx * (.5 + r())) % (W * 1.2) + W * 1.2) % (W * 1.2) - 60, y = ((r() * H + t * vy * (.5 + r())) % H + H) % H; c.fillRect(x, y, size, size); } }
function temple(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.moveTo(-130, -150); c.lineTo(0, -205); c.lineTo(130, -150); c.fill(); c.fillRect(-135, -152, 270, 14); for (let i = 0; i < 6; i++) c.fillRect(-118 + i * 45, -138, 18, 128); c.fillRect(-140, -12, 280, 12); c.restore(); }
function rain(c, t) { const r = rng(21); c.strokeStyle = 'rgba(200,210,220,.22)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 160; i++) { const x = (r() * W * 1.3 + t * 120) % (W * 1.3) - 100, y = (r() * H + t * 900 * (.6 + r() * .4)) % H; c.moveTo(x, y); c.lineTo(x - 10, y + 28); } c.stroke(); }

const LF = {
  volcano(c, t) {
    nightSky(c, '#0a0606', '#2a0c09', '#070404'); glowAt(c, 700, 340, 560, '210,60,30', .42);
    const r = rng(12);
    for (let i = 0; i < 80; i++) { const ph = (i / 80 + t * .018 * (.6 + r())) % 1, y = 335 - ph * 430, x = 700 + ph * 190 + Math.sin(i * 1.7 + t * .3) * 26 * ph * 3, rad = 26 + ph * 140 * (.6 + r() * .6), g = (58 + 40 * (1 - ph)) | 0; c.fillStyle = `rgba(${g + 8},${g},${g - 4},${.5 * (1 - ph * .55)})`; ellipse(c, x, y, rad, rad * .8); }
    glowAt(c, 700, 345, 160, '255,110,50', .35);
    c.fillStyle = '#0c0a0a'; c.beginPath(); c.moveTo(200, H); c.lineTo(540, 400); c.lineTo(640, 352); c.lineTo(700, 340); c.lineTo(760, 354); c.lineTo(840, 322); c.lineTo(910, 366); c.lineTo(1240, H); c.fill();
    c.strokeStyle = 'rgba(224,70,58,.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(700, 346); c.quadraticCurveTo(684, 430, 644, 520); c.moveTo(712, 348); c.quadraticCurveTo(762, 436, 796, 526); c.stroke();
    c.fillStyle = '#050404'; c.fillRect(-20, 612, W + 40, 140); temple(c, 230, 616, 1, '#050404'); temple(c, 1060, 626, .75, '#050404');
    for (let i = 0; i < 8; i++) c.fillRect(430 + i * 62, 566 + (i % 3) * 12, 46, 60);
    drift(c, t, 160, 4, 'rgba(190,180,170,.35)', 38, 12, 2);
  },
  walls(c, t) {
    nightSky(c, '#07080b', '#1b1414', '#0a0707'); glowAt(c, 980, 380, 520, '210,70,40', .3);
    c.fillStyle = '#0e0f12'; c.beginPath(); c.arc(900, 395, 70, Math.PI, 0); c.fill(); c.fillRect(820, 395, 160, 80);
    c.fillRect(760, 420, 60, 55); c.fillRect(990, 410, 70, 65); c.beginPath(); c.arc(790, 420, 26, Math.PI, 0); c.arc(1025, 410, 30, Math.PI, 0); c.fill();
    for (let i = 0; i < 26; i++) { const ph = (i / 26 + t * .03) % 1; c.fillStyle = `rgba(60,55,55,${.35 * (1 - ph)})`; ellipse(c, 1100 + ph * 80 + Math.sin(i) * 30, 470 - ph * 360, 40 + ph * 90, 30 + ph * 60); }
    c.fillStyle = '#08090b'; c.fillRect(-20, 478, W + 40, 110); for (let x = -10; x < W + 20; x += 34) c.fillRect(x, 466, 20, 14);
    for (let x = 40; x < W; x += 210) { c.fillRect(x, 420, 76, 170); for (let k = 0; k < 3; k++) c.fillRect(x + k * 28, 408, 20, 14); }
    const f = Math.max(0, Math.sin(t * 2.3) * Math.sin(t * 5.1)); if (f > .6) glowAt(c, 300 + ((t * 97) % 600), 560, 120, '255,160,80', .5 * (f - .6) / .4);
    c.fillStyle = '#050505'; c.fillRect(-20, 588, W + 40, 160);
    drift(c, t, 60, 9, 'rgba(255,120,60,.5)', -30, 8, 2);
  },
  village(c, t) {
    nightSky(c, '#05070c', '#111a26', '#0a0e14'); c.fillStyle = 'rgba(220,226,235,.9)'; c.beginPath(); c.arc(980, 170, 46, 0, TAU); c.fill(); glowAt(c, 980, 170, 220, '200,210,230', .22);
    c.fillStyle = '#07090d'; c.beginPath(); c.moveTo(-20, 560); c.bezierCurveTo(300, 520, 700, 540, W + 20, 510); c.lineTo(W + 20, H); c.lineTo(-20, H); c.fill();
    c.fillStyle = '#030406'; const x0 = 560, y0 = 545;
    c.fillRect(x0 - 90, y0 - 110, 180, 110); c.beginPath(); c.moveTo(x0 - 100, y0 - 110); c.lineTo(x0, y0 - 170); c.lineTo(x0 + 100, y0 - 110); c.fill();
    c.fillRect(x0 - 18, y0 - 250, 36, 90); c.beginPath(); c.moveTo(x0 - 22, y0 - 250); c.lineTo(x0, y0 - 320); c.lineTo(x0 + 22, y0 - 250); c.fill();
    const house = (x, y, w, h) => { c.fillRect(x, y - h, w, h); c.beginPath(); c.moveTo(x - 8, y - h); c.lineTo(x + w * .35, y - h - 50); c.lineTo(x + w + 8, y - h + 18); c.lineTo(x + w + 8, y - h); c.fill(); c.fillRect(x + w * .3, y - h - 60, 14, 24); };
    house(160, 560, 170, 90); house(840, 545, 150, 80); house(1060, 555, 160, 95);
    c.fillStyle = 'rgba(242,194,122,.8)'; [[190, 505], [260, 505], [870, 495], [1090, 500], [1160, 500]].forEach(([x, y], i) => { c.globalAlpha = .45 + .3 * Math.sin(t * 2 + i); c.fillRect(x, y, 12, 16); }); c.globalAlpha = 1;
    c.strokeStyle = '#030406'; c.lineCap = 'round';
    const tree = (x, y, s) => { const br = (x, y, a, l, d) => { if (d > 5) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = Math.max(1, 7 - d * 1.3) * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); br(x2, y2, a - .45, l * .72, d + 1); br(x2, y2, a + .38, l * .7, d + 1); }; br(x, y, -Math.PI / 2, 90 * s, 0); };
    tree(60, 600, 1.3); tree(1220, 600, 1.1); tree(400, 560, .8);
    fog(c, { fog: '170,180,195' }, t, 1.2);
  },
  street(c, t) {
    nightSky(c, '#06070a', '#141719', '#0b0c0d');
    c.fillStyle = '#0a0c0e';
    for (let i = 0; i < 6; i++) { const h = 420 - i * 38; for (const x of [i * 120 - 20, W - i * 120 - 100]) { c.fillRect(x, H - h - 120, 122, h + 200); for (let k = 0; k < 3; k++) c.fillRect(x + 20 + k * 30, H - h - 150, 14, 34); } }
    const lamp = (x, y, s) => { c.fillStyle = '#030405'; c.fillRect(x - 3 * s, y, 6 * s, 200 * s); c.fillRect(x - 12 * s, y - 26 * s, 24 * s, 26 * s); glowAt(c, x, y - 12 * s, 140 * s, '255,190,110', .55); };
    lamp(330, 330, 1.1); lamp(930, 340, 1); lamp(560, 400, .6); lamp(730, 405, .55);
    c.fillStyle = '#020203'; const fx = 640; c.beginPath(); c.arc(fx, 452, 9, 0, TAU); c.fill(); c.fillRect(fx - 12, 440, 24, 4); c.fillRect(fx - 7, 420, 14, 22);
    c.beginPath(); c.moveTo(fx - 13, 462); c.lineTo(fx + 13, 462); c.lineTo(fx + 18, 540); c.lineTo(fx - 18, 540); c.fill();
    c.strokeStyle = 'rgba(120,125,130,.18)'; c.lineWidth = 1; for (let i = 0; i < 10; i++) { const y = 560 + i * i * 2.2; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    fog(c, { fog: '150,160,165' }, t, 1.4);
  },
  trench(c, t) {
    nightSky(c, '#0a0b0c', '#232524', '#101110'); const fl = (t * .2) % 1; glowAt(c, 300 + fl * 700, 160 - Math.sin(fl * Math.PI) * 90, 380, '240,230,200', .35 * Math.sin(fl * Math.PI));
    c.fillStyle = '#141412'; c.fillRect(-20, 470, W + 40, 300); const r = rng(3); c.fillStyle = '#0b0b0a'; for (let i = 0; i < 9; i++) ellipse(c, r() * W, 500 + r() * 180, 60 + r() * 80, 10 + r() * 14);
    c.fillStyle = '#050505'; for (let x = 0; x < W; x += 120) c.fillRect(x + 30, 470, 5, 60);
    c.strokeStyle = '#050505'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, 482 + Math.sin(x * .3) * 8); c.stroke(); c.beginPath(); for (let x = 0; x <= W; x += 14) c.lineTo(x, 500 + Math.cos(x * .4) * 7); c.stroke();
    c.fillStyle = '#070706'; c.fillRect(-20, 610, W + 40, 120); for (let x = 0; x < W; x += 90) c.fillRect(x, 596, 70, 20);
    fog(c, { fog: '140,140,135' }, t, 1);
  },
  cellar(c, t) {
    c.fillStyle = '#080605'; c.fillRect(0, 0, W, H); c.fillStyle = '#120e0b';
    for (let i = 0; i < 4; i++) { const x = i * 340 - 40; c.beginPath(); c.moveTo(x, H); c.lineTo(x, 260); c.quadraticCurveTo(x + 170, 90, x + 340, 260); c.lineTo(x + 340, H); c.lineTo(x + 310, H); c.lineTo(x + 310, 270); c.quadraticCurveTo(x + 170, 130, x + 30, 270); c.lineTo(x + 30, H); c.fill(); }
    const f = .85 + .15 * Math.sin(t * 9) * Math.sin(t * 3.7); glowAt(c, 640, 470, 520, '242,170,90', .38 * f);
    const barrel = (x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#1b120c'; c.beginPath(); c.ellipse(0, 0, 46, 62, 0, 0, TAU); c.fill(); c.fillStyle = '#0c0806'; c.fillRect(-46, -30, 92, 6); c.fillRect(-46, 24, 92, 6); c.restore(); };
    [[420, 600, 1], [520, 600, 1], [620, 600, 1], [470, 500, 1], [570, 500, 1], [760, 610, .9], [860, 610, .9], [810, 520, .9], [330, 610, .85]].forEach(a => barrel(...a));
    c.fillStyle = '#050403'; c.fillRect(0, 660, W, 60); glowAt(c, 684, 540, 60, '255,200,120', .7 * f); c.fillStyle = 'rgba(255,210,140,.9)'; c.fillRect(680, 540, 8, 16);
  },
  warship(c, t) {
    nightSky(c, '#1d2328', '#39413f', '#20262a');
    for (let i = 0; i < 30; i++) { const ph = (i / 30 + t * .02) % 1; c.fillStyle = `rgba(20,20,22,${.55 * (1 - ph)})`; ellipse(c, 760 + Math.sin(i) * 60 + ph * 120, 470 - ph * 380, 40 + ph * 110, 30 + ph * 70); }
    glowAt(c, 760, 470, 240, '230,90,50', .45);
    c.fillStyle = '#262d31'; c.fillRect(-20, 480, W + 40, 300);
    c.fillStyle = '#07090a'; c.beginPath(); c.moveTo(380, 470); c.lineTo(1100, 470); c.lineTo(1070, 510); c.lineTo(420, 510); c.fill();
    c.fillRect(560, 430, 120, 40); c.fillRect(700, 410, 70, 60); c.fillRect(735, 340, 10, 70); c.fillRect(620, 360, 8, 70); c.fillRect(840, 440, 90, 30); c.fillRect(470, 448, 70, 22); c.fillRect(520, 452, 60, 5); c.fillRect(940, 452, 60, 5);
    for (let i = 0; i < 5; i++) { const x = ((i * 260 + t * 90) % 1600) - 160, y = 120 + i * 28; c.fillRect(x - 18, y, 36, 4); c.fillRect(x - 4, y - 8, 6, 20); }
    drift(c, t, 50, 11, 'rgba(255,140,80,.45)', -20, 6, 2);
  },
  snow(c, t) {
    nightSky(c, '#0b1016', '#1e2833', '#2c3743');
    c.fillStyle = '#9aa7b3'; c.beginPath(); c.moveTo(-20, 420); c.lineTo(250, 230); c.lineTo(420, 330); c.lineTo(640, 190); c.lineTo(900, 360); c.lineTo(1100, 250); c.lineTo(W + 20, 380); c.lineTo(W + 20, H); c.lineTo(-20, H); c.fill();
    c.fillStyle = '#7d8a96'; c.fillRect(-20, 560, W + 40, 200);
    const pine = (x, y, s) => { c.fillStyle = '#0a1014'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x, y - 120 * s + k * 26 * s); c.lineTo(x - (30 + k * 12) * s, y - 50 * s + k * 26 * s); c.lineTo(x + (30 + k * 12) * s, y - 50 * s + k * 26 * s); c.fill(); } c.fillRect(x - 4 * s, y + 10 * s, 8 * s, 20 * s); };
    [[90, 560, 1.2], [190, 580, 1], [1110, 560, 1.1], [1210, 575, 1.3], [300, 500, .6], [980, 500, .6]].forEach(a => pine(...a));
    c.fillStyle = '#10161b'; c.fillRect(560, 540, 150, 40); c.beginPath(); c.moveTo(560, 540); c.bezierCurveTo(570, 470, 700, 470, 710, 540); c.fill(); c.beginPath(); c.arc(585, 585, 18, 0, TAU); c.arc(690, 585, 18, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, H);
    drift(c, t, 260, 7, 'rgba(240,245,250,.8)', 55, -18, 3);
  },
  ruins(c, t) {
    nightSky(c, '#070506', '#20100c', '#0a0605'); const f = .85 + .15 * Math.sin(t * 8); glowAt(c, 640, 560, 600, '230,110,50', .42 * f);
    for (let i = 0; i < 8; i++) { const x = 120 + i * 150, h = i % 3 === 2 ? 180 : 320; c.fillStyle = '#070505'; c.fillRect(x, 600 - h, 50, h); c.fillRect(x - 8, 600 - h - 14, 66, 14); }
    c.fillStyle = '#050404'; c.fillRect(80, 258, 470, 26); c.fillRect(-20, 600, W + 40, 140);
    const r = rng(2); for (let i = 0; i < 40; i++) { const ph = (i / 40 + t * .4 * (.5 + r())) % 1; c.fillStyle = `rgba(255,${(120 + r() * 80) | 0},40,${.7 * (1 - ph)})`; ellipse(c, 300 + r() * 700, 600 - ph * 160, 8 + (1 - ph) * 14, 14 + (1 - ph) * 20); }
    drift(c, t, 70, 3, 'rgba(255,160,70,.5)', -45, 6, 2);
  },
  shipdead(c, t, lp) { SCENES.ship(c, NS, lp, t, t, .72, true); },
  dock(c, t, lp) { SCENES.dock(c, NS, lp, t, t); },
  storm(c, t, lp) { SCENES.ship(c, NS, lp, t, t, .55, false); rain(c, t); },
};

function scene(c, name, t, lp = .5) { c.save(); const z = 1 + .05 * lp; c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); LF[name](c, t, lp); c.restore(); }
function resetCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
function crest(c, x, y, r) {
  c.save(); c.translate(x, y); c.fillStyle = '#15212D'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = '#C9A24A'; c.lineWidth = r * .06; c.beginPath(); c.arc(0, 0, r * .9, 0, TAU); c.stroke();
  c.fillStyle = '#C9A24A';
  for (const side of [1, -1]) { c.save(); c.scale(side, 1); for (let k = 0; k < 9; k++) { const a = (118 + k * 14) * Math.PI / 180; c.save(); c.translate(Math.cos(a) * r * .68, Math.sin(a) * r * .68); c.rotate(a + Math.PI / 2 + .5); c.beginPath(); c.ellipse(0, 0, r * .1, r * .04, 0, 0, TAU); c.fill(); c.restore(); } c.restore(); }
  c.fillStyle = '#E3C47F'; c.font = `700 ${r * .62}px Cinzel, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HP', 0, r * .04); c.restore();
}
function finish(c, t) {
  grain(c, .16, t); vignette(c, .7);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 58); c.fillRect(0, H - 58, W, 58);
  crest(c, W - 46, H - 29, 17); c.fillStyle = '#8E989F'; c.font = `500 15px ${DISPLAY}`; spacing(c, 3); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('HISTORY PROS', W - 72, H - 29); spacing(c, 0);
}
function stampChip(c, text) { c.font = `500 18px ${DISPLAY}`; spacing(c, 4); const w = c.measureText(text).width + 34; c.fillStyle = 'rgba(0,0,0,.6)'; rrect(c, 44, 78, w, 36, 4); c.fill(); c.strokeStyle = RED; c.lineWidth = 1.5; c.stroke(); c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, 61, 97); spacing(c, 0); }
function subtitle(c, text) { c.font = "600 30px Archivo, Arial, sans-serif"; const lines = wrap(c, text, 1020); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; lines.forEach((l, i) => { const y = H - 104 - (lines.length - 1 - i) * 40; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 6; c.strokeText(l, W / 2, y); c.fillStyle = '#FFF'; c.fillText(l, W / 2, y); }); }
function fitFont(c, text, weight, max, width) { let s = max; c.font = `${weight} ${s}px ${DISPLAY}`; while (c.measureText(text).width > width && s > 20) { s -= 4; c.font = `${weight} ${s}px ${DISPLAY}`; } return s; }

/* kind: cold | title | chapter | map | quote | stat | end ; lp: 0..1 progress through the segment */
function frame(c, kind, wk, t, lp = .5, next) {
  resetCtx(c); c.save();
  if (kind === 'cold') { scene(c, wk.scene, t, lp); c.restore(); finish(c, t); stampChip(c, wk.stamp); subtitle(c, wk.cold); return; }
  if (kind === 'title') {
    scene(c, wk.scene, t, lp); c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 0, W, H); c.restore(); finish(c, t);
    const [main, sub] = wk.title.split(': '); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = RED; c.font = `500 20px ${DISPLAY}`; spacing(c, 10); c.fillText('A HISTORY PROS DOCUMENTARY', W / 2, 262); spacing(c, 0);
    c.fillStyle = INK; fitFont(c, main.toUpperCase(), 700, 110, 1100); c.fillText(main.toUpperCase(), W / 2, 380);
    if (sub) { c.fillStyle = DIM; fitFont(c, sub.toUpperCase(), 500, 40, 1000); spacing(c, 2); c.fillText(sub.toUpperCase(), W / 2, 440); spacing(c, 0); }
    c.fillStyle = RED; c.fillRect(W / 2 - 60 * lp - 20, 470, 120 * lp + 40, 4); return;
  }
  if (kind === 'chapter') {
    scene(c, wk.scene2, t, lp); c.restore(); const g = c.createLinearGradient(0, 0, 820, 0); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    finish(c, t); const n = 1; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = RED; c.font = `500 24px ${DISPLAY}`; spacing(c, 8); c.fillText(`CHAPTER ${n + 1}`, 96, 318); spacing(c, 0);
    c.fillStyle = INK; fitFont(c, wk.chapters[n].toUpperCase(), 700, 76, 760); c.fillText(wk.chapters[n].toUpperCase(), 94, 400);
    c.fillStyle = RED; c.fillRect(96, 426, 90, 4);
    c.font = "500 16px Archivo, Arial, sans-serif"; wk.chapters.forEach((ch, i) => { c.fillStyle = i === n ? INK : 'rgba(242,242,242,.38)'; c.fillText(`${i + 1}  ${ch}`, 96, 488 + i * 24); });
    return;
  }
  if (kind === 'map') {
    if (wk.map) { const m = wk.map, z = m.z0 + (m.z1 - m.z0) * ease(lp); mapCam(c, m.lon, m.lat, z); drawMap(c, NS, m.date, { z, route: m.route ? Math.min(1, .3 + lp) : null, allLabels: z > 2.5 }); }
    else scene(c, wk.scene2, t, lp);
    c.restore(); finish(c, t); stampChip(c, wk.stamp); subtitle(c, wk.cold.split('. ')[0] + '.'); return;
  }
  if (kind === 'quote') {
    c.globalAlpha = .22; scene(c, wk.scene2, t, lp); c.globalAlpha = 1; c.restore(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H); finish(c, t);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = RED; c.font = `700 120px ${DISPLAY}`; c.fillText('“', W / 2, 250);
    c.fillStyle = INK; c.font = "italic 500 46px 'EB Garamond', Georgia, serif"; const lines = wrap(c, wk.quote.text, 940); lines.forEach((l, i) => c.fillText(l, W / 2, 330 + i * 58));
    c.fillStyle = RED; c.font = `500 20px ${DISPLAY}`; spacing(c, 6); c.fillText('— ' + wk.quote.who, W / 2, 360 + lines.length * 58); spacing(c, 0); return;
  }
  if (kind === 'stat') {
    c.restore(); const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 700); g.addColorStop(0, '#2a0d0b'); g.addColorStop(1, '#050303'); c.fillStyle = g; c.fillRect(0, 0, W, H); finish(c, t);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = RED; c.font = `500 24px ${DISPLAY}`; spacing(c, 8); c.fillText(wk.stat.label, W / 2, 250); spacing(c, 0);
    c.fillStyle = INK; fitFont(c, wk.stat.big, 700, 190, 1000); c.fillText(wk.stat.big, W / 2, 440); c.fillStyle = DIM; c.font = "500 28px Archivo, Arial, sans-serif"; c.fillText(wk.stat.sub, W / 2, 500); return;
  }
  if (kind === 'character') {
    const id = (wk.cast || [])[typeof next === 'number' ? next : 0], sp = typeof CAST !== 'undefined' && CAST[id];
    c.globalAlpha = .3; scene(c, wk.scene2, t, lp); c.globalAlpha = 1; c.restore();
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (sp) bust(c, sp, 400 - 30 * (1 - ease(Math.min(1, lp * 2))), 290, 1.35, .45);
    finish(c, t); if (!sp) return;
    const a = ease(Math.min(1, lp * 2.5)); c.globalAlpha = a; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = RED; c.font = `500 22px ${DISPLAY}`; spacing(c, 8); c.fillText('WHO WAS THERE', 740, 286); spacing(c, 0);
    c.fillStyle = INK; const nm = sp.name.toUpperCase(); fitFont(c, nm, 700, 68, 470); c.fillText(nm, 738, 364);
    c.fillStyle = RED; c.fillRect(740, 388, 80 * a, 4);
    c.fillStyle = DIM; c.font = "500 26px Archivo, Arial, sans-serif"; c.fillText(sp.role, 740, 440); c.globalAlpha = 1; return;
  }
  if (kind === 'end') {
    c.globalAlpha = .35; scene(c, wk.scene, t, lp); c.globalAlpha = 1; c.restore(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H); finish(c, t);
    if (next) { const tb = document.createElement('canvas'); tb.width = W; tb.height = H; (typeof thumbBait === 'function' && next.cb ? thumbBait : thumb)(tb.getContext('2d'), next, 2); c.drawImage(tb, 110, 170, 600, 338); }
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(110, 170, 600, 338);
    c.fillStyle = RED; c.font = `500 20px ${DISPLAY}`; spacing(c, 6); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('NEXT WEDNESDAY', 110, 150); spacing(c, 0);
    crest(c, 930, 330, 110); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(930, 330, 122, 0, TAU); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.font = `700 30px ${DISPLAY}`; spacing(c, 4); c.fillText('SUBSCRIBE', 930, 500); spacing(c, 0);
    c.fillStyle = DIM; c.font = "500 22px Archivo, Arial, sans-serif"; c.fillText('A new documentary every Wednesday', W / 2, 590); return;
  }
  c.restore();
}

function thumb(c, wk, t = 2) {
  resetCtx(c); scene(c, wk.scene, t, .5); grain(c, .12, 1); vignette(c, .6);
  const g = c.createLinearGradient(0, 0, 820, 0); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 24;
  c.fillStyle = INK; fitFont(c, wk.thumb[0], 700, 150, 700); c.fillText(wk.thumb[0], 60, 330);
  c.fillStyle = RED; fitFont(c, wk.thumb[1], 700, 150, 700); c.fillText(wk.thumb[1], 60, 490); c.shadowBlur = 0;
  crest(c, 104, 620, 44); c.fillStyle = INK; c.font = `500 26px ${DISPLAY}`; spacing(c, 4); c.textBaseline = 'middle'; c.fillText('HISTORY PROS', 164, 622); spacing(c, 0);
}

/* Clickbait thumbnail: brighter scene, heavy outlined type with one yellow
 * word, a year badge, and an arrow + ring on the scene's focal point.
 * Every hook must still be true to the documentary (YouTube misleading-
 * thumbnail policy). */
const FOCUS = { shipdead: [700, 430, 150], storm: [700, 430, 150], dock: [700, 480, 150], volcano: [760, 260, 150], walls: [900, 400, 120], village: [560, 300, 110], street: [640, 470, 90], cellar: [540, 560, 140], trench: [760, 490, 120], snow: [635, 520, 110], ruins: [720, 520, 130], warship: [740, 440, 140] };
const YELLOW = '#FFD21F';
function arrowTo(c, x0, y0, x1, y1, under = false) {
  const mx = (x0 + x1) / 2, my = under ? Math.max(y0, y1) + 70 : Math.min(y0, y1) - 90, a = Math.atan2(y1 - my, x1 - mx);
  for (const [col, w] of [['#000', 30], [RED, 18]]) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1 - Math.cos(a) * 30, y1 - Math.sin(a) * 30); c.stroke();
    const hs = w * 2.4; c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - .5) * hs, y1 - Math.sin(a - .5) * hs); c.lineTo(x1 - Math.cos(a + .5) * hs, y1 - Math.sin(a + .5) * hs); c.closePath(); c.fill();
  }
}
function outlined(c, text, x, y, size, hi) {
  c.font = `700 ${size}px ${DISPLAY}`; c.lineJoin = 'round'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let cx = x; for (const word of text.split(' ')) {
    const wd = c.measureText(word + ' ').width;
    c.strokeStyle = '#000'; c.lineWidth = size * .16; c.strokeText(word, cx, y);
    c.fillStyle = word.replace(/[.,]/g, '') === hi.replace(/[.,]/g, '') ? YELLOW : '#FFFFFF'; c.fillText(word, cx, y); cx += wd;
  }
}
function thumbBait(c, wk, t = 2) {
  resetCtx(c);
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tc = tmp.getContext('2d'); resetCtx(tc); scene(tc, wk.scene, t, .5);
  c.filter = 'brightness(1.55) contrast(1.35) saturate(1.5)'; c.drawImage(tmp, 190, 0); c.filter = 'none';
  const g = c.createLinearGradient(0, 0, 760, 0); g.addColorStop(0, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const [l1, l2] = wk.cb.lines;
  const who = wk.cast && typeof person === 'function' && CAST[wk.cast[0]];
  if (who) { bustBait(c, wk, who, l1, l2); return; }
  let [fx, fy, fr] = FOCUS[wk.scene] || [760, 420, 130]; fx = Math.min(W - fr - 40, fx + 190);
  // Keep the text column clear of the ring: the text gets whatever width is left of it.
  const room = Math.max(420, W - 2 * fr - 40 - 54 - 36);
  const sz = Math.min(fitFont(c, l1, 700, 165, Math.min(620, room)), fitFont(c, l2, 700, 165, Math.min(620, room)));
  c.font = `700 ${sz}px ${DISPLAY}`; const tw = Math.max(c.measureText(l1).width, c.measureText(l2).width);
  fx = Math.min(W - fr - 40, Math.max(fx, 54 + tw + 36 + fr));
  c.strokeStyle = '#000'; c.lineWidth = 22; c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.stroke(); c.strokeStyle = RED; c.lineWidth = 12; c.stroke();
  c.save(); c.translate(54, 0); c.rotate(-.035);
  outlined(c, l1, 0, 300, sz, wk.cb.hi); outlined(c, l2, 0, 300 + sz * 1.02, sz, wk.cb.hi); c.restore();
  arrowTo(c, Math.min(560, 54 + tw * .5), 300 + sz * 1.02 + 44, fx - fr * .78, fy + fr * .5);
  c.font = `700 40px ${DISPLAY}`; const bw = c.measureText(wk.cb.badge).width + 44; c.fillStyle = RED; rrect(c, W - bw - 36, 36, bw, 64, 8); c.fill(); c.fillStyle = '#FFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(wk.cb.badge, W - bw / 2 - 36, 70);
  crest(c, W - 70, H - 70, 42);
}

/* Character bust with a drop shadow and a red glow, drawn off-canvas so the
 * whole figure casts one clean shadow. */
function bust(c, sp, x, y, s, glow = .55) {
  glowAt(c, x, y + 60 * s, 330 * s, '224,70,58', glow);
  const b = document.createElement('canvas'); b.width = W; b.height = H; const bc = b.getContext('2d'); person(bc, sp, x, y, s);
  c.save(); c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 40; c.shadowOffsetX = -14; c.drawImage(b, 0, 0); c.restore();
}

/* Clickbait layout with a character: hook text left, the person right,
 * arrow from the hook to their face, year badge top-left. */
function bustBait(c, wk, who, l1, l2) {
  const hx = 1010, hy = 318, hs = 1.55;
  bust(c, who, hx, hy, hs);
  const sz = Math.min(fitFont(c, l1, 700, 175, 640), fitFont(c, l2, 700, 175, 640));
  c.font = `700 ${sz}px ${DISPLAY}`; const tw = Math.max(c.measureText(l1).width, c.measureText(l2).width);
  const ty = 330 - (sz - 140) * .3;
  c.save(); c.translate(54, 0); c.rotate(-.035);
  outlined(c, l1, 0, ty, sz, wk.cb.hi); outlined(c, l2, 0, ty + sz * 1.02, sz, wk.cb.hi); c.restore();
  // The arrow swoops under the hook and points up at the face.
  arrowTo(c, 90 + tw * .35, ty + sz * 1.02 + 56, hx - 96 * hs, hy + 30 * hs, true);
  c.font = `700 40px ${DISPLAY}`; const bw = c.measureText(wk.cb.badge).width + 44; c.fillStyle = RED; rrect(c, 54, 60, bw, 64, 8); c.fill();
  c.fillStyle = '#FFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(wk.cb.badge, 54 + bw / 2, 94);
  crest(c, 96, H - 70, 42);
}
