// film hero (NBA + hockey home): show the stat that goes with each cut; cue file comes from the video's data-cues
(async () => {
  const v = document.querySelector(".hero-film video"), el = document.getElementById("cue"); if (!v || !el) return;
  const { cues, poster } = await fetch(v.dataset.cues || "/assets/media/hero.json?v=3").then((r) => r.json());
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

