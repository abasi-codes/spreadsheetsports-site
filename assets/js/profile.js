// Player profile (redesign): season switcher, "percentiles vs all players / vs position" toggle,
// sticky jump bar highlight, share bar + newsletter. The numbers are static HTML (tools/player_profile.py);
// every percentile element (.pv) carries data-l (league) and data-p (position group).
(() => {
  const root = document.querySelector(".mx"); if (!root) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const track = (n, p) => { try { SS.track(n, p); } catch {} };
  const TIERS = [[90, "Elite", "t-elite"], [70, "Strong", "t-strong"], [40, "Average", "t-avg"], [20, "Below avg", "t-below"], [0, "Weak", "t-weak"]];
  const tier = (p) => TIERS.find((t) => p >= t[0]);
  const GRP = { G: "Guards", W: "Wings", B: "Bigs" };
  const panels = $$(".mx-season", root);
  const years = panels.map((p) => p.dataset.y);
  const store = (k, v) => { try { v === undefined ? (v = localStorage.getItem(k)) : localStorage.setItem(k, v); } catch { v = null; } return v; };

  let season = (panels.find((p) => !p.hidden) || panels[0]).dataset.y;
  const q = new URLSearchParams(location.search).get("season");
  if (q && years.includes(q)) season = q;
  let cmp = store("ss-cmp") === "p" ? "p" : "l";

  function paint(el, v) {
    const t = tier(v), bar = $(".pbar i", el);
    if (bar) { bar.style.width = Math.max(2, v) + "%"; if (!el.classList.contains("style")) bar.className = t[2]; }
    const n = $(".gl-score, .cat-score, .mx-pct", el); if (n) n.textContent = v;
    const tg = $(".tier", el); if (tg) { tg.textContent = t[1]; tg.className = "tier " + t[2]; }
  }

  function apply() {
    document.querySelectorAll(".by-season").forEach((el) => (el.hidden = el.dataset.y !== season));
    panels.forEach((p) => {
      const on = p.dataset.y === season;
      $$("[data-id]", p).forEach((el) => (el.id = on ? el.dataset.id : `${el.dataset.id}-${p.dataset.y}`));
    });
    const panel = panels.find((p) => p.dataset.y === season);
    $$(".grp-lbl").forEach((el) => (el.textContent = panel.dataset.glbl || GRP[panel.dataset.grp] || "Position"));
    $$(".pv", root).forEach((el) => { const v = +el.dataset[cmp]; if (!Number.isNaN(v)) paint(el, v); });
    $$(".cmp-lbl", root).forEach((el) => (el.textContent = el.dataset[cmp]));
    $$("[data-ctl=season] button").forEach((b) => b.setAttribute("aria-checked", b.dataset.y === season));
    $$("[data-ctl=cmp] button").forEach((b) => b.setAttribute("aria-checked", b.dataset.c === cmp));
    observe();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".mx-seg button"); if (!b || b.disabled) return;
    const ctl = b.closest(".mx-seg").dataset.ctl;
    if (ctl === "season" && b.dataset.y !== season) {
      season = b.dataset.y;
      const u = new URL(location.href);
      if (season === years[0]) u.searchParams.delete("season"); else u.searchParams.set("season", season);
      history.replaceState(null, "", u);
      track("select_content", { content_type: "season", item_id: `${root.dataset.player}-${season}` });
    } else if (ctl === "cmp" && b.dataset.c !== cmp) {
      cmp = b.dataset.c; store("ss-cmp", cmp);
      track("select_content", { content_type: "percentile_compare", item_id: cmp === "p" ? "position" : "league" });
    } else return;
    apply();
  });
  // radio-group keyboard: arrows move between options
  document.addEventListener("keydown", (e) => {
    const b = e.target.closest?.(".mx-seg button"); if (!b || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const opts = $$("button:not([disabled])", b.parentElement), i = opts.indexOf(b);
    const n = opts[(i + (e.key === "ArrowRight" ? 1 : -1) + opts.length) % opts.length];
    n.focus(); n.click(); e.preventDefault();
  });

  // sticky jump bar: highlight the section in view
  const bar = $("#jump"); let io;
  function observe() {
    if (!bar || !("IntersectionObserver" in window)) return;
    io && io.disconnect();
    const links = $$(".jump-links a", bar);
    const map = new Map(links.map((a) => [document.getElementById(a.getAttribute("href").slice(1)), a]).filter(([el]) => el));
    io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove("on"));
      const a = map.get(en.target); if (!a) return;
      a.classList.add("on");
      const box = a.parentElement; box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
    }), { rootMargin: "-140px 0px -60% 0px" });
    map.forEach((_, el) => io.observe(el));
  }
  if (bar) {
    const hero = $(".ply-hero");
    const s = new IntersectionObserver(([en]) => bar.classList.toggle("stuck", !en.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    hero && s.observe(hero);
    bar.addEventListener("click", (e) => { const a = e.target.closest("a"); if (a) track("select_content", { content_type: "jump", item_id: a.getAttribute("href").slice(1) }); });
  }

  // share + newsletter (MVP pages have both inside the MVP card instead)
  const sh = $("#share-pl");
  if (sh && typeof SS !== "undefined") {
    const scout = $(".hero-scout:not([hidden]) .scout");
    const line = scout ? scout.lastChild.textContent.trim() : "";
    SS.shareBar(sh, { url: location.pathname, item: root.dataset.player, text: `${sh.dataset.name}, by the numbers: ${line}` });
    SS.newsletter($("#nl-pl"), { compact: true, note: "One email a week with model updates. Free." });
  }
  apply();
})();
