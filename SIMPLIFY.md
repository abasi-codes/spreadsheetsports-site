# Simplify for first-time visitors (branch `simplify-ux`)

About two-thirds of visitors come from a YouTube video. They want one of three things: the player or team from the video, the prediction or odds, or normal stats. Before this branch, every page tried to do everything at once. The film hero, subscribe and email asks all came before the visitor knew what the site does. The search was buried. Player pages ran to 10,000 px on a phone.

The rule now is one clear job per page. The summary comes first, details open on demand, the language is plain English, and there is one ask per page. Nothing was deleted that has SEO value. The `<title>`, meta description, canonical and H1 are byte-identical on all 1,514 generated and hand-written pages that existed before (checked against `main`). Content was moved or collapsed into `<details>`, and it stays in the HTML.

Screenshots (gitignored): `redesign_shots/simplify_sheet_<page>.png`. Each sheet is before | after at 1366 px (50% scale) next to before | after at 390 px. The raw shots are `simplify_before_*.png` and `simplify_after_*.png`.

## Global (assets/js/site.js, assets/css/site.css)
- **Nav has the same shape for both sports.** It reads: **NBA | NHL** segmented switch (the active sport is filled white) · Players · Teams · Leaders · Predictions ▾ · one red Subscribe.
  - NBA Teams goes to the new `/teams/`; NHL Teams goes to `/hockey/cup.html`, which is the only hockey team page.
  - The Predictions dropdown lists every tracker. NBA has MVP, Title, ROY, Sixth Man, Underrated, Cursed, No-3 and Contract years, plus "All predictions" (the new `/models/`). Hockey has Cup odds and Underrated.
  - The current section is underlined in red.
- **Mobile menu** has the same items. The sport switch sits at the top, then Players, Teams, Leaders, then Predictions.
- **Newsletter and the social icons moved to the footer.** The footer now has Explore and Follow link columns.
- **One generic newsletter hook.** Any `<div data-nl>` becomes a signup form (site.js boot). Page code no longer wires up its own forms.
- **No email forms inside cards.** The MVP, title and Cup cards no longer carry one. The tracker pages keep their single page-level newsletter.

## Home pages (index.html, hockey/index.html, assets/js/home.js)
- **Compact hero.** It has the H1 (unchanged), a one-line value prop, a big **"Find any player or team"** search (same autocomplete) and **Popular** quick links.
  - NBA links: Wembanyama, SGA, Jokić, Dončić, Brunson, Thunder, Knicks.
  - NHL links: McDavid, Celebrini, MacKinnon, Makar, Matthews, Oilers, Maple Leafs.
  - Hockey search now includes the 32 teams, which link to `cup.html#ABR`.
- **Three doors:**
  - **Player pages** shows a live example: the glance bars of Wembanyama or McDavid.
  - **Leaders** shows the top 3 of two boards: NBA points and rim protection; NHL points and goalie GSAx.
  - **Our predictions** shows the top 3 for MVP and title, or for the Cup.
  - The doors read the small new `data/home.json` and `data/hockey_home.json`, written by the builds.
- **Latest videos** shows at most 3 (it was 6).
- **One newsletter block** near the bottom.
- **Removed:**
  - the film hero with its subscribe and email card (the hero.mp4 files are still on disk, just unused);
  - the "More between videos" socials block;
  - the hockey "The NBA side" card (the sport switch does that job now).
- **Hockey "No vibes, just backtests"** is now one line plus a link to the methods page.

## Player pages (tools/player_profile.py, tools/build_pages.py, tools/hockey_pages.py, assets/js/profile.js)
New order:
1. **Header.** Name, team, position and age, role chips, then the one-sentence scouting summary. Below that, **one** row of 5 basic stats:
   - NBA: PTS REB AST STL BLK;
   - NHL skaters: GP G A P +/-;
   - goalies: GP W SV% GAA SO.
   - The second row of chips is gone; those numbers are in the season table.
2. **At a glance: "What he's good at".** The 6 category bars (3 for goalies). Each row is a `<details>` that opens to that category's metric rows, collapsed by default.
   - Each open row shows a plain-English description, the metrics, notes, the rim or RAPM how-to links and a "<category> leaders" link.
   - Abbreviations appear only inside the open rows and in tooltips.
   - **Season** and **Compare to (All players / Bigs…)** are small segmented controls in the card header.
3. **Season stats table + awards.** These moved up from the very bottom.
4. **Plays like.**
5. **In our models.** A compact grid of chips, each linking to its tracker:
   - NBA: MVP odds (links to `/models/mvp.html#Name`, which opens his card), Underrated, CURSE, No-3, and **his team's title odds** (new);
   - NHL: Underrated and his team's Cup odds.
   - MVP-pool players also get one sentence with their MVP odds and rank, a link "See why, factor by factor", and their 2026-27 projection line.
   - At most **one** related video, shown as a compact thumbnail and title.
6. **How it works + one newsletter ask.** The glossary ("How every number is calculated") and methods links sit beside the single newsletter form. Search for another player follows.

**Removed from player pages:**
- the 11-item sticky jump bar;
- the full embedded MVP model card (it lives on the MVP tracker; MVP-pool player pages now load player.js, not mvp-dig.js);
- the share buttons;
- the per-card email signups;
- videos 2 and 3.

**Still works:**
- `?season=2025`;
- `#c-<category>` links (they open that row);
- `#stats`;
- the remembered "vs position" choice;
- tooltips;
- the Per game | Advanced tabs.

The GA `view_item` event on MVP-pool pages is kept (player.js now sends it). A new `select_content` event, `category`, fires when a row is opened.

## Team pages (NBA /teams/<slug>/, tools/build_pages.py, assets/js/title-dig.js)
- **The odds card now leads.** It shows the odds, rank and conference odds, then **3 "why" bullets**, then a collapsed **"How the model got there"**.
  - Inside the collapsed section: any further bullets, the rating build-up, the odds by model version, the playoff rotation, Finals opponents and the title backtest.
- **Roster comes second.** Then one newsletter block, then "Look up another team".
- The lead sentence now says "Below: why, then the 2026-27 roster".
- On `/models/title.html` the card has the same layout, keeps its share bar and drops the email form.
- The hockey Cup card (`/hockey/cup.html#EDM`, assets/js/cup-dig.js) has the same layout. "How a season is simulated / Ideas that failed" is collapsed into one `<details>`. The duplicate Subscribe button in the newsletter block is removed.

## New index pages (in the sitemap)
- `/teams/`: all 30 teams by conference with title odds and team swatches, plus search.
- `/models/`: every NBA prediction, with headline favourites for MVP and title.

## Leaders (tools/build_leaders.py, tools/hockey_pages.py, assets/js/lb-index.js)
- **Shorter intro.** The explorer button stays prominent.
- **Tabs:**
  - NBA: Top boards · Scoring · Playmaking · Defense & rebounding · Rim protection · Impact · All boards;
  - NHL: Top boards · Scoring · Playmaking · Defense & impact · Goalies · All boards.
- **Six boards by default:**
  - NBA: PPG, RPG, APG, rim protectors, 3-point shooters, impact;
  - NHL: points, goals, points this season, 5v5 defenders, impact, GSAx.
- **"See all N boards"** shows the rest. The tab is kept in the URL (`?tab=rim`).
- **All boards stay in the HTML**, and they all show without JS.
- **"Every leaderboard"** (links plus glossary) is collapsed into one `<details>`.

## Cache-buster and build
- `V = "35"` in build_pages.py (hockey_pages imports it). Every `?v=` on site CSS and JS in the hand-written pages is 35 too: index, hockey/*, models/*, 404.
- Build: `python3 tools/build_pages.py --no-images` then `python3 tools/hockey_pages.py`. The sitemap has 1,531 URLs: +/teams/ and +/models/, nothing removed.
- Checks run (headless Chrome via CDP):
  - zero console errors on all screenshot pages, the explorers, methods, tracker and index pages;
  - no horizontal scroll at 390 px;
  - search autocomplete works (NBA + NHL players and teams);
  - the nav dropdown and mobile menu work;
  - glance rows open, the season and compare toggles work, and `?season=` and `#c-rim` deep links work;
  - tooltips, Per game/Advanced and roster sorting work;
  - the `#IND`, `#Victor-Wembanyama` and `#EDM` hashes open their cards;
  - leaders tabs and the explorer filters work.

## Not changed (and why)
- **Tracker pages** (MVP, title, ROY, Sixth Man, Underrated, Cup) keep their layout. They are the "Predictions" destinations and already have one job. Only the email form inside each card was removed (the Cup page also got the collapsible method section).
- **Explorer pages** are unchanged apart from the nav. They already collapse their filters.
- **Model internals** (backtest tables, factor ladders) are collapsed, not deleted.
- **On phones the sport switch stays in the menu.** The brand, Subscribe and menu button use the full 390 px header, and a squeezed switch would push the logo text out.
- **Hidden CSS for the old jump bar, share block and so on** is left in site.css (unused). It can be cleaned up separately.
- **build_models.py** (which writes models/*.html) was not run, because it needs the video project folders. The models pages were only touched to bump `?v=`.
