// Hockey: most underrated players page (/hockey/underrated.html). Reads data/hockey_underrated.json (~/nhl-underrated/model/site_export.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, ord, search, newsletter, embed, table, reveal, SUB } = SS;
  const D = await data("hockey_underrated");
  const NM = { ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CGY: "Calgary Flames", CAR: "Carolina Hurricanes", CHI: "Chicago Blackhawks", COL: "Colorado Avalanche",
    CBJ: "Columbus Blue Jackets", DAL: "Dallas Stars", DET: "Detroit Red Wings", EDM: "Edmonton Oilers", FLA: "Florida Panthers", LAK: "Los Angeles Kings", MIN: "Minnesota Wild",
    MTL: "Montreal Canadiens", NSH: "Nashville Predators", NJD: "New Jersey Devils", NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", PHI: "Philadelphia Flyers",
    PIT: "Pittsburgh Penguins", SJS: "San Jose Sharks", SEA: "Seattle Kraken", STL: "St. Louis Blues", TBL: "Tampa Bay Lightning", TOR: "Toronto Maple Leafs", UTA: "Utah Mammoth",
    VAN: "Vancouver Canucks", VGK: "Vegas Golden Knights", WSH: "Washington Capitals", WPG: "Winnipeg Jets" };
  const nm = (k) => NM[k] || k;
  const logo = (k, s = 28) => `<img src="https://assets.nhle.com/logos/nhl/svg/${k}_dark.svg" alt="" width="${s * 1.5}" height="${s}" style="object-fit:contain;vertical-align:middle;display:inline-block;margin-right:6px">`;
  const exp = (x) => (x >= 90 ? "on no list" : x.toFixed(1));
  const byName = Object.fromEntries(D.board.map((r) => [r.n, r]));
  $("#sub-page").href = SUB; newsletter($("#nl-page"));
  if (D.video) { const v = (await data("videos")).find((x) => x.id === D.video); if (v && (!v.publishAt || new Date(v.publishAt) <= new Date())) embed($("#video"), D.video); else $("#video").closest(".reveal").remove(); }
  else $("#video").closest(".reveal").remove();
  $("#top3").innerHTML = D.top3.map((n, i) => { const r = byName[n];
    return `<div class="card reveal" id="p-${n.toLowerCase().replace(/[^a-z]+/g, "-")}"><span class="card-label">#${i + 1} most underrated</span>
      <h3 style="margin:10px 0 4px;font-size:24px">${logo(r.t, 22)}${esc(n)}</h3><p class="dim" style="margin:0 0 14px">${esc(nm(r.t))} · ${r.p === "D" ? "Defence" : "Forward"}</p>
      <div style="display:flex;gap:18px"><div><div class="dim" style="font-size:12px">THE DATA</div><div style="font:700 34px Anton,sans-serif;color:#2fbf71">#${r.imp}</div></div>
      <div><div class="dim" style="font-size:12px">THE EXPERTS</div><div style="font:700 34px Anton,sans-serif;color:#e3141e">${exp(r.exp)}</div></div></div></div>`; }).join("");
  const keys = Object.keys(D.teams).sort();
  $("#grid").innerHTML = keys.map((k) => { const t = D.teams[k], fair = t.gap <= 0;
    return `<a class="card ur-tile" id="${k}" href="#${k}" style="display:block;padding:14px"><div style="display:flex;align-items:center;gap:6px">${logo(k, 22)}<b>${esc(nm(k))}</b></div>
      <div style="margin-top:8px;font-weight:700">${esc(t.name)} <span class="dim">· ${t.pos === "D" ? "D" : "F"}</span></div>
      <div class="dim" style="font-size:13px;margin-top:4px">${fair ? "Rated fairly: no big gap on this roster" : `Data #${t.imp} · Experts ${exp(t.perc)}`}${t.moved ? ` · was ${esc(t.last_team)}` : ""}</div></a>`; }).join("");
  table($("#table"), [
    { key: "imp", label: "Data", num: true, asc: true, fmt: (r) => `<b>#${r.imp}</b>` },
    { key: "n", label: "Player", asc: true, fmt: (r) => `${logo(r.t, 16)}${esc(r.n)}${r.c ? ' <span class="dim">(carried)</span>' : ""}` },
    { key: "p", label: "Pos", asc: true },
    { key: "exp", label: "Experts", num: true, fmt: (r) => exp(r.exp) },
    { key: "gap", label: "Gap", num: true, fmt: (r) => (r.c ? '<span class="dim">—</span>' : `<b>${r.gap > 0 ? "+" : ""}${r.gap.toFixed(1)}</b>`) },
    { key: "pts", label: "Pts 25-26", num: true },
  ], D.board, { sort: "imp", dir: 1, limit: 50 });
  $("#carried").textContent = `${D.carried_out.join(" · ")} and ${D.carried_more} others`;
  $("#excluded").textContent = "Not enough games last season (under 35): " + D.excluded.map((x) => `${x.name} (${x.gp})`).join(", ") + ". Goalies are not included.";
  const names = D.board.map((r) => ({ name: r.n, k: r.t })).concat(keys.map((k) => ({ name: nm(k), k })));
  const go = (n) => { const el = document.getElementById(n.k); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); } };
  search($("#find-top"), names, go, "Search any skater or team…", { big: true, cycle: ["Adam Fox", "Maple Leafs", "Brady Tkachuk", "Canadiens", "Oilers"] });
  reveal();   // cards are added after site.js's first reveal pass
});
