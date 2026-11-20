/* Four templates for the same 14s opening. Reuses paper.js helpers (loaded before this file). */
const END = 14.4;
const w = (li, wi) => TL.lines[li].words[wi][1];
function newCanvas() { const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; return [cv, cv.getContext('2d')]; }
function pick(S, t) { let k = 0; for (let i = 0; i < S.length; i++) if (t >= S[i][0]) k = i; return [S[k][1], t - S[k][0]]; }
function out(c, cv, cap = true) { if (cap) caption(c, cv._t); grain(c); return cv.toDataURL('image/jpeg', .92); }
function T(c, txt, x, y, font, fill, stroke = P.ink, lw = 14, align = 'center') { c.save(); c.font = font; c.textAlign = align; c.lineJoin = 'round'; if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(txt, x, y); } c.fillStyle = fill; c.fillText(txt, x, y); c.restore(); }
function fitFont(c, txt, maxW, size, fam) { c.font = `${size}px ${fam}`; while (c.measureText(txt).width > maxW && size > 30) { size -= 4; c.font = `${size}px ${fam}`; } return size; }
function slam(lt) { const f = lt * FPS; if (f < 0) return 0; if (f < 4) return 1.22 - .22 * f / 4; if (f < 7) return 1 - .03 * Math.sin((f - 4) / 3 * Math.PI); return 1; }
/* ===================== T1 PAPER THEATRE (existing edit) ===================== */
function frameT1(f) { return frame(f); }
/* ===================== T2 MAP EXPLAINER ===================== */
function chips(c, active, labels) { const n = 3, cw = 300, gap = 24, x0 = VW / 2 - (n * cw + (n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) { const x = x0 + i * (cw + gap), on = i === active; c.save(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 12; c.shadowOffsetY = 5; c.fillStyle = on ? P.acc : 'rgba(247,241,225,.92)'; c.beginPath(); c.roundRect(x, 210, cw, 96, 16); c.fill(); c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 5; c.beginPath(); c.roundRect(x, 210, cw, 96, 16); c.stroke(); c.fillStyle = P.ink; c.textAlign = 'center'; const lab = labels[i] || '?'; let fs = fitFont(c, lab, cw - 30, 40, '"Archivo Black"'); c.fillText(lab, x + cw / 2, 258 + fs * .35); } }
function camera(c, z, fx, fy, draw) { c.save(); c.translate(VW / 2, VH / 2); c.scale(z, z); c.translate(-fx, -fy); draw(); c.restore(); }
function shipIcon(c, x, y, s, a = 0) { cutout(c, 600, 340, 300, 300, vikingShip, x, y, s, a); }
function frameT2(f) { const t = f / FPS, [cv, c] = newCanvas(); cv._t = t;
  const S = [[0, 'hook'], [w(0, 4), 'sail'], [w(0, 10), 'landed'], [TL.lines[1].start - .05, 'timeline'], [TL.lines[2].start - .05, 'question'], [TL.lines[3].start - .05, 'p1'], [w(3, 7), 'p1b']];
  const [id, lt] = pick(S, t); const m = mapBase('na', -48, 61, 52, MAPLBL), route = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]], pts = route.map(([a, b]) => m.Pj(a, b));
  if (id === 'hook' || id === 'sail' || id === 'landed' || id === 'question') {
    const z = id === 'hook' ? 1.18 - .1 * eio(t / 1.4) : id === 'question' ? 1 : 1.08, [gx, gy] = m.Pj(-47, 60);
    camera(c, z, VW / 2 + (gx - VW / 2) * .25, VH / 2, () => { c.drawImage(m.cv, 0, 0);
      if (id === 'sail') { const pr = eio(lt / (w(0, 10) - w(0, 4))); arrowPath(c, pts, pr); }
      if (id === 'landed' || id === 'question') arrowPath(c, pts, 1);
      if (id === 'hook') shipIcon(c, pts[0][0] + 40, pts[0][1] + 10, .3);
      if (id === 'sail') { let tot = 0, seg = []; for (let i = 1; i < pts.length; i++) { seg.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); tot += seg[i - 1]; } let rem = tot * eio(lt / (w(0, 10) - w(0, 4))), p = pts[0]; for (let i = 1; i < pts.length; i++) { const fr = cl(rem / seg[i - 1]); p = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * fr, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * fr]; rem -= seg[i - 1]; if (rem <= 0) break; } shipIcon(c, p[0], p[1] - 30, .3); }
      if (id === 'landed' || id === 'question') { const [x, y] = m.Pj(-55.6, 51.4); cutout(c, 150, 210, 6, 200, g => flagPin(g, P.B), x, y, id === 'landed' ? pop(lt) : 1); } });
    // big year plate
    if (id !== 'question') { const yr = id === 'hook' ? Math.round(800 + 200 * eo((t - .25) / .9)) : 1000; c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = P.parch; c.beginPath(); c.roundRect(VW / 2 - 260, 150, 520, 170, 18); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.roundRect(VW / 2 - 260, 150, 520, 170, 18); c.stroke();
    T(c, `${yr} AD`, VW / 2, 268, '110px "Archivo Black"', P.ink, null); }
    if (id === 'landed' && t >= w(0, 12) - .05) stickerText(c, 'NORTH AMERICA', VW / 2 - 60, 1180, 70, t - w(0, 12), -.03);
    if (id === 'question') { c.fillStyle = 'rgba(25,20,15,.6)'; c.fillRect(0, 0, VW, VH); bigTitle(c, ['SO WHY', 'DIDN’T THEY', 'STAY?'], 800, 130, 2); if (lt > .55) { c.save(); c.globalAlpha = cl((lt - .55) / .15); chips(c, -1, []); c.restore(); } } }
  if (id === 'timeline') { parchmentBg(c); const x0 = 140, x1 = 940, y = 1000, X = yr => x0 + (yr - 950) / 600 * (x1 - x0);
    c.strokeStyle = P.ink; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    for (let yr = 1000; yr <= 1500; yr += 100) { c.lineWidth = 6; c.beginPath(); c.moveTo(X(yr), y - 24); c.lineTo(X(yr), y + 24); c.stroke(); T(c, String(yr), X(yr), y + 80, '700 40px "Cormorant Garamond"', P.ink, null); }
    const pr = eio((t - w(1, 1)) / (w(1, 4) - w(1, 1))); if (pr > 0) { c.strokeStyle = P.acc; c.lineWidth = 26; c.beginPath(); c.moveTo(X(1000), y); c.lineTo(X(1000) + (X(1492) - X(1000)) * pr, y); c.stroke(); c.strokeStyle = P.ink; c.lineWidth = 4; c.strokeRect(X(1000), y - 13, (X(1492) - X(1000)) * pr, 26); }
    shipIcon(c, X(1000), y - 70, .48 * pop(lt)); T(c, 'VIKINGS', X(1000) + 40, y + 200, '64px "Archivo Black"', '#FFF', P.ink, 14);
    if (t >= w(1, 1)) { const n = Math.round(500 * eo((t - w(1, 1)) / .6)); stickerText(c, `${n} YEARS`, VW / 2, 700, 96, t - w(1, 1), -.03); }
    if (t >= w(1, 4) - .05) { cutout(c, 600, 300, 300, 260, carrack, X(1492), y - 60, .5 * pop(t - w(1, 4))); T(c, 'COLUMBUS', X(1492) - 60, y + 200, '64px "Archivo Black"', P.acc, P.ink, 14); } }
  if (id === 'p1' || id === 'p1b') { const g = mapBase('gl', -45, 63, 30, [['GREENLAND', -42, 67.5, 54], ['Norse settlements', -47, 60.2, 32, 1]]); c.drawImage(g.cv, 0, 0);
    chips(c, 0, [t >= w(3, 2) ? 'TOO FEW' : '?', '?', '?']);
    if (id === 'p1' && lt < .5) stickerText(c, 'PROBLEM 1', VW / 2, 520, 96, lt, -.04);
    if (t >= w(3, 7) - .05) { for (const [lo, la] of [[-45.6, 61.1], [-50.8, 64.3]]) { const [x, y] = g.Pj(lo, la), r = 70 + 6 * Math.sin(t * 5); c.save(); c.strokeStyle = P.B; c.lineWidth = 10; c.setLineDash([22, 14]); c.beginPath(); c.arc(x, y, r * cl((t - w(3, 7)) / .2), 0, 7); c.stroke(); c.restore(); } }
    if (t >= w(3, 13) - .05) { const lt2 = t - w(3, 13); c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = P.edge; c.beginPath(); c.roundRect(90, 1520, 900, 300, 24); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.roundRect(90, 1520, 900, 300, 24); c.stroke();
      for (let i = 0; i < 14; i++) drawPerson(c, { ...NORSE, expr: 'neutral' }, 150 + i * 60, 1660, 120, lt2 - i * .03); T(c, 'A FEW THOUSAND PEOPLE', VW / 2, 1770, '54px "Archivo Black"', P.ink, null); } }
  return out(c, cv, !(id === 'question'));
}
/* ===================== T3 PAINTED DOCUMENTARY ===================== */
function paint(c, img, cx, cy, h, z = 1) { const sh = h / z, sw = sh * VW / VH; let sx = cl(cx - sw / 2, 0, img.width - sw), sy = cl(cy - sh / 2, 0, img.height - sh);
  c.save(); c.filter = 'saturate(0.92) contrast(1.06)'; c.drawImage(img, sx, sy, sw, sh, 0, 0, VW, VH); c.restore();
  const v = c.createRadialGradient(VW / 2, VH / 2, VH * .32, VW / 2, VH / 2, VH * .72); v.addColorStop(0, 'rgba(20,12,6,0)'); v.addColorStop(1, 'rgba(20,12,6,.55)'); c.fillStyle = v; c.fillRect(0, 0, VW, VH); }
function lowerThird(c, a, b, lt) { const al = cl(lt / .25); c.save(); c.globalAlpha = al; c.fillStyle = 'rgba(15,10,6,.72)'; c.fillRect(60, 1720, 760, 120); c.fillStyle = P.acc; c.fillRect(60, 1720, 10, 120);
  c.fillStyle = '#F5EEDC'; c.textAlign = 'left'; c.font = '700 40px "Cormorant Garamond"'; c.fillText(a, 92, 1770); c.font = 'italic 600 32px "Cormorant Garamond"'; c.fillStyle = 'rgba(245,238,220,.8)'; c.fillText(b, 92, 1815); c.restore(); }
function serifTitle(c, lines, y, size, lt, accIdx = -1) { c.save(); c.globalAlpha = cl(lt / .2); c.textAlign = 'center'; c.font = `700 ${size}px "Cormorant Garamond"`; c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 24;
  lines.forEach((l, i) => { c.fillStyle = i === accIdx ? P.acc : '#FBF6EA'; c.fillText(l, VW / 2, y + i * size * 1.05); }); c.restore(); }
function frameT3(f) { const t = f / FPS, [cv, c] = newCanvas(); cv._t = t;
  const S = [[0, 'open'], [w(0, 4), 'sail'], [w(0, 8), 'map'], [w(0, 10), 'landed'], [TL.lines[1].start - .05, 'card'], [TL.lines[2].start - .05, 'why'], [TL.lines[3].start - .05, 'p1'], [w(3, 7), 'crew']];
  const [id, lt] = pick(S, t), D = IMG.dahl, K = IMG.krohg;
  if (id === 'open') { paint(c, D, 441, 420, 840, 1 + .05 * t / 1.4); const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(10,6,3,.85)'); g.addColorStop(1, 'rgba(10,6,3,0)'); c.fillStyle = g; c.fillRect(0, 0, VW, 700);
    c.save(); c.textAlign = 'center'; c.font = '700 44px "Cormorant Garamond"'; c.letterSpacing = '12px'; c.fillStyle = P.acc; c.fillText('C. 1000 AD', VW / 2, 200); c.restore(); serifTitle(c, ['Why didn’t the Vikings', 'stay in America?'], 320, 92, 1); }
  if (id === 'sail') { paint(c, K, 975, 470, 760, 1 + .04 * lt / 1.3); lowerThird(c, 'Leif Erikson', 'painted by Christian Krohg, 1893', lt); }
  if (id === 'map') { const m = mapBase('na', -48, 61, 52, MAPLBL); c.save(); c.filter = 'sepia(.35) contrast(1.05)'; c.drawImage(m.cv, 0, 0); c.restore(); const pts = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]].map(([a, b]) => m.Pj(a, b)); arrowPath(c, pts, lt / .7, P.B);
    const v = c.createRadialGradient(VW / 2, VH / 2, VH * .3, VW / 2, VH / 2, VH * .72); v.addColorStop(0, 'rgba(20,12,6,0)'); v.addColorStop(1, 'rgba(20,12,6,.5)'); c.fillStyle = v; c.fillRect(0, 0, VW, VH); }
  if (id === 'landed') { paint(c, D, 940, 470, 760, 1.02 + .04 * lt / 1.6); if (t >= w(0, 12) - .05) lowerThird(c, 'North America', 'Leif Erikson Discovers America — Hans Dahl', t - w(0, 12)); }
  if (id === 'card') { c.fillStyle = '#120D09'; c.fillRect(0, 0, VW, VH); serifTitle(c, ['1000'], 700, 220, lt, 0); c.save(); c.globalAlpha = cl((t - w(1, 1)) / .2); c.strokeStyle = 'rgba(245,238,220,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(VW / 2, 760); c.lineTo(VW / 2, 1040); c.stroke(); c.restore();
    if (t >= w(1, 1)) serifTitle(c, ['almost 500 years'], 920, 56, t - w(1, 1)); if (t >= w(1, 4) - .05) { serifTitle(c, ['1492'], 1250, 220, t - w(1, 4)); serifTitle(c, ['Columbus'], 1340, 56, t - w(1, 4)); } }
  if (id === 'why') { paint(c, D, 441, 330, 560, 1 + .05 * lt / 1.6); c.fillStyle = 'rgba(10,6,3,.35)'; c.fillRect(0, 0, VW, VH); serifTitle(c, ['So why didn’t', 'they stay?'], 820, 120, lt, 1); }
  if (id === 'p1') { const g = mapBase('gl', -45, 63, 30, [['GREENLAND', -42, 67.5, 54], ['Norse settlements', -47, 60.2, 32, 1]]); c.save(); c.filter = 'sepia(.35)'; c.drawImage(g.cv, 0, 0); c.restore(); c.fillStyle = 'rgba(18,13,9,.5)'; c.fillRect(0, 0, VW, VH);
    c.save(); c.textAlign = 'center'; c.font = '700 44px "Cormorant Garamond"'; c.letterSpacing = '12px'; c.fillStyle = P.acc; c.fillText('PROBLEM ONE', VW / 2, 700); c.restore(); serifTitle(c, ['Not enough', 'people'], 860, 130, lt - .3); }
  if (id === 'crew') { paint(c, K, 290, 520, 640, 1 + .05 * lt / 2.6); if (t >= w(3, 13) - .05) lowerThird(c, 'Norse Greenland', 'a few thousand people in total', t - w(3, 13)); }
  return out(c, cv, !(id === 'open' || id === 'card' || id === 'why' || id === 'p1'));
}
/* ===================== T4 BIG HOOK (kinetic type) ===================== */
function flat(c, col) { c.fillStyle = col; c.fillRect(0, 0, VW, VH); c.save(); c.globalAlpha = .07; for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#000' : '#fff'; c.beginPath(); c.arc(rnd(i) * VW, rnd(i + 2) * VH, 300 + rnd(i + 4) * 400, 0, 7); c.fill(); } c.restore(); }
function kin(c, txt, y, size, col, lt, stroke = P.ink) { const s = slam(lt); if (!s) return; c.save(); c.translate(VW / 2, y); c.scale(s, s); let fs = fitFont(c, txt, 980, size, '"Archivo Black"'); T(c, txt, 0, fs * .35, `${fs}px "Archivo Black"`, col, stroke, 18); c.restore(); }
function frameT4(f) { const t = f / FPS, [cv, c] = newCanvas(); cv._t = t;
  const S = [[0, 'year'], [w(0, 4), 'vikings'], [w(0, 8), 'route'], [w(0, 10), 'landed'], [TL.lines[1].start - .05, 'count'], [TL.lines[2].start - .05, 'why'], [TL.lines[3].start - .05, 'list'], [w(3, 7), 'crowd']];
  const [id, lt] = pick(S, t);
  if (id === 'year') { flat(c, P.B); const n = Math.round(1000 * eo((t) / 1.15)); kin(c, String(n), 980, 330, '#FFF', 1); kin(c, 'AD', 1240, 110, P.acc, t - w(0, 3)); T(c, 'AROUND THE YEAR', VW / 2, 640, '64px "Archivo Black"', '#FFF', P.ink, 12); }
  if (id === 'vikings') { flat(c, P.A); kin(c, 'VIKINGS', 520, 190, '#FFF', lt); shipIcon(c, VW / 2, 1180, 1.25 * pop(lt - .05), Math.sin(t * 3) * .03); if (t >= w(0, 5)) kin(c, 'SAILED WEST', 1480, 120, P.acc, t - w(0, 5)); }
  if (id === 'route') { const m = mapBase('na', -48, 61, 52, MAPLBL); c.drawImage(m.cv, 0, 0); const pts = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]].map(([a, b]) => m.Pj(a, b)); arrowPath(c, pts, lt / .6, P.B); kin(c, 'GREENLAND →', 330, 110, '#FFF', lt); }
  if (id === 'landed') { flat(c, P.acc); drawPerson(c, { ...LEIF, expr: 'happy', pose: 'up' }, VW / 2, 1900, 1000, lt); kin(c, 'LANDED IN', 360, 120, '#FFF', lt); if (t >= w(0, 12)) kin(c, 'NORTH AMERICA', 560, 140, P.B, t - w(0, 12), P.ink); }
  if (id === 'count') { flat(c, P.ink); const n = t < w(1, 1) ? 0 : Math.round(500 * eo((t - w(1, 1)) / .5)); kin(c, n ? String(n) : '?', 860, 340, P.acc, t < w(1, 1) ? lt : 1, '#000'); if (t >= w(1, 2)) kin(c, 'YEARS', 1080, 130, '#FFF', t - w(1, 2), '#000');
    if (t >= w(1, 3)) kin(c, 'BEFORE', 400, 110, '#FFF', t - w(1, 3), '#000'); if (t >= w(1, 4) - .05) { kin(c, 'COLUMBUS', 1300, 130, P.acc, t - w(1, 4), '#000'); cutout(c, 600, 300, 300, 260, carrack, VW / 2, 1700, .8 * pop(t - w(1, 4))); } }
  if (id === 'why') { flat(c, P.B); const ws = ['SO', 'WHY', 'DIDN’T', 'THEY', 'STAY?']; ws.forEach((x, i) => { if (t >= w(2, i) - .03) kin(c, x, 360 + i * 200, 170, i === 4 ? P.acc : '#FFF', t - w(2, i)); }); }
  if (id === 'list') { flat(c, P.parch); kin(c, '3 PROBLEMS', 330, 130, P.ink, lt, null); const rows = [t >= w(3, 2) ? 'TOO FEW PEOPLE' : '???', '???', '???'];
    rows.forEach((r, i) => { const y = 620 + i * 330, on = i === 0, s = pop(lt - .15 - i * .1); if (!s) return; c.save(); c.translate(VW / 2, y); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = on ? P.acc : P.edge; c.beginPath(); c.roundRect(-450, -110, 900, 220, 24); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = P.ink; c.lineWidth = 7; c.stroke();
      c.fillStyle = P.ink; c.font = '110px "Archivo Black"'; c.textAlign = 'left'; c.fillText(String(i + 1), -400, 40); let fs = fitFont(c, r, 640, 76, '"Archivo Black"'); c.fillText(r, -240, fs * .35); c.restore(); }); }
  if (id === 'crowd') { flat(c, P.A); for (let i = 0; i < 24; i++) drawPerson(c, { ...NORSE, expr: i % 5 ? 'neutral' : 'worried' }, 120 + (i % 6) * 168, 820 + Math.floor(i / 6) * 210, 210, lt - (i % 6) * .05 - Math.floor(i / 6) * .1);
    if (t >= w(3, 9)) kin(c, 'ALL OF GREENLAND', 380, 110, '#FFF', t - w(3, 9)); if (t >= w(3, 13) - .05) { kin(c, 'A FEW THOUSAND', 1660, 130, P.acc, t - w(3, 13)); } }
  return out(c, cv, false);
}

/* ===================== T5 HYBRID (T2 backbone + grader fixes) ===================== */
function capPlate(c, t) { const L = TL.lines.find(l => t >= l.start - .05 && t <= l.end + .2); if (!L) return; c.save(); c.fillStyle = 'rgba(30,22,15,.62)'; c.beginPath(); c.roundRect(50, VH * .7 - 72, VW - 100, 104, 22); c.fill(); c.restore(); caption(c, t); }
function chips2(c, labels, hot, hotT) { const n = 3, cw = 310, gap = 20, x0 = VW / 2 - (n * cw + (n - 1) * gap) / 2, y = 190, h = 120;
  for (let i = 0; i < n; i++) { const x = x0 + i * (cw + gap), on = labels[i] !== '?', s = i === hot ? pop(hotT) || 1 : 1; c.save(); c.translate(x + cw / 2, y + h / 2); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = on ? P.acc : P.edge; c.beginPath(); c.roundRect(-cw / 2, -h / 2, cw, h, 18); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = P.ink; c.lineWidth = 6; c.stroke();
    c.fillStyle = P.ink; c.textAlign = 'left'; c.font = '64px "Archivo Black"'; c.fillText(String(i + 1), -cw / 2 + 22, 24); c.textAlign = 'center'; const lab = labels[i]; const fs = fitFont(c, lab, cw - 110, 46, '"Archivo Black"'); c.fillText(lab, 30, fs * .35); c.restore(); } }
function chipPin(c, text, ax, ay, bx, by, lt) { const s = pop(lt); if (!s) return; c.save(); c.strokeStyle = P.ink; c.lineWidth = 6; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.restore(); c.beginPath(); c.arc(ax, ay, 12, 0, 7); c.fillStyle = P.ink; c.fill(); stickerText(c, text, bx, by, 60, lt, -.02); }
const CROWD = Array.from({ length: 12 }, (_, i) => ({ ...NORSE, helmet: i % 3 === 0, hair: ['#B5562B', '#5A3A22', '#D9B36A', '#2A211C'][i % 4], beard: i % 4 === 1 ? null : ['#B5562B', '#8A5A2E', '#C98B3A'][i % 3], tunic: [P.A, '#5E7F4E', P.B, '#8A6A44', '#4C6E9E'][i % 5], expr: ['neutral', 'worried', 'happy'][i % 3], look: (rnd(i) - .5) }));
function frameT5(f) { const t = f / FPS, [cv, c] = newCanvas();
  const S = [[0, 'hook'], [w(0, 4), 'sail'], [w(0, 10), 'landed'], [TL.lines[1].start - .05, 'timeline'], [TL.lines[2].start - .05, 'question'], [TL.lines[3].start - .05, 'p1']];
  const [id, lt] = pick(S, t); const m = id === 'hook' ? mapBase('na', -48, 61, 52, MAPLBL) : mapBase('na5', -48, 58.6, 52, MAPLBL), route = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]], pts = route.map(([a, b]) => m.Pj(a, b));
  let cap = true; const T0 = w(0, 4), T1_ = w(0, 10);
  if (id !== 'timeline' && id !== 'p1') { const z = id === 'hook' ? 1.12 - .04 * t / 1.4 : id === 'question' ? 1 : 1.08, [gx] = m.Pj(-47, 60);
    const FY = VH / 2; camera(c, z, VW / 2 + (gx - VW / 2) * .25, FY, () => { c.drawImage(m.cv, 0, 0);
      const pr = id === 'hook' ? 0 : id === 'sail' ? eio(lt / (T1_ - T0)) : 1; if (pr > .06 && id !== 'question') arrowPath(c, pts, pr, P.B);
      let tot = 0, seg = []; for (let i = 1; i < pts.length; i++) { seg.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); tot += seg[i - 1]; } let rem = tot * pr, p = pts[0]; for (let i = 1; i < pts.length && rem > 0; i++) { const fr = cl(rem / seg[i - 1]); p = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * fr, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * fr]; rem -= seg[i - 1]; }
      if (id !== 'question') shipIcon(c, p[0] + (id === 'hook' ? 20 * Math.sin(t * 2) : 0) + (pr >= 1 ? 110 : 0), p[1] - 30 + (pr >= 1 ? 60 : 0), .36, Math.sin(t * 4) * .04);
      if (id === 'landed') { const [x, y] = m.Pj(-55.6, 51.4); cutout(c, 150, 210, 6, 200, g => flagPin(g, P.B), x, y, id === 'landed' ? pop(lt) : 1); } });
    if (id === 'hook') { const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(30,22,15,.94)'); g.addColorStop(.62, 'rgba(30,22,15,.9)'); g.addColorStop(1, 'rgba(30,22,15,0)'); c.fillStyle = g; c.fillRect(0, 0, VW, 760); bigTitle(c, ['WHY DIDN’T THE', 'VIKINGS STAY', 'IN AMERICA?'], 290, 98, 2); }
    if (id === 'sail' || id === 'landed') { c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = P.parch; c.beginPath(); c.roundRect(VW / 2 - 240, 150, 480, 150, 18); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.roundRect(VW / 2 - 240, 150, 480, 150, 18); c.stroke(); T(c, '1000 AD', VW / 2, 262, '100px "Archivo Black"', P.ink, null); }
    if (id === 'landed' && t >= w(0, 12) - .05) { const [x, y] = m.Pj(-55.6, 51.4); const z = 1.08, [gx] = m.Pj(-47, 60), fx = VW / 2 + (gx - VW / 2) * .25; const sx = VW / 2 + (x - fx) * z, sy = VH / 2 + (y - FY) * z; chipPin(c, 'NORTH AMERICA', sx + 30, sy - 100, 330, sy - 380, t - w(0, 12)); }
    if (id === 'question') { cap = false; c.fillStyle = 'rgba(25,20,15,.62)'; c.fillRect(0, 0, VW, VH); bigTitle(c, ['SO WHY', 'DIDN’T THEY', 'STAY?'], 620, 140, 2); if (lt > .45) { c.save(); c.translate(0, 1000); chips2(c, ['?', '?', '?'], -1, 0); c.restore(); T(c, '3 PROBLEMS', VW / 2, 1120, '64px "Archivo Black"', P.acc, P.ink, 14); } } }
  if (id === 'timeline') { c.drawImage(mapBase('na5', -48, 58.6, 52, MAPLBL).cv, 0, 0); c.fillStyle = 'rgba(25,20,15,.62)'; c.fillRect(0, 0, VW, VH); c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fillStyle = P.parch; c.beginPath(); c.roundRect(70, 640, VW - 140, 580, 28); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.roundRect(70, 640, VW - 140, 580, 28); c.stroke(); const x0 = 130, x1 = 930, y = 980, X = yr => x0 + (yr - 960) / 560 * (x1 - x0);
    c.strokeStyle = P.ink; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
    for (let yr = 1000; yr <= 1500; yr += 100) { c.lineWidth = 8; c.beginPath(); c.moveTo(X(yr), y - 30); c.lineTo(X(yr), y + 30); c.stroke(); T(c, String(yr), X(yr), y + 100, '700 54px "Cormorant Garamond"', P.ink, null); }
    const pr = eio((t - w(1, 1)) / (w(1, 4) - w(1, 1))); if (pr > 0) { c.strokeStyle = P.acc; c.lineWidth = 40; c.beginPath(); c.moveTo(X(1000), y); c.lineTo(X(1000) + (X(1492) - X(1000)) * pr, y); c.stroke(); }
    const sx = X(1000) + (X(1492) - X(1000)) * Math.max(0, pr) * .0; shipIcon(c, X(1000) + 60, y - 90, .62 * pop(lt)); T(c, 'VIKINGS', X(1000) + 60, y + 210, '64px "Archivo Black"', '#FFF', P.ink, 14);
    if (t >= w(1, 1) - .05) stickerText(c, '500 YEARS', VW / 2, 540, 130, t - w(1, 1), -.03);
    if (t >= w(1, 4) - .05) { cutout(c, 600, 300, 300, 260, carrack, X(1492) - 90, y - 80, .62 * pop(t - w(1, 4))); T(c, 'COLUMBUS', X(1492) - 170, y + 210, '64px "Archivo Black"', P.acc, P.ink, 14); } }
  if (id === 'p1') { const g = mapBase('gl', -45, 63, 30, [['GREENLAND', -42, 67.5, 54]]); c.drawImage(g.cv, 0, 0);
    const tA = w(3, 3); chips2(c, [t >= tA - .05 ? 'TOO FEW' : '?', '?', '?'], 0, t - tA);
    if (t < w(3, 3) - .05) stickerText(c, 'PROBLEM 1', VW / 2, 520, 100, lt, -.04);
    const tS = w(3, 7); if (t >= tS - .05) for (const [lo, la, nm, bx, by] of [[-45.6, 61.1, 'EASTERN SETTLEMENT', 620, 1010], [-50.8, 64.3, 'WESTERN SETTLEMENT', 330, 620]]) { const [x, y] = g.Pj(lo, la), k = cl((t - tS) / .2); c.save(); c.strokeStyle = P.B; c.lineWidth = 14; c.setLineDash([26, 14]); c.beginPath(); c.arc(x, y, 80 * k, 0, 7); c.stroke(); c.restore(); if (k >= 1) { const a = Math.atan2(by - y, bx - x); c.save(); c.strokeStyle = P.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(x + Math.cos(a) * 88, y + Math.sin(a) * 88); c.lineTo(bx, by); c.stroke(); c.restore(); stickerText(c, nm, bx, by, 38, t - tS - .2, 0); } }
    const tC = w(3, 13); if (t >= tC - .05) { cap = false; const lt2 = t - tC, s = pop(lt2); c.save(); c.translate(VW / 2, 1385); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = P.edge; c.beginPath(); c.roundRect(-460, -195, 920, 365, 26); c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = P.ink; c.lineWidth = 7; c.stroke(); c.restore();
      if (s) { CROWD.forEach((o, i) => drawPerson(c, o, VW / 2 - 350 + (i % 6) * 140 + (i >= 6 ? 70 : 0), 1380 - (i >= 6 ? 0 : 40) + (i >= 6 ? 30 : 0), 150, lt2 - .05 - i * .025)); T(c, 'A FEW THOUSAND PEOPLE', VW / 2, 1520, '58px "Archivo Black"', P.ink, null); } } }
  if (cap) capPlate(c, t); grain(c); return cv.toDataURL('image/jpeg', .92);
}
const FRAMES = { T1: frameT1, T2: frameT2, T3: frameT3, T4: frameT4, T5: frameT5 };
/* ===================== FULL SHORT in T5 style ===================== */
function card(c, x0, y0, x1, y1) { c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fillStyle = P.parch; c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 28); c.fill(); c.restore(); c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.roundRect(x0, y0, x1 - x0, y1 - y0, 28); c.stroke(); }
function dim(c, a = .62) { c.fillStyle = `rgba(25,20,15,${a})`; c.fillRect(0, 0, VW, VH); }
function flyArrow(c, x, y, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.strokeStyle = P.ink; c.lineWidth = 18; c.beginPath(); c.moveTo(-300, 0); c.lineTo(0, 0); c.stroke(); c.strokeStyle = '#8A6A44'; c.lineWidth = 10; c.stroke();
  const h = new Path2D(); h.moveTo(46, 0); h.lineTo(-6, -26); h.lineTo(-6, 26); h.closePath(); inkFill(c, h, '#9A9DA2', 5); for (const sg of [-1, 1]) { const f = new Path2D(); f.moveTo(-300, 0); f.lineTo(-340, sg * 30); f.lineTo(-260, sg * 30); f.lineTo(-230, 0); f.closePath(); inkFill(c, f, P.B, 5); } c.restore(); }
const NF = () => mapBase('nf', -56.5, 50.5, 16, [['NEWFOUNDLAND', -56, 48.6, 46], ['LABRADOR', -61.5, 53.2, 40]]);
const NF2 = () => mapBase('nf2', -55.9, 51.0, 7, [['NEWFOUNDLAND', -56.4, 48.75, 50]]);
function frameV(f) { const t = f / FPS; if (t < TL.lines[4].start - .05) return frameT5(f);
  const [cv, c] = newCanvas();
  const S = [[0, 'p2'], [w(4, 10) - .05, 'boat'], [TL.lines[5].start - .05, 'p3'], [TL.lines[6].start - .05, 'thorvald'], [TL.lines[7].start - .05, 'locals'], [TL.lines[8].start - .05, 'home'], [TL.lines[9].start - .05, 'camp'], [TL.lines[10].start - .05, 'end']];
  const [id, lt] = pick(S, t); let cap = true;
  const labs = ['TOO FEW', t >= w(4, 3) - .05 ? 'LONG TRIP' : '?', t >= w(5, 3) - .05 ? 'LOCALS' : '?'], hot = t < w(5, 0) ? 1 : 2, hotT = t - (hot === 1 ? w(4, 3) : w(5, 3));
  const m = mapBase('na5', -48, 58.6, 52, MAPLBL), pts = [[-45.5, 61], [-52, 59.5], [-57, 55.5], [-55.6, 51.6]].map(([a, b]) => m.Pj(a, b));
  const along = (P_, pr) => { let tot = 0, seg = []; for (let i = 1; i < P_.length; i++) { seg.push(Math.hypot(P_[i][0] - P_[i - 1][0], P_[i][1] - P_[i - 1][1])); tot += seg[i - 1]; } let rem = tot * pr, p = P_[0]; for (let i = 1; i < P_.length && rem > 0; i++) { const fr = cl(rem / seg[i - 1]); p = [P_[i - 1][0] + (P_[i][0] - P_[i - 1][0]) * fr, P_[i - 1][1] + (P_[i][1] - P_[i - 1][1]) * fr]; rem -= seg[i - 1]; } return p; };
  if (id === 'p2') { c.drawImage(m.cv, 0, 0); arrowPath(c, pts, 1, P.B); const p = along(pts, .15 + .7 * cl(lt / 4.5)); shipIcon(c, p[0], p[1] - 30, .36, Math.sin(t * 4) * .05);
    if (t < w(4, 3) - .05) stickerText(c, 'PROBLEM 2', VW / 2, 560, 100, lt, -.04);
    if (t >= w(4, 4) - .05) stickerText(c, 'DAYS... OR WEEKS', VW / 2, 560, 84, t - w(4, 4), -.03); }
  if (id === 'boat') { seaBg(c, t, true); const bob = Math.sin(t * 5) * 8; cutout(c, 600, 340, 300, 300, vikingShip, VW / 2, 1120 + bob, 1.45, Math.sin(t * 3) * .04); stickerText(c, 'AN OPEN BOAT', VW / 2, 560, 90, lt, -.03); }
  if (id === 'p3') { c.drawImage(NF().cv, 0, 0); if (t < w(5, 3) - .05) stickerText(c, 'PROBLEM 3', VW / 2, 560, 100, lt, -.04); else stickerText(c, 'THE NEIGHBORS', VW / 2, 560, 90, t - w(5, 3), -.03); }
  if (id === 'thorvald') { c.drawImage(NF().cv, 0, 0); dim(c); card(c, 80, 520, VW - 80, 1180);
    c.save(); c.textAlign = 'center'; c.fillStyle = P.ink; c.font = 'italic 600 46px "Cormorant Garamond"'; c.fillText('according to the sagas', VW / 2, 620); c.restore();
    if (t >= w(6, 6) - .05) { const s = pop(t - w(6, 6)); c.save(); c.translate(VW / 2, 760); c.scale(s, s); const fs = fitFont(c, 'THORVALD ERIKSSON', 820, 78, '"Archivo Black"'); T(c, 'THORVALD ERIKSSON', 0, fs * .35, `${fs}px "Archivo Black"`, P.B, null); c.restore(); }
    if (t >= w(6, 3) - .05) T(c, 'Leif Erikson’s brother', VW / 2, 860, '700 54px "Cormorant Garamond"', P.ink, null);
    if (t >= w(6, 11) - .1) { const k = eo((t - w(6, 11) + .1) / .25); flyArrow(c, -260 + (VW / 2 + 160 + 260) * k, 1030, .9); } }
  if (id === 'locals') { c.drawImage(NF().cv, 0, 0); dim(c, .45);
    [['MORE PEOPLE', w(7, 3), '#FFF'], ['MORE ARROWS', w(7, 5), '#FFF'], ['HOME ADVANTAGE', w(7, 8), P.acc]].forEach(([x, tw, col], i) => { if (t >= tw - .05) { const s = slam(t - tw); c.save(); c.translate(VW / 2, 620 + i * 190); c.scale(s, s); const fs = fitFont(c, x, 900, 110, '"Archivo Black"'); T(c, x, 0, fs * .35, `${fs}px "Archivo Black"`, col, P.ink, 18); c.restore(); } }); }
  if (id === 'home') { c.drawImage(m.cv, 0, 0); const back = pts.slice().reverse(), pr = eio((t - w(8, 6)) / 2.2); arrowPath(c, pts, 1, 'rgba(184,64,47,.35)'); if (pr > .04) arrowPath(c, back, pr, P.acc); const p = along(back, Math.max(0, pr)); shipIcon(c, p[0], p[1] - 30, .36, Math.sin(t * 4) * .05);
    if (t >= w(8, 9) - .05) stickerText(c, 'BACK TO GREENLAND', VW / 2, 560, 80, t - w(8, 9), -.03); }
  if (id === 'camp') { const g = NF2(); c.drawImage(g.cv, 0, 0); const [x, y] = g.Pj(-55.53, 51.59);
    for (let i = 0; i < 3; i++) cutout(c, 170, 100, 85, 90, gg => sodHouse(gg, 160), x - 130 + i * 130, y + 40 + (i % 2) * 34, .9 * pop(lt - .15 - i * .12));
    if (t < w(9, 9) - .05) stickerText(c, 'ONE CAMP', VW / 2, 560, 90, lt, -.03); chipPin(c, 'L’ANSE AUX MEADOWS', x, y + 60, VW / 2, 1150, lt - .5); if (t >= w(9, 9) - .05) stickerText(c, 'FOUND IN 1960', VW / 2, 560, 96, t - w(9, 9), -.03); }
  if (id === 'end') { c.drawImage(m.cv, 0, 0); arrowPath(c, pts, 1, P.B); dim(c); if (t >= w(10, 2) - .05) bigTitle(c, ['DISCOVERING', 'AMERICA WAS', 'THE EASY PART'], 660, 104, 2); cap = t < w(10, 2) - .05; }
  if (id !== 'boat' || true) chips2(c, labs, hot, hotT);
  if (cap) capPlate(c, t); grain(c); return cv.toDataURL('image/jpeg', .92);
}
FRAMES.V = frameV;
