# Linemate study: what we copy and what we do better

I studied linemate.io on Oct 26 2026 while **logged out** (fresh headless Chrome profile, a handful of page loads, no sign-in, no data scraped).
- Pages: `/nba`, `/nba/trends`, a game page (MIN @ CLE), `/nhl`, `/responsible-gambling`.
- Reference screenshots are kept off the repo, in `~/research/linemate_shots/` on the owner's Mac (they show sportsbook logos).

## 1. Page structure
- **Top bar:**
  - logo and sport dropdown (NBA / NHL / NFL…);
  - Home · Trends · Tools ▾;
  - Log in / Start free trial;
  - icons: search, "My Picks" slip, light/dark toggle.
  - On a phone it collapses to logo + icons + hamburger.
- **Home (`/nba`):**
  - **"Today's Matchups · Oct 26"**: a grid of game chips. Each chip has both logos, abbreviations, "Today" and the tip time, on a soft two-colour blur of the team colours. NBA had 9 chips, NHL 3.
  - **"Trending today for Most bet on ▾"**: 3 big prop cards.
  - **Offers (daily picks):** affiliate promos.
  - **Cheatsheets:** lists titled "Props that hit in 100% of games" (Recent form, Versus opponent, Alternate lines, 1st quarter, Home/Away, Team form, Unders only), each row like "I. Collier: Over 5.5 Points 20/20".
  - **Parlays for WAS @ CHA:** pairs of legs, "Each leg hit in 4 of last 4 games".
  - **Right rail:** My Picks, a paid-tier ad, then sportsbook and fantasy offers.
- **Trends (`/nba/trends`)** and the **Game page ("Game Summary")** share a two-pane layout:
  - **Left: a list.**
    - Header "Trends" / "Game Summary" with a filter icon.
    - Segmented tabs **Player | Team | Parlay | SGP** (the game page has Player | Team | SGP).
    - Scrolling prop cards.
  - **Right: detail.**
    - For a prop: "Hit Rates" (3 tiles), a bar chart of the last games with the line drawn across, a Stats table (Per Game / Total; Recent form vs Season), a blurred paid-tier panel and a full Gamelog with All / Last 10 / Head to Head / Away tabs.
    - For a game: matchup info (records, division rank, date, arena), team records (Season / Last 5 / Head to Head), head-to-head box stats.
    - Plus a moneyline / spread / total price grid with sportsbook icons.
- **Mobile (390 px):** the list becomes the whole page. There's no right pane; tapping a card opens the detail.

## 2. Card anatomy (the bit we're copying)
```
[team logo]  C. Spencer @ UTA                    -106 [book icon]
             Over 11.5 PTS+AST+REB
 ⚡ Hit in 6 of last 7 games                          86%
 🛡 Hit in 3 of last 4 games vs UTA                   75%
 📍 Hit in 9 of last 10 away games                    90%
```
- **Header:** team logo in a team-coloured circle, abbreviated name ("C. Spencer"), "@ UTA" / "vs UTA" in grey, the market on line 2 ("Over 11.5 Points", "Under 1.5 Steals", alt lines read "18+ Points"), and the price at the top right with a sportsbook logo.
- **Three rows with icons:** bolt = recent form, shield = head to head, pin = home/away. Each is a sentence plus a right-aligned %.
- **Trending cards on Home** add up to 3 more rows:
  - "Hit in 9 of last 9 games without Andrew Nembhard" (injury impact);
  - "Hit in 4 of last 4 games as a starter";
  - "MIL is a good Points matchup · 30th" (opponent rank, with a trophy icon).
- **Sample windows change from card to card:** L4, L5, L7, L11, L13, L20. These are not fixed windows. They look chosen to make the % high (e.g. "12 of last 13"). The recent-form window also runs across seasons: "last 7" included April 2026 games.
- **Which props get shown:** on the game page every visible card had **all three rows ≥ 75%**. Overs and unders are mixed, and so are odd markets (1Q rebounds, turnovers, steals). The selection is "find props where every trend looks strong", with no check on whether the price already reflects that.
- **No streak badge on the cards.** Streaks only show up as "N/N" in the 100% cheatsheets.

## 3. Filters and sort
- **Filter panel (modal on mobile):**
  - Alternate Lines toggle;
  - Display Games (All Games or specific games);
  - O/U: Over+Under / Over / Under;
  - Bet Types: Points, Assists, Rebounds, 3PTM, Steals, Turnovers, Blocks, combos, double/triple double, 1Q props;
  - Trends: Recent Form, Head to Head, Home/Away Splits, Opponent Rank, Injury Impact, Starter;
  - Apply.
- **No user-facing sort and no hit-rate threshold control.** Ordering is theirs (Home has "Most bet on ▾").
- **Game / slate navigation:**
  - Today's chips → Game Summary page.
  - "Display Games" filter on Trends.
  - No date picker for past or future slates.

## 4. Monetisation, disclaimers, empty states
- **Paywall:** Linemate+ (free trial). The signal panels are blurred with "00 of last 00" placeholders.
- **Affiliate offers everywhere:** deposit matches, "first bet" offers, sportsbook logos on every price, a price-comparison box.
- **Disclaimer:** only on a separate `/responsible-gambling` page.
  - It says the content is "for entertainment and research purposes only", 21+ US / 18+ Canada, "not a sportsbook", and that nothing is a recommendation.
  - It lists helplines per state and province.
  - The disclaimer is not on the card pages themselves.
- **Empty states:** I couldn't see one (both leagues had games). The list shows a spinner while loading.

## 5. What we copied
- The card layout:
  - team badge, name, "vs/@ OPP", the line, then 3 icon rows with a sentence and a right-aligned %;
  - the same three questions (recent form, head to head, home/away).
- Today's game chips at the top as the slate navigator, and Player | Team tabs.
- A filter for stat type and an "alt lines" idea: our lines are milestones ("25+ points").
- A one-tap detail view: our collapsed "Details" holds the last-10 bar chart with the line drawn across.

## 6. What we do better (the "spreadsheet" angle)
1. **Fixed, honest windows.**
   - Every card uses the same windows: last 10 games, every game vs the opponent in two seasons, last 10 home (or away) games.
   - No cherry-picked "12 of last 13". The sample is stated on the page ("2025-26 + 2026-27, regular season + playoffs").
2. **Line chosen near a coin flip, not near 100%.**
   - Our main rung is the one closest to 50% over the player's last 20 games, which is where a fair market line would sit. A safer rung is shown underneath.
   - Then the three rows show how recent form, the opponent and the venue move him off that baseline. That is the real signal.
3. **Transparent sorting and filters.** Linemate has neither.
   - The user picks the sort: most consistent (a pooled rate, shrunk for small samples), last 10, streak, vs opponent, season.
   - The user sets a minimum hit rate and a stat type.
   - Users see why a card ranks where it does.
4. **Results are graded on the page.** Once a game is final, each card shows the actual number with ✓ / ✗, so the page keeps score on itself.
5. **Streak badge** ("🔥 4 in a row"), which Linemate's cards don't have.
6. **Links into our models.** Every name opens our player page (scores, roles, MVP odds), and teams open our team / Cup-odds pages.
7. **No sportsbooks, no affiliate offers, no paywall.** The disclaimer sits on the page itself, not on a separate legal page.
8. **Newcomer-first:**
   - search at the top;
   - a one-line summary of the slate;
   - the 3 rows first, with details collapsed;
   - one ask per page (the existing footer only, no extra signup).

## 7. Not copied, on purpose
- Unders, 1Q props, parlays and SGP builders. These are betting-product features. Unders could come later if the owner wants them.
- "Most bet on" trending: we have no betting-volume data.
- Injury-impact rows ("without X") and the opponent-rank row. Good ideas for v2 once we decide how to compute them transparently.
