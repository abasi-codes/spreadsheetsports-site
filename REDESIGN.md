# Player pages redesign + league leaders (branch `redesign-player-pages`)

Local preview: `python3 -m http.server 8790` in this folder, then
- http://localhost:8790/players/victor-wembanyama/ (also `?season=2025`)
- http://localhost:8790/players/jaden-mcdaniels/ · http://localhost:8790/players/tyrese-haliburton/ (defaults to 2024-25)
- http://localhost:8790/leaders/ · http://localhost:8790/leaders/explore.html · http://localhost:8790/leaders/shot-blocking/

Screenshots (gitignored): `redesign_shots/`.

## Why it changed (UX)

The old page was a wall of equal-weight numbers: per-game chips, an MVP card, six percentile tiles, then two tables. A reader had to know what BPM or VORP means to learn anything. The new page answers three questions in order, each one a scroll further down:

1. **Who is he?** Name, team swatch, position, age, height/weight, an offensive and a defensive role chip, and a one-line scouting summary (his top two category scores and his weakest).
2. **What is he good at?** "At a glance": six category scores (0–99) as plain bars, each with a text tier label (Elite / Strong / Average / Below avg / Weak). No radar: bars are faster to compare, and they work on a phone.
3. **Why?** One card per category. Every metric leads with a plain-English name ("Shot blocking"), then the abbreviation small (BLK%), the value and a percentile bar. Every abbreviation has a tooltip with the definition and the exact formula.

Then come Similar players, model verdicts plus channel videos, the MVP card (MVP-pool players), the existing Per game | Advanced tables, Awards, Share + newsletter, and search.

Design choices:
- **Tiers use colour AND text.** The scale runs blue (good) → grey → orange (weak), which is colourblind-safe (no red/green). Red stays the brand accent.
- **One toggle, two comparisons.** "Percentiles vs All players / Guards|Wings|Bigs" swaps every bar and score in place. Both numbers are baked into the HTML, so there's no refetch. The choice is remembered per browser.
- **Season switcher** (2025-26 / 2024-25). A season under 500 minutes shows as a disabled option with the reason ("did not play", "only 312 minutes"). A season under 1,000 minutes shows a "Small sample" warning. `?season=2025` deep-links to a season.
- **Style vs quality.** Rim rate, 3-point rate and corner-3 share describe *how* he plays, not how well. They get a grey bar and a "style" tag and don't count toward any score.
- **Sticky jump bar** (Glance · Scoring · … · Stats · Awards · MVP odds) under the site header. It scrolls sideways on phones and highlights the section in view.
- **Mobile first.** Cards stack, and each metric row becomes name+value on top and bar+percentile below. The explorer collapses its filters, and on phones it hides Pos/Age/MIN so the ranked column is visible.
- Kept: canonical/OG/meta (descriptions gained one clause), GA `view_item`/`share`/`generate_lead`. New `select_content` events cover season, compare toggle, jump links and explorer sort. No logos or headshots: team colour swatches only.

## Page anatomy

```
entity-hero   crumbs · H1 · bio line · role chips · scouting summary · per-game strip
#jump         sticky jump links
.mx           season + compare controls
  .mx-season[data-y]   (one per season, hidden/shown)
     glance → 6 category cards (#c-scoring … #c-impact) → #similar
  glossary    "How every number is calculated" (the formulas behind every tooltip)
#models       model verdict chips + "From the channel" videos
#mvp          MVP model card (MVP pool only; mvp-dig.js)
#stats #awards
#share        share bar + newsletter (non-MVP pages; MVP pages have both in the MVP card)
find          search another player + link to League leaders
```
Players with under 500 minutes in both seasons keep the old layout and get a note.

## Metrics (tools/metrics_export.py → data/metrics.json)

Pool: 500+ minutes that season (379 players in 2025-26, 375 in 2024-25). Percentiles are mid-rank, capped 0–99. They are computed league-wide and within position group (Guard < 2.4 ≤ Wing < 3.6 ≤ Big, from Basketball-Reference's play-by-play position estimate). **Category score** = weighted mean of the graded metrics' percentiles, re-ranked 0–99 within the pool (or within the position group).

| Category | Metric (abbr) | Formula | Weight |
|---|---|---|---|
| Scoring | Scoring volume (PTS/75) | BBRef pts per 100 poss × 0.75 | 2 |
| | True shooting (TS%) | PTS ÷ 2(FGA + 0.44 FTA) | shown |
| | Efficiency vs league (rTS) | TS% − league TS% | 2 |
| | Finishing at the rim (adj Rim FG%) | (rim FGM + 50 × lg rim FG%) ÷ (rim FGA + 50) | 0.75 |
| | Rim attempts share | FGA 0–3 ft ÷ FGA | style |
| | Getting to the line (FTr) | FTA ÷ FGA | 0.75 |
| Shooting | 3-point accuracy (adj 3P%) | (3PM + 100 × lg 3P%) ÷ (3PA + 100) | 2 |
| | 3-point volume (3PA/75) | 3PA per 100 × 0.75 | 1.5 |
| | 3-point rate (3PAr), Corner 3 share | 3PA ÷ FGA; corner 3PA ÷ 3PA | style |
| | Free-throw accuracy (adj FT%) | (FTM + 50 × lg FT%) ÷ (FTA + 50) | 1 |
| Creation | Shot creation est. (SCE/75) | (unassisted 2PM + unassisted 3PM + AST) per 100 × 0.75 | 2 |
| | Creation load | (USG% + AST%) ÷ 2 | 1 |
| | Playmaking (AST%) | BBRef | 1.5 |
| | Self-created makes (Unast%) | 1 − assisted FGM ÷ FGM | 0.5 |
| | Ball security (TOV%) | BBRef, lower is better | 0.5 |
| Perimeter D | Steals (STL%), Defensive box +/- (DBPM), Defensive win shares (DWS × 48 ÷ MP), Defensive rating (DRtg, lower better) | BBRef | 1.5 / 1.5 / 1 / 0.5 |
| Rim & glass | Shot blocking (BLK%), Defensive rebounding (DRB%), Offensive rebounding (ORB%) | BBRef | 2 / 1.5 / 1 |
| Impact | BPM, On/off net, WS/48, VORP | BBRef | 2 / 1 / 1.5 / shown |

**Shot creation est.** is our own, transparent estimate. Ben Taylor's published "Box Creation" and "Passer Rating" are regression formulas on box-score inputs. We did not copy their coefficients. Ours counts baskets created directly: his own unassisted makes plus the teammate makes he assists, using Basketball-Reference's "% assisted" splits.

The volume adjustment means a 4-for-8 shooter isn't ranked as a 50% shooter. Player cards show the adjusted number, with the raw % and attempts underneath. Leaderboards rank and show the adjusted number.

## Roles (rules applied in order; first match wins; thresholds are also in the on-page glossary)

Offense: Primary Creator (AST% ≥ 28, USG% ≥ 20) → Go-To Scorer (USG% ≥ 28) → Secondary Handler (AST% ≥ 18, USG% ≥ 18) → Connector (AST% ≥ 20) → Interior Scorer (big, USG% ≥ 21, 3PAr < .25) → Rim Runner (rim rate ≥ 45%, 3PAr < .15) → Stretch Big (pos ≥ 4.0, 3PAr ≥ .30) → Spot-Up Shooter (3PAr ≥ .45, ≥ 80% of made 3s assisted) → Slasher (guard/wing, rim rate ≥ 30%, USG% ≥ 18) → Play Finisher.

Defense: Rim Protector (BLK% ≥ 4.5) → Rebounder (big, DRB% ≥ 24) → Versatile Defender (STL% ≥ 1.5, BLK% ≥ 1.8, DBPM ≥ 0.5) → Ball Hawk (STL% ≥ 2.3) → Rebounder (wing/big, DRB% ≥ 22) → Big Helper → Perimeter Helper.

### Eye-test check (latest qualified season)

| Player | Season | Offense | Defense | Verdict |
|---|---|---|---|---|
| Victor Wembanyama | 2025-26 | Go-To Scorer | Rim Protector | ✓ |
| Nikola Jokić | 2025-26 | Primary Creator | Rebounder | ✓ |
| Shai Gilgeous-Alexander | 2025-26 | Primary Creator | Versatile Defender | ✓ (long-armed, steals + blocks) |
| Giannis Antetokounmpo | 2025-26 | Primary Creator | Rebounder | ✓ |
| Luka Dončić | 2025-26 | Primary Creator | Perimeter Helper | ✓ |
| Stephen Curry | 2025-26 | Go-To Scorer | Perimeter Helper | ✓ |
| Jalen Brunson | 2025-26 | Primary Creator | Perimeter Helper | ✓ |
| Anthony Edwards | 2025-26 | Go-To Scorer | Perimeter Helper | ✓ |
| LeBron James | 2025-26 | Primary Creator | Perimeter Helper | ✓ |
| Tyrese Haliburton | 2024-25 | Primary Creator | Perimeter Helper | ✓ |
| Jaden McDaniels | 2025-26 | Play Finisher | Versatile Defender | ✓ (defense); offense label is generic |
| Rudy Gobert | 2025-26 | Rim Runner | Rim Protector | ✓ |
| Jarrett Allen | 2025-26 | Rim Runner | Rebounder | ✓ (BLK% 2.9 in 2025-26) |
| Brook Lopez | 2025-26 | Stretch Big | Rim Protector | ✓ |
| Draymond Green | 2025-26 | Connector | Versatile Defender | ✓ |
| Alex Caruso | 2025-26 | Spot-Up Shooter | Ball Hawk | ✓ |
| Dyson Daniels | 2025-26 | Connector | Ball Hawk | ✓ |
| Klay Thompson | 2025-26 | Spot-Up Shooter | Perimeter Helper | ✓ |
| Domantas Sabonis | 2025-26 | Secondary Handler | Rebounder | ✓ |
| Evan Mobley | 2025-26 | Interior Scorer | Rim Protector | ✓ |
| Chet Holmgren | 2025-26 | Stretch Big | Rim Protector | ✓ |
| Karl-Anthony Towns | 2025-26 | Play Finisher | Rebounder | ✗: should read as a scoring/stretch big. His play-by-play position estimate (< 4.0) and usage (< 28) slip between rules |

**Role names are a user decision.** We avoided "Perimeter Stopper" because box-score data can't tell who a player guards. Steals-heavy defenders are "Ball Hawk" instead. "Play Finisher" is the catch-all, since "Post Scorer" needs post-up data we don't have and was renamed "Interior Scorer". The KAT miss needs a rule tweak, which the user should weigh against moving wings like OG Anunoby into "Stretch Big".

## Rim protection: data-source options (user to pick)

Today the Rim & glass card says "Shot blocking" (BLK%). It carries a "Rim protection (opponent FG% at the rim): coming soon" note. We don't invent a rim-protection number.

- **(a) NBA.com defense tracking** (opponent FG% at the rim, contests). This is the best quality, but it's NBA Stats data and its terms restrict reuse and republishing. We'd need permission, or would have to stick to brief commentary use.
- **(b) Our own on/off opponent rim FG%, derived from play-by-play.** Parse every game's play-by-play (shot distance is in the text) and compute the opponent rim FG% and rim attempt rate with the player on vs off the floor. It's fully ours and transparent, but noisy (lineup effects) and needs ~1,230 games of play-by-play per season plus lineup reconstruction. That means a careful, rate-limited scrape or a licensed play-by-play feed. It also unlocks on/off **defense** (DRtg on/off), which we can't show today.
- **(c) License or partnership.** Second Spectrum/Genius, Synergy, or a stats partner such as PBP Stats, Cleaning the Glass or Basketball Index. Clean data and the right to publish, at a cost.

## Leaders

- `/leaders/`: 12 preset boards (top 10 each, 2025-26). Each links to its full list and to the explorer with the same filter.
- `/leaders/explore.html`: rank by any metric or category score, then filter by season, position, offensive/defensive role, team, age range, minimum minutes and name. There's a column view per category, "vs all / vs position" shading, sortable headers, and every setting in the URL (`?sort=blk&pos=B&min=1000`). No CSV export.
- `/leaders/<metric>/`: 30 static, crawlable pages (6 category scores + every graded or shown metric). Each has its own title, description and canonical, and appears in the sitemap (588 URLs total).
- Nav: "Leaders" is added between Title Odds and More models (and in the mobile menu).

## Build

`adv_export.py → metrics_export.py → build_models.py → build_pages.py` (build_pages calls build_leaders). `tools/` is gitignored as before, so the scripts live locally only. The 4 pages fetched for this work are in `tools/raw/`: Basketball-Reference shooting + per-100 for 2025 and 2026, fetched logged-out with curl, 12 s apart. Cache-buster V=32, DATA_V=6.

## Known gaps

- No on/off defense: Basketball-Reference's play-by-play summary only splits net rating (see option b).
- Box-score defense (DBPM/DWS) flatters steal- and rebound-heavy bigs. Jokić scores 95 in Perimeter D. The card says to read it as rough.
- Phase 1 covers 2024-25 and 2025-26 only. There are no metrics for 2023-24, and 2024-25 players without a site page (out of the league) count in the percentile pools but aren't listed.
- Similar players compares within the same season only. The match % is a scaled distance, not a probability.
- OG share cards (assets/og) were not re-rendered: the build ran with `--no-images`.
- Team on a leaders row = the team he finished that season with (Basketball-Reference), not his 2026-27 team.
