# Kalshi API and data terms: can we show their prices on spreadsheetsports.com?

Checked Oct 26 2026, logged out. Sources:
- Kalshi Developer Agreement v1.1 (the API docs at docs.kalshi.com link to it as kalshi.com/developer-agreement; that page returned HTTP 429 to our fetcher, so we read the published PDF: https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf).
- Kalshi Data Terms of Use: https://kalshi-public-docs.s3.amazonaws.com/kalshi-data-terms-of-service.pdf. A paraphrased copy at playkalshi.com/kalshi-data-terms-of-use says the same thing.
- Rate limits: https://docs.kalshi.com/getting_started/rate_limits.md

## Verdict: public display is NOT permitted without Kalshi's written permission

So we **stopped the Kalshi part**, as the brief said to. Nothing in the job calls Kalshi, and no Kalshi data is stored or committed. During research we made one exploratory read of the public markets endpoint (5 markets) to see the data shape.

### What the documents say

**Developer Agreement**

- **Section 3:** "Use of Kalshi APIs is expressly limited to facilitating a members own trading on the Exchange; all other usages are disallowed."
- **Section 3.1:** Prohibits "Collecting, caching, aggregating, or storing data or content accessed via the API except for purposes of facilitating your own trading on Kalshi. You may not share such data or content with third parties in any manner without prior written authorization from Kalshi."
- **Section 3.7:** No sublicensing the API to a third party.
- **Section 4.1:** API users must be Kalshi members, accept the agreement and register contact details.
- **Section 6.4:** Prior written approval is needed for any "public announcements … promotional or marketing materials, relating to Kalshi, the Kalshi Marks…".
  - So even a "Prices from Kalshi" credit line on a public page is a public statement that relates to Kalshi.
- **Sections 2.3 and 5:** Rate limits can change without notice.
- **Section 4.3:** Use exponential backoff on errors and a bounded number of retries.

**Data Terms of Use**

These cover "volume, bid-ask prices, … settlement prices, … open interest".

- **Section I:** Personal, non-commercial use only. Using the data to develop "any software program" or "providing archived or cached data sets" needs prior written consent.
- **Section II:** Without prior written authorization, you are "strictly prohibited from … copying, reproducing, … distributing, disseminating, publicly displaying, publishing, … creating derivative works, … scraping, compiling".
  - It also bars using the data to build "products, services … or any other derivative works".
  - It also bars "systematic retrieval" by scripts or robots.
- **Section II (bold clause):** Bans any use of Kalshi Data with AI or machine-learning tools "to generate any information, material, data, derived works, content, or output".

**Rate limits**

- The limits are published for authenticated requests only. Basic tier: 200 read tokens per second, about 20 requests per second.
- Unauthenticated public reads don't have a published allowance.

### What this rules out for the Lines page

- An hourly job that pulls Kalshi prices and publishes them (or implied %, or a "hit rate vs market" edge derived from them) on a public website.
  - That is storing, redistributing and publicly displaying Kalshi Data, plus a derivative work.
  - It is not "facilitating your own trading".
- Attribution doesn't fix this. The terms have no "display with attribution" allowance.

### What's still fine

- Our own hit rates from box scores (ESPN / NHL public JSON). These are factual game stats, not Kalshi Data.
- Milestone lines we define ourselves ("25+ points"). Kalshi's ladders use the same round numbers, but we don't read them.

### How to switch prices on legitimately (owner decision)

1. **Ask Kalshi for written permission or a data licence.**
   - Kalshi already licenses its data to media (CNBC, Fox, Tradeweb, ProCap), and Kalshi is on our sponsor-prospect list.
   - A sponsor deal or affiliate deal that includes a display licence would cover it. Get it in writing, with the attribution wording they want.
2. **Once permission is in hand:** add a price fetcher to `jobs/lines/` that fills the `prices` slot in `data/lines_*.json`. The page already has the UI for it, hidden while `prices` is null:
   - price shown as American odds plus implied %;
   - the neutral "Hit rate vs market" column and sort.
   - The display rules proposed in the brief:
     - use the midpoint when the spread is 10¢ or less, otherwise the last trade if recent, otherwise hide;
     - hide markets with no bid or tiny volume / open interest.
   - What we saw on Oct 26 at 4:30 PM PT: many rungs had $0 volume, $0 open interest and no bid (e.g. "Jaden McDaniels: 30+", ask 17¢, no bid). The liquidity filter would hide a large share of the ladder. Suggested thresholds: bid present, spread ≤ 10¢, open interest ≥ 100 contracts, or 24h volume ≥ 50.
3. **Alternatives that allow display:** a licensed odds or data feed, or a prediction market whose terms explicitly allow redistribution. Each needs its own terms check. Never show sportsbook names or logos either way (site rule).

*Not legal advice. This is a plain reading of the published terms. If the owner wants to rely on a narrower reading, ask Kalshi directly.*
