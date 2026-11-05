// Fantasy GOAT page (/models/fantasy-goat.html). Reads data/fantasy-goat.json (tools/page_fantasy-goat.py, from ~/fantasy-video).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, esc, embed, table, reveal } = SS;
  const D = await data("fantasy-goat");
  const B = D.board;
  const n0 = (v) => Math.round(v).toLocaleString("en-US");
  const yr = (y) => `${y - 1}-${String(y).slice(2)}`;
  const span = (r) => `${r.first - 1}–${r.last}`;
  const nm = (r) => (r.page ? `<a href="${"/players/" + r.s + "/"}">${esc(r.name)}</a>` : esc(r.name));

  // scorecard top 6 (the video's scorecard) with stacked round bars
  $("#top").innerHTML = B.slice(0, 6).map((r) => `<div class="fg-row"><span class="fg-n">${r.rank}</span>
    <span class="fg-name">${nm(r)}<small>${span(r)}</small></span><span class="fg-tot">${r.total.toFixed(1)}</span>
    <div class="fg-stack" title="Best season ${r.r1} · Career ${r.r2} · Titles ${r.r3} · Dominance ${r.r4}"><i class="r1" style="width:${r.r1}%"></i><i class="r2" style="width:${r.r2}%"></i><i class="r3" style="width:${r.r3}%"></i><i class="r4" style="width:${r.r4}%"></i></div></div>`).join("");
  embed($("#video"), D.video);

  // compact bar lists (site .bars styles, widths set directly)
  const bars = (el, rows, fmt) => {
    const max = Math.max(...rows.map((r) => r.v));
    el.classList.add("bars", "compact");
    el.innerHTML = rows.map((r, i) => `<div class="bar-row"><span class="rk">${i + 1}</span>
      <span class="nm">${esc(r.name)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(100 * r.v) / max}%"></div></div><span class="val">${fmt(r.v)}</span></div>`).join("");
  };
  bars($("#r1"), D.best_pace.slice(0, 6).map((r) => ({ name: r.name, sub: r.season, v: r.v })), (v) => v.toFixed(1));
  const w = D.best_raw[0], wilt9 = D.best_raw.findIndex((r) => r.name !== "Wilt Chamberlain");
  const [pts, reb] = w.line.split("/");
  const wb = D.best_pace.findIndex((r) => r.name === "Russell Westbrook") + 1;
  $("#r1-note").innerHTML = `Before the pace adjustment, Wilt has the top <b>${wilt9}</b> fantasy seasons ever. His ${esc(w.season)} (${pts} points, ${reb} rebounds a game) is worth <b>${w.v.toFixed(1)}</b> fantasy points a night, and still <b>${D.wilt62_no_est}</b> with zero steals, blocks and turnovers. Russell Westbrook's 2016-17 drops to ${wb}th here because of 5.4 turnovers a game.`;
  bars($("#r2"), D.career_pace.slice(0, 5).map((r) => ({ name: r.name, v: r.v })), n0);
  $("#r2-note").innerHTML = `Without the pace adjustment Wilt leads with <b>${n0(D.career_raw[0].v)}</b>, ahead of ${esc(D.career_raw[1].name)} (${n0(D.career_raw[1].v)}) and ${esc(D.career_raw[2].name)} (${n0(D.career_raw[2].v)}).`;
  bars($("#r3"), D.titles.slice(0, 6).map((r) => ({ name: r.name, sub: `${r.years[0]} to ${r.years[r.years.length - 1]}`, v: r.n })), (v) => String(v));
  $("#r3-note").innerHTML = `Wilt finished No. 1 ten years in a row (1959-60 to 1968-69), in a league of only 8 or 9 teams. Jokić has done it six straight seasons.`;
  bars($("#r4"), D.dominance.filter((r) => r.titles >= 2).slice(0, 6).map((r) => ({ name: r.name, sub: `${r.titles} titles`, v: r.v })), (v) => `+${v.toFixed(1)}%`);
  $("#r4-note").innerHTML = `Even with the lowest steal and block estimates, Wilt is still <b>+${D.wilt_lead_lo}%</b> ahead (the highest estimates put him at +${D.wilt_lead_hi}%).`;

  // full board
  table($("#board-tbl"), [
    { key: "rank", label: "#", num: true, asc: true },
    { key: "name", label: "Player", asc: true, fmt: (r) => nm(r) + ` <span class="dim mono">${span(r)}</span>` },
    { key: "best", label: "Best season", num: true, sortVal: (r) => r.best ?? -1, fmt: (r) => (r.best == null ? '<span class="dim">–</span>' : `${r.best.toFixed(1)} <span class="dim mono">${yr(r.best_y)}</span>`) },
    { key: "career", label: "Career FP", num: true, fmt: (r) => n0(r.career) },
    { key: "titles", label: "Titles", num: true },
    { key: "lead", label: "Avg lead", num: true, sortVal: (r) => r.lead ?? -1, fmt: (r) => (r.lead == null ? '<span class="dim">–</span>' : `+${r.lead.toFixed(1)}%`) },
    { key: "r1", label: "R1", num: true }, { key: "r2", label: "R2", num: true }, { key: "r3", label: "R3", num: true }, { key: "r4", label: "R4", num: true },
    { key: "total", label: "Score", num: true, fmt: (r) => `<b>${r.total.toFixed(1)}</b>` },
  ], B, { sort: "rank", dir: 1, limit: 25 });

  bars($("#online"), D.online.slice(0, 8).map((r) => ({ name: r.name, v: r.total })), (v) => v.toFixed(1));
  bars($("#cat-best"), D.cat_best.slice(0, 5).map((r) => ({ name: r.name, sub: r.season, v: r.v })), (v) => v.toFixed(2));
  bars($("#cat-car"), D.cat_career.slice(0, 5).map((r) => ({ name: r.name, v: r.v })), (v) => v.toFixed(1));
  bars($("#predict"), D.predict.slice(0, 6).map((r) => ({ name: r.name, v: r.p })), (v) => `${v.toFixed(1)}%`);

  $("#espn-hit").textContent = `${D.espn.hits} / ${D.espn.n}`;
  $("#espn-sub").textContent = `times the No. 1 pick finished No. 1`;
  $("#espn").innerHTML = D.espn.rows.map((r) => `<div class="${r.finish === 1 ? "hit" : "miss"}"><b>${esc(r.season)}</b><span>${esc(((w) => (w[w.length - 1].length > 10 ? w[0] : w[w.length - 1]))(r.pick.split(" ")))}</span><em>${r.finish === 1 ? "✓ No. 1" : r.finish > 15 ? "outside top 15" : "finished " + r.finish}</em></div>`).join("");

  table($("#winners"), [
    { key: "season", label: "Season", asc: true },
    { key: "name", label: "Fantasy No. 1", asc: true, fmt: (r) => `<b>${esc(r.name)}</b>` },
    { key: "fp", label: "Fantasy pts", num: true, fmt: (r) => n0(r.fp) },
    { key: "second", label: "Runner-up", asc: true },
    { key: "lead", label: "Lead", num: true, sortVal: (r) => r.fp / r.fp2, fmt: (r) => `+${(100 * (r.fp / r.fp2 - 1)).toFixed(1)}%` },
  ], D.winners, { sort: "season", dir: -1, limit: 25 });

  $("#fp1").textContent = `Wilt's win doesn't hang on my steal and block estimates. With the lowest estimates he scores ${D.wilt_total_lo} out of 100, and with the highest ${D.wilt_total_hi}. Either way he wins the titles and dominance rounds.`;
  const jk = D.best_raw_players.find((r) => r.name === "Nikola Jokić");
  $("#fp2").textContent = `Round 1 isn't the estimates either: with zero steals, blocks and turnovers, his 1961-62 season is still worth ${D.wilt62_no_est} fantasy points a night. The best modern season, Jokić in ${jk.season}, is ${jk.v.toFixed(1)}.`;
  reveal();
});
