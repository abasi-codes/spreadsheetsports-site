// Hockey: luckiest NHL player ever (/hockey/luckiest.html). Reads data/hockey_luckiest.json (tools/page_hockey_luckiest.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, embed, table, search, newsletter, reveal, SUB } = SS;
  const D = await data("hockey_luckiest");
  $("#sub-page").href = SUB; newsletter($("#nl-page"));
  embed($("#video"), D.video);
  const link = (n, s) => (s ? `<a href="${"/hockey/players/" + s + "/"}">${esc(n)}</a>` : esc(n));
  const board = D.board.map((a) => Object.fromEntries(D.cols.map((k, i) => [k, a[i]])));
  const B = Object.fromEntries(board.map((r) => [r.n, r]));
  const sign = (v, d = 1) => (v > 0 ? "+" : "") + v.toFixed(d);

  table($("#uni"), [
    { key: "name", label: "Player", asc: true, fmt: (u) => `${link(u.name, B[u.name].s)} <span class="dim mono">${u.y0}–${u.y1}</span>` },
    { key: "win_pct", label: "#1 in", num: true, fmt: (u) => `<b>${u.win_pct.toFixed(1)}%</b>` },
    { key: "top5_pct", label: "Top 5", num: true, fmt: (u) => `${u.top5_pct.toFixed(1)}%` },
    { key: "top10_pct", label: "Top 10", num: true, fmt: (u) => `${u.top10_pct.toFixed(1)}%` },
    { key: "median_rank", label: "Median rank", num: true, asc: true, fmt: (u) => `${u.median_rank}` },
    { key: "cups", label: "Cups", num: true },
  ], D.universes, { sort: "win_pct", dir: -1, limit: 10 });

  const cols = [
    { key: "r", label: "#", num: true, asc: true },
    { key: "n", label: "Player", asc: true, fmt: (r) => `${link(r.n, r.s)} <span class="dim mono lk-meta">${r.pos} · ${r.y0}–${r.y1}</span>` },
    { key: "sc", label: "Score", num: true, fmt: (r) => `<b>${r.sc.toFixed(2)}</b>` },
    { key: "cups", label: "Cups", num: true },
    { key: "exp", label: "Expected", num: true, fmt: (r) => r.exp.toFixed(2) },
    { key: "earn", label: "Earned", num: true, fmt: (r) => r.earn.toFixed(2) },
    { key: "un", label: "Not earned", num: true, fmt: (r) => sign(r.un, 2) },
    { key: "coat", label: "Teammates", num: true, fmt: (r) => r.coat.toFixed(2) },
    { key: "drag", label: "Favourites out", num: true },
    { key: "bounce", label: "Bounce goals", num: true, fmt: (r) => sign(r.bounce) },
    { key: "w", label: "#1 in", num: true, sortVal: (r) => r.w ?? -1, fmt: (r) => (r.w != null ? `${r.w.toFixed(1)}%` : `<span class="dim">–</span>`) },
  ];
  const all = () => { table($("#rows"), cols, board, { sort: "r", dir: 1, limit: 25 }); $("#find-clear").hidden = true; };
  all();
  $("#find-clear").addEventListener("click", all);
  search($("#find"), board.map((r) => ({ name: r.n, meta: `#${r.r.toLocaleString()} · ${r.cups} Cup${r.cups === 1 ? "" : "s"}` })), (p) => {
    table($("#rows"), cols, board.filter((r) => r.n === p.name), { sort: "r", dir: 1 });
    $("#find-clear").hidden = false;
  }, "Find any of the " + D.n.toLocaleString() + " careers…", { cycle: ["Patrick Maroon", "Wayne Gretzky", "Ken Morrow", "Claude Lemieux"] });
  reveal();   // cards are added after site.js's first reveal pass
});
