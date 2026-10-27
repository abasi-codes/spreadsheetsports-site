// Live current-season numbers on player pages. The pages are static (built from last season); this adds/updates the
// "2026-27" row of the per-game table and a one-line "so far" note in the header strip, from data/season_<sport>.json
// (written hourly by jobs/lines). Fetched fresh (minute stamp), not via DATA_V. Any failure or 0 GP: do nothing.
(async () => {
  const H = SS.HOCKEY, slug = location.pathname.replace(/\/+$/, "").split("/").pop();
  let D;
  try {
    const r = await fetch("/data/season_" + (H ? "nhl" : "nba") + ".json?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" });
    if (!r.ok) return;
    D = await r.json();
  } catch { return; }
  const table = document.querySelector("#st-pg table.stat-table") || document.querySelector("table.stat-table");
  const heads = table ? [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim()) : [];
  const goalie = heads.includes("SV%");
  const p = (H && goalie ? D.goalies : D.players || {})[slug];
  if (!p || !p.gp) return;
  const { esc } = SS;
  const f1 = (x) => (x == null ? "—" : Number(x).toFixed(1));
  const sv = (x) => (x == null ? "—" : x.toFixed(3).replace(/^0/, ""));
  const pm = (x) => (x > 0 ? "+" + x : String(x));
  const hrs = Math.max(0, Math.round((Date.now() - new Date(D.updated)) / 3600e3));
  const when = "Updated " + (hrs < 1 ? "within the hour" : hrs + "h ago") + (D.through ? " (games through " + new Date(D.through + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ")" : "");
  const teamHref = H ? "/hockey/cup.html#" + p.t : "/teams/" + ((D.teams || {})[p.t] || "") + "/";
  // ---- per-game table row ----
  if (table) {
    const cells = H
      ? goalie ? [p.gp, p.gs, p.w, p.l, p.otl, sv(p.sv), p.gaa == null ? "—" : p.gaa.toFixed(2), p.so, p.sa, "—"]
               : [p.gp, p.g, p.a, p.p, pm(p.pm), p.pim, p.ppp, p.sog, f1(p.sh), p.toi, p.hit ?? "—", p.blk ?? "—", f1(p.fo)]
      : [p.gp, p.gs, f1(p.min), f1(p.pts), f1(p.reb), f1(p.ast), f1(p.stl), f1(p.blk), f1(p.tov), f1(p.fg), f1(p.fg3), f1(p.ft)];
    if (cells.length === heads.length - 2) {
      const tr = document.createElement("tr");
      tr.className = "row-live";
      tr.innerHTML = `<th scope="row" title="${esc(when)}">${esc(D.season)}<small style="color:var(--red)"> live</small></th><td><a href="${esc(teamHref)}">${esc(p.t)}</a></td>`
        + cells.map((c) => `<td class="num">${esc(c)}</td>`).join("");
      const body = table.tBodies[0], first = body && body.rows[0];
      if (first && first.querySelector("th") && first.querySelector("th").textContent.trim().startsWith(D.season)) first.replaceWith(tr);
      else if (body) body.prepend(tr);
      if (!H) {
        const n = document.createElement("p");
        n.className = "muted"; n.style.cssText = "font-size:12px;margin:8px 0 0";
        n.textContent = D.season + " from official box scores, updated hourly.";
        (table.closest(".stat-scroll") || table).after(n);
      }
    }
  }
  // ---- header strip: the big tiles switch to this season; the season they showed moves to the small line ----
  const strip = document.querySelector(".sum-strip");
  if (strip) {
    const gaa = p.gaa == null ? "—" : p.gaa.toFixed(2);
    const map = H
      ? goalie ? { GP: p.gp, W: p.w, "SV%": sv(p.sv), GAA: gaa, SO: p.so } : { GP: p.gp, G: p.g, A: p.a, P: p.p, "+/-": pm(p.pm) }
      : { PTS: f1(p.pts), REB: f1(p.reb), AST: f1(p.ast), STL: f1(p.stl), BLK: f1(p.blk) };
    const chips = [...strip.querySelectorAll(".sum-chip")].map((c) => [c.querySelector("span")?.textContent.trim(), c.querySelector("b")]);
    const label = strip.querySelector(".sum-head .card-label");
    const meta = strip.querySelector(".sum-head .sum-meta");
    const current = label && label.textContent.trim().startsWith(D.season);
    if (!current) {
      // remember what the tiles showed ("2024-25: 12.5 PTS · 2.5 REB · 3.4 AST") before overwriting them
      const old = (label ? label.textContent.trim().split(" ")[0] : "") + ": "
        + chips.filter(([k]) => k).slice(0, H ? 4 : 3).map(([k, b]) => b.textContent.trim() + " " + k).join(" · ");
      let note = strip.querySelector(".sum-note");
      if (!note) { note = document.createElement("p"); note.className = "sum-note"; strip.querySelector(".sum-head")?.after(note); }
      note.textContent = old;
      note.style.color = "var(--muted)";
    }
    chips.forEach(([k, b]) => { if (b && k in map) b.textContent = map[k]; });
    if (label) {
      label.textContent = H ? D.season + " so far · regular season" : D.season + " per game";
      label.title = when;
    }
    if (meta) {
      const extra = H ? "" : " · " + p.gp + (p.gp === 1 ? " game" : " games") + " · " + p.gs + (p.gs === 1 ? " start" : " starts");
      meta.innerHTML = `<a href="${esc(teamHref)}">${esc(p.t)}</a>` + esc(extra);
    }
  }
})();
