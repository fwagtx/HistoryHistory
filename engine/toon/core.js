/* History Pros "toon" engine (sandbox concept).
 * Hand-drawn cartoon look: wobbly ink lines that "boil" a few times a second,
 * big expressive heads on stick bodies, costume pieces and bright flat backgrounds.
 * Needs shared.js (for the map data) loaded first. */

/* Small helpers shared with the older engines (defined here too, since the toon engine loads without them). */
var glowAt = typeof glowAt === 'function' ? glowAt : function (c, x, y, r, rgb, a) { const g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
var tone = typeof tone === 'function' ? tone : function (hex, f) { const n = parseInt(hex.slice(1), 16); const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return `rgb(${m(n >> 16 & 255)},${m(n >> 8 & 255)},${m(n & 255)})`; };

const T = { ink: '#1c1917', boil: 0, sid: 0, amp: 1 };
const TAU2 = Math.PI * 2;
function frameStart(t = 0) { T.boil = Math.floor(t * 8) % 3; T.sid = 0; }
function hr(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function jt(seed, i) { return hr(seed * 13.37 + i * 7.13 + T.boil * 101.3) - .5; }
function rng2(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- point builders ---------- */
function ell(cx, cy, rx, ry = rx, n = 0, rot = 0, a0 = 0, a1 = TAU2) {
  n = n || Math.max(12, Math.round((rx + ry) / 5));
  const pts = [], full = Math.abs(a1 - a0) >= TAU2 - 1e-6;
  for (let i = 0; i < (full ? n : n + 1); i++) { const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return pts;
}
function seg(x0, y0, x1, y1, n = 0) { n = n || Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 18)); const p = []; for (let i = 0; i <= n; i++) p.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); return p; }
function bez(p0, p1, p2, p3, n = 12) { const p = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return p; }
function qb(p0, p1, p2, n = 10) { const p = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return p; }
/* Polygon with sharp corners: edges subdivided, corners doubled so smoothing keeps them crisp. */
function poly(pts, step = 22, closed = true) {
  const out = [], n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    out.push(a, a); for (let j = 1; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  if (!closed) out.push(pts[n - 1], pts[n - 1]);
  return out;
}
function rect(x, y, w, h) { return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); }

/* ---------- hand-drawn path ---------- */
function hpath(c, pts, closed, amp, seed) {
  const P = pts.map((p, i) => [p[0] + jt(seed, i) * 2 * amp, p[1] + jt(seed + .37, i) * 2 * amp]);
  c.beginPath(); const n = P.length;
  if (n < 2) return;
  if (closed) {
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let m = mid(P[n - 1], P[0]); c.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const m2 = mid(P[i], P[(i + 1) % n]); c.quadraticCurveTo(P[i][0], P[i][1], m2[0], m2[1]); }
    c.closePath();
  } else {
    c.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < n - 1; i++) c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
    c.lineTo(P[n - 1][0], P[n - 1][1]);
  }
}
/* Draw a hand-inked shape. o: fill, w (line width), open, amp, noStroke, color */
function hd(c, pts, o = {}) {
  const seed = ++T.sid, amp = (o.amp ?? 1.1) * T.amp;
  hpath(c, pts, !o.open, amp, seed);
  if (o.fill && !o.open) { c.fillStyle = o.fill; c.fill(); }
  if (o.w !== 0 && !o.noStroke) { c.strokeStyle = o.color || T.ink; c.lineWidth = o.w ?? 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
}
function line(c, pts, w = 5, color, amp) { hd(c, pts, { open: true, w, color, amp }); }
/* A soft cel shadow inside the last shape drawn by fn. */
function shade(c, fn, col = 'rgba(0,0,0,.12)', dx = 14, dy = 0) { c.save(); fn(); c.clip(); c.translate(dx, dy); c.fillStyle = col; fn(); c.fill(); c.restore(); }

/* ---------- colors ---------- */
const SKIN = { peach: '#F6D2B0', light: '#FBE3CC', tan: '#E0AE82', olive: '#D49A6A', brown: '#A86E47', dark: '#6E4429', white: '#FAFAF7' };
const CLR = { red: '#D63A2F', blue: '#2F6FC2', navy: '#1F2E55', green: '#4E9A3A', gold: '#F2B632', grey: '#9AA3AB', steel: '#C3CAD0', brown: '#8A5A34', cream: '#F4ECD8', black: '#262322', purple: '#6A3E8E', white: '#FFFFFF', khaki: '#A99A63', olive: '#6D7340', orange: '#EE8A2A', pink: '#F2A0A6', sky: '#8CCBF2' };

/* ============================================================
 * Characters
 * guy(c, x, y, s, o, t)  x,y = head centre. Head radius 50 units; figure ~350 units tall.
 * o: skin, eyes ('dot'|'big'), mood (neutral|happy|shock|angry|scared|smug|sad|shout|talk),
 *    look (-1..1, face turn), hat, hair, hairColor, beard, stache, outfit, color, color2,
 *    la/ra ([upper, fore] arm angles in degrees from straight down, +x is screen right),
 *    legs ('stand'|'walk'|'run'|'sit'), hold (spear|sword|torch|scroll|flag|bottle|pitchfork|ball|rifle|lantern), talk (animate mouth)
 * ============================================================ */
const R = 50;
function armPts(sx, sy, a1, a2, l1 = 56, l2 = 52) {
  const r1 = a1 * Math.PI / 180, r2 = (a1 + a2) * Math.PI / 180;
  const ex = sx + Math.sin(r1) * l1, ey = sy + Math.cos(r1) * l1, hx = ex + Math.sin(r2) * l2, hy = ey + Math.cos(r2) * l2;
  return [[sx, sy], [ex, ey], [hx, hy]];
}
function guy(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  const skin = SKIN[o.skin || 'peach'] || o.skin, look = o.look ?? 0;
  const long = ['robe', 'dress', 'mitre', 'toga', 'spacesuit'].includes(o.outfit) || o.long;
  // Legs
  let ll = [-10, 4], rl = [10, -4];
  if (o.legs === 'walk' || o.legs === 'run') { const k = o.legs === 'run' ? 34 : 20, ph = Math.sin(t * (o.legs === 'run' ? 12 : 7)); ll = [ph * k, Math.max(0, -ph) * k * .9]; rl = [-ph * k, Math.max(0, ph) * k * .9]; }
  if (o.legs === 'sit') { ll = [-70, -80]; rl = [-60, -84]; }
  const hip = [0, 178];
  if (!long || o.legs === 'sit') for (const [a1, a2] of [ll, rl]) { const p = armPts(hip[0], hip[1], a1, a2, 64, 60); line(c, p, 7); const f = p[2]; hd(c, ell(f[0] + 9, f[1] + 2, 13, 6), { fill: o.shoe || T.ink, w: 3 }); }
  else for (const sx of [-1, 1]) hd(c, ell(sx * 16 + 6, 296, 13, 6), { fill: o.shoe || T.ink, w: 3 });
  // Torso / outfit
  outfit(c, o, t);
  // Arms (behind-hand props first)
  const sh = [0, 76];
  const la = o.la || [-22, -8], ra = o.ra || [22, 8];
  const L = armPts(-4, sh[1], la[0], la[1]), Rr = armPts(4, sh[1], ra[0], ra[1]);
  if (o.hold) prop(c, o.hold, Rr[2], ra[0] + ra[1], t, o);
  for (const p of [L, Rr]) { line(c, p, 7); hd(c, ell(p[2][0], p[2][1], 8.5, 8.5), { fill: skin, w: 3.5 }); }
  if (o.hold2) prop(c, o.hold2, L[2], la[0] + la[1], t, o);
  // Head
  if (o.hat === 'hood' || o.hat === 'coif') hatBack(c, o);
  hairBack(c, o);
  const hp = () => ell(0, 0, R + (o.wide ? 5 : 0), R + (o.tall ? 6 : 0), 28);
  hd(c, hp(), { fill: skin, w: 5 });
  c.save(); hpath(c, ell(0, 0, R, R, 28), true, 0, 0); c.clip(); c.fillStyle = 'rgba(120,60,30,.10)'; c.beginPath(); c.arc(18 - look * 10, 8, R, 0, TAU2); c.rect(-200, -200, 400, 400); c.fill('evenodd'); c.restore();
  // Ears
  for (const sx of [-1, 1]) if (Math.abs(look) < .6 || sx * look < 0) hd(c, ell(sx * (R - 2) - look * 6, 6, 8, 11), { fill: skin, w: 3.5 });
  face(c, o, t, skin);
  hairFront(c, o);
  hat(c, o, t);
  c.restore();
}

function face(c, o, t, skin) {
  const look = o.look ?? 0, fx = look * 14, mood = o.mood || 'neutral', big = o.eyes === 'big' || ['shock', 'scared', 'angry', 'shout'].includes(mood) && o.eyes !== 'dot';
  const blink = !o.noBlink && ((t + (o.phase || 0)) % 3.7) > 3.58;
  // Eyes
  const ey = -6, ex = 18;
  for (const sx of [-1, 1]) {
    const x = fx + sx * ex, sq = sx * look > .3 ? .8 : 1;
    if (blink || mood === 'happy' && !big) { line(c, qb([x - 9, ey + 2], [x, ey - 7], [x + 9, ey + 2]), 4.5); continue; }
    if (big) {
      const rx = (mood === 'shock' || mood === 'scared' ? 13 : 11.5) * sq, ry = mood === 'shock' || mood === 'scared' ? 16 : mood === 'angry' || mood === 'smug' ? 9 : 13;
      hd(c, ell(x, ey, rx, ry), { fill: '#FFFFFF', w: 3.5 });
      const pr = mood === 'shock' ? 3.2 : mood === 'scared' ? 3.8 : 5, gx = (o.gaze ?? look) * 5;
      c.fillStyle = T.ink; c.beginPath(); c.arc(x + gx, ey + (mood === 'smug' ? 2 : 1), pr, 0, TAU2); c.fill();
      if (mood === 'angry' || mood === 'smug') { c.fillStyle = skin; c.beginPath(); c.rect(x - rx - 2, ey - ry - 4, rx * 2 + 4, ry * (mood === 'smug' ? .9 : .6) + 2); c.fill(); line(c, seg(x - rx, ey - ry * (mood === 'smug' ? .1 : .4), x + rx, ey - ry * (mood === 'smug' ? .1 : .4), 3), 3.5); }
      if (o.bags || mood === 'scared') line(c, qb([x - 9, ey + ry + 4], [x, ey + ry + 9], [x + 9, ey + ry + 4]), 2.2, 'rgba(60,40,30,.6)');
    } else { hd(c, ell(x + (o.gaze ?? look) * 2, ey, 5 * sq, 7.5), { fill: T.ink, w: 0 }); c.fillStyle = '#FFF'; c.beginPath(); c.arc(x + (o.gaze ?? look) * 2 - 1.5, ey - 3, 1.8, 0, TAU2); c.fill(); }
  }
  // Brows
  const by = big ? ey - 22 : ey - 17, bw = o.brows ?? 4.5;
  for (const sx of [-1, 1]) {
    const x = fx + sx * ex; let pts;
    if (mood === 'angry' || mood === 'shout') pts = seg(x - sx * 13, by - 4, x + sx * 8, by + 6, 3);
    else if (mood === 'sad' || mood === 'scared') pts = seg(x - sx * 10, by + 5, x + sx * 10, by - 3, 3);
    else if (mood === 'shock') pts = qb([x - 11, by - 4], [x, by - 12], [x + 11, by - 4]);
    else if (mood === 'smug') pts = sx < 0 ? seg(x - 11, by + 2, x + 10, by + 3, 3) : qb([x - 11, by - 2], [x, by - 10], [x + 11, by - 3]);
    else pts = qb([x - 11, by], [x, by - 5], [x + 11, by]);
    line(c, pts, bw);
  }
  // Nose
  if (o.nose !== false) line(c, look > .2 ? qb([fx + 6, 6], [fx + 14, 14], [fx + 4, 18]) : look < -.2 ? qb([fx - 6, 6], [fx - 14, 14], [fx - 4, 18]) : qb([fx - 2, 8], [fx + 5, 16], [fx - 3, 18]), 3.2);
  if (o.stubble) { c.fillStyle = 'rgba(40,30,25,.45)'; const r = rng2(7); for (let i = 0; i < 40; i++) { const a = Math.PI * (.15 + r() * .7), d = 30 + r() * 16; c.beginPath(); c.arc(Math.cos(a) * d * .9 + fx * .5, Math.sin(a) * d * .85 + 6, 1.2, 0, TAU2); c.fill(); } }
  if (o.beard) beard(c, o, fx);
  // Mouth
  let m = mood; if (o.talk) { const k = Math.floor(t * 9 + (o.phase || 0)) % 4; m = ['talkA', 'talkB', 'talkA', 'talkC'][k]; }
  const my = 30, mx = fx * 1.1;
  const dark = '#5A1614', tongue = '#E0625A';
  const openMouth = (w, h, teeth = true) => { hd(c, bez([mx - w, my - 2], [mx - w * .8, my + h * 1.2], [mx + w * .8, my + h * 1.2], [mx + w, my - 2], 12).concat([[mx, my - 4]]), { fill: dark, w: 3.5 }); c.save(); hpath(c, bez([mx - w, my - 2], [mx - w * .8, my + h * 1.2], [mx + w * .8, my + h * 1.2], [mx + w, my - 2], 12), true, 0, 0); c.clip(); if (teeth) { c.fillStyle = '#FFF'; c.fillRect(mx - w, my - 4, w * 2, h * .28); } c.fillStyle = tongue; c.beginPath(); c.ellipse(mx, my + h * .95, w * .55, h * .35, 0, 0, TAU2); c.fill(); c.restore(); };
  if (m === 'happy' || m === 'talkB') openMouth(15, 13);
  else if (m === 'shock') hd(c, ell(mx, my + 5, 9, 12), { fill: dark, w: 3.5 });
  else if (m === 'scared') { hd(c, poly([[mx - 16, my + 4], [mx - 8, my - 2], [mx, my + 4], [mx + 8, my - 2], [mx + 16, my + 4]], 8, false), { open: true, w: 3.5 }); }
  else if (m === 'shout') { openMouth(20, 24); }
  else if (m === 'angry') line(c, qb([mx - 14, my + 6], [mx, my - 3], [mx + 14, my + 6]), 4);
  else if (m === 'sad') line(c, qb([mx - 12, my + 6], [mx, my - 2], [mx + 12, my + 6]), 4);
  else if (m === 'smug') line(c, qb([mx - 12, my + 2], [mx + 4, my + 6], [mx + 15, my - 3]), 4);
  else if (m === 'talkA') openMouth(10, 8, false);
  else if (m === 'talkC') hd(c, ell(mx, my + 3, 7, 6), { fill: dark, w: 3.5 });
  else line(c, qb([mx - 12, my], [mx, my + 6], [mx + 12, my]), 4);
  if (o.stache) stache(c, o, fx);
  if (o.blush || mood === 'happy') for (const sx of [-1, 1]) { c.fillStyle = 'rgba(235,110,100,.35)'; c.beginPath(); c.ellipse(fx + sx * 30, 16, 9, 5, 0, 0, TAU2); c.fill(); }
  if (o.sweat || mood === 'scared') hd(c, [[46, -30], [52, -16], [48, -10], [42, -14]], { fill: '#9ED8F5', w: 2.5 });
  if (o.glasses) { for (const sx of [-1, 1]) hd(c, ell(fx + sx * 18, -6, 14, 12), { fill: 'rgba(200,230,255,.25)', w: 3.5 }); line(c, seg(fx - 4, -8, fx + 4, -8, 2), 3); }
}
function beard(c, o, fx) {
  const col = o.hairColor || '#4A3322', b = o.beard;
  if (b === 'full') hd(c, bez([-46, 6], [-50, 70], [50, 70], [46, 6], 14).concat(bez([38, 24], [20, 40], [-20, 40], [-38, 24], 8)), { fill: col, w: 4 });
  else if (b === 'long') hd(c, bez([-44, 10], [-40, 120], [40, 120], [44, 10], 16).concat(bez([36, 26], [20, 44], [-20, 44], [-36, 26], 8)), { fill: col, w: 4 });
  else if (b === 'goatee') hd(c, bez([-14, 44], [-12, 66], [12, 66], [14, 44], 8), { fill: col, w: 3.5 });
  if (b) { c.save(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 9 + fx * .3, 48); c.lineTo(i * 10 + fx * .3, b === 'long' ? 96 : 62); c.stroke(); } c.restore(); }
}
function stache(c, o, fx) {
  const col = o.hairColor || '#4A3322';
  if (o.stache === 'bush') hd(c, bez([fx - 26, 26], [fx - 20, 12], [fx + 20, 12], [fx + 26, 26], 10).concat(bez([fx + 18, 24], [fx + 6, 20], [fx - 6, 20], [fx - 18, 24], 6)), { fill: col, w: 3.5 });
  else if (o.stache === 'handlebar') { hd(c, bez([fx - 34, 14], [fx - 24, 28], [fx - 8, 16], [fx, 21], 8).concat(bez([fx, 21], [fx + 8, 16], [fx + 24, 28], [fx + 34, 14], 8), bez([fx + 30, 20], [fx + 16, 26], [fx - 16, 26], [fx - 30, 20], 6)), { fill: col, w: 3.5 }); }
  else hd(c, [[fx - 16, 22], [fx - 4, 17], [fx + 4, 17], [fx + 16, 22], [fx + 4, 22], [fx - 4, 22]], { fill: col, w: 3 });
}
function hairBack(c, o) {
  const col = o.hairColor || '#3A2618';
  if (o.hair === 'long') hd(c, bez([-50, -20], [-78, 60], [-60, 110], [-40, 118], 10).concat([[40, 118]], bez([40, 118], [60, 110], [78, 60], [50, -20], 10)), { fill: col, w: 4.5 });
  if (o.hair === 'bun') hd(c, ell(0, -58, 22, 18), { fill: col, w: 4 });
}
function hairFront(c, o) {
  const col = o.hairColor || '#3A2618', h = o.hair;
  if (!h || h === 'bald' || o.hat && ['knight', 'goldhelm', 'roman', 'viking', 'brodie', 'pickel', 'spacehelm', 'hood', 'coif', 'mitre', 'turban', 'bonnet'].includes(o.hat)) { if (h === 'bald') for (const sx of [-1, 1]) hd(c, ell(sx * 44, -18, 10, 16, 10, sx * .4), { fill: col, w: 3.5 }); return; }
  if (h === 'short' || h === 'long' || h === 'bun') hd(c, bez([-51, 4], [-60, -70], [60, -70], [51, 4], 16).concat(bez([46, -18], [20, -34], [-10, -30], [-46, -16], 10)), { fill: col, w: 4.5 });
  if (h === 'curly') { for (let i = 0; i < 11; i++) { const a = Math.PI * (1.05 + i * .09); hd(c, ell(Math.cos(a) * 48, Math.sin(a) * 48 + 4, 15, 15), { fill: col, w: 3.5 }); } }
  if (h === 'side') hd(c, bez([-51, -4], [-56, -64], [40, -72], [52, -10], 14).concat(bez([40, -30], [0, -46], [-20, -30], [-46, -10], 8)), { fill: col, w: 4.5 });
  if (h === 'spiky') hd(c, poly([[-50, -8], [-48, -44], [-30, -40], [-26, -70], [-8, -50], [4, -76], [16, -52], [34, -68], [36, -40], [50, -40], [50, -8], [30, -30], [-30, -30]], 12), { fill: col, w: 4 });
}
function hatBack(c, o) {
  if (o.hat === 'hood') hd(c, bez([-68, 70], [-86, -40], [-40, -82], [0, -82], 10).concat(bez([0, -82], [40, -82], [86, -40], [68, 70], 10)), { fill: o.hatColor || '#7A5A3A', w: 5 });
  if (o.hat === 'coif') hd(c, bez([-64, 60], [-78, -40], [-40, -74], [0, -74], 10).concat(bez([0, -74], [40, -74], [78, -40], [64, 60], 10)), { fill: '#8E979E', w: 5 });
}

/* ---------- hats ---------- */
function hat(c, o, t) {
  const h = o.hat, col = o.hatColor; if (!h) return;
  const gold = CLR.gold, goldD = '#C98A14';
  switch (h) {
    case 'knight': { // mail coif around the face, steel cap, visor raised
      c.save(); c.beginPath(); c.rect(-120, -140, 240, 260); c.ellipse(0, 6, 40, 44, 0, 0, TAU2); c.clip('evenodd');
      hd(c, bez([-60, 70], [-74, -30], [-50, -70], [0, -70], 10).concat(bez([0, -70], [50, -70], [74, -30], [60, 70], 10)), { fill: '#8E979E', w: 5 });
      c.strokeStyle = 'rgba(40,40,50,.35)'; c.lineWidth = 2; for (let yy = -50; yy < 70; yy += 9) for (let xx = -64; xx < 64; xx += 9) { c.beginPath(); c.arc(xx + (yy / 9 % 2) * 4, yy, 3, 0, Math.PI); c.stroke(); }
      c.restore(); hd(c, ell(0, 6, 40, 44), { w: 4 });
      hd(c, bez([-58, -30], [-60, -104], [60, -104], [58, -30], 16), { fill: '#C3CAD0', w: 5 });
      shade(c, () => hpath(c, bez([-58, -30], [-60, -104], [60, -104], [58, -30], 16), true, 0, 0), 'rgba(40,50,60,.18)', 18);
      c.save(); c.translate(0, -70); c.rotate(-.12); hd(c, poly([[-62, -6], [62, -6], [58, -44], [-58, -44]], 14), { fill: '#D6DCE0', w: 5 }); c.fillStyle = T.ink; for (let i = -4; i <= 4; i++) c.fillRect(i * 12 - 2, -36, 4, 22); c.restore();
      for (const sx of [-1, 1]) hd(c, ell(sx * 54, -40, 5, 5), { fill: '#6C747B', w: 2 });
      break; }
    case 'goldhelm': {
      hd(c, bez([-56, -4], [-60, -80], [60, -80], [56, -4], 16), { fill: gold, w: 5 });
      shade(c, () => hpath(c, bez([-56, -4], [-60, -80], [60, -80], [56, -4], 16), true, 0, 0), 'rgba(160,90,0,.25)', 16);
      hd(c, rect(-60, -16, 120, 16), { fill: goldD, w: 4 }); c.fillStyle = '#FFF3B0'; for (let i = -5; i <= 5; i++) { c.beginPath(); c.arc(i * 11, -8, 3, 0, TAU2); c.fill(); }
      for (const sx of [-1, 1]) line(c, [[sx * 8, -60], [sx * 26, -56], [sx * 30, -40], [sx * 18, -34], [sx * 14, -44]], 3.5, '#8A5A0A');
      hd(c, poly([[-6, -68], [0, -92], [6, -68]], 8), { fill: goldD, w: 4 });
      hd(c, bez([-56, -6], [-66, 40], [-60, 70], [-48, 76], 8).concat([[-40, 30]]), { fill: '#8E979E', w: 4 }); hd(c, bez([56, -6], [66, 40], [60, 70], [48, 76], 8).concat([[40, 30]]), { fill: '#8E979E', w: 4 });
      break; }
    case 'roman': {
      hd(c, bez([-54, -6], [-58, -76], [58, -76], [54, -6], 16), { fill: '#C9A04A', w: 5 });
      hd(c, bez([-50, -40], [-40, -118], [40, -118], [50, -40], 16).concat(bez([40, -56], [20, -84], [-20, -84], [-40, -56], 8)), { fill: CLR.red, w: 5 });
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 2; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 9, -110 + Math.abs(i) * 3); c.lineTo(i * 8, -80); c.stroke(); }
      for (const sx of [-1, 1]) hd(c, poly([[sx * 50, -12], [sx * 56, 30], [sx * 40, 44], [sx * 36, 0]], 10), { fill: '#C9A04A', w: 4 });
      hd(c, rect(-58, -14, 116, 12), { fill: '#A8802A', w: 4 });
      break; }
    case 'viking': {
      hd(c, bez([-54, -4], [-58, -84], [58, -84], [54, -4], 16), { fill: '#9AA3AB', w: 5 });
      hd(c, rect(-56, -16, 112, 14), { fill: '#6F5134', w: 4 }); hd(c, rect(-6, -76, 12, 60), { fill: '#6F5134', w: 3.5 });
      hd(c, poly([[-7, -16], [7, -16], [5, 20], [-5, 20]], 8), { fill: '#9AA3AB', w: 4 });
      break; }
    case 'laurel': for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + sx * (.35 + i * .22); hd(c, ell(Math.cos(a) * 52, -12 + Math.sin(a) * 50, 12, 6, 8, a + sx * 1.1), { fill: '#6E9A3A', w: 2.8 }); } break;
    case 'crown': hd(c, poly([[-44, -38], [-50, -92], [-26, -64], [0, -100], [26, -64], [50, -92], [44, -38]], 12), { fill: gold, w: 5 }); for (const x of [-24, 0, 24]) hd(c, ell(x, -50, 6, 6), { fill: CLR.red, w: 2.5 }); break;
    case 'mitre': hd(c, poly([[-40, -36], [-44, -104], [0, -150], [44, -104], [40, -36]], 14), { fill: '#FBF7EE', w: 5 }); hd(c, rect(-8, -146, 16, 110), { fill: gold, w: 3 }); hd(c, rect(-42, -52, 84, 16), { fill: gold, w: 3.5 }); break;
    case 'plague': hd(c, ell(0, -46, 92, 20), { fill: '#262322', w: 5 }); hd(c, bez([-44, -48], [-46, -104], [46, -104], [44, -48], 12), { fill: '#262322', w: 5 }); hd(c, rect(-44, -66, 88, 12), { fill: '#5A3A2A', w: 3 }); break;
    case 'beak': // plague doctor mask over the face
      hd(c, bez([-36, -20], [20, -40], [110, 40], [120, 70], 12).concat(bez([120, 70], [80, 50], [20, 40], [-30, 30], 10)), { fill: '#E9DCC0', w: 4.5 });
      for (const sx of [-1, 1]) hd(c, ell(sx * 20 - 4, -6, 13, 13), { fill: '#3B5C4A', w: 4 });
      hd(c, ell(0, -46, 92, 20), { fill: '#262322', w: 5 }); hd(c, bez([-44, -48], [-46, -104], [46, -104], [44, -48], 12), { fill: '#262322', w: 5 }); break;
    case 'capotain': hd(c, ell(0, -40, 84, 16), { fill: '#1E1C1B', w: 5 }); hd(c, poly([[-40, -44], [-34, -130], [34, -130], [40, -44]], 14), { fill: '#1E1C1B', w: 5 }); hd(c, rect(-40, -62, 80, 14), { fill: '#3A3634', w: 3 }); hd(c, rect(-12, -64, 24, 18), { fill: gold, w: 3 }); break;
    case 'tophat': hd(c, ell(0, -42, 76, 14), { fill: '#1E1C1B', w: 5 }); hd(c, poly([[-40, -46], [-42, -150], [42, -150], [40, -46]], 14), { fill: '#1E1C1B', w: 5 }); hd(c, rect(-40, -70, 80, 16), { fill: '#3A3634', w: 3 }); break;
    case 'bowler': hd(c, ell(0, -40, 72, 13), { fill: col || '#2A2624', w: 5 }); hd(c, bez([-44, -44], [-48, -110], [48, -110], [44, -44], 12), { fill: col || '#2A2624', w: 5 }); break;
    case 'captain': hd(c, bez([-50, -30], [-54, -60], [54, -60], [50, -30], 12).concat([[50, -30]]), { fill: '#FFFFFF', w: 5 }); hd(c, ell(0, -64, 60, 18), { fill: '#FFFFFF', w: 5 }); hd(c, rect(-50, -40, 100, 16), { fill: CLR.navy, w: 4 }); hd(c, bez([-40, -26], [-20, -8], [40, -8], [58, -26], 8).concat([[40, -24]]), { fill: '#141414', w: 4 }); hd(c, ell(0, -54, 10, 8), { fill: gold, w: 3 }); break;
    case 'brodie': line(c, qb([-44, -30], [0, 150], [44, -30]), 3, '#5A3A20'); hd(c, ell(0, -34, 84, 18), { fill: col || '#6D7340', w: 5 }); hd(c, bez([-50, -38], [-52, -96], [52, -96], [50, -38], 12), { fill: col || '#6D7340', w: 5 }); break;
    case 'slouch': hd(c, ell(0, -34, 92, 18), { fill: '#8A7650', w: 5 }); hd(c, bez([-48, -38], [-50, -100], [50, -100], [48, -38], 12), { fill: '#8A7650', w: 5 }); hd(c, rect(-48, -58, 96, 12), { fill: '#3A2E22', w: 3 }); hd(c, bez([-92, -36], [-96, -90], [-60, -110], [-44, -60], 10).concat([[-50, -36]]), { fill: '#7A6644', w: 4.5 }); hd(c, ell(-62, -64, 9, 9), { fill: CLR.gold, w: 2.5 }); break;
    case 'pickel': hd(c, bez([-50, -26], [-54, -96], [54, -96], [50, -26], 12), { fill: '#2A2A2A', w: 5 }); hd(c, poly([[-8, -84], [0, -128], [8, -84]], 8), { fill: '#9AA3AB', w: 4 }); hd(c, ell(0, -54, 12, 14), { fill: gold, w: 3 }); hd(c, bez([-50, -28], [-30, -12], [40, -12], [62, -24], 8).concat([[40, -22]]), { fill: '#1A1A1A', w: 4 }); break;
    case 'turban': hd(c, bez([-56, -4], [-66, -96], [66, -96], [56, -4], 16), { fill: col || '#FFFFFF', w: 5 }); for (let i = 0; i < 3; i++) line(c, qb([-54, -20 - i * 20], [0, -40 - i * 20], [54, -20 - i * 20]), 2.5, 'rgba(0,0,0,.25)'); hd(c, ell(0, -46, 9, 9), { fill: CLR.red, w: 3 }); break;
    case 'bonnet': hd(c, bez([-60, 30], [-72, -80], [72, -80], [60, 30], 16).concat(bez([48, 10], [44, -48], [-44, -48], [-48, 10], 10)), { fill: '#FBF7EE', w: 5 }); break;
    case 'straw': hd(c, ell(0, -38, 92, 16), { fill: '#E8C872', w: 5 }); hd(c, bez([-46, -42], [-48, -94], [48, -94], [46, -42], 12), { fill: '#E8C872', w: 5 }); hd(c, rect(-46, -56, 92, 12), { fill: CLR.red, w: 3 }); break;
    case 'cap': hd(c, bez([-52, -18], [-56, -84], [56, -84], [52, -18], 12), { fill: col || CLR.blue, w: 5 }); hd(c, bez([30, -22], [70, -24], [96, -10], [96, -2], 6).concat([[30, -12]]), { fill: col || CLR.blue, w: 4 }); break;
    case 'sailorcap': hd(c, bez([-54, -14], [-60, -80], [30, -96], [70, -60], 12).concat(bez([70, -60], [96, -40], [90, -10], [60, -18], 8), [[52, -14]]), { fill: col || CLR.red, w: 5 }); hd(c, rect(-54, -22, 108, 14), { fill: '#F4ECD8', w: 3.5 }); break;
    case 'aviator': hd(c, bez([-54, 10], [-60, -80], [60, -80], [54, 10], 16), { fill: '#7A4E2A', w: 5 }); for (const sx of [-1, 1]) hd(c, ell(sx * 20, -46, 16, 12), { fill: '#BFE3F5', w: 4 }); line(c, seg(-56, -46, 56, -46, 6), 4); break;
    case 'spacehelm': hd(c, ell(0, 0, 80, 80), { fill: 'rgba(200,230,255,.25)', w: 5 }); line(c, ell(0, 0, 66, 66, 16, 0, Math.PI * 1.1, Math.PI * 1.45), 5, 'rgba(255,255,255,.8)'); break;
    case 'tricorn': hd(c, poly([[-80, -34], [-40, -96], [40, -96], [80, -34], [0, -52]], 14), { fill: '#262322', w: 5 }); line(c, poly([[-76, -38], [0, -56], [76, -38]], 12, false), 3, gold); break;
    case 'headscarf': hd(c, bez([-58, 20], [-70, -86], [70, -86], [58, 20], 16).concat(bez([48, 0], [44, -44], [-44, -44], [-48, 0], 10)), { fill: col || CLR.red, w: 5 }); break;
  }
}

/* ---------- outfits ---------- */
function outfit(c, o, t) {
  const col = o.color || CLR.blue, col2 = o.color2 || CLR.gold, f = o.outfit;
  const trap = (tw, bw, top, bot, fill) => hd(c, poly([[-tw, top], [tw, top], [bw, bot], [-bw, bot]], 20), { fill, w: 5 });
  if (!f) { line(c, seg(0, 50, 0, 178), 7); return; }
  line(c, seg(0, 50, 0, 80), 7);
  switch (f) {
    case 'tunic': trap(24, 40, 70, 214, col); hd(c, rect(-32, 160, 64, 12), { fill: CLR.brown, w: 3.5 }); break;
    case 'rags': hd(c, poly([[-24, 70], [24, 70], [40, 200], [30, 216], [18, 202], [6, 220], [-6, 204], [-18, 222], [-30, 204], [-40, 214]], 16), { fill: col || '#B89A6A', w: 5 }); line(c, seg(-28, 162, 30, 158), 5, '#6A4A2A'); break;
    case 'robe': trap(26, 56, 70, 296, col); line(c, seg(0, 80, 0, 290), 3, 'rgba(0,0,0,.25)'); hd(c, rect(-36, 160, 72, 12), { fill: col2, w: 3.5 }); break;
    case 'toga': trap(24, 48, 70, 290, '#F7F3E8'); hd(c, poly([[-24, 70], [-4, 70], [40, 220], [26, 228]], 12), { fill: CLR.red, w: 4 }); break;
    case 'mitre': trap(26, 58, 70, 296, '#FBF7EE'); hd(c, poly([[-30, 72], [30, 72], [36, 150], [-36, 150]], 14), { fill: CLR.red, w: 4 }); hd(c, rect(-8, 150, 16, 140), { fill: col2, w: 3.5 }); break;
    case 'crusader': trap(26, 42, 70, 220, '#8E979E'); hd(c, poly([[-22, 80], [22, 80], [34, 226], [-34, 226]], 18), { fill: '#FBF7EE', w: 4.5 }); hd(c, poly([[-6, 110], [6, 110], [6, 140], [26, 140], [26, 152], [6, 152], [6, 200], [-6, 200], [-6, 152], [-26, 152], [-26, 140], [-6, 140]], 8), { fill: CLR.red, w: 3 }); hd(c, rect(-34, 166, 68, 10), { fill: CLR.brown, w: 3 }); break;
    case 'saracen': trap(26, 42, 70, 220, '#8E979E'); hd(c, poly([[-24, 80], [24, 80], [36, 226], [-36, 226]], 18), { fill: col || '#2F7A6A', w: 4.5 }); hd(c, rect(-36, 160, 72, 14), { fill: CLR.gold, w: 3.5 }); break;
    case 'coat': trap(26, 42, 70, 250, col || CLR.navy); line(c, seg(0, 80, 0, 246), 3, 'rgba(0,0,0,.35)'); for (let i = 0; i < 4; i++) { hd(c, ell(-10, 100 + i * 32, 4, 4), { fill: CLR.gold, w: 2 }); hd(c, ell(10, 100 + i * 32, 4, 4), { fill: CLR.gold, w: 2 }); } break;
    case 'suit': trap(26, 34, 70, 196, col || '#2A2E3A'); hd(c, poly([[-8, 72], [8, 72], [4, 130], [0, 136], [-4, 130]], 8), { fill: o.tie || CLR.red, w: 3 }); line(c, poly([[-24, 72], [0, 130], [24, 72]], 12, false), 3); break;
    case 'uniform': { const uc = o.color || CLR.khaki; trap(26, 38, 70, 206, uc); hd(c, rect(-34, 150, 68, 10), { fill: '#5A3A20', w: 3 }); line(c, seg(-24, 72, 30, 150), 4, '#5A3A20'); for (const sx of [-1, 1]) hd(c, rect(sx * 18 - 7, 94, 14, 14), { fill: uc, w: 2.5 }); break; }
    case 'dress': trap(22, 60, 70, 296, col || '#2A2624'); hd(c, poly([[-26, 70], [26, 70], [18, 96], [-18, 96]], 10), { fill: '#FBF7EE', w: 3.5 }); if (o.apron) hd(c, poly([[-26, 140], [26, 140], [36, 280], [-36, 280]], 14), { fill: '#FBF7EE', w: 3.5 }); break;
    case 'spacesuit': trap(34, 50, 64, 280, '#F4F4F2'); hd(c, rect(-22, 104, 44, 30), { fill: '#D0D4D8', w: 3 }); for (const [i, cc] of [[0, CLR.red], [1, CLR.blue], [2, CLR.gold]]) hd(c, ell(-12 + i * 12, 119, 3.5, 3.5), { fill: cc, w: 1.5 }); break;
    case 'overalls': trap(24, 36, 70, 196, '#E8E2D0'); hd(c, poly([[-22, 110], [22, 110], [30, 200], [-30, 200]], 14), { fill: col || '#3A5E9A', w: 4 }); for (const sx of [-1, 1]) line(c, seg(sx * 18, 72, sx * 18, 112), 5, col || '#3A5E9A'); break;
    case 'sailor': trap(24, 36, 70, 200, '#FFFFFF'); hd(c, poly([[-26, 70], [26, 70], [0, 110]], 10), { fill: CLR.navy, w: 3.5 }); hd(c, rect(-30, 150, 60, 10), { fill: CLR.navy, w: 3 }); break;
    default: trap(24, 40, 70, 214, col);
  }
}

/* ---------- props held in the right hand ---------- */
function prop(c, p, h, ang, t, o) {
  c.save(); c.translate(h[0], h[1]);
  switch (p) {
    case 'spear': line(c, seg(0, 120, 0, -170), 6, '#6A4428'); hd(c, poly([[-10, -166], [0, -206], [10, -166]], 8), { fill: '#B9C1C8', w: 4 }); break;
    case 'sword': c.rotate((o.swordAng ?? -150) * Math.PI / 180); hd(c, poly([[-5, 10], [5, 10], [4, 120], [0, 132], [-4, 120]], 14), { fill: '#DCE2E6', w: 3.5 }); hd(c, rect(-20, 4, 40, 8), { fill: CLR.gold, w: 3 }); hd(c, rect(-4, -18, 8, 22), { fill: '#6A4428', w: 3 }); break;
    case 'torch': line(c, seg(0, 40, 0, -60), 7, '#6A4428'); { const fl = Math.sin(t * 14) * 4; hd(c, bez([-14, -60], [-22, -90], [0, -110 + fl], [0, -124 + fl], 8).concat(bez([0, -124 + fl], [6, -104], [26, -90], [14, -60], 8)), { fill: CLR.orange, w: 3.5 }); hd(c, bez([-6, -64], [-10, -80], [0, -92], [0, -100], 6).concat(bez([0, -100], [4, -88], [12, -78], [6, -64], 6)), { fill: '#FFE070', w: 0 }); } break;
    case 'scroll': hd(c, rect(-6, -30, 44, 56), { fill: '#F4E6C2', w: 3.5 }); hd(c, ell(-6, -2, 6, 30), { fill: '#E3CFA0', w: 3.5 }); hd(c, ell(38, -2, 6, 30), { fill: '#E3CFA0', w: 3.5 }); for (let i = 0; i < 4; i++) line(c, seg(4, -16 + i * 10, 28, -16 + i * 10, 2), 2, 'rgba(0,0,0,.4)'); break;
    case 'flag': line(c, seg(0, 60, 0, -170), 6, '#6A4428'); hd(c, poly([[0, -168], [90, -150], [0, -110]], 14), { fill: o.flagColor || CLR.red, w: 4 }); break;
    case 'pitchfork': line(c, seg(0, 100, 0, -140), 6, '#6A4428'); line(c, poly([[-18, -170], [-18, -140], [18, -140], [18, -170]], 10, false), 5); line(c, seg(0, -140, 0, -172), 5); break;
    case 'ball': hd(c, ell(18, 6, 18, 18), { fill: '#FFFFFF', w: 3.5 }); hd(c, poly([[12, 0], [22, -2], [26, 8], [18, 14], [10, 8]], 6), { fill: T.ink, w: 1 }); break;
    case 'rifle': c.rotate(-1.3); hd(c, poly([[-30, -6], [110, -6], [110, 2], [20, 4], [0, 14], [-34, 12]], 16), { fill: '#6A4428', w: 3.5 }); line(c, seg(40, -8, 130, -8), 5); break;
    case 'lantern': line(c, seg(0, 0, 0, 20), 3); hd(c, rect(-14, 20, 28, 34), { fill: '#FFD86A', w: 3.5 }); hd(c, poly([[-18, 20], [18, 20], [10, 8], [-10, 8]], 6), { fill: '#3A3634', w: 3 }); break;
    case 'bottle': hd(c, poly([[-8, -30], [8, -30], [8, -14], [14, -4], [14, 30], [-14, 30], [-14, -4], [-8, -14]], 8), { fill: '#6FAF6A', w: 3.5 }); break;
    case 'lewis': c.rotate(o.gunAng ?? 0); hd(c, poly([[-40, -8], [150, -8], [150, 6], [-40, 10], [-70, 26], [-76, 6]], 16), { fill: '#3A3634', w: 4 }); hd(c, ell(30, -26, 34, 10), { fill: '#262322', w: 4 }); hd(c, rect(40, -14, 90, 22), { fill: '#5A5E5A', w: 3.5 }); for (const sx of [-1, 1]) line(c, seg(120, 6, 120 + sx * 26, 70, 3), 4); break;
    case 'pen': c.rotate(-.6); hd(c, rect(-4, -30, 8, 40), { fill: '#262322', w: 2.5 }); break;
    case 'book': hd(c, rect(-4, -26, 46, 54), { fill: CLR.red, w: 3.5 }); line(c, seg(4, -26, 4, 28), 3); break;
  }
  c.restore();
}

/* ---------- animals ---------- */
function emu(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  const run = o.run ? Math.sin(t * 12) : 0;
  for (const k of [-1, 1]) { const a = k * run * .6; line(c, [[k * 14, 60], [k * 14 + Math.sin(a) * 50, 110], [k * 14 + Math.sin(a) * 50 + 8, 170]], 6, '#6A5A4A'); line(c, [[k * 14 + Math.sin(a) * 50 - 10, 172], [k * 14 + Math.sin(a) * 50 + 28, 172]], 5, '#6A5A4A'); }
  hd(c, bez([-96, 20], [-110, -80], [90, -86], [96, 10], 14).concat(bez([96, 10], [80, 96], [-60, 100], [-96, 20], 14)), { fill: '#6B5645', w: 5 });
  c.save(); c.strokeStyle = 'rgba(40,28,20,.45)'; c.lineWidth = 3; const r = rng2(3); for (let i = 0; i < 26; i++) { const px = -60 + r() * 120, py = -30 + r() * 80; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 10, py + 16); c.stroke(); } c.restore();
  hd(c, bez([40, -10], [70, -70], [56, -120], [70, -150], 12).concat(bez([108, -150], [98, -110], [104, -60], [84, 4], 12)), { fill: '#5A7AA8', w: 5 });
  c.save(); c.strokeStyle = 'rgba(30,40,70,.35)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(70 + i * 3, -30 - i * 18); c.lineTo(88 + i * 2, -34 - i * 18); c.stroke(); } c.restore();
  hd(c, ell(88, -186, 46, 40), { fill: '#6B5645', w: 5 });
  c.save(); c.strokeStyle = 'rgba(40,28,20,.5)'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(56 + i * 8, -222); c.lineTo(52 + i * 8, -240 - (i % 2) * 8); c.stroke(); } c.restore();
  hd(c, bez([124, -196], [168, -198], [176, -178], [124, -172], 8), { fill: '#3A3634', w: 4.5 });
  const mood = o.mood || 'smug';
  hd(c, ell(100, -194, 17, mood === 'shock' ? 21 : 18), { fill: '#FFF', w: 3.5 }); c.fillStyle = '#C8621A'; c.beginPath(); c.arc(106, -193, 9, 0, TAU2); c.fill(); c.fillStyle = T.ink; c.beginPath(); c.arc(108, -193, 4.5, 0, TAU2); c.fill(); c.fillStyle = '#FFF'; c.beginPath(); c.arc(104, -197, 2, 0, TAU2); c.fill();
  if (mood === 'smug' || mood === 'angry') { c.fillStyle = '#6B5645'; c.fillRect(82, -214, 36, mood === 'smug' ? 16 : 12); line(c, seg(82, mood === 'angry' ? -210 : -198, 118, mood === 'angry' ? -200 : -198, 3), 4.5); }
  if (o.helmet) { hd(c, ell(88, -222, 44, 10), { fill: '#6D7340', w: 4 }); hd(c, bez([54, -224], [56, -262], [120, -262], [122, -224], 10), { fill: '#6D7340', w: 4 }); }
  c.restore();
}

/* ---------- speech bubble ---------- */
function bubble(c, x, y, w, h, text, tail = [0, 1], o = {}) {
  const pts = poly([[x, y], [x + w, y], [x + w, y + h], [x + w * .55, y + h], [x + w * .5 + tail[0] * 40, y + h + 46 * tail[1]], [x + w * .38, y + h], [x, y + h]], 30);
  hd(c, pts, { fill: '#FFFFFF', w: 5 });
  c.fillStyle = T.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${o.size || 40}px "Patrick Hand", "Comic Sans MS", sans-serif`;
  const lines = String(text).split('|'); lines.forEach((l, i) => c.fillText(l, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * (o.size || 40) * 1.1));
}

/* ============================================================
 * Backgrounds (bright, flat, outlined). All drawn in a 1920x1080 space.
 * ============================================================ */
const BW = 1920, BH = 1080;
function skyFill(c, top = '#7CC4F0', bot = '#CDEBFA') { const g = c.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-50, -50, BW + 100, BH + 100); }
function cloudT(c, x, y, s = 1, col = '#FFFFFF') { const pts = []; const bumps = [[0, 0, 60], [70, -30, 70], [150, -10, 60], [200, 20, 44], [-50, 24, 44]]; c.save(); c.translate(x, y); c.scale(s, s); hd(c, poly([[-80, 40], [240, 40]], 60, false).concat(bez([240, 40], [260, -10], [200, -40], [170, -30], 6), bez([170, -30], [150, -100], [60, -100], [40, -50], 8), bez([40, -50], [0, -80], [-60, -50], [-50, -10], 8), bez([-50, -10], [-100, -10], [-100, 40], [-80, 40], 6)), { fill: col, w: 5 }); c.restore(); }
function sunT(c, x, y, r = 70) { hd(c, ell(x, y, r, r), { fill: '#FFD43B', w: 5 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU2; line(c, seg(x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18), x + Math.cos(a) * (r + 44), y + Math.sin(a) * (r + 44), 2), 5); } }
function hill(c, y0, amp, col, seed = 1, w = 5) { const r = rng2(seed), pts = []; const ph = r() * 6; for (let x = -60; x <= BW + 60; x += 60) pts.push([x, y0 - Math.sin(x / 380 + ph) * amp - Math.sin(x / 150 + ph * 2) * amp * .25]); pts.push([BW + 60, BH + 60], [BW + 60, BH + 60], [-60, BH + 60], [-60, BH + 60]); hd(c, pts, { fill: col, w, amp: 1.4 }); }
function grass(c, y0, y1, n = 60, seed = 3, col = 'rgba(40,90,30,.55)') { const r = rng2(seed); c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = r() * BW, y = y0 + r() * (y1 - y0); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 2, y - 12); c.moveTo(x + 2, y); c.lineTo(x + 6, y - 14); c.stroke(); } }
function tree(c, x, y, s = 1, kind = 'round') { c.save(); c.translate(x, y); c.scale(s, s); hd(c, poly([[-12, 0], [12, 0], [10, -110], [-10, -110]], 20), { fill: '#8A5A34', w: 4.5 }); if (kind === 'gum') { for (const [dx, dy, r] of [[-40, -150, 50], [30, -170, 56], [0, -210, 50]]) hd(c, ell(dx, dy, r * 1.2, r * .75), { fill: '#7FA05A', w: 4.5 }); } else if (kind === 'bare') { for (const [a, l] of [[-.6, 90], [.5, 80], [-.2, 110], [.9, 60]]) line(c, seg(0, -100, Math.sin(a) * l, -100 - Math.cos(a) * l, 3), 7, '#5A3A22'); } else if (kind === 'pine') hd(c, poly([[-70, -60], [0, -260], [70, -60]], 20), { fill: '#3F7A3A', w: 4.5 }); else for (const [dx, dy, r] of [[-40, -130, 55], [40, -130, 55], [0, -180, 65]]) hd(c, ell(dx, dy, r, r), { fill: '#5FAE45', w: 4.5 }); c.restore(); }
function waves(c, y0, col = '#3F8FD2', col2 = '#2E73B5', t = 0) { const pts = []; for (let x = -60; x <= BW + 60; x += 40) pts.push([x, y0 + Math.sin(x / 60 + t * 1.5) * 8]); pts.push([BW + 60, BH + 60], [BW + 60, BH + 60], [-60, BH + 60], [-60, BH + 60]); hd(c, pts, { fill: col, w: 5 }); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; c.lineCap = 'round'; const r = rng2(9); for (let i = 0; i < 26; i++) { const x = r() * BW, y = y0 + 40 + r() * (BH - y0 - 40), d = Math.sin(t * 2 + i) * 6; c.beginPath(); c.moveTo(x - 22 + d, y); c.quadraticCurveTo(x + d, y - 10, x + 22 + d, y); c.stroke(); } }
function house(c, x, y, w, h, wall, roof, o = {}) {
  hd(c, rect(x, y - h, w, h), { fill: wall, w: 5 });
  hd(c, poly([[x - 14, y - h], [x + w / 2, y - h - (o.roofH || w * .55)], [x + w + 14, y - h]], 20), { fill: roof, w: 5 });
  if (o.timber) { c.save(); c.strokeStyle = '#5A3A22'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y - h * .5); c.lineTo(x + w, y - h * .5); c.moveTo(x + w * .33, y - h); c.lineTo(x + w * .33, y); c.moveTo(x + w * .66, y - h); c.lineTo(x + w * .66, y); c.stroke(); c.restore(); }
  hd(c, rect(x + w * .38, y - h * .42, w * .24, h * .42), { fill: '#6A4428', w: 4 });
  hd(c, rect(x + w * .12, y - h * .8, w * .2, h * .2), { fill: o.lit ? '#FFD86A' : '#A8D8F0', w: 4 }); hd(c, rect(x + w * .68, y - h * .8, w * .2, h * .2), { fill: o.lit ? '#FFD86A' : '#A8D8F0', w: 4 });
}
function ship(c, x, y, s = 1, o = {}, t = 0) { // medieval cog
  c.save(); c.translate(x, y + Math.sin(t * 1.6) * 5); c.scale(s * (o.flip ? -1 : 1), s); c.rotate(Math.sin(t * 1.3) * .02);
  line(c, seg(0, -40, 0, -330), 8, '#5A3A22');
  hd(c, bez([-12, -300], [70, -280], [80, -120], [-12, -80], 10), { fill: o.sail || '#FBF3DE', w: 5 });
  if (o.cross) hd(c, poly([[20, -220], [30, -220], [30, -190], [54, -190], [54, -180], [30, -180], [30, -140], [20, -140], [20, -180], [0, -180], [0, -190], [20, -190]], 6), { fill: CLR.red, w: 2.5 });
  hd(c, poly([[-190, -60], [190, -60], [150, 20], [-150, 20]], 30), { fill: '#9A6238', w: 5 });
  hd(c, poly([[-190, -60], [-200, -110], [-130, -100], [-120, -60]], 14), { fill: '#9A6238', w: 5 }); hd(c, poly([[190, -60], [206, -104], [140, -96], [130, -60]], 14), { fill: '#9A6238', w: 5 });
  c.strokeStyle = 'rgba(60,30,10,.5)'; c.lineWidth = 3; for (const yy of [-36, -12]) { c.beginPath(); c.moveTo(-176, yy); c.lineTo(176, yy); c.stroke(); }
  hd(c, poly([[0, -330], [60, -320], [0, -300]], 8), { fill: o.flagColor || CLR.red, w: 3 });
  c.restore();
}
function titanicT(c, x, y, s = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 4; i++) { const fx = -170 + i * 120; hd(c, poly([[fx, -120], [fx + 60, -120], [fx + 54, -250], [fx + 6, -250]], 14), { fill: '#E9A33A', w: 5 }); hd(c, poly([[fx + 6, -250], [fx + 54, -250], [fx + 55, -226], [fx + 5, -226]], 8), { fill: '#1E1C1B', w: 4 }); }
  hd(c, poly([[-330, -120], [330, -120], [330, -80], [-330, -80]], 30), { fill: '#FBF7EE', w: 5 });
  hd(c, poly([[-420, -80], [460, -80], [420, 30], [-380, 30]], 30), { fill: '#1E1C1B', w: 5 });
  hd(c, poly([[-400, 0], [440, 0], [420, 30], [-380, 30]], 30), { fill: '#B8322A', w: 4 });
  c.fillStyle = '#FFD86A'; for (let i = 0; i < 30; i++) c.fillRect(-380 + i * 27, -54, 8, 8);
  c.restore();
}
function column(c, x, y, h, w = 44) { hd(c, rect(x - w / 2, y - h, w, h), { fill: '#F2EAD8', w: 4.5 }); hd(c, rect(x - w / 2 - 10, y - h - 16, w + 20, 16), { fill: '#E6DBC2', w: 4 }); hd(c, rect(x - w / 2 - 8, y - 12, w + 16, 12), { fill: '#E6DBC2', w: 4 }); c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 3; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * w * .25, y - h + 6); c.lineTo(x + i * w * .25, y - 16); c.stroke(); } }
function toonCrowd(c, x0, x1, y, n, seed = 5, s = .5, t = 0, o = {}) {
  const r = rng2(seed), cols = o.cols || [CLR.red, CLR.blue, CLR.green, '#B89A6A', CLR.purple, CLR.orange, '#8E979E'], hats = o.hats || [null, null, 'straw', 'hood', null, 'cap'], skins = ['peach', 'tan', 'light', 'olive', 'brown'];
  const list = []; for (let i = 0; i < n; i++) list.push({ x: x0 + r() * (x1 - x0), y: y + r() * 30, c: cols[Math.floor(r() * cols.length)], h: hats[Math.floor(r() * hats.length)], sk: skins[Math.floor(r() * skins.length)], m: o.moods ? o.moods[Math.floor(r() * o.moods.length)] : 'neutral', ph: r() * 6 });
  list.sort((a, b) => a.y - b.y).forEach(p => guy(c, p.x, p.y + Math.sin(t * 5 + p.ph) * (o.bounce || 0), s, { skin: p.sk, outfit: 'tunic', color: p.c, hat: p.h, hatColor: p.c, mood: p.m, la: o.arms === 'up' ? [-150 + Math.sin(t * 6 + p.ph) * 12, -10] : [-24, -10], ra: o.arms === 'up' ? [150 - Math.sin(t * 6 + p.ph) * 12, 10] : [24, 10], look: (r() - .5) * .6 }, t + p.ph));
}

const SCN = {
  field(c, t) { skyFill(c); sunT(c, 1650, 170); cloudT(c, 260 + t * 8, 200, 1); cloudT(c, 1100 + t * 5, 150, .8); hill(c, 640, 60, '#8FCB5A', 2); hill(c, 760, 40, '#6FB443', 5); grass(c, 780, 1060, 90); },
  sea(c, t) { skyFill(c); cloudT(c, 300 + t * 6, 190, .9); cloudT(c, 1250 + t * 4, 140, .7); hill(c, 560, 30, '#9CCB6A', 8); waves(c, 590, '#4E9CDB', 0, t); },
  harbor(c, t) {
    skyFill(c, '#F6B26B', '#FCE3B5'); sunT(c, 1500, 330, 90); cloudT(c, 250 + t * 6, 200, .8, '#FFF3E0');
    hill(c, 520, 40, '#B7C77A', 4);
    const r = rng2(12); for (let i = 0; i < 9; i++) house(c, 60 + i * 150, 600, 120, 110 + r() * 70, ['#F2D9A8', '#E8B98A', '#F6E6C4', '#D9A57A'][i % 4], ['#C8553D', '#A8432F', '#D96A4A'][i % 3], { timber: i % 2 === 0 });
    hd(c, rect(-40, 600, 1500, 40), { fill: '#8A5A34', w: 5 });
    waves(c, 640, '#4E9CDB', 0, t);
  },
  town(c, t) { skyFill(c); cloudT(c, 1400 + t * 5, 150, .8); const r = rng2(21); for (let i = 0; i < 8; i++) house(c, -40 + i * 250, 820, 220, 300 + r() * 120, ['#F2D9A8', '#E8B98A', '#F6E6C4', '#D9C19A'][i % 4], ['#C8553D', '#A8432F', '#7A5A8A'][i % 3], { timber: true, roofH: 130 }); hd(c, rect(-40, 820, BW + 80, 300), { fill: '#B8A89A', w: 5 }); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let y = 850; y < 1080; y += 40) for (let x = (y / 40 % 2) * 40; x < BW; x += 80) { c.beginPath(); c.ellipse(x, y, 30, 12, 0, 0, TAU2); c.stroke(); } },
  volcano(c, t) {
    skyFill(c, '#F29A6B', '#FFE0B8');
    const px = 1300, g = 1 + Math.sin(t) * .02;
    for (let i = 0; i < 16; i++) { const ph = ((t * .05 + i / 16) % 1), w = 60 + ph * 260, y = 270 - ph * 330; const sh = 150 - i % 3 * 18; hd(c, ell(px + Math.sin(i * 1.7) * w * .5, y, w * .55, w * .42), { fill: `rgb(${sh},${sh - 10},${sh - 14})`, w: 4.5 }); }
    hd(c, poly([[760, 720], [1220, 280], [1380, 280], [1840, 720]], 30), { fill: '#8A6A5A', w: 5 });
    hd(c, poly([[1220, 280], [1380, 280], [1350, 330], [1300, 300], [1260, 340]], 10), { fill: '#FF6A2A', w: 4 });
    hill(c, 700, 20, '#C8B070', 6);
    for (let i = 0; i < 9; i++) column(c, 120 + i * 90, 820, 260);
    hd(c, poly([[80, 560], [880, 560], [480, 470]], 30), { fill: '#EFE3C8', w: 5 });
    hd(c, rect(70, 820, 860, 30), { fill: '#E6DBC2', w: 5 });
    hd(c, rect(-40, 850, BW + 80, 260), { fill: '#D8C8A0', w: 5 });
    c.fillStyle = 'rgba(90,80,80,.5)'; const r = rng2(4); for (let i = 0; i < 70; i++) { const x = (r() * BW + t * 30) % BW, y = (r() * BH + t * 120 * (0.5 + r())) % BH; c.fillRect(x, y, 5, 5); }
  },
  desert(c, t) { skyFill(c, '#6FBDEB', '#F7E6B8'); sunT(c, 1650, 180, 80); hill(c, 620, 40, '#E8C27A', 3); for (let i = 0; i < 6; i++) hd(c, rect(900 + i * 120, 620 - 140 - (i % 2) * 30, 110, 140 + (i % 2) * 30), { fill: '#E9D3A3', w: 5 }); hd(c, bez([1150, 470], [1160, 380], [1280, 380], [1290, 470], 10), { fill: CLR.gold, w: 5 }); hill(c, 760, 30, '#F0CE88', 8); },
  castle(c, t) { skyFill(c); cloudT(c, 300 + t * 6, 170, .9); hill(c, 700, 40, '#86C257', 3); const cx = 960; hd(c, rect(cx - 400, 300, 800, 420), { fill: '#C9C2B6', w: 5 }); for (let i = 0; i < 12; i++) hd(c, rect(cx - 400 + i * 68, 270, 40, 34), { fill: '#C9C2B6', w: 4 }); for (const sx of [-1, 1]) { hd(c, rect(cx + sx * 420 - 90, 200, 180, 520), { fill: '#BDB5A8', w: 5 }); hd(c, poly([[cx + sx * 420 - 110, 200], [cx + sx * 420, 60], [cx + sx * 420 + 110, 200]], 20), { fill: CLR.blue, w: 5 }); } hd(c, bez([cx - 90, 720], [cx - 90, 540], [cx + 90, 540], [cx + 90, 720], 12), { fill: '#5A3A22', w: 5 }); hill(c, 800, 20, '#6FB443', 7); },
  night(c, t) { skyFill(c, '#16264F', '#34507E'); const r = rng2(5); c.fillStyle = '#FFF6D0'; for (let i = 0; i < 90; i++) { const x = r() * BW, y = r() * 600, tw = .6 + Math.sin(t * 3 + i) * .4; c.globalAlpha = tw; c.beginPath(); c.arc(x, y, 2 + r() * 2, 0, TAU2); c.fill(); } c.globalAlpha = 1; hd(c, ell(1600, 180, 70, 70), { fill: '#FFF3C4', w: 5 }); },
  ocean(c, t) { SCN.night(c, t); waves(c, 640, '#1F4F86', 0, t); },
  titanic(c, t) { SCN.night(c, t); hd(c, poly([[1400, 640], [1500, 420], [1560, 470], [1640, 360], [1760, 640]], 20), { fill: '#EAF6FC', w: 5 }); waves(c, 640, '#1F4F86', 0, t); titanicT(c, 760, 690, 1, t); },
  trench(c, t) {
    skyFill(c, '#B9CCD8', '#EEF3F5'); cloudT(c, 300 + t * 5, 170, .9, '#F4F6F8'); cloudT(c, 1300 + t * 4, 130, .7, '#F4F6F8');
    hill(c, 600, 16, '#E4EAEC', 2);
    for (let i = 0; i < 9; i++) tree(c, 120 + i * 230, 610, .45 + (i % 3) * .08, 'bare');
    hill(c, 700, 10, '#F4F6F6', 6);
    for (let i = 0; i < 13; i++) { const x = 40 + i * 150; line(c, seg(x, 760, x - 6, 660, 3), 6, '#5A3A22'); }
    c.save(); c.strokeStyle = '#3A3634'; c.lineWidth = 3; for (let k = 0; k < 2; k++) { c.beginPath(); for (let x = 20; x < BW; x += 24) c.arc(x, 690 + k * 26, 12, 0, Math.PI, (x / 24) % 2 < 1); c.stroke(); } c.restore();
    for (let i = 0; i < 16; i++) hd(c, ell(i * 124 + (i % 2) * 40, 880, 70, 30), { fill: '#C8B48A', w: 4.5 });
    for (let i = 0; i < 16; i++) hd(c, ell(i * 124 + 60, 840, 70, 30), { fill: '#D6C49C', w: 4.5 });
    hd(c, poly([[-60, 900], [BW + 60, 900], [BW + 60, BH + 60], [-60, BH + 60]], 60), { fill: '#7A6048', w: 5 });
    c.fillStyle = '#FFF'; const r = rng2(8); for (let i = 0; i < 90; i++) { const x = (r() * BW + t * 20) % BW, y = (r() * BH + t * 60) % BH; c.beginPath(); c.arc(x, y, 3 + r() * 2, 0, TAU2); c.fill(); }
  },
  outback(c, t) { skyFill(c, '#6FBDEB', '#F6DDB0'); sunT(c, 1650, 170, 80); hill(c, 640, 20, '#D98A4A', 3); hill(c, 720, 12, '#E8A262', 7); tree(c, 260, 700, 1.1, 'gum'); tree(c, 1560, 690, .9, 'gum'); grass(c, 740, 1060, 70, 5, 'rgba(120,80,30,.5)'); },
  wheat(c, t) { skyFill(c, '#6FBDEB', '#F6E3B0'); sunT(c, 1650, 170, 80); cloudT(c, 300 + t * 6, 190, .8); hill(c, 620, 20, '#D9B25A', 3); tree(c, 1700, 630, .8, 'gum'); hd(c, rect(1480, 440, 200, 180), { fill: '#C8553D', w: 5 }); hd(c, poly([[1460, 440], [1580, 350], [1700, 440]], 16), { fill: '#8A8A8A', w: 5 }); hill(c, 720, 12, '#E8C25A', 7); const r = rng2(11); c.strokeStyle = '#B88A2A'; c.lineWidth = 3; for (let i = 0; i < 260; i++) { const x = r() * BW, y = 730 + r() * 340, sw = Math.sin(t * 2 + x / 90) * 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y - 34); c.stroke(); c.fillStyle = '#F2C84A'; c.beginPath(); c.ellipse(x + sw, y - 38, 4, 9, 0, 0, TAU2); c.fill(); } },
  moon(c, t) { c.fillStyle = '#0B0E1F'; c.fillRect(-50, -50, BW + 100, BH + 100); const r = rng2(2); c.fillStyle = '#FFF'; for (let i = 0; i < 120; i++) { c.beginPath(); c.arc(r() * BW, r() * 700, 1.5 + r() * 2, 0, TAU2); c.fill(); } hd(c, ell(1560, 220, 90, 90), { fill: '#3F8FD2', w: 5 }); hd(c, bez([1500, 180], [1540, 150], [1600, 190], [1560, 240], 8), { fill: '#5FAE45', w: 3.5 }); hill(c, 720, 30, '#BDBDB8', 4); for (let i = 0; i < 8; i++) { const x = 100 + i * 240 + (i % 2) * 60; hd(c, ell(x, 850 + (i % 3) * 60, 60, 16), { fill: '#A5A5A0', w: 4 }); } },
  village(c, t) { skyFill(c, '#9FC6E0', '#E6EEF2'); cloudT(c, 300 + t * 6, 170, .9, '#F4F4F4'); hill(c, 650, 30, '#8AA85A', 2); house(c, 180, 700, 260, 180, '#8A6A4A', '#5A4A3A', { roofH: 150 }); house(c, 1380, 700, 280, 200, '#9A7A58', '#5A4A3A', { roofH: 160 }); hd(c, rect(760, 360, 400, 340), { fill: '#A8865E', w: 5 }); hd(c, poly([[740, 360], [960, 220], [1180, 360]], 20), { fill: '#5A4A3A', w: 5 }); hd(c, rect(930, 140, 60, 90), { fill: '#A8865E', w: 4 }); hd(c, poly([[920, 140], [960, 80], [1000, 140]], 10), { fill: '#5A4A3A', w: 4 }); hill(c, 760, 20, '#7A9A4A', 5); grass(c, 780, 1060, 60); },
  throne(c, t) { c.fillStyle = '#B98B5E'; c.fillRect(-50, -50, BW + 100, BH + 100); c.strokeStyle = 'rgba(80,50,30,.35)'; c.lineWidth = 4; for (let y = 40; y < 760; y += 80) for (let x = (y / 80 % 2) * 90; x < BW; x += 180) c.strokeRect(x, y, 180, 80); for (const x of [340, 1580]) { hd(c, poly([[x - 90, 80], [x + 90, 80], [x + 90, 560], [x, 500], [x - 90, 560]], 20), { fill: CLR.red, w: 5 }); hd(c, ell(x, 250, 40, 40), { fill: CLR.gold, w: 4 }); } hd(c, rect(-40, 760, BW + 80, 360), { fill: '#7A4E2E', w: 5 }); hd(c, poly([[700, 760], [1220, 760], [1300, 1080], [620, 1080]], 20), { fill: '#B8322A', w: 5 }); },
  white(c) { c.fillStyle = '#FFFFFF'; c.fillRect(-50, -50, BW + 100, BH + 100); },
};
function scene(c, name, t) { SCN[name](c, t); }

/* Serious History-style "painted" background: the scene blurred, warm graded, vignetted. */
function paintedBg(c, name, t, grade = 'warm') {
  const tmp = document.createElement('canvas'); tmp.width = BW; tmp.height = BH; const tc = tmp.getContext('2d'); frameStart(t); scene(tc, name, t);
  c.save(); c.filter = 'blur(7px) saturate(1.1)'; c.drawImage(tmp, -20, -20, BW + 40, BH + 40); c.filter = 'none';
  const g = c.createRadialGradient(BW / 2, BH / 2, 200, BW / 2, BH / 2, 1200); g.addColorStop(0, grade === 'warm' ? 'rgba(255,180,90,.18)' : 'rgba(120,160,255,.12)'); g.addColorStop(1, 'rgba(40,20,10,.55)'); c.fillStyle = g; c.fillRect(0, 0, BW, BH); c.restore();
}

/* ---------- a toon map (real coastlines from shared.js) ---------- */
const TMAP = { P: { map: { sea: '#7FC0EA', grid: 'rgba(255,255,255,.18)', land: '#EFDDA6', coast: '#2A2522', spread: '214,48,40', route: '#D63A2F', label: '#2A2522', font: '"Patrick Hand", sans-serif' } } };
function mapLabel(c, name, lon, lat, z, size = 58, dx = 14) { const [x, y] = proj(lon, lat); c.save(); c.font = `${size / z}px "Permanent Marker"`; c.lineJoin = 'round'; c.strokeStyle = '#FFFFFF'; c.lineWidth = 8 / z; c.strokeText(name, x + dx / z, y); c.fillStyle = T.ink; c.fillText(name, x + dx / z, y); c.fillStyle = '#D63A2F'; c.beginPath(); c.arc(x, y, 9 / z, 0, TAU2); c.fill(); c.lineWidth = 3 / z; c.strokeStyle = T.ink; c.stroke(); c.restore(); }
function toonMap(c, lon, lat, z, date, o = {}) {
  c.save(); c.translate(o.ox || 0, o.oy || 0); c.scale(BW / W, BH / H); mapCam(c, lon, lat, z); drawMap(c, TMAP, date, { z, pins: o.pins || [] }); if (o.redLand) { c.save(); c.clip(LAND); c.fillStyle = o.redLand; c.fillRect(-4000, -4000, 9000, 9000); c.restore(); c.fillStyle = TMAP.P.map.sea; c.fill(WATER); c.strokeStyle = TMAP.P.map.coast; c.lineWidth = 1.5 / z; c.stroke(LAND); } if (o.route != null) drawMap(c, Object.assign({}, TMAP, { P: { map: Object.assign({}, TMAP.P.map, { sea: 'rgba(0,0,0,0)', land: 'rgba(0,0,0,0)', grid: 'rgba(0,0,0,0)' }) } }), 0, { z, pins: [], route: o.route }); (o.labels || []).forEach(l => mapLabel(c, l[0], l[1], l[2], z, 58, l[3] ?? 14)); c.restore();
}

/* ---------- text ---------- */
function thumbText(c, text, x, y, size, o = {}) {
  c.save(); c.font = `${size}px ${o.font || 'Anton, Impact, sans-serif'}`; c.textAlign = o.align || 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText(text, x + size * .04, y + size * .06); }
  c.strokeStyle = o.stroke || '#141414'; c.lineWidth = size * (o.sw ?? .12); c.strokeText(text, x, y); c.fillStyle = o.fill || '#FFFFFF'; c.fillText(text, x, y); c.restore();
}
function marker(c, text, x, y, size, col = T.ink, align = 'center') { c.save(); c.font = `${size}px "Permanent Marker", "Comic Sans MS", cursive`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(text, x, y); c.restore(); }
function redArrow(c, x0, y0, x1, y1, w = 26) {
  const mx = (x0 + x1) / 2 + (y1 - y0) * .25, my = (y0 + y1) / 2 - (x1 - x0) * .25, pts = qb([x0, y0], [mx, my], [x1, y1], 16);
  const a = Math.atan2(y1 - pts[14][1], x1 - pts[14][0]);
  c.save(); c.lineCap = 'round'; c.strokeStyle = '#FFFFFF'; c.lineWidth = w + 14; hpath(c, pts.slice(0, 15), false, 0, 0); c.stroke(); c.strokeStyle = '#E3261B'; c.lineWidth = w; c.stroke();
  const head = [[x1 + Math.cos(a) * 20, y1 + Math.sin(a) * 20], [x1 + Math.cos(a + 2.5) * 62, y1 + Math.sin(a + 2.5) * 62], [x1 + Math.cos(a - 2.5) * 62, y1 + Math.sin(a - 2.5) * 62]];
  c.beginPath(); c.moveTo(...head[0]); c.lineTo(...head[1]); c.lineTo(...head[2]); c.closePath(); c.lineJoin = 'round'; c.strokeStyle = '#FFFFFF'; c.lineWidth = 12; c.stroke(); c.fillStyle = '#E3261B'; c.fill(); c.restore();
}

function fire(c, x, y, s = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const [a, b] of [[-50, 10], [50, 10], [-20, 20], [20, 20]]) hd(c, poly([[a - 40, b], [a + 40, b - 14], [a + 44, b - 2], [a - 36, b + 12]], 10), { fill: '#7A4E2E', w: 4 });
  for (let k = 0; k < 3; k++) { const f = Math.sin(t * 11 + k * 2) * 8, w = [70, 50, 28][k], h = [150, 110, 64][k]; hd(c, bez([-w, 0], [-w * 1.1, -h * .5], [-w * .2, -h * .7], [f * .5, -h - f], 8).concat(bez([f * .5, -h - f], [w * .3, -h * .6], [w * 1.1, -h * .4], [w, 0], 8)), { fill: ['#E8542A', '#F29A2E', '#FFE070'][k], w: k === 0 ? 5 : 0 }); }
  c.restore();
}
function throne(c, x, y, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); hd(c, poly([[-90, -260], [90, -260], [90, 60], [-90, 60]], 20), { fill: '#A8322A', w: 5 }); hd(c, poly([[-110, -300], [-80, -330], [-60, -290], [0, -340], [60, -290], [80, -330], [110, -300], [110, -250], [-110, -250]], 14), { fill: CLR.gold, w: 5 }); hd(c, rect(-120, 40, 240, 40), { fill: CLR.gold, w: 5 }); for (const sx of [-1, 1]) hd(c, rect(sx * 120 - 16, 40, 32, 150), { fill: CLR.gold, w: 5 }); c.restore(); }
function subtitle2(c, text, y = 1000, size = 52) { c.save(); c.font = `${size}px "Patrick Hand", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = '#111'; c.lineWidth = 10; c.strokeText(text, 960, y); c.fillStyle = '#FFF'; c.fillText(text, 960, y); c.restore(); }
