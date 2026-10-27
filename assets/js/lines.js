// Lines page (/lines/ NBA, /hockey/lines/ NHL). Reads data/lines_<sport>.json, written hourly by jobs/lines/run.py.
// The file changes through the day, so it's fetched fresh (no-store + minute stamp), not through SS.data()/DATA_V.
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, search, track, reveal, HOCKEY } = SS;
  const SPORT = HOCKEY ? "nhl" : "nba";
  const STAT = HOCKEY
    ? { pts: ["points", "Points"], g: ["goals", "Goals"], a: ["assists", "Assists"], sog: ["shots on goal", "Shots on goal"] }
    : { pts: ["points", "Points"], reb: ["rebounds", "Rebounds"], ast: ["assists", "Assists"], pra: ["pts + reb + ast", "Pts + Reb + Ast"], fg3m: ["threes", "Threes made"] };
  const ICON = {
    l10: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    vs: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/></svg>',
    ven: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  };
  const PAGE = 24;
  const q = new URLSearchParams(location.search);
  const st = { tab: q.get("tab") === "team" ? "team" : "player", g: q.get("g") || "", stat: q.get("stat") || "", min: +q.get("min") || 0, sort: q.get("sort") || "score", pid: q.get("p") || "", alt: q.get("alt") === "1", shown: PAGE };

  const get = (name) => fetch("/data/" + name + ".json?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  let D, S = {};
  try { [D, S] = await Promise.all([get("lines_" + SPORT), get("lines_slate").catch(() => ({}))]); }
  catch { $("#ln-list").innerHTML = `<div class="ln-empty"><b>Lines didn't load</b>Please refresh in a minute.</div>`; return; }

  // ---------- helpers ----------
  const P = D.players, T = D.teams, G = Object.fromEntries(D.games.map((g) => [g.id, g]));
  const prices = !!D.prices;           // unused slot, always null: nothing user-visible depends on it
  const pc = (r) => (r[1] ? Math.round((100 * r[0]) / r[1]) : null);
  const cls = (p) => (p == null ? "" : p >= 70 ? "g" : p <= 30 ? "r" : "");
  const tz = { hour: "numeric", minute: "2-digit" };
  const dayName = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000)); return m < 2 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago"; };
  const LOGO = "https://assets.nhle.com/logos/nhl/svg/";
  const badge = (t) => HOCKEY
    ? `<span class="lc-badge logo"><img src="${LOGO + t + "_dark.svg"}" alt="${esc(t)}" loading="lazy"></span>`
    : `<span class="lc-badge" style="--c:${esc((T[t] && T[t].color) || "#555")}">${esc(t)}</span>`;
  const mini = (t) => HOCKEY ? `<img class="lg" src="${LOGO + t + "_dark.svg"}" alt="">` : `<span class="tdot" style="--c:${esc((T[t] && T[t].color) || "#999")}"></span>`;
  const label = (c) => c.stat === "win" ? "Win" : c.k + "+ " + (c.team ? (HOCKEY ? "goals" : "points") : STAT[c.stat][0]);
  // The job rolls the slate over at 5 AM ET and its early run lands ~6:40 AM ET, so by 9 AM ET the file must be on
  // today's slate. If it isn't, the hourly refresh has stalled.
  const etDay = () => new Date(Date.now() - 9 * 3600e3).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  // ---------- header: sport switch, summary, search ----------
  const other = HOCKEY ? S.nba : S.nhl, mine = { games: D.games };
  const cnt = (s) => { const n = s && s.games ? s.games.length : 0; return n + (n === 1 ? " game" : " games"); };
  $("#ln-sport").innerHTML = `<a href="/lines/"${HOCKEY ? "" : ' aria-current="true"'}>NBA<small>${HOCKEY ? cnt(other) : cnt(mine)}</small></a><a href="/hockey/lines/"${HOCKEY ? ' aria-current="true"' : ""}>NHL<small>${HOCKEY ? cnt(mine) : cnt(other)}</small></a>`;
  $("#ln-date").textContent = (HOCKEY ? "NHL" : "NBA") + " lines · " + dayName(D.slate_date);
  $("#ln-sum").innerHTML = D.games.length
    ? `${D.games.length} game${D.games.length > 1 ? "s" : ""} · ${D.cards.filter((c) => !c.alt).length} player lines.<span class="xl"> How often each player has cleared his line lately, against tonight's opponent, and at home or on the road.</span>`
    : `No ${HOCKEY ? "NHL" : "NBA"} games today.`;
  const names = [...Object.entries(P).map(([pid, p]) => ({ name: p.n, meta: p.t, pid })), ...Object.entries(T).map(([t, x]) => ({ name: x.name, meta: "Team", team: t }))];
  search($("#ln-find"), names, (n) => {
    if (n.pid) { st.pid = n.pid; st.tab = "player"; st.g = ""; } else { st.g = D.games.find((g) => g.home === n.team || g.away === n.team)?.id || ""; st.pid = ""; }
    st.shown = PAGE; track("lines_search", { sport: SPORT, item: n.name }); draw();
  }, "Find a player or team…");

  // stale banner: the data is for an older slate than today's (the hourly job hasn't run since the day rolled over)
  if (D.slate_date < etDay()) $("#ln-stale").innerHTML = `<div class="ln-stale">These lines are from ${dayName(D.slate_date)} and were last updated ${ago(D.updated)}. The hourly refresh is running late; check back soon.</div>`;

  // ---------- slate chips ----------
  const when = (g) => g.state === "post" ? "Final" : g.state === "in" ? "Live" : new Date(g.start).toLocaleTimeString("en-US", tz);
  const chips = () => `<button class="gchip all ${st.g ? "" : "on"}" data-g="">All games</button>` + D.games.map((g) => `<button class="gchip ${st.g === g.id ? "on" : ""}" data-g="${g.id}">
      <span class="tm">${mini(g.away)}${esc(g.away)}</span><span class="sc">${g.state === "pre" ? "" : g.as}</span>
      <span class="tm">${mini(g.home)}${esc(g.home)}</span><span class="sc">${g.state === "pre" ? "" : g.hs}</span>
      <span class="when ${g.state === "in" ? "live" : ""}">${when(g)}</span></button>`).join("");

  // ---------- controls ----------
  const sorts = [["score", "Consistency"], ["l10", "Last 10 games"], ["streak", "Longest streak"], ["vs", "vs opponent"], ["ven", "Home / away"], ["szn", "This season"]]
    .concat(prices ? [["edge", "Hit rate vs market"]] : []);
  const controls = () => `<div class="seg" role="tablist"><button role="tab" data-tab="player" aria-selected="${st.tab === "player"}">Player</button><button role="tab" data-tab="team" aria-selected="${st.tab === "team"}">Team</button></div>
    <div class="ln-sel">
      ${st.tab === "player" ? `<label class="lx-f"><span>Stat</span><select data-k="stat"><option value="">All stats</option>${Object.entries(STAT).map(([k, v]) => `<option value="${k}" ${st.stat === k ? "selected" : ""}>${v[1]}</option>`).join("")}</select></label>` : ""}
      ${st.tab === "player" ? `<label class="lx-f"><span>Lines</span><select data-k="alt"><option value="">Main lines</option><option value="1" ${st.alt ? "selected" : ""}>+ Safer alt lines</option></select></label>` : ""}
      <label class="lx-f"><span>Hit rate (last 10)</span><select data-k="min">${[[0, "Any"], [60, "60%+"], [70, "70%+"], [80, "80%+"], [90, "90%+"]].map(([v, t]) => `<option value="${v}" ${st.min === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="lx-f"><span>Sort by</span><select data-k="sort">${sorts.map(([v, t]) => `<option value="${v}" ${st.sort === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    </div><span class="ln-count" id="ln-count"></span>`;

  // ---------- cards ----------
  const row = (key, r, text) => { const p = pc(r); return `<li>${ICON[key]}<span class="${r[1] ? "" : "na"}">${text}</span><b class="${cls(p)}">${p == null ? "–" : p + "%"}</b></li>`; };
  const card = (c) => {
    const g = G[c.g], who = c.team ? T[c.team] : P[c.pid], team = c.team || who.t;
    const at = (c.home ? "vs " : "@ ") + c.opp;
    const nm = c.team ? who.name : who.n;
    const link = who.href ? `<a href="${who.href}" data-pl="${esc(nm)}">${esc(nm)}</a>` : esc(nm);
    const venue = c.home ? "home" : "away";
    const verb = c.stat === "win" ? "Won" : "Hit in";
    const rows = row("l10", c.l10, `${verb} ${c.l10[0]} of last ${c.l10[1]} games`)
      + row("vs", c.vs, c.vs[1] ? `${verb} ${c.vs[0]} of ${c.vs[1]} game${c.vs[1] > 1 ? "s" : ""} vs ${c.opp}` : `No games vs ${c.opp} in two seasons`)
      + row("ven", c.ven, `${verb} ${c.ven[0]} of last ${c.ven[1]} ${venue} games`);
    let right = "";
    if (c.res) right += c.res.dnp ? `<span class="lt cold">Did not play</span>` : `<span class="lt ${c.res.hit ? "hit" : "miss"}">${c.res.hit ? "✓" : "✗"} ${c.stat === "win" ? (c.res.hit ? "Won" : "Lost") : c.res.v}</span>`;
    else if (g.state === "in") right += `<span class="lt live">Live</span>`;
    if (c.mkt) right = `<span class="lc-price">${esc(c.mkt.am)}<small>${Math.round(c.mkt.p * 100)}% implied</small></span>` + right;
    if (c.streak >= 3) right += `<span class="lt hot">🔥 ${c.streak} in a row</span>`;
    else if (c.streak <= -3) right += `<span class="lt cold">${c.stat === "win" ? "Lost" : "Missed"} ${-c.streak} straight</span>`;
    // details: last 10 as bars with the line drawn across (oldest left, latest right)
    const last = [...c.last].reverse(), top = Math.max(c.k * 1.6, ...last, 1);
    const spark = c.stat === "win" ? "" : `<div class="lc-spark" aria-label="Last ${last.length} games">${last.map((v) => `<i class="${v >= c.k ? "y" : ""}" style="height:${Math.max(3, (v / top) * 100)}%"><span>${v}</span></i>`).join("")}<span class="line" style="bottom:${(c.k / top) * 100}%"></span></div><div class="lc-spark-x"><span>${last.length} games ago</span><span>Last game</span></div>`;
    const facts = `<div class="lc-facts"><div><b>${c.l5[0]}/${c.l5[1]}</b>Last 5</div><div><b>${c.szn[1] ? c.szn[0] + "/" + c.szn[1] : "–"}</b>This season</div><div><b>${c.stat === "win" ? pc(c.l10) + "%" : c.avg10 ?? "–"}</b>${c.stat === "win" ? "Win rate L10" : "Avg last 10"}</div></div>`;
    const more = who.href ? `<a class="lc-link" href="${who.href}" data-pl="${esc(nm)}">${c.team ? (HOCKEY ? "Cup odds and more" : "Team page and title odds") : "Full player profile"}</a>` : "";
    const inj = !c.team && who.inj ? `<span class="inj">${esc(who.inj)}</span>` : "";
    return `<article class="lc reveal"><div class="lc-h">${badge(team)}<div class="lc-who"><span class="lc-nm">${link}<span class="opp">${at}</span></span><div class="lc-mk">${label(c)}${c.alt ? '<span class="alt">alt</span>' : ""}${inj}</div></div><div class="lc-r">${right}</div></div>
      <ul class="lc-rows">${rows}</ul><details><summary>Details</summary>${spark}${facts}${more}</details></article>`;
  };

  const key = { score: (c) => c.score, l10: (c) => (pc(c.l10) ?? -1) * 100 + c.l10[1], streak: (c) => c.streak, vs: (c) => (pc(c.vs) ?? -1) * 100 + c.vs[1], ven: (c) => (pc(c.ven) ?? -1) * 100 + c.ven[1], szn: (c) => (pc(c.szn) ?? -1) * 100 + c.szn[1], edge: (c) => (c.mkt ? c.l10[0] / Math.max(1, c.l10[1]) - c.mkt.p : -9) };
  const list = () => {
    let L = st.tab === "team" ? D.team_cards : D.cards;
    if (st.g) L = L.filter((c) => c.g === st.g);
    if (st.pid && st.tab === "player") L = L.filter((c) => c.pid === st.pid);
    if (st.stat && st.tab === "player") L = L.filter((c) => c.stat === st.stat);
    if (!st.alt && !st.pid) L = L.filter((c) => !c.alt);      // a searched player shows both of his rungs
    if (st.min) L = L.filter((c) => (pc(c.l10) ?? 0) >= st.min);
    const f = key[st.sort] || key.score;
    return [...L].sort((a, b) => f(b) - f(a) || b.score - a.score);
  };

  function draw() {
    $("#ln-slate").innerHTML = D.games.length ? chips() : "";
    $("#ln-bar").innerHTML = D.games.length ? controls() : "";
    const box = $("#ln-list"), more = $("#ln-more");
    if (!D.games.length) {
      const n = D.next_slate, o = other && other.games && other.games.length;
      box.innerHTML = `<div class="ln-empty"><b>No ${HOCKEY ? "NHL" : "NBA"} games today</b>${n ? `Next slate: ${dayName(n.date)} (${n.games} game${n.games > 1 ? "s" : ""}). Lines appear that morning.` : "The next slate isn't scheduled yet."}${o ? `<br><br><a class="lc-link" href="${HOCKEY ? "/lines/" : "/hockey/lines/"}">See tonight's ${HOCKEY ? "NBA" : "NHL"} lines</a>` : ""}</div>`;
      more.innerHTML = ""; return;
    }
    const L = list();
    const pill = st.pid && st.tab === "player" ? `<span class="ln-pill">${esc(P[st.pid]?.n || "")}<button type="button" aria-label="Clear player" data-clear="1">×</button></span>` : "";
    $("#ln-count").innerHTML = pill + ` Showing ${Math.min(st.shown, L.length)} of ${L.length}`;
    box.innerHTML = L.length ? L.slice(0, st.shown).map(card).join("") : `<div class="ln-empty"><b>Nothing matches</b>Try a lower hit rate or another stat.</div>`;
    more.innerHTML = L.length > st.shown ? `<button class="btn ghost" type="button">Show ${Math.min(PAGE, L.length - st.shown)} more</button>` : "";
    const p = new URLSearchParams();
    if (st.tab !== "player") p.set("tab", st.tab); if (st.g) p.set("g", st.g); if (st.stat) p.set("stat", st.stat);
    if (st.min) p.set("min", st.min); if (st.alt) p.set("alt", "1"); if (st.sort !== "score") p.set("sort", st.sort); if (st.pid) p.set("p", st.pid);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    reveal();      // cards are rendered after site.js's first reveal pass
  }

  // ---------- events ----------
  $("#ln-slate").addEventListener("click", (e) => { const b = e.target.closest(".gchip"); if (!b) return; st.g = b.dataset.g; st.pid = ""; st.shown = PAGE; track("lines_filter", { sport: SPORT, filter: "game", value: st.g || "all" }); draw(); });
  $("#ln-bar").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (t) { st.tab = t.dataset.tab; st.shown = PAGE; if (st.tab === "team") st.stat = ""; track("lines_tab", { sport: SPORT, tab: st.tab }); draw(); return; }
    if (e.target.closest("[data-clear]")) { st.pid = ""; draw(); }
  });
  $("#ln-bar").addEventListener("change", (e) => { const s = e.target.closest("select"); if (!s) return; const k = s.dataset.k; st[k] = k === "min" ? +s.value : k === "alt" ? s.value === "1" : s.value; st.shown = PAGE; track("lines_filter", { sport: SPORT, filter: k, value: s.value }); draw(); });
  $("#ln-more").addEventListener("click", (e) => { if (e.target.closest("button")) { st.shown += PAGE; draw(); } });
  $("#ln-list").addEventListener("click", (e) => { const a = e.target.closest("a[data-pl]"); if (a) track("select_content", { content_type: "lines_player", item_id: a.dataset.pl }); });

  $("#ln-upd").textContent = `Last change ${ago(D.updated)} (${new Date(D.updated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}) · checked every hour.`;
  $("#ln-sample").textContent = D.sample;
  draw();
});
