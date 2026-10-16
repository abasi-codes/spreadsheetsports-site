(async () => {
  const { data, $, esc, pct, videos, videoCard, reveal, newsletter, SUB, YT_CHANNEL, icons } = SS;
  ["#sub-main", "#sub-2"].forEach((s) => ($(s).href = SUB));
  $("#all-yt").href = YT_CHANNEL + "/videos";
  $("#hero-soc").innerHTML = icons();
  newsletter($("#nl-hero"), { compact: true });
  newsletter($("#nl-main"));

  const [mvp, title, teams] = await Promise.all([data("mvp"), data("title"), data("teams")]);
  const tt = Object.entries(title.titles).sort((a, b) => b[1] - a[1]);
  SS.bars($("#mvp-mini"), mvp.odds.slice(0, 5).map(([name, p]) => ({ name, p })), { compact: true });
  SS.bars($("#title-mini"), tt.slice(0, 5).map(([t, p]) => ({ name: teams[t].name, p })), { compact: true });
  const tick = [
    ...mvp.odds.slice(0, 6).map(([n, p]) => `<span>MVP <b>${esc(n)}</b> <i>${pct(p)}</i></span>`),
    ...tt.slice(0, 8).map(([t, p]) => `<span>TITLE <b>${esc(teams[t].name)}</b> <i>${pct(p)}</i></span>`),
  ].join("");
  if ($("#ticker")) $("#ticker").innerHTML = tick + tick;

  $("#latest").innerHTML = (await videos()).slice(0, 6).map(videoCard).join("");

  const F = [["YouTube", "@spreadsheetsportsanalytics", "New videos every day"], ["X", "@SpreadsheetNBA", "Daily charts & takes"], ["Instagram", "@spreadsheetsportsanalytics", "Reels & clips"]];
  const tmp = document.createElement("div"); tmp.innerHTML = icons("big");
  const links = [...tmp.children];
  $("#follow").innerHTML = F.map(([n, handle, sub], i) => `<a class="card reveal" href="${links[i].href}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:14px;text-align:left">
    <span class="soc" style="width:46px;height:46px;border:1px solid var(--line-2);color:var(--text)">${links[i].innerHTML}</span>
    <span><b style="display:block">${n}</b><span class="dim" style="font-size:13px">${handle}</span><br><span class="muted" style="font-size:13px">${sub}</span></span></a>`).join("");
  reveal();
})();

// hero montage: show the model stat that goes with each cut
(async () => {
  const v = document.querySelector(".hero-film video"), el = document.getElementById("cue"); if (!v || !el) return;
  const { cues, poster } = await fetch("/assets/media/hero.json?v=3").then((r) => r.json());
  const bar = document.getElementById("cue-bar");
  if (bar) bar.innerHTML = cues.map(() => "<i></i>").join("");
  let cur = -1;
  const show = (i) => {
    if (i === cur) return; cur = i; el.classList.remove("on");
    bar?.querySelectorAll("i").forEach((b, j) => b.classList.toggle("on", j === i));
    const c = cues[i]; if (!c) return;
    setTimeout(() => {
      el.querySelector(".k").textContent = c.kicker; el.querySelector(".n").textContent = c.big; el.querySelector(".l").textContent = c.label;
      el.classList.add("on");
    }, 200);
  };
  show(poster);   // still frame (before playback, or with reduced motion)
  const tick = () => {
    if (!v.paused && v.readyState >= 2) {
      const t = v.currentTime, i = cues.findIndex((c) => t >= c.t0 && t < c.t1);
      show(i < 0 ? cues.length - 1 : i);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// homepage search: every player and team in the models, straight to their page
(async () => {
  const el = document.getElementById("find-home"); if (!el) return;
  const { data, search, slug, pct } = SS;
  const [{ players }, { teams: T }, teams] = await Promise.all([data("mvp_players"), data("title_teams"), data("teams")]);
  const p = (x) => (x < 0.001 ? "<0.1%" : pct(x));
  const list = [
    ...Object.keys(T).map((k) => ({ name: teams[k].name, meta: `Team · ${p(T[k].p)} title`, href: `/teams/${slug(teams[k].name)}/` })),
    ...players.map((r) => ({ name: r.name, meta: `${r.team || "FA"} · ${p(r.p)} MVP`, href: `/players/${slug(r.name)}/` })),
  ];
  search(el, list, (n) => { SS.track("search", { search_term: n.name }); location.href = n.href; }, "Look up any player or team…",
    { big: true, cycle: ["Wembanyama", "New York Knicks", "LeBron James", "Toronto Raptors", "Jalen Brunson", "Oklahoma City Thunder"] });
})();
