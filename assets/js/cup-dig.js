// Hockey: 2027 Stanley Cup odds page (/hockey/cup.html). Reads data/hockey.json (~/nhl-sim-video/model/site_export.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, pct, ord, fold, search, track, shareBar, newsletter, bars, embed, table, reveal, SUB } = SS;
  const D = await data("hockey"), T = D.teams;
  const NM = { ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CGY: "Calgary Flames", CAR: "Carolina Hurricanes", CHI: "Chicago Blackhawks", COL: "Colorado Avalanche",
    CBJ: "Columbus Blue Jackets", DAL: "Dallas Stars", DET: "Detroit Red Wings", EDM: "Edmonton Oilers", FLA: "Florida Panthers", LAK: "Los Angeles Kings", MIN: "Minnesota Wild",
    MTL: "Montreal Canadiens", NSH: "Nashville Predators", NJD: "New Jersey Devils", NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", PHI: "Philadelphia Flyers",
    PIT: "Pittsburgh Penguins", SJS: "San Jose Sharks", SEA: "Seattle Kraken", STL: "St. Louis Blues", TBL: "Tampa Bay Lightning", TOR: "Toronto Maple Leafs", UTA: "Utah Mammoth",
    VAN: "Vancouver Canucks", VGK: "Vegas Golden Knights", WSH: "Washington Capitals", WPG: "Winnipeg Jets" };
  const nm = (k) => NM[k] || k, nick = (k) => nm(k).replace(/^(New York|Los Angeles|St\. Louis|San Jose|Tampa Bay|New Jersey|Vegas Golden|Columbus Blue|Detroit Red|Toronto Maple|\S+) /, "");
  const logo = (k, s = 28) => `<img src="https://assets.nhle.com/logos/nhl/svg/${k}_dark.svg" alt="" width="${s * 1.5}" height="${s}" style="object-fit:contain;vertical-align:middle;display:inline-block;margin-right:6px">`;
  const pctS = (p) => (p === 0 ? "0 in 10,000" : p < 0.001 ? `${Math.round(p * 10000)} in 10,000` : pct(p));
  const keys = Object.keys(T).sort((a, b) => T[b].cup - T[a].cup);
  const confN = (k) => (T[k].conf === "E" ? "East" : "West");
  const champ26 = D.backtest.rows.find((r) => r.year === 2026)?.champ;
  if ($("#sub-page")) $("#sub-page").href = SUB;
  newsletter($("#nl-page"));

  // ---------- video, odds bars, finals, Canada
  const v = (await data("videos")).find((x) => x.id === D.video);
  if (v && (!v.publishAt || new Date(v.publishAt) <= new Date())) embed($("#video"), D.video); else $("#video").closest(".reveal").remove();
  const all = keys.map((k) => ({ k, name: nm(k), sub: `${confN(k)} · ${pct(T[k].final)} to reach the Final`, p: T[k].cup }));
  const max = all[0].p;
  const draw = (c) => bars($("#odds"), all.filter((x) => !c || T[x.k].conf === c).slice(0, 10), { max, onPick: (r) => window.digTeam?.(r.k) });
  draw("");
  $("#conf").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; document.querySelectorAll("#conf .chip").forEach((c) => c.classList.toggle("on", c === b)); draw(b.dataset.c); });
  $("#finals").innerHTML = D.finals.slice(0, 6).map(([[a, b], p]) => {
    const [e, w] = T[a].conf === "E" ? [a, b] : [b, a];
    return `<div class="comp" style="grid-template-columns:1fr auto"><div class="lbl">${logo(e, 18)} ${esc(nm(e))} <span class="dim">vs</span> ${logo(w, 18)} ${esc(nm(w))}</div><div class="p">${pct(p)}</div></div>`;
  }).join("");
  $("#canada").innerHTML = `A Canadian team wins the Cup in <b>${pct(D.canada)}</b> of the 10,000 seasons, so in about 6 of every 7 the drought (since 1993) keeps going. Best hope: <a href="#EDM">Edmonton</a> at <b>${pct(T.EDM.cup)}</b>.`;

  // ---------- full table
  table($("#table"), [
    { key: "name", label: "Team", asc: true, fmt: (r) => `<a href="#${r.k}" style="color:inherit">${logo(r.k, 18)} ${esc(r.name)}</a>` },
    { key: "conf", label: "Conf", asc: true, fmt: (r) => (r.conf === "E" ? "East" : "West") },
    { key: "pts", label: "Proj. points", num: true, fmt: (r) => Math.round(r.pts) },
    { key: "playoffs", label: "Make playoffs", num: true, fmt: (r) => pct(r.playoffs) },
    { key: "final", label: "Reach Final", num: true, fmt: (r) => pct(r.final) },
    { key: "cup", label: "Win Cup", num: true, fmt: (r) => `<b>${pctS(r.cup)}</b>` },
    { key: "market", label: "Betting markets", num: true, fmt: (r) => `<span class="dim">${pct(r.market)}</span>` },
  ], keys.map((k) => ({ k, name: nm(k), ...T[k] })), { sort: "cup" });

  // ---------- backtest
  const S = D.backtest.summary, m = D.backtest.market;
  $("#bt").innerHTML = [
    [`${S.fav_won}<small>/18</small>`, `The preseason favourite won the Cup (betting markets: ${m.fav_won}/18)`],
    [`${S.top3}<small>/18</small>`, `Real champion in the preseason top 3 (betting markets: ${m.top3}/18)`],
    [`${(S.avg_p * 100).toFixed(1)}%`, `Average odds given to the eventual champion (markets: ${(m.avg_p * 100).toFixed(1)}%)`],
    ["3.1%", "What a random guess would give them (1 in 32)"],
  ].map(([n, x]) => `<div class="card stat reveal"><div class="big">${n}</div><p>${x}</p></div>`).join("");
  $("#ladder").innerHTML = `<table class="mini-table"><thead><tr><th>Version</th><th>Favourite won</th><th>Champion in top 3</th></tr></thead><tbody>
    ${D.ladder.map(([l, f, t3]) => `<tr><td style="font-family:var(--sans)">${esc(l)}</td><td>${f} / 18</td><td>${t3} / 18</td></tr>`).join("")}
    <tr><td style="font-family:var(--sans)" class="dim">Betting markets</td><td class="dim">${m.fav_won} / 18</td><td class="dim">${m.top3} / 18</td></tr></tbody></table>`;
  table($("#rows"), [
    { key: "year", label: "Season", num: true, fmt: (r) => `${r.year - 1}-${String(r.year).slice(2)}` },
    { key: "champ", label: "Champion", fmt: (r) => `${logo(r.champ, 16)} ${esc(nm(r.champ))}` },
    { key: "rank", label: "Model rank", num: true, asc: true, fmt: (r) => `<span class="pill ${r.rank === 1 ? "hit" : r.rank <= 3 ? "near" : "miss"}">#${r.rank}</span>` },
    { key: "p", label: "Model gave them", num: true, fmt: (r) => pct(r.p) },
    { key: "fav", label: "Model's favourite", fmt: (r) => esc(nm(r.fav)) + ` <span class="dim mono">${pct(r.fav_p)}</span>` },
    { key: "mkt_fav", label: "Markets' favourite", fmt: (r) => `<span class="dim">${esc(nm(r.mkt_fav))}</span>` },
  ], D.backtest.rows, { sort: "year", dir: -1, limit: 10 });

  // ---------- dig card
  const VER = ["Standings only", "Expected goals", "+ Playoff experience", "Final model"];
  function why(k) {
    const t = T[k], l = t.last, out = [];
    const rec = l.w != null ? `${l.w}-${l.l}-${l.otl}, ${l.pts} pts` : "";
    out.push(["", `Last season: <b>${rec}</b>${l.made ? (k === champ26 ? ", and they <b>won the Cup</b>" : ", and they made the playoffs") : ", and they <b>missed the playoffs</b>"}.`]);
    if (l.xg_rank <= 5) out.push(["up", `Their chances were elite: <b>${ord(l.xg_rank)}</b> in the league in expected-goal differential last season.`]);
    else if (l.xg_rank >= 24) out.push(["down", `Their chances were poor: <b>${ord(l.xg_rank)}</b> in expected-goal differential last season.`]);
    else out.push(["", `Expected-goal differential last season: <b>${ord(l.xg_rank)}</b> in the league.`]);
    if (t.series >= 5) out.push(["up", `Playoff-tested: <b>${t.series} playoff series won</b> in the last 3 years, the idea that survived the lab.`]);
    else if (t.series === 0 && t.cup > 0.02) out.push(["down", `<b>No playoff series won</b> in the last 3 years, and the model cares about that.`]);
    else if (t.series > 0) out.push(["", `<b>${t.series}</b> playoff series won in the last 3 years.`]);
    const r = t.cup / Math.max(t.market, 0.001);
    if (t.market > 0.02 && r < 0.6) out.push(["down", `The betting markets have them at <b>${pct(t.market)}</b>; the model is much lower.`]);
    if (t.market > 0.01 && r > 1.6) out.push(["up", `The betting markets have them at only <b>${pct(t.market)}</b>; the model likes them far more.`]);
    return out;
  }
  function render(k) {
    const t = T[k], mxv = Math.max(...t.versions, 0.001), rank = keys.indexOf(k) + 1, W = why(k);
    $("#dig").innerHTML = `<div class="card">
      <div class="dig-top">
        <div><span class="card-label">#${rank} of 32 · ${confN(k)}</span><h3>${logo(k, 40)} ${esc(nm(k))}</h3>
          <div class="meta"><span>Make the playoffs <b>${pct(t.playoffs)}</b></span><span>Reach the Final <b>${pct(t.final)}</b></span><span>Projected points <b>${Math.round(t.pts)}</b> (${t.pts_lo}–${t.pts_hi})</span><span>Betting markets <b>${pct(t.market)}</b></span></div></div>
        <div style="display:flex;gap:18px;align-items:flex-start"><div class="dig-odds"><div class="n">${pctS(t.cup)}</div><div class="l">Win the 2027 Cup</div></div><button class="dig-close" aria-label="Close">✕</button></div>
      </div>
      <div class="dig-why3"><h4>Why the model says ${pctS(t.cup)}</h4><ul class="why">${W.slice(0, 3).map(([c, x]) => `<li class="${c}">${x}</li>`).join("")}</ul></div>
      <details class="dig-more"><summary>How the model got there</summary>
      <div class="dig-body">
        <div>
          ${W.length > 3 ? `<div class="dig-sec"><h4>Also in the mix</h4><ul class="why">${W.slice(3).map(([c, x]) => `<li class="${c}">${x}</li>`).join("")}</ul></div>` : ""}
          <div class="dig-sec"><h4>Cup odds as the model was built</h4><div class="path">${t.versions.map((p, i) => `<div class="path-row"><span class="lb">${VER[i]}</span><span class="tr"><i style="width:${(p / mxv) * 100}%"></i></span><span class="pv">${pctS(p)}</span></div>`).join("")}</div></div>
          <div class="dig-sec"><h4>Road to the Cup (share of 10,000 seasons)</h4><div class="path">${[["Make the playoffs", t.playoffs], ["Win a round", t.r2], ["Win the conference", t.final], ["Win the Cup", t.cup]].map(([l, p]) => `<div class="path-row"><span class="lb">${l}</span><span class="tr"><i style="width:${p * 100}%"></i></span><span class="pv">${pctS(p)}</span></div>`).join("")}</div></div>
        </div>
        <div>
          <div class="dig-sec"><h4>Most likely Final opponents</h4>${t.opp.length ? t.opp.map(([o, q]) => `<div class="comp" style="grid-template-columns:1fr auto"><div class="lbl"><a href="#${o}" style="color:inherit">${logo(o, 16)} ${esc(nm(o))}</a></div><div class="p">${pct(q)}</div></div>`).join("") : `<p class="muted" style="margin:0">Not among the most common Finals.</p>`}</div>
          <div class="dig-sec"><h4>Cups in the backtest (2009–2026)</h4><div class="vote-chips">${D.backtest.rows.filter((r) => r.champ === k).map((r) => `<span class="win">★ ${r.year} · model had them #${r.rank} (${pct(r.p)})</span>`).join("") || "<span>No Cups since 2009</span>"}</div></div>
        </div>
      </div></details>
      <div class="dig-links"><a class="link-arrow" href="/hockey/players/#${k}">${esc(nm(k))} players</a><div id="share-dig"></div></div></div>`;
    shareBar($("#share-dig"), { url: `/hockey/cup.html#${k}`, item: k, text: `The model gives the ${nm(k)} a ${pctS(t.cup)} chance to win the 2027 Stanley Cup (#${rank} of 32). Here's why:` });
    track("view_item", { item_category: "nhl_team", item_id: k, item_name: nm(k) });
    $(".dig-close").onclick = () => { $("#dig").innerHTML = ""; s.set(""); history.replaceState(null, "", location.pathname); };
  }
  const open = (k, scroll = true) => {
    if (!T[k]) return;
    render(k); s.set(nm(k));
    if (location.hash !== "#" + k) history.replaceState(null, "", "#" + k);
    if (scroll) $("#dig-sec").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  window.digTeam = open;
  const names = keys.map((k) => ({ k, name: nm(k), meta: `${k} · ${pctS(T[k].cup)}` }));
  const s1 = search($("#find"), names, (n) => open(n.k, false), "Search a team: Oilers, Leafs, Canadiens…");
  const s2 = search($("#find-top"), names, (n) => open(n.k, true), "Search any team…", { big: true, cycle: ["Oilers", "Maple Leafs", "Hurricanes", "Canadiens", "Avalanche"] });
  const s = { set: (v) => { s1.set(v); s2.set(v); } };
  const ALIAS = { leafs: "TOR", habs: "MTL", sens: "OTT", avs: "COL", canes: "CAR", bolts: "TBL", pens: "PIT", caps: "WSH", isles: "NYI", knights: "VGK", hawks: "CHI", jackets: "CBJ", wings: "DET", preds: "NSH", nucks: "VAN" };
  $("#find input").addEventListener("keydown", (e) => {
    const q = fold(e.target.value.trim()), k = ALIAS[q] || keys.find((x) => fold(x) === q);
    if (e.key === "Enter" && k) open(k, false);
  });
  const TRY = ["EDM", "TOR", "MTL", "COL", "FLA"];
  $("#try").innerHTML = `Try: ${TRY.map((k) => `<button class="chip" data-k="${k}">${esc(nick(k))}</button>`).join(" ")}`;
  $("#try").onclick = (e) => { const b = e.target.closest(".chip"); if (b) open(b.dataset.k, false); };
  const fromHash = () => { const k = location.hash.slice(1).toUpperCase(); if (T[k] && !$("#dig h3")?.textContent.includes(nm(k))) open(k); };
  window.addEventListener("hashchange", fromHash);
  setTimeout(fromHash, 300);
  reveal();
});
