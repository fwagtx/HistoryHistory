/* Toon YouTube thumbnails (1920x1080, saved as 1280x720), built from a script's "thumbnail" spec.
 *   split : {style:'split', years:[a,b], word, left:{id,mood}, right:{id,mood}, map:{lon,lat,z,d0,d1,red}}
 *   faces : {style:'faces', title, bg, faces:[{id,mood}], crowd:true, grade:'warm'|'cold'}
 *   redbox: {style:'redbox', bg, lines:[...], main:{id,mood}, second:{id,mood}} */
function thumbCv() { const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; return cv; }
function shadowed2(c, fn, blur = 30) { c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = blur; c.shadowOffsetY = 10; fn(); c.restore(); }
function drawWho(c, e, x, y, s, extra = {}) {
  const sp = Object.assign({}, spec(e.id)), animal = sp.animal || (ANIMAL_FOOT[e.id] && e.id);
  if (animal) { ANIMALS[animal](c, x, y + 180 * s * .4, s * .75, Object.assign({}, sp, e, extra), .4); return; }
  guy(c, x, y, s, Object.assign(sp, { eyes: 'big' }, e, extra), .4);
}
function thumbSplit(c, o) {
  const m = o.map || { lon: 15, lat: 45, z: 1.1 };
  c.save(); c.beginPath(); c.rect(0, 0, 960, 1080); c.clip(); toonMap(c, m.lon, m.lat, m.z || 1.1, m.d0 || 0); c.restore();
  c.save(); c.beginPath(); c.rect(960, 0, 960, 1080); c.clip(); toonMap(c, m.lon, m.lat, m.z || 1.1, m.d1 || 0, { redLand: m.red === false ? null : 'rgba(214,48,40,.5)' }); c.restore();
  line(c, poly([[960, -20], [948, 300], [972, 560], [950, 820], [962, 1100]], 40, false), 12, '#FFFFFF');
  const g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  shadowed2(c, () => drawWho(c, o.left, 330, 560, 4.1, { look: .35 }));
  shadowed2(c, () => drawWho(c, o.right, 1600, 560, 4.1, { look: -.35 }));
  thumbText(c, o.years[0], 700, 190, 170); thumbText(c, o.years[1], 1230, 190, 170);
  thumbText(c, o.word || 'WHY?', 960, 1030, 300, { sw: .1 });
}
function thumbFaces(c, o) {
  paintedBg(c, o.bg || 'field', 1.2, o.grade || 'warm');
  if (o.crowd !== false) { frameStart(.4); c.save(); c.filter = 'blur(1.5px)'; toonCrowd(c, -100, 2020, 560, 24, 7, .95, .4, { moods: o.crowdMoods || ['scared', 'shock', 'shout'], arms: 'up' }); c.restore(); }
  const g = c.createLinearGradient(0, 0, 0, 500); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 500);
  const f = o.faces || [], pos = f.length === 1 ? [[1450, 660, 5.2, -.3]] : f.length === 2 ? [[520, 690, 4.4, .3], [1400, 690, 4.4, -.3]] : [[360, 700, 4.2, .3], [960, 640, 4.8, 0], [1570, 700, 4.2, -.3]];
  f.slice(0, 3).forEach((e, i) => shadowed2(c, () => drawWho(c, e, pos[i][0], pos[i][1], pos[i][2], { look: pos[i][3] })));
  if (f.length === 1) { // one big face on the right, the title stacked on the left
    const words = String(o.title || '').split(' '), half = Math.ceil(words.length / 2), lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : words;
    c.save(); let size = o.titleSize || 230; c.font = `${size}px Anton`; while (lines.some(l => c.measureText(l).width > 900) && size > 90) { size -= 8; c.font = `${size}px Anton`; } c.restore();
    lines.forEach((l, i) => thumbText(c, l, 60, 300 + i * size * 1.02, size, { sw: .06, align: 'left' }));
  } else thumbText(c, o.title || '', 960, 230, o.titleSize || 230, { sw: .06 });
}
function thumbRedbox(c, o) {
  frameStart(.5); SCN[o.bg || 'field'](c, 1);
  if (o.main) shadowed2(c, () => drawWho(c, o.main, 1400, 560, 3.4, { look: -.35 }));
  if (o.second) shadowed2(c, () => drawWho(c, o.second, 430, 700, 2.4, { look: .4 }));
  const lines = o.lines || ['?']; const bx = 70, by = 70, bw = 820, bh = lines.length > 1 ? 380 : 280;
  c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 20; hd(c, rect(bx, by, bw, bh), { fill: '#E3261B', w: 8, color: '#FFFFFF', amp: .5 }); c.restore();
  lines.forEach((l, i) => { c.save(); let s = Math.min(180, bh / lines.length * .9); c.font = `${s}px Anton`; while (c.measureText(l).width > bw - 60 && s > 60) { s -= 6; c.font = `${s}px Anton`; } c.restore(); thumbText(c, l, bx + bw / 2, by + (i + 1) * bh / lines.length - 24, s, { shadow: false, sw: 0 }); });
  redArrow(c, 910, 300, 1250, 330);
}
function renderThumb(o) {
  const cv = thumbCv(), c = cv.getContext('2d'); frameStart(.4);
  if (o.style === 'split') thumbSplit(c, o); else if (o.style === 'redbox') thumbRedbox(c, o); else thumbFaces(c, o);
  const s = document.createElement('canvas'); s.width = 1280; s.height = 720; s.getContext('2d').drawImage(cv, 0, 0, 1280, 720); return s.toDataURL('image/jpeg', .9);
}

/* Shorts cover (1080x1920, also used as the Reel/TikTok cover).
 *   {text, sub, bg, faces:[{id, mood, hold}], object:{k, flag, s}}
 * Big hook text at the top, a where/when tag under it, the story's own scene behind,
 * and one or two big faces. Everything important sits in the middle 3:4 area so feed crops keep it. */
function renderShortThumb(o) {
  const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  frameStart(.4);
  const tmp = document.createElement('canvas'); tmp.width = BW; tmp.height = BH; scene(tmp.getContext('2d'), o.bg || 'field', 1);
  const k = H / BH; c.save(); c.filter = 'blur(5px) saturate(1.15)'; c.drawImage(tmp, (W - BW * k) / 2, 0, BW * k, H); c.restore();
  let g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 1000);
  g = c.createLinearGradient(0, 1500, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = g; c.fillRect(0, 1500, W, 420);
  const faces = (o.faces || []).slice(0, 2);
  // the key object, behind the people
  if (o.object && OBJECTS[o.object.k]) {
    const ok = o.object.k, s = 2.6 * (OBJ_SCALE[ok] || .5) * (o.object.s ?? 1), ox = faces.length === 1 ? 830 : 540;
    c.save(); c.translate(ox, faces.length ? 1560 : 1500); c.scale(s, s); OBJECTS[ok](c, Object.assign({}, o.object), .4); c.restore();
  }
  frameStart(.4);
  const lift = { hatLift: 14 };
  if (faces.length === 1) shadowed2(c, () => drawWho(c, faces[0], o.object ? 430 : 540, 1150, 5.0, Object.assign({ look: o.object ? .25 : 0 }, lift)));
  else if (faces.length === 2) {
    shadowed2(c, () => drawWho(c, faces[1], 800, 1260, 3.8, Object.assign({ look: -.35 }, lift)));
    shadowed2(c, () => drawWho(c, faces[0], 300, 1180, 4.3, Object.assign({ look: .35 }, lift)));
  }
  // hook text: up to two lines, second line in gold
  const words = String(o.text || '').toUpperCase().split(/\s+/).filter(Boolean);
  let lines = [words.join(' ')];
  c.save(); let size = 200; c.font = `${size}px Anton`;
  if (c.measureText(lines[0]).width > 960 && words.length > 1) {
    let best = null; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (!best || m < best[0]) best = [m, a, b]; }
    lines = [best[1], best[2]];
  }
  while (lines.some(l => c.measureText(l).width > 980) && size > 90) { size -= 6; c.font = `${size}px Anton`; }
  c.restore();
  const top = 150 + size;
  lines.forEach((l, i) => thumbText(c, l, W / 2, top + i * size * 1.02, size, { sw: .1, fill: lines.length > 1 && i === 1 ? '#F2B632' : '#FFFFFF' }));
  if (o.sub) {
    const y = top + (lines.length - 1) * size * 1.02 + 60;
    c.save(); let fs = 54; c.font = `${fs}px "Permanent Marker"`; while (c.measureText(o.sub).width > 860 && fs > 30) { fs -= 2; c.font = `${fs}px "Permanent Marker"`; }
    const tw = c.measureText(o.sub).width + 60; c.translate(W / 2, y + fs * .55); c.rotate(-.025);
    hd(c, rect(-tw / 2, -fs * .75, tw, fs * 1.5), { fill: '#FFFFFF', w: 6 }); c.restore();
    marker(c, o.sub, W / 2, y + fs * .75, fs, T.ink);
  }
  return cv.toDataURL('image/jpeg', .9);
}
