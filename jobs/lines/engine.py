"""Hit-rate engine: player x stat x threshold, from the stored box scores.

Every row uses a FIXED window (last 10 games, last 10 home/away games, every game vs tonight's opponent in
the last two seasons). We never pick the window that flatters the number.
"""
import re
import unicodedata

# Milestone ladders ("25+ points"). The main line is the rung closest to a coin flip over the player's last 10 games
# (his current role), the same way a market line sits near 50%; ties go to the higher rung. The next rung down is
# kept as an "alt" line when it isn't a lock.
LADDERS = {
    "nba": {"pts": [5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 45, 50], "reb": list(range(2, 17)), "ast": list(range(2, 15)),
            "fg3m": [1, 2, 3, 4, 5, 6, 7]},
    "nhl": {"pts": [1, 2, 3], "g": [1, 2], "a": [1, 2], "sog": [2, 3, 4, 5, 6]},
}
LABEL = {"pts": "points", "reb": "rebounds", "ast": "assists", "fg3m": "threes", "g": "goals", "a": "assists", "sog": "shots on goal"}
COLS = {"nba": ["min", "pts", "reb", "ast", "fg3m", "stl", "blk", "tov"], "nhl": ["g", "a", "pts", "sog"]}
TEAM_LADDER = {"nba": [95, 100, 105, 110, 115, 120, 125, 130, 135], "nhl": [2, 3, 4, 5]}


def fold(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[.'’]", "", s)
    s = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


class Index:
    """Per-player and per-team appearance lists, most recent first."""

    def __init__(self, sport, games, names):
        self.sport, self.names = sport, names
        self.player, self.team = {}, {}
        cols = COLS[sport]
        for g in sorted(games, key=lambda x: (x["d"], x["id"])):
            for side, opp, home, pf, pa in ((g["h"], g["a"], True, g["hs"], g["as"]), (g["a"], g["h"], False, g["as"], g["hs"])):
                self.team.setdefault(side, []).append({"d": g["d"], "sy": g["sy"], "opp": opp, "home": home, "win": int(pf > pa), "pts": pf, "id": g["id"]})
            for row in g["p"]:
                pid, team = row[0], row[1]
                opp, home = (g["a"], True) if team == g["h"] else (g["h"], False)
                st = dict(zip(cols, row[2:]))
                self.player.setdefault(pid, []).append({"d": g["d"], "sy": g["sy"], "team": team, "opp": opp, "home": home, "id": g["id"], **st})
        for v in self.player.values():
            v.reverse()
        for v in self.team.values():
            v.reverse()


def rate(apps, stat, k):
    hits = sum(1 for a in apps if a[stat] >= k)
    return [hits, len(apps)]


def streak(apps, stat, k):
    """+n = hit the last n in a row, -n = missed the last n in a row."""
    if not apps:
        return 0
    first = apps[0][stat] >= k
    n = 0
    for a in apps:
        if (a[stat] >= k) != first:
            break
        n += 1
    return n if first else -n


def card_rows(apps, stat, k, opp, home, season, cur_team=None):
    l10 = apps[:10]
    vs = [a for a in apps if a["opp"] == opp][:10]
    ven = [a for a in apps if a["home"] == home][:10]
    szn = [a for a in apps if a["sy"] == season]
    r = {"k": k, "l5": rate(apps[:5], stat, k), "l10": rate(l10, stat, k), "vs": rate(vs, stat, k), "ven": rate(ven, stat, k),
         "szn": rate(szn, stat, k), "streak": streak(apps, stat, k),
         "avg10": round(sum(a[stat] for a in l10) / len(l10), 1) if l10 else None,
         "last": [a[stat] for a in l10]}
    # consistency score for sorting: pooled rate over the three headline rows, shrunk toward 50% for small samples
    h = r["l10"][0] + r["vs"][0] + r["ven"][0]
    n = r["l10"][1] + r["vs"][1] + r["ven"][1]
    r["score"] = round((h + 2) / (n + 4), 4)
    return r


def pick_rungs(apps, stat, ladder):
    """Main rung: closest to 50% over the last 10 games (ties -> higher). Alt rung: the next one down, unless it's 10/10."""
    last = apps[:10]
    if len(last) < 3:
        return []
    best, best_d = None, 9
    for k in ladder:
        p = sum(1 for a in last if a[stat] >= k) / len(last)
        d = abs(p - 0.5)
        if d <= best_d + 1e-9:
            best, best_d = k, d
    out = [best]
    i = ladder.index(best)
    if i > 0:
        lower = ladder[i - 1]
        if rate(apps[:10], stat, lower)[0] < min(10, len(apps[:10])):
            out.append(lower)
    return out
