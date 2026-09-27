/* Toon director: renders a scripted episode frame by frame.
 * TV (injected by pipeline/toon_render.py):
 *   { format: 'long'|'short', duration, hook, cast: {id: spec}, beats: [{who, say, t0, t1, words}],
 *     shots: [{s0, s1, show}] }
 * A show is one of:
 *   scene   {k:'scene', bg, cast:[{id, x, s, pose, mood, look, flip, hold, enter, exit, exitAt, walk, dy, bounce}],
 *            cam:'push'|'pan'|'still'|'close'|'shake', focus, fx:[...], stickers:[{text, at, color}], tag:{id, text}}
 *   map     {k:'map', lon, lat, z0, z1, date, labels:[[name, lon, lat, dx]], route:[[lon, lat], ...], areas:[[lon, lat, r, color]]}
 *   title   {k:'title', text, sub, cast}
 *   chapter {k:'chapter', year, title, bg}
 *   card    {k:'card', big, label, sub}
 *   quote   {k:'quote', text, who}
 *   list    {k:'list', n, title}
 *   compare {k:'compare', left:{label, cast}, right:{label, cast}, bg}
 *   end     {k:'end', next}
 */
const ezB = x => { const c1 = 1.70158, c3 = c1 + 1; x = Math.max(0, Math.min(1, x)); return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const ezIO = x => { x = Math.max(0, Math.min(1, x)); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const ANIMAL_FOOT = { emu: 172, pig: 74, horse: 150, rat: 26, elephant: 140 };
const ANIMAL_SCALE = { emu: .8, pig: .6, horse: .75, rat: .4, elephant: .7 };
const isLong = () => TV.format === 'long';
const CW = () => isLong() ? 1920 : 1080, CH = () => isLong() ? 1080 : 1920;
const VZ = 1.78, VDY = -330;

function vScene(c, name, t, cx = 960) {
  const sid = T.sid; c.save(); c.translate(540, 1920 - BH * VZ); c.scale(VZ, VZ); c.translate(-cx, 0); SCN[name](c, t); c.restore(); T.sid = sid;
  c.save(); c.beginPath(); c.rect(0, 0, 1080, BH * VZ + VDY - 4); c.clip(); c.translate(540, VDY); c.scale(VZ, VZ); c.translate(-cx, 0); SCN[name](c, t); c.restore();
}
function drawBg(c, bg, t, cx) { if (isLong()) SCN[bg](c, t); else vScene(c, bg, t, cx ?? 960); }
function groundY(bg) { const g = GROUND[bg] || 880; return isLong() ? g : g * VZ + VDY; }

function speakingNow(id, t) { return TV.beats.some(b => b.who === id && t >= b.t0 && t <= b.t1); }
function spec(id) { const s = TV.cast[id]; if (!s) return PRESET[id] || { outfit: 'tunic' }; return s.preset ? Object.assign({}, PRESET[s.preset] || {}, s) : s; }

function poseArms(p, look, t) {
  const side = look < 0 ? -1 : 1, w = Math.sin(t * 9) * 12;
  switch (p) {
    case 'point': return side > 0 ? { ra: [95, 0] } : { la: [-95, 0] };
    case 'wave': return side > 0 ? { ra: [150 + w, -40] } : { la: [-150 - w, 40] };
    case 'cheer': return { la: [-150 - w * .5, -10], ra: [150 + w * .5, 10] };
    case 'shrug': return { la: [-70, -90], ra: [70, 90] };
    case 'hips': return { la: [-45, 110], ra: [45, -110] };
    case 'think': return { ra: [150, -170], la: [-30, 60] };
    case 'fist': return { ra: [165 + w, 0] };
    case 'salute': return { ra: [140, -150] };
    case 'scared': return { la: [-150, -20], ra: [150, 20], shake: 3 };
    case 'facepalm': return { ra: [160, -175] };
    case 'aim': return { ra: [75, -15], la: [60, 20] };
    case 'hold': return { ra: [30, -60] };
    case 'present': return side > 0 ? { ra: [70, -20], la: [-30, -10] } : { la: [-70, 20], ra: [30, 10] };
    case 'cross': return { la: [-30, 120], ra: [30, -120] };
    case 'sit': return { legs: 'sit', la: [-50, 100], ra: [50, -100] };
    case 'walk': return { legs: 'walk' };
    case 'run': return { legs: 'run', la: [-60 + w, -40], ra: [60 - w, 40] };
    default: return {};
  }
}

/* Place and draw the cast of a scene shot. */
function drawCast(c, list, t, lt, dur, bg) {
  const W0 = CW(), gy = groundY(bg), defS = isLong() ? 1.75 : 2.05, n = list.length;
  const placed = list.map((e, i) => Object.assign({}, e, { px: (e.x ?? (n === 1 ? .5 : .18 + i * (isLong() ? .64 : .56) / Math.max(1, n - 1))) * W0 }));
  placed.forEach((e, i) => {
    const sp = spec(e.id), animal = sp.animal || ANIMAL_FOOT[e.id] && e.id;
    let x = e.px, s = (e.s ?? 1) * defS * (animal ? ANIMAL_SCALE[animal] : 1), walking = false;
    if (e.walk) { const [a, b] = e.walk, k = ezIO(lt / (e.walkT || Math.min(dur, 2.5))); x = (a + (b - a) * k) * W0; walking = k < 1; }
    if (e.enter === 'left' || e.enter === 'right') { const k = Math.min(1, lt / 1.1); x = e.px + (e.enter === 'left' ? -1 : 1) * (1 - ezIO(k)) * (W0 * .6); walking = walking || k < 1; }
    if (e.exit && lt > (e.exitAt ?? dur - 1.2)) { const k = Math.min(1, (lt - (e.exitAt ?? dur - 1.2)) / 1.1); x += (e.exit === 'left' ? -1 : 1) * ezIO(k) * W0 * .7; walking = true; }
    if (e.enter === 'pop') s *= ezB(lt / .4);
    if (s < .01) return;
    const others = placed.filter(o => o !== e), ox = others.length ? others.reduce((a, o) => a + o.px, 0) / others.length : W0 / 2;
    const look = e.look ?? (others.length ? Math.max(-.5, Math.min(.5, (ox - x) / W0 * 2.2)) : (x < W0 / 2 ? .25 : -.25));
    let y = animal ? gy - ANIMAL_FOOT[animal] * s : gy - 297 * s;
    if (e.enter === 'drop') y -= (1 - ezB(lt / .5)) * 700;
    if (e.bounce) y -= Math.abs(Math.sin(t * 7 + i)) * 40 * s;
    y += (e.dy || 0) * s;
    const P = poseArms(e.pose, look, t + i);
    if (P.shake) x += Math.sin(t * 40 + i) * P.shake * s;
    if (animal) { ANIMALS[animal](c, x, y, s, Object.assign({}, sp, e, { run: walking || e.pose === 'run' || sp.run, flip: e.flip ?? (look < 0) }), t + i); return; }
    const o = Object.assign({}, sp, { mood: e.mood || sp.mood, look: e.flip ? -look : look, hold: e.hold ?? sp.hold, flag: e.flag ?? sp.flag, flip: e.flip, phase: i * .7 }, P);
    if (walking && !P.legs) o.legs = 'walk';
    if (speakingNow(e.id, t) || e.talk) o.talk = true;
    guy(c, x, y, s, o, t + i * .31);
    e._x = x; e._y = y; e._s = s;
  });
  return placed;
}

function camera(c, sh, lt, lp, placed) {
  const cam = sh.show.cam || 'push', W0 = CW(), H0 = CH();
  let cx = W0 / 2, cy = H0 / 2, z = 1;
  if (cam === 'push') z = 1 + .06 * ezIO(lp);
  if (cam === 'pan') { cx += (sh.show.panDir ?? 1) * 70 * (ezIO(lp) - .5); z = 1.08; }
  if (cam === 'close') { const list = sh.show.cast || [], n = list.length, want = sh.show.focus || (TV.beats.find(b => b.t0 >= sh.s0 - .2 && b.t0 < sh.s1 && b.who !== 'N') || {}).who; let i = list.findIndex(e => e.id === want); if (i < 0) i = 0; const e = list[i];
    if (e) { const defS = isLong() ? 1.75 : 2.05, s = (e.s ?? 1) * defS, x = (e.x ?? (n === 1 ? .5 : .18 + i * (isLong() ? .64 : .56) / Math.max(1, n - 1))) * W0; cx = x; cy = groundY(sh.show.bg) - 297 * s + 70 * s; z = isLong() ? 1.5 : 1.4; } }
  if (cam === 'wide') z = 1;
  cx = Math.max(W0 / 2 / z, Math.min(W0 - W0 / 2 / z, cx)); cy = Math.max(H0 / 2 / z, Math.min(H0 - H0 / 2 / z, cy));
  let sx = 0, sy = 0; if (cam === 'shake' || sh.show.shake) { sx = Math.sin(lt * 47) * 7; sy = Math.cos(lt * 41) * 6; }
  c.translate(W0 / 2 + sx, H0 / 2 + sy); c.scale(z, z); c.translate(-cx, -cy);
}

function fxLayer(c, fx, t, front) {
  const W0 = CW(), H0 = CH();
  for (const f of fx || []) {
    if (f === 'snow' && front) { c.fillStyle = '#FFF'; const r = rng2(8); for (let i = 0; i < 90; i++) { const x = (r() * W0 + t * 25) % W0, y = (r() * H0 + t * 80) % H0; c.beginPath(); c.arc(x, y, 3 + r() * 3, 0, TAU2); c.fill(); } }
    if (f === 'rain' && front) { c.strokeStyle = 'rgba(200,220,255,.6)'; c.lineWidth = 3; const r = rng2(4); for (let i = 0; i < 120; i++) { const x = (r() * W0 + t * 60) % W0, y = (r() * H0 + t * 900) % H0; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 28); c.stroke(); } }
    if (f === 'dust' && front) { c.fillStyle = 'rgba(210,160,100,.45)'; for (let i = 0; i < 14; i++) { const x = (i * 150 + t * 120) % (W0 + 200) - 100; c.beginPath(); c.arc(x, H0 * .82 + Math.sin(i) * 30, 50 + (i % 3) * 14, 0, TAU2); c.fill(); } }
    if (f === 'confetti' && front) { const r = rng2(5), cols = [CLR.red, CLR.gold, CLR.blue, CLR.green, CLR.purple]; for (let i = 0; i < 80; i++) { const x = (r() * W0 + Math.sin(t + i) * 30), y = (r() * H0 + t * 240) % H0; c.fillStyle = cols[i % 5]; c.save(); c.translate(x, y); c.rotate(t * 3 + i); c.fillRect(-6, -3, 12, 6); c.restore(); } }
    if (f === 'fire' && !front) { fire(c, W0 * .12, groundYFx(), isLong() ? 1.2 : 1.4, t); fire(c, W0 * .88, groundYFx(), isLong() ? 1.2 : 1.4, t); }
    if (f === 'smoke' && !front) smoke(c, W0 * .75, H0 * .6, t, 8);
    if (f === 'explosion' && front) { const k = (t * 1.3) % 1; c.save(); c.globalAlpha = 1 - k; hd(c, poly([...Array(16)].map((_, i) => { const a = i / 16 * TAU2, r = (i % 2 ? 90 : 180) * (0.6 + k); return [W0 * .7 + Math.cos(a) * r, H0 * .45 + Math.sin(a) * r]; }), 10), { fill: '#FFB02E', w: 6 }); c.restore(); }
    if (f === 'sparkle' && front) { c.fillStyle = '#FFE070'; for (let i = 0; i < 16; i++) { const a = t * 2 + i, x = W0 * (.2 + .6 * ((i * 37) % 100) / 100), y = H0 * (.2 + .5 * ((i * 53) % 100) / 100), s = 6 + Math.sin(a * 3) * 5; c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * .5, y); c.lineTo(x, y + s * 2); c.lineTo(x - s * .5, y); c.fill(); } }
  }
}
let _fxGround = 880; function groundYFx() { return _fxGround; }

function stickerPop(c, text, x, y, lt, col = '#E3261B', size) {
  if (lt < 0) return; size = size || (isLong() ? 76 : 70); const s = ezB(lt / .35); c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-.04);
  c.font = `${size}px Anton, Impact, sans-serif`; const w = c.measureText(text).width + 64;
  hd(c, rect(-w / 2, -size * .9, w, size * 1.4), { fill: col, w: 6, color: '#FFFFFF', amp: .5 }); c.fillStyle = '#FFF'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(text, 0, size * .28); c.restore();
}
function nameTag(c, text, x, y, lt) { if (lt < .2) return; const a = Math.min(1, (lt - .2) / .3); c.save(); c.globalAlpha = a; c.font = `${isLong() ? 44 : 50}px "Permanent Marker", cursive`; const w = c.measureText(text).width + 40; hd(c, rect(x - w / 2, y - 40, w, 64), { fill: '#FFFFFF', w: 5, amp: .6 }); c.fillStyle = T.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y - 6); c.restore(); }

function paperBg(c) { const W0 = CW(), H0 = CH(); c.fillStyle = '#F7F1E1'; c.fillRect(0, 0, W0, H0); c.strokeStyle = 'rgba(120,90,50,.12)'; c.lineWidth = 2; for (let y = 60; y < H0; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W0, y); c.stroke(); } }
function wrapLines(c, text, maxW) { const words = String(text).split(/\s+/), lines = []; let cur = ''; for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (c.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; } if (cur) lines.push(cur); return lines; }
function markerFit(c, text, cx, y, size, maxW, col = T.ink) { c.save(); let s = size; c.font = `${s}px "Permanent Marker", cursive`; while (c.measureText(text).width > maxW && s > 30) { s -= 4; c.font = `${s}px "Permanent Marker", cursive`; } c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(text, cx, y); c.restore(); return s; }

/* A custom map route drawn progressively (lon/lat points). */
function mapRoute(c, pts, k, z) { const P = pts.map(p => proj(p[0], p[1])); let tot = 0; const seg2 = []; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg2.push(d); tot += d; } let left = tot * k; c.save(); c.strokeStyle = '#D63A2F'; c.lineWidth = 5 / z; c.setLineDash([14 / z, 10 / z]); c.lineCap = 'round'; c.beginPath(); c.moveTo(...P[0]); let head = P[0], ang = 0; for (let i = 1; i < P.length && left > 0; i++) { const f = Math.min(1, left / seg2[i - 1]); head = [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; ang = Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0]); c.lineTo(...head); left -= seg2[i - 1]; } c.stroke(); c.setLineDash([]); c.fillStyle = '#D63A2F'; c.translate(...head); c.rotate(ang); c.scale(1 / z, 1 / z); c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -12); c.lineTo(-10, 12); c.closePath(); c.fill(); c.restore(); }
function mapShot(c, sh, t, lt, lp) {
  const m = sh.show, zc = v => Math.min(3.2, v), z = zc(m.z0 ?? 1.2) + (zc(m.z1 ?? m.z0 ?? 1.2) - zc(m.z0 ?? 1.2)) * ezIO(lp), W0 = CW(), H0 = CH();
  c.save();
  if (!isLong()) { c.translate(540, 960); c.scale(1.78, 1.78); c.translate(-960, -540); }
  c.save(); c.scale(BW / W, BH / H); mapCam(c, m.lon, m.lat, z); drawMap(c, TMAP, m.date ?? 0, { z, pins: [] });
  if (m.areas) { c.save(); c.clip(LAND); for (const [lo, la, r, col] of m.areas) { const [x, y] = proj(lo, la), [x2] = proj(lo + r, la), rad = Math.abs(x2 - x) * Math.min(1, lt / 1.2 + .2); const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col || 'rgba(214,48,40,.45)'); g.addColorStop(.8, col || 'rgba(214,48,40,.35)'); g.addColorStop(1, 'rgba(214,48,40,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); } c.restore(); c.fillStyle = TMAP.P.map.sea; c.fill(WATER); c.strokeStyle = TMAP.P.map.coast; c.lineWidth = 1.5 / z; c.stroke(LAND); }
  if (m.route) mapRoute(c, m.route, Math.min(1, .1 + lt / Math.max(2, (sh.s1 - sh.s0) * .8)), z);
  const placedL = []; (m.labels || []).forEach((l, i) => { if (lt <= .3 + i * .4) return; const fs = isLong() ? 58 : 40; let [lx, ly] = proj(l[1], l[2]), dy = 0; for (let k = 0; k < 4 && placedL.some(p => Math.abs(p[0] - lx) < fs * 6 / z && Math.abs(p[1] - (ly + dy)) < fs * 1.1 / z); k++) dy += fs * 1.15 / z; placedL.push([lx, ly + dy]); if (dy) { c.save(); c.translate(0, dy); } mapLabel(c, l[0], l[1], l[2], z, fs, l[3] ?? 14); if (dy) c.restore(); });
  c.restore(); c.restore();
  if (m.cast) drawCast(c, m.cast, t, lt, sh.s1 - sh.s0, 'white');
}

function titleCard(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show; SCN.white(c); const n = Math.min(1, lt / 1.1); c.save(); c.beginPath(); c.rect(0, 0, 40 + n * W0, H0); c.clip(); markerFit(c, m.text, W0 / 2, isLong() ? 260 : 520, isLong() ? 190 : 150, W0 - 120); if (m.sub) markerFit(c, m.sub, W0 / 2, isLong() ? 360 : 640, isLong() ? 70 : 64, W0 - 160, '#D63A2F'); c.restore(); if (m.cast) drawCast(c, m.cast, t, lt, sh.s1 - sh.s0, 'white'); }
function chapterCard(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show; paperBg(c); const L = isLong(); const a = ezB(lt / .4); c.save(); c.translate(L ? 560 : W0 / 2, L ? 520 : 640); c.scale(a, a); markerFit(c, String(m.year || ''), 0, 0, L ? 240 : 220, L ? 900 : 960, '#D63A2F'); c.restore(); markerFit(c, m.title || '', L ? 560 : W0 / 2, L ? 690 : 800, L ? 100 : 90, L ? 960 : 980);
  if (m.bg) { const bx = L ? 1100 : 140, by = L ? 200 : 960, bw = L ? 740 : 800, bh = L ? 680 : 760; c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.translate(bx, by); const sc = Math.max(bw / BW, bh / BH) * 1.25; c.scale(sc, sc); c.translate(-(BW - bw / sc) / 2, -(BH - bh / sc) / 2); const sid = T.sid; SCN[m.bg](c, t); T.sid = sid; c.restore(); hd(c, rect(bx, by, bw, bh), { w: 7 }); } }
function cardShot(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show, L = isLong(); paperBg(c); if (m.label) markerFit(c, m.label, W0 / 2, L ? 250 : 560, L ? 90 : 84, W0 - 120); let big = String(m.big || ''); const num = big.match(/^([~$£€]?)([\d,]+)(.*)$/); if (num && lt < 1.2) { const v = parseInt(num[2].replace(/,/g, ''), 10), k = ezIO(lt / 1.2); big = num[1] + Math.round(v * k).toLocaleString('en-US') + num[3]; } const a = ezB(lt / .45); c.save(); c.translate(W0 / 2, L ? 560 : 900); c.scale(a, a); markerFit(c, big, 0, 60, L ? 250 : 230, W0 - 100, '#D63A2F'); c.restore(); if (m.sub) { c.save(); c.font = `${L ? 64 : 62}px "Patrick Hand", sans-serif`; c.fillStyle = T.ink; c.textAlign = 'center'; wrapLines(c, m.sub, W0 - 200).forEach((l, i) => c.fillText(l, W0 / 2, (L ? 780 : 1180) + i * 70)); c.restore(); } if (m.cast) drawCast(c, m.cast.map(e => Object.assign({ x: L ? .88 : .8, s: .8 }, e)), t, lt, sh.s1 - sh.s0, 'white'); }
function quoteShot(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show, L = isLong(); paperBg(c); c.save(); c.font = `${L ? 84 : 78}px "Permanent Marker", cursive`; const lines = wrapLines(c, '"' + m.text + '"', W0 - (L ? 360 : 160)); const y0 = (L ? 540 : 800) - lines.length * (L ? 50 : 48); lines.forEach((l, i) => { const a = Math.max(0, Math.min(1, (lt - .2 - i * .45) / .25)); c.globalAlpha = a; c.fillStyle = T.ink; c.textAlign = 'center'; c.fillText(l, W0 / 2, y0 + i * (L ? 104 : 100)); }); c.globalAlpha = 1; c.font = `${L ? 52 : 50}px "Patrick Hand", sans-serif`; c.fillStyle = '#6A5A4A'; c.fillText('- ' + (m.who || ''), W0 / 2, y0 + lines.length * (L ? 104 : 100) + 40); c.restore(); if (m.cast) drawCast(c, m.cast, t, lt, sh.s1 - sh.s0, 'white'); }
function listShot(c, sh, t, lt) { const W0 = CW(), m = sh.show, L = isLong(); SCN.white(c); const a = ezB(lt / .4); c.save(); c.translate(W0 / 2, L ? 470 : 760); c.scale(a, a); c.rotate(-.05); markerFit(c, 'Number ' + (m.n || ''), 0, 0, L ? 200 : 170, W0 - 100, '#D63A2F'); c.restore(); if (lt > .5) markerFit(c, m.title || '', W0 / 2, L ? 700 : 1000, L ? 110 : 96, W0 - 140); if (m.cast) drawCast(c, m.cast, t, lt, sh.s1 - sh.s0, 'white'); }
function compareShot(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show, L = isLong(); const bg = m.bg || 'field'; drawBg(c, bg, t); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, 0, W0, H0);
  const half = (side, spec2, x0) => { const k = side === 'left' ? 0 : 1; c.save(); c.beginPath(); if (L) c.rect(x0, 0, W0 / 2, H0); else c.rect(0, k * H0 / 2, W0, H0 / 2); c.clip(); if (spec2.cast) drawCast(c, spec2.cast.map(e => Object.assign({ x: L ? (k ? .75 : .25) : .5 }, e)), t, lt, sh.s1 - sh.s0, bg); c.restore(); stickerPop(c, spec2.label || '', L ? x0 + W0 / 4 : W0 / 2, L ? 200 : (k ? H0 / 2 + 170 : 290), lt - .2 - k * .5, k ? '#2F6FC2' : '#E3261B'); };
  half('left', m.left || {}, 0); half('right', m.right || {}, W0 / 2); if (L) line(c, poly([[960, -20], [948, 300], [972, 560], [950, 820], [962, 1100]], 40, false), 12, '#FFFFFF'); else line(c, poly([[-20, 960], [300, 948], [560, 972], [820, 950], [1100, 962]], 40, false), 12, '#FFFFFF'); }
function endShot(c, sh, t, lt) { const W0 = CW(), H0 = CH(), m = sh.show, L = isLong(); drawBg(c, 'field', t); drawCast(c, (m.cast || [{ id: 'host', pose: 'wave', mood: 'happy' }]).map((e, i, arr) => L && e.x == null ? Object.assign({ x: arr.length > 1 ? .7 + i * .16 : .8 }, e) : e), t, lt, sh.s1 - sh.s0, 'field'); const a = ezB(lt / .4); const tx = L ? 760 : W0 / 2; if (L) { c.save(); c.globalAlpha = .85; hd(c, rect(tx - 560, 150, 1120, m.next ? 470 : 280), { fill: '#FFFFFF', w: 6, amp: .6 }); c.restore(); } c.save(); c.translate(tx, L ? 330 : 470); c.scale(a, a); c.font = `${L ? 170 : 150}px "Luckiest Guy", Anton, sans-serif`; c.textAlign = 'center'; c.lineJoin = 'round'; c.strokeStyle = '#111'; c.lineWidth = 26; c.strokeText(L ? 'SUBSCRIBE' : 'FOLLOW', 0, 0); c.fillStyle = '#FFD43B'; c.fillText(L ? 'SUBSCRIBE' : 'FOLLOW', 0, 0); c.font = `${L ? 64 : 64}px Anton, sans-serif`; c.lineWidth = 14; c.strokeText('HISTORY PROS', 0, 100); c.fillStyle = '#FFF'; c.fillText('HISTORY PROS', 0, 100); c.restore();
  if (m.next && lt > .6) { c.save(); c.font = `${L ? 58 : 56}px "Patrick Hand", sans-serif`; c.textAlign = 'center'; c.lineJoin = 'round'; c.strokeStyle = '#111'; c.lineWidth = 10; const txt = 'Next: ' + m.next; wrapLines(c, txt, L ? 1100 : W0 - 160).forEach((l, i) => { c.strokeText(l, L ? 760 : W0 / 2, (L ? 520 : 800) + i * 64); c.fillStyle = '#FFF'; c.fillText(l, L ? 760 : W0 / 2, (L ? 520 : 800) + i * 64); }); c.restore(); }
}

/* Captions: word-by-word for shorts, dialogue subtitles for long-form. */
function shortCaptions(c, t) {
  const b = TV.beats.find(b => t >= b.t0 - .05 && t <= b.t1 + .25); if (!b || !b.words) return;
  const ws = b.words; let cur = -1; ws.forEach((x, i) => { if (t >= x.s) cur = i; }); if (cur < 0) cur = 0;
  const start = Math.floor(cur / 3) * 3, chunk = ws.slice(start, start + 3);
  c.save(); const size = 108; c.font = `${size}px "Luckiest Guy", Anton, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  const text = chunk.map(x => x.w.toUpperCase()), sp = c.measureText(' ').width; const tw = text.reduce((a, x) => a + c.measureText(x).width, 0) + sp * (text.length - 1);
  const sc = Math.min(1, 860 / tw), pop = 1 + .1 * (1 - Math.min(1, Math.max(0, (t - chunk[0].s) / .12))); c.translate(505, 1360); c.scale(sc * pop, sc * pop);
  let x = -tw / 2; text.forEach((w, i) => { const on = start + i === cur; c.strokeStyle = '#111'; c.lineWidth = 22; c.strokeText(w, x, 0); c.fillStyle = on ? '#FFD43B' : '#FFFFFF'; c.fillText(w, x, 0); x += c.measureText(w).width + sp; });
  c.restore();
}
function longSubs(c, t) { const b = TV.beats.find(b => b.who !== 'N' && t >= b.t0 - .05 && t <= b.t1 + .3); if (!b) return; c.save(); c.font = '60px "Patrick Hand", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; wrapLines(c, b.say, 1500).forEach((l, i, arr) => { const y = 1010 - (arr.length - 1 - i) * 66; c.strokeStyle = '#111'; c.lineWidth = 11; c.strokeText(l, 960, y); c.fillStyle = '#FFF'; c.fillText(l, 960, y); }); c.restore(); }
function placeBanner(c, text, lt) { if (!text) return; const a = Math.min(1, Math.max(0, (lt - .05) / .25)); if (!a) return; c.save(); c.globalAlpha = a; const long = isLong(); let size = long ? 50 : 60; c.font = `${size}px "Patrick Hand", sans-serif`; while (c.measureText(text).width > (long ? 900 : 800) && size > 30) { size -= 2; c.font = `${size}px "Patrick Hand", sans-serif`; } const w = c.measureText(text).width + 56, h = size + 26, x = long ? 50 : 505 - w / 2, y = long ? 44 : 346; hd(c, rect(x, y, w, h), { fill: '#FFE8A3', w: 4, amp: .5 }); c.fillStyle = T.ink; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, x + 28, y + h / 2 + 2); c.restore(); }
function hookBar(c, text) { if (!text) return; c.save(); let size = 70; c.font = `${size}px Anton, sans-serif`; while (c.measureText(text).width > 820 && size > 40) { size -= 4; c.font = `${size}px Anton, sans-serif`; } const w = c.measureText(text).width + 70; hd(c, rect(505 - w / 2, 300 - size - 10, w, size + 44), { fill: '#FFFFFF', w: 6, amp: .6 }); c.fillStyle = T.ink; c.textAlign = 'center'; c.fillText(text, 505, 308); c.restore(); }

function shotAtT(t) { let k = 0; TV.shots.forEach((s, i) => { if (t >= s.s0) k = i; }); return k; }
function tvFrame(c, t) {
  frameStart(t); const W0 = CW(), H0 = CH(), k = shotAtT(t), sh = TV.shots[k], lt = t - sh.s0, dur = Math.max(.1, sh.s1 - sh.s0), lp = Math.min(1, lt / dur), m = sh.show;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W0, H0);
  c.save(); const punch = 1 + .045 * (1 - Math.min(1, lt / .22)); c.translate(W0 / 2, H0 / 2); c.scale(punch, punch); c.translate(-W0 / 2, -H0 / 2);
  switch (m.k) {
    case 'scene': { _fxGround = groundY(m.bg); c.save();
      camera(c, sh, lt, lp); drawBg(c, m.bg, t, m.cx); fxLayer(c, m.fx, t, false);
      drawObjects(c, m.objects, t, lt, dur, m.bg, false);
      const placed = drawCast(c, m.cast || [], t, lt, dur, m.bg);
      drawObjects(c, m.objects, t, lt, dur, m.bg, true);
      fxLayer(c, m.fx, t, true); if (m.tag) { const p = placed.find(e => e.id === m.tag.id); if (p && p._x != null) nameTag(c, m.tag.text, Math.max(isLong() ? 200 : 220, Math.min(W0 - (isLong() ? 200 : 260), p._x)), Math.max(isLong() ? 120 : 460, p._y - 90 * p._s), lt); }
      c.restore(); placeBanner(c, m.place, lt); (m.stickers || []).forEach((s, i) => stickerPop(c, s.text, s.x != null ? s.x * W0 : (isLong() ? (m.tag ? W0 * .74 : W0 / 2) : W0 / 2 - 35), s.y != null ? s.y * H0 : (isLong() ? (m.place ? 200 : 130) + i * 120 : (m.tag ? 560 : m.place ? 520 : 470) + i * 125), lt - (s.at ?? .3), s.color)); break; }
    case 'map': mapShot(c, sh, t, lt, lp); break;
    case 'title': titleCard(c, sh, t, lt); break;
    case 'chapter': chapterCard(c, sh, t, lt); break;
    case 'card': cardShot(c, sh, t, lt); break;
    case 'quote': quoteShot(c, sh, t, lt); break;
    case 'list': listShot(c, sh, t, lt); break;
    case 'compare': compareShot(c, sh, t, lt); break;
    case 'end': endShot(c, sh, t, lt); break;
    case 'flag': flagShot(c, sh, t, lt); break;
  }
  c.restore();
  if (isLong()) longSubs(c, t);
  else { if (['scene', 'map', 'compare', 'flag'].includes(m.k)) hookBar(c, TV.hook); shortCaptions(c, t); }
  if (t < .25) { c.fillStyle = `rgba(0,0,0,${1 - t / .25})`; c.fillRect(0, 0, W0, H0); }
  if (t > TV.duration - .6) { c.fillStyle = `rgba(0,0,0,${Math.min(1, (t - TV.duration + .6) / .6)})`; c.fillRect(0, 0, W0, H0); }
}
