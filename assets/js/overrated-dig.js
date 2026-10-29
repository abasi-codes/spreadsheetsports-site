// Hockey: most overrated players page (/hockey/overrated.html). Reads data/hockey_overrated.json (~/nhl-overrated/model/site_export_overrated.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, search, newsletter, embed, table, reveal, SUB } = SS;
  const D = await data("hockey_overrated");
  const NM = { ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CGY: "Calgary Flames", CAR: "Carolina Hurricanes", CHI: "Chicago Blackhawks", COL: "Colorado Avalanche",
    CBJ: "Columbus Blue Jackets", DAL: "Dallas Stars", DET: "Detroit Red Wings", EDM: "Edmonton Oilers", FLA: "Florida Panthers", LAK: "Los Angeles Kings", MIN: "Minnesota Wild",
    MTL: "Montreal Canadiens", NSH: "Nashville Predators", NJD: "New Jersey Devils", NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", PHI: "Philadelphia Flyers",
    PIT: "Pittsburgh Penguins", SJS: "San Jose Sharks", SEA: "Seattle Kraken", STL: "St. Louis Blues", TBL: "Tampa Bay Lightning", TOR: "Toronto Maple Leafs", UTA: "Utah Mammoth",
    VAN: "Vancouver Canucks", VGK: "Vegas Golden Knights", WSH: "Washington Capitals", WPG: "Winnipeg Jets" };
  const nm = (k) => NM[k] || k;
  const logo = (k, s = 28) => `<img src="https://assets.nhle.com/logos/nhl/svg/${k}_dark.svg" alt="" width="${s * 1.5}" height="${s}" style="object-fit:contain;vertical-align:middle;display:inline-block;margin-right:6px">`;
  const byName = Object.fromEntries(D.board.map((r) => [r.n, r]));
  $("#sub-page").href = SUB; newsletter($("#nl-page"));
  if (D.video) { const v = (await data("videos")).find((x) => x.id === D.video); if (v && (!v.publishAt || new Date(v.publishAt) <= new Date())) embed($("#video"), D.video); else $("#video").closest(".reveal").remove(); }
  else $("#video").closest(".reveal").remove();
  $("#top3").innerHTML = D.top3.map((n, i) => { const r = byName[n];
    return `<div class="card reveal" id="p-${n.toLowerCase().replace(/[^a-z]+/g, "-")}"><span class="card-label">#${i + 1} most overrated</span>
      <h3 style="margin:10px 0 4px;font-size:24px">${logo(r.t, 22)}${esc(n)}</h3><p class="dim" style="margin:0 0 14px">${esc(nm(r.t))} · ${r.p === "D" ? "Defence" : "Forward"}</p>
      <div style="display:flex;gap:18px"><div><div class="dim" style="font-size:12px">THE EXPERTS</div><div style="font:700 34px Anton,sans-serif;color:#2fbf71">${r.exp.toFixed(1)}</div></div>
      <div><div class="dim" style="font-size:12px">THE DATA</div><div style="font:700 34px Anton,sans-serif;color:#e3141e">#${r.imp}</div></div></div></div>`; }).join("");
  const c = byName["Sidney Crosby"], VL = { v1: "Points", v2: "Chances", v3: "On the ice", v4: "Defence", v5: "Deployment" };
  $("#ladder").innerHTML = Object.keys(VL).map((k) =>
    `<div class="card reveal" style="padding:14px"><span class="card-label">${k.toUpperCase()} · ${VL[k]}</span>
      <div style="font:700 34px Anton,sans-serif;margin-top:6px">#${c.ranks[k]}</div>
      <div class="dim" style="font-size:13px">Leader: ${esc(D.leaders[k])}</div></div>`).join("");
  const keys = Object.keys(D.teams).sort();
  $("#grid").innerHTML = keys.map((k) => { const t = D.teams[k], fair = t && t.gap < 10;
    const line = !t ? "No pick: nobody on this roster is on an expert list" : fair ? "Rated fairly: no big gap on this roster" : `Experts ${t.exp.toFixed(1)} · Data #${t.imp}`;
    return `<a class="card ur-tile" id="${k}" href="#${k}" style="display:block;padding:14px"><div style="display:flex;align-items:center;gap:6px">${logo(k, 22)}<b>${esc(nm(k))}</b></div>
      <div style="margin-top:8px;font-weight:700">${t ? `${esc(t.name)} <span class="dim">· ${t.pos === "D" ? "D" : "F"}</span>` : '<span class="dim">—</span>'}</div>
      <div class="dim" style="font-size:13px;margin-top:4px">${line}</div></a>`; }).join("");
  table($("#table"), [
    { key: "exp", label: "Experts", num: true, asc: true, fmt: (r) => `<b>${r.exp.toFixed(1)}</b>` },
    { key: "n", label: "Player", asc: true, fmt: (r) => `${logo(r.t, 16)}${esc(r.n)}${r.proj ? ' <span class="dim">(young)</span>' : !r.top20 ? ' <span class="dim">(not top 20)</span>' : ""}` },
    { key: "p", label: "Pos", asc: true },
    { key: "imp", label: "Data", num: true, asc: true, fmt: (r) => `#${r.imp}` },
    { key: "gap", label: "Gap", num: true, fmt: (r) => `<b>${r.gap > 0 ? "+" : ""}${r.gap.toFixed(1)}</b>` },
    { key: "pts", label: "Pts 25-26", num: true },
  ], D.board, { sort: "exp", dir: 1 });
  const names = D.board.map((r) => ({ name: r.n, k: r.t })).concat(keys.map((k) => ({ name: nm(k), k })));
  const go = (n) => { const el = document.getElementById(n.k); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); } };
  search($("#find-top"), names, go, "Search any skater or team…", { big: true, cycle: ["Sidney Crosby", "Maple Leafs", "Mitch Marner", "Canadiens", "Oilers"] });
  reveal();   // cards are added after site.js's first reveal pass
});
