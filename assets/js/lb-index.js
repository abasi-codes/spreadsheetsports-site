// Leaders index (/leaders/, /hockey/leaders/): tabs over the preset boards. Six "Top boards" by default; every board
// stays in the HTML (crawlable) and shows without JS. Tab choice lives in the URL (?tab=defense).
(() => {
  const tabs = document.querySelector(".lb-tabs"), grid = document.querySelector(".lb-grid"); if (!tabs || !grid) return;
  const cards = [...grid.querySelectorAll(".lb-card")], btns = [...tabs.querySelectorAll("button")];
  const allBtn = document.querySelector(".lb-allbtn button");
  document.body.classList.add("lb-js");
  const show = (tab, push) => {
    if (!btns.some((b) => b.dataset.tab === tab)) tab = "top";
    btns.forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    cards.forEach((c) => (c.hidden = !(tab === "all" || (tab === "top" ? c.dataset.top === "1" : (c.dataset.g || "").split(" ").includes(tab)))));
    if (allBtn) allBtn.parentElement.hidden = tab === "all";
    if (push) {
      const u = new URL(location.href);
      tab === "top" ? u.searchParams.delete("tab") : u.searchParams.set("tab", tab);
      history.replaceState(null, "", u);
      try { SS.track("select_content", { content_type: "leaders_tab", item_id: tab }); } catch {}
    }
  };
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.tab, true); });
  tabs.addEventListener("keydown", (e) => {
    const b = e.target.closest("button"); if (!b || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const i = btns.indexOf(b), n = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
    n.focus(); n.click(); e.preventDefault();
  });
  if (allBtn) allBtn.onclick = () => { show("all", true); };
  show(new URLSearchParams(location.search).get("tab") || "top", false);
})();
