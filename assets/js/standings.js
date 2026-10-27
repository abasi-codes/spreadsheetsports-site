// Live standings, loaded by site.js on /teams/ (NBA standings above the team grid), /teams/<slug>/ (one record line)
// and /hockey/cup.html (NHL standings above the Cup odds). Reads data/standings_<sport>.json, written hourly by jobs/lines.
(async () => {
  const { esc, slug, reveal, HOCKEY } = SS;
  const path = location.pathname;
  let D;
  try {
    const r = await fetch("/data/standings_" + (HOCKEY ? "nhl" : "nba") + ".json?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" });
    if (!r.ok) return;
    D = await r.json();
  } catch { return; }
  const ago = (iso) => { const h = Math.round((Date.now() - new Date(iso)) / 3600e3); return h < 1 ? "within the hour" : h + "h ago"; };
  const nbaHref = (name) => "/teams/" + slug(name) + "/";
  const nhlHref = (t) => "/hockey/cup.html#" + t;
  const sign = (x) => (x > 0 ? "+" + x : String(x));
  const head = (cols) => "<thead><tr>" + cols.map(([k, n]) => `<th scope="col" class="${n ? "num" : ""}">${k}</th>`).join("") + "</tr></thead>";

  // ---------- NBA ----------
  function nbaTable(c) {
    const cols = [["Team"], ["W", 1], ["L", 1], ["PCT", 1], ["GB", 1], ["Home", 1], ["Away", 1], ["L10", 1], ["Strk", 1], ["Diff", 1]];
    const rows = c.teams.map((t, i) => `<tr class="${i === 5 ? "cut-top6" : i === 9 ? "cut-playin" : ""}" title="${esc(t.ppg + " PPG, " + t.opp + " allowed")}">
      <th scope="row" class="st-team"><i class="st-rk">${t.seed || i + 1}</i><a href="${nbaHref(t.name)}" title="${esc(t.name)}">${esc(t.short || t.name)}</a></th><td class="num">${t.w}</td><td class="num">${t.l}</td><td class="num">${esc(t.pct)}</td>
      <td class="num">${esc(t.gb)}</td><td class="num">${esc(t.home)}</td><td class="num">${esc(t.road)}</td><td class="num">${esc(t.l10)}</td><td class="num">${esc(t.strk)}</td>
      <td class="num ${t.diff > 0 ? "pos" : t.diff < 0 ? "neg" : ""}">${t.diff == null ? "—" : sign(Math.round(t.diff * 10) / 10)}</td></tr>`).join("");
    return `<div class="st-block reveal"><h3 class="st-h">${esc(c.name)}</h3><div class="table-wrap st-wrap"><table class="st-tbl">${head(cols)}<tbody>${rows}</tbody></table></div></div>`;
  }

  // ---------- NHL ----------
  const nhlCols = [["Team"], ["GP", 1], ["W", 1], ["L", 1], ["OTL", 1], ["PTS", 1], ["P%", 1], ["GF", 1], ["GA", 1], ["Diff", 1], ["L10", 1], ["Strk", 1]];
  const nhlRow = (t, cls = "", tag = "") => `<tr class="${cls}"><th scope="row" class="st-team"><a href="${nhlHref(t.t)}" title="${esc(t.name)}"><img src="${"https://assets.nhle.com/logos/nhl/svg/" + t.t + "_dark.svg"}" alt="" width="24" height="16" loading="lazy">${esc(t.short || t.name)}</a>${tag}</th>
      <td class="num">${t.gp}</td><td class="num">${t.w}</td><td class="num">${t.l}</td><td class="num">${t.otl}</td><td class="num"><b>${t.pts}</b></td><td class="num">${t.pp.toFixed(3).replace(/^0/, "")}</td>
      <td class="num">${t.gf}</td><td class="num">${t.ga}</td><td class="num ${t.diff > 0 ? "pos" : t.diff < 0 ? "neg" : ""}">${sign(t.diff)}</td><td class="num">${esc(t.l10)}</td><td class="num">${esc(t.strk)}</td></tr>`;
  const nhlTable = (title, rowsHtml) => `<div class="st-block reveal"><h3 class="st-h">${esc(title)}</h3><div class="table-wrap st-wrap"><table class="st-tbl">${head(nhlCols)}<tbody>${rowsHtml}</tbody></table></div></div>`;
  function nhlViews() {
    const T = D.teams, divs = {};
    T.forEach((t) => (divs[t.div] ||= []).push(t));
    Object.values(divs).forEach((a) => a.sort((x, y) => x.divseq - y.divseq));
    const byDiv = ["Atlantic", "Metropolitan", "Central", "Pacific"].filter((d) => divs[d]).map((d) => nhlTable(d, divs[d].map((t, i) => nhlRow(t, i === 2 ? "cut-top6" : "")).join(""))).join("");
    const wild = ["Eastern", "Western"].map((conf) => {
      const ds = Object.keys(divs).filter((d) => divs[d][0].conf === conf);
      let html = "";
      ds.forEach((d) => { html += `<tr class="st-sub"><td colspan="12">${esc(d)}</td></tr>` + divs[d].slice(0, 3).map((t, i) => nhlRow(t, i === 2 ? "cut-top6" : "")).join(""); });
      const rest = T.filter((t) => t.conf === conf && t.divseq > 3).sort((a, b) => (a.wc || 99) - (b.wc || 99) || a.confseq - b.confseq);
      html += `<tr class="st-sub"><td colspan="12">Wild card</td></tr>` + rest.map((t, i) => nhlRow(t, i === 1 ? "cut-playin" : "", i < 2 ? ` <small class="st-tag">WC${i + 1}</small>` : "")).join("");
      return nhlTable(conf, html);
    }).join("");
    return { div: byDiv, wild };
  }

  // ---------- where it goes ----------
  const section = (inner, note) => {
    const s = document.createElement("section");
    s.className = "st-sec"; s.id = "standings";
    s.innerHTML = `<div class="wrap"><div class="section-head st-head"><div><span class="eyebrow live">Standings · ${esc(D.season)}</span><h2 class="display" style="margin-top:12px">Standings</h2></div>
      <p class="muted st-note">${note} Updated ${ago(D.updated)}.</p></div>${inner}</div>`;
    return s;
  };
  if (!HOCKEY && path === "/teams/") {
    const s = section(`<div class="st-grid">${D.conferences.map(nbaTable).join("")}</div>`,
      "Seeds 1–6 make the playoffs (solid line); 7–10 go to the play-in (dashed line).");
    document.querySelector(".entity-hero")?.after(s);
    reveal();
  } else if (!HOCKEY && /^\/teams\/[^/]+\/$/.test(path)) {
    const me = path.split("/")[2];
    for (const c of D.conferences) {
      const t = c.teams.find((x) => slug(x.name) === me);
      if (!t) continue;
      const seed = t.seed || c.teams.indexOf(t) + 1;
      const p = document.createElement("p");
      p.className = "st-line";
      p.innerHTML = `<b>${esc(D.season)}: ${t.w}-${t.l}</b> · ${SS.ord(seed)} in the ${esc(c.name.replace(/ern$/, ""))} · L10 ${esc(t.l10)} · ${esc(t.strk)} · <a href="/teams/#standings">Standings</a>`;
      document.querySelector(".entity-hero .lead")?.after(p);
      break;
    }
  } else if (HOCKEY && path === "/hockey/cup.html") {
    const v = nhlViews();
    const s = section(`<div class="seg st-seg" role="tablist"><button type="button" role="tab" aria-selected="true" data-v="div">Divisions</button><button type="button" role="tab" aria-selected="false" data-v="wild">Wild card</button></div>
      <div class="st-grid" id="st-view">${v.div}</div>`, "Top three in each division make the playoffs, plus two wild cards per conference.");
    document.querySelector(".page-hero")?.after(s);
    s.querySelector(".st-seg").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      s.querySelectorAll(".st-seg button").forEach((x) => x.setAttribute("aria-selected", x === b));
      s.querySelector("#st-view").innerHTML = v[b.dataset.v];
      s.querySelectorAll(".reveal").forEach((x) => x.classList.add("in"));
      SS.track("standings_view", { view: b.dataset.v });
    });
    reveal();
  }
})();
