// Hockey player pages + /hockey/players/: player search (data/hockey_search.json, tools/hockey_pages.py)
(async () => {
  const el = document.getElementById("find"); if (!el) return;
  const { data, search, track } = SS;
  const list = await data("hockey_search");
  search(el, list, (n) => { track("search", { search_term: n.name }); location.href = n.href; }, "Search any NHL player…");
  const s = document.body.dataset.player;
  if (s) track("view_item", { items: [{ item_id: `hk-${s}`, item_name: document.querySelector("h1")?.textContent, item_category: "hockey player" }] });
})();
