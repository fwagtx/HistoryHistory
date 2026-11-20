/* "PAPER THEATRE" renderer — built to the History Pros Style Bible v1. 1080x1920 Shorts. */
const VW = 1080, VH = 1920, FPS = 30;
const P = { ink: '#2B2118', parch: '#EADFC3', parchS: '#CDBE98', sea: '#8DB1BA', sky0: '#A9C6CF', sky1: '#E6E0CC', skinL: '#F0C9A0', skinM: '#C98F5F', skinD: '#7E5133',
  A: '#2F5D9E', B: '#B8402F', acc: '#E8A93A', edge: '#F7F1E1' };
function rnd(s) { const x = Math.sin(s * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); }
function dark(hex, k = .18) { const n = parseInt(hex.slice(1), 16), f = v => Math.round(v * (1 - k)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), eio = x => { x = cl(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }, eo = x => 1 - Math.pow(1 - cl(x), 3);
function pop(lt) { const f = lt * FPS; if (f < 0) return 0; if (f < 3) return .9 + (1.04 - .9) * f / 3; if (f < 6) return 1.04 - .04 * (f - 3) / 3; return 1; }
let GRAIN = null; function grain(c) { if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = VW; GRAIN.height = VH; const g = GRAIN.getContext('2d'); for (let i = 0; i < 60000; i++) { g.fillStyle = i & 1 ? '#000' : '#fff'; g.globalAlpha = .5; g.fillRect(rnd(i) * VW, rnd(i + 3) * VH, 2, 2); } } c.save(); c.globalAlpha = .04; c.drawImage(GRAIN, 0, 0); c.restore(); }
/* ---- cut-out: draw shape into an offscreen layer, add paper edge + drop shadow ---- */
function cutout(c, w, h, ox, oy, draw, x, y, s = 1, rot = 0) { // draw(ctx) in a w×h local box; (ox,oy) = anchor in that box; placed at x,y with scale s
  const pad = 16, L = document.createElement('canvas'); L.width = w + pad * 2; L.height = h + pad * 2; const g = L.getContext('2d'); g.translate(pad, pad); draw(g);
  const E = document.createElement('canvas'); E.width = L.width; E.height = L.height; const e = E.getContext('2d');
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; e.drawImage(L, Math.cos(a) * 7, Math.sin(a) * 7); } e.globalCompositeOperation = 'source-in'; e.fillStyle = P.edge; e.fillRect(0, 0, E.width, E.height); e.globalCompositeOperation = 'source-over'; e.drawImage(L, 0, 0);
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14 / s; c.shadowOffsetY = 6 / s; c.drawImage(E, -ox - pad, -oy - pad); c.restore();
}
function inkFill(g, path, fill, lw = 6) { g.fillStyle = fill; g.fill(path); g.strokeStyle = P.ink; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path); }
function shadeRight(g, path, fill, x0, x1, frac = .36) { g.save(); g.clip(path); g.fillStyle = dark(fill); g.fillRect(x0 + (x1 - x0) * (1 - frac), -2000, 4000, 4000); g.restore(); }
function rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
/* ---- characters (local box 600×1000, feet at (300,1000); total height ~980) ---- */
function arm(g, x0, y0, x1, y1, sleeve, skin) { g.lineCap = 'round'; g.strokeStyle = P.ink; g.lineWidth = 70; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = sleeve; g.lineWidth = 58; g.stroke();
  const h = new Path2D(); h.arc(x1, y1, 36, 0, 7); inkFill(g, h, skin); }
const POSES = { stand: [[-150, 120], [150, 120]], point: [[-150, 120], [260, -10]], up: [[-210, -170], [210, -170]], shrug: [[-230, -30], [230, -30]], hold: [[-150, 120], [300, -200]], cross: [[-60, 40], [60, 40]], bow: [[-200, -40], [190, -20]] };
function person(g, o) {
  const cx = 300, skin = o.skin || P.skinL, tunic = o.tunic || P.A, sh = [cx, 470];
  // cloak behind
  if (o.cloak) { const cp = new Path2D(); cp.moveTo(cx - 150, 450); cp.lineTo(cx + 150, 450); cp.lineTo(cx + 190, 860); cp.lineTo(cx - 190, 860); cp.closePath(); inkFill(g, cp, o.cloak); shadeRight(g, cp, o.cloak, cx - 190, cx + 190); }
  // legs
  for (const lx of [-62, 62]) { const lp = rr(cx + lx - 38, 820, 76, 175, 30); inkFill(g, lp, o.legs || '#5A4632'); const sp = rr(cx + lx - 48, 950, 96, 48, 20); inkFill(g, sp, '#3A2C20'); }
  // torso
  const t = new Path2D(); t.moveTo(cx - 115, 450); t.lineTo(cx + 115, 450); t.quadraticCurveTo(cx + 150, 455, cx + 150, 500); t.lineTo(cx + 145, 840); t.lineTo(cx - 145, 840); t.lineTo(cx - 150, 500); t.quadraticCurveTo(cx - 150, 455, cx - 115, 450); t.closePath();
  inkFill(g, t, tunic); shadeRight(g, t, tunic, cx - 150, cx + 150);
  if (o.belt) { const b = rr(cx - 148, 700, 296, 30, 6); inkFill(g, b, o.belt, 5); }
  if (o.brooch) { const b = new Path2D(); b.arc(cx - 95, 490, 22, 0, 7); inkFill(g, b, P.acc, 5); }
  // arms
  const [la, ra] = POSES[o.pose || 'stand']; arm(g, cx - 115, 500, cx + la[0], 500 + la[1] + 120, o.sleeve || tunic, skin); arm(g, cx + 115, 500, cx + ra[0], 500 + ra[1] + 120, o.sleeve || tunic, skin);
  // head
  const hy = 260, hd = new Path2D(); hd.ellipse(cx, hy, 205, 190, 0, 0, 7); inkFill(g, hd, skin); shadeRight(g, hd, skin, cx - 205, cx + 205, .28);
  if (o.hair) { const hp = new Path2D(); hp.ellipse(cx, hy - 40, 205, 160, 0, Math.PI * 1.02, Math.PI * 1.98); hp.closePath(); inkFill(g, hp, o.hair); }
  if (o.beard) { const bp = new Path2D(); bp.moveTo(cx - 175, hy + 40); bp.quadraticCurveTo(cx - 170, hy + 250, cx, hy + 270); bp.quadraticCurveTo(cx + 170, hy + 250, cx + 175, hy + 40); bp.quadraticCurveTo(cx + 120, hy + 150, cx, hy + 150); bp.quadraticCurveTo(cx - 120, hy + 150, cx - 175, hy + 40); bp.closePath(); inkFill(g, bp, o.beard); shadeRight(g, bp, o.beard, cx - 175, cx + 175, .3); }
  if (o.helmet) { const hm = new Path2D(); hm.moveTo(cx - 210, hy - 10); hm.bezierCurveTo(cx - 210, hy - 260, cx + 210, hy - 260, cx + 210, hy - 10); hm.lineTo(cx + 210, hy + 10); hm.lineTo(cx - 210, hy + 10); hm.closePath(); inkFill(g, hm, '#9A9DA2'); shadeRight(g, hm, '#9A9DA2', cx - 210, cx + 210, .3);
    const band = rr(cx - 214, hy - 22, 428, 36, 8); inkFill(g, band, '#7C7F84', 5); const ng = rr(cx - 16, hy - 10, 32, 120, 10); inkFill(g, ng, '#7C7F84', 5);
    if (o.arrowHit) { g.save(); g.translate(cx + 60, hy - 170); g.rotate(-.7); g.strokeStyle = P.ink; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -260); g.stroke(); g.strokeStyle = '#8A6A44'; g.lineWidth = 9; g.stroke(); const f = new Path2D(); f.moveTo(0, -250); f.lineTo(-40, -300); f.lineTo(0, -280); f.lineTo(40, -300); f.closePath(); inkFill(g, f, '#E9E1CE', 5); g.restore(); } }
  face(g, cx + (o.look || 0) * 40, hy + 10, o.expr || 'neutral', !!o.helmet);
  if (o.hold === 'sign') sign(g, cx + 330, 120, o.signText || '', o.signW);
  if (o.hold === 'bow') { g.strokeStyle = P.ink; g.lineWidth = 22; g.beginPath(); g.arc(cx + 300, 520, 200, -1.2, 1.2); g.stroke(); g.strokeStyle = '#8A5A2E'; g.lineWidth = 12; g.stroke(); g.strokeStyle = P.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 300 + Math.cos(-1.2) * 200, 520 + Math.sin(-1.2) * 200); g.lineTo(cx + 300 + Math.cos(1.2) * 200, 520 + Math.sin(1.2) * 200); g.stroke(); }
}
function face(g, x, y, ex, helmet) {
  g.fillStyle = P.ink; g.strokeStyle = P.ink; g.lineCap = 'round'; g.lineWidth = 11;
  const ey = y - 10, eyR = 15; for (const dx of [-70, 70]) { g.beginPath(); g.arc(x + dx, ey, eyR, 0, 7); g.fill(); }
  const brow = { neutral: [[-6, 0], [-6, 0]], happy: [[-20, -6], [-20, -6]], angry: [[-14, 18], [-14, 18]], shocked: [[-34, -34], [-34, -34]], smug: [[-6, 0], [-34, -20]], worried: [[8, -24], [8, -24]] }[ex];
  if (!(helmet && ex !== 'angry' && ex !== 'worried' && ex !== 'shocked')) for (const [i, dx] of [[0, -70], [1, 70]]) { const [outer, inner] = brow[i], s = Math.sign(dx); g.beginPath(); g.moveTo(x + dx + s * 34, ey - 52 + outer); g.lineTo(x + dx - s * 30, ey - 52 + inner); g.stroke(); }
  const my = y + 80; g.lineWidth = 10; g.beginPath();
  if (ex === 'neutral') { g.moveTo(x - 38, my); g.lineTo(x + 38, my); g.stroke(); }
  if (ex === 'happy') { g.moveTo(x - 50, my - 8); g.quadraticCurveTo(x, my + 40, x + 50, my - 8); g.stroke(); }
  if (ex === 'angry') { g.moveTo(x - 42, my + 12); g.quadraticCurveTo(x, my - 12, x + 42, my + 12); g.stroke(); }
  if (ex === 'shocked') { g.ellipse(x, my + 8, 22, 30, 0, 0, 7); g.fill(); }
  if (ex === 'smug') { g.moveTo(x - 40, my + 6); g.quadraticCurveTo(x + 10, my + 14, x + 52, my - 14); g.stroke(); }
  if (ex === 'worried') { g.moveTo(x - 44, my + 6); g.bezierCurveTo(x - 20, my - 10, x + 20, my + 22, x + 44, my + 2); g.stroke(); }
}
function sign(g, cx, y, text, w = 520) { const st = rr(cx - 8, y + 40, 16, 300, 6); inkFill(g, st, '#8A5A2E', 5); const b = rr(cx - w / 2, y - 90, w, 150, 14); inkFill(g, b, '#FBF7EC', 7);
  g.fillStyle = P.ink; g.textAlign = 'center'; let fs = 70; g.font = `${fs}px "Archivo Black"`; while (g.measureText(text).width > w - 50 && fs > 30) { fs -= 4; g.font = `${fs}px "Archivo Black"`; } g.fillText(text, cx, y + 10 + fs * .35); }
function drawPerson(c, o, x, y, h, lt = 1, flip = false) { const s = h / 1000 * pop(lt); if (s <= 0) return; cutout(c, o.hold ? 1000 : 600, 1000, 300, 1000, g => { if (flip) { g.translate(600, 0); g.scale(-1, 1); } person(g, o); }, x, y, s); }
/* ---- props ---- */
function vikingShip(g) { const hull = new Path2D(); hull.moveTo(20, 200); hull.quadraticCurveTo(300, 330, 580, 200); hull.lineTo(560, 160); hull.quadraticCurveTo(300, 250, 40, 160); hull.closePath(); inkFill(g, hull, '#8A5A2E'); shadeRight(g, hull, '#8A5A2E', 20, 580, .3);
  for (const [px, py] of [[40, 165], [560, 165]]) { const pr = new Path2D(); pr.moveTo(px, py); pr.quadraticCurveTo(px + (px < 300 ? -40 : 40), py - 90, px + (px < 300 ? 0 : 0), py - 130); g.strokeStyle = P.ink; g.lineWidth = 22; g.stroke(pr); g.strokeStyle = '#8A5A2E'; g.lineWidth = 12; g.stroke(pr); }
  for (let i = 0; i < 6; i++) { const sh = new Path2D(); sh.arc(110 + i * 76, 205, 28, 0, 7); inkFill(g, sh, i % 2 ? P.B : P.acc, 5); }
  const mast = rr(292, 0, 16, 200, 4); inkFill(g, mast, '#5A3A22', 5); const sail = new Path2D(); sail.moveTo(170, 20); sail.lineTo(430, 20); sail.quadraticCurveTo(450, 90, 425, 150); sail.lineTo(175, 150); sail.quadraticCurveTo(150, 90, 170, 20); sail.closePath(); inkFill(g, sail, '#F2EAD6'); g.save(); g.clip(sail); g.fillStyle = P.B; for (let i = 0; i < 4; i++) g.fillRect(185 + i * 70, 0, 34, 200); g.restore(); g.strokeStyle = P.ink; g.lineWidth = 6; g.stroke(sail); }
function carrack(g) { const hull = new Path2D(); hull.moveTo(20, 170); hull.lineTo(560, 150); hull.lineTo(520, 260); hull.lineTo(80, 260); hull.closePath(); inkFill(g, hull, '#6E4A2C'); shadeRight(g, hull, '#6E4A2C', 20, 560, .3); const castle = rr(430, 100, 140, 60, 6); inkFill(g, castle, '#6E4A2C', 5);
  for (const [mx, mh, sw] of [[200, 230, 150], [360, 270, 180]]) { const m = rr(mx - 7, 150 - mh, 14, mh, 4); inkFill(g, m, '#4A3020', 5); for (let j = 0; j < 2; j++) { const sy = 150 - mh + 20 + j * mh * .42, s = new Path2D(); s.moveTo(mx - sw / 2, sy); s.lineTo(mx + sw / 2, sy); s.quadraticCurveTo(mx + sw / 2 + 14, sy + 45, mx + sw / 2 - 6, sy + 90); s.lineTo(mx - sw / 2 + 6, sy + 90); s.quadraticCurveTo(mx - sw / 2 - 14, sy + 45, mx - sw / 2, sy); s.closePath(); inkFill(g, s, '#F2EAD6', 5); } }
  const cross = new Path2D(); cross.rect(345, -60, 30, 70); inkFill(g, cross, '#F2EAD6', 4); g.fillStyle = P.B; g.fillRect(354, -55, 12, 60); g.fillRect(347, -36, 26, 12); }
function flagPin(g, col) { const pole = rr(0, 0, 12, 200, 4); inkFill(g, pole, '#5A3A22', 5); const f = new Path2D(); f.moveTo(12, 6); f.lineTo(130, 30); f.lineTo(12, 64); f.closePath(); inkFill(g, f, col, 5); }
function sodHouse(g, w = 160) { const h = new Path2D(); h.moveTo(0, 90); h.quadraticCurveTo(0, 0, w / 2, 0); h.quadraticCurveTo(w, 0, w, 90); h.closePath(); inkFill(g, h, '#7F8F5A'); shadeRight(g, h, '#7F8F5A', 0, w, .35); const d = rr(w / 2 - 18, 44, 36, 46, 8); inkFill(g, d, '#3A2C20', 4); }
/* ---- backgrounds (flat layers, no outlines) ---- */
function parchmentBg(c) { c.fillStyle = P.parch; c.fillRect(0, 0, VW, VH); const g = c.createRadialGradient(VW / 2, VH / 2, VH * .3, VW / 2, VH / 2, VH * .75); g.addColorStop(0, 'rgba(205,190,152,0)'); g.addColorStop(1, 'rgba(205,190,152,.9)'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  c.strokeStyle = 'rgba(43,33,24,.18)'; c.lineWidth = 3; c.strokeRect(40, 40, VW - 80, VH - 80); }
function sky(c, y1) { const g = c.createLinearGradient(0, 0, 0, y1); g.addColorStop(0, P.sky0); g.addColorStop(1, P.sky1); c.fillStyle = g; c.fillRect(0, 0, VW, y1); }
function layer(c, col, y0, amp, seed, wave = 140, shadow = true) { const p = new Path2D(); p.moveTo(-20, VH + 20); p.lineTo(-20, y0); for (let x = -20; x <= VW + 40; x += 20) p.lineTo(x, y0 + Math.sin(x / wave + seed) * amp + Math.sin(x / (wave * .37) + seed * 2) * amp * .35); p.lineTo(VW + 40, VH + 20); p.closePath();
  if (shadow) { c.save(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = col; c.fill(p); c.restore(); } else { c.fillStyle = col; c.fill(p); } }
function seaBg(c, t, stormy) { sky(c, 1000); if (stormy) { c.fillStyle = 'rgba(30,42,54,.35)'; c.fillRect(0, 0, VW, 1000); }
  c.fillStyle = '#B9C9C9'; for (const [x, y, r] of [[200, 260, 90], [300, 230, 110], [420, 270, 80], [760, 340, 70], [860, 320, 95]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  layer(c, '#7FA4AE', 900, 10, 1, 60, false); layer(c, P.sea, 1010, 22, 2 + t * .8, 80); layer(c, '#7299A3', 1250, 30, 4 + t * 1.1, 70); layer(c, '#668E99', 1560, 34, 7 + t * 1.4, 64);
  if (stormy) { c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 4; for (let i = 0; i < 60; i++) { const x = (rnd(i) * VW + t * 400) % VW, y = (rnd(i + 5) * 1600 + t * 900) % 1700; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 18, y + 60); c.stroke(); } } }
function shoreBg(c) { sky(c, 1150); layer(c, '#B7C6B0', 900, 40, 3, 220, false); layer(c, '#8FA88C', 1000, 30, 5, 150);
  const tree = (x, y, s, col) => { c.save(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 300 * s); c.lineTo(x + 110 * s, y); c.lineTo(x - 110 * s, y); c.closePath(); c.fill(); c.restore(); };
  for (let i = 0; i < 12; i++) tree(40 + i * 92 + rnd(i) * 40, 1150 + rnd(i + 9) * 40, .9 + rnd(i + 3) * .5, i % 2 ? '#4F6B4F' : '#5C7A58');
  layer(c, '#D9C49A', 1180, 14, 9, 200); c.fillStyle = P.sea; c.beginPath(); c.moveTo(-20, 1500); c.quadraticCurveTo(400, 1440, 700, 1600); c.lineTo(700, VH + 20); c.lineTo(-20, VH + 20); c.fill(); }
/* ---- map (Mercator, real coastlines) ---- */
const merc = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360)) * 180 / Math.PI;
function mapProj(lon0, lat0, degW) { const k = VW / degW; return (lo, la) => [VW / 2 + (lo - lon0) * k, VH / 2 - (merc(la) - merc(lat0)) * k]; }
const MAPCACHE = {};
function mapBase(key, lon0, lat0, degW, labels) { if (MAPCACHE[key]) return MAPCACHE[key]; const Pj = mapProj(lon0, lat0, degW), cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const c = cv.getContext('2d');
  c.fillStyle = P.sea; c.fillRect(0, 0, VW, VH); c.strokeStyle = 'rgba(43,33,24,.08)'; c.lineWidth = 1.5; for (let lo = -180; lo <= 180; lo += 10) { const [x] = Pj(lo, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, VH); c.stroke(); } for (let la = 0; la <= 80; la += 10) { const [, y] = Pj(0, la); c.beginPath(); c.moveTo(0, y); c.lineTo(VW, y); c.stroke(); }
  const path = new Path2D(); for (const r of GEO.land) { r.forEach(([lo, la], i) => { const [x, y] = Pj(lo, la); i ? path.lineTo(x, y) : path.moveTo(x, y); }); path.closePath(); }
  c.save(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = P.parch; c.fill(path); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke(path);
  for (const [t, lo, la, sz, it] of labels) { const [x, y] = Pj(lo, la); c.save(); c.textAlign = 'center'; c.font = `${it ? 'italic 600' : '700'} ${sz}px "Cormorant Garamond"`; c.letterSpacing = it ? '4px' : '6px'; c.fillStyle = it ? 'rgba(255,255,255,.8)' : 'rgba(43,33,24,.85)'; c.fillText(t, x, y); c.restore(); }
  return MAPCACHE[key] = { cv, Pj }; }
function dateTab(c, text) { c.save(); c.font = '700 44px "Cormorant Garamond"'; const w = c.measureText(text).width + 50; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = P.parch; c.beginPath(); c.roundRect(60, 120, w, 74, 10); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.roundRect(60, 120, w, 74, 10); c.stroke(); c.fillStyle = P.ink; c.font = '700 44px "Cormorant Garamond"'; c.textAlign = 'left'; c.fillText(text, 85, 172); }
function arrowPath(c, pts, prog, col = P.A) { if (prog <= 0) return; let tot = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let rem = tot * eio(prog), out = [pts[0]]; for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / seg[i - 1]); out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); rem -= seg[i - 1]; }
  const [ex, ey] = out[out.length - 1], [px, py] = out[Math.max(0, out.length - 2)], a = Math.atan2(ey - py, ex - px);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.strokeStyle = P.ink; c.lineWidth = 22; c.beginPath(); out.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.shadowColor = 'transparent'; c.strokeStyle = col; c.lineWidth = 14; c.stroke();
  c.translate(ex, ey); c.rotate(a); const h = new Path2D(); h.moveTo(34, 0); h.lineTo(-14, -30); h.lineTo(-14, 30); h.closePath(); c.fillStyle = col; c.fill(h); c.strokeStyle = P.ink; c.lineWidth = 5; c.stroke(h); c.restore(); }
/* ---- text ---- */
function caption(c, t) { const L = TL.lines.find(l => t >= l.start - .05 && t <= l.end + .2); if (!L) return; // chunk to 2–4 word lines, break after punctuation
  const segs = []; let cur = []; L.words.forEach(w => { cur.push(w); if (/[.,:?!…]$/.test(w[0])) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
  const chunks = []; for (const sg of segs) { const k = Math.ceil(sg.length / 4), n = Math.ceil(sg.length / k); for (let i = 0; i < sg.length; i += n) chunks.push(sg.slice(i, i + n)); }
  for (let i = chunks.length - 1; i > 0; i--) if (chunks[i].length === 1 && chunks[i - 1].length < 4) { chunks[i - 1].push(...chunks[i]); chunks.splice(i, 1); }
  const ch = chunks.find((k, i) => t < (chunks[i + 1] ? chunks[i + 1][0][1] : 1e9)) || chunks[chunks.length - 1]; const words = ch.map(w => w[0].replace(/^[‘"]|[’"]$/g, ''));
  c.save(); let fs = 64; c.font = `800 ${fs}px Inter`; while (c.measureText(words.join(' ')).width > 960 && fs > 44) { fs -= 2; c.font = `800 ${fs}px Inter`; } c.textAlign = 'left'; c.lineJoin = 'round'; const full = words.join(' '); let x = VW / 2 - c.measureText(full).width / 2; const y = VH * .7;
  for (const w of words) { const isAcc = /\d|Columbus|Thorvald|Leif|Greenland|Newfoundland/.test(w); c.lineWidth = 16; c.strokeStyle = '#000'; c.strokeText(w, x, y); c.fillStyle = isAcc ? P.acc : '#FFF'; c.fillText(w, x, y); x += c.measureText(w + ' ').width; } c.restore(); }
function bigTitle(c, lines, y, size, accIdx) { c.save(); c.textAlign = 'center'; c.font = `${size}px "Archivo Black"`; c.lineJoin = 'round'; lines.forEach((l, i) => { c.lineWidth = 16; c.strokeStyle = P.ink; c.strokeText(l, VW / 2, y + i * size * 1.08); c.fillStyle = i === accIdx ? P.acc : '#FFF'; c.fillText(l, VW / 2, y + i * size * 1.08); }); c.restore(); }
function stickerText(c, text, x, y, size, lt, rot = -.03) { const s = pop(lt); if (!s) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.font = `${size}px "Archivo Black"`; const w = c.measureText(text).width + 60, h = size * 1.5;
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = '#FBF7EC'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 12); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = P.ink; c.lineWidth = 6; c.stroke(); c.fillStyle = P.ink; c.textAlign = 'center'; c.fillText(text, 0, size * .36); c.restore(); }
/* ---- characters used ---- */
const LEIF = { tunic: '#5E7F4E', cloak: '#3F5E3A', brooch: true, beard: '#B5562B', hair: '#B5562B', belt: '#5A3A22', skin: P.skinL };
const THORVALD = { tunic: P.A, beard: '#C98B3A', helmet: true, belt: '#5A3A22', skin: P.skinL };
const NORSE = { tunic: P.A, beard: '#8A5A2E', helmet: true, belt: '#5A3A22', skin: P.skinL };
const LOCAL = { tunic: P.B, hair: '#2A211C', skin: P.skinM, belt: '#6A4A2E' };
/* ---- the edit ---- */
const W_ = (li, wi) => TL.lines[li].words[wi][1];
function shots() { return [
  [0, 'title'], [W_(0, 4), 'mapWest'], [W_(0, 9), 'landed'], [TL.lines[1].start - .05, 'ships'], [TL.lines[2].start - .05, 'leifWorried'],
  [TL.lines[3].start - .05, 'p1'], [W_(3, 7), 'p1b'], [TL.lines[4].start - .05, 'p2'], [W_(4, 10), 'p2b'], [TL.lines[5].start - .05, 'p3'],
  [TL.lines[6].start - .05, 'thorvald'], [TL.lines[7].start - .05, 'locals'], [W_(7, 7), 'smug'], [TL.lines[8].start - .05, 'home'], [TL.lines[9].start - .05, 'camp'], [TL.lines[10].start - .05, 'end']]; }
const MAPLBL = [['GREENLAND', -42, 70.5, 46], ['ICELAND', -18.7, 66.5, 34], ['BAFFIN', -71, 68, 30], ['NEWFOUNDLAND', -56.5, 47.2, 30], ['LABRADOR', -62, 54.5, 30], ['Atlantic Ocean', -38, 53, 38, 1], ['Labrador Sea', -54, 59.5, 30, 1]];
function frame(f) {
  const t = f / FPS, cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const c = cv.getContext('2d'); const S = shots(); let k = 0; for (let i = 0; i < S.length; i++) if (t >= S[i][0]) k = i; const lt = t - S[k][0], id = S[k][1];
  const M = () => mapBase('na', -48, 61, 52, MAPLBL), route = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]];
  if (id === 'title') { parchmentBg(c); c.save(); c.textAlign = 'center'; c.font = '700 48px "Cormorant Garamond"'; c.letterSpacing = '10px'; c.fillStyle = P.ink; c.fillText('c. 1000 AD', VW / 2, 330); c.restore(); bigTitle(c, ['WHY DIDN’T', 'THE VIKINGS', 'STAY IN', 'AMERICA?'], 470, 118, 3); drawPerson(c, { ...LEIF, expr: 'neutral', look: -.6, pose: 'stand' }, 640, 1700, 820, lt - .25); }
  if (id === 'mapWest' || id === 'landed' || id === 'home') { const m = M(); c.drawImage(m.cv, 0, 0); dateTab(c, 'c. 1000 AD'); const pts = route.map(([a, b]) => m.Pj(a, b));
    if (id === 'mapWest') arrowPath(c, pts, lt / .55);
    if (id === 'landed') { arrowPath(c, pts, 1); const [x, y] = m.Pj(-55.6, 51.4); cutout(c, 150, 210, 6, 200, g => flagPin(g, P.A), x, y, pop(lt - .1)); }
    if (id === 'home') { arrowPath(c, pts.slice().reverse(), lt / .6, P.acc); } }
  if (id === 'ships') { parchmentBg(c); c.fillStyle = 'rgba(43,33,24,.25)'; c.fillRect(VW / 2 - 2, 260, 4, 1100);
    cutout(c, 600, 340, 300, 300, vikingShip, 270, 900, .78); cutout(c, 600, 300, 300, 260, carrack, 810, 900, .8 * pop(lt - .5));
    c.save(); c.textAlign = 'center'; c.fillStyle = P.ink; c.font = '120px "Archivo Black"'; c.fillText('1000', 270, 1130); if (lt > .5) c.fillText('1492', 810, 1130); c.font = '700 40px "Cormorant Garamond"'; c.letterSpacing = '6px'; c.fillText('LEIF ERIKSON', 270, 1200); if (lt > .5) c.fillText('COLUMBUS', 810, 1200); c.restore(); }
  if (id === 'leifWorried') { parchmentBg(c); drawPerson(c, { ...LEIF, expr: 'worried', pose: 'shrug' }, VW / 2, 1900 + Math.max(0, 6 - lt * 60), 1500, 1); }
  if (id === 'p1' || id === 'p1b') { const m = mapBase('gl', -45, 63, 30, [['GREENLAND', -42, 67.5, 54], ['Norse settlements', -47, 60.2, 32, 1]]); c.drawImage(m.cv, 0, 0); dateTab(c, 'GREENLAND');
    const [gx, gy] = m.Pj(-47.5, 61.3); for (let i = 0; i < 8; i++) drawPerson(c, { ...NORSE, expr: 'neutral' }, gx - 210 + (i % 4) * 140, gy + Math.floor(i / 4) * 150, 190, id === 'p1' ? lt - i * .12 : 1);
    stickerText(c, 'PROBLEM 1', VW / 2, 420, 84, id === 'p1' ? lt : 1, -.04); if (id === 'p1b') stickerText(c, 'a few thousand people', VW / 2, 1200, 56, lt, .03); }
  if (id === 'p2' || id === 'p2b') { seaBg(c, t, true); const bob = Math.sin(lt * 5) * 6;
    if (id === 'p2') { cutout(c, 600, 340, 300, 300, vikingShip, VW / 2, 1430 + bob, 1.45); drawPerson(c, { ...NORSE, expr: 'shocked' }, 420, 1330 + bob, 520, 1); drawPerson(c, { ...NORSE, tunic: '#4C6E9E', beard: '#C98B3A', expr: 'worried' }, 680, 1330 + bob, 500, 1); stickerText(c, 'PROBLEM 2', VW / 2, 420, 84, lt); }
    else { drawPerson(c, { ...NORSE, expr: 'worried', pose: 'hold', hold: 'sign', signText: 'NO ROOF', signW: 420 }, 380, 1900 + bob, 1050, lt); } }
  if (id === 'p3') { shoreBg(c); drawPerson(c, { ...NORSE, expr: 'neutral', look: .5 }, 300 + 120 * eo(lt / .27) - 120, 1560, 620, 1); stickerText(c, 'PROBLEM 3', VW / 2, 420, 84, lt); }
  if (id === 'thorvald') { shoreBg(c); const hit = t >= W_(6, 13) - .05; drawPerson(c, { ...THORVALD, expr: hit ? 'shocked' : 'worried', arrowHit: hit }, VW / 2, 1880, 1250, 1);
    if (hit) stickerText(c, 'THORVALD ERIKSSON', VW / 2, 360, 56, t - W_(6, 13)); c.save(); c.font = 'italic 600 38px "Cormorant Garamond"'; c.textAlign = 'center'; c.fillStyle = P.ink; c.fillText('according to the sagas', VW / 2, 470); c.restore(); }
  if (id === 'locals') { shoreBg(c); for (let i = 0; i < 3; i++) drawPerson(c, { ...NORSE, expr: 'worried', look: .6 }, 130 + i * 105, 1560 + (i % 2) * 30, 330, 1);
    for (let i = 0; i < 6; i++) drawPerson(c, { ...LOCAL, expr: 'neutral', hold: i % 2 ? 'bow' : null, pose: i % 2 ? 'bow' : 'stand', look: -.6 }, 520 + (i % 3) * 190, 1470 + Math.floor(i / 3) * 170, 360, lt - i * .18, true); }
  if (id === 'smug') { shoreBg(c); drawPerson(c, { ...LOCAL, expr: 'smug', pose: 'cross', look: -.3 }, VW / 2, 1900 + (lt < 2 / FPS ? -6 : 0), 1350, 1); }
  if (id === 'camp') { const m = mapBase('nf', -56.5, 50.5, 16, [['NEWFOUNDLAND', -56, 48.6, 46], ['L’Anse aux Meadows', -55.6, 52.25, 32, 1]]); c.drawImage(m.cv, 0, 0); const [x, y] = m.Pj(-55.53, 51.58);
    for (let i = 0; i < 3; i++) cutout(c, 170, 100, 85, 90, g => sodHouse(g, 160), x - 120 + i * 120, y + (i % 2) * 30, .9 * pop(lt - i * .12));
    const tF = W_(9, 9); if (t >= tF - .05) stickerText(c, 'FOUND IN 1960', VW / 2, 420, 76, t - tF); dateTab(c, 'NEWFOUNDLAND'); }
  if (id === 'end') { parchmentBg(c); const tE = W_(10, 6); drawPerson(c, { ...LEIF, expr: 'smug', pose: t >= tE ? 'hold' : 'stand', hold: t >= tE ? 'sign' : null, signText: 'THE EASY PART', signW: 520 }, t >= tE ? 360 : VW / 2, 1880, t >= tE ? 1050 : 1350, 1); }
  caption(c, t); grain(c); return cv.toDataURL('image/jpeg', .92);
}
