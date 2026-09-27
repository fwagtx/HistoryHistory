# History Pros toon script spec

From Sep 27, 2026 every History Pros video uses the **toon** look: hand-drawn cartoon characters on bright backgrounds, a casual and funny storyteller voice, and short character skits. Voice #3 (`am_michael`) narrates. A script is one JSON file; `pipeline/toon_render.py` turns it into a finished video, and `pipeline/validate_toon.py` checks it first.

## Cadence

| What | How many | Days and times (America/Chicago) | Platforms |
|---|---|---|---|
| Long-form (16:9, 12–16 min) | 3 a week | Mon, Wed, Fri: YouTube 16:00, Facebook 11:00 | YouTube, Facebook |
| Shorts (9:16, 30–50 s) | 4 a day | 09:00, 12:00, 15:00, 19:00 | TikTok, Instagram Reels, YouTube Shorts, Facebook |

- **Monday** is "The ENTIRE History of X in N Minutes".
- **Wednesday** is a list: "The Craziest / Weirdest / Most Ridiculous X".
- **Friday** is money and power: fortunes, heists, scams, crashes.

Topics come from `config/topics.json`, highest-ranked `queued` topic per format first. Each long-form spawns 9–10 shorts from its most surprising facts. Each week has 28 shorts: 10 from Monday's topic, 9 from Wednesday's and 9 from Friday's.

## Rules for every script

1. **Facts first.** Every factual claim is checked against at least one reliable source (encyclopedia, museum, university, major outlet) and listed in `sources`. If historians disagree, say so on screen ("one account says", "historians argue"). Numbers are said the way the narrator should read them ("twenty thousand", "1347").
2. **Tone.** Casual, funny, confident, like a friend who loves history: short sentences, contractions, quick asides ("I mean, how hard could it be?"). The joke is never a made-up fact. See the reference channels Animated History and Serious History.
3. **Skit dialogue.** Characters may speak lines that dramatize an event documented in the sources (the Pope being told to sit between fires). A line presented as a real quote must be real: use a `quote` card with the speaker and source. Never invent a quote and present it as genuine.
4. **Advertiser-safe.** No gore close-ups (violence happens off-screen or as a cartoon "poof"), no sexual content, no living politicians, no current wars (Israel/Palestine, Russia/Ukraine), no Nazi symbols (German WWII soldiers wear the plain `stahlhelm` and `ww2` uniform with no insignia), and never comedy about the Holocaust or other genocides. Those are covered with a solemn tone only.
5. **Brand.** History Pros only. Writers never schedule or post; publishing happens only in Metricool brand **7081960**.

## Make it simple (the most important rule)

History Pros should be the easiest history channel to understand, while still being smart and funny. Write for a curious 12-year-old who knows nothing about the topic. If a viewer would need to pause or look something up, rewrite it.

**Story shape.** Every short, and every chapter of a long-form, is one clear mini-story told in order:
1. **Hook:** the surprising payoff, in plain words ("A man living in a jar told Alexander the Great to get out of his way.").
2. **Set the scene:** who, where and when, one short sentence each. The first shot in each new place carries a `place` banner ("Corinth, Greece · 336 BC").
3. **The story, step by step:** one step per beat, in time order, cause then effect. Say *why* people did things.
4. **The payoff:** the funny or shocking moment, set up so it lands.
5. **Takeaway:** one line on why it matters or what it tells us ("So one of the most powerful men alive envied a man who owned nothing.").
6. **Follow line.**

**One story per short.** Don't stack three anecdotes into 40 seconds. Pick the best one and tell it properly; the extras can be other shorts.

**Explain everyone and everything.**
- The first time a person appears, say who they are in a few words ("Diogenes, a Greek philosopher who owned almost nothing").
- No unexplained names, places, terms or inside jokes. Explain a term in the same sentence ("a qilin, a magical animal from Chinese legend").
- Compare big numbers to something familiar ("about the weight of two cars").

**Plain words.** Short sentences (under about 18 words), one idea each, everyday vocabulary. Clever is good; confusing is not.

**Hedge once, clearly.** When a story is uncertain, say so once and say where it comes from ("This story comes from Plutarch, a Greek writer who lived 400 years later."). Don't sprinkle "supposedly" and "reportedly" on every line.

**The picture matches the words.**
- Every shot shows exactly what the line is about: the place, the people, the object.
- When the story moves, the background moves. In shorts never use the same background for more than 2 shots in a row (3 in long-form), and use at least 3 different backgrounds, maps or cards per short.
- Use a map, a `place` banner or a card when a new place or year comes up.
- Use stickers to label the key word or number on screen ("336 BC", "MERCURY PILLS").

**Humor serves the story.** Jokes come from the real situation and never replace an explanation. About one joke every 2–3 beats is plenty.

**Final test.** Read only the narration: could a 12-year-old retell the story in two sentences and say why it matters? If not, rewrite.

## Script file

`episodes/<YYYY>w<WW>/<id>.json`, one folder per ISO week (Monday–Sunday). IDs: `<YYYY>w<WW>-l1|l2|l3` for the Mon/Wed/Fri long-form videos and `<YYYY>w<WW>-s01…s28` for shorts, so the Oct 5–11, 2026 week is `2026w41` (`2026w41-l1`, `2026w41-s01`). The folder also holds `week.json` (see docs/AUTOMATION.md).

```json
{
 "id": "2026w41-s03", "format": "short", "date": "2026-10-05", "slot": "15:00",
 "title": "Australia Lost a War to Birds", "hook": "THE GREAT EMU WAR", "music": "playful",
 "cast": {
  "meredith": {"preset": "tommy", "hat": "slouch", "stache": "bush", "name": "Major G.P.W. Meredith"},
  "emu": {"animal": "emu", "helmet": true, "mood": "smug"}
 },
 "voices": {"meredith": "bm_george"},
 "beats": [
  {"who": "N", "say": "In 1932, Australia sent soldiers with machine guns to fight... emus.",
   "show": {"k": "scene", "bg": "outback", "cast": [{"id": "meredith", "x": 0.3, "enter": "left"}, {"id": "emu", "x": 0.75, "enter": "pop"}]}},
  {"who": "meredith", "say": "How hard can it be?", "show": {"k": "scene", "bg": "outback", "cam": "close", "cast": [{"id": "meredith", "pose": "hips", "mood": "smug"}]}},
  {"who": "N", "say": "Follow for more history that sounds made up.", "show": {"k": "end", "cast": [{"id": "emu", "x": 0.3}, {"id": "meredith", "x": 0.72, "pose": "wave", "mood": "happy"}]}}
 ],
 "caption": "Australia vs. 20,000 emus. Guess who won.\n\nFull video on our YouTube channel. Follow for 4 stories a day.\n#history #emuwar #australia #historytok #funnyhistory",
 "youtube_title": "Australia Lost a War to Birds #shorts",
 "tags": ["emu war", "history", "australia", "funny history", "history shorts"],
 "sources": ["https://en.wikipedia.org/wiki/Emu_War", "https://..."]
}
```

Long-form adds `"format": "long"`, `description` (2–3 sentences, then "Chapters are added automatically.", then hashtags) and a `thumbnail`.

### Beats

- Each beat is **one sentence or line** in `say`, spoken by `who`: `"N"` for the narrator, or a cast id for a character. Characters get their own voices automatically; pin one with `voices` (Kokoro voices such as `bm_george`, `am_fenrir`, `bm_lewis`, `am_puck`, `af_heart`, `bf_emma`, `am_echo`, `af_bella`, `bm_daniel`, `am_liam`, `bf_alice`, `am_eric`; `am_michael` is the narrator).
- A beat with `show` starts a new shot. A beat without one keeps the picture. Change the picture every 1–2 beats in shorts and every 1–3 beats in long-form.
- A beat with no `say` and `"hold": 2.5` is silent (for `chapter` and `title` cards).

### Lengths

- **Short:** 7–10 beats, 75–115 words (30–45 s). Beat 1 is the hook. End with a `k: "end"` shot and a line like "Follow for more…". Use at least two different scenes and at least one character.
- **Long-form:** 1,900–2,400 narrated words (12–16 min).
  - **Cold open:** 4–8 beats on the most dramatic or funny moment.
  - **Title:** a `title` card with the video title, handwritten.
  - **Chapters:** 6–10, each starting with a `chapter` card (`year` plus a punchy title). Monday chapters are years in order; Wednesday list videos use `list` cards "Number 5 … Number 1" as their chapters.
  - **Ending:** a closing beat plus an `end` card that teases the next long-form video.
  - **Variety:** at least 2 skits (2+ lines of character dialogue), 4 maps, 2 `card` stats, 1 `quote`, and 12+ different scenes.

### Shots (`show.k`)

| k | Fields | What it shows |
|---|---|---|
| `scene` | `bg`, `cast`, `cam`, `focus`, `fx`, `stickers`, `tag`, `place` (a where-and-when banner, e.g. "Corinth, Greece · 336 BC"), `cx` (short only: which part of the 1920-wide scene to frame, default 960) | A background with characters |
| `map` | `lon`, `lat`, `z0`, `z1`, `date`, `labels` `[[name, lon, lat, dx]]`, `route` `[[lon, lat], …]`, `areas` `[[lon, lat, radius_deg, "rgba(...)"]]` | Cartoon map with real coastlines. Coverage: Europe, Mediterranean, Middle East (lon −14 to 70, lat 10 to 71). z 1–1.5 is a continent, 2–4 a region. For the Americas, East Asia or sub-Saharan Africa use a scene instead of a map. |
| `title` | `text`, `sub`, `cast` | Handwritten title on white |
| `chapter` | `year`, `title`, `bg` (optional scene thumbnail) | Chapter card |
| `card` | `label`, `big`, `sub`, `cast` | Big number or word on paper (numbers count up) |
| `quote` | `text`, `who` | A real, credited quote |
| `list` | `n` (e.g. `"5"`), `title` | "Number 5" list card |
| `compare` | `bg`, `left` `{label, cast}`, `right` `{label, cast}` | Split screen: then vs now, us vs them |
| `end` | `next` (long-form: the next video's title), `cast` | Subscribe / Follow card |

### Cast entries in a shot

`{"id": "meredith", "x": 0.3, "s": 1, "pose": "point", "mood": "shock", "hold": "sword", "enter": "left|right|pop|drop", "exit": "left|right", "exitAt": 2.5, "walk": [0.1, 0.6], "bounce": true, "flip": true, "look": -0.3}`

- `x` is 0–1 across the frame (shorts: stay between 0.12 and 0.82, since the right edge has app buttons). It's auto-spaced if left out.
- `s` scales the character (1 = normal).
- Characters face each other automatically.
- A character talks (mouth moving) while its own `say` line plays.
- `cam`:
  - `push` (default, slow zoom in)
  - `pan`
  - `still`
  - `close` (zooms on `focus`, or on whoever speaks next)
  - `shake`
- `stickers` are `[{"text": "10,000 ROUNDS", "at": 2.2, "color": "#1F8A4A"}]`, popping in at `at` seconds into the shot (max 3 per shot).
- `tag` is `{"id": "meredith", "text": "Major Meredith"}`, a name label; use it the first time a real person appears.

### Characters (`cast` at the top)

Each id maps to a character spec: `{"preset": …}` plus any overrides, or a full spec. Real people get a `name` and a look that fits their portraits and era: hat, beard, skin tone, outfit, colors.

**Spec fields:**
- `skin`: peach, light, tan, olive, brown, dark
- `hair`: short, long, bun, curly, side, spiky, bald
- `hairColor`
- `beard`: full, long, goatee
- `stache`: bush, thin, handlebar
- `stubble`
- `glasses`: round, square
- `hat`, `hatColor`
- `outfit`, `color`, `color2`
- `apron`, `tie`
- `hold`
- `mood`: neutral, happy, shock, angry, scared, smug, sad, shout
- `eyes`: dot or big
- `animal`: emu, pig, horse, rat, elephant (animals take `mood`, and emus take `helmet`)

The engine vocabulary follows. `pipeline/validate_toon.py` rejects anything else.

**Presets:**
- **Everyday people:** host, peasant, peasantW, farmer, worker, child, pioneer, puritan, judge, businessman, banker, merchant, noble.
- **Religion and royalty:** monk, nun, pope, king, queen, princess.
- **Ancient world:** legionary, senator, roman, pharaoh, egyptian, greek, philosopher.
- **Medieval and Asian warriors:** knight, crusader, saracen, viking, samurai, shogun, mongol, sultan.
- **Sea and empire:** sailor, pirate, captain, conquistador, redcoat, grenadier, cowboy.
- **Modern soldiers:** tommy, german1914, gi, brit40, soviet, pilot.
- **Science and medicine:** scientist, doctor (plague mask), physician, astronaut.

**Hats:**
- **Everyday:** cap, bowler, tophat, fedora, beret, straw, bonnet, headscarf, turban, bandana, chef, grad.
- **Religious:** mitre, hood, wimple, veil, capotain.
- **Royalty:** crown, tiara, laurel.
- **Ancient:** roman, nemes (pharaoh), goldhelm.
- **Medieval and Asian:** knight, viking, coif, kabuto, mongol.
- **Sea and empire:** sailorcap, captain, tricorn, pirate, bicorne, bearskin, morion, cowboy, slouch, kepi (1850s–1860s soldiers).
- **Military:** brodie, pickel, m1, stahlhelm, ushanka, aviator.
- **Plague doctor:** plague (the wide hat), beak (the full mask).
- **Space:** spacehelm.

**Outfits:**
- **Everyday:** tunic, rags, dress, gown, suit, coat, overalls, labcoat, cowboy.
- **Robes:** robe, toga, mitre (papal robes).
- **Ancient and Asian:** egypt, kimono, samurai, fur, viking.
- **Armour:** armor, crusader, saracen.
- **Military:** uniform (khaki, WWI), ww2, soviet, redcoat, napoleon.
- **Sea:** sailor, pirateshirt.
- **Space:** spacesuit.

**Props (`hold`):**
- **Weapons:** sword, spear, rifle, lewis (machine gun), pitchfork.
- **Money:** moneybag, goldbar, coin, goblet.
- **Paper:** scroll, book, letter, pen.
- **Other:** torch, flag (`flagColor`), lantern, bottle, ball.

**Poses:** point, wave, cheer, shrug, hips, think, fist, salute, scared, facepalm, aim, hold, present, cross, sit, walk, run.

**Scenes (`bg`):**
- **Outdoors:** field, sea, harbor, town, village, castle, desert, volcano, outback, wheat, rome, egypt, greek, battlefield, trench, city, street, market, camp, deck, palace, steppe, japan, jungle, snow, arctic, factory.
- **Night:** night, ocean, titanic.
- **Space:** moon, space.
- **Indoors:** throne, church, tavern, warroom, vault, courtroom, library, office.
- **Blank:** white.

**fx:** snow, rain, dust, smoke, fire (two fires on the floor), confetti, sparkle, explosion.

### Thumbnails (long-form `thumbnail`)

- `{"style": "split", "years": ["753 BC", "476 AD"], "word": "HOW?", "left": {"id": "caesar", "mood": "smug"}, "right": {"id": "odoacer", "mood": "shock"}, "map": {"lon": 14, "lat": 44, "z": 1.1, "d0": 0, "d1": 0, "red": true}}` is best for Monday.
- `{"style": "faces", "title": "LAST DAY", "bg": "volcano", "faces": [{"id": "a", "mood": "shout"}, {"id": "b", "mood": "scared"}], "grade": "warm"}` works for Wednesday.
- `{"style": "redbox", "bg": "outback", "lines": ["THEY LOST", "TO BIRDS?"], "main": {"id": "emu", "mood": "smug"}, "second": {"id": "meredith", "mood": "scared", "hold": "lewis"}}` works for Wednesday and Friday.
- Thumbnail text is 1–3 words, all caps, and true.

## Checking and rendering

```
python pipeline/validate_toon.py episodes/<dir>/*.json      # schema, vocabulary, lengths, and a test frame of every shot
python pipeline/toon_render.py episodes/2026w41/2026w41-s01.json --stills   # one still per shot to review
python pipeline/toon_render.py episodes/<dir>/*.json                # finished videos into media_out/
```
