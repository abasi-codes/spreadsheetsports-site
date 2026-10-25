// Title odds: search any team and dig into what drives its 10,000-season odds
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, pct, ord, fold, search, slug, track, shareBar, newsletter } = SS;
  const SINGLE = document.body.dataset.team;   // set on /teams/<slug>/ pages
  const [{ teams: T }, teams, title] = await Promise.all([data("title_teams"), data("teams"), data("title")]);
  const VER = ["Last season only", "+ Roster moves", "+ Aging & health (cut)", "+ Playoff experience", "+ Playoff rotation (final)"];
  const keys = Object.keys(T).sort((a, b) => T[b].p - T[a].p);
  const champ26 = title.backtest.rows.find((r) => r.year === 2026)?.champ;
  const pctS = (p) => (p === 0 ? "<0.01%" : p < 0.001 ? "<0.1%" : pct(p));
  const sg = (x, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d);
  const confN = (k) => (teams[k].conf === "E" ? "East" : "West");
  const ending = (k, l) => !l.made ? "missed the playoffs" : l.rounds >= 4 ? (k === champ26 ? "won the title" : "lost in the Finals") : ["lost in the first round", "lost in the first round", "lost in the second round", "lost in the conference finals"][l.rounds];

  function why(k) {
    const t = T[k], l = t.last, b = t.breakdown, out = [];
    out.push(["", `Last season: <b>${l.w}-${l.l}</b> with a ${sg(l.net)} net rating, and they <b>${ending(k, l)}</b>. The model carries 75% of that forward.`]);
    const roster = b["Roster changes"], exp = b["Playoff experience"] + b["Stars' experience"], star = b["Best player"];
    if (roster >= 0.8) out.push(["up", `Roster moves make them about <b>${sg(roster)} points per 100</b> better than last year's rotation.`]);
    if (roster <= -0.8) out.push(["down", `Roster changes cost them about <b>${sg(roster)} points per 100</b> compared with last year's rotation.`]);
    if (exp >= 1) out.push(["up", `Playoff-tested: their rotation has logged a lot of playoff minutes, worth <b>${sg(exp)}</b> in the postseason.`]);
    if (exp <= -1) out.push(["down", `Inexperience: few playoff minutes in the rotation costs them <b>${sg(exp)}</b> in the postseason.`]);
    if (star >= 0.75) out.push(["up", `They have a true top star, worth <b>${sg(star)}</b> in the playoffs.`]);
    if (star <= -0.75) out.push(["down", `No true top star, which costs them <b>${sg(star)}</b> in the playoffs.`]);
    const d = t.reg_rank - t.po_rank;
    if (d >= 4) out.push(["up", `Built for April: <b>${ord(t.reg_rank)}</b> in the regular season but <b>${ord(t.po_rank)}</b> once the playoffs start.`]);
    if (d <= -4) out.push(["down", `Better in the regular season (<b>${ord(t.reg_rank)}</b>) than in the playoffs (<b>${ord(t.po_rank)}</b>).`]);
    const v1 = t.versions[0];
    if (v1 > 0.01 && t.p / v1 < 0.5) out.push(["down", `Going on last season alone, they'd be at <b>${pctS(v1)}</b>. Everything the model adds since then pulls them down.`]);
    if (t.p > 0.01 && t.p / Math.max(v1, 0.001) > 2) out.push(["up", `Going on last season alone, they'd be at only <b>${pctS(v1)}</b>. Everything the model adds since then lifts them.`]);
    return out;
  }

  function render(k) {
    const t = T[k], tm = teams[k], mxv = Math.max(...t.versions, 0.001), b = t.breakdown;
    const mxb = Math.max(...Object.values(b).map(Math.abs), 1);
    const mxr = Math.max(...t.rotation.map(([, x]) => Math.abs(x)), 1);
    const rank = keys.indexOf(k) + 1, W = why(k);
    $("#dig").innerHTML = `<div class="card" style="border-top:3px solid ${tm.color}">
      <div class="dig-top">
        <div><span class="card-label">#${rank} of 30 · ${confN(k)}</span><h3>${esc(tm.name)}</h3>
          <div class="meta"><span>Win the ${confN(k)} <b>${pctS(t.conf)}</b></span><span>Reg. season rating <b>${sg(t.reg)}</b> (${ord(t.reg_rank)})</span><span>Playoff rating <b>${sg(t.po)}</b> (${ord(t.po_rank)})</span></div></div>
        <div style="display:flex;gap:18px;align-items:flex-start"><div class="dig-odds"><div class="n">${pctS(t.p)}</div><div class="l">Win the 2027 title</div></div>
          ${SINGLE ? "" : `<button class="dig-close" aria-label="Close">✕</button>`}</div>
      </div>
      <div class="dig-why3"><h4>Why the model says ${pctS(t.p)}</h4><ul class="why">${W.slice(0, 3).map(([c, x]) => `<li class="${c}">${x}</li>`).join("")}</ul></div>
      <details class="dig-more"><summary>How the model got there</summary>
      <div class="dig-body">
        <div>
          ${W.length > 3 ? `<div class="dig-sec"><h4>Also in the mix</h4><ul class="why">${W.slice(3).map(([c, x]) => `<li class="${c}">${x}</li>`).join("")}</ul></div>` : ""}
          <div class="dig-sec"><h4>What builds their playoff rating (points per 100)</h4><div class="div-bars">${Object.entries(b).map(([n, v]) => `<div class="div-row"><span class="lb">${n}</span>
            <span class="neg">${v < 0 ? `<i style="width:${(-v / mxb) * 100}%"></i>` : ""}</span><span class="pos">${v > 0 ? `<i style="width:${(v / mxb) * 100}%"></i>` : ""}</span><span class="pv">${sg(v)}</span></div>`).join("")}</div></div>
          <div class="dig-sec"><h4>Title odds as the model was built</h4><div class="path">${t.versions.map((p, i) => `<div class="path-row"><span class="lb">v${i + 1}. ${VER[i]}</span><span class="tr"><i style="width:${(p / mxv) * 100}%"></i></span><span class="pv">${pctS(p)}</span></div>`).join("")}</div></div>
        </div>
        <div>
          <div class="dig-sec"><h4>Expected playoff rotation</h4><table class="mini-table"><thead><tr><th>Player</th><th>Impact (BPM)</th><th>Min</th></tr></thead><tbody>
            ${t.rotation.map(([n, x, m]) => `<tr><td style="font-family:var(--sans)">${esc(n)}</td><td style="color:${x >= 0 ? "var(--green)" : "var(--muted)"}">${sg(x)}</td><td>${Math.round(m)}</td></tr>`).join("")}</tbody></table></div>
          <div class="dig-sec"><h4>Most likely Finals opponents</h4>${t.opp.length ? t.opp.map(([o, q]) => `<div class="comp" style="grid-template-columns:1fr auto"><div class="lbl"><a href="${SINGLE ? "/teams/" + slug(teams[o].name) + "/" : `#${o}`}" style="color:inherit">${esc(teams[o].name)}</a></div><div class="p">${pctS(q)}</div></div>`).join("") : `<p class="muted" style="margin:0">They didn't reach the Finals in any of the 10,000 seasons.</p>`}</div>
          <div class="dig-sec"><h4>Titles in the backtest (2006–2026)</h4><div class="vote-chips">${t.history.length ? t.history.map(([y, rk, p]) => `<span class="win">★ ${y} · model had them #${rk} (${pct(p)})</span>`).join("") : "<span>No titles since 2006</span>"}</div></div>
        </div>
      </div></details>
      <div class="dig-links">${SINGLE ? `<a class="link-arrow" href="/models/title.html#${k}">All 30 teams on the title tracker</a><a class="link-arrow" href="#roster">${esc(tm.name)} roster</a>` : `<a class="link-arrow" href="${"/teams/" + slug(tm.name) + "/"}">Open the ${esc(tm.name)} page</a><div id="share-dig"></div>`}</div>
      </div>`;
    if (!SINGLE) shareBar($("#share-dig"), { url: "/teams/" + slug(tm.name) + "/", item: slug(tm.name),
      text: `The model gives the ${tm.name} a ${pctS(t.p)} chance to win the 2027 title (#${rank} of 30). Here's why:` });
    track("view_item", { item_category: "team", item_id: slug(tm.name), item_name: tm.name });
    if (SINGLE) return;
    $(".dig-close").onclick = () => { $("#dig").innerHTML = ""; s.set(""); history.replaceState(null, "", location.pathname); };
  }

  if (SINGLE) {
    const k = keys.find((x) => slug(teams[x].name) === SINGLE); if (k) render(k);
    if ($("#find")) search($("#find"), keys.map((x) => ({ k: x, name: teams[x].name, meta: `${x} · ${pctS(T[x].p)}` })), (n) => { location.href = "/teams/" + slug(n.name) + "/"; }, "Look up another team…", { big: true, cycle: ["Knicks", "Lakers", "Thunder", "Raptors"] });
    return;
  }
  const open = (k, scroll = true) => {
    if (!T[k]) return;
    render(k); s.set(teams[k].name);
    if (location.hash !== "#" + k) history.replaceState(null, "", "#" + k);
    if (scroll) $("#dig-sec").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  window.digTeam = open;
  const names = keys.map((k) => ({ k, name: teams[k].name, meta: `${k} · ${pctS(T[k].p)}` }));
  const TCYCLE = ["Knicks", "Lakers", "Celtics", "Thunder", "Raptors", "Warriors"];
  const s1 = search($("#find"), names, (n) => open(n.k, false), "Search a team: Knicks, Lakers, Celtics…");
  const s2 = $("#find-top") ? search($("#find-top"), names, (n) => open(n.k, true), "Search any team…", { big: true, cycle: TCYCLE }) : null;
  const s = { set: (v) => { s1.set(v); s2 && s2.set(v); } };
  // nicknames match too ("Knicks", "Sixers", "Wolves")
  const ALIAS = { sixers: "PHI", wolves: "MIN", cavs: "CLE", mavs: "DAL", blazers: "POR", dubs: "GSW", nets: "BRK" };
  $("#find input").addEventListener("keydown", (e) => {
    const k = ALIAS[fold(e.target.value.trim())] || keys.find((x) => fold(x) === fold(e.target.value.trim()));
    if (e.key === "Enter" && k) open(k, false);
  });
  const TRY = ["NYK", "LAL", "BOS", "GSW", "TOR"];
  $("#try").innerHTML = `Try: ${TRY.map((k) => `<button class="chip" data-k="${k}">${esc(teams[k].name.split(" ").slice(-1)[0])}</button>`).join(" ")}`;
  $("#try").onclick = (e) => { const b = e.target.closest(".chip"); if (b) open(b.dataset.k, false); };
  const fromHash = () => { const k = location.hash.slice(1).toUpperCase(); if (T[k] && $("#dig h3")?.textContent !== teams[k].name) open(k); };
  window.addEventListener("hashchange", fromHash);
  setTimeout(fromHash, 300);
});
