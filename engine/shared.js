/* Shared History Pros canvas engine: palettes, map data, scene painters. */
const W=1280,H=720,TAU=Math.PI*2,HZ=450;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>{s=s*16807%2147483647;return(s-1)/2147483646;};}
function withA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
function ellipse(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function spacing(c,px){if('letterSpacing' in c)c.letterSpacing=px+'px';}
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function wrap(c,text,maxW){const ws=text.split(' ');const lines=[];let cur='';for(const w of ws){const test=cur?cur+' '+w:w;if(c.measureText(test).width>maxW&&cur){lines.push(cur);cur=w;}else cur=test;}if(cur)lines.push(cur);return lines;}
function runs(c,parts,cx,y){let total=0;parts.forEach(p=>{c.font=p.font;p.w=c.measureText(p.text).width;total+=p.w;});let x=cx-total/2;c.textAlign='left';parts.forEach(p=>{c.font=p.font;c.fillStyle=p.color;c.fillText(p.text,x,y);x+=p.w;});c.textAlign='center';}

/* ---------- map data (lon, lat) ---------- */
const LON0=-14,LAT1=61,KX=16.4,KY=24;
const proj=(lon,lat)=>[(lon-LON0)*KX,(LAT1-lat)*KY];
const LANDS=[
[[34.4,31.5],[34.75,32.1],[35,32.8],[35.5,33.9],[35.8,34.4],[35.9,35.5],[36.2,36.6],[35.5,36.6],[34.6,36.8],[33.5,36.2],[32,36.3],[30.6,36.8],[29.2,36.3],[28,36.8],[27.3,37.4],[27.2,38.3],[26.4,38.5],[26.8,39.2],[26.1,39.6],[26.3,40.2],[26.7,40.5],[26,40.8],[25,40.9],[24,40.8],[22.9,40.6],[22.6,40.1],[22.9,39.4],[23.3,39],[24,38.2],[23.1,37.4],[22.8,36.5],[21.7,36.8],[21.3,37.6],[21,38.8],[20.6,39.3],[20,39.7],[19.4,40.4],[19.5,41.8],[18.5,42.4],[17.4,43.1],[16,43.5],[15.2,44.2],[14.5,45.2],[13.7,45.6],[12.3,45.3],[12.3,44.5],[13.6,43.6],[14.8,42.1],[16,41.9],[17.1,41.1],[18.5,40.1],[17.3,40.5],[16.6,39.9],[17.1,39],[16.5,38.4],[16,37.95],[15.65,38.2],[15.8,38.8],[15.6,40],[14.9,40.3],[14.3,40.8],[13.6,41.2],[12.5,41.6],[11.2,42.4],[10.5,42.9],[10.2,43.9],[9,44.4],[8.2,43.9],[7.3,43.7],[6.6,43.2],[5.4,43.2],[4.6,43.4],[3.3,43.2],[3.2,42.1],[2.2,41.3],[0.9,41],[0,39.9],[-0.3,39.4],[0.2,38.8],[-0.6,38],[-0.9,37.6],[-2.1,36.7],[-3.4,36.7],[-4.5,36.7],[-5.3,36.2],[-5.6,36],[-6.3,36.5],[-7.4,37.2],[-8.8,37],[-8.8,38],[-9.5,38.7],[-8.8,40.2],[-8.8,42],[-9.3,43],[-8.2,43.6],[-6,43.6],[-3.8,43.5],[-1.8,43.4],[-1.2,44.7],[-1.2,46.2],[-2.2,47.2],[-3,47.6],[-4.7,48],[-4.6,48.6],[-3,48.8],[-1.6,48.6],[-1.6,49.65],[-1.1,49.4],[0.2,49.5],[1.2,50],[1.6,50.9],[2.5,51.1],[3.4,51.4],[4.2,52],[4.7,52.9],[5.2,53.4],[7,53.6],[8.3,53.6],[8.9,54],[8.6,55.5],[8.1,56.6],[8.6,57.1],[10.6,57.7],[10.3,56.6],[10.9,56.3],[9.8,55],[10.9,54.4],[11.9,54.1],[13.4,54.3],[14.2,53.9],[16,54.3],[18.5,54.8],[19.6,54.4],[21.1,55.2],[21,56.5],[21.6,57.4],[23,57],[24.1,57],[24.4,58.3],[23.5,58.6],[23.5,59.2],[25,59.5],[28,59.5],[29.9,59.9],[28.7,60.6],[27,60.5],[25,60.2],[23,59.9],[22.3,60.4],[21.4,61.2],[21.3,63.5],[22.5,64.3],[24.5,65.3],[25.5,66.5],[30,70],[40,68],[45,68.5],[55,68.8],[70,70],[70,10],[34.5,10]],
[[-14,10],[-14,28.6],[-9.8,29.9],[-9.6,31.5],[-8.5,33.3],[-6.8,34.1],[-6,35.5],[-5.4,35.9],[-4.4,35.2],[-2.9,35.3],[-1.3,35.3],[0.1,35.9],[1.9,36.6],[3.2,36.8],[5.1,36.7],[6.6,37.1],[8.6,36.9],[10.2,37.2],[11.1,36.9],[10.5,36.3],[11.1,35.2],[10.1,34.3],[10.7,33.8],[11.5,33.1],[13.2,32.9],[15.2,32.3],[15.8,31.4],[18.5,30.4],[20.1,31],[20.1,32.2],[21.6,32.9],[23.1,32.6],[25.1,31.7],[27.3,31.4],[29.9,31.3],[31,31.6],[32.3,31.3],[34.4,31.5],[34.5,10]],
[[5,63.5],[5,62],[5.2,61],[4.9,60.3],[5.4,59.3],[5.6,58.6],[6.7,58],[8,58.1],[9.4,58.9],[10.5,59.4],[10.8,59.9],[11.2,59.1],[11.8,58.3],[12,57.6],[12.6,56.6],[12.9,55.4],[14.2,55.4],[14.6,56],[15.9,56.1],[16.5,56.7],[16.6,57.8],[17,58.6],[18.3,59.3],[18.9,59.9],[17.3,60.7],[17.3,61.7],[17.6,62.5],[18.7,63.5],[21,64.6],[22.5,65.6],[25,65.9],[28,70.5],[24,71],[19,70],[15,68.5],[12,66.5],[8.5,63.8]],
[[-5.7,50.1],[-3,50.6],[1.4,51.2],[1.7,52.7],[0.3,53.5],[-0.3,54.5],[-1.6,55.6],[-2.1,57.2],[-1.8,57.6],[-4,57.7],[-3,58.6],[-5,58.6],[-6.2,56.8],[-5.6,55.3],[-4.8,54.8],[-3.2,54.2],[-3,53.4],[-4.6,53.3],[-4.2,52.3],[-5.2,51.7],[-3.1,51.4]],
[[-6,52.2],[-6.2,53.9],[-5.6,54.6],[-7.3,55.3],[-8.5,54.4],[-10,54.2],[-9.9,53.2],[-10.3,51.8],[-8,51.6]],
[[12.4,37.8],[13.3,38.2],[15.6,38.3],[15.1,37.3],[15.1,36.7],[14.3,37]],
[[8.4,39.1],[8.2,40.9],[9.2,41.2],[9.8,40.5],[9.6,39.2],[9,39]],
[[8.6,41.4],[8.6,42.4],[9.4,43],[9.5,42],[9.2,41.4]],
[[23.5,35.3],[26.3,35.2],[24.8,35]],
[[32.3,35.1],[34.6,35.7],[33.9,35],[32.4,34.7]],
[[2.3,39.6],[3.1,39.9],[3.4,39.6],[2.8,39.3]],
[[11.1,55.3],[12.1,55],[12.6,55.6],[12.3,56.1],[11.5,55.9],[10.9,55.7]]];
const WATERS=[
[[27.5,42.5],[28,43.5],[28.7,44.3],[29.7,45.3],[30.7,46.5],[31.8,46.6],[33,46],[32.6,45.4],[33.5,44.5],[35.4,45],[36.6,45.4],[37.7,46.6],[39.2,47.2],[38.3,46.2],[37.5,44.9],[39,44.2],[41.6,41.6],[40,41],[37,41.1],[35,42],[33.3,42],[31.3,41.2],[29.1,41.2],[28,41.6]],
[[46.8,44.7],[47.5,45.6],[49.2,46.4],[51.2,47],[53,46.7],[53,45.3],[51.3,44.5],[50.3,44.3],[51,43.2],[52.7,42],[52.8,41],[54,40.8],[53.9,39],[53.9,37.3],[51.5,36.8],[50,37.4],[49,38.1],[49.1,40],[49.6,40.5],[48.6,41.8],[47.5,42.9],[47.5,43.9]],
[[32.6,29.9],[33.6,27.8],[35.5,24],[38.5,19],[42,14.5],[43.4,12.6],[43.9,13.2],[42.2,16.5],[39.5,21],[37.2,25],[35,28],[34.9,29.5]],
[[47.9,30],[50.5,29.9],[53,27.3],[56.4,26.6],[56.2,24.8],[54,24.1],[51.5,24.5],[50.2,26],[49,27.5]]];
function toPath(polys){const p=new Path2D();for(const poly of polys){poly.forEach(([lo,la],i)=>{const[x,y]=proj(lo,la);i?p.lineTo(x,y):p.moveTo(x,y);});p.closePath();}return p;}
const LAND=toPath(LANDS),WATER=toPath(WATERS);
const CITIES=[
['Astrakhan',48.03,46.35,1345.9,0],['Kaffa',35.38,45.03,1346.7,1],['Constantinople',28.97,41.01,1347.5,1],['Messina',15.55,38.19,1347.8,1],
['Cyprus',33.36,35.17,1347.85,0],['Candia',25.13,35.34,1348.0,0],['Alexandria',29.92,31.3,1347.8,0],['Genoa',8.93,44.41,1347.92,1],['Marseille',5.37,43.3,1347.92,1],
['Venice',12.33,45.44,1348.0,1],['Pisa',10.4,43.72,1348.0,0],['Florence',11.25,43.77,1348.2,0],['Rome',12.5,41.9,1348.3,0],['Naples',14.27,40.85,1348.2,0],['Tunis',10.18,36.8,1348.2,0],
['Barcelona',2.17,41.39,1348.4,0],['Paris',2.35,48.86,1348.5,1],['Bordeaux',-0.58,44.84,1348.6,0],['Weymouth',-2.46,50.61,1348.5,0],['Lisbon',-9.14,38.72,1348.8,0],['Seville',-5.98,37.39,1348.9,0],
['London',-0.12,51.5,1348.8,1],['Dublin',-6.26,53.35,1348.6,0],['Budapest',19.04,47.5,1349.2,0],['Vienna',16.37,48.2,1349.3,1],['Cologne',6.96,50.94,1349.5,0],['Bergen',5.32,60.39,1349.6,1],
['Oslo',10.75,59.91,1349.7,0],['Edinburgh',-3.19,55.95,1349.8,0],['Lübeck',10.69,53.87,1350.2,0],['Stockholm',18.07,59.33,1350.3,0],['Pskov',28.33,57.82,1352.0,0],['Novgorod',31.27,58.52,1352.3,0],['Moscow',37.62,55.75,1353.2,1]];
const ROUTE=[[35.4,45.0],[32,43.5],[29,41.1],[27.5,40.7],[26.4,40.1],[25.3,38.5],[23.2,36.2],[19.5,37],[16.5,37.8],[15.55,38.19]];
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const fmtDate=d=>{const y=Math.floor(d);return MONTHS[clamp(Math.floor((d-y)*12),0,11)]+' '+y;};

/* ---------- palettes ---------- */
const PAL={
archive:{sky:['#5E4B3C','#C9955C','#EBCB8E'],sun:'#FFF1C9',cloud:'rgba(255,236,200,.28)',far:'#8C7054',land:'#5A4432',town:'#4A3829',sea:['#6E6A5A','#3A3A33'],shimmer:'rgba(255,230,180,.55)',ship:'#2B2119',sail:'#D9C4A0',flag:true,figure:'#2A1F17',quay:'#4B3A2C',quayLine:'#3A2C21',gloom:'30,18,10',fog:'235,220,190',
  micro:{bg0:'#E9D9B8',bg1:'#B8996A',cell:'#8A4A33',edge:'#3A1E14',rim:'#1C140E',label:'#EAD7B0'},
  map:{sea:'#CDB892',land:'#E8D8B4',coast:'#6B5337',grid:'rgba(107,83,55,.25)',label:'#3B2A1A',spread:'139,30,20',route:'#6B1F14',font:"'EB Garamond', Georgia, serif"}},
atlas:{sky:['#5E4B3C','#C9955C','#EBCB8E'],sun:'#FFF1C9',cloud:'rgba(255,236,200,.28)',far:'#8C7054',land:'#5A4432',town:'#4A3829',sea:['#6E6A5A','#3A3A33'],shimmer:'rgba(255,230,180,.5)',ship:'#2B2119',sail:'#D9C4A0',flag:true,figure:'#2A1F17',quay:'#4B3A2C',quayLine:'#3A2C21',gloom:'30,18,10',fog:'235,220,190',
  micro:{bg0:'#EDE3CC',bg1:'#C9B894',cell:'#8E2F22',edge:'#4A1710',rim:'#26302F',label:'#EDE3CC'},
  map:{sea:'#AFC3C2',land:'#EDE3CC',coast:'#4F5D5C',grid:'rgba(38,48,47,.22)',label:'#26302F',spread:'176,42,30',route:'#26302F',font:"'EB Garamond', Georgia, serif"}},
noir:{sky:['#07090B','#1A2026','#3A434A'],sun:'#C9D3DA',cloud:'rgba(200,210,220,.08)',far:'#1B2127',land:'#0E1215',town:'#0A0D0F',sea:['#1E252B','#07090B'],shimmer:'rgba(200,215,230,.35)',ship:'#040506',sail:'#1D2328',flag:false,figure:'#030405',quay:'#0B0E10',quayLine:'#151A1E',gloom:'0,0,0',fog:'160,170,180',
  micro:{bg0:'#3A1210',bg1:'#0A0405',cell:'#C2352B',edge:'#5E0F0B',rim:'#000000',label:'#C9D0D6'},
  map:{sea:'#0A0D10',land:'#1C2228',coast:'#3D4852',grid:'rgba(120,130,140,.12)',label:'#C9D0D6',spread:'210,45,35',route:'#E0463A',font:"Oswald, 'Arial Narrow', sans-serif"}},
candle:{sky:['#141733','#3B2F5C','#9C6B6E'],sun:'#F7D8B0',cloud:'rgba(220,200,230,.10)',far:'#2D2A48',land:'#1C1B33',town:'#16152A',windows:'#F2C27A',sea:['#2A2D52','#0E1027'],shimmer:'rgba(247,216,176,.4)',ship:'#0F0F22',sail:'#3A3558',flag:false,figure:'#0D0D1E',quay:'#1A1930',quayLine:'#24233F',gloom:'8,8,24',fog:'200,190,230',
  micro:{bg0:'#3A3560',bg1:'#12112A',cell:'#E6B98A',edge:'#8A5E3F',rim:'#07071A',label:'#EFE3CF'},
  map:{sea:'#171A38',land:'#2B2A4E',coast:'#6D6699',grid:'rgba(180,170,230,.10)',label:'#E8DCC8',spread:'242,194,122',route:'#F2C27A',font:"Lora, Georgia, serif"}},
explainer:{sky:['#8EC5E0','#BFE0EE','#E8F4F7'],sun:'#FFD166',cloud:'rgba(255,255,255,.85)',far:'#9CC7A4',land:'#5E9E6E',town:'#F1DDB6',roof:'#D1603D',sea:['#3A8FB7','#1F5F86'],shimmer:'rgba(255,255,255,.6)',ship:'#6B4226',sail:'#FFFFFF',flag:true,figure:'#2B3A55',quay:'#B08D63',quayLine:'#96734C',gloom:'31,58,77',fog:'255,255,255',
  micro:{bg0:'#FFFFFF',bg1:'#DDEBF2',cell:'#E4572E',edge:'#9E2E14',rim:'#1F3A4D',label:'#FFFFFF'},
  map:{sea:'#BFE0EE',land:'#FFFFFF',coast:'#7FA7BD',grid:'rgba(31,58,77,.08)',label:'#1F3A4D',spread:'228,87,46',route:'#1F3A4D',font:"Archivo, Arial, sans-serif"}}
};

/* ---------- scene painters ---------- */
function sky(c,P,gloom,t,sunColor){
  const g=c.createLinearGradient(0,0,0,HZ);g.addColorStop(0,P.sky[0]);g.addColorStop(.62,P.sky[1]);g.addColorStop(1,P.sky[2]);
  c.fillStyle=g;c.fillRect(-300,-300,W+600,HZ+300);
  const sx=860,sy=HZ-70,sc=sunColor||P.sun;
  const gl=c.createRadialGradient(sx,sy,10,sx,sy,360);gl.addColorStop(0,withA(sc,.5*(1-gloom*.6)));gl.addColorStop(1,withA(sc,0));
  c.fillStyle=gl;c.fillRect(-300,-300,W+600,HZ+300);
  c.fillStyle=withA(sc,1-gloom*.55);c.beginPath();c.arc(sx,sy,38,0,TAU);c.fill();
  const r=rng(7);c.fillStyle=P.cloud;
  for(let i=0;i<9;i++){const y=50+r()*300,w=180+r()*420,x=((r()*1700+t*(5+r()*9))%1900)-320;ellipse(c,x,y,w,9+r()*16);}
  if(gloom>0){c.fillStyle=`rgba(${P.gloom},${gloom*.55})`;c.fillRect(-300,-300,W+600,HZ+300);}
}
function sea(c,P,t,gloom){
  const g=c.createLinearGradient(0,HZ,0,H);g.addColorStop(0,P.sea[0]);g.addColorStop(1,P.sea[1]);
  c.fillStyle=g;c.fillRect(-300,HZ,W+600,H-HZ+300);
  const r=rng(3);c.strokeStyle=P.shimmer;c.lineWidth=2;
  for(let i=0;i<80;i++){const y=HZ+5+Math.pow(r(),1.6)*(H-HZ+80),x=r()*W*1.3-150+Math.sin(t*.8+i)*10,len=10+(y-HZ)*.16*r();
    c.globalAlpha=(1-gloom*.7)*(.25+.75*Math.exp(-Math.pow((x-860)/240,2)));c.beginPath();c.moveTo(x,y);c.lineTo(x+len,y);c.stroke();}
  c.globalAlpha=1;
  if(gloom>0){c.fillStyle=`rgba(${P.gloom},${gloom*.5})`;c.fillRect(-300,HZ,W+600,H);}
}
function coast(c,P,t,gloom){
  c.fillStyle=P.far;c.beginPath();c.moveTo(600,HZ);c.bezierCurveTo(760,HZ-40,860,HZ-95,1000,HZ-100);c.bezierCurveTo(1120,HZ-104,1260,HZ-70,1600,HZ-60);c.lineTo(1600,HZ);c.closePath();c.fill();
  const r=rng(11);
  for(let i=0;i<36;i++){const x=870+r()*420,h=12+r()*34,w=10+r()*18,base=HZ-6-Math.max(0,Math.min(60,(x-870)*.35))*.5;
    c.fillStyle=P.town;c.fillRect(x,base-h,w,h+8);
    if(P.roof){c.fillStyle=P.roof;c.beginPath();c.moveTo(x-2,base-h);c.lineTo(x+w/2,base-h-9);c.lineTo(x+w+2,base-h);c.fill();}
    if(P.windows&&r()<.7){c.fillStyle=P.windows;c.globalAlpha=.55+.35*Math.sin(t*1.7+i*2.1);c.fillRect(x+w*.4,base-h*.6,3,4);c.globalAlpha=1;}}
  c.fillStyle=P.town;c.fillRect(1010,HZ-100,16,90);c.beginPath();c.moveTo(1005,HZ-100);c.lineTo(1018,HZ-132);c.lineTo(1031,HZ-100);c.fill();
  c.beginPath();c.arc(1140,HZ-46,22,Math.PI,0);c.fill();c.fillRect(1118,HZ-46,44,36);
  c.fillStyle=P.land;c.beginPath();c.moveTo(780,HZ+2);c.bezierCurveTo(900,HZ-12,1100,HZ-16,1600,HZ-10);c.lineTo(1600,HZ+16);c.lineTo(780,HZ+8);c.fill();
  if(gloom>0){c.fillStyle=`rgba(${P.gloom},${gloom*.5})`;c.fillRect(580,HZ-140,1100,160);}
}
function cog(c,P,x,y,s,t,o={}){
  c.save();c.translate(x,y+Math.sin(t*1.3+x*.01)*2*s);c.rotate(Math.sin(t*1.1+x*.02)*.015);c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.2)';ellipse(c,0,30,112,8);
  c.fillStyle=P.ship;c.beginPath();c.moveTo(-100,-22);c.lineTo(100,-22);c.quadraticCurveTo(104,8,70,26);c.lineTo(-72,26);c.quadraticCurveTo(-106,6,-100,-22);c.fill();
  c.fillRect(-104,-46,44,26);c.fillRect(62,-40,40,20);c.fillRect(-3,-215,6,195);c.fillRect(-78,-200,156,5);
  if(P.roof){c.fillStyle=P.roof;c.fillRect(-100,-12,200,7);}
  c.fillStyle=o.sail||P.sail;const b=o.limp?5:22;
  c.beginPath();c.moveTo(-70,-196);c.lineTo(70,-196);c.quadraticCurveTo(70+b,-128,64,-62);c.lineTo(-64,-62);c.quadraticCurveTo(-70-b,-128,-70,-196);c.fill();
  if(P.flag){c.fillStyle='#F4F1EA';c.fillRect(3,-237,34,21);c.fillStyle='#B3261E';c.fillRect(17,-237,6,21);c.fillRect(3,-229,34,5);}
  else{c.fillStyle=P.ship;c.beginPath();c.moveTo(3,-237);c.lineTo(36,-229);c.lineTo(3,-221);c.fill();}
  c.restore();
}
function quay(c,P,t){
  c.fillStyle=P.quay;c.fillRect(-300,612,W+600,200);
  c.strokeStyle=P.quayLine;c.lineWidth=2;
  for(let row=0;row<4;row++){const y=612+row*28;c.beginPath();c.moveTo(-300,y);c.lineTo(W+300,y);c.stroke();
    for(let x=-300+(row%2)*40;x<W+300;x+=80){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+28);c.stroke();}}
  c.fillStyle=P.quayLine;c.fillRect(1020,560,70,56);c.fillRect(1100,578,48,38);c.fillRect(160,570,60,46);
  c.beginPath();c.ellipse(1180,592,22,26,0,0,TAU);c.fill();
}
function crowd(c,P,t){
  const r=rng(21);c.fillStyle=P.figure;
  for(let i=0;i<13;i++){const x=90+i*88+r()*30,h=74+r()*26,y=668,bob=Math.sin(t*1.4+i)*1.6;
    c.beginPath();c.arc(x,y-h+bob,11,0,TAU);c.fill();
    c.beginPath();c.moveTo(x-14,y-h+14+bob);c.lineTo(x+14,y-h+14+bob);c.lineTo(x+23,y+12);c.lineTo(x-23,y+12);c.fill();
    if(r()<.45){c.beginPath();c.moveTo(x-12,y-h+3+bob);c.lineTo(x,y-h-19+bob);c.lineTo(x+12,y-h+3+bob);c.fill();}}
}
function fog(c,P,t,amt){const r=rng(9);for(let i=0;i<8;i++){const y=340+r()*300,x=((r()*1600+t*(14+r()*12))%2000)-400;c.fillStyle=`rgba(${P.fog},${amt*(.10+r()*.1)})`;ellipse(c,x,y,380+r()*300,26+r()*30);}}
function ravens(c,P,t,cx,cy){c.strokeStyle=P.figure;c.lineWidth=3.2;c.lineCap='round';for(let i=0;i<6;i++){const a=t*.55+i*1.05,rr=80+i*20,x=cx+Math.cos(a)*rr*1.5,y=cy+Math.sin(a)*rr*.45,f=Math.sin(t*9+i)*7;
  c.beginPath();c.moveTo(x-13,y-f);c.quadraticCurveTo(x-5,y-2,x,y+2);c.quadraticCurveTo(x+5,y-2,x+13,y-f);c.stroke();}}
function micro(c,st,t,cx=W/2,cy=H/2,R=300,annot=true){
  const M=st.P.micro;c.fillStyle=M.rim;c.fillRect(-300,-300,W+600,H+600);
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();
  const g=c.createRadialGradient(cx,cy,20,cx,cy,R);g.addColorStop(0,M.bg0);g.addColorStop(1,M.bg1);c.fillStyle=g;c.fillRect(cx-R,cy-R,2*R,2*R);
  const r=rng(5);
  for(let i=0;i<48;i++){const x=cx+(r()-.5)*2*R+Math.sin(t*.3+i)*9,y=cy+(r()-.5)*2*R+Math.cos(t*.25+i)*9,a=r()*Math.PI+t*.06*(r()-.5),L=28+r()*16;
    c.save();c.translate(x,y);c.rotate(a);rrect(c,-L/2,-7,L,14,7);c.fillStyle=M.cell;c.fill();c.lineWidth=1.5;c.strokeStyle=M.edge;c.stroke();
    c.fillStyle=M.edge;c.beginPath();c.arc(-L/2+7,0,4.2,0,TAU);c.arc(L/2-7,0,4.2,0,TAU);c.fill();c.restore();}
  const v=c.createRadialGradient(cx,cy,R*.55,cx,cy,R);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=v;c.fillRect(cx-R,cy-R,2*R,2*R);
  c.restore();
  if(!annot)return;
  const lx=cx+R+36;c.strokeStyle=M.label;c.globalAlpha=.7;c.lineWidth=1.2;c.beginPath();c.moveTo(cx+R*.72,cy-R*.35);c.lineTo(lx-8,cy-50);c.lineTo(lx+230,cy-50);c.stroke();c.globalAlpha=1;
  c.fillStyle=M.label;c.textAlign='left';c.textBaseline='alphabetic';
  c.font=`italic 500 30px ${st.P.map.font}`;c.fillText('Yersinia pestis',lx,cy-62);
  c.font=`400 19px ${st.P.map.font}`;c.globalAlpha=.8;c.fillText('The bacterium behind the plague.',lx,cy-18);c.fillText('Magnified about 1,000×.',lx,cy+10);c.globalAlpha=1;
}
let camInfo={lat:45,z:1};
function drawMap(c,st,date,o={}){
  const M=st.P.map,z=o.z||1;
  c.fillStyle=M.sea;c.fillRect(-2000,-2000,6000,6000);
  c.strokeStyle=M.grid;c.lineWidth=1/z;
  for(let lo=-10;lo<=70;lo+=10){const[x]=proj(lo,0);c.beginPath();c.moveTo(x,-400);c.lineTo(x,1200);c.stroke();}
  for(let la=30;la<=70;la+=10){const[,y]=proj(0,la);c.beginPath();c.moveTo(-400,y);c.lineTo(1800,y);c.stroke();}
  c.fillStyle=M.land;c.fill(LAND);c.fillStyle=M.sea;c.fill(WATER);
  if(date>0){c.save();c.clip(LAND);
    for(const[,lo,la,d] of CITIES){if(d>date)continue;const age=date-d,rad=Math.min(170,18+age*120),[x,y]=proj(lo,la);
      const g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(${M.spread},.62)`);g.addColorStop(1,`rgba(${M.spread},0)`);c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
    c.restore();c.fillStyle=M.sea;c.fill(WATER);}
  c.strokeStyle=M.coast;c.lineWidth=1.5/z;c.lineJoin='round';c.stroke(LAND);c.stroke(WATER);
  if(o.route!=null){const pts=ROUTE.map(p=>proj(p[0],p[1]));let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);tot+=d;}
    let left=tot*o.route;c.strokeStyle=M.route;c.lineWidth=2.6/z;c.setLineDash([8/z,6/z]);c.beginPath();c.moveTo(...pts[0]);let head=pts[0];
    for(let i=1;i<pts.length&&left>0;i++){const f=Math.min(1,left/seg[i-1]);head=[lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f)];c.lineTo(...head);left-=seg[i-1];}
    c.stroke();c.setLineDash([]);
    if(o.route<1){c.fillStyle=M.route;c.save();c.translate(...head);c.scale(1/z,1/z);c.beginPath();c.moveTo(-9,0);c.lineTo(9,0);c.lineTo(5,6);c.lineTo(-5,6);c.fill();c.fillRect(-1,-14,2,14);c.beginPath();c.moveTo(1,-14);c.lineTo(9,-4);c.lineTo(1,-4);c.fill();c.restore();}}
  c.textBaseline='middle';
  for(const[name,lo,la,d,major] of CITIES){const[x,y]=proj(lo,la),hit=date>=d;
    if(!major&&!hit)continue;
    c.fillStyle=hit?`rgb(${M.spread})`:M.label;c.beginPath();c.arc(x,y,(hit?4.2:3.2)/z,0,TAU);c.fill();
    if(hit&&date-d<.3){c.strokeStyle=`rgba(${M.spread},${1-(date-d)/.3})`;c.lineWidth=2/z;c.beginPath();c.arc(x,y,(6+(date-d)*80)/z,0,TAU);c.stroke();}
    if(major||o.allLabels){c.fillStyle=M.label;c.font=`500 ${17/z}px ${M.font}`;c.textAlign='left';c.fillText(name,x+8/z,y-1/z);}}
  if(o.pulse){const[x,y]=proj(15.55,38.19),p=(o.pulseT%1.6)/1.6;c.strokeStyle=`rgba(${M.spread},${1-p})`;c.lineWidth=3/z;c.beginPath();c.arc(x,y,(8+p*40)/z,0,TAU);c.stroke();}
}
function mapCam(c,lon,lat,z){const[x,y]=proj(lon,lat);c.translate(W/2,H/2);c.scale(z,z);c.translate(-x,-y);camInfo={lat,z};}
function camKB(c,st,lp,px,py){const z=1+st.zoom*ease(lp);c.translate(W/2,H/2);c.scale(z,z);c.translate(-W/2+px*ease(lp),-H/2+py*ease(lp));}

const SHIPS=[{x0:-300,x1:420,y:478,s:.32},{x0:-200,x1:610,y:490,s:.42},{x0:-420,x1:250,y:505,s:.55},{x0:-260,x1:520,y:545,s:.78},{x0:-520,x1:150,y:600,s:1.05}];
const SCENES={
  arrive(c,st,lp,ls,t){camKB(c,st,lp,-20,-10);const P=st.P;sky(c,P,0,t);coast(c,P,t,0);sea(c,P,t,0);
    for(const s of SHIPS)cog(c,P,lerp(s.x0,s.x1,easeOut(clamp(lp*1.1))),s.y,s.s,t);},
  dock(c,st,lp,ls,t){camKB(c,st,lp,30,0);const P=st.P;sky(c,P,.1,t);coast(c,P,t,.1);sea(c,P,t,.1);
    cog(c,P,930,530,.55,t);cog(c,P,660,565,.8,t);cog(c,P,340,600,1.0,t);quay(c,P,t);crowd(c,P,t);},
  ship(c,st,lp,ls,t,g=.45,dead=false){camKB(c,st,lp,-30,-20);const P=st.P;sky(c,P,g,t);coast(c,P,t,g);sea(c,P,t,g);
    cog(c,P,620,610,1.6,t,{limp:true});fog(c,P,t,dead?1:.7);if(dead)ravens(c,P,t,620,610-215*1.6+10);},
  micro(c,st,lp,ls,t){const z=1+st.zoom*.6*ease(lp);c.translate(W/2,H/2);c.scale(z,z);c.translate(-W/2,-H/2);micro(c,st,t,st.key==='explainer'?470:W/2-120);},
  map(c,st,lp,ls,t){const zc=ease(clamp(lp/.3));mapCam(c,lerp(15,23,zc),lerp(40,46.5,zc),lerp(2,1,zc));drawMap(c,st,lerp(1347.75,1353.3,ease(clamp(lp*1.08))),{z:lerp(2,1,zc)});}
};
const SHOT_LIST=[null,'arrive','dock','ship','dead','micro','map',null];
function defaultShot(c,st,k,lp,ls,t){
  if(k===0)return st.card(c,st,'chapter',lp,ls,t);
  if(k===7)return st.card(c,st,'title',lp,ls,t);
  const n=SHOT_LIST[k];
  if(n==='dead')return SCENES.ship(c,st,lp,ls,t,.72,true);
  return SCENES[n](c,st,lp,ls,t);
}

/* ---------- cards ---------- */
function cardArchive(c,st,kind,lp,ls,t){
  const g=c.createRadialGradient(W/2,H/2,40,W/2,H/2,820);g.addColorStop(0,'#3A2A1C');g.addColorStop(1,'#120B07');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.globalAlpha=clamp(ls/.9);c.textAlign='center';c.textBaseline='middle';
  const acc='#B8893F',ink='#EAD7B0';
  if(kind==='chapter'){c.fillStyle=acc;c.font="600 22px Cinzel, Georgia, serif";spacing(c,7);c.fillText('CHAPTER I',W/2,H/2-92);spacing(c,0);
    c.strokeStyle=acc;c.lineWidth=1;c.beginPath();c.moveTo(W/2-260,H/2-92);c.lineTo(W/2-120,H/2-92);c.moveTo(W/2+120,H/2-92);c.lineTo(W/2+260,H/2-92);c.stroke();
    c.fillStyle=ink;c.font="italic 500 76px 'EB Garamond', Georgia, serif";c.fillText('The Ships of Messina',W/2,H/2);
    c.font="400 25px 'EB Garamond', Georgia, serif";c.globalAlpha*=.75;c.fillText('Sicily · October 1347',W/2,H/2+74);}
  else{const s=1+.04*lp;c.translate(W/2,H/2);c.scale(s,s);c.translate(-W/2,-H/2);
    c.fillStyle=ink;c.font="700 104px Cinzel, Georgia, serif";spacing(c,6);c.fillText('THE BLACK DEATH',W/2,H/2-10);spacing(c,0);
    c.fillStyle=acc;c.font="500 28px 'EB Garamond', Georgia, serif";spacing(c,4);c.fillText('1346 – 1353',W/2,H/2+72);spacing(c,0);}
  c.globalAlpha=1;
}
function cardNoir(c,st,kind,lp,ls,t){
  c.fillStyle='#000';c.fillRect(0,0,W,H);c.textAlign='center';c.textBaseline='middle';const red='#D2362A';
  if(kind==='chapter'){const a=clamp(ls/.4);c.globalAlpha=a;c.fillStyle=red;c.font="500 24px Oswald, 'Arial Narrow', sans-serif";spacing(c,10);c.fillText('PART ONE',W/2,H/2-104);spacing(c,0);
    const s=lerp(1.12,1,easeOut(clamp(ls/1.4)));c.save();c.translate(W/2,H/2);c.scale(s,s);c.fillStyle='#F2F2F2';c.font="700 132px Oswald, 'Arial Narrow', sans-serif";c.fillText('MESSINA, 1347',0,0);c.restore();
    c.fillStyle=red;const w=440*easeOut(clamp((ls-.4)/.8));c.fillRect(W/2-w/2,H/2+86,w,4);c.globalAlpha=1;}
  else{const a=clamp(ls/.25);c.globalAlpha=a;const s=lerp(1.25,1,easeOut(clamp(ls/.5)));c.save();c.translate(W/2,H/2);c.scale(s,s);c.translate(-W/2,-H/2);
    c.font="500 34px Oswald, 'Arial Narrow', sans-serif";c.fillStyle='#BFC5CA';spacing(c,14);c.fillText('THE',W/2,H/2-110);spacing(c,0);
    runs(c,[{text:'BLACK ',font:"700 170px Oswald, 'Arial Narrow', sans-serif",color:red},{text:'DEATH',font:"700 170px Oswald, 'Arial Narrow', sans-serif",color:'#F2F2F2'}],W/2,H/2+20);c.restore();c.globalAlpha=1;}
}
function stars(c,t,n=90){const r=rng(31);for(let i=0;i<n;i++){const x=r()*W,y=r()*H*.62,s=r()*1.6+.4;c.fillStyle=`rgba(255,244,220,${.25+.5*Math.abs(Math.sin(t*.6+i))*r()})`;c.fillRect(x,y,s,s);}}
function cardCandle(c,st,kind,lp,ls,t){
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0E0F24');g.addColorStop(1,'#2A2346');c.fillStyle=g;c.fillRect(0,0,W,H);stars(c,t);
  c.globalAlpha=clamp(ls/1.6);c.textAlign='center';c.textBaseline='middle';
  if(kind==='chapter'){c.fillStyle='#F2C27A';c.font="italic 400 28px Lora, Georgia, serif";c.fillText('Chapter One',W/2,H/2-70);
    c.fillStyle='#EFE3CF';c.font="italic 500 60px Lora, Georgia, serif";c.fillText('The Ships That Came at Dusk',W/2,H/2+4);}
  else{c.fillStyle='#EFE3CF';c.font="italic 500 88px Lora, Georgia, serif";c.fillText('The Black Death',W/2,H/2-14);
    c.fillStyle='#F2C27A';c.font="italic 400 28px Lora, Georgia, serif";c.fillText('a slow history for sleep',W/2,H/2+62);}
  c.globalAlpha=1;
}
function cardExplainer(c,st,kind,lp,ls,t){
  c.fillStyle='#1F3A4D';c.fillRect(0,0,W,H);
  c.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<14;i++){c.beginPath();c.arc(1040+Math.cos(i)*140,360+Math.sin(i*1.7)*180,40+i*6,0,TAU);c.fill();}
  const off=(1-easeOut(clamp(ls/.6)))*-70;c.globalAlpha=clamp(ls/.35);c.textAlign='left';c.textBaseline='alphabetic';
  if(kind==='chapter'){c.fillStyle='#FFD166';rrect(c,120+off,210,112,40,20);c.fill();c.fillStyle='#1F3A4D';c.font="800 20px Archivo, Arial, sans-serif";spacing(c,2);c.fillText('PART 1',140+off,237);spacing(c,0);
    c.fillStyle='#FFFFFF';c.font="800 70px Archivo, Arial, sans-serif";c.fillText('How the plague',120+off,340);c.fillText('reached Europe',120+off,420);
    c.fillStyle='#FFD166';c.fillRect(120+off,450,180*easeOut(clamp((ls-.3)/.6)),8);}
  else{c.fillStyle='#FFFFFF';c.font="900 118px Archivo, Arial, sans-serif";c.fillText('THE BLACK',120+off,330);c.fillText('DEATH',120+off,450);
    c.fillStyle='#FFD166';c.fillRect(120+off,480,420*easeOut(clamp((ls-.2)/.6)),10);
    c.fillStyle='#DDEBF2';c.font="600 30px Archivo, Arial, sans-serif";c.fillText('1346–1353  ·  25–50 million dead in Europe',120+off,545);}
  c.globalAlpha=1;
}
function cartouche(c,title,sub,a){c.globalAlpha=a;c.fillStyle='rgba(237,227,204,.94)';c.fillRect(W/2-330,H/2-92,660,184);c.strokeStyle='#26302F';c.lineWidth=2;c.strokeRect(W/2-318,H/2-80,636,160);c.lineWidth=1;c.strokeRect(W/2-310,H/2-72,620,144);
  c.fillStyle='#26302F';c.textAlign='center';c.textBaseline='middle';c.font="italic 500 60px 'EB Garamond', Georgia, serif";c.fillText(title,W/2,H/2-12);c.font="500 20px 'EB Garamond', Georgia, serif";spacing(c,3);c.fillText(sub,W/2,H/2+46);spacing(c,0);c.globalAlpha=1;}
function cardAtlas(c,st,kind,lp,ls,t){
  if(kind==='chapter'){c.save();mapCam(c,24,44,1.15+.08*lp);drawMap(c,st,1346.0,{z:1.2});c.restore();cartouche(c,'The Road to Messina','PLATE I  ·  1346 – 1347',clamp(ls/.9));}
  else{c.save();mapCam(c,23,46.5,1);drawMap(c,st,1353.3,{z:1});c.restore();c.fillStyle='rgba(237,227,204,.25)';c.fillRect(0,0,W,H);cartouche(c,'The Black Death','1346 – 1353  ·  APPROXIMATE SPREAD',clamp(ls/.9));}
}

/* ---------- atlas shots (map-driven) ---------- */
function calloutMap(c,st,text,sub,a){c.globalAlpha=a;c.fillStyle='rgba(237,227,204,.95)';c.strokeStyle='#26302F';c.lineWidth=1.5;c.fillRect(80,90,380,96);c.strokeRect(86,96,368,84);
  c.fillStyle='#26302F';c.textAlign='left';c.textBaseline='alphabetic';c.font="italic 500 32px 'EB Garamond', Georgia, serif";c.fillText(text,106,136);c.font="400 19px 'EB Garamond', Georgia, serif";c.fillText(sub,106,164);c.globalAlpha=1;}
const ATLAS_SHOTS={
  1(c,st,lp,ls,t){const e=ease(lp);c.save();mapCam(c,lerp(27,19,e),lerp(42,39.5,e),lerp(1.8,2.3,e));drawMap(c,st,1347.5,{z:lerp(1.8,2.3,e),route:clamp(lp*1.15)});c.restore();calloutMap(c,st,'From Kaffa to Sicily','Genoese galleys, autumn 1347',clamp((ls-.4)/.6));},
  2(c,st,lp,ls,t){const e=ease(lp);const z=lerp(2.6,3.4,e);c.save();mapCam(c,15.4,38.6,z);drawMap(c,st,1347.7,{z,route:1,pulse:true,pulseT:ls,allLabels:true});c.restore();calloutMap(c,st,'Messina, Sicily','A busy port on the strait',clamp(ls/.6));},
  3(c,st,lp,ls,t){const z=lerp(3.4,3.7,lp);c.save();mapCam(c,15.4,38.6,z);drawMap(c,st,1347.8+lp*.03,{z,route:1,pulse:true,pulseT:ls,allLabels:true});c.restore();calloutMap(c,st,'Twelve galleys','Arrived October 1347',clamp(ls/.6));},
  4(c,st,lp,ls,t){const z=lerp(3.7,3.9,lp);c.save();mapCam(c,15.4,38.6,z);drawMap(c,st,1347.83+lp*.05,{z,route:1,pulse:true,pulseT:ls,allLabels:true});c.restore();calloutMap(c,st,'The crews','Most already dead',clamp(ls/.6));},
  6(c,st,lp,ls,t){SCENES.map(c,st,lp,ls,t);}
};

/* ---------- captions ---------- */
function capAlpha(si,t){const T=TL()[si];return clamp((t-(T[0]-.05))/.2)*clamp((T[1]+.35-t)/.2);}
const KEY=new Set(['dead','terrible','black','third','half','death','disease','blood','forever']);
const CAPTIONS={
  lowerThird(c,si,t){c.font="500 32px 'EB Garamond', Georgia, serif";const lines=wrap(c,SENT[si],960),lh=40,bh=lines.length*lh+36;
    const g=c.createLinearGradient(0,H-bh-40,0,H);g.addColorStop(0,'rgba(18,11,6,0)');g.addColorStop(.35,'rgba(18,11,6,.7)');g.addColorStop(1,'rgba(18,11,6,.85)');
    c.globalAlpha=capAlpha(si,t);c.fillStyle=g;c.fillRect(0,H-bh-40,W,bh+40);c.fillStyle='#F3E6C8';c.textAlign='center';c.textBaseline='middle';
    lines.forEach((l,i)=>c.fillText(l,W/2,H-bh+18+i*lh));c.globalAlpha=1;},
  subtitle(c,si,t){c.font="600 30px Archivo, Arial, sans-serif";const lines=wrap(c,SENT[si],980);c.globalAlpha=capAlpha(si,t);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
    lines.forEach((l,i)=>{const y=H-44-(lines.length-1-i)*40;c.strokeStyle='rgba(0,0,0,.85)';c.lineWidth=6;c.strokeText(l,W/2,y);c.fillStyle='#FFFFFF';c.fillText(l,W/2,y);});c.globalAlpha=1;},
  kinetic(c,si,t){const ws=wordsOf(si);const chunks=[];let cur=[];ws.forEach((w,i)=>{cur.push(w);if(cur.length>=4||/[,.]$/.test(w.w)||i===ws.length-1){chunks.push(cur);cur=[];}});
    let ch=chunks[0];for(const k of chunks)if(k[0].a<=t)ch=k;
    c.font="700 64px Oswald, 'Arial Narrow', sans-serif";c.textBaseline='middle';c.textAlign='left';
    const txt=ch.map(w=>w.w.toUpperCase());const sp=18;const widths=txt.map(x=>c.measureText(x).width);const total=widths.reduce((a,b)=>a+b,0)+sp*(txt.length-1);
    let x=W/2-total/2;const y=H-172;c.shadowColor='rgba(0,0,0,.9)';c.shadowBlur=18;
    ch.forEach((w,i)=>{if(w.a<=t+.02){const p=clamp((t-w.a)/.14),s=1+.22*(1-easeOut(p));const key=KEY.has(w.w.toLowerCase().replace(/[^a-z]/g,''));
      c.save();c.translate(x+widths[i]/2,y);c.scale(s,s);c.fillStyle=key?'#E0463A':'#F2F2F2';c.fillText(txt[i],-widths[i]/2,0);c.restore();}x+=widths[i]+sp;});
    c.shadowBlur=0;},
  soft(c,si,t){c.font="italic 400 27px Lora, Georgia, serif";const lines=wrap(c,SENT[si],900);c.globalAlpha=capAlpha(si,t)*.82;c.fillStyle='#EFE3CF';c.textAlign='center';c.textBaseline='middle';c.shadowColor='rgba(0,0,0,.8)';c.shadowBlur=14;
    lines.forEach((l,i)=>c.fillText(l,W/2,H-60-(lines.length-1-i)*36));c.shadowBlur=0;c.globalAlpha=1;},
  karaoke(c,si,t){const ws=wordsOf(si);c.font="800 32px Archivo, Arial, sans-serif";c.textBaseline='middle';c.textAlign='left';
    const lines=[];let line=[],lw=0;const spw=c.measureText(' ').width;
    ws.forEach(w=>{const ww=c.measureText(w.w).width;if(lw+ww>920&&line.length){lines.push({line,lw});line=[];lw=0;}line.push({...w,ww});lw+=ww+spw;});lines.push({line,lw});
    const lh=46,bh=lines.length*lh+22,bw=Math.max(...lines.map(l=>l.lw))+40,by=H-bh-26;
    c.globalAlpha=capAlpha(si,t);c.fillStyle='rgba(31,58,77,.92)';rrect(c,W/2-bw/2,by,bw,bh,14);c.fill();
    lines.forEach((L,li)=>{let x=W/2-L.lw/2+spw/2;const y=by+11+lh/2+li*lh;L.line.forEach(w=>{const on=t>=w.a&&t<w.b+.05;if(on){c.fillStyle='#FFD166';rrect(c,x-6,y-21,w.ww+12,42,8);c.fill();}c.fillStyle=on?'#1F3A4D':(t>=w.a?'#FFFFFF':'rgba(255,255,255,.62)');c.fillText(w.w,x,y+1);x+=w.ww+spw;});});
    c.globalAlpha=1;}
};

/* ---------- textures ---------- */
const noise=document.createElement('canvas');noise.width=noise.height=256;{const n=noise.getContext('2d'),d=n.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}n.putImageData(d,0,0);}
const paper=document.createElement('canvas');paper.width=W;paper.height=H;{const p=paper.getContext('2d');p.fillStyle='#fff';p.fillRect(0,0,W,H);const r=rng(77);p.strokeStyle='rgba(120,90,50,.18)';for(let i=0;i<900;i++){const x=r()*W,y=r()*H,a=r()*TAU,l=4+r()*18;p.lineWidth=.6+r();p.beginPath();p.moveTo(x,y);p.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);p.stroke();}
  for(let i=0;i<40;i++){const x=r()*W,y=r()*H,rad=40+r()*160;const g=p.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'rgba(150,110,60,.10)');g.addColorStop(1,'rgba(150,110,60,0)');p.fillStyle=g;p.fillRect(x-rad,y-rad,rad*2,rad*2);}}
function grain(c,amt,t){if(!amt)return;c.save();c.globalAlpha=amt;c.globalCompositeOperation='overlay';const pat=c.createPattern(noise,'repeat');const ox=Math.floor(Math.random()*256),oy=Math.floor(Math.random()*256);c.translate(-ox,-oy);c.fillStyle=pat;c.fillRect(0,0,W+256,H+256);c.restore();}
function vignette(c,amt,col='0,0,0'){if(!amt)return;const g=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(1,`rgba(${col},${amt})`);c.fillStyle=g;c.fillRect(0,0,W,H);}

/* ---------- style definitions ---------- */
const STYLES={
archive:{name:'Illuminated Archive',short:'Old paintings, slow camera moves',P:PAL.archive,zoom:.12,card:cardArchive,caption:'lowerThird',
  tagline:'Paintings, engravings and manuscripts brought to life with slow pans and zooms. This is the classic history-documentary look.',
  specs:[['Captions','Full sentence in a lower-third band'],['Visuals','Public-domain paintings and engravings'],['Pace','Steady, about 150 words a minute'],['Best for','10–25 minute documentaries on any era'],['Automation','Easy. Find images, then pan and zoom'],['Extra cost','None. Runs on Metricool and Claude Max']],
  post(c,S,t){c.save();c.globalCompositeOperation='multiply';c.globalAlpha=.55;c.drawImage(paper,0,0);c.restore();grain(c,.09,t);vignette(c,.6,'20,10,4');
    if(S.k>=1&&S.k<=6){c.globalAlpha=.8;c.fillStyle='#F3E6C8';c.font="500 17px Cinzel, Georgia, serif";spacing(c,3);c.textAlign='left';c.textBaseline='alphabetic';c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=8;c.fillText('I · THE SHIPS OF MESSINA',40,50);c.shadowBlur=0;spacing(c,0);c.globalAlpha=1;}}},
atlas:{name:'Cartographer',short:'Animated maps tell the story',P:PAL.atlas,zoom:.08,card:cardAtlas,caption:'subtitle',shots:ATLAS_SHOTS,
  tagline:'Animated maps carry the story: trade routes, dates and spreading territory. Other images cut in only where a map cannot show something.',
  specs:[['Captions','Standard white subtitles'],['Visuals','Maps generated in code from coastline data, plus archive images'],['Pace','Steady, with date counters'],['Best for','Empires, wars, migrations, plagues'],['Automation','Medium. Each topic needs place and date data'],['Extra cost','None. Runs on Metricool and Claude Max']],
  post(c,S,t){grain(c,.05,t);c.strokeStyle='rgba(38,48,47,.8)';c.lineWidth=2;c.strokeRect(14,14,W-28,H-28);c.lineWidth=1;c.strokeRect(22,22,W-44,H-44);
    if(S.k>=1&&S.k<=6&&S.k!==5){const d=S.k===6?lerp(1347.75,1353.3,ease(clamp(S.lp*1.08))):[0,1347.5,1347.7,1347.8,1347.85][S.k];
      c.fillStyle='rgba(237,227,204,.95)';c.fillRect(W-250,40,210,62);c.strokeStyle='#26302F';c.strokeRect(W-244,46,198,50);c.fillStyle='#26302F';c.textAlign='center';c.textBaseline='middle';c.font="600 30px 'EB Garamond', Georgia, serif";spacing(c,3);c.fillText(fmtDate(d),W-145,72);spacing(c,0);
      const km=camInfo.z>2?100:500;const len=km/(111.32*Math.cos(camInfo.lat*Math.PI/180))*KX*camInfo.z;
      c.fillStyle='#26302F';c.fillRect(46,H-120,len,5);c.fillStyle='rgba(237,227,204,.95)';c.fillRect(46+len/2,H-119,len/2,3);c.font="500 16px 'EB Garamond', Georgia, serif";c.textAlign='left';c.fillText(km+' km',46,H-138);}}},
noir:{name:'Dark Chronicle',short:'Cinematic, high contrast, punchy captions',P:PAL.noir,zoom:.16,card:cardNoir,caption:'kinetic',
  tagline:'Cinematic and high contrast, with word-by-word captions that flash key words in red. Built to keep viewers watching.',
  specs:[['Captions','Kinetic, word by word, key words in red'],['Visuals','Dark archive photos and code-drawn scenes under heavy film grain'],['Pace','Fast cuts, dramatic pauses'],['Best for','Dark history, mysteries, disasters'],['Automation','Easy. Mostly archive photos'],['Extra cost','None. Runs on Metricool and Claude Max']],
  post(c,S,t){grain(c,.2,t);vignette(c,.75);c.fillStyle=`rgba(0,0,0,${.05*Math.random()})`;c.fillRect(0,0,W,H);c.fillStyle='#000';c.fillRect(0,0,W,86);c.fillRect(0,H-86,W,86);}},
candle:{name:'Candlelight Sleep',short:'Slow and calm, made for bedtime',P:PAL.candle,zoom:.06,card:cardCandle,caption:'soft',rate:.9,
  tagline:'Quiet, slow narration over softly moving dusk scenes. People fall asleep to these, so a single video can run for hours.',
  specs:[['Captions','Minimal, or none'],['Visuals','Dusk paintings with very slow motion'],['Pace','Slow, about 120 words a minute, 1–3 hour videos'],['Best for','A sleep channel. Longest watch time of any format'],['Automation','Easiest. Long videos with few cuts'],['Extra cost','None. Runs on Metricool and Claude Max']],
  post(c,S,t){const r=rng(41);for(let i=0;i<46;i++){const x=(r()*W+Math.sin(t*.2+i)*30)%W,y=H-((r()*H+t*(6+r()*8))%H);c.fillStyle=`rgba(255,220,170,${.12+.18*r()})`;c.beginPath();c.arc(x,y,1+r()*2,0,TAU);c.fill();}
    const f=.85+.15*Math.sin(t*7)*Math.sin(t*3.1);const g=c.createRadialGradient(80,H-40,10,80,H-40,520);g.addColorStop(0,`rgba(242,170,90,${.28*f})`);g.addColorStop(1,'rgba(242,170,90,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    grain(c,.06,t);vignette(c,.8,'6,6,20');}},
explainer:{name:'Flat Explainer',short:'Bright graphics, stats and a timeline',P:PAL.explainer,zoom:.04,card:cardExplainer,caption:'karaoke',
  tagline:'Bright flat illustrations with on-screen numbers and a running timeline. Clear, friendly and easy for advertisers to accept.',
  specs:[['Captions','Karaoke style, each word highlighted as it is spoken'],['Visuals','Flat illustrations and charts drawn in code'],['Pace','Brisk, with pop-up stats'],['Best for','"History of X" topics and younger viewers'],['Automation','Hardest to design, but then fully code-driven'],['Extra cost','None. Runs on Metricool and Claude Max']],
  post(c,S,t){if(S.k<1||S.k>6)return;const d=S.k===6?lerp(1347.75,1353.3,ease(clamp(S.lp*1.08))):1347.8;
    const x0=380,x1=1200,y=46;c.fillStyle='rgba(31,58,77,.9)';rrect(c,x0-24,y-26,x1-x0+48,62,31);c.fill();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=3;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();
    c.font="600 14px Archivo, Arial, sans-serif";c.textAlign='center';c.textBaseline='middle';
    for(let yr=1346;yr<=1354;yr++){const x=lerp(x0,x1,(yr-1346)/8);c.fillStyle='rgba(255,255,255,.7)';c.fillRect(x-1,y-6,2,12);c.fillText(yr,x,y+20);}
    const mx=lerp(x0,x1,(d-1346)/8);c.strokeStyle='#FFD166';c.lineWidth=5;c.beginPath();c.moveTo(x0,y);c.lineTo(mx,y);c.stroke();c.fillStyle='#FFD166';c.beginPath();c.arc(mx,y,9,0,TAU);c.fill();
    const stat={1:['12','ships from Genoa'],2:['Messina','a busy Sicilian port'],4:['Most','of the crew already dead'],5:['1 bacterium','Yersinia pestis'],6:['25–50 million','dead in Europe, 1347–1351']}[S.k];
    if(stat){const a=easeOut(clamp(S.ls/.5));const bx=40,by=116,s=.8+.2*a;c.save();c.globalAlpha=a;c.translate(bx,by);c.scale(s,s);c.fillStyle='#FFFFFF';rrect(c,0,0,330,112,16);c.fill();c.fillStyle='#E4572E';c.fillRect(0,20,8,72);
      c.textAlign='left';c.fillStyle='#1F3A4D';c.font="900 44px Archivo, Arial, sans-serif";c.fillText(stat[0],28,46);c.font="600 20px Archivo, Arial, sans-serif";c.fillStyle='#46637A';c.fillText(stat[1],28,86);c.restore();}}}
};
Object.entries(STYLES).forEach(([k,s])=>s.key=k);

/* ---------- thumbnails ---------- */
const THUMBS={
  archive(c,st){const P=st.P;sky(c,P,.3,3);coast(c,P,3,.3);sea(c,P,3,.3);cog(c,P,880,640,1.75,3,{limp:true});fog(c,P,3,.8);
    st.post(c,{k:0},3);c.textAlign='left';c.textBaseline='alphabetic';c.shadowColor='rgba(0,0,0,.85)';c.shadowBlur=24;c.fillStyle='#F6E7C4';c.font="700 108px Cinzel, Georgia, serif";c.fillText('THE SHIPS',60,250);c.fillText('OF DEATH',60,370);c.shadowBlur=0;
    c.fillStyle='#B8893F';c.fillRect(64,405,150,54);c.fillStyle='#1C140E';c.font="700 34px Cinzel, Georgia, serif";c.fillText('1347',82,445);},
  atlas(c,st){c.save();mapCam(c,26,46,1.08);drawMap(c,st,1352.5,{z:1.08,route:1});c.restore();st.post(c,{k:0},0);
    c.fillStyle='#FFFFFF';c.fillRect(40,40,560,230);c.fillStyle='#1A1A1A';c.font="900 70px Archivo, Arial, sans-serif";c.textAlign='left';c.textBaseline='alphabetic';c.fillText('HOW THE',64,120);c.fillText('PLAGUE',64,190);c.fillStyle='#B02A1E';c.fillText('TOOK EUROPE',64,258);
    c.fillStyle='#B02A1E';rrect(c,W-360,H-120,300,70,10);c.fill();c.fillStyle='#FFFFFF';c.font="800 40px Archivo, Arial, sans-serif";c.textAlign='center';c.fillText('1347 → 1353',W-210,H-72);},
  noir(c,st){const P=st.P;sky(c,P,0,4,'#C0392B');sea(c,P,4,0);cog(c,P,380,620,1.9,4,{limp:true});ravens(c,P,4,380,300);
    grain(c,.18,0);vignette(c,.7);c.textAlign='right';c.textBaseline='alphabetic';c.shadowColor='rgba(0,0,0,.9)';c.shadowBlur=20;c.font="700 120px Oswald, 'Arial Narrow', sans-serif";c.fillStyle='#F2F2F2';c.fillText('THEY WERE',W-50,300);c.fillStyle='#E0463A';c.font="700 170px Oswald, 'Arial Narrow', sans-serif";c.fillText('ALL DEAD',W-50,470);c.shadowBlur=0;},
  candle(c,st){const P=st.P;sky(c,P,0,6);stars(c,6,60);coast(c,P,6,0);sea(c,P,6,0);cog(c,P,380,610,1.1,6);st.post(c,{k:0},6);
    c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='#EFE3CF';c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=18;c.font="italic 500 92px Lora, Georgia, serif";c.fillText('The Black Death',60,150);
    c.fillStyle='#F2C27A';c.font="italic 400 36px Lora, Georgia, serif";c.fillText('2 hours of calm history for sleep',64,210);c.shadowBlur=0;
    c.fillStyle='rgba(14,15,36,.75)';rrect(c,W-200,H-90,150,50,25);c.fill();c.fillStyle='#EFE3CF';c.font="600 26px Archivo, Arial, sans-serif";c.textAlign='center';c.fillText('2:04:18',W-125,H-55);},
  explainer(c,st){micro(c,st,2,930,380,300,false);c.fillStyle='#1F3A4D';c.fillRect(0,0,600,H);c.textAlign='left';c.textBaseline='alphabetic';
    c.fillStyle='#FFD166';c.font="900 190px Archivo, Arial, sans-serif";c.fillText('1 IN 3',44,310);c.fillStyle='#FFFFFF';c.font="900 64px Archivo, Arial, sans-serif";c.fillText('EUROPEANS',50,420);c.fillText('DIED. WHY?',50,494);
    c.fillStyle='#E4572E';c.beginPath();c.moveTo(560,560);c.lineTo(700,500);c.lineTo(690,535);c.lineTo(760,540);c.lineTo(750,580);c.lineTo(680,575);c.lineTo(670,610);c.closePath();c.fill();}
};

