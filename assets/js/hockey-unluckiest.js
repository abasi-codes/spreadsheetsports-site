// Hockey: unluckiest NHL player ever (/hockey/unluckiest.html). Reads data/hockey_unluckiest.json (tools/page_hockey_unluckiest.py).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, embed, table, search, newsletter, reveal, SUB } = SS;
  const D = await data("hockey_unluckiest");
  $("#sub-page").href = SUB; newsletter($("#nl-page"));
  embed($("#video"), D.video);
  const link = (n, s, page) => (page ? `<a href="/hockey/players/${s}/">${esc(n)}</a>` : esc(n));
  const B = Object.fromEntries(D.board.map((r) => [r.n, r]));

  table($("#uni"), [
    { key: "name", label: "Player", asc: true, fmt: (u) => `${link(u.name, u.s, u.page)} <span class="dim mono">${B[u.name].y0}–${B[u.name].y1}</span>` },
    { key: "win_pct", label: "#1 in", num: true, fmt: (u) => `<b>${u.win_pct.toFixed(1)}%</b>` },
    { key: "top5_pct", label: "Top 5", num: true, fmt: (u) => `${u.top5_pct.toFixed(1)}%` },
    { key: "top10_pct", label: "Top 10", num: true, fmt: (u) => `${u.top10_pct.toFixed(1)}%` },
    { key: "median_rank", label: "Median rank", num: true, asc: true, fmt: (u) => `${u.median_rank}` },
    { key: "in_pool_pct", label: "In pool", num: true, fmt: (u) => `${Math.round(u.in_pool_pct)}%` },
  ], D.universes, { sort: "win_pct", dir: -1, limit: 10 });

  table($("#drops"), [
    { key: "f", label: "Factor deleted", asc: true },
    { key: "park", label: "Park #1", num: true, fmt: (r) => `<b>${r.park.toFixed(1)}%</b>` },
  ], D.drops, { sort: "park", dir: -1 });

  const cols = [
    { key: "r", label: "#", num: true, asc: true },
    { key: "n", label: "Player", asc: true, fmt: (r) => `${link(r.n, r.s, r.page)} <span class="dim mono">${r.pos} · ${r.y0}–${r.y1}</span>` },
    { key: "sc", label: "Score", num: true, fmt: (r) => `<b>${r.sc.toFixed(2)}</b>` },
    { key: "cups", label: "Cups", num: true },
    { key: "exp", label: "Expected", num: true, fmt: (r) => r.exp.toFixed(2) },
    { key: "prime", label: "Prime lost", num: true, fmt: (r) => `${r.prime}%` },
    { key: "champ", label: "Out vs champ", num: true },
    { key: "one", label: "1-goal deciders", num: true },
    { key: "bounce", label: "Bounce goals", num: true, fmt: (r) => (r.bounce > 0 ? "+" : "") + r.bounce.toFixed(1) },
    { key: "ru", label: "Runner-ups", num: true },
  ];
  const all = () => { table($("#rows"), cols, D.board, { sort: "r", dir: 1, limit: 25 }); $("#find-clear").hidden = true; };
  all();
  $("#find-clear").addEventListener("click", all);
  search($("#find"), D.board.map((r) => ({ name: r.n })), (p) => {
    table($("#rows"), cols, D.board.filter((r) => r.n === p.name), { sort: "r", dir: 1 });
    $("#find-clear").hidden = false;
  }, "Find any of the " + D.n + " careers…", { cycle: ["Joe Thornton", "Marcel Dionne", "Roberto Luongo", "Cam Neely"] });
  reveal();   // cards are added after site.js's first reveal pass
});
