# History Pros

Automated history videos for YouTube, TikTok, Instagram and Facebook, posted through Metricool. The whole pipeline runs on free, offline tools.

## Pipeline

1. **Script:** Claude writes and fact-checks each episode into `episodes/<id>/`.
2. **Narration:** `pipeline/tts.py` voices it with Kokoro, which runs locally with no API key. The voice is Adam (`am_adam`).
3. **Render:** `pipeline/render_vertical.py` draws the Dark Chronicle scenes in `engine/vertical.html` with headless Chromium and encodes a 1080×1920 MP4 with ffmpeg. It adds a generated score.
4. **Publish:** the finished files are scheduled to every platform in Metricool.

## Render the first short

```bash
pip install -r requirements.txt
python pipeline/tts.py episodes/001-black-death/short_script.json --voice am_adam --mode short --out output/001-black-death
python pipeline/render_vertical.py --timings output/001-black-death/timings.json \
  --narration output/001-black-death/narration.wav --voice am_adam --style noir \
  --out output/001-black-death/short.mp4
```

The voice models (about 350 MB) download into `assets/models/` on first run. The fonts in `assets/fonts/` are open source (SIL Open Font License).
