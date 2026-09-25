/* History Pros character engine: illustrated half-length figures.
 * person(c, spec, x, y, scale) draws a figure whose head centre sits at (x, y).
 * The head is ~160 units tall at scale 1. Style: bold ink outline, two-tone
 * cel shading, soft form shading, and a red rim light to sit in Dark Chronicle.
 *
 * spec = { skin: 'fair'|'olive'|'brown'|'deep', age: 'young'|'adult'|'old',
 *          sex: 'm'|'f', expr: 'shock'|'fear'|'grim'|'neutral'|'sad',
 *          hair: 'short'|'curly'|'long'|'bald'|'bun'|'none', hairColor,
 *          beard: 'none'|'full'|'goatee'|'stubble', moustache: 'none'|'walrus'|'curled'|'thin',
 *          hat: 'none'|'capotain'|'coif'|'cavalier'|'brodie'|'peaked'|'pickelhaube'|'tophat'|
 *               'custodian'|'crown'|'turban'|'hood'|'sailor'|'bonnet'|'slouch'|'laurel',
 *          outfit: 'tunic'|'coat'|'uniform'|'robe'|'dress'|'toga'|'sailor'|'armor',
 *          color, collar: 'none'|'band'|'ruff'|'wide', look: -1..1 (gaze), tilt: radians } */
const SKINS = { fair: ['#EBC3A0', '#C99470', '#9E6B4C'], olive: ['#D6A47A', '#B38158', '#835A3C'], brown: ['#A66E48', '#86532F', '#5E361D'], deep: ['#71462A', '#56331C', '#3A2012'] };
const INKC = '#140E0C';
function tone(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return `rgb(${m(r)},${m(g)},${m(b)})`; }
function inkStroke(c, w = 5) { c.strokeStyle = INKC; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function headPath(c, keep) { if (!keep) c.beginPath(); c.moveTo(0, -80); c.bezierCurveTo(46, -80, 64, -46, 62, -6); c.bezierCurveTo(60, 34, 40, 70, 0, 80); c.bezierCurveTo(-40, 70, -60, 34, -62, -6); c.bezierCurveTo(-64, -46, -46, -80, 0, -80); c.closePath(); }
function shadeClip(c, pathFn, color, dx = 30, alpha = .9) { c.save(); pathFn(); c.clip(); c.fillStyle = color; c.globalAlpha = alpha; c.filter = 'blur(6px)'; c.beginPath(); c.ellipse(dx + 120, 30, 120, 190, -.12, 0, TAU); c.fill(); c.filter = 'none'; c.restore(); }
function rim(c, pathFn, w = 7) { c.save(); pathFn(); c.clip(); c.beginPath(); c.rect(-600, -600, 1200, 1200); c.translate(-w * 1.6, 3); pathFn(true); c.translate(w * 1.6, -3); c.clip('evenodd'); c.fillStyle = 'rgba(232,80,62,.85)'; c.fillRect(-600, -600, 1200, 1200); c.restore(); }

function bodyPath(c, sp, keep) {
  const wide = sp.outfit === 'armor' || sp.outfit === 'uniform' ? 1.08 : sp.sex === 'f' ? .9 : 1;
  if (!keep) c.beginPath(); c.moveTo(-230 * wide, 420); c.bezierCurveTo(-225 * wide, 230, -170 * wide, 150, -60, 118); c.lineTo(60, 118); c.bezierCurveTo(170 * wide, 150, 225 * wide, 230, 230 * wide, 420); c.closePath();
}
function drawBody(c, sp) {
  const col = sp.color || '#2B2F36';
  bodyPath(c, sp); c.fillStyle = col; c.fill();
  shadeClip(c, () => bodyPath(c, sp), tone(col, -.35), 70);
  // folds and details per outfit
  c.save(); bodyPath(c, sp); c.clip();
  c.strokeStyle = tone(col, -.5); c.lineWidth = 4;
  if (sp.outfit === 'coat' || sp.outfit === 'uniform') {
    c.fillStyle = tone(col, -.2); c.beginPath(); c.moveTo(-58, 118); c.lineTo(-10, 260); c.lineTo(-100, 170); c.closePath(); c.fill(); c.beginPath(); c.moveTo(58, 118); c.lineTo(10, 260); c.lineTo(100, 170); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, 160); c.lineTo(0, 420); c.stroke();
    c.fillStyle = sp.outfit === 'uniform' ? '#8C7A3E' : '#9A8F80'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(16, 200 + i * 55, 7, 0, TAU); c.fill(); }
    if (sp.outfit === 'uniform') { for (const m of [-1, 1]) { const px = m * 118 - 34; c.fillStyle = tone(col, -.12); rrect(c, px, 232, 68, 66, 6); c.fill(); c.strokeStyle = tone(col, -.5); c.lineWidth = 3; c.stroke(); c.fillStyle = tone(col, -.25); c.beginPath(); c.moveTo(px - 3, 228); c.lineTo(px + 71, 228); c.lineTo(px + 71, 250); c.lineTo(px + 34, 258); c.lineTo(px - 3, 250); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#8C7A3E'; c.beginPath(); c.arc(px + 34, 248, 5, 0, TAU); c.fill(); } c.strokeStyle = tone(col, -.5); c.lineWidth = 4; c.fillStyle = '#5A4A28'; c.fillRect(-240, 360, 480, 24); }
  } else if (sp.outfit === 'robe' || sp.outfit === 'toga') {
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-140 + i * 20, 140 + i * 10); c.quadraticCurveTo(-40 + i * 40, 260, 40 + i * 30, 420); c.stroke(); }
    if (sp.outfit === 'toga') { c.fillStyle = tone(col, .12); c.beginPath(); c.moveTo(-60, 118); c.bezierCurveTo(40, 170, 140, 250, 210, 420); c.lineTo(120, 420); c.bezierCurveTo(60, 280, -10, 200, -80, 150); c.closePath(); c.fill(); }
  } else if (sp.outfit === 'dress') {
    c.fillStyle = tone(col, -.15); c.beginPath(); c.moveTo(-90, 240); c.quadraticCurveTo(0, 270, 90, 240); c.lineTo(80, 420); c.lineTo(-80, 420); c.fill();
  } else if (sp.outfit === 'sailor') {
    c.fillStyle = '#1F3552'; c.beginPath(); c.moveTo(-120, 130); c.lineTo(0, 250); c.lineTo(120, 130); c.lineTo(160, 170); c.lineTo(0, 300); c.lineTo(-160, 170); c.closePath(); c.fill();
    c.fillStyle = '#F2F2F2'; c.beginPath(); c.moveTo(-26, 230); c.lineTo(0, 290); c.lineTo(26, 230); c.fill();
  } else if (sp.outfit === 'armor') {
    c.fillStyle = tone(col, .15); c.beginPath(); c.ellipse(-150, 180, 70, 50, -.4, 0, TAU); c.ellipse(150, 180, 70, 50, .4, 0, TAU); c.fill();
    c.strokeStyle = '#C9A24A'; c.lineWidth = 6; c.beginPath(); c.moveTo(-60, 118); c.lineTo(0, 190); c.lineTo(60, 118); c.stroke();
  } else { c.beginPath(); c.moveTo(-40, 118); c.quadraticCurveTo(0, 170, 40, 118); c.stroke(); }
  c.restore();
  bodyPath(c, sp); inkStroke(c, 6); rim(c, k => bodyPath(c, sp, k), 8);
  // collar pieces sit on top of the body
  if (sp.collar === 'band') { c.fillStyle = '#EDEAE2'; c.beginPath(); c.moveTo(-70, 112); c.lineTo(70, 112); c.lineTo(62, 188); c.lineTo(0, 170); c.lineTo(-62, 188); c.closePath(); c.fill(); inkStroke(c, 4); c.beginPath(); c.moveTo(0, 116); c.lineTo(0, 170); inkStroke(c, 3); }
  if (sp.collar === 'wide') { c.fillStyle = '#EDEAE2'; c.beginPath(); c.moveTo(-60, 112); c.bezierCurveTo(-170, 130, -190, 200, -150, 220); c.bezierCurveTo(-80, 210, -20, 180, 0, 150); c.bezierCurveTo(20, 180, 80, 210, 150, 220); c.bezierCurveTo(190, 200, 170, 130, 60, 112); c.closePath(); c.fill(); inkStroke(c, 4); }
  if (sp.collar === 'ruff') { c.fillStyle = '#EDEAE2'; for (let i = -5; i <= 5; i++) { c.beginPath(); c.ellipse(i * 15, 118, 16, 22, 0, 0, TAU); c.fill(); inkStroke(c, 2.5); } }
}
function drawNeck(c, sk) { c.beginPath(); c.moveTo(-30, 50); c.lineTo(30, 50); c.lineTo(36, 124); c.quadraticCurveTo(0, 140, -36, 124); c.closePath(); c.fillStyle = sk[1]; c.fill(); inkStroke(c, 5); c.beginPath(); c.moveTo(-30, 70); c.quadraticCurveTo(0, 90, 30, 70); c.strokeStyle = sk[2]; c.lineWidth = 3; c.stroke(); }
function drawEars(c, sk) { for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 62, 4, 12, 20, s * .2, 0, TAU); c.fillStyle = s > 0 ? sk[1] : sk[0]; c.fill(); inkStroke(c, 4); } }
function drawHairBack(c, sp) {
  const hc = sp.hairColor || '#2A1E16';
  if (sp.hair === 'long') { c.fillStyle = hc; c.beginPath(); c.moveTo(-70, -40); c.bezierCurveTo(-110, 60, -110, 170, -70, 200); c.lineTo(70, 200); c.bezierCurveTo(110, 170, 110, 60, 70, -40); c.closePath(); c.fill(); inkStroke(c, 5); }
  if (sp.hat === 'turban' || sp.hat === 'hood') { c.fillStyle = sp.hat === 'hood' ? (sp.color || '#4A3A2C') : '#E8E2D4'; c.beginPath(); c.ellipse(0, -10, 96, 110, 0, 0, TAU); c.fill(); inkStroke(c, 5); }
  if (sp.hat === 'coif' || sp.hat === 'bonnet') { c.fillStyle = sp.hat === 'coif' ? '#ECE8DE' : '#6B5B45'; c.beginPath(); c.ellipse(0, -8, 88, 100, 0, 0, TAU); c.fill(); inkStroke(c, 5); }
}
function drawHairFront(c, sp) {
  const hc = sp.hairColor || '#2A1E16', dark = tone(hc.startsWith('#') ? hc : '#2A1E16', -.35);
  c.fillStyle = hc;
  if (sp.hair === 'short' || sp.hair === 'long' || sp.hair === 'bun') {
    c.beginPath(); c.moveTo(-64, -10); c.bezierCurveTo(-72, -70, -40, -96, 0, -96); c.bezierCurveTo(44, -96, 74, -70, 64, -10); c.bezierCurveTo(56, -40, 30, -58, 6, -52); c.bezierCurveTo(-20, -60, -48, -46, -64, -10); c.closePath(); c.fill(); inkStroke(c, 5);
    c.strokeStyle = dark; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-40 + i * 24, -86); c.quadraticCurveTo(-30 + i * 24, -70, -34 + i * 26, -56); c.stroke(); }
    if (sp.hair === 'bun') { c.fillStyle = hc; c.beginPath(); c.arc(0, -104, 26, 0, TAU); c.fill(); inkStroke(c, 5); }
  }
  if (sp.hair === 'curly') { for (let i = 0; i < 11; i++) { const a = Math.PI + i / 10 * Math.PI; c.beginPath(); c.arc(Math.cos(a) * 58, -30 + Math.sin(a) * 58, 20, 0, TAU); c.fill(); inkStroke(c, 4); } }
  if (sp.hair === 'bald') { c.beginPath(); c.ellipse(-60, -8, 12, 30, .2, 0, TAU); c.ellipse(60, -8, 12, 30, -.2, 0, TAU); c.fill(); }
}
function drawFace(c, sp, sk) {
  const e = sp.expr || 'neutral', look = (sp.look || 0) * 5, old = sp.age === 'old';
  // blush and form shading
  c.fillStyle = 'rgba(190,70,60,.16)'; c.beginPath(); c.ellipse(-34, 26, 16, 10, 0, 0, TAU); c.ellipse(34, 26, 16, 10, 0, 0, TAU); c.fill();
  // eyes
  const big = e === 'shock' ? 1.3 : e === 'fear' ? 1.15 : e === 'grim' ? .85 : 1;
  for (const s of [-1, 1]) {
    const ex = s * 25, ey = -6;
    c.beginPath(); c.ellipse(ex, ey, 13 * big, (e === 'grim' ? 8 : 12) * big, 0, 0, TAU); c.fillStyle = '#F7F3EC'; c.fill(); inkStroke(c, 3.5);
    c.save(); c.beginPath(); c.ellipse(ex, ey, 13 * big, (e === 'grim' ? 8 : 12) * big, 0, 0, TAU); c.clip();
    c.fillStyle = '#3A2A1E'; c.beginPath(); c.arc(ex + look, ey + (e === 'sad' ? 3 : 0), 7 * Math.min(big, 1.05), 0, TAU); c.fill();
    c.fillStyle = '#0B0806'; c.beginPath(); c.arc(ex + look, ey + (e === 'sad' ? 3 : 0), 3.6, 0, TAU); c.fill();
    c.fillStyle = '#FFF'; c.beginPath(); c.arc(ex + look - 2.5, ey - 3, 2.2, 0, TAU); c.fill();
    if (e === 'grim' || e === 'sad') { c.fillStyle = sk[1]; c.fillRect(ex - 16, ey - 16, 32, e === 'grim' ? 9 : 7); }
    c.restore();
    // brows
    c.beginPath(); const inner = ex - s * 10, outer = ex + s * 14;
    const bi = { shock: -34, fear: -32, grim: -18, sad: -30, neutral: -24 }[e], bo = { shock: -32, fear: -22, grim: -26, sad: -20, neutral: -24 }[e];
    c.moveTo(inner, ey + bi + 6); c.quadraticCurveTo(ex, ey + Math.min(bi, bo) - 2 + 6, outer, ey + bo + 6); c.strokeStyle = sp.hairColor && sp.hair !== 'none' ? tone(sp.hairColor, -.3) : '#2A1E16'; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
    if (old) { c.beginPath(); c.moveTo(ex - 10, ey + 18); c.quadraticCurveTo(ex, ey + 22, ex + 10, ey + 18); c.strokeStyle = sk[2]; c.lineWidth = 2; c.stroke(); }
  }
  if (old) { c.strokeStyle = sk[2]; c.lineWidth = 2.5; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-26, -44 - i * 9); c.quadraticCurveTo(0, -48 - i * 9, 26, -44 - i * 9); c.stroke(); } }
  // nose
  c.beginPath(); c.moveTo(-2, 0); c.quadraticCurveTo(4, 16, 10, 22); c.quadraticCurveTo(2, 28, -8, 24); c.strokeStyle = sk[2]; c.lineWidth = 3.5; c.stroke();
  c.fillStyle = sk[1]; c.beginPath(); c.ellipse(6, 20, 8, 5, 0, 0, TAU); c.fill();
  // mouth
  const my = 46; c.lineWidth = 4; c.strokeStyle = INKC;
  if (e === 'shock') { c.beginPath(); c.ellipse(0, my + 4, 13, 18, 0, 0, TAU); c.fillStyle = '#3A0F0E'; c.fill(); inkStroke(c, 4); c.fillStyle = '#B5413A'; c.beginPath(); c.ellipse(0, my + 14, 8, 5, 0, 0, TAU); c.fill(); c.fillStyle = '#F2EDE4'; c.fillRect(-8, my - 12, 16, 5); }
  else if (e === 'fear') { c.beginPath(); c.moveTo(-18, my + 4); c.quadraticCurveTo(-9, my - 4, 0, my + 3); c.quadraticCurveTo(9, my - 4, 18, my + 4); c.quadraticCurveTo(0, my + 14, -18, my + 4); c.fillStyle = '#3A0F0E'; c.fill(); inkStroke(c, 3.5); c.fillStyle = '#F2EDE4'; c.fillRect(-12, my, 24, 4); }
  else if (e === 'grim') { c.beginPath(); c.moveTo(-18, my + 2); c.lineTo(18, my); inkStroke(c, 4); }
  else if (e === 'sad') { c.beginPath(); c.moveTo(-16, my + 6); c.quadraticCurveTo(0, my - 4, 16, my + 6); inkStroke(c, 4); }
  else { c.beginPath(); c.moveTo(-16, my); c.quadraticCurveTo(0, my + 7, 16, my); inkStroke(c, 4); }
}
function drawFacialHair(c, sp) {
  const hc = sp.hairColor || '#2A1E16'; c.fillStyle = hc;
  if (sp.beard === 'full') { c.beginPath(); c.moveTo(-60, 6); c.bezierCurveTo(-56, 60, -34, 104, 0, 112); c.bezierCurveTo(34, 104, 56, 60, 60, 6); c.bezierCurveTo(46, 40, 30, 62, 20, 62); c.quadraticCurveTo(0, 70, -20, 62); c.bezierCurveTo(-30, 62, -46, 40, -60, 6); c.closePath(); c.fill(); inkStroke(c, 4); }
  if (sp.beard === 'goatee') { c.beginPath(); c.moveTo(-14, 64); c.quadraticCurveTo(0, 120, 14, 64); c.closePath(); c.fill(); inkStroke(c, 3.5); }
  if (sp.beard === 'stubble') { c.fillStyle = 'rgba(40,30,24,.28)'; c.beginPath(); c.moveTo(-56, 20); c.bezierCurveTo(-50, 64, -30, 80, 0, 82); c.bezierCurveTo(30, 80, 50, 64, 56, 20); c.bezierCurveTo(40, 50, 20, 56, 0, 56); c.bezierCurveTo(-20, 56, -40, 50, -56, 20); c.fill(); }
  c.fillStyle = hc;
  if (sp.moustache === 'walrus') { c.beginPath(); c.moveTo(-30, 44); c.quadraticCurveTo(0, 20, 30, 44); c.quadraticCurveTo(0, 36, -30, 44); c.fill(); inkStroke(c, 3.5); }
  if (sp.moustache === 'curled') { for (const m of [-1, 1]) { c.beginPath(); c.moveTo(0, 31); c.bezierCurveTo(m * 12, 27, m * 24, 38, m * 34, 32); c.quadraticCurveTo(m * 42, 27, m * 40, 19); c.quadraticCurveTo(m * 46, 30, m * 36, 38); c.bezierCurveTo(m * 26, 44, m * 10, 38, 0, 37); c.closePath(); c.fill(); inkStroke(c, 2.5); } }
  if (sp.moustache === 'thin') { c.beginPath(); c.moveTo(-20, 38); c.quadraticCurveTo(0, 32, 20, 38); c.strokeStyle = hc; c.lineWidth = 6; c.stroke(); }
}
function drawHat(c, sp) {
  const h = sp.hat;
  const fill = (col, fn, w = 5) => { c.fillStyle = col; c.beginPath(); fn(); c.fill(); inkStroke(c, w); };
  if (h === 'capotain') { fill('#17171A', () => c.ellipse(0, -62, 118, 24, 0, 0, TAU)); fill('#1D1D21', () => { c.moveTo(-58, -64); c.lineTo(-46, -178); c.quadraticCurveTo(0, -190, 46, -178); c.lineTo(58, -64); c.closePath(); }); c.fillStyle = '#6B5A2E'; c.fillRect(-56, -92, 112, 16); c.strokeStyle = '#C9A24A'; c.lineWidth = 4; c.strokeRect(-12, -93, 24, 18); }
  if (h === 'tophat') { fill('#141417', () => c.ellipse(0, -66, 98, 18, 0, 0, TAU)); fill('#18181C', () => { c.rect(-54, -210, 108, 146); }); c.fillStyle = '#2E2E33'; c.fillRect(-54, -96, 108, 14); }
  if (h === 'cavalier') { fill('#1A1A1D', () => { c.ellipse(4, -64, 150, 30, -.12, 0, TAU); }); fill('#1E1E22', () => { c.moveTo(-60, -66); c.bezierCurveTo(-60, -150, 60, -160, 64, -72); c.closePath(); }); c.fillStyle = '#5B4A2A'; c.fillRect(-60, -84, 122, 12); }
  if (h === 'brodie') { fill('#57583D', () => c.ellipse(0, -58, 126, 26, 0, 0, TAU)); fill('#626446', () => { c.moveTo(-72, -60); c.bezierCurveTo(-70, -140, 70, -140, 72, -60); c.closePath(); }); c.beginPath(); c.moveTo(-60, -52); c.bezierCurveTo(-60, 40, -30, 88, 0, 88); c.bezierCurveTo(30, 88, 60, 40, 60, -52); c.strokeStyle = '#3A2E1E'; c.lineWidth = 5; c.stroke(); }
  if (h === 'peaked') { fill('#4E4C33', () => { c.moveTo(-70, -50); c.bezierCurveTo(-90, -110, 90, -110, 70, -50); c.closePath(); }); fill('#2A2A1E', () => { c.moveTo(-56, -52); c.quadraticCurveTo(0, -30, 70, -46); c.quadraticCurveTo(10, -64, -56, -52); }); c.fillStyle = '#B0923E'; c.beginPath(); c.arc(0, -78, 9, 0, TAU); c.fill(); }
  if (h === 'pickelhaube') { fill('#8A8061', () => { c.moveTo(-68, -46); c.bezierCurveTo(-72, -140, 72, -140, 68, -46); c.closePath(); }); fill('#6C644B', () => { c.moveTo(-70, -48); c.quadraticCurveTo(0, -30, 76, -44); c.lineTo(76, -36); c.quadraticCurveTo(0, -22, -70, -40); c.closePath(); }, 3); fill('#B59A52', () => { c.moveTo(-9, -112); c.lineTo(0, -166); c.lineTo(9, -112); c.closePath(); }, 4); fill('#B59A52', () => c.ellipse(0, -114, 20, 8, 0, 0, TAU), 3.5); fill('#B59A52', () => c.ellipse(0, -84, 22, 18, 0, 0, TAU), 3); }
  if (h === 'custodian') { fill('#141A2A', () => { c.moveTo(-66, -50); c.bezierCurveTo(-74, -200, 74, -200, 66, -50); c.closePath(); }); c.fillStyle = '#C9C3B0'; c.beginPath(); c.arc(0, -100, 14, 0, TAU); c.fill(); c.fillStyle = '#141A2A'; c.beginPath(); c.arc(0, -178, 12, 0, TAU); c.fill(); }
  if (h === 'crown') { fill('#C9A24A', () => { c.moveTo(-62, -54); c.lineTo(-58, -118); c.quadraticCurveTo(0, -138, 58, -118); c.lineTo(62, -54); c.quadraticCurveTo(0, -66, -62, -54); }); for (let i = -2; i <= 2; i++) { c.fillStyle = i % 2 ? '#8E2A1F' : '#2F5D6E'; c.beginPath(); c.arc(i * 22, -88, 7, 0, TAU); c.fill(); } for (const s of [-1, 1]) { c.strokeStyle = '#C9A24A'; c.lineWidth = 3; c.beginPath(); c.moveTo(s * 60, -56); c.lineTo(s * 64, 10); c.stroke(); for (let k = 0; k < 4; k++) { c.fillStyle = '#EDEAE2'; c.beginPath(); c.arc(s * (61 + k), -40 + k * 16, 4, 0, TAU); c.fill(); } } }
  if (h === 'turban') { fill('#EAE4D6', () => { c.moveTo(-96, -40); c.bezierCurveTo(-110, -150, 110, -150, 96, -40); c.quadraticCurveTo(0, -60, -96, -40); }); c.strokeStyle = '#B8B0A0'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-90, -60 - i * 16); c.quadraticCurveTo(0, -80 - i * 22, 90, -60 - i * 16); c.stroke(); } fill('#8E2A1F', () => { c.ellipse(0, -140, 30, 18, 0, 0, TAU); }, 4); }
  if (h === 'hood') { fill(sp.color || '#4A3A2C', () => { c.moveTo(-90, 30); c.bezierCurveTo(-110, -150, 110, -150, 90, 30); c.bezierCurveTo(70, -40, 50, -76, 0, -80); c.bezierCurveTo(-50, -76, -70, -40, -90, 30); c.closePath(); }); }
  if (h === 'coif') { fill('#F1EEE6', () => { c.moveTo(-84, 30); c.bezierCurveTo(-96, -120, 96, -120, 84, 30); c.bezierCurveTo(72, -30, 54, -70, 0, -76); c.bezierCurveTo(-54, -70, -72, -30, -84, 30); c.closePath(); }, 4); }
  if (h === 'bonnet') { fill('#7A6A50', () => { c.moveTo(-96, 20); c.bezierCurveTo(-120, -150, 120, -150, 96, 20); c.bezierCurveTo(80, -40, 60, -78, 0, -82); c.bezierCurveTo(-60, -78, -80, -40, -96, 20); c.closePath(); }); }
  if (h === 'slouch') { fill('#4B3B2B', () => c.ellipse(0, -60, 136, 30, .08, 0, TAU)); fill('#55432F', () => { c.moveTo(-62, -62); c.bezierCurveTo(-64, -140, 64, -140, 62, -62); c.closePath(); }); }
  if (h === 'sailor') { fill('#F4F4F2', () => { c.moveTo(-66, -52); c.lineTo(-58, -104); c.quadraticCurveTo(0, -116, 58, -104); c.lineTo(66, -52); c.quadraticCurveTo(0, -64, -66, -52); }); c.strokeStyle = '#C8C8C4'; c.lineWidth = 3; c.beginPath(); c.moveTo(-64, -62); c.quadraticCurveTo(0, -74, 64, -62); c.stroke(); }
  if (h === 'laurel') { c.fillStyle = '#6F8A3A'; for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + s * (.35 + i * .2); c.save(); c.translate(Math.cos(a) * 66, -20 + Math.sin(a) * 70); c.rotate(a + s * 1.2); c.beginPath(); c.ellipse(0, 0, 13, 6, 0, 0, TAU); c.fill(); inkStroke(c, 2); c.restore(); } }
}

function person(c, sp, x, y, s = 1) {
  const sk = SKINS[sp.skin || 'fair'];
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(sp.tilt || 0);
  drawHairBack(c, sp); drawBody(c, sp); drawNeck(c, sk);
  drawEars(c, sk);
  headPath(c); c.fillStyle = sk[0]; c.fill();
  shadeClip(c, () => headPath(c), sk[1], 18, .95);
  c.save(); headPath(c); c.clip(); const hl = c.createRadialGradient(-26, -30, 4, -26, -30, 70); hl.addColorStop(0, 'rgba(255,240,220,.35)'); hl.addColorStop(1, 'rgba(255,240,220,0)'); c.fillStyle = hl; c.fillRect(-80, -100, 160, 200); c.restore();
  rim(c, k => headPath(c, k), 4.5);
  headPath(c); inkStroke(c, 6);
  drawFace(c, sp, sk); drawFacialHair(c, sp); drawHairFront(c, sp); drawHat(c, sp);
  c.restore();
}

/* Cast list for the Q4 documentaries. Clothing follows the period. */
const CAST = {
  sailor1347: { name: 'A Genoese sailor', role: 'Messina, 1347', skin: 'olive', age: 'adult', expr: 'fear', hair: 'short', hairColor: '#2A1E16', beard: 'stubble', hat: 'hood', outfit: 'tunic', color: '#5A4632', look: .6 },
  agnolo: { name: 'Agnolo di Tura', role: 'Chronicler, Siena 1348', skin: 'olive', age: 'adult', expr: 'sad', hair: 'short', hairColor: '#3A2A1E', beard: 'full', hat: 'none', outfit: 'robe', color: '#5B3A2A' },
  roman: { name: 'A citizen of Pompeii', role: '79 AD', skin: 'olive', age: 'adult', expr: 'shock', hair: 'curly', hairColor: '#2A1E16', beard: 'none', hat: 'none', outfit: 'toga', color: '#CFC6B2', look: .5 },
  pliny: { name: 'Pliny the Younger', role: 'Eyewitness, age 17', skin: 'olive', age: 'young', expr: 'fear', hair: 'curly', hairColor: '#3A2A1E', beard: 'none', hat: 'none', outfit: 'toga', color: '#D8CFBA' },
  constantine: { name: 'Constantine XI', role: 'Last Roman emperor', skin: 'fair', age: 'old', expr: 'grim', hair: 'short', hairColor: '#6A6058', beard: 'full', hat: 'crown', outfit: 'armor', color: '#6A1E2A' },
  mehmed: { name: 'Mehmed II', role: 'Ottoman sultan, age 21', skin: 'olive', age: 'young', expr: 'grim', hair: 'none', hairColor: '#2A1E16', beard: 'goatee', moustache: 'curled', hat: 'turban', outfit: 'robe', color: '#2F5D3E' },
  puritanW: { name: 'Mary Easty', role: 'Accused, Salem 1692', skin: 'fair', age: 'old', sex: 'f', expr: 'sad', hair: 'none', hat: 'coif', outfit: 'dress', color: '#2B2F36', collar: 'wide' },
  magistrate: { name: 'A Salem magistrate', role: 'Court of Oyer and Terminer', skin: 'fair', age: 'old', expr: 'grim', hair: 'long', hairColor: '#8A8378', beard: 'none', hat: 'capotain', outfit: 'coat', color: '#1D1D22', collar: 'band' },
  constable: { name: 'A Whitechapel constable', role: 'London, 1888', skin: 'fair', age: 'adult', expr: 'shock', hair: 'short', hairColor: '#3A2A1E', moustache: 'walrus', hat: 'custodian', outfit: 'coat', color: '#141A2A', look: -.5 },
  fawkes: { name: 'Guy Fawkes', role: 'Caught November 5, 1605', skin: 'fair', age: 'adult', expr: 'grim', hair: 'long', hairColor: '#5A3A22', beard: 'goatee', moustache: 'curled', hat: 'cavalier', outfit: 'coat', color: '#2A2420', collar: 'band' },
  tommy: { name: 'A British soldier', role: 'Western Front, 1918', skin: 'fair', age: 'young', expr: 'fear', hair: 'short', hairColor: '#5A3A22', moustache: 'thin', hat: 'brodie', outfit: 'uniform', color: '#6B6446', look: .4 },
  pioneerW: { name: 'Virginia Reed', role: 'Survivor, age 13', skin: 'fair', age: 'young', sex: 'f', expr: 'fear', hair: 'long', hairColor: '#4A2E1C', hat: 'bonnet', outfit: 'dress', color: '#6A5540' },
  pilgrim: { name: 'A Mayflower passenger', role: 'Plymouth, 1620', skin: 'fair', age: 'adult', expr: 'grim', hair: 'long', hairColor: '#5A3A22', beard: 'goatee', hat: 'capotain', outfit: 'coat', color: '#3A2E26', collar: 'wide' },
  scholar: { name: 'A scholar of Alexandria', role: 'The Library, 48 BC', skin: 'olive', age: 'old', expr: 'shock', hair: 'bald', hairColor: '#8A8378', beard: 'full', hat: 'none', outfit: 'toga', color: '#C9C0AA', look: .5 },
  sailor1941: { name: 'A U.S. Navy sailor', role: 'Pearl Harbor, 1941', skin: 'fair', age: 'young', expr: 'shock', hair: 'short', hairColor: '#3A2A1E', hat: 'sailor', outfit: 'sailor', color: '#1C2E48', look: .6 },
  tommy1914: { name: 'A British soldier', role: 'Flanders, Christmas 1914', skin: 'fair', age: 'young', expr: 'neutral', hair: 'short', hairColor: '#5A3A22', moustache: 'thin', hat: 'peaked', outfit: 'uniform', color: '#6B6446' },
  german1914: { name: 'A German soldier', role: 'Flanders, Christmas 1914', skin: 'fair', age: 'young', expr: 'neutral', hair: 'short', hairColor: '#8A6A3A', moustache: 'curled', hat: 'pickelhaube', outfit: 'uniform', color: '#6E6E5E' },
  puritanM: { name: 'A Puritan official', role: 'England, 1647', skin: 'fair', age: 'adult', expr: 'grim', hair: 'long', hairColor: '#2A1E16', hat: 'capotain', outfit: 'coat', color: '#1D1D22', collar: 'band' },
};
