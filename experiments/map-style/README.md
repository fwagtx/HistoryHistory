# Map-style template (trial from Nov 20, 2026)

Four templates (Paper Theatre, Map Explainer, Painted Documentary, Big Hook) were rendered for the same 14 s Viking opening and graded by four independent agents: retention, art director, AI-look skeptic and casual viewer.
Map Explainer won (average 7.0, against 5.25, 5.0 and 4.25). T5 combines its approach with the graders' fixes and scored 8 and 7.5 on re-grade. The owner approved trying it.

Rules learned from the grading:
- The question hook is on screen at frame 0.
- One map world carries the whole short; cards sit over the dimmed map instead of cutting away.
- A 3-slot problem tracker fills in as the story goes.
- On-screen numbers only appear when the narrator says them.
- Captions sit in one fixed band (about 66–74% of the height) on a dark plate. Nothing else goes there, nothing goes below 78%, and the side margins are 6% left and 14% right.
- No stock mascot front-on. Crowds use varied figures, not one cloned sprite.
- No synthesized noise SFX, room tone or noise music. The Short is voice only.

Files:
- `tpl.js`: the templates. `frameV` renders the full Viking short.
- `viking/paper.js`: shared drawing helpers.
- `render.py`: the renderer. It reads `scratchpad/viking/timeline.json` and the voice wavs, which are not committed.
