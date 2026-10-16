// MVP tracker: search any candidate and dig into why the model rates him where it does
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, pct, ord, fold, search, slug, track, shareBar, newsletter } = SS;
  const SINGLE = document.body.dataset.player;   // set on /players/<slug>/ pages
  const [{ players }, teams, tt] = await Promise.all([data("mvp_players"), data("teams"), data("title_teams")]);
  const STEP = ["Projections + simulation", "How voters vote", "Voters' memory", "Three-peat fatigue", "Age 31+", "Tuned", "Defense", "Everyone healthy", "Last year's Finals"];
  const N = players.length;
  const byBpm = [...players].sort((a, b) => b.proj.bpm - a.proj.bpm);
  const tname = (t) => teams[t]?.name || t || "Free agent";
  const finalsTeam = (t) => tt.teams[t]?.last.rounds === 4;
  const conf = (t) => (teams[t]?.conf === "W" ? "West" : "East");
  const sg = (x) => (x > 0 ? "+" : "") + x.toFixed(1);
  const pctS = (p) => (p < 0.0005 ? "<0.1%" : pct(p));

  function why(r) {
    const s = r.steps.map((x) => Math.max(x, 0.0003)), out = [];
    const ly = r.votes.find((v) => v[0] === 2026), lastWin = r.mvps.includes(2025) && r.mvps.includes(2026);
    const bpmRank = byBpm.indexOf(r) + 1;
    out.push(["", `The base model projects <b>${r.proj.ppg} points</b> and a <b>${sg(r.proj.bpm)} impact rating</b> (BPM, ${ord(bpmRank)} of ${N} candidates), with ${esc(tname(r.team))} projected for <b>${r.team_wins ?? "?"} wins</b>${r.seed ? ` (${ord(r.seed)} in the ${conf(r.team)})` : ""}.`]);
    for (let i = 1; i < s.length; i++) {
      const ratio = s[i] / s[i - 1], big = Math.max(r.steps[i], r.steps[i - 1]) >= 0.002;
      const lo = i === 8 && finalsTeam(r.team) ? 1.1 : 1.35;
      if (!big || (ratio < lo && ratio > 1 / lo)) continue;
      const up = ratio > 1, x = up ? (ratio >= 2 ? `${ratio.toFixed(ratio >= 10 ? 0 : 1)}×` : `${Math.round((ratio - 1) * 100)}%`) : `${Math.round((1 - ratio) * 100)}%`;
      const txt = {
        1: up ? `Voters reward all-around stars who are clearly the best player on a winning team. His profile fits, so his odds go up ${x}.`
              : `Voters reward all-around stars who are the best player on a top team. His case leans more on raw scoring, so his odds drop ${x}.`,
        2: up ? (ly ? `He finished <b>${ord(ly[2])} in last year's vote</b>, and voters lean on last year's ballot. That memory lifts him ${x}.` : `Voters lean on last year's ballot, and the stars ahead of him lose ground. Up ${x}.`)
              : (ly ? `He finished ${ord(ly[2])} last year, and voters' memory favours the names above him. Down ${x}.` : `He got <b>no MVP votes last season</b>, and voters lean on last year's ballot. Down ${x}.`),
        3: lastWin ? `He's won the last two. Nobody has won three straight since Larry Bird, so voters tend to move on. Down ${x}.`
                   : up ? `The two-time defending MVP gets discounted for three-peat fatigue, which frees up share. Up ${x}.` : `Three-peat fatigue reshuffles the top. Down ${x}.`,
        4: r.age >= 31 ? `He'll be <b>${r.age}</b>. Nobody 31 or older has won MVP since Steve Nash, so the model discounts him ${x}.`
                       : up ? `At ${r.age}, he gains when the older stars get the age-31+ discount. Up ${x}.` : `The age adjustment shuffles the field. Down ${x}.`,
        5: `Tuning the model to 42 seasons of real votes ${up ? "raises" : "lowers"} his odds ${x}.`,
        6: up ? `Once defense counts (defensive win shares), his two-way game is worth more. Up ${x}.` : `Once defense counts, two-way stars pass him. Down ${x}.`,
        7: up && r.proj.games < 65 ? `Based on recent seasons, the model projects only <b>${r.proj.games} games</b>, short of the 65-game rule. Assuming he stays healthy brings him back. Up ${x}.`
              : up ? `Assuming everyone stays healthy helps him. Up ${x}.` : `When everyone is assumed healthy, stars who were losing games to the 65-game rule come back. Down ${x}.`,
        8: finalsTeam(r.team) && up ? `${esc(tname(r.team))} made <b>last year's Finals</b>, and stars coming off a Finals run get a ×1.3 storyline bump. Up ${x}.`
              : up ? `The Finals bump goes to others, but his share holds. Up ${x}.` : `Stars from last year's Finals teams get a ×1.3 bump, which takes some share from him. Down ${x}.`,
      }[i];
      out.push([up ? "up" : "down", txt]);
    }
    if (r.age >= 31 && !out.some(([, t]) => t.includes("Steve Nash"))) out.push(["down", `He'll be <b>${r.age}</b>, and nobody 31 or older has won MVP since Steve Nash. The model cuts his odds in half for that.`]);
    if (out.length === 1) out.push(["", r.p < 0.005 ? `None of the voter factors move him much. The gap starts at the base projection: the favourites project far more impact on better teams.` : `None of the voter factors move him much. His odds come almost entirely from the base projection.`]);
    if (r.proj.games < 65) out.push(["down", `Injury risk: the final odds assume he reaches the 65-game minimum, but he's averaged about ${r.proj.games} games a season lately. Missing that cut is the biggest threat to his case.`]);
    return out;
  }

  function render(r) {
    const mx = Math.max(...r.steps, 0.001);
    const votes = r.votes.length ? r.votes.map(([y, sh, rk]) => `<span class="${r.mvps.includes(y) ? "win" : rk <= 3 ? "top" : ""}" title="${pct(sh)} vote share">${r.mvps.includes(y) ? "★ " : ""}${y - 1}-${String(y).slice(2)} · ${ord(rk)}</span>`).join("") : `<span>No MVP votes yet</span>`;
    const bt = r.bt.length ? `<div class="dig-sec"><h4>In the backtest</h4><p class="muted" style="margin:0 0 10px;font-size:14px">Seasons where the model had him in its preseason top 5:</p>
      <div class="vote-chips">${r.bt.map(([y, rk, p, won]) => `<span class="${won ? "win" : ""}">${won ? "★ " : ""}${y - 1}-${String(y).slice(2)} · #${rk} · ${pct(p)}</span>`).join("")}</div></div>` : "";
    $("#dig").innerHTML = `<div class="card">
      <div class="dig-top">
        <div><span class="card-label">#${r.rank} of ${N} candidates</span><h3>${esc(r.name)}</h3>
          <div class="meta"><span><b>${esc(tname(r.team))}</b></span><span>Age <b>${r.age}</b></span>${r.mvps.length ? `<span><b>${r.mvps.length}×</b> MVP</span>` : ""}</div></div>
        <div style="display:flex;gap:18px;align-items:flex-start"><div class="dig-odds"><div class="n">${pctS(r.p)}</div><div class="l">Chance to win MVP</div></div>
          ${SINGLE ? "" : `<button class="dig-close" aria-label="Close">✕</button>`}</div>
      </div>
      <div class="dig-body">
        <div>
          <div class="dig-sec"><h4>Why the model says ${pctS(r.p)}</h4><ul class="why">${why(r).map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul></div>
          <div class="dig-sec"><h4>How each factor moved him</h4><div class="path">${r.steps.map((p, i) => `<div class="path-row"><span class="lb">${i + 1}. ${STEP[i]}</span><span class="tr"><i style="width:${(p / mx) * 100}%"></i></span><span class="pv">${pctS(p)}</span></div>`).join("")}</div></div>
        </div>
        <div>
          <div class="dig-sec"><h4>2026-27 projection</h4><div class="tiles">
            ${[["ppg", r.proj.ppg], ["rpg", r.proj.rpg], ["apg", r.proj.apg], ["impact (BPM)", sg(r.proj.bpm)], ["games", r.proj.games], ["team wins", r.team_wins ?? "–"]].map(([k, v]) => `<div class="tile"><div class="v">${v}</div><div class="k">${k}</div></div>`).join("")}</div></div>
          <div class="dig-sec"><h4>Last three seasons</h4>${r.seasons.length ? `<table class="mini-table"><thead><tr><th>Season</th><th>Team</th><th>G</th><th>PTS</th><th>REB</th><th>AST</th><th>BPM</th></tr></thead><tbody>
            ${r.seasons.map(([y, t, g, p, rb, a, b]) => `<tr><td>${y - 1}-${String(y).slice(2)}</td><td>${esc(t)}</td><td>${g}</td><td>${p}</td><td>${rb}</td><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No recent NBA seasons.</p>`}</div>
          <div class="dig-sec"><h4>MVP voting history</h4><div class="vote-chips">${votes}</div></div>
          ${bt}
        </div>
      </div>
      <div class="dig-foot">
        <div><h4>Get updates when his odds move</h4><div id="nl-dig"></div></div>
        <div><h4>Share ${esc(r.name.split(" ").slice(-1)[0])}'s card</h4><div id="share-dig"></div>
          ${SINGLE ? `<a class="link-arrow" href="/models/mvp.html" style="display:inline-block;margin-top:14px">Full 2027 MVP tracker</a>` : `<a class="link-arrow" href="/players/${slug(r.name)}/" style="display:inline-block;margin-top:14px">Open ${esc(r.name)}'s full page</a>`}</div>
      </div></div>`;
    newsletter($("#nl-dig"), { compact: true, note: "One email a week with model updates. Free." });
    shareBar($("#share-dig"), { url: `/players/${slug(r.name)}/`, item: slug(r.name),
      text: `The model gives ${r.name} a ${pctS(r.p)} chance to win the 2027 MVP (#${r.rank} of ${N}). Here's why:` });
    track("view_item", { item_category: "player", item_id: slug(r.name), item_name: r.name });
    if (SINGLE) return;
    $(".dig-close").onclick = () => { $("#dig").innerHTML = ""; s.set(""); history.replaceState(null, "", location.pathname); };
    history.replaceState(null, "", "#" + encodeURIComponent(r.name.replace(/ /g, "-")));
  }

  if (SINGLE) {
    const r = players.find((p) => slug(p.name) === SINGLE); if (r) render(r);
    const go = (n) => { location.href = `/players/${slug(n.name)}/`; };
    if ($("#find")) search($("#find"), players.map((p) => ({ name: p.name, meta: `${p.team || "FA"} · ${pctS(p.p)}` })), go, "Look up another player…", { big: true, cycle: ["Wembanyama", "Jalen Brunson", "LeBron James", "Kawhi Leonard"] });
    return;
  }
  const open = (name, scroll = true) => {
    const r = players.find((p) => p.name === name); if (!r) return;
    render(r); s.set(r.name);
    if (scroll) $("#dig-sec").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  window.digPlayer = open;
  const LIST = players.map((p) => ({ name: p.name, meta: `${p.team || "FA"} · ${pctS(p.p)}` }));
  const CYCLE = ["Wembanyama", "Jalen Brunson", "LeBron James", "Anthony Edwards", "Kawhi Leonard", "Luka Dončić"];
  const s1 = search($("#find"), LIST, (n) => open(n.name, false), "Search a player: Brunson, LeBron, Edwards…");
  const s2 = $("#find-top") ? search($("#find-top"), LIST, (n) => open(n.name, true), "Search any player…", { big: true, cycle: CYCLE }) : null;
  const s = { set: (v) => { s1.set(v); s2 && s2.set(v); } };
  const TRY = ["Jalen Brunson", "Anthony Edwards", "LeBron James", "Stephen Curry", "Giannis Antetokounmpo"].filter((n) => players.some((p) => p.name === n));
  $("#try").innerHTML = `Try: ${TRY.map((n) => `<button class="chip" data-n="${esc(n)}">${esc(n.split(" ").slice(-1)[0])}</button>`).join(" ")} <div style="margin-top:8px">${N} players in the model: everyone projected to start.</div>`;
  $("#try").onclick = (e) => { const b = e.target.closest(".chip"); if (b) open(b.dataset.n, false); };
  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1)).replace(/-/g, " ");
    const hit = h && players.find((p) => fold(p.name.replace(/-/g, " ")) === fold(h));
    if (hit && $("#find input").value !== hit.name) open(hit.name);
  };
  window.addEventListener("hashchange", fromHash);
  setTimeout(fromHash, 300);
});
