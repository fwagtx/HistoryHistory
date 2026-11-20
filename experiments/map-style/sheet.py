import sys, subprocess, imageio_ffmpeg, io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FF = imageio_ffmpeg.get_ffmpeg_exe(); D = Path(__file__).parent
TS = [0, .3, .7, 1.2, 1.8, 2.5, 3.2, 4.0, 4.6, 5.6, 6.4, 7.0, 8.0, 9.5, 10.5, 11.8, 12.6, 13.6]
for T in sys.argv[1:]:
    W, H = 300, 533; cols = 6; rows = (len(TS) + cols - 1) // cols; sheet = Image.new("RGB", (W * cols, (H + 30) * rows), "white"); d = ImageDraw.Draw(sheet)
    for i, t in enumerate(TS):
        b = subprocess.run([FF, "-loglevel", "error", "-ss", str(t), "-i", str(D / f"{T}.mp4"), "-frames:v", "1", "-f", "image2pipe", "-c:v", "mjpeg", "-"], capture_output=True).stdout
        im = Image.open(io.BytesIO(b)).resize((W, H)); x, y = (i % cols) * W, (i // cols) * (H + 30); sheet.paste(im, (x, y + 30)); d.text((x + 8, y + 6), f"t={t:.1f}s", fill="black", font=ImageFont.load_default(size=20))
    sheet.save(D / f"{T}-sheet.jpg", quality=88); print(T, sheet.size)
