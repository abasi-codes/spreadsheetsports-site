// League explorer (/leaders/explore.html): sort by any Spreadsheet Sports metric, filter by season, position,
// role, team, age, minutes and name. Every setting lives in the URL query string, so a view can be shared.
// Data: data/leaders.json (tools/build_leaders.py). No CSV export (data rights).
document.addEventListener("DOMContentLoaded", async () => {
  const { data, $, $$, esc, track } = SS;
  const el = $("#lx"); if (!el) return;
  const D = await data("leaders");
  const M = D.meta, KEYS = D.keys, CATS = D.cats, MET = M.metrics;
  const KI = Object.fromEntries(KEYS.map((k, i) => [k, i])), CI = Object.fromEntries(CATS.map((c, i) => [c, i]));
  const GRP = Object.fromEntries(M.groups), SEASONS = M.seasons.map(String);
  const sl = (y) => `${y - 1}-${String(y).slice(2)}`;
  const TIERS = M.tiers;
  const tierOf = (p) => TIERS.find(([lo]) => p >= lo)[1];
  const MINUS = "−";

  // ---------- formatting (same rules as tools/player_profile.py) ----------
  function fmt(k, v) {
    if (v == null) return "—";
    const f = MET[k].f;
    if (f === "pct1") return (v * 100).toFixed(1) + "%";
    if (f === "pctr") return v.toFixed(1) + "%";
    if (f === "num1") return v.toFixed(1);
    if (f === "num0") return v.toFixed(0);
    if (f === "sign1") return v > 0 ? "+" + v.toFixed(1) : v < 0 ? MINUS + Math.abs(v).toFixed(1) : "0.0";
    if (f === "ws48" || f === "ratio") return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(3).replace(/^0\./, ".");
    return String(v);
  }
  const RAWK = { fg3: 0, ft: 1, rim_fg: 2 };
  const shade = (p, style) => {
    if (p == null || style) return "";
    const a = (Math.abs(p - 50) / 50) * 0.5;
    return p >= 50 ? `background:rgba(47,140,255,${a.toFixed(2)})` : `background:rgba(240,124,42,${a.toFixed(2)})`;
  };

  // ---------- rows ----------
  const rows = {};
  for (const y of SEASONS) rows[y] = D.seasons[y].map((r) => ({ s: r[0], n: r[1], t: r[2], g: r[3], off: r[4], def: r[5], age: r[6], mp: r[7], gp: r[8],
    v: r[9], pl: r[10], pp: r[11], cl: r[12], cp: r[13], rima: r[14], raw: r[15] }));

  // ---------- columns ----------
  const catCols = CATS.map((c) => ({ id: `cat_${c}`, lab: M.cats.find((x) => x.k === c).n, abbr: "Score", cat: c }));
  const metCol = (k) => ({ id: k, lab: MET[k].n, abbr: MET[k].a, k });
  const GROUPS = M.box ? [M.box, ...M.cats] : M.cats;          // "Per game" box score first, then the graded categories
  const VIEWS = [["cats", "Category scores"], ...GROUPS.map((c) => [c.k, c.n])];
  const colsFor = (view, sort) => {
    let cs = view === "cats" ? catCols : GROUPS.find((c) => c.k === view).m.map(metCol);
    if (sort && !cs.some((c) => c.id === sort)) cs = [sort.startsWith("cat_") ? catCols.find((c) => c.id === sort) : metCol(sort), ...cs];
    return cs;
  };
  const value = (r, id) => (id.startsWith("cat_") ? r.cl[CI[id.slice(4)]] : r.v[KI[id]]);
  const pctOf = (r, id, cmp) => (id.startsWith("cat_") ? (cmp === "p" ? r.cp : r.cl)[CI[id.slice(4)]] : (cmp === "p" ? r.pp : r.pl)[KI[id]]);
  const better = (id) => (id.startsWith("cat_") ? true : MET[id].hi !== false);

  // ---------- state <-> URL ----------
  const DEF = { season: SEASONS[0], sort: "cat_impact", dir: "", pos: "", off: "", def: "", team: "", amin: "", amax: "", min: String(M.min_mp), q: "", view: "", cmp: "l", fk: "", fv: "" };
  const st = { ...DEF };
  const P = new URLSearchParams(location.search);
  for (const k in DEF) if (P.has(k)) st[k] = P.get(k);
  if (!SEASONS.includes(st.season)) st.season = DEF.season;
  if (!(st.sort.startsWith("cat_") ? CI[st.sort.slice(4)] != null : KI[st.sort] != null)) st.sort = DEF.sort;
  if (!st.view) st.view = st.sort.startsWith("cat_") ? "cats" : MET[st.sort].c;
  const save = () => {
    const u = new URLSearchParams();
    for (const k in DEF) if (st[k] !== DEF[k] && st[k] !== "" && !(k === "view" && st.view === (st.sort.startsWith("cat_") ? "cats" : MET[st.sort]?.c))) u.set(k, st[k]);
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  };

  // ---------- controls ----------
  const teams = [...new Set(Object.values(rows).flat().map((r) => r.t))].sort();
  const offRoles = M.roles.off.map((r) => r[0]), defRoles = M.roles.def.map((r) => r[0]);
  const opt = (v, lab, cur) => `<option value="${esc(v)}"${String(cur) === String(v) ? " selected" : ""}>${esc(lab)}</option>`;
  const metricSelect = () => `<optgroup label="Category scores (0–99)">${catCols.map((c) => opt(c.id, c.lab + " score", st.sort)).join("")}</optgroup>` +
    GROUPS.map((c) => `<optgroup label="${esc(c.n)}">${c.m.map((k) => opt(k, `${MET[k].n} (${MET[k].a})`, st.sort)).join("")}</optgroup>`).join("");
  el.innerHTML = `
    <div class="lx-controls">
      <label class="lx-f wide"><span>Rank by</span><select data-k="sort">${metricSelect()}</select></label>
      <label class="lx-f wide search-f"><span>Search</span><input type="search" placeholder="Player name" data-k="q" value="${esc(st.q)}" autocomplete="off"></label>
    </div>
    <details class="lx-filters"><summary>Filters <span class="lx-nf"></span></summary><div class="lx-controls">
      <label class="lx-f"><span>Season</span><select data-k="season">${SEASONS.map((y) => opt(y, sl(y), st.season)).join("")}</select></label>
      <label class="lx-f"><span>Position</span><select data-k="pos">${opt("", "All", st.pos)}${M.groups.map(([g, n]) => opt(g, n + "s", st.pos)).join("")}</select></label>
      <label class="lx-f"><span>Offensive role</span><select data-k="off">${opt("", "Any", st.off)}${offRoles.map((r) => opt(r, r, st.off)).join("")}</select></label>
      <label class="lx-f"><span>Defensive role</span><select data-k="def">${opt("", "Any", st.def)}${defRoles.map((r) => opt(r, r, st.def)).join("")}</select></label>
      <label class="lx-f"><span>Team</span><select data-k="team">${opt("", "All teams", st.team)}${teams.map((t) => opt(t, t, st.team)).join("")}</select></label>
      <label class="lx-f"><span>Min. minutes</span><select data-k="min">${[500, 1000, 1500, 2000].map((m) => opt(m, m.toLocaleString() + "+", st.min)).join("")}</select></label>
      <div class="lx-f age"><span>Age</span><div><input type="number" inputmode="numeric" min="18" max="45" placeholder="min" aria-label="Minimum age" data-k="amin" value="${esc(st.amin)}"><i>–</i><input type="number" inputmode="numeric" min="18" max="45" placeholder="max" aria-label="Maximum age" data-k="amax" value="${esc(st.amax)}"></div></div>
    </div></details>
    <div class="lx-bar">
      <div class="seg mx-seg lx-view" role="radiogroup" aria-label="Columns">${VIEWS.map(([v, n]) => `<button type="button" role="radio" data-v="${v}">${esc(n)}</button>`).join("")}</div>
      <div class="seg mx-seg lx-cmp" role="radiogroup" aria-label="Percentiles vs"><button type="button" role="radio" data-c="l">vs all</button><button type="button" role="radio" data-c="p">vs position</button></div>
    </div>
    <div class="lx-meta"><p class="lx-count" aria-live="polite"></p><div class="lx-chips"></div><button type="button" class="btn ghost sm lx-copy">Copy link to this view</button><button type="button" class="btn ghost sm lx-reset">Reset</button></div>
    <div class="stat-scroll lx-scroll" tabindex="0" role="region" aria-label="Players"><table class="stat-table lx-table"><thead></thead><tbody></tbody></table></div>
    <div class="lx-more-w"></div>
    <p class="lx-legend"><span class="lg-sw" style="background:rgba(47,140,255,.5)"></span>better than average <span class="lg-sw" style="background:rgba(240,124,42,.5)"></span>worse than average · shading = percentile vs <span class="lx-cmpl">every qualified player</span>. Hover a column name for its definition.</p>
    <p class="adv-src">${esc(M.src)}</p>`;

  const fl = $(".lx-filters", el);
  if (matchMedia("(min-width: 641px)").matches) fl.open = true;
  let shown = 50;
  const filtered = () => {
    const q = SS.fold(st.q.trim()), amin = +st.amin || 0, amax = +st.amax || 99, min = +st.min || 0;
    const fk = st.fk && (KI[st.fk] != null || st.fk === "rima") ? st.fk : "", fv = +st.fv;
    return rows[st.season].filter((r) => r.mp >= min && (!st.pos || r.g === st.pos) && (!st.off || r.off === st.off) && (!st.def || r.def === st.def)
      && (!st.team || r.t === st.team) && r.age >= amin && r.age <= amax && (!q || SS.fold(r.n).includes(q))
      && (!fk || (fk === "rima" ? r.rima : r.v[KI[fk]] ?? -1e9) >= fv));
  };

  function render() {
    const cols = colsFor(st.view, st.sort);
    const hi = better(st.sort), dir = st.dir || (hi ? "desc" : "asc"), m = dir === "asc" ? 1 : -1;
    const list = filtered().filter((r) => value(r, st.sort) != null)
      .sort((a, b) => (value(a, st.sort) - value(b, st.sort)) * m || a.n.localeCompare(b.n));
    // controls reflect state
    $$("[data-k]", el).forEach((c) => { if (c.value !== st[c.dataset.k] && document.activeElement !== c) c.value = st[c.dataset.k]; });
    $$(".lx-view button", el).forEach((b) => b.setAttribute("aria-checked", b.dataset.v === st.view));
    $$(".lx-cmp button", el).forEach((b) => b.setAttribute("aria-checked", b.dataset.c === st.cmp));
    $(".lx-cmpl", el).textContent = st.cmp === "p" ? "players in the same position group" : "every qualified player";
    const th = (id, lab, abbr, gid, num = true) =>
      `<th scope="col" class="${num ? "num" : ""}" data-col="${id}"><button type="button" class="sort${gid ? " abbr" : ""}" data-sort="${id}"${gid ? ` aria-describedby="${gid}"` : ""}>${esc(abbr)}${lab ? `<small>${esc(lab)}</small>` : ""}</button></th>`;
    const headHtml = `<tr><th class="num" scope="col">#</th><th scope="col" class="pl-col">Player</th><th scope="col">Team</th><th scope="col" class="opt">Pos</th><th scope="col" class="num opt">Age</th><th scope="col" class="num opt">MIN</th>${cols.map((c) =>
      c.cat ? th(c.id, "score", c.lab, `lx-c-${c.cat}`) : th(c.id, MET[c.k].n, MET[c.k].a, `lx-g-${c.k}`)).join("")}</tr>`;
    const thead = $("thead", el);
    if (thead.dataset.h !== headHtml) { thead.innerHTML = headHtml; thead.dataset.h = headHtml; }   // keep header nodes (tooltips stay anchored)
    $$("th[data-col]", thead).forEach((t) => {
      const on = t.dataset.col === st.sort; t.classList.toggle("on", on);
      if (on) t.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending"); else t.removeAttribute("aria-sort");
    });
    const cell = (r, c) => {
      const p = pctOf(r, c.id, st.cmp), on = c.id === st.sort ? " on" : "";
      if (c.cat) return `<td class="num hc${on}" style="${shade(p)}" title="${tierOf(p)} · ${p}th percentile"><b>${p}</b></td>`;
      const v = r.v[KI[c.k]], ri = RAWK[c.k], raw = ri != null && r.raw[ri] != null ? (r.raw[ri] * 100).toFixed(1) + "%" : null;
      return `<td class="num hc${on}" style="${shade(p, MET[c.k].hi == null)}" title="${p == null ? "" : `${p}th percentile${raw ? " · raw " + raw + " (shown: volume-adjusted)" : ""}`}">${fmt(c.k, v)}</td>`;
    };
    $("tbody", el).innerHTML = list.slice(0, shown).map((r, i) => `<tr class="go"><td class="num rk">${i + 1}</td>
      <th scope="row" class="pl-col"><a href="/players/${r.s}/">${esc(r.n)}</a><small>${esc(r.off)} · ${esc(r.def)}</small></th>
      <td>${esc(r.t)}</td><td class="opt">${esc(GRP[r.g])}</td><td class="num opt">${r.age}</td><td class="num opt">${r.mp.toLocaleString()}</td>${cols.map((c) => cell(r, c)).join("")}</tr>`).join("")
      || `<tr><td colspan="${6 + cols.length}" class="lx-empty">No players match these filters.</td></tr>`;
    $(".lx-count", el).innerHTML = `<b>${list.length}</b> player${list.length === 1 ? "" : "s"} · ${sl(st.season)} · ranked by <b>${esc(st.sort.startsWith("cat_") ? catCols.find((c) => c.id === st.sort).lab + " score" : MET[st.sort].n)}</b>, ${dir === (hi ? "desc" : "asc") ? "best first" : "worst first"}`;
    const nf = ["season", "pos", "off", "def", "team", "amin", "amax", "min"].filter((k) => st[k] !== DEF[k] && st[k] !== "").length;
    $(".lx-nf", el).textContent = nf ? `(${nf} active)` : "";
    const chips = [];
    if (st.fk) chips.push([`${st.fk === "rima" ? "Rim attempts" : MET[st.fk]?.n || st.fk} ≥ ${st.fv}`, ["fk", "fv"]]);
    $(".lx-chips", el).innerHTML = chips.map(([t, ks], i) => `<button type="button" class="chip on" data-x="${ks.join(",")}">${esc(t)} ✕</button>`).join("");
    $(".lx-more-w", el).innerHTML = list.length > shown ? `<button type="button" class="btn lx-more">Show ${Math.min(50, list.length - shown)} more of ${list.length}</button>` : "";
    save();
  }

  // ---------- events ----------
  let tmo;
  el.addEventListener("input", (e) => {
    const c = e.target.closest("input[data-k]"); if (!c) return;
    clearTimeout(tmo);
    tmo = setTimeout(() => { st[c.dataset.k] = c.value; shown = 50; render(); }, 180);
  });
  el.addEventListener("change", (e) => {
    const c = e.target.closest("select[data-k]"); if (!c) return;
    st[c.dataset.k] = c.value; shown = 50;
    if (c.dataset.k === "sort") { st.dir = ""; st.view = c.value.startsWith("cat_") ? "cats" : MET[c.value].c; track("select_content", { content_type: "leaders_sort", item_id: c.value }); }
    render();
  });
  el.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-sort]");
    if (s) {
      const id = s.dataset.sort;
      if (id === st.sort) { const hi = better(id), cur = st.dir || (hi ? "desc" : "asc"); st.dir = cur === "desc" ? "asc" : "desc"; }
      else { st.sort = id; st.dir = ""; }
      shown = 50; render(); return;
    }
    const v = e.target.closest(".lx-view button"); if (v) { st.view = v.dataset.v; render(); return; }
    const c = e.target.closest(".lx-cmp button"); if (c) { st.cmp = c.dataset.c; render(); return; }
    const x = e.target.closest(".lx-chips [data-x]"); if (x) { x.dataset.x.split(",").forEach((k) => (st[k] = "")); render(); return; }
    if (e.target.closest(".lx-more")) { shown += 50; render(); return; }
    if (e.target.closest(".lx-reset")) { Object.assign(st, DEF, { view: "cats" }); shown = 50; render(); return; }
    const cp = e.target.closest(".lx-copy");
    if (cp) {
      try { await navigator.clipboard.writeText(location.href); cp.textContent = "Copied ✓"; } catch { prompt("Copy this link", location.href); }
      track("share", { method: "copy", item_id: "leaders-explore" });
      setTimeout(() => (cp.textContent = "Copy link to this view"), 1600);
    }
  });
  track("view_item", { items: [{ item_id: "leaders-explore", item_name: "Leaders explorer", item_category: "leaders" }] });
  render();
});
