"""Lines job: refresh data/lines_nba.json, data/lines_nhl.json and data/lines_slate.json.

    python3 jobs/lines/run.py            # both sports
    python3 jobs/lines/run.py --sport nhl

What it does each run (GitHub Actions calls it hourly, see .github/workflows/lines.yml):
  1. store.sync(): fetch any finished date that isn't stored yet (normally just yesterday) into jobs/lines/state/.
  2. Load the slate (today's games, US Eastern; before 5 AM ET it's still last night's slate) and the injury report.
  3. Hit rates for every rotation player on the slate (engine.py), plus results for games that are already final.
  4. Validate and write the JSON only if the content changed. On any API failure the old file is left untouched,
     so the page keeps the last good data and shows its age ("updated 3h ago").

Market prices are OFF: Kalshi's Developer Agreement and Data Terms don't allow showing their prices on a public
site without written permission (research/kalshi_terms.md). The output keeps a "prices": null slot for a licensed source.
Exit code 0 = fine (even if nothing changed), 1 = at least one sport failed (old data kept).
"""
import argparse
import hashlib
import json
import os
import sys
import traceback
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402
import nba  # noqa: E402
import nhl  # noqa: E402
import store  # noqa: E402
from net import Blocked, stats  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA = os.path.join(ROOT, "data")
ET = ZoneInfo("America/New_York")
SAMPLE = {"nba": "Last two seasons (2025-26 and 2026-27), regular season, play-in and playoffs.",
          "nhl": "Last two seasons (2025-26 and 2026-27), regular season and playoffs. Shootout goals don't count."}
ROTATION_MIN = 18           # NBA: average minutes over his last 5 games
NHL_PER_TEAM = 10           # NHL: top skaters per team by recent points + shots
SYNC_BUDGET_S = 6 * 60      # per sport per run; normal runs need seconds, a cold start catches up over a few runs


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def site_links(sport):
    """fold(name) -> [(team, href)] from the site's own search index, so names link to our player pages."""
    f = os.path.join(DATA, "search.json" if sport == "nba" else "hockey_search.json")
    out = {}
    for r in json.load(open(f)):
        if "/players/" in r.get("href", ""):
            out.setdefault(engine.fold(r["name"]), []).append((r.get("meta", "").split(" ")[0], r["href"]))
    return out


def link_for(links, name, team):
    c = links.get(engine.fold(name), [])
    if not c:
        return None
    for t, href in c:
        if t == team:
            return href
    return c[0][1] if len(c) == 1 else None


def team_href(sport, t):
    if sport == "nba":
        return "/teams/" + engine.fold(nba.NAMES[t]).replace(" ", "-") + "/"
    return "/hockey/cup.html#" + t


def slate_for(sport, day):
    src = nba.scoreboard if sport == "nba" else nhl.schedule
    games = [g for g in src(day) if g["state"] != "ppd" and (sport != "nba" or g["stype"] in nba.SEASON_TYPES)]
    return games


def next_slate(sport, day):
    d = datetime.fromisoformat(day).date()
    for i in range(1, 15):
        nd = (d + timedelta(days=i)).isoformat()
        g = slate_for(sport, nd)
        if g:
            return {"date": nd, "games": len(g)}
    return None


def rotation(idx, sport, team, season, out_ids):
    tg = idx.team.get(team, [])
    cur = [g for g in tg if g["sy"] == season]
    window = (cur if len(cur) >= 2 else tg)[:5]
    ids = {g["id"] for g in window}
    if not ids:
        return []
    cand = []
    for pid, apps in idx.player.items():
        if apps[0]["team"] != team or pid in out_ids:
            continue
        played = sum(1 for a in apps if a["id"] in ids)
        if played < min(2, len(ids)):
            continue
        if sport == "nba":
            mins = [a["min"] for a in apps[:5]]
            if sum(mins) / len(mins) < ROTATION_MIN:
                continue
            cand.append((sum(mins) / len(mins), pid))
        else:
            l20 = apps[:20]
            cand.append(((3 * sum(a["pts"] for a in l20) + sum(a["sog"] for a in l20)) / len(l20), pid))
    cand.sort(reverse=True)
    return [pid for _, pid in (cand if sport == "nba" else cand[:NHL_PER_TEAM])]


def results_for(sport, game):
    """{pid: stats} for a final game (and the team scores), or None."""
    if sport == "nba":
        d = nba.summary(game["id"])
        rec, _ = nba.box(game["id"], dict(game, date=""), d)
    else:
        rec, _ = nhl.box_from_pbp(nhl.pbp(game["id"]))
    if not rec:
        return None
    cols = engine.COLS[sport]
    return {r[0]: dict(zip(cols, r[2:])) for r in rec["p"]}


def build(sport, now):
    now_et = now.astimezone(ET)
    today = now_et.date()
    slate_day = (now_et - timedelta(hours=5)).date().isoformat()

    added = store.sync(sport, today, log=log, budget_s=SYNC_BUDGET_S)
    store.prune(sport, today)
    games, names = store.load(sport)
    games = [g for g in games if g["d"] < slate_day]
    idx = engine.Index(sport, games, names)
    season = store.season_end_year(datetime.fromisoformat(slate_day).date())
    links = site_links(sport)

    slate = slate_for(sport, slate_day)
    out = {"v": 1, "sport": sport, "slate_date": slate_day, "sample": SAMPLE[sport], "prices": None,
           "games": [], "teams": {}, "players": {}, "cards": [], "team_cards": [], "next_slate": None}
    if not slate:
        out["next_slate"] = next_slate(sport, slate_day)
    unlinked = []
    for g in slate:
        inj, res = {}, None
        try:      # injury report / final box: nice to have, so a hiccup here doesn't sink the slate
            if sport == "nba":
                summ = nba.summary(g["id"])
                inj = nba.injuries(summ)
                if g["state"] == "post":
                    rec, _ = nba.box(g["id"], dict(g, date=slate_day), summ)
                    res = {r[0]: dict(zip(engine.COLS["nba"], r[2:])) for r in rec["p"]} if rec else None
            elif g["state"] == "post":
                res = results_for(sport, g)
        except Blocked:
            raise
        except Exception as e:
            log(f"[{sport}] game {g['id']}: injuries/results skipped ({e!r})")
        out_ids = {pid for pid, s in inj.items() if s.lower() == "out"}
        out["games"].append({k: g[k] for k in ("id", "start", "state", "detail", "home", "away", "hs", "as")})
        for team, opp, home in ((g["home"], g["away"], True), (g["away"], g["home"], False)):
            names_map = nba.NAMES if sport == "nba" else nhl.NAMES
            out["teams"][team] = {"name": names_map.get(team, team), "href": team_href(sport, team),
                                  "color": ("#" + g["colors"][team]) if sport == "nba" and g.get("colors", {}).get(team) else None}
            # team cards: win, team points/goals milestone
            tapps = idx.team.get(team, [])
            if len(tapps) >= 3:
                tres = None
                if g["state"] == "post":
                    pf, pa = (g["hs"], g["as"]) if home else (g["as"], g["hs"])
                    tres = {"win": int(pf > pa), "pts": pf}
                for stat, ks in (("win", [1]), ("pts", engine.pick_rungs(tapps, "pts", engine.TEAM_LADDER[sport])[:1])):
                    for k in ks:
                        r = engine.card_rows(tapps, stat, k, opp, home, season)
                        if tres is not None:
                            r["res"] = {"v": tres[stat], "hit": tres[stat] >= k}
                        out["team_cards"].append({"g": g["id"], "team": team, "opp": opp, "home": home, "stat": stat, **r})
            # player cards
            in_play = rotation(idx, sport, team, season, out_ids)
            if res is not None:      # game over: only players who actually suited up get a result
                in_play = [p for p in in_play if p in res]
            for pid in in_play:
                apps = idx.player[pid]
                nm = names.get(pid, pid)
                href = link_for(links, nm, team)
                if not href:
                    unlinked.append(f"{nm} ({team})")
                status = inj.get(pid)
                out["players"][pid] = {"n": nm, "t": team, "href": href, "inj": status if status and status.lower() != "active" else None}
                for stat, ladder in engine.LADDERS[sport].items():
                    for i, k in enumerate(engine.pick_rungs(apps, stat, ladder)):
                        r = engine.card_rows(apps, stat, k, opp, home, season)
                        if r["l10"][0] < 2:       # he almost never gets there (e.g. 1+ goal for a stay-at-home D)
                            continue
                        if res is not None and pid in res:
                            r["res"] = {"v": res[pid][stat], "hit": res[pid][stat] >= k}
                        if i:
                            r["alt"] = 1       # the safer rung below the main line: hidden unless "Alt lines" is on
                        out["cards"].append({"g": g["id"], "pid": pid, "opp": opp, "home": home, "stat": stat, **r})
    out["cards"].sort(key=lambda c: -c["score"])
    out["team_cards"].sort(key=lambda c: -c["score"])
    out["unlinked"] = len(set(unlinked))
    log(f"[{sport}] slate {slate_day}: {len(slate)} games, {len(out['cards'])} player cards, {len(out['team_cards'])} team cards, "
        f"{len(out['players'])} players ({out['unlinked']} without a site page), {added} new dates stored")
    if unlinked:
        log(f"[{sport}] no player page for: " + ", ".join(sorted(set(unlinked))[:60]))
    return out


def validate(d):
    assert d["sport"] in ("nba", "nhl") and isinstance(d["cards"], list) and isinstance(d["games"], list)
    assert len(d["slate_date"]) == 10
    for c in d["cards"]:
        assert c["pid"] in d["players"] and c["g"] in {g["id"] for g in d["games"]}
        assert 0 <= c["l10"][0] <= c["l10"][1] <= 10 and 0 <= c["score"] <= 1
    for c in d["team_cards"]:
        assert c["team"] in d["teams"] and c["stat"] in ("win", "pts")
    json.loads(json.dumps(d))


def dumps_lines(d):
    """Compact JSON with one card / game / player per line, so hourly commits are small line diffs."""
    c = lambda x: json.dumps(x, separators=(",", ":"), ensure_ascii=False)
    parts = []
    for k, v in d.items():
        if isinstance(v, list) and v:
            parts.append(c(k) + ":[\n" + ",\n".join(c(x) for x in v) + "\n]")
        elif isinstance(v, dict) and len(v) > 3:
            parts.append(c(k) + ":{\n" + ",\n".join(c(kk) + ":" + c(vv) for kk, vv in v.items()) + "\n}")
        else:
            parts.append(c(k) + ":" + c(v))
    return "{\n" + ",\n".join(parts) + "\n}\n"


def write_if_changed(name, d, now):
    p = os.path.join(DATA, name)
    body = {k: v for k, v in d.items() if k not in ("updated", "hash")}
    h = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]
    try:
        old = json.load(open(p))
        if old.get("hash") == h:
            return False
    except (OSError, ValueError):
        pass
    d = {"updated": now.isoformat(timespec="seconds").replace("+00:00", "Z"), "hash": h, **body}
    tmp = p + ".tmp"
    with open(tmp, "w") as f:
        f.write(dumps_lines(d))
    json.load(open(tmp))
    os.replace(tmp, p)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sport", choices=["nba", "nhl", "all"], default="all")
    a = ap.parse_args()
    now = datetime.now(timezone.utc)
    ok, slate = True, {}
    for sport in (["nba", "nhl"] if a.sport == "all" else [a.sport]):
        try:
            d = build(sport, now)
            validate(d)
            changed = write_if_changed(f"lines_{sport}.json", d, now)
            log(f"[{sport}] {'written' if changed else 'unchanged'}")
            slate[sport] = {"date": d["slate_date"], "games": [{k: g[k] for k in ("start", "state", "home", "away")} for g in d["games"]],
                            "next": d["next_slate"], "cards": len(d["cards"])}
        except Blocked as e:
            ok = False
            log(f"[{sport}] BLOCKED, keeping last good data: {e}")
        except Exception:
            ok = False
            log(f"[{sport}] FAILED, keeping last good data:\n" + traceback.format_exc())
    if slate:
        try:
            old = json.load(open(os.path.join(DATA, "lines_slate.json")))
        except (OSError, ValueError):
            old = {}
        merged = {k: v for k, v in old.items() if k in ("nba", "nhl")}
        merged.update(slate)
        write_if_changed("lines_slate.json", merged, now)
    log(f"requests: {stats['requests']}, errors: {stats['errors']}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
