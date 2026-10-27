"""NBA source: ESPN's public (logged-out) site API.

scoreboard(date) -> games on that US date; box(event_id) -> compact box score;
injuries(event_id) -> {espn_player_id: status} for an upcoming game.
"""
from net import get_json

BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
# ESPN abbreviations -> the usual NBA ones
FIX = {"GS": "GSW", "NY": "NYK", "SA": "SAS", "NO": "NOP", "UTAH": "UTA", "WSH": "WAS"}
TEAMS = {"ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA",
         "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"}
NAMES = {"ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets", "CHA": "Charlotte Hornets", "CHI": "Chicago Bulls",
         "CLE": "Cleveland Cavaliers", "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets", "DET": "Detroit Pistons", "GSW": "Golden State Warriors",
         "HOU": "Houston Rockets", "IND": "Indiana Pacers", "LAC": "LA Clippers", "LAL": "Los Angeles Lakers", "MEM": "Memphis Grizzlies",
         "MIA": "Miami Heat", "MIL": "Milwaukee Bucks", "MIN": "Minnesota Timberwolves", "NOP": "New Orleans Pelicans", "NYK": "New York Knicks",
         "OKC": "Oklahoma City Thunder", "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers", "PHX": "Phoenix Suns", "POR": "Portland Trail Blazers",
         "SAC": "Sacramento Kings", "SAS": "San Antonio Spurs", "TOR": "Toronto Raptors", "UTA": "Utah Jazz", "WAS": "Washington Wizards"}
SEASON_TYPES = {2, 3, 5}          # regular season, playoffs, play-in (preseason and All-Star are skipped)
# columns of a compact player row: [player_id, team, MIN, PTS, REB, AST, 3PM, STL, BLK, TOV]
COLS = ["min", "pts", "reb", "ast", "fg3m", "stl", "blk", "tov"]


def ab(x):
    return FIX.get(x, x)


def scoreboard(date):
    """date 'YYYY-MM-DD' (US calendar date ESPN files the game under)."""
    d = get_json(f"{BASE}/scoreboard?dates={date.replace('-', '')}")
    out = []
    for e in (d or {}).get("events", []):
        c = e["competitions"][0]
        side = {t["homeAway"]: t for t in c["competitors"]}
        if "home" not in side or "away" not in side:
            continue
        h, a = ab(side["home"]["team"].get("abbreviation", "")), ab(side["away"]["team"].get("abbreviation", ""))
        if h not in TEAMS or a not in TEAMS:
            continue
        st = e.get("season", {}).get("type")
        out.append({
            "id": e["id"], "start": e["date"], "state": e["status"]["type"]["state"],   # pre / in / post
            "detail": e["status"]["type"].get("shortDetail", ""), "stype": st, "season": e.get("season", {}).get("year"),
            "home": h, "away": a,
            "hs": int(side["home"].get("score") or 0), "as": int(side["away"].get("score") or 0),
            "colors": {h: side["home"]["team"].get("color"), a: side["away"]["team"].get("color")},
        })
    return out


def _num(v):
    try:
        return int(str(v).split("-")[0].replace("+", ""))
    except ValueError:
        return 0


def summary(event_id):
    return get_json(f"{BASE}/summary?event={event_id}")


def box(event_id, game, d=None):
    """Compact box score for a finished game. Returns (game_record, {pid: name})."""
    d = d or summary(event_id)
    if not d or "boxscore" not in d:
        return None, {}
    rows, names = [], {}
    for t in d["boxscore"].get("players", []):
        team = ab(t["team"]["abbreviation"])
        st = t["statistics"][0]
        keys = st.get("keys") or []
        idx = {k: i for i, k in enumerate(keys)}
        need = {"min": "minutes", "pts": "points", "reb": "rebounds", "ast": "assists",
                "fg3m": "threePointFieldGoalsMade-threePointFieldGoalsAttempted", "stl": "steals", "blk": "blocks", "tov": "turnovers"}
        if any(v not in idx for v in need.values()):
            continue
        for a in st.get("athletes", []):
            s = a.get("stats") or []
            if a.get("didNotPlay") or not s:
                continue
            vals = [_num(s[idx[need[c]]]) for c in COLS]
            if vals[0] <= 0:
                continue
            pid = a["athlete"]["id"]
            names[pid] = a["athlete"]["displayName"]
            rows.append([pid, team] + vals)
    if not rows:
        return None, names
    rec = {"id": game["id"], "d": game["date"], "sy": game["season"], "st": game["stype"], "h": game["home"], "a": game["away"],
           "hs": game["hs"], "as": game["as"], "p": rows}
    return rec, names


def injuries(d):
    """{player_id: status} from a game summary ('Out', 'Doubtful', 'Questionable', 'Day-To-Day')."""
    out = {}
    for t in (d or {}).get("injuries", []) or []:
        for i in t.get("injuries", []) or []:
            ath = i.get("athlete") or {}
            if ath.get("id"):
                out[ath["id"]] = i.get("status") or (i.get("type") or {}).get("description", "")
    return out
