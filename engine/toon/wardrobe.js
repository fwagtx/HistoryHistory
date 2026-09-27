/* More hats, outfits and animals for the toon engine, so any era can be cast.
 * Loads after core.js and extends hat(), outfit() and hairFront() in place. */

const FULL_HATS = new Set(['kepi', 'kabuto', 'm1', 'stahlhelm', 'nemes', 'mongol', 'morion', 'bearskin', 'ushanka', 'pharaoh', 'veil', 'wimple']);
const _hairFront0 = hairFront;
hairFront = function (c, o) { if (FULL_HATS.has(o.hat)) return; _hairFront0(c, o); };

const _hat0 = hat;
hat = function (c, o, t) {
  const h = o.hat, col = o.hatColor, gold = CLR.gold;
  switch (h) {
    case 'bicorne': // Napoleon-style, worn sideways
      hd(c, bez([-100, -30], [-80, -110], [80, -110], [100, -30], 14).concat(bez([100, -30], [40, -54], [-40, -54], [-100, -30], 10)), { fill: col || '#1E1C1B', w: 5 });
      hd(c, ell(0, -64, 14, 14), { fill: CLR.blue, w: 3 }); hd(c, ell(0, -64, 8, 8), { fill: '#FFF', w: 2 }); hd(c, ell(0, -64, 3.5, 3.5), { fill: CLR.red, w: 0 }); break;
    case 'futou': // Chinese scholar-official's black cap with long side wings (Song to Ming)
      for (const sx of [-1, 1]) hd(c, poly([[sx * 50, -46], [sx * 128, -52], [sx * 130, -40], [sx * 50, -34]], 8), { fill: col || '#1E1C1B', w: 3.5 });
      hd(c, bez([-40, -40], [-44, -112], [44, -112], [40, -40], 14), { fill: col || '#1E1C1B', w: 5 });
      hd(c, rect(-56, -50, 112, 30), { fill: col || '#1E1C1B', w: 5 }); break;
    case 'kabuto':
      hd(c, bez([-58, -4], [-62, -84], [62, -84], [58, -4], 16), { fill: col || '#2A2624', w: 5 });
      for (const sx of [-1, 1]) hd(c, poly([[sx * 50, -30], [sx * 92, -20], [sx * 96, 10], [sx * 54, 0]], 10), { fill: col || '#2A2624', w: 4 });
      hd(c, poly([[-8, -70], [-46, -130], [-30, -134], [0, -84], [30, -134], [46, -130], [8, -70]], 12), { fill: gold, w: 4 });
      hd(c, rect(-60, -18, 120, 14), { fill: CLR.red, w: 3.5 }); break;
    case 'cowboy':
      hd(c, bez([-104, -30], [-70, -44], [70, -44], [104, -30], 10).concat(bez([104, -30], [110, -60], [80, -50], [60, -44], 6), [[-60, -44]], bez([-80, -50], [-110, -60], [-104, -30], [-104, -30], 4)), { fill: col || '#A8703A', w: 5 });
      hd(c, bez([-50, -44], [-54, -110], [-10, -96], [0, -86], 8).concat(bez([0, -86], [10, -96], [54, -110], [50, -44], 8)), { fill: col || '#A8703A', w: 5 });
      hd(c, rect(-50, -60, 100, 12), { fill: '#4A2E1A', w: 3 }); break;
    case 'm1': // WWII US helmet
      hd(c, bez([-62, -10], [-66, -96], [66, -96], [62, -10], 16), { fill: col || '#5E6B3A', w: 5 });
      hd(c, bez([-66, -10], [-40, 0], [40, 0], [66, -10], 8).concat([[62, -18], [-62, -18]]), { fill: tone(col || '#5E6B3A', -.2), w: 4 });
      line(c, qb([-50, -10], [0, 150], [50, -10]), 3, '#3A3020'); break;
    case 'stahlhelm':
      hd(c, bez([-58, -8], [-62, -94], [62, -94], [58, -8], 16).concat([[70, 20], [64, 26], [48, 4], [-48, 4], [-64, 26], [-70, 20]]), { fill: col || '#5C6660', w: 5 }); break;
    case 'nemes': case 'pharaoh':
      hd(c, bez([-50, -30], [-90, 30], [-80, 110], [-60, 120], 10).concat([[-40, 30]]), { fill: '#E9C24A', w: 4.5 }); hd(c, bez([50, -30], [90, 30], [80, 110], [60, 120], 10).concat([[40, 30]]), { fill: '#E9C24A', w: 4.5 });
      hd(c, bez([-60, -2], [-64, -86], [64, -86], [60, -2], 16), { fill: '#E9C24A', w: 5 });
      c.save(); c.strokeStyle = '#2F5FA8'; c.lineWidth = 6; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-58, -70 + i * 14); c.quadraticCurveTo(0, -84 + i * 14, 58, -70 + i * 14); c.stroke(); } c.restore();
      hd(c, rect(-60, -14, 120, 12), { fill: '#2F5FA8', w: 3.5 }); hd(c, poly([[-6, -14], [0, -34], [6, -14]], 6), { fill: gold, w: 3 }); break;
    case 'mongol':
      hd(c, poly([[-50, -40], [-20, -120], [20, -120], [50, -40]], 14), { fill: col || '#A8322A', w: 5 }); hd(c, ell(0, -126, 8, 8), { fill: gold, w: 3 });
      hd(c, bez([-66, -20], [-70, -60], [70, -60], [66, -20], 12).concat(bez([66, -20], [30, -30], [-30, -30], [-66, -20], 8)), { fill: '#7A5A3A', w: 5 }); break;
    case 'morion':
      hd(c, bez([-96, -26], [-60, -40], [60, -40], [96, -26], 10).concat(bez([96, -26], [110, -60], [80, -40], [60, -40], 6), [[-60, -40]], bez([-80, -40], [-110, -60], [-96, -26], [-96, -26], 4)), { fill: '#B9C1C8', w: 5 });
      hd(c, bez([-50, -40], [-50, -100], [50, -100], [50, -40], 12), { fill: '#C9D0D6', w: 5 }); hd(c, poly([[-40, -90], [0, -130], [40, -90]], 10), { fill: '#C9D0D6', w: 4.5 }); break;
    case 'kepi': hd(c, poly([[-54, -40], [-40, -110], [30, -104], [54, -40]], 14), { fill: col || '#2B3A5C', w: 5 }); hd(c, ell(-5, -108, 36, 8, 10, -.1), { fill: tone(col || '#2B3A5C', .15), w: 3 }); hd(c, bez([-40, -36], [0, -18], [50, -20], [80, -30], 8).concat([[54, -42]]), { fill: '#141414', w: 4 }); hd(c, rect(-54, -54, 108, 12), { fill: '#141414', w: 3 }); break;
    case 'bearskin': hd(c, bez([-54, -10], [-66, -190], [66, -190], [54, -10], 18), { fill: '#141212', w: 5 }); line(c, qb([-48, -20], [0, 150], [48, -20]), 3, gold); break;
    case 'ushanka': hd(c, bez([-60, -20], [-64, -96], [64, -96], [60, -20], 14), { fill: col || '#6A5A48', w: 5 }); for (const sx of [-1, 1]) hd(c, poly([[sx * 50, -30], [sx * 72, -26], [sx * 70, 44], [sx * 50, 40]], 10), { fill: '#8A7A66', w: 4 }); hd(c, rect(-62, -44, 124, 30), { fill: '#8A7A66', w: 4 }); hd(c, ell(0, -30, 10, 10), { fill: CLR.red, w: 3 }); break;
    case 'beret': hd(c, bez([-56, -30], [-80, -90], [60, -110], [70, -40], 12).concat([[40, -34]]), { fill: col || '#2A2624', w: 5 }); break;
    case 'fedora': hd(c, ell(0, -40, 92, 16), { fill: col || '#5A4A3A', w: 5 }); hd(c, bez([-48, -44], [-52, -104], [52, -104], [48, -44], 12), { fill: col || '#5A4A3A', w: 5 }); hd(c, rect(-48, -60, 96, 12), { fill: '#262322', w: 3 }); line(c, qb([-20, -98], [0, -84], [20, -98]), 3); break;
    case 'tiara': hd(c, poly([[-44, -46], [-34, -70], [-18, -58], [0, -84], [18, -58], [34, -70], [44, -46]], 10), { fill: gold, w: 4 }); hd(c, ell(0, -64, 6, 6), { fill: CLR.blue, w: 2 }); break;
    case 'veil': case 'wimple': hd(c, bez([-62, 60], [-80, -84], [80, -84], [62, 60], 16).concat(bez([48, 20], [44, -48], [-44, -48], [-48, 20], 10)), { fill: col || '#262322', w: 5 }); if (h === 'wimple') hd(c, bez([-46, 20], [-40, 76], [40, 76], [46, 20], 10), { fill: '#FBF7EE', w: 4 }); break;
    case 'chef': hd(c, rect(-44, -70, 88, 30), { fill: '#FFF', w: 5 }); for (const [x, y, r] of [[-30, -90, 26], [0, -104, 30], [30, -90, 26]]) hd(c, ell(x, y, r, r), { fill: '#FFF', w: 5 }); break;
    case 'grad': hd(c, poly([[-80, -70], [0, -96], [80, -70], [0, -48]], 12), { fill: '#262322', w: 4.5 }); hd(c, rect(-40, -64, 80, 22), { fill: '#262322', w: 4 }); break;
    case 'pirate': hd(c, poly([[-84, -34], [-44, -100], [44, -100], [84, -34], [0, -52]], 14), { fill: '#1E1C1B', w: 5 }); hd(c, ell(0, -74, 12, 11), { fill: '#FFF', w: 3 }); line(c, seg(-10, -60, 10, -60, 2), 3, '#FFF'); break;
    case 'bandana': hd(c, bez([-58, -8], [-62, -80], [62, -80], [58, -8], 14).concat([[40, -20], [-40, -20]]), { fill: col || CLR.red, w: 5 }); hd(c, poly([[54, -24], [86, -8], [70, 12]], 8), { fill: col || CLR.red, w: 4 }); break;
    default: return _hat0(c, o, t);
  }
};

const _outfit0 = outfit;
outfit = function (c, o, t) {
  const f = o.outfit, col = o.color, col2 = o.color2 || CLR.gold;
  const trap = (tw, bw, top, bot, fill) => hd(c, poly([[-tw, top], [tw, top], [bw, bot], [-bw, bot]], 20), { fill, w: 5 });
  const neck = () => line(c, seg(0, 50, 0, 80), 7);
  switch (f) {
    case 'armor': neck(); trap(28, 40, 70, 200, '#B9C1C8'); hd(c, poly([[-28, 70], [28, 70], [24, 130], [-24, 130]], 12), { fill: '#D0D6DB', w: 4 }); hd(c, rect(-36, 150, 72, 12), { fill: CLR.brown, w: 3 }); for (const sx of [-1, 1]) hd(c, ell(sx * 30, 76, 18, 12), { fill: '#D0D6DB', w: 4 }); return;
    case 'napoleon': neck(); trap(26, 40, 70, 230, col || CLR.navy); hd(c, poly([[-18, 72], [18, 72], [14, 200], [-14, 200]], 12), { fill: '#FBF7EE', w: 3.5 }); for (const sx of [-1, 1]) hd(c, rect(sx * 30 - 14, 66, 28, 10), { fill: CLR.gold, w: 3 }); line(c, seg(-26, 78, 28, 170), 7, CLR.red); break;
    case 'redcoat': neck(); trap(26, 38, 70, 220, CLR.red); for (const sx of [-1, 1]) line(c, seg(sx * 22, 74, sx * 30, 216), 3.5, '#FBF7EE'); hd(c, rect(-34, 150, 68, 10), { fill: '#FBF7EE', w: 3 }); return;
    case 'ww2': neck(); trap(26, 38, 70, 206, col || '#6B6F3E'); hd(c, rect(-34, 150, 68, 10), { fill: '#4A3A20', w: 3 }); for (const sx of [-1, 1]) hd(c, rect(sx * 18 - 8, 96, 16, 16), { fill: tone(col || '#6B6F3E', -.1), w: 2.5 }); return;
    case 'kimono': neck(); trap(26, 50, 70, 290, col || '#3A5E9A'); hd(c, poly([[-22, 72], [0, 130], [22, 72], [10, 72], [0, 100], [-10, 72]], 8), { fill: '#FBF7EE', w: 3 }); hd(c, rect(-40, 150, 80, 22), { fill: col2 || CLR.red, w: 3.5 }); return;
    case 'samurai': neck(); trap(28, 44, 70, 220, col || '#8A2A2A'); for (let i = 0; i < 4; i++) line(c, seg(-36 + i * 2, 130 + i * 22, 36 - i * 2, 130 + i * 22), 3, 'rgba(0,0,0,.35)'); for (const sx of [-1, 1]) hd(c, poly([[sx * 22, 70], [sx * 58, 80], [sx * 54, 130], [sx * 26, 120]], 10), { fill: col || '#8A2A2A', w: 4 }); return;
    case 'pirateshirt': neck(); trap(24, 36, 70, 200, '#FBF7EE'); for (let i = 0; i < 5; i++) line(c, seg(-28 + i * 2, 90 + i * 22, 28 - i * 2, 90 + i * 22), 5, CLR.red); hd(c, poly([[-24, 70], [-8, 70], [-14, 200], [-34, 200]], 10), { fill: '#262322', w: 3.5 }); hd(c, poly([[24, 70], [8, 70], [14, 200], [34, 200]], 10), { fill: '#262322', w: 3.5 }); return;
    case 'cowboy': neck(); trap(24, 36, 70, 196, col || '#C8553D'); hd(c, poly([[-24, 70], [-6, 70], [-10, 190], [-34, 190]], 10), { fill: '#6A4428', w: 3.5 }); hd(c, poly([[24, 70], [6, 70], [10, 190], [34, 190]], 10), { fill: '#6A4428', w: 3.5 }); hd(c, rect(-36, 176, 72, 12), { fill: '#3A2618', w: 3 }); hd(c, ell(0, 182, 10, 8), { fill: CLR.gold, w: 2 }); return;
    case 'gown': neck(); hd(c, poly([[-22, 70], [22, 70], [30, 150], [72, 296], [-72, 296], [-30, 150]], 20), { fill: col || '#6A3E8E', w: 5 }); hd(c, poly([[-26, 70], [26, 70], [20, 90], [-20, 90]], 8), { fill: '#FBF7EE', w: 3 }); for (let i = 0; i < 3; i++) line(c, qb([-40 - i * 10, 190 + i * 36], [0, 200 + i * 36], [40 + i * 10, 190 + i * 36]), 3, 'rgba(255,255,255,.4)'); return;
    case 'labcoat': neck(); trap(26, 40, 70, 250, '#FFFFFF'); line(c, seg(0, 80, 0, 246), 3, 'rgba(0,0,0,.25)'); hd(c, poly([[-8, 72], [8, 72], [4, 130], [0, 136], [-4, 130]], 8), { fill: col || CLR.blue, w: 3 }); return;
    case 'egypt': neck(); hd(c, bez([-40, 80], [-30, 70], [30, 70], [40, 80], 8).concat([[26, 104], [-26, 104]]), { fill: '#2F5FA8', w: 4 }); line(c, seg(0, 104, 0, 178), 7); hd(c, poly([[-30, 160], [30, 160], [40, 226], [-40, 226]], 12), { fill: '#FBF7EE', w: 4.5 }); hd(c, rect(-32, 156, 64, 10), { fill: CLR.gold, w: 3 }); return;
    case 'viking': neck(); trap(26, 40, 70, 214, col || '#7A5A3A'); hd(c, bez([-40, 64], [-30, 92], [30, 92], [40, 64], 8).concat([[30, 60], [-30, 60]]), { fill: '#C9B08A', w: 4 }); hd(c, rect(-34, 160, 68, 12), { fill: '#3A2618', w: 3.5 }); return;
    case 'fur': neck(); trap(28, 44, 70, 230, col || '#8A6A4A'); hd(c, bez([-44, 64], [-40, 100], [40, 100], [44, 64], 8).concat([[34, 58], [-34, 58]]), { fill: '#C9B08A', w: 4 }); return;
    case 'soviet': neck(); trap(26, 38, 70, 206, col || '#6F7A4A'); hd(c, rect(-34, 150, 68, 10), { fill: '#4A3A20', w: 3 }); return;
    default: return _outfit0(c, o, t);
  }
};

/* ---------- more animals ---------- */
function pig(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); const pk = '#F2A6B0', run = o.run ? Math.sin(t * 12) : 0;
  for (const k of [-50, -20, 20, 50]) hd(c, rect(k - 8, 30 + (k % 40 ? run * 6 : -run * 6), 16, 44), { fill: pk, w: 4 });
  hd(c, ell(0, 0, 90, 56), { fill: pk, w: 5 }); line(c, [[-90, -10], [-110, -24], [-100, -34], [-96, -20]], 4);
  hd(c, ell(84, -20, 44, 40), { fill: pk, w: 5 }); hd(c, ell(120, -14, 16, 14), { fill: '#E88A98', w: 4 }); for (const d of [-5, 5]) hd(c, ell(120 + d, -14, 3, 4), { fill: T.ink, w: 0 });
  for (const sx of [-1, 1]) hd(c, poly([[74 + sx * 16, -52], [84 + sx * 26, -80], [96 + sx * 14, -54]], 8), { fill: pk, w: 4 });
  hd(c, ell(96, -32, 6, 8), { fill: T.ink, w: 0 }); c.fillStyle = '#FFF'; c.beginPath(); c.arc(94, -35, 2, 0, TAU2); c.fill();
  if (o.mood === 'happy') line(c, qb([98, 4], [108, 12], [118, 4]), 3);
  c.restore();
}
function horse(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); const col = o.color || '#9A6238', run = o.run ? Math.sin(t * 10) : 0;
  for (const [k, ph] of [[-80, 0], [-50, 1], [60, 1], [90, 0]]) { const a = (ph ? run : -run) * .5; line(c, [[k, 30], [k + Math.sin(a) * 40, 100], [k + Math.sin(a) * 40 + 4, 150]], 12, T.ink); line(c, [[k, 30], [k + Math.sin(a) * 40, 100], [k + Math.sin(a) * 40 + 4, 150]], 7, col); }
  hd(c, ell(0, 0, 130, 60), { fill: col, w: 5 });
  hd(c, poly([[90, -20], [150, -110], [190, -110], [230, -60], [210, -40], [170, -70], [130, 20]], 14), { fill: col, w: 5 });
  hd(c, poly([[150, -110], [140, -60], [120, -30], [110, -60], [140, -118]], 10), { fill: '#3A2618', w: 4 });
  line(c, [[-130, -10], [-170, 30], [-160, 70]], 14, '#3A2618');
  hd(c, ell(182, -92, 6, 7), { fill: T.ink, w: 0 });
  c.restore();
}
function rat(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  line(c, qb([-60, 10], [-120, 30], [-140, -10 + Math.sin(t * 6) * 10]), 4, '#C98A8A');
  hd(c, bez([-60, 20], [-70, -40], [40, -50], [70, 10], 10).concat([[60, 24]]), { fill: '#8E8E94', w: 4.5 });
  hd(c, ell(-10, -40, 16, 18), { fill: '#A8A8AE', w: 4 }); hd(c, ell(56, -6, 5, 6), { fill: T.ink, w: 0 }); hd(c, ell(74, 8, 6, 5), { fill: '#E07A7E', w: 2.5 });
  c.restore();
}
function elephant(c, x, y, s = 1, o = {}, t = 0) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); const g = '#9AA0A6';
  for (const k of [-90, -40, 40, 90]) hd(c, rect(k - 20, 20, 40, 120), { fill: g, w: 5 });
  hd(c, ell(0, -20, 150, 100), { fill: g, w: 5 });
  hd(c, ell(150, -60, 70, 66), { fill: g, w: 5 }); hd(c, ell(120, -50, 50, 64), { fill: '#B4BAC0', w: 4.5 });
  line(c, qb([200, -30], [240, 60 + Math.sin(t * 3) * 10], [200, 110]), 22, T.ink); line(c, qb([200, -30], [240, 60 + Math.sin(t * 3) * 10], [200, 110]), 15, g);
  hd(c, poly([[190, 0], [230, 20], [196, 14]], 6), { fill: '#FBF7EE', w: 3 });
  hd(c, ell(176, -76, 7, 8), { fill: T.ink, w: 0 });
  c.restore();
}
const ANIMALS = { emu, pig, horse, rat, elephant };

/* ---------- more props (money topics and more) ---------- */
const _prop0 = prop;
prop = function (c, p, h, ang, t, o) {
  c.save(); c.translate(h[0], h[1]);
  switch (p) {
    case 'moneybag': hd(c, bez([-30, 0], [-50, 70], [50, 70], [30, 0], 12).concat([[14, -14], [-14, -14]]), { fill: '#C8A060', w: 4 }); line(c, seg(-16, -8, 16, -8, 2), 4, '#6A4428'); c.font = 'bold 34px Anton'; c.fillStyle = '#3A2A10'; c.textAlign = 'center'; c.fillText('$', 0, 46); break;
    case 'goldbar': hd(c, poly([[-30, -6], [30, -6], [38, 18], [-38, 18]], 8), { fill: CLR.gold, w: 4 }); line(c, seg(-20, 2, 14, 2, 2), 2.5, '#FFF3B0'); break;
    case 'coin': hd(c, ell(8, 0, 20, 20), { fill: CLR.gold, w: 4 }); hd(c, ell(8, 0, 12, 12), { fill: '#F6CE5A', w: 2 }); break;
    case 'goblet': hd(c, poly([[-18, -40], [18, -40], [10, -6], [-10, -6]], 8), { fill: CLR.gold, w: 3.5 }); line(c, seg(0, -6, 0, 14, 2), 5, CLR.gold); hd(c, ell(0, 16, 14, 5), { fill: CLR.gold, w: 3 }); break;
    case 'letter': hd(c, rect(-6, -26, 50, 36), { fill: '#FBF7EE', w: 3.5 }); line(c, poly([[-6, -26], [19, -6], [44, -26]], 8, false), 3); break;
    default: c.restore(); return _prop0(c, p, h, ang, t, o);
  }
  c.restore();
};
