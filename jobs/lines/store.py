"""Append-only game store: one small JSON file per sport per date under jobs/lines/state/<sport>/.

A date file is written only once every game on it is final, so it never changes again. That keeps
the hourly commits small: a new date file appears once a day, nothing else in state/ moves.
"""
import json
import os
import time
from datetime import date, timedelta

import nba
import nhl
from net import Blocked

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state")
SRC = {"nba": nba, "nhl": nhl}


def season_end_year(d):
    """2026-10-26 -> 2027 (the 2026-27 season). Both leagues start in October."""
    return d.year + 1 if d.month >= 8 else d.year


def season_dates(end_year, today):
    """Every date that can hold a game for the season ending in end_year, up to yesterday."""
    d, stop = date(end_year - 1, 10, 1), min(date(end_year, 6, 30), today - timedelta(days=1))
    while d <= stop:
        yield d.isoformat()
        d += timedelta(days=1)


def path(sport, day):
    return os.path.join(STATE, sport, day + ".json")


def write_atomic(p, obj):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)
    json.load(open(tmp))   # never leave broken JSON behind
    os.replace(tmp, p)


def fetch_day(sport, day, settle=False):
    """Returns the day's record, or None if a game on it isn't final yet.
    settle=True (dates 3+ days old): store whatever finished and skip games that never will (suspended, bad data)."""
    src = SRC[sport]
    games = src.scoreboard(day) if sport == "nba" else src.schedule(day)
    recs, names = [], {}
    for g in games:
        if g["state"] == "ppd" or (sport == "nba" and g["stype"] not in nba.SEASON_TYPES):
            continue
        if g["state"] != "post":
            if settle:
                continue
            return None
        g = dict(g, date=day)
        if sport == "nba":
            rec, nm = nba.box(g["id"], g)
        else:
            rec, nm = nhl.box_from_pbp(nhl.pbp(g["id"]), day)
        if rec is None:
            if settle or "Postponed" in g.get("detail", "") or "Canceled" in g.get("detail", ""):
                continue
            return None
        recs.append(rec)
        names.update(nm)
    return {"date": day, "games": recs, "names": names}


def sync(sport, today, max_days=None, log=print, budget_s=None):
    """Fetch every missing date for this season and last season, newest first, within an optional time budget
    (a cold start can take an hour; the hourly job then catches up over several runs). Returns new date files."""
    end = season_end_year(today)
    todo = [d for y in (end - 1, end) for d in season_dates(y, today) if not os.path.exists(path(sport, d))]
    todo.reverse()                      # yesterday first: the dates that matter most for tonight
    stop_at = time.time() + budget_s if budget_s else None
    if max_days:
        todo = todo[:max_days]
    n = 0
    for d in todo:
        if stop_at and time.time() > stop_at:
            log(f"[{sport}] time budget used, {len(todo) - n} dates left for the next run")
            break
        try:
            rec = fetch_day(sport, d, settle=(today - date.fromisoformat(d)).days > 3)
        except Blocked:
            raise
        except Exception as e:     # one bad date shouldn't sink the run; it's retried next time
            log(f"[{sport}] {d}: {e!r}")
            continue
        if rec is None:
            log(f"[{sport}] {d}: not final yet, retry later")
            continue
        write_atomic(path(sport, d), rec)
        n += 1
        if n % 25 == 0:
            log(f"[{sport}] {n}/{len(todo)} dates stored (last {d})")
    return n


def prune(sport, today):
    """Drop date files older than last season (keeps the repo from growing forever)."""
    keep_from = date(season_end_year(today) - 2, 10, 1).isoformat()
    folder = os.path.join(STATE, sport)
    for f in os.listdir(folder) if os.path.isdir(folder) else []:
        if f.endswith(".json") and f[:10] < keep_from:
            os.remove(os.path.join(folder, f))


def load(sport):
    """All stored games (oldest first) and the id -> name map."""
    folder = os.path.join(STATE, sport)
    games, names = [], {}
    for f in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
        if not f.endswith(".json"):
            continue
        d = json.load(open(os.path.join(folder, f)))
        games.extend(d["games"])
        names.update(d["names"])
    return games, names
