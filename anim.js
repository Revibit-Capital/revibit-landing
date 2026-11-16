/* Revibit · animaciones de la landing de prueba. Sin librerías. Respeta «reducir movimiento». */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  // ---------- Titular palabra a palabra ----------
  const h1 = document.querySelector(".hero h1");
  if (h1 && !reduce) {
    const dot = h1.querySelector(".dot");
    const text = h1.firstChild.textContent.trim().split(/\s+/);
    h1.innerHTML = text.map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
    if (dot) h1.lastElementChild.appendChild(dot);
  }

  // ---------- Portada: móvil con preview, contador y parallax ----------
  const hero = document.querySelector(".hero");
  const count = document.querySelector("[data-count]");
  function countUp(el) {
    const to = +el.dataset.count;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1600;
    (function step(t) { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  setTimeout(() => { hero.classList.add("go"); if (count) countUp(count); }, reduce ? 0 : 500);

  const phone = document.querySelector("[data-tilt]");
  const floats = [...document.querySelectorAll(".float")];
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.style.setProperty("--mx", x * 100 + "%"); hero.style.setProperty("--my", y * 100 + "%");
      if (phone) phone.style.transform = `rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - y) * 12}deg)`;
      floats.forEach((f) => { f.style.setProperty("--px", (x - 0.5).toFixed(3)); f.style.setProperty("--py", (y - 0.5).toFixed(3)); });
    });
    hero.addEventListener("pointerleave", () => { if (phone) phone.style.transform = ""; });
  }

  // ---------- Aparición al hacer scroll ----------
  const targets = [];
  document.querySelectorAll(".section h2, .section .sub, .kicker, .card, .stairs li, .faq details, .quote blockquote, .tabs, .form").forEach((el) => {
    el.setAttribute("data-reveal", "");
    targets.push(el);
  });
  document.querySelectorAll(".cards, .stairs, .faq").forEach((group) => {
    [...group.children].forEach((c, i) => c.style.setProperty("--rd", i * 0.12 + "s"));
  });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  targets.forEach((t) => (reduce ? t.classList.add("in") : io.observe(t)));

  // Tarjetas de la app: se «reproducen» al entrar en pantalla
  const play = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("play"); play.unobserve(en.target); if (en.target.querySelector(".compare")) sweep(); }
  }), { threshold: 0.35 });
  document.querySelectorAll("[data-play]").forEach((c) => (reduce ? c.classList.add("play") : play.observe(c)));

  // ---------- Antes / después ----------
  const cmp = document.querySelector(".compare"), range = document.querySelector(".cmp-range");
  const setCut = (v) => { cmp.style.setProperty("--cut", v + "%"); range.value = v; };
  if (cmp) range.addEventListener("input", () => setCut(range.value));
  let swept = false;
  function sweep() {
    if (swept || reduce || !cmp) return; swept = true;
    const keys = [[0, 50], [700, 85], [1500, 15], [2300, 50]], t0 = performance.now();
    (function step(t) {
      const e = t - t0; let i = keys.findIndex((k) => k[0] > e); if (i === -1) { setCut(50); return; }
      const [ta, va] = keys[i - 1], [tb, vb] = keys[i], p = (e - ta) / (tb - ta), s = p * p * (3 - 2 * p);
      setCut(Math.round(va + (vb - va) * s)); requestAnimationFrame(step);
    })(t0);
  }

  // ---------- Parcelas que encajan con el scroll ----------
  const asm = document.querySelector(".assemble");
  if (asm && !reduce) {
    const cells = [...asm.querySelectorAll(".asm-grid span")], text = asm.querySelector(".asm-text");
    const lit = new Set([2, 5, 9, 12, 16, 23, 7, 19]);
    const start = cells.map(() => ({ x: (Math.random() - 0.5) * 1.6 * innerWidth, y: (Math.random() - 0.5) * 1.4 * innerHeight, r: (Math.random() - 0.5) * 160, s: 0.5 + Math.random() * 0.8 }));
    const ease = (p) => 1 - Math.pow(1 - p, 3);
    let ticking = false;
    function update() {
      ticking = false;
      const r = asm.getBoundingClientRect(), total = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const k = ease(Math.min(1, p / 0.6));
      cells.forEach((c, i) => {
        const s = start[i];
        c.style.transform = `translate(${s.x * (1 - k)}px, ${s.y * (1 - k)}px) rotate(${s.r * (1 - k)}deg) scale(${s.s + (1 - s.s) * k})`;
        c.classList.toggle("lit", lit.has(i) && p > 0.55 + (i % 5) * 0.04);
      });
      text.style.setProperty("--t", Math.min(1, Math.max(0, (p - 0.55) / 0.25)).toFixed(3));
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }
})();
