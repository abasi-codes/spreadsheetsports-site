// Hockey: 2027 NHL MVP (Hart) model page (/hockey/mvp.html). Reads data/hockey_mvp.json (tools/hockey_mvp_export.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, search, newsletter, embed, table, reveal, SUB } = SS;
  const D = await data("hockey_mvp");
  const NM = { ANA: "Anaheim Ducks", BOS: "Boston Bruins", BUF: "Buffalo Sabres", CGY: "Calgary Flames", CAR: "Carolina Hurricanes", CHI: "Chicago Blackhawks", COL: "Colorado Avalanche",
    CBJ: "Columbus Blue Jackets", DAL: "Dallas Stars", DET: "Detroit Red Wings", EDM: "Edmonton Oilers", FLA: "Florida Panthers", LAK: "Los Angeles Kings", MIN: "Minnesota Wild",
    MTL: "Montreal Canadiens", NSH: "Nashville Predators", NJD: "New Jersey Devils", NYI: "New York Islanders", NYR: "New York Rangers", OTT: "Ottawa Senators", PHI: "Philadelphia Flyers",
    PIT: "Pittsburgh Penguins", SJS: "San Jose Sharks", SEA: "Seattle Kraken", STL: "St. Louis Blues", TBL: "Tampa Bay Lightning", TOR: "Toronto Maple Leafs", UTA: "Utah Mammoth",
    VAN: "Vancouver Canucks", VGK: "Vegas Golden Knights", VEG: "Vegas Golden Knights", WSH: "Washington Capitals", WPG: "Winnipeg Jets" };
  const nm = (k) => NM[k] || k;
  const lk = (k) => (k === "VEG" ? "VGK" : k);
  const logo = (k, s = 28) => (k ? `<img src="https://assets.nhle.com/logos/nhl/svg/${lk(k)}_dark.svg" alt="" width="${s * 1.5}" height="${s}" style="object-fit:contain;vertical-align:middle;display:inline-block;margin-right:6px">` : "");
  const pct = (x) => (x == null ? '<span class="dim">—</span>' : `${(x * 100).toFixed(1)}%`);
  const slug = (n) => n.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-");
  const name = (r) => (r.href ? `<a href="${r.href}">${esc(r.n)}</a>` : esc(r.n));
  $("#sub-page").href = SUB; newsletter($("#nl-page"));
  if (D.video) { const v = (await data("videos")).find((x) => x.id === D.video); if (v && (!v.publishAt || new Date(v.publishAt) <= new Date())) embed($("#video"), D.video); else $("#video").closest(".reveal").remove(); }
  else $("#video").closest(".reveal").remove();

  $("#top3").innerHTML = D.players.slice(0, 3).map((r, i) => `<div class="card reveal" id="${slug(r.n)}"><span class="card-label">#${i + 1} · model pick</span>
      <h3 style="margin:10px 0 4px;font-size:24px">${logo(r.t, 22)}${name(r)}</h3><p class="dim" style="margin:0 0 14px">${esc(nm(r.t))}</p>
      <div style="display:flex;gap:18px"><div><div class="dim" style="font-size:12px">MY MODEL</div><div style="font:700 34px Anton,sans-serif;color:#2fbf71">${pct(r.p)}</div></div>
      <div><div class="dim" style="font-size:12px">THE MARKETS</div><div style="font:700 34px Anton,sans-serif;color:#e3141e">${pct(r.m)}</div></div></div></div>`).join("");

  const rows = D.players.map((r) => ({ ...r, gap: r.m == null ? null : r.p - r.m }));
  table($("#table"), [
    { key: "rank", label: "#", num: true, asc: true, fmt: (r) => `<b>${r.rank}</b>` },
    { key: "n", label: "Player", asc: true, fmt: (r) => `<span id="${slug(r.n)}">${logo(r.t, 16)}${name(r)}</span>` },
    { key: "p", label: "Model", num: true, fmt: (r) => `<b>${pct(r.p)}</b>` },
    { key: "m", label: "Markets", num: true, fmt: (r) => pct(r.m) },
    { key: "gap", label: "Gap", num: true, fmt: (r) => (r.gap == null ? '<span class="dim">—</span>' : `<b>${r.gap > 0 ? "+" : ""}${(r.gap * 100).toFixed(1)}</b>`) },
  ], rows, { sort: "rank", dir: 1, limit: 30 });

  $("#ladder").innerHTML = D.ladder.map((s) => `<div class="card reveal"><span class="card-label">${esc(s.label)}</span>
      ${s.top.map((r, i) => `<div style="display:flex;justify-content:space-between;gap:10px;margin-top:${i ? 8 : 12}px"><span>${i + 1}. ${logo(r.t, 14)}${esc(r.n)}</span><b>${pct(r.p)}</b></div>`).join("")}</div>`).join("");

  const B = D.backtest;
  $("#bt").innerHTML = `<p style="margin:0 0 10px">Tested on <b>${B.seasons} seasons</b> (1984-85 to 2025-26, skipping the 2004-05 lockout), predicting each one with only opening-night information.</p>
    <p style="margin:0 0 10px">The model's preseason favourite won <b>${B.model_fav_won} of ${B.seasons}</b> Harts.</p>
    <p style="margin:0">Since ${B.since} (the seasons with preseason odds), the betting markets' favourite won <b>${B.market_fav_won} of ${B.of}</b>. The model's favourite won <b>${B.model_fav_won_since} of ${B.of}</b>.</p>`;

  const go = (n) => { const el = document.getElementById(slug(n.name)); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); const c = el.closest("tr") || el; c.classList.add("flash"); setTimeout(() => c.classList.remove("flash"), 1600); } };
  search($("#find-top"), D.players.slice(0, 30).map((r) => ({ name: r.n, k: r.t })), go, "Search any player…", { big: true, cycle: ["Connor McDavid", "Nathan MacKinnon", "Macklin Celebrini", "Nikita Kucherov"] });
  reveal();   // cards are added after site.js's first reveal pass
});
