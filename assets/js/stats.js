// Player + team pages: stat-name tooltips (hover, keyboard focus, tap), the Per game | Advanced toggle,
// sortable roster tables and clickable roster rows. The tables themselves are static HTML (tools/stat_tables.py).
(() => {
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- tooltips: text comes from the glossary <dd> each header points at (aria-describedby) ----------
  const tip = document.createElement("div");
  tip.className = "ss-tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.append(tip);
  let cur = null, pinned = false, lastPointer = "mouse";

  const body = (el) => {
    const d = document.getElementById(el.getAttribute("aria-describedby")); if (!d) return "";
    const dt = d.parentElement.querySelector("dt");
    const name = dt ? dt.querySelector("small")?.textContent || dt.textContent : "";
    const abbr = dt ? dt.firstChild.textContent : "";
    return `<b>${abbr}${name && name !== abbr ? ` <small>${name}</small>` : ""}</b><span>${d.innerHTML}</span>`;
  };
  function place(el) {
    const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) { hide(); return; }
    tip.style.maxWidth = Math.min(300, vw - 24) + "px";
    tip.style.left = "0px"; tip.style.top = "0px";
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const x = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, vw - w - 12));
    let y = r.bottom + 8;
    if (y + h > vh - 8 && r.top - h - 8 > 8) y = r.top - h - 8;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function show(el, pin = false) {
    if (cur && cur !== el) cur.classList.remove("tip-on");
    cur = el; pinned = pin;
    tip.innerHTML = body(el); tip.hidden = false; el.classList.add("tip-on");
    place(el);
  }
  function hide() { if (cur) cur.classList.remove("tip-on"); cur = null; pinned = false; tip.hidden = true; }

  document.addEventListener("pointerdown", (e) => {
    lastPointer = e.pointerType || "mouse";
    if (!e.target.closest(".abbr") && !e.target.closest(".ss-tip")) hide();
  }, true);
  document.addEventListener("pointerover", (e) => {
    const a = e.target.closest?.(".abbr");
    if (a && e.pointerType === "mouse" && !pinned) show(a);
  });
  document.addEventListener("pointerout", (e) => {
    const a = e.target.closest?.(".abbr");
    if (a && e.pointerType === "mouse" && !pinned && !a.contains(e.relatedTarget) && document.activeElement !== a) hide();
  });
  document.addEventListener("focusin", (e) => { const a = e.target.closest?.(".abbr"); if (a && lastPointer === "mouse") show(a); });
  document.addEventListener("focusout", (e) => { if (e.target.closest?.(".abbr") && !pinned) hide(); });
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".abbr"); if (!a) return;
    if (lastPointer !== "mouse") { if (cur === a && pinned && !a.classList.contains("sort")) hide(); else show(a, true); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cur) { hide(); return; }
    const a = e.target.closest?.(".abbr");
    if (a && !a.matches("button") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); cur === a ? hide() : show(a, true); }
  });
  // keyboard users: Tab onto a header shows its tip (pointer "mouse" is the default before any pointer event)
  document.addEventListener("keydown", (e) => { if (e.key === "Tab") lastPointer = "mouse"; }, true);
  window.addEventListener("scroll", () => cur && place(cur), true);
  window.addEventListener("resize", () => cur && place(cur));

  // ---------- Per game | Advanced (remembered per browser) ----------
  const KEY = "ss-stats-view";
  $$(".seg[role=tablist]").forEach((seg) => {
    const card = seg.closest(".card"), tabs = $$("[role=tab]", seg);
    const set = (v, save) => {
      tabs.forEach((t) => { const on = t.dataset.view === v; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      $$("[role=tabpanel]", card).forEach((p) => (p.hidden = p.dataset.view !== v));
      if (save) { try { localStorage.setItem(KEY, v); } catch {} }
      hide();
    };
    seg.addEventListener("click", (e) => { const t = e.target.closest("[role=tab]"); if (t) set(t.dataset.view, true); });
    seg.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      const n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      set(tabs[n].dataset.view, true); tabs[n].focus(); e.preventDefault();
    });
    let v = null; try { v = localStorage.getItem(KEY); } catch {}
    if (v === "pg" || v === "adv") set(v, false);
  });

  // ---------- sortable roster ----------
  const TEXT = new Set(["player", "pos"]);
  $$("table[data-sortable]").forEach((tbl) => {
    const tb = tbl.tBodies[0], ths = $$("thead th[data-k]", tbl);
    const hint = tbl.closest(".card")?.querySelector(".tbl-hint");
    if (hint) hint.setAttribute("aria-live", "polite");
    ths.forEach((th) => th.querySelector("button").addEventListener("click", () => {
      const was = th.getAttribute("aria-sort");
      const dir = was ? (was === "descending" ? "ascending" : "descending") : th.dataset.dir === "asc" ? "ascending" : "descending";
      ths.forEach((x) => x.removeAttribute("aria-sort")); th.setAttribute("aria-sort", dir);
      const ci = [...th.parentNode.children].indexOf(th), k = th.dataset.k, m = dir === "ascending" ? 1 : -1;
      const val = (tr) => { const v = tr.children[ci].dataset.v; return TEXT.has(k) ? v : parseFloat(v); };
      const rows = [...tb.rows].sort((a, b) => { const x = val(a), y = val(b); return (TEXT.has(k) ? x.localeCompare(y) : x - y) * m; });
      tb.append(...rows);
      if (hint) {
        const lab = th.textContent.trim();
        hint.textContent = k === "min" && dir === "descending" ? "Sorted by minutes per game last season, so the rotation is on top. Click a column to sort; click a player for his full profile."
          : `Sorted by ${lab}, ${TEXT.has(k) ? (m > 0 ? "A to Z" : "Z to A") : m > 0 ? "low to high" : "high to low"}. Click again to reverse.`;
      }
    }));
  });

  // whole roster row opens the player page (the name stays a real link for keyboard, screen readers and crawlers)
  document.addEventListener("click", (e) => {
    const tr = e.target.closest("tr.go"); if (!tr || e.target.closest("a, button")) return;
    if (String(window.getSelection?.() || "").length) return;
    const a = tr.querySelector("a[href]"); if (!a) return;
    if (e.metaKey || e.ctrlKey) window.open(a.href, "_blank"); else location.href = a.href;
  });
})();
