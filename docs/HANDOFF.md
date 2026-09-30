# History Pros: current state (handoff, Sep 30, 2026)

Read this with CLAUDE.md, docs/TOON_SPEC.md and docs/AUTOMATION.md. History Pros only: Metricool brand
**7081960**. Never touch streak.pros (7065085), Creator Code Bad (7066444) or financeprostv (7091438).

## Accounts
| | |
|---|---|
| Metricool brand | 7081960 (`historypros`), timezone America/Chicago |
| YouTube | **new channel UCWpNdkDxVXwsIYPqvirudUQ** (the old UC3RLgas… channel sat on an email with a terminated channel; don't use it) |
| Instagram / Threads | history.pros |
| TikTok | historypros |
| Facebook Page | 1375909025599081 |
| Pinterest | historypros, board "History Pros" = 1106689377123861666; pins link to the new YouTube channel |

All of this is in `config/brand.json`.

## Media hosting: Cloudflare R2 (not GitHub)
- GitHub flagged the fwagtx account on Sep 29, 2026 for hosting videos on a `media` branch; raw.githubusercontent
  links stopped working. **Never push videos to GitHub again.** GitHub holds code only.
- Bucket `historypros-media` (account 231999c96851bc148ac14dfa00c54bae), public URL
  https://pub-a568f8ac0409411a9192cbd4a7c4b365.r2.dev, lifecycle deletes objects after 14 days.
- `pipeline/r2.py` uploads over the S3 endpoint with the bucket-only key `historypros-uploader`
  (env vars `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`; allowed domain `*.r2.cloudflarestorage.com`).
  That key can reach only historypros-media.
- `python pipeline/toon_week.py publish <week>` uploads `media_out/<week>-*` and writes `output/<week>/media_base.txt`;
  `payloads` builds the Metricool posts from it. Metricool copies every file to static.metricool.com when a post is scheduled.
- The old account-wide token `historypros-r2-pipeline` can be deleted in Cloudflare once the bucket-only key is confirmed.

## Environments
- History Pros sessions used to run in the **USECODEBAD** environment (shared with Code Bad by mistake).
  History Pros now has its own **HistoryPros** environment (env_01JRxSqkR7Kq7W7MZ5y6KjYP). Put only History Pros
  keys there; never put History Pros keys in another brand's environment.
- A new environment needs: `pip install -r requirements.txt` (the Kokoro voice models download on first use from
  github.com release assets into assets/models/), Chromium (preinstalled at /opt/pw-browsers), and the allowed
  domains above plus the default package-manager list.

## Schedule (as of Sep 30, 2026)
- Everything through **Oct 18** is scheduled in Metricool (2026w40–w42): 5 shorts a day on Instagram, Facebook,
  TikTok, YouTube and Pinterest; long-form on Facebook 11:00, YouTube 16:00 and a Pinterest pin 16:00.
  AI labels off everywhere; every post has a thumbnail.
- Changes made on Sep 29: the Weirdest Deaths, Biggest Heists, Ridiculous Wars and Rome long-forms were moved to
  publish on YouTube on Sep 29 (evening). The China long-form re-post (Oct 3) is a **draft** (the owner uploaded
  China to the new channel by hand); it can be deleted in the Metricool planner. Seven cartoon shorts that first
  went to the old channel are re-posted YouTube-only at 10:30 on Sep 30, Oct 1, 2, 4, 5, 6 and 7.
- Three pinned preview videos (episodes/pinned/) posted Sep 29 at 21:00, 21:20, 21:30 on TikTok and Instagram.
- Weekly routine "History Pros weekly production" runs Tuesdays 02:47 Central (next: Oct 6) and produces the
  week starting 13 days later (Oct 19–25 first). If it still points at the old session in USECODEBAD, rebind it
  to a session in the HistoryPros environment.

## Settings decided by the owner
- Toon look, narrator am_michael at about 175–180 words a minute (whole sentences, short gaps; pipeline/tts.py).
- AI-content labels off on every platform.
- Pinned videos don't promise a fixed schedule ("new true stories every day, full videos on YouTube").
- No living politicians in videos (channel rule); dictators only in a serious tone, never the Nazi flag in shorts.

## Open items
- Owner: pin the 3 preview videos (Coming Up, then Biggest Names, then Welcome), send the GitHub appeal,
  delete the China draft (Oct 3), verify the YouTube channel by phone (custom thumbnails need it),
  check whether the Sep 29 12:00 Wu Zetian short reached the new YouTube channel.
- Check the first R2 upload in the HistoryPros environment, then delete Cloudflare token `historypros-r2-pipeline`.
