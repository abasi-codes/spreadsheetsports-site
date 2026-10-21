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

  const F = [["YouTube", "@spreadsheetsportsanalytics", "New videos every day"], ["X", "@SpreadsheetSprt", "Daily charts & takes"], ["Instagram", "@spreadsheetsportsanalytics", "Reels & clips"]];
  const tmp = document.createElement("div"); tmp.innerHTML = icons("big");
  const links = [...tmp.children];
  $("#follow").innerHTML = F.map(([n, handle, sub], i) => `<a class="card reveal" href="${links[i].href}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:14px;text-align:left">
    <span class="soc" style="width:46px;height:46px;border:1px solid var(--line-2);color:var(--text)">${links[i].innerHTML}</span>
    <span><b style="display:block">${n}</b><span class="dim" style="font-size:13px">${handle}</span><br><span class="muted" style="font-size:13px">${sub}</span></span></a>`).join("");
  reveal();
})();

// homepage search: every player and team in the models, straight to their page
(async () => {
  const el = document.getElementById("find-home"); if (!el) return;
  const { data, search } = SS;
  const list = await data("search");
  search(el, list, (n) => { SS.track("search", { search_term: n.name }); location.href = n.href; }, "Look up any player or team…",
    { big: true, cycle: ["Wembanyama", "New York Knicks", "LeBron James", "Toronto Raptors", "Jalen Brunson", "Oklahoma City Thunder"] });
})();
