// NBA injuries page (/models/injuries.html). Reads data/injuries.json, written by tools/page_injuries.py from ~/nba-injuries/model.
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, $$, esc, embed, table, reveal, newsletter } = SS;
  const d = await data("injuries"); const S = d.seasons;
  embed($("#video"), d.video);
  newsletter($("#nl-page"));

  // season column chart: share of games missed, 1990-2010 average as a dashed line
  const top = 30, ticks = [0, 10, 20, 30];
  const y = (v) => (v / top) * 100;
  const el = $("#chart");
  el.innerHTML = `<p class="inj-read" aria-live="polite"></p>
    <div class="inj-chart">
      <div class="inj-y">${ticks.map((t) => `<span style="bottom:${y(t)}%">${t}%</span>`).join("")}</div>
      <div class="inj-plot" role="list" aria-label="Share of games missed by season">
        ${ticks.slice(1).map((t) => `<div class="inj-grid" style="bottom:${y(t)}%"></div>`).join("")}
        <div class="inj-base" style="bottom:${y(d.base)}%"><span>1990-2010 avg ${d.base.toFixed(1)}%</span></div>
        ${S.map((r, i) => `<button type="button" role="listitem" class="inj-bar${r.y >= 2018 ? " recent" : ""}${i === S.length - 1 ? " now" : ""}" data-i="${i}" aria-label="${r.s}: ${r.all.toFixed(1)}% of games missed"><i style="height:${y(r.all)}%"></i></button>`).join("")}
      </div>
    </div>
    <div class="inj-x"><span>${S[0].s}</span><span>2005-06</span><span>${S[S.length - 1].s}</span></div>
    <div class="inj-key"><span><i style="background:#4a505b"></i>Before 2017-18</span><span><i style="background:#7a828f"></i>2017-18 on</span><span><i style="background:var(--red)"></i>2025-26</span></div>`;
  const read = $(".inj-read", el), bars = $$(".inj-bar", el);
  const show = (i) => {
    const r = S[i]; bars.forEach((b, j) => b.classList.toggle("on", j === i));
    read.innerHTML = `<b>${r.s}</b> · ${r.all.toFixed(1)}% of games missed · #${r.all_rk} of ${S.length}${r.covid ? " · COVID protocols" : ""}`;
  };
  bars.forEach((b) => { const i = +b.dataset.i; b.addEventListener("mouseenter", () => show(i)); b.addEventListener("focus", () => show(i)); b.addEventListener("click", () => show(i)); });
  el.querySelector(".inj-plot").addEventListener("mouseleave", () => show(S.length - 1));
  show(S.length - 1);

  // full board
  const p = (v) => v.toFixed(1) + "%";
  table($("#table"), [
    { key: "y", label: "Season", num: true, fmt: (r) => `<b>${r.s}</b>${r.covid ? ' <span class="dim">COVID</span>' : ""}` },
    { key: "all", label: "Missed", num: true, fmt: (r) => `<b${r.y === 2026 ? ' style="color:var(--red)"' : ""}>${p(r.all)}</b>` },
    { key: "all_rk", label: "Rank", num: true, asc: true, fmt: (r) => `#${r.all_rk}` },
    { key: "one", label: "1 game", num: true, fmt: (r) => p(r.one) },
    { key: "mid", label: "2-19 games", num: true, fmt: (r) => p(r.mid) },
    { key: "sev", label: "20+ games", num: true, fmt: (r) => p(r.sev) },
    { key: "stars", label: "Stars", num: true, fmt: (r) => p(r.stars) },
    { key: "others", label: "Others", num: true, fmt: (r) => p(r.others) },
    { key: "gm", label: "Games missed", num: true, fmt: (r) => r.gm.toLocaleString("en-US") },
    { key: "ach", label: "Achilles", num: true, sortVal: (r) => r.ach ?? -1, fmt: (r) => (r.ach == null ? '<span class="dim">–</span>' : r.ach) },
  ], S, { sort: "all", dir: -1, limit: 25 });
  reveal();   // cards are added after site.js's first reveal pass
});
