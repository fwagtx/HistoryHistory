# History Pros script spec

Every video starts as a JSON script in `episodes/<nnn-slug>/`. The pipeline narrates it with Kokoro (`am_adam`), renders it in the Dark Chronicle look, and the files in `media/` are what Metricool publishes. This spec is the contract between writing and rendering.

**Rules for every script**
- Every factual claim is checked against at least one reliable source (academic, museum, encyclopedia, major outlet) before narration. List the sources in the script's `sources` field. If a claim is disputed, say so ("historians think", "one account says") or leave it out.
- Hooks can be dramatic but must be true. No invented quotes, numbers or dialogue.
- Plain spoken English. Short sentences. Numbers written the way Adam should say them ("twelve ships", "1347", "25 to 50 million").
- Brand: History Pros only. Writers never schedule or post anything; Claude does that from the main session for Metricool brand 7081960 only.

## Shorts: `episodes/<nnn-slug>/shorts/<id>.json`

One file per short, 21 per week (3 a day at 10:00, 12:00 and 18:00 America/Chicago). IDs, dates, slots, titles and hooks come from `config/calendar.json`.

```json
{
 "id": "w2-s1", "date": "2026-10-05", "slot": "10:00",
 "title": "The Plaster Bodies",
 "sentences": ["...", "...", "Follow for more from Pompeii."],
 "meta": {
  "title": "The Plaster Bodies",
  "shots": ["...one per sentence..."],
  "chips": ["...one per sentence, null on card shots..."],
  "stat": {"label": "THE DEATH TOLL", "big": "2,000", "unit": "bodies found", "sub": "...", "filled": 0},
  "end": {"pill": "WEDNESDAY", "line1": "Full documentary", "line2": "on YouTube", "sub": "Follow for 3 stories a day"},
  "keys": ["ash", "plaster"]
 },
 "caption": "One-line hook.\n\nFull documentary Wednesday on YouTube. Follow for 3 stories a day.\n#history #pompeii #ancientrome #historytok #vesuvius",
 "youtube_title": "The Plaster Bodies | Pompeii #shorts",
 "tags": ["pompeii", "history", "ancient rome", "vesuvius", "history shorts"],
 "sources": ["https://..."]
}
```

- **Sentences:** 6 to 8, about 60 to 90 words in total (25 to 35 seconds). Sentence 1 is the hook. The last sentence is `Follow for more from <topic>.`
- **Shots:** exactly one per sentence, and the last one is `"end"`. Keep a mix: use a character at least once, and a card (`text` or `stat`) at most twice.
- **Chips:** a short uppercase fact label per shot, up to 26 characters (`"NAPLES · 79 AD"`). Use `null` for `text`, `stat` and `end` shots.
- **Keys:** 3 to 6 lowercase words to highlight in the captions.
- **Stat:** only when a shot uses `"stat"`. `filled` (0 to 10) shades that many of 10 person icons, and 0 hides them.
- **End card and caption line**, by day relative to the Wednesday documentary:
  - Mon/Tue: pill `WEDNESDAY`, lines `Full documentary` / `on YouTube`, sub `Follow for 3 stories a day`. Caption: `Full documentary Wednesday on YouTube. Follow for 3 stories a day.`
  - Wed: pill `OUT TODAY`, lines `The full` / `documentary`, sub `On our YouTube channel`. Caption: `Full documentary out today on YouTube. Follow for 3 stories a day.`
  - Thu to Sun: pill `WATCH NOW`, lines `Full documentary` / `on our channel`, sub `Follow for 3 stories a day`. Caption: `Full documentary on our YouTube channel. Follow for 3 stories a day.`
- **Hashtags:** 5, starting with `#history`.

### Shot types (shorts)

| Shot | JSON | What it shows |
|---|---|---|
| Scene | `{"s": "lf", "scene": "<scene>", "cx0": 480, "cx1": 800}` | A long-form scene in portrait, panning from x `cx0` to `cx1` (0 to 1280). |
| Character | `{"s": "person", "who": "<cast id>", "bg": "<scene>", "expr": "fear"}` | An illustrated character over a dimmed scene. `expr` is optional: shock, fear, grim, sad or neutral. |
| Map | `{"s": "map", "lon": 14.5, "lat": 40.8, "z0": 2.5, "z1": 4, "date": 0, "pins": [["Pompeii", 14.49, 40.75]]}` | Dark map of Europe, the Mediterranean and the Near East (longitude -14 to 70, latitude 10 to 71). `date: 0` turns off the plague overlay. `pins` label places; add `"l"` as a fourth item to put a label on the left. The coastline is coarse: use z 1.2–3 for regions, up to about 6 for a city, and 10–14 only for the Bay of Naples. Keep to 4 pins or fewer. |
| Text card | `{"s": "text", "label": "THE 2018 STUDY", "big": "PEOPLE\|NOT RATS", "sub": "Best fit in 7 of 9 cities"}` | A big statement. `\|` breaks the line. |
| Stat card | `"stat"` | Uses `meta.stat`. |
| End card | `"end"` | Uses `meta.end`. |
| Black Death only | `"dead"`, `"arrive"`, `"ship"`, `"dock"`, `"micro"`, `"messina"`, `"spread"` | The original plague scenes. |

### Scenes (for `lf` shots, character backgrounds and documentaries)

`volcano` (Vesuvius erupting behind temples), `bay` (Bay of Naples with Roman ships and a smoking Vesuvius), `forum` (Roman street of columns under falling ash), `ruins` (burning colonnade), `walls` (city walls and a domed church at night), `hagia` (Hagia Sophia at night, lit from inside, as it looked before 1453 with no minarets), `cannon` (a giant siege cannon firing at walls), `warship` (burning battleship with planes), `village` (colonial village under the moon, with a church), `meetinghouse` (Puritan courtroom interior with benches and candles), `gallows` (a lone tree on a hill at dusk), `street` (foggy gaslit street), `cellar` (barrels in a vaulted cellar), `trench` (WWI trench in fog), `snow` (snowbound mountains with a wagon), `shipdead` (a drifting ghost ship), `dock` (medieval harbor with crowds), `storm` (a ship in rain).

### Cast (for `person` shots)

sailor1347 (Genoese sailor, Messina 1347), agnolo (Agnolo di Tura, Siena chronicler), physician (medieval physician), peasantW (peasant woman), peasant (peasant farmer), friar (a friar), clement (Pope Clement VI), boccaccio (Giovanni Boccaccio), roman (citizen of Pompeii), pliny (Pliny the Younger, age 17), constantine (Constantine XI), mehmed (Mehmed II), puritanW (Mary Easty, accused at Salem), magistrate (Salem magistrate), constable (Whitechapel constable), fawkes (Guy Fawkes), tommy (British soldier 1918), pioneerW (Virginia Reed), pilgrim (Mayflower passenger), scholar (scholar of Alexandria), sailor1941 (U.S. Navy sailor), tommy1914 (British soldier 1914), german1914 (German soldier 1914), puritanM (Puritan official).

A character stands for a real person only when `name` in `engine/people.js` is that person. Otherwise it is "a citizen", "a sailor" and so on. Don't call a generic figure by a real person's name.

## Documentary: `episodes/<nnn-slug>/documentary.json`

One per week, published Wednesday (YouTube 16:00, Facebook 11:00). Target 14 to 16 minutes: about 1,900 to 2,100 narrated words, in the six chapters from `config/calendar.json`.

```json
{
 "id": "w2-doc", "week": 2, "date": "2026-10-07",
 "title": "Pompeii: The Last 24 Hours of a Roman City",
 "youtube_title": "Pompeii: The Last 24 Hours of a Roman City | Full Documentary",
 "description": "Two or three sentences.\n\nChapters are added automatically.\n\n#history #pompeii",
 "tags": ["pompeii", "..."],
 "beats": [
  {"show": {"k": "scene", "scene": "volcano", "stamp": "BAY OF NAPLES · 79 AD"}, "say": "..."},
  {"say": "..."},
  {"show": {"k": "title"}},
  {"show": {"k": "chapter", "n": 1, "title": "A City by the Bay"}},
  {"show": {"k": "person", "who": "pliny", "bg": "bay", "intro": true}, "say": "..."},
  {"show": {"k": "map", "lon": 14.4, "lat": 40.8, "z0": 3, "z1": 5, "pins": [["Pompeii", 14.49, 40.75], ["Misenum", 14.08, 40.78]]}, "say": "..."},
  {"show": {"k": "quote", "text": "...", "who": "PLINY THE YOUNGER · LETTER 6.16"}, "say": "..."},
  {"show": {"k": "stat", "label": "...", "big": "...", "sub": "..."}, "say": "..."},
  {"show": {"k": "text", "label": "...", "big": "LINE ONE|LINE TWO", "sub": "..."}, "say": "..."},
  {"show": {"k": "end"}, "say": "..."}
 ],
 "sources": ["https://..."]
}
```

- **Beats:** each beat is one spoken sentence (`say`) and, optionally, a new picture (`show`). A beat without `show` keeps the previous picture, so change pictures every 1 to 3 sentences.
- **Silent beats:** a beat without `say` is held for a few seconds. Use these for `title` and `chapter` cards.
- **Structure:** a cold open of 5 to 8 sentences on the most dramatic moment, then `title`, then the six chapters (each starts with a `chapter` beat), then `end`.
- **Variety:** use each week's cast with `intro: true` the first time a character appears (it shows their name and role), and later without it. Use at least 3 maps, 2 quotes, 2 stats, and 8 or more different scenes.
- **Quotes:** real primary sources only, translated and credited.
- **Ending:** the final `end` beat teases next week's topic and asks viewers to subscribe.
