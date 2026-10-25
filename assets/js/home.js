// Home pages (NBA "/" and hockey "/hockey/"): search, prediction headlines, latest videos. Newsletter: site.js [data-nl].
(async () => {
  const { data, $, esc, pct, videos, videoCard, reveal, search, track, YT_CHANNEL, HOCKEY } = SS;
  $("#all-yt").href = YT_CHANNEL + "/videos";

  // the main job: find a player or team
  const list = await data(HOCKEY ? "hockey_search" : "search");
  search($("#find-home"), list, (n) => { track("search", { search_term: n.name }); location.href = n.href; },
    HOCKEY ? "Find any player or team…" : "Find any player or team…",
    { big: true, cycle: HOCKEY ? ["Connor McDavid", "Edmonton Oilers", "Macklin Celebrini", "Toronto Maple Leafs", "Cale Makar"]
                               : ["Wembanyama", "New York Knicks", "LeBron James", "Toronto Raptors", "Jalen Brunson"] });

  // prediction headlines (top 3 each)
  const row = (i, name, p, href) => `<a href="${href}"><i>${i}</i><span>${esc(name)}</span><b>${pct(p)}</b></a>`;
  if (HOCKEY) {
    const D = await data("hockey"), T = D.teams, NM = Object.fromEntries(list.filter((x) => x.meta.startsWith("Team")).map((x) => [x.href.split("#")[1], x.name]));
    const ks = Object.keys(T).sort((a, b) => T[b].cup - T[a].cup).slice(0, 3);
    $("#pred-odds").innerHTML = `<span class="k">2027 Stanley Cup</span>` + ks.map((k, i) => row(i + 1, NM[k] || k, T[k].cup, `/hockey/cup.html#${k}`)).join("");
  } else {
    const [mvp, title, teams] = await Promise.all([data("mvp"), data("title"), data("teams")]);
    const tt = Object.entries(title.titles).sort((a, b) => b[1] - a[1]).slice(0, 3);
    $("#pred-odds").innerHTML = `<span class="k">2027 MVP</span>` + mvp.odds.slice(0, 3).map(([n, p], i) => row(i + 1, n, p, `/models/mvp.html#${encodeURIComponent(n.replace(/ /g, "-"))}`)).join("")
      + `<span class="k">2027 title</span>` + tt.map(([t, p], i) => row(i + 1, teams[t].name, p, "/teams/" + SS.slug(teams[t].name) + "/")).join("");
  }

  // doors: a sample player's glance + two live leader boards (data/home.json, written by the build)
  const H = await data(HOCKEY ? "hockey_home" : "home"), P = HOCKEY ? "/hockey" : "";
  if (H.sample) $("#door-sample").innerHTML = `<span class="k">Example: ${esc(H.sample.n)} · ${H.sample.y}</span>` + H.sample.cats.map(([n, v, c]) =>
    `<a href="${P}/players/${H.sample.s}/" class="smp"><span>${esc(n)}</span><span class="pbar"><i class="${c}" style="width:${Math.max(2, v)}%"></i></span><b>${v}</b></a>`).join("");
  $("#door-leaders").innerHTML = H.leaders.map((b) => `<span class="k">${esc(b.t)}</span>` + b.rows.map(([n, s, t, v], i) =>
    `<a href="${P}/players/${s}/"><i>${i + 1}</i><span>${esc(n)}</span><b>${esc(v)}</b></a>`).join("")).join("");

  $("#latest").innerHTML = (await videos()).slice(0, 3).map(videoCard).join("");
  reveal();
})();
