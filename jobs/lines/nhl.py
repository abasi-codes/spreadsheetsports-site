"""NHL source: the NHL's public (logged-out) API, api-web.nhle.com.

schedule(date) -> games on that date; box(game) -> compact skater box score from the play-by-play
(goals, assists, points, shots on goal; shootouts excluded).
"""
from net import get_json

BASE = "https://api-web.nhle.com/v1"
NAMES = {"ANA": "Anaheim Ducks", "BOS": "Boston Bruins", "BUF": "Buffalo Sabres", "CGY": "Calgary Flames", "CAR": "Carolina Hurricanes",
         "CHI": "Chicago Blackhawks", "COL": "Colorado Avalanche", "CBJ": "Columbus Blue Jackets", "DAL": "Dallas Stars", "DET": "Detroit Red Wings",
         "EDM": "Edmonton Oilers", "FLA": "Florida Panthers", "LAK": "Los Angeles Kings", "MIN": "Minnesota Wild", "MTL": "Montreal Canadiens",
         "NSH": "Nashville Predators", "NJD": "New Jersey Devils", "NYI": "New York Islanders", "NYR": "New York Rangers", "OTT": "Ottawa Senators",
         "PHI": "Philadelphia Flyers", "PIT": "Pittsburgh Penguins", "SJS": "San Jose Sharks", "SEA": "Seattle Kraken", "STL": "St. Louis Blues",
         "TBL": "Tampa Bay Lightning", "TOR": "Toronto Maple Leafs", "UTA": "Utah Mammoth", "VAN": "Vancouver Canucks", "VGK": "Vegas Golden Knights",
         "WSH": "Washington Capitals", "WPG": "Winnipeg Jets"}
COLS = ["g", "a", "pts", "sog"]          # compact skater row: [player_id, team, G, A, PTS, SOG]
STATE = {"FUT": "pre", "PRE": "pre", "LIVE": "in", "CRIT": "in", "FINAL": "post", "OFF": "post"}


def schedule(date):
    d = get_json(f"{BASE}/schedule/{date}")
    out = []
    for day in (d or {}).get("gameWeek", []):
        if day.get("date") != date:
            continue
        for g in day.get("games", []):
            if g.get("gameType") not in (2, 3):
                continue
            sched = g.get("gameScheduleState", "OK")
            out.append({
                "id": str(g["id"]), "start": g["startTimeUTC"], "state": STATE.get(g.get("gameState"), "pre") if sched == "OK" else "ppd",
                "detail": g.get("gameState", ""), "stype": g["gameType"], "season": int(str(g["season"])[4:]),
                "home": g["homeTeam"]["abbrev"], "away": g["awayTeam"]["abbrev"],
                "hs": g["homeTeam"].get("score", 0), "as": g["awayTeam"].get("score", 0),
            })
    return out


def pbp(game_id):
    return get_json(f"{BASE}/gamecenter/{game_id}/play-by-play")


def box_from_pbp(d, date=None):
    """Compact game record from a play-by-play payload. Returns (record, {pid: name})."""
    if not d or not d.get("plays"):
        return None, {}
    team_of = {d["homeTeam"]["id"]: d["homeTeam"]["abbrev"], d["awayTeam"]["id"]: d["awayTeam"]["abbrev"]}
    st, names = {}, {}
    for r in d.get("rosterSpots", []):
        if r.get("positionCode") == "G":
            continue
        pid = str(r["playerId"])
        names[pid] = f'{r["firstName"]["default"]} {r["lastName"]["default"]}'
        st[pid] = [pid, team_of.get(r["teamId"], ""), 0, 0, 0, 0]
    for p in d["plays"]:
        if (p.get("periodDescriptor") or {}).get("periodType") == "SO":
            continue
        k, det = p.get("typeDescKey"), p.get("details") or {}
        if k == "goal":
            for key, col in (("scoringPlayerId", 2), ("assist1PlayerId", 3), ("assist2PlayerId", 3)):
                pid = str(det.get(key) or "")
                if pid in st:
                    st[pid][col] += 1
                    st[pid][4] += 1
            pid = str(det.get("scoringPlayerId") or "")
            if pid in st:
                st[pid][5] += 1
        elif k == "shot-on-goal":
            pid = str(det.get("shootingPlayerId") or "")
            if pid in st:
                st[pid][5] += 1
    h, a = d["homeTeam"], d["awayTeam"]
    rec = {"id": str(d["id"]), "d": date or d["gameDate"], "sy": int(str(d["season"])[4:]), "st": d["gameType"],
           "h": h["abbrev"], "a": a["abbrev"], "hs": h.get("score", 0), "as": a.get("score", 0), "p": list(st.values())}
    return rec, names
