// player pages without an MVP card (advanced stats only) + the /players/ index: site-wide search
(async () => {
  const el = document.getElementById("find"); if (!el) return;
  const { data, search, track } = SS;
  const list = await data("search");
  search(el, list, (n) => { track("search", { search_term: n.name }); location.href = n.href; }, "Search any player or team…");
  const s = document.body.dataset.adv;
  if (s) track("view_item", { items: [{ item_id: `adv-${s}`, item_name: document.querySelector("h1")?.textContent, item_category: "advanced stats" }] });
})();
