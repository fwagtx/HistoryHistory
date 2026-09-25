/* History Pros documentary engine (16:9). Needs shared.js, longform.js and people.js.
 * DOC = { title, chapters, next, shots: [{show, s0, s1, bg}], beats: [{say, t0, t1}] }
 * built by pipeline/render_documentary.py. docRender(c, t) draws the frame at time t. */
const DOC_FADE = .5;
const SUBS = new Set(['scene', 'person', 'map']);

// Plague-era scenes from the shared engine, so Week 1 can use them in documentaries too.
Object.assign(LF, {
  arrive(c, t, lp) { SCENES.arrive(c, NS, lp, t, t); },
  ship(c, t, lp) { SCENES.ship(c, NS, lp, t, t, .45, false); },
  micro(c, t, lp) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); micro(c, NS, t, W / 2, H / 2, 250 + lp * 30, false); },
});

function shotAt(t) { const S = DOC.shots; let k = 0; for (let i = 0; i < S.length; i++) if (t >= S[i].s0) k = i; return k; }
function beatAt(t) { for (const b of DOC.beats) if (b.say && t >= b.t0 - .05 && t <= b.t1 + .3) return b; return null; }
function fadeIn(ls, d = .6) { return easeOut(clamp(ls / d)); }

function chapterCard(c, sh, t, lp, ls) {
  scene(c, sh.bg, t, lp); c.restore(); c.save();
  const g = c.createLinearGradient(0, 0, 820, 0); g.addColorStop(0, 'rgba(0,0,0,.88)'); g.addColorStop(1, 'rgba(0,0,0,.1)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  finish(c, t); const n = sh.show.n - 1, a = fadeIn(ls); c.globalAlpha = a; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = RED; c.font = `500 24px ${DISPLAY}`; spacing(c, 8); c.fillText(`CHAPTER ${n + 1}`, 96, 300); spacing(c, 0);
  const title = (sh.show.title || DOC.chapters[n] || '').toUpperCase(); c.fillStyle = INK; fitFont(c, title, 700, 84, 800); c.fillText(title, 94 - 16 * (1 - a), 388);
  c.fillStyle = RED; c.fillRect(96, 414, 90 * a, 4);
  c.font = "500 16px Archivo, Arial, sans-serif"; DOC.chapters.forEach((ch, i) => { c.fillStyle = i === n ? INK : 'rgba(242,242,242,.36)'; c.fillText(`${i + 1}  ${ch}`, 96, 476 + i * 24); });
  c.globalAlpha = 1;
}

function textCard(c, sh, t, lp, ls) {
  c.restore(); c.save(); const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 700); g.addColorStop(0, '#2a0d0b'); g.addColorStop(1, '#050303'); c.fillStyle = g; c.fillRect(0, 0, W, H); finish(c, t);
  const o = sh.show, a = fadeIn(ls); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = RED; c.font = `500 24px ${DISPLAY}`; spacing(c, 8); c.fillText((o.label || '').toUpperCase(), W / 2, 230); spacing(c, 0);
  const lines = String(o.big || '').toUpperCase().split('|'); let fs = 124; lines.forEach(l => { fs = Math.min(fs, fitFont(c, l, 700, 124, 1060)); });
  c.fillStyle = INK; c.font = `700 ${fs}px ${DISPLAY}`; lines.forEach((l, i) => c.fillText(l, W / 2, 360 + i * fs * 1.02 - (lines.length - 1) * fs * .4));
  if (o.sub) { c.fillStyle = DIM; c.font = "500 28px Archivo, Arial, sans-serif"; c.fillText(o.sub, W / 2, 400 + lines.length * fs * .62); }
  c.globalAlpha = 1;
}

function personShot(c, sh, t, lp, ls) {
  const o = sh.show, sp = CAST[o.who]; if (!sp) return;
  const intro = !!o.intro, x = intro ? 400 : 880;
  scene(c, o.bg || sh.bg || 'dock', t, lp); c.restore(); c.save();
  const g = intro ? c.createLinearGradient(0, 0, W, 0) : c.createLinearGradient(W, 0, 0, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const e = ease(Math.min(1, lp * 2)); bust(c, Object.assign({}, sp, o.expr ? { expr: o.expr } : {}), x + (intro ? -30 : 30) * (1 - e), 290 + Math.sin(t * 1.1) * 2, 1.35, .45);
  finish(c, t);
  if (!intro) return;
  const a = ease(Math.min(1, lp * 2.5)); c.globalAlpha = a; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = RED; c.font = `500 22px ${DISPLAY}`; spacing(c, 8); c.fillText(o.label || 'WHO WAS THERE', 740, 286); spacing(c, 0);
  c.fillStyle = INK; const nm = sp.name.toUpperCase(); fitFont(c, nm, 700, 68, 470); c.fillText(nm, 738, 364);
  c.fillStyle = RED; c.fillRect(740, 388, 80 * a, 4);
  c.fillStyle = DIM; c.font = "500 26px Archivo, Arial, sans-serif"; c.fillText(sp.role, 740, 440); c.globalAlpha = 1;
}

function mapShot(c, sh, t, lp, ls) {
  const m = sh.show, z = lerp(m.z0 ?? 1.2, m.z1 ?? 1.6, ease(lp));
  mapCam(c, m.lon ?? 17, m.lat ?? 45, z);
  drawMap(c, NS, m.date ?? 0, { z, pins: m.pins, route: m.route ? clamp(.25 + lp * 1.1) : null, allLabels: !m.pins && z > 2.5 });
  if (m.pins) drawPins(c, m.pins, z, ls);
  c.restore(); c.save(); finish(c, t);
}

function drawShot(c, k, t) {
  const sh = DOC.shots[k], o = sh.show, lp = clamp((t - sh.s0) / Math.max(.1, sh.s1 - sh.s0)), ls = t - sh.s0;
  resetCtx(c); c.save();
  switch (o.k) {
    case 'scene': { const px = (o.pan ?? (k % 2 ? 1 : -1)) * 26 * (ease(lp) - .5); c.translate(px, 0); scene(c, o.scene, t, lp); c.restore(); c.save(); finish(c, t); break; }
    case 'person': personShot(c, sh, t, lp, ls); break;
    case 'map': mapShot(c, sh, t, lp, ls); break;
    case 'chapter': chapterCard(c, sh, t, lp, ls); break;
    case 'text': textCard(c, sh, t, lp, ls); break;
    case 'title': c.restore(); frame(c, 'title', { scene: sh.bg, title: DOC.title }, t, lp); c.save(); break;
    case 'quote': c.restore(); frame(c, 'quote', { scene2: sh.bg, quote: { text: o.text, who: o.who } }, t, lp); c.save(); break;
    case 'stat': c.restore(); frame(c, 'stat', { stat: { label: o.label, big: o.big, sub: o.sub } }, t, lp); c.save(); break;
    case 'end': c.restore(); frame(c, 'end', { scene: sh.bg }, t, lp, DOC.next); c.save(); break;
  }
  c.restore();
  // Place and date stamp for the first few seconds of a shot.
  if (o.stamp && ls < 6) { resetCtx0(c); c.globalAlpha = clamp(ls / .4) * clamp((6 - ls) / .6); stampChip(c, o.stamp); c.globalAlpha = 1; }
}
function resetCtx0(c) { c.setTransform(DPR, 0, 0, DPR, 0, 0); c.globalAlpha = 1; c.shadowBlur = 0; }

let _docA, _docB;
function docRender(c, t) {
  const cw = W * DPR, ch = H * DPR;
  if (!_docA) { _docA = document.createElement('canvas'); _docB = document.createElement('canvas'); for (const x of [_docA, _docB]) { x.width = cw; x.height = ch; } }
  const k = shotAt(t), sh = DOC.shots[k], ac = _docA.getContext('2d');
  drawShot(ac, k, t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(_docA, 0, 0);
  if (k > 0 && t - sh.s0 < DOC_FADE) { const bc = _docB.getContext('2d'); drawShot(bc, k - 1, t); c.globalAlpha = 1 - ease((t - sh.s0) / DOC_FADE); c.drawImage(_docB, 0, 0); c.globalAlpha = 1; }
  if (k === 0 && t < .8) { c.fillStyle = `rgba(0,0,0,${1 - t / .8})`; c.fillRect(0, 0, cw, ch); }
  if (t > DOC.duration - 1.2) { c.fillStyle = `rgba(0,0,0,${clamp((t - DOC.duration + 1.2) / 1.2)})`; c.fillRect(0, 0, cw, ch); }
  const b = beatAt(t);
  if (b && SUBS.has(sh.show.k) && !(sh.show.k === 'person' && sh.show.intro)) { c.setTransform(DPR, 0, 0, DPR, 0, 0); subtitle(c, b.say); }
}
