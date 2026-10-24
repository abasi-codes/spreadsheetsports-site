# Hockey player pages + leaders (branch `hockey-player-pages`)

The NHL version of the NBA redesign (REDESIGN.md, commit 989c61e): player pages with category scores and percentile cards,
league leader boards, an explorer, per-metric pages and a methods page, all under `/hockey/`.

Local preview: `python3 -m http.server 8790` in this folder, then
- http://localhost:8790/hockey/players/connor-mcdavid/ · /hockey/players/cale-makar/ · /hockey/players/connor-hellebuyck/ (goalie)
- http://localhost:8790/hockey/leaders/ · /hockey/leaders/explore.html · /hockey/leaders/goalies.html · /hockey/leaders/net-impact/
- http://localhost:8790/hockey/methods/

Screenshots (gitignored): `redesign_shots/hockey_*.png`.

## Data: our own numbers from the NHL's public game data

| What | Source | Access |
|---|---|---|
| Play-by-play with shot coordinates, shot type, assists | `api-web.nhle.com/v1/gamecenter/<id>/play-by-play` | logged out, 1 request / 1.6 s, gzip cache in `~/nhl-pages/raw/pbp` |
| Shift charts (who was on the ice) | `api.nhle.com/stats/rest/en/shiftcharts` | 2024-25 + 2025-26 reused from the Overrated-video cache (`~/nhl-overrated/data/raw/nhlapi/shifts`); 2026-27 fetched the same way |
| Season box scores, TOI, hits, blocks, takeaways, giveaways, faceoffs, bios, goalie summaries | `api.nhle.com/stats/rest/en/{skater,goalie}/*` | 27 requests total |

Nothing from MoneyPuck, Evolving-Hockey, Natural Stat Trick, HockeyViz or JFresh is used or republished (the MoneyPuck CSVs that
the video projects used stay out of this pipeline). Only derived numbers and plain box-score facts are published; no raw play-by-play,
no downloads. Model code: `~/nhl-pages/model/{parse,xg,build}.py` (run with `/usr/bin/python3`, numpy only).

Licensing note: the NHL API is public but undocumented, and NHL.com's terms of use reserve rights in its content. Box-score
facts are generally not protected, and we publish only our own derived metrics, but this is the same risk posture as the existing
Cup-odds page. We credit "NHL public game data" on every page and say we're not affiliated with the NHL.

## Design decisions (and why they differ from the NBA)

- **Six skater categories.** Scoring, Playmaking, 5v5 offense, 5v5 defense, Physical & puck, Impact. Hockey has no box-score
  defense worth grading, so both defensive signals come from on-ice expected goals. Box-score D (the NBA's weakest card) has no
  hockey twin.
- **Goalies get their own card.** Shot stopping (GSAx, save % vs expected), By danger (low/medium/high-danger save %, volume-adjusted)
  and Workload. Goalies are compared only with goalies; there's no "vs position" toggle on their pages.
- **Position groups: Forwards and Defensemen.** C/LW/RW are shown in the bio and tables but pooled as forwards for percentiles:
  wingers and centres do the same jobs in most systems, and separate C/W pools would be too small for the D-like stats.
- **Per-60 rates, all situations, for individual numbers** (goals, ixG, primary assists, hits...), with 5v5-only twins where power-play
  time would distort the read (5v5 primary assists). Season totals stay in the box line and the Per game group.
- **On-ice numbers are 5v5 only**, from shift charts, and come in three strengths of evidence: raw on-ice, relative to his team
  (on − off), and RAPM (lineup-adjusted). RAPM carries the most weight because it predicts the next season best (see the backtest); the published RAPM pools two seasons.
- **Finishing is shrunk.** Goals minus expected goals swings with luck, so it's pulled toward zero by shot volume and weighted lightly.
- **Arena-scorer stats are flagged.** Hits, blocks, takeaways and giveaways depend on the rink's scorers. The Physical & puck card
  says so, and the scouting summary reads a low physical score as "plays a low-contact game", not a weakness.
- **Roles: one primary role plus an optional trait.** NBA pages show an offensive and a defensive role; in hockey the familiar
  labels (Sniper, Playmaker, Power Forward, Two-Way Forward, Puck-Moving D, Shutdown D, Physical D) describe the whole player, so
  each skater gets one role and up to one trait (Heavy Hitter, Shot Blocker, Faceoff Ace, Net-Front, Puck Thief, Volume Shooter).
- **2026-27 so far** appears as a box-score line only (header strip, season table, and a "Points this season" board). Ten games is
  too few for percentiles, and the NBA side made the same call for in-season grading.
- **No headshots or logos in lists**: team colour swatches, as on the NBA side. Team links go to the team's card on the Cup-odds page
  (`/hockey/cup.html#EDM`), which is the only hockey team page we have.
- **Model links.** Player pages show "Model verdicts": the Underrated model (players on its 150-player board) and his team's Cup odds.
  The NHL MVP page isn't live (the MVP video publishes Oct 26) so there's no MVP link yet; see decisions below.
- **Reused code.** Same CSS classes and JS as the NBA redesign. `leaders.js` gained a few data attributes (`data-src`, `data-base`,
  meta `min_opts`, `role_labels`, `default_sort`, groups-of-one hide the position controls); `profile.js` reads a `data-glbl` label.
  NBA pages behave exactly as before.

## Build

```
cd ~/nhl-pages
/usr/bin/python3 fetch.py            # resumable; stops on 403/429/non-JSON (raw/STOP)
/usr/bin/python3 model/parse.py      # → work/season_<yr>.pkl
/usr/bin/python3 model/xg.py         # → work/xg_<yr>.npy, data/xg_model.json
/usr/bin/python3 model/build.py      # → data/season_<yr>.json, data/backtest.json
cd ~/spreadsheetsports-site
python3 tools/hockey_metrics.py      # → data/hockey_metrics.json (+ ~/nhl-pages/data/yoy.json)
python3 tools/hockey_pages.py        # → /hockey/players, /hockey/leaders, /hockey/methods, data/hockey_*.json, sitemap
```
`build_pages.py` now also reads `tools/hockey_urls.json`, so an NBA rebuild keeps the hockey URLs in the sitemap.

## Data access result (Oct 23, 2026)

3 test requests, then one background job: **2,981 requests, all HTTP 200, no 403/429/captcha**, ~78 minutes at 1 request per 1.6 s.
Cache: `~/nhl-pages/raw` (38 MB gzip). 2024-25: 1,312 games (1,255 with shift charts; the NHL has none for the other 57).
2025-26: 1,312 games, all with shifts. 2026-27: 165 completed games (134 with shift charts so far).

## Expected goals: backtest (fit on 2024-25 only, scored on every 2025-26 shot)

| Model | Log loss | AUC | xG total | Goals |
|---|---|---|---|---|
| Spreadsheet Sports xG v1.0 | **0.2246** | **0.745** | 7,927 | 7,572 |
| Distance only | 0.2324 | 0.692 | 7,669 | 7,572 |
| League-average rate | 0.2489 | 0.495 | 7,356 | 7,572 |

Calibrated well across deciles except the top one (21.4% predicted vs 18.1% actual) and tip-ins (869 xG vs 720 goals). It was ~5% high
in total out of sample, so published numbers use the model refit on both seasons plus a one-number intercept shift per season
(2024-25 +0.025, 2025-26 −0.024 in log-odds; 2026-27 reuses 2025-26's). Coefficients and the full backtest: `~/nhl-pages/data/xg_model.json`.

## RAPM backtest (fit 2024-25, predict every 2025-26 5v5 shift)

| Predictor | r with shift xG/60 | r with shift goals/60 |
|---|---|---|
| RAPM (ridge, λ = 100,000 s, picked on this test) | **0.0378** | 0.0139 |
| Relative to team (on − off) | 0.0341 | 0.0143 |
| Raw on-ice | 0.0351 | 0.0122 |

RAPM − raw +0.0027 (95% CI +0.0018 to +0.0039), RAPM − relative +0.0037 (+0.0016 to +0.0055), bootstrapped over games.
It wins on next-season expected goals; on actual goals it ties relative-to-team. Covariates (2025-26): home +0.07 xG/60, offensive-zone
start +1.0, defensive-zone start −0.7, trailing teams +0.1.

## Year over year (521 skaters, 50 goalies qualified in both seasons)

Stable: shot distance .96, ixG/60 .95, hits/60 .92, shots/60 .90, blocks/60 .89, goals/60 .80, A1/60 .72. Middling: off. RAPM .57,
rel xGF/60 .64, xGF% .51. Noisy: net RAPM .44, def. RAPM .44, finishing (G − xG) .30, GF% .30, +/- .33.
**ixG/60 predicts next season's goals/60 better than goals/60 does (.822 vs .801).** xGF% and GF% predict next season's GF% about
equally (.298 vs .303). **Goalies barely repeat at all** (GSAx .18, save % .16, dSV% .11; n = 50), and dSV% does not beat plain
save % at predicting next year's save %. The methods page says all of this plainly.

## Eye test, 2025-26 (role · trait · category scores)

| Player | Role | Trait | Read |
|---|---|---|---|
| Connor McDavid | Dual Threat | Net-Front | Scoring 95, Playmaking 98, 5v5 O 99, Impact 98 ✓ |
| Nathan MacKinnon | Dual Threat | Volume Shooter | 99/99/99, 5v5 D 8 ✓ (known) |
| Auston Matthews | Sniper | Shot Blocker | ✓ Sniper; Impact only 51 in his injury year |
| Cale Makar | Puck-Moving D | Puck Thief | ✓; 5v5 D 27 is the surprise |
| Quinn Hughes | Puck-Moving D | – | 5v5 O 98, Impact 92 ✓ |
| Macklin Celebrini | Dual Threat | Puck Thief | ✓ |
| Connor Bedard | Dual Threat | Volume Shooter | 5v5 D 1, Impact 10 ✓ (matches public consensus) |
| Aleksander Barkov | – | – | Missed 2025-26; 2024-25 = Two-Way Star, Faceoff Ace ✓ |
| Matthew Tkachuk | Dual Threat | Net-Front | ✓ (Physical only 5: hits are scorer-dependent) |
| Brady Tkachuk | Dual Threat | Volume Shooter | Impact 99; 2024-25 Power Forward / Heavy Hitter ✓ |
| Sam Reinhart / Mitch Marner / Tom Wilson | Two-Way Star | – / Puck Thief / – | ✓ |
| Jaccob Slavin | Shutdown D | Puck Thief | 5v5 D 91 ✓ |
| Adam Fox / Moritz Seider | Two-Way D | | 5v5 O + D both 75+ ✓ (Dahlin also Two-Way D with pooled RAPM) |
| Connor Hellebuyck | Starter | | 2024-25 Shot stopping 99 (Vezina year) ✓; 2025-26 average (53) |
| Igor Shesterkin / Ilya Sorokin / Andrei Vasilevskiy | Starter | | 88 / 96 / 91 shot stopping ✓ |

Category leaders 2025-26: Scoring Caufield, Guenther, Robertson; Playmaking Pastrnak, Malkin, MacKinnon; 5v5 offense B. Tkachuk,
Hagel, Kucherov; Impact (RAPM) Hagel, Malinski, Seider; finishing Caufield +11.7; GSAx Logan Thompson +35.6, Sorokin, Swayman.
5v5 defense is led by low-event checkers (Bäck, Heinen, Drury, Holmberg), a known trait of on-ice defensive numbers, so the
"Best 5v5 defenders" and "Highest impact" boards show regulars only (1,000+ minutes).

## Decisions applied (user, Oct 23)

1. **Role names:** "Depth Forward" → **Role Forward**, "Depth D" → **Stay-at-Home D** (role text, glossary, explorer filters).
2. **RAPM pooled.** Headline offensive / defensive / net impact = one ridge fit on 2024-25 + 2025-26 stints together
   (1,756,680 team-shifts, 1,064 skaters, same λ = 100,000 s chosen by the cross-season test). It drives the 5v5 offense /
   5v5 defense RAPM rows, the Impact score and the leaderboards, and is the same in both season views. Each RAPM row's note shows
   the season-alone fit ("2025-26 alone: +0.35"). The backtest and the year-over-year table still grade the single-season fits
   (pooled values would repeat by construction). Pooled top 10 net: Hagel, MacKinnon, B. Tkachuk, Spence, Werenski, Fox, Seider,
   R. Thomas, Draisaitl, McDavid. Minute thresholds unchanged. No new API requests (cached data only).
3. **MVP link:** hook in tools/hockey_pages.py (`MVP_LIVE = False`, `MVP_URL = "/hockey/mvp.html"`, reads data/hockey_mvp.json).
   Flip on when the page goes live (Oct 26).
4. **Team colour swatches**, no logos.
5. **Goalie scores kept (0–99)**, with a visible note on the Shot stopping card of every goalie page and on the goalie explorer:
   goalie numbers swing a lot year to year (r ≈ 0.1–0.2), read as one season's form.
6. **No per-player OG images** (hockey pages use /assets/img/og-hockey.png).
7. **Cache-buster V 33 → 34** in build_pages.py and every `?v=` reference (NBA and hockey). NBA pages were rebuilt with
   `build_pages.py --no-images`; the only NBA diff is the cache-buster.
