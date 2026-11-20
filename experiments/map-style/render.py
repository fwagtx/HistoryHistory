import json, sys, base64, subprocess
from pathlib import Path
sys.path.insert(0, "/home/user/HistoryHistory/pipeline")
from playwright.sync_api import sync_playwright
from render_vertical import font_css, chromium
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe(); D = Path(__file__).parent; S = D.parent; V = S / "viking"; TL = json.loads((V / "timeline.json").read_text())
b64 = lambda p: base64.b64encode(p.read_bytes()).decode()
fonts = "".join(f"@font-face{{font-family:'{n}';src:url(data:font/ttf;base64,{b64(S / 'fonts' / f)})}}" for n, f in [("Archivo Black", "ArchivoBlack-Regular.ttf"), ("Cormorant Garamond", "CormorantGaramond.ttf")])
imgs = "".join(f"<img id='{n}' src='data:image/jpeg;base64,{b64(D / 'img' / (n + '.jpg'))}'>" for n in ["dahl", "krohg"])
html = f"<!doctype html><html><head><meta charset='utf-8'>{font_css()}<style>{fonts}img{{display:none}}</style></head><body>{imgs}<div style=\"font-family:'Archivo Black'\">a</div><div style=\"font-family:'Cormorant Garamond';font-weight:700\">a</div><script>const GEO={(S / 'geo' / 'geo.json').read_text()};const TL={json.dumps(TL)};const IMG={{dahl:document.getElementById('dahl'),krohg:document.getElementById('krohg')}};\n{(V / 'paper.js').read_text()}\n{(D / 'tpl.js').read_text()}</script></body></html>"
(D / "page.html").write_text(html)
tpl = sys.argv[1]; stills = [float(a) for a in sys.argv[2:]]; import os; END = float(os.environ.get("HP_END", 14.4)); nf = int(END * 30)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chromium()); pg = b.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto((D / "page.html").as_uri()); pg.evaluate("async()=>{await Promise.all([...document.images].map(i=>i.decode()));await document.fonts.load('80px \"Archivo Black\"');await document.fonts.load('700 40px \"Cormorant Garamond\"');await document.fonts.load('italic 600 40px \"Cormorant Garamond\"');await Promise.all([...document.fonts].map(f=>f.load()));await document.fonts.ready;}")
    fr = lambda f: base64.b64decode(pg.evaluate(f"(f)=>FRAMES.{tpl}(f)", f).split(",", 1)[1])
    if stills:
        for s in stills:
            try: (D / f"{tpl}-st-{s:04.1f}.jpg").write_bytes(fr(int(s * 30)))
            except Exception as e: print("ERR", s, str(e)[:300])
    else:
        enc = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-i", str(D / os.environ.get("HP_AUDIO", "voice14.wav")), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", str(D / f"{tpl}.mp4")], stdin=subprocess.PIPE)
        for f in range(nf): enc.stdin.write(fr(f))
        enc.stdin.close(); enc.wait(); print(tpl, "done")
    print("errors", errs[:3]); b.close()
