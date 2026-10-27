"""Current-season player stats and standings for the player/team pages (same hourly job as the Lines).

Writes data/season_nba.json, data/season_nhl.json, data/standings_nba.json, data/standings_nhl.json.
- NBA player stats: computed from the box scores already stored in jobs/lines/state/nba (regular season only).
- NHL player stats: the NHL's public stats reports (3 calls: skater summary, skater realtime, goalie summary).
- Standings: ESPN standings JSON (NBA), cross-checked against W-L computed from stored results; api-web.nhle.com
  standings (NHL).
Players are keyed by the site's own page slug, so the page script can look itself up.
"""
import json
import os

import engine
import nba
from net import get_json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA = os.path.join(ROOT, "data")


def season_label(end_year):
    return f"{end_year - 1}-{str(end_year)[2:]}"


def _site_index(fname):
    """fold(name) -> [(team, slug)] from the site's search index."""
    out = {}
    for r in json.load(open(os.path.join(DATA, fname))):
        h = r.get("href", "")
        if "/players/" in h:
            slug = h.rstrip("/").split("/")[-1]
            out.setdefault(engine.fold(r["name"]), []).append((r.get("meta", "").split(" ")[0], slug))
    return out


def _match(idx, name, team):
    c = idx.get(engine.fold(name), [])
    for t, s in c:
        if t == team:
            return s
    return c[0][1] if len(c) == 1 else None


def nba_season(games, names, end_year, log=print):
    """Per-game averages for every player this regular season, keyed by site slug."""
    tot = {}
    last = ""
    for g in games:
        if g["sy"] != end_year or g["st"] != 2:
            continue
        last = max(last, g["d"])
        for r in g["p"]:
            if len(r) < 16:
                continue
            pid = r[0]
            t = tot.setdefault(pid, {"team": r[1], "d": "", "n": 0, "v": [0] * 14})
            if g["d"] >= t["d"]:
                t["team"], t["d"] = r[1], g["d"]
            t["n"] += 1
            for i, x in enumerate(r[2:16]):
                t["v"][i] += x
    site = _site_index("search.json")
    out, unmatched = {}, []
    for pid, t in tot.items():
        nm = names.get(pid, pid)
        slug = _match(site, nm, t["team"])
        if not slug:
            unmatched.append(nm)
            continue
        mn, pts, reb, ast, fg3m, stl, blk, tov, fgm, fga, fg3a, ftm, fta, gs = t["v"]
        n = t["n"]
        pc = lambda a, b: round(100 * a / b, 1) if b else None
        out[slug] = {"t": t["team"], "gp": n, "gs": gs, "min": round(mn / n, 1), "pts": round(pts / n, 1), "reb": round(reb / n, 1),
                     "ast": round(ast / n, 1), "stl": round(stl / n, 1), "blk": round(blk / n, 1), "tov": round(tov / n, 1),
                     "fg": pc(fgm, fga), "fg3": pc(fg3m, fg3a), "ft": pc(ftm, fta), "fg3m": round(fg3m / n, 1)}
    log(f"[season nba] {len(out)} site players with {season_label(end_year)} stats, {len(unmatched)} players without a site page")
    teams = {t: engine.fold(n).replace(" ", "-") for t, n in nba.NAMES.items()}
    return {"season": season_label(end_year), "through": last, "teams": teams, "players": out, "unmatched": len(unmatched)}


def _toi(sec):
    sec = int(round(sec or 0))
    return f"{sec // 60}:{sec % 60:02d}"


def nhl_season(end_year, log=print):
    sid = f"{end_year - 1}{end_year}"
    q = f"?limit=-1&cayenneExp=seasonId={sid}%20and%20gameTypeId=2"
    base = "https://api.nhle.com/stats/rest/en/"
    summ = get_json(base + "skater/summary" + q)["data"]
    real = {r["playerId"]: r for r in get_json(base + "skater/realtime" + q)["data"]}
    goal = get_json(base + "goalie/summary" + q)["data"]
    by_id = {p["id"]: p["s"] for p in json.load(open(os.path.join(DATA, "hockey_metrics.json")))["players"]}
    site = _site_index("hockey_search.json")
    team = lambda x: (x or "").split(",")[-1].strip()     # traded players list every team; the last is the current one
    out, unmatched = {}, 0
    for r in summ:
        slug = by_id.get(r["playerId"]) or _match(site, r["skaterFullName"], team(r["teamAbbrevs"]))
        if not slug:
            unmatched += 1
            continue
        rt = real.get(r["playerId"], {})
        out[slug] = {"t": team(r["teamAbbrevs"]), "gp": r["gamesPlayed"], "g": r["goals"], "a": r["assists"], "p": r["points"],
                     "pm": r["plusMinus"], "pim": r["penaltyMinutes"], "ppp": r["ppPoints"], "sog": r["shots"],
                     "sh": round(100 * r["shootingPct"], 1) if r.get("shootingPct") is not None else None,
                     "toi": _toi(r["timeOnIcePerGame"]), "hit": rt.get("hits"), "blk": rt.get("blockedShots"),
                     "fo": round(100 * r["faceoffWinPct"], 1) if r.get("faceoffWinPct") else None}
    goalies = {}
    for r in goal:
        slug = _match(site, r["goalieFullName"], team(r["teamAbbrevs"]))
        if not slug:
            unmatched += 1
            continue
        goalies[slug] = {"t": team(r["teamAbbrevs"]), "gp": r["gamesPlayed"], "gs": r["gamesStarted"], "w": r["wins"], "l": r["losses"],
                         "otl": r["otLosses"], "sv": r["savePct"], "gaa": r["goalsAgainstAverage"], "so": r["shutouts"], "sa": r["shotsAgainst"]}
    log(f"[season nhl] {len(out)} skaters + {len(goalies)} goalies matched to site pages, {unmatched} without a site page")
    return {"season": season_label(end_year), "players": out, "goalies": goalies, "unmatched": unmatched}


# ---------- standings ----------
def nba_standings(games, end_year, log=print):
    d = get_json("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings")
    # our own W-L from stored finals, to cross-check ESPN
    mine = {}
    for g in games:
        if g["sy"] != end_year or g["st"] != 2:
            continue
        for t, w in ((g["h"], g["hs"] > g["as"]), (g["a"], g["as"] > g["hs"])):
            m = mine.setdefault(t, [0, 0])
            m[0 if w else 1] += 1
    confs, diffs = [], []
    for c in d["children"]:
        rows = []
        for e in c["standings"]["entries"]:
            s = {x.get("name") or x.get("type"): x for x in e["stats"]}
            v = lambda k: s.get(k, {}).get("value")
            dv = lambda k: s.get(k, {}).get("displayValue")
            ab = nba.ab(e["team"]["abbreviation"])
            full = nba.NAMES.get(ab, e["team"]["displayName"])
            rows.append({"t": ab, "name": full, "short": "Trail Blazers" if full.endswith("Trail Blazers") else full.split(" ")[-1], "w": int(v("wins") or 0), "l": int(v("losses") or 0),
                         "pct": dv("winPercent"), "gb": dv("gamesBehind"), "seed": int(v("playoffSeed") or 0),
                         "home": dv("Home"), "road": dv("Road"), "l10": dv("Last Ten Games"), "strk": dv("streak"),
                         "ppg": dv("avgPointsFor"), "opp": dv("avgPointsAgainst"), "diff": v("differential")})
            if ab in mine and mine[ab] != [rows[-1]["w"], rows[-1]["l"]]:
                diffs.append(f"{ab} ESPN {rows[-1]['w']}-{rows[-1]['l']} vs stored {mine[ab][0]}-{mine[ab][1]}")
        rows.sort(key=lambda r: (r["seed"] or 99, -r["w"]))
        confs.append({"name": c["name"].replace(" Conference", ""), "teams": rows})
    log(f"[standings nba] {sum(len(c['teams']) for c in confs)} teams; ESPN vs stored results: "
        + (f"{len(diffs)} differ (usually games finished since our last stored date): " + "; ".join(diffs[:6]) if diffs else "all match"))
    return {"season": season_label(end_year), "conferences": confs, "check": {"differ": len(diffs)}}


def nhl_standings(end_year, log=print):
    d = get_json("https://api-web.nhle.com/v1/standings/now")
    rows = []
    for s in d.get("standings", []):
        rows.append({"t": s["teamAbbrev"]["default"], "name": s["teamName"]["default"], "short": (s.get("teamCommonName") or s["teamName"])["default"], "conf": s["conferenceName"], "div": s["divisionName"],
                     "divseq": s["divisionSequence"], "confseq": s["conferenceSequence"], "wc": s["wildcardSequence"],
                     "gp": s["gamesPlayed"], "w": s["wins"], "l": s["losses"], "otl": s["otLosses"], "pts": s["points"],
                     "pp": round(s["pointPctg"], 3), "gf": s["goalFor"], "ga": s["goalAgainst"], "diff": s["goalDifferential"],
                     "l10": f'{s["l10Wins"]}-{s["l10Losses"]}-{s["l10OtLosses"]}', "strk": f'{s.get("streakCode", "")}{s.get("streakCount", "")}'})
    log(f"[standings nhl] {len(rows)} teams")
    return {"season": season_label(end_year), "date": d.get("standings", [{}])[0].get("date") if rows else None, "teams": rows}
