"""Pocket TTS batch worker (runs under python3.13, where pocket-tts is installed).
Reads <dir>/jobs.json = [[voice, text], ...] and writes <dir>/<i>.wav. Kyutai Pocket TTS, CC-BY 4.0."""
import json, sys
from pathlib import Path
import soundfile as sf, torch
from pocket_tts.models.tts_model import TTSModel

d = Path(sys.argv[1]); jobs = json.loads((d / "jobs.json").read_text())
torch.set_num_threads(4); m = TTSModel.load_model(); sr = m.config.mimi.sample_rate; states = {}
for i, (voice, text) in enumerate(jobs):
    if voice not in states:
        states[voice] = m.get_state_for_audio_prompt(voice)
    sf.write(d / f"{i}.wav", m.generate_audio(states[voice], text).numpy().ravel(), sr)
