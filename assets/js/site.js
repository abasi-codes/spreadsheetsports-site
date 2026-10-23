// Spreadsheet Sports — shared site code (no dependencies)
const SS = (() => {
  const DATA_V = 6;   // bump after re-exporting data/*.json so browsers refetch
  // /hockey/* pages get the hockey channel, logo and nav; everything else is the NBA site
  const HOCKEY = location.pathname.startsWith("/hockey");
  const YT_CHANNEL = HOCKEY ? "https://www.youtube.com/@spreadsheetsportshockey" : "https://www.youtube.com/@spreadsheetsportsanalytics";
  const LOGO = HOCKEY ? "/assets/img/logo-hockey.png" : "/assets/img/logo.png", HOME = HOCKEY ? "/hockey/" : "/";
  const SPORT = `<div class="sport-sw" role="navigation" aria-label="Sport"><a href="/" class="${HOCKEY ? "" : "on"}">NBA</a><a href="/hockey/" class="${HOCKEY ? "on" : ""}">Hockey</a></div>`;
  const SUB = YT_CHANNEL + "?sub_confirmation=1";
  const SOCIAL = [
    ["YouTube", YT_CHANNEL, '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z"/>'],
    ["X", "https://x.com/SpreadsheetSprt", '<path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4Zm-1.2 17.9h1.9L6.8 4.2H4.8L17 20.2Z"/>'],
    ["Instagram", "https://www.instagram.com/spreadsheetsportsanalytics/", '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2ZM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9Z"/>'],
  ];
  const icons = (cls = "") => SOCIAL.map(([n, u, d]) => `<a class="soc ${cls}" href="${u}" target="_blank" rel="noopener" aria-label="${n}" title="${n}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">${d}</svg></a>`).join("");
  const cache = {};
  const data = (name) => (cache[name] ||= fetch(`/data/${name}.json?v=${DATA_V}`).then((r) => r.json()));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (p, d = 1) => (p >= 0.995 ? "99%+" : p > 0 && p < 0.001 ? "<0.1%" : `${(p * 100).toFixed(d)}%`);
  const ord = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // URL slug for player/team pages: "Nikola Jokić" -> "nikola-jokic" (tools/build_pages.py uses the same rule)
  const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // GA4 events (no-op if the tag hasn't loaded or is blocked)
  const track = (name, params = {}) => { try { window.gtag && window.gtag("event", name, params); } catch {} };
  // share bar: native share sheet on phones, X + copy link everywhere
  function shareBar(el, { url, text, item }) {
    const full = new URL(url, location.origin).href;
    el.innerHTML = `<div class="share-bar"><button type="button" class="btn ghost sm share-native">↗&nbsp; Share</button>
      <a class="btn ghost sm" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(full)}">Post on X</a>
      <button type="button" class="btn ghost sm share-copy">Copy link</button></div>`;
    const nat = el.querySelector(".share-native");
    if (!navigator.share) nat.remove();
    else nat.onclick = () => { navigator.share({ title: document.title, text, url: full }).then(() => track("share", { method: "native", item_id: item })).catch(() => {}); };
    el.querySelector(".share-copy").onclick = async (e) => {
      try { await navigator.clipboard.writeText(full); e.target.textContent = "Copied ✓"; } catch { prompt("Copy this link", full); }
      track("share", { method: "copy", item_id: item });
    };
    el.querySelector("a").onclick = () => track("share", { method: "x", item_id: item });
  }
  const thumb = (id, q = "maxresdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // models that live in the "More models" dropdown only (homepage stays MVP + title)
  const MORE = [["/models/underrated.html", "Most underrated", "Impact vs the expert rankings"],
                ["/models/unluckiest.html", "Most cursed careers", "The CURSE model, all-time"],
                ["/models/no3.html", "No 3-point line", "Every playoff game since 1980, re-scored"],
                ["/models/contract.html", "Contract years", "Do players play better when they're due?"],
                ["/models/roy.html", "Rookie of the Year", "2027 odds for every rookie, 10,000 sims"],
                ["/models/smoy.html", "Sixth Man of the Year", "2027 odds for every bench player, 10,000 sims"]];
  function chrome() {
    document.body.prepend(h(`<header class="site-head"><div class="wrap">
      <a class="brand" href="${HOME}"><img src="${LOGO}" alt="" width="32" height="32">Spreadsheet <b>Sports</b></a>${SPORT}
      ${HOCKEY ? `<nav class="nav-lite"><a href="/hockey/cup.html">Cup Odds</a><a href="/hockey/underrated.html">Underrated</a><a href="/hockey/#newsletter">Newsletter</a></nav>` : `<nav class="nav-lite"><a href="/models/mvp.html">MVP Tracker</a><a href="/models/title.html">Title Odds</a><a href="/leaders/">Leaders</a><div class="nav-more"><button type="button" aria-haspopup="true" aria-expanded="false">More models <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button><div class="nav-drop">${MORE.map(([u, t, d]) => `<a href="${u}"><b>${t}</b><small>${d}</small></a>`).join("")}</div></div><a href="/#newsletter">Newsletter</a></nav>`}
      <div class="socials">${icons()}</div>
      <a class="yt-btn" href="${SUB}" target="_blank" rel="noopener">▶ Subscribe</a>
      <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="m-nav"><span></span><span></span><span></span></button>
    </div>
    <nav class="m-nav" id="m-nav" hidden>${SPORT}${HOCKEY ? `
      <a href="/hockey/cup.html"><b>Cup Odds</b><small>10,000 seasons · look up any team</small></a>
      <a href="/hockey/#newsletter"><b>Newsletter</b><small>The numbers that didn't make the video</small></a>
      <a href="/"><b>NBA side</b><small>MVP tracker, title odds, every player</small></a>` : `
      <a href="/models/mvp.html"><b>MVP Tracker</b><small>2027 odds · look up any player</small></a>
      <a href="/models/title.html"><b>Title Odds</b><small>10,000 seasons · look up any team</small></a>
      <a href="/leaders/"><b>Leaders</b><small>Who's best at blocks, creation, shooting, defense</small></a>
      <div class="m-more"><span>More models</span>${MORE.map(([u, t]) => `<a href="${u}">${t}</a>`).join("")}</div>
      <a href="/#videos"><b>Latest videos</b><small>New on the channel</small></a>
      <a href="/#newsletter"><b>Newsletter</b><small>The numbers that didn't make the video</small></a>
      <a href="/hockey/"><b>Hockey</b><small>The new hockey channel</small></a>`}
      <div class="m-soc"><span>Follow</span><div class="socials">${icons()}</div></div>
    </nav></header>`));
    const more = $(".nav-more"), mb = $(".nav-more button");
    if (more) mb.onclick = () => { const o = !more.classList.contains("open"); more.classList.toggle("open", o); mb.setAttribute("aria-expanded", o); };
    if (more) document.addEventListener("click", (e) => { if (!e.target.closest(".nav-more")) { more.classList.remove("open"); mb.setAttribute("aria-expanded", false); } });
    const btn = $(".menu-btn"), nav = $("#m-nav");
    const set = (open) => { nav.hidden = !open; btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); document.body.classList.toggle("menu-open", open); };
    btn.onclick = () => set(nav.hidden);
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !nav.hidden) set(false); });
    matchMedia("(min-width: 761px)").addEventListener("change", (e) => e.matches && set(false));
    document.body.append(h(`<footer class="site-foot"><div class="wrap">
      <div><a class="brand" href="${HOME}"><img src="${LOGO}" alt="" width="28" height="28">Spreadsheet <b>Sports</b></a>
      <p style="margin:10px 0 0;max-width:360px">${HOCKEY ? "Hockey" : "NBA"}, by the numbers. Models, simulations and ${HOCKEY ? "backtests" : "film breakdowns"}.</p>
      <p style="margin:8px 0 0">All enquiries: <a href="mailto:team@spreadsheetsports.com" style="color:var(--text)">team@spreadsheetsports.com</a></p></div>
      <div class="socials big">${icons()}</div>
      <div class="fine">© ${new Date().getFullYear()} Spreadsheet Sports. Not affiliated with the ${HOCKEY ? "NHL" : "NBA"} or its teams.</div>
    </div></footer>`));
  }

  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  // animated odds bars
  function bars(el, rows, { max, compact, onPick } = {}) {
    max ??= Math.max(...rows.map((r) => r.p));
    el.classList.add("bars"); if (compact) el.classList.add("compact");
    el.innerHTML = rows.map((r, i) => `<div class="bar-row${onPick ? " click" : ""}" data-i="${i}" ${onPick ? 'role="button" tabindex="0"' : ""}>
        <span class="rk">${i + 1}</span>
        <span class="nm">${esc(r.name)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span>
        <div class="bar-track"><div class="bar-fill" data-w="${(r.p / max) * 100}" ${r.color ? `style="background:${r.color}"` : ""}></div></div>
        <span class="val">${pct(r.p)}</span></div>`).join("");
    if (onPick) {
      const fire = (e) => { const r = e.target.closest(".bar-row"); if (r) onPick(rows[+r.dataset.i]); };
      el.onclick = fire; el.onkeydown = (e) => e.key === "Enter" && fire(e);
    }
    const go = () => $$(".bar-fill", el).forEach((b, i) => setTimeout(() => (b.style.width = b.dataset.w + "%"), 60 * i));
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { go(); io.disconnect(); } });
    io.observe(el);
  }

  // videos (hide scheduled ones until they're public)
  const live = (v) => !v.publishAt || new Date(v.publishAt) <= new Date();
  async function videos() { return (await data("videos")).filter((v) => live(v) && (v.sport === "hockey") === HOCKEY); }
  function videoCard(v) {
    const model = v.kind === "Model";
    return `<a class="card vid reveal" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
      <div class="thumb"><img loading="lazy" src="${thumb(v.id)}" onerror="this.src='${thumb(v.id, "hqdefault")}'" alt=""><span class="kind ${model ? "model" : ""}">${esc(v.kind)}</span></div>
      <div class="body"><h3>${esc(v.title)}</h3><p>${esc(v.blurb)}</p><span class="date">${fmtDate(v.date)}</span></div></a>`;
  }
  // lightweight YouTube embed: thumbnail until clicked
  function embed(el, id) {
    el.classList.add("embed");
    el.innerHTML = `<button aria-label="Play video"><img src="${thumb(id)}" onerror="this.src='${thumb(id, "hqdefault")}'" alt=""><span class="play"></span></button>`;
    $("button", el).addEventListener("click", () => {
      el.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="YouTube video"></iframe>`;
    });
  }

  // sortable table
  function table(el, cols, rows, { sort, dir = -1, limit } = {}) {
    let key = sort ?? cols[0].key, d = dir, shown = limit;
    const render = () => {
      const val = (r, c) => (c.sortVal ? c.sortVal(r) : r[c.key]);
      const col = cols.find((c) => c.key === key);
      const sorted = [...rows].sort((a, b) => { const x = val(a, col), y = val(b, col); return (x > y ? 1 : x < y ? -1 : 0) * d; });
      const list = shown ? sorted.slice(0, shown) : sorted;
      el.innerHTML = `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}" data-k="${c.key}" ${c.key === key ? `aria-sort="${d > 0 ? "ascending" : "descending"}"` : ""}>${c.label}</th>`).join("")}</tr></thead>
        <tbody>${list.map((r) => `<tr>${cols.map((c) => `<td class="${c.num ? "num" : ""}">${c.fmt ? c.fmt(r) : esc(r[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        ${shown && rows.length > shown ? `<div style="text-align:center;margin-top:14px"><button class="btn more">Show all ${rows.length}</button></div>` : ""}`;
      $$("th", el).forEach((th) => th.addEventListener("click", () => { const k = th.dataset.k; if (k === key) d = -d; else { key = k; d = cols.find((c) => c.key === k).asc ? 1 : -1; } render(); }));
      $(".more", el)?.addEventListener("click", () => { shown = 0; render(); });
    };
    render();
  }

  // search with suggestions
  // big: hero-style box with a "/" hint; cycle: example names typed into the placeholder
  function search(wrapper, names, onPick, placeholder, { big, cycle } = {}) {
    wrapper.classList.add("search"); if (big) wrapper.classList.add("big");
    wrapper.innerHTML = `<input type="search" placeholder="${esc(placeholder)}" autocomplete="off" aria-label="${esc(placeholder)}">${big ? `<kbd class="search-kbd" aria-hidden="true">/</kbd>` : ""}<div class="suggest" role="listbox"></div>`;
    const input = $("input", wrapper), box = $(".suggest", wrapper);
    if (cycle && cycle.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const base = placeholder.replace(/[:…].*$/, ""); let i = 0, j = 0, del = false;
      const step = () => {
        if (document.activeElement === input || input.value) { setTimeout(step, 600); return; }
        const w = cycle[i % cycle.length];
        j += del ? -1 : 1; input.placeholder = `${base}: ${w.slice(0, j)}`;
        if (!del && j >= w.length) { del = true; setTimeout(step, 1400); return; }
        if (del && j <= 0) { del = false; i++; }
        setTimeout(step, del ? 35 : 75);
      };
      setTimeout(step, 900);
    }
    let act = -1, items = [];
    const close = () => { box.classList.remove("open"); act = -1; };
    const draw = () => { box.innerHTML = items.map((n, i) => `<button type="button" class="${i === act ? "act" : ""}" data-i="${i}">${esc(n.name)}<span>${esc(n.meta || "")}</span></button>`).join(""); box.classList.toggle("open", items.length > 0); };
    input.addEventListener("input", () => {
      const q = fold(input.value.trim()); act = -1;
      items = q ? names.filter((n) => fold(n.name).includes(q)).sort((a, b) => fold(a.name).indexOf(q) - fold(b.name).indexOf(q)).slice(0, 8) : [];
      draw();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { act = Math.min(act + 1, items.length - 1); draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { act = Math.max(act - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === "Enter") { const n = items[act >= 0 ? act : 0]; if (n) { pick(n); } e.preventDefault(); }
      else if (e.key === "Escape") close();
    });
    const pick = (n) => { input.value = n.name; close(); onPick(n); };
    box.addEventListener("mousedown", (e) => { const b = e.target.closest("button"); if (b) { e.preventDefault(); pick(items[+b.dataset.i]); } });
    input.addEventListener("blur", () => setTimeout(close, 120));
    return { set: (v) => (input.value = v) };
  }

  // Newsletter signups go to Formspark (form "Spreadsheet Sports Analytics"); its autoresponder sends the welcome email.
  const NEWSLETTER_ACTION = "https://submit-form.com/5hHo75qLJ";
  function newsletter(el, { compact, note: noteText } = {}) {
    el.innerHTML = `<form class="nl ${compact ? "compact" : ""}" method="post" action="${NEWSLETTER_ACTION}">
      <input type="email" name="email" required placeholder="you@email.com" aria-label="Email address" autocomplete="email">
      <input type="checkbox" name="_honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <button class="btn red" type="submit">Join free</button></form>
      <p class="note dim">${noteText || "One email a week. No spam, unsubscribe any time."}</p>`;
    const form = $("form", el), note = $(".note", el), btn = $("button", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form._honeypot.checked) return;
      btn.disabled = true; btn.textContent = "Joining…";
      try {
        const r = await fetch(NEWSLETTER_ACTION, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email: form.email.value.trim(), page: location.pathname, signed_up: new Date().toISOString(), "_email.from": "Spreadsheet Sports" }) });
        if (!r.ok) throw new Error(r.status);
        track("generate_lead", { form: "newsletter", page: location.pathname });
        form.outerHTML = `<div class="nl-done"><b>You're in.</b> Check your inbox for a welcome email.</div>`;
        note.textContent = "Didn't get it? Check spam or promotions.";
      } catch {
        btn.disabled = false; btn.textContent = "Join free";
        note.textContent = "Something went wrong. Please try again.";
      }
    });
  }

  function boot() {
    chrome(); requestAnimationFrame(reveal);
    $$(".all-links").forEach((el) => {
      const n = el.querySelectorAll("a").length; if (n <= 24) return;
      el.classList.add("clip");
      const b = h(`<button class="btn all-more" type="button">Show all ${n}</button>`);
      b.onclick = () => { el.classList.remove("clip"); b.remove(); }; el.after(b);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "/" || /input|textarea/i.test(document.activeElement?.tagName || "")) return;
      const inp = document.querySelector(".search.big input"); if (!inp) return;
      e.preventDefault(); inp.scrollIntoView({ block: "center", behavior: "smooth" }); inp.focus({ preventScroll: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { HOCKEY, data, $, $$, h, esc, pct, ord, fold, slug, track, shareBar, thumb, bars, videos, videoCard, embed, table, search, reveal, newsletter, fmtDate, YT_CHANNEL, SUB, icons };
})();
