/* Revibit · landing. Pestañas de formulario y envío.
   FORM_ENDPOINT: dirección de la aplicación web de Google Apps Script (https://script.google.com/macros/s/…/exec),
   que guarda cada envío en Google Sheets (ver 06_Producto/formulario_google/).
   Mientras esté vacío, los formularios no envían nada y lo dicen claramente. */
(function () {
  "use strict";
  const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbwfiQ0v1y38jl50gaqi2CEWt8Fye_v84uIDwWsOAurIMfMEKIuGzV-rMqL1e-3ROuLs/exec"; // ← pegar aquí la dirección /exec de Google Apps Script

  // ---------- Pestañas ----------
  // Solo las pestañas del formulario (las de «Por qué Revibit» van aparte)
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  function select(id) {
    if (!tabs.some((t) => t.id === "tab-" + id)) id = "persona";   // siempre queda una abierta
    tabs.forEach((t) => {
      const on = t.id === "tab-" + id;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t.id.replace("tab-", "")));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(next.id.replace("tab-", "")); next.focus();
    });
  });
  // Los botones del hero abren la pestaña que toca
  document.querySelectorAll("a[data-tab]").forEach((a) => a.addEventListener("click", () => select(a.dataset.tab)));
  if (!tabs.some((t) => t.getAttribute("aria-selected") === "true")) select("persona");

  // ---------- Enlaces internos: desplazamiento animado ----------
  // Se ve bajar la página entera. La sección de las parcelas normalmente se
  // queda fija en pantalla varias alturas de scroll; durante el viaje la
  // convertimos en una sección normal (clase .flujo, ya encajada) para que no
  // parezca que la página se queda pillada, y al llegar la restauramos
  // compensando el scroll para que no se note.
  const asm = document.querySelector(".assemble");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let anim = null, fin = null;
  const corta = () => { if (anim) { cancelAnimationFrame(anim); anim = null; if (fin) fin(); } };
  // La rueda/trackpad NO interrumpe el viaje (dura ~2 s): en Mac la inercia de
  // un scroll anterior sigue enviando eventos y lo cortaba a medias, y parecía
  // que la página se quedaba pillada. Solo lo corta tocar la pantalla o una tecla.
  ["touchstart", "keydown"].forEach((ev) => addEventListener(ev, corta, { passive: true }));
  const head = document.querySelector("header");
  const destY = (el) => Math.min(el.getBoundingClientRect().top + scrollY - (head ? head.offsetHeight : 0) + 8,
                                 document.documentElement.scrollHeight - innerHeight);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const dest = id && document.getElementById(id);
    if (!dest) return;
    e.preventDefault();
    corta();
    history.pushState(null, "", "#" + id);
    let y0 = scrollY, y1 = destY(dest);
    if (reduceMotion) { scrollTo({ top: y1, behavior: "instant" }); return; }

    // ¿El viaje atraviesa la sección fija de las parcelas?
    let delta = 0, aTop = 0;
    if (asm) {
      aTop = asm.offsetTop;
      const aEnd = aTop + asm.offsetHeight;
      if (Math.min(y0, y1) < aEnd && Math.max(y0, y1) > aTop && !asm.classList.contains("flujo")) {
        const hOld = asm.offsetHeight;
        asm.classList.add("flujo");
        delta = hOld - asm.offsetHeight;
        if (y0 >= aEnd) { y0 -= delta; scrollTo({ top: y0, behavior: "instant" }); }   // venimos de abajo
        y1 = destY(dest);
      }
    }
    // al terminar (o si el usuario interrumpe): devolver las parcelas a su sitio
    fin = () => {
      fin = null;
      if (!delta) return;
      const y = scrollY, aEndF = aTop + asm.offsetHeight;
      asm.classList.remove("flujo");
      if (y >= aEndF) scrollTo({ top: y + delta, behavior: "instant" });
      else if (y > aTop) scrollTo({ top: aTop + asm.offsetHeight - innerHeight, behavior: "instant" });
    };

    const dist = Math.abs(y1 - y0);
    const dur = Math.min(1800, Math.max(600, 450 + dist * 0.18));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const t0 = performance.now();
    const paso = (t) => {
      const u = Math.min(1, Math.max(0, (t - t0) / dur));
      scrollTo({ top: y0 + (y1 - y0) * ease(u), behavior: "instant" });
      if (u < 1) anim = requestAnimationFrame(paso);
      else { anim = null; if (fin) fin(); }
    };
    anim = requestAnimationFrame(paso);
    // salvaguarda: si el navegador no anima (pestaña en segundo plano), llegar igualmente
    const mio = anim;
    setTimeout(() => { if (anim === mio) { cancelAnimationFrame(anim); anim = null; scrollTo({ top: y1, behavior: "instant" }); if (fin) fin(); } }, dur + 400);
  }));

  // ---------- Formularios ----------
  document.querySelectorAll("form[data-form]").forEach((form) => {
    const msg = form.querySelector(".msg");
    const say = (text, ok) => { msg.textContent = text; msg.className = "msg " + (ok ? "ok" : "err"); };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Validación accesible
      let first = null;
      form.querySelectorAll("[required]").forEach((el) => {
        const bad = el.type === "checkbox" ? !el.checked : !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        el.setAttribute("aria-invalid", bad);
        if (bad && !first) first = el;
      });
      if (first) { say("Revisa los campos marcados con *.", false); first.focus(); return; }
      if (form.elements["_gotcha"].value) return; // trampa para bots (Formspree también la filtra)

      if (!FORM_ENDPOINT) { say("Formulario todavía sin conectar: no se ha enviado nada. (Versión de prueba)", false); return; }

      const btn = form.querySelector('button[type="submit"]');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = "Enviando…";
      try {
        const data = new URLSearchParams(new FormData(form));
        data.set("formulario", form.dataset.form); // persona | constructora → pestaña de la hoja
        data.set("privacidad", "Aceptada " + new Date().toLocaleString("es-ES")); // registro del consentimiento
        if (form.dataset.form === "persona") {
          // Consentimiento opcional para novedades: se envía siempre, marcado o no
          data.set("novedades", form.elements["novedades"].checked ? "Sí" : "No");
          data.set("mayor_edad", form.elements["mayor_edad"].checked ? "Sí" : "No");
        }
        data.set("origen", location.href.split("#")[0]);
        // Google Apps Script no permite leer su respuesta desde otra web (CORS): se envía como
        // formulario normal y, si no hay error de red, se da por recibido.
        await fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data });
        form.reset();
        form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
        say(form.dataset.form === "persona" ? "¡Gracias! Te escribiremos cuando tengamos novedades del primer proyecto." : "Gracias. Te llamaremos en los próximos días.", true);
      } catch (err) {
        say("No se ha podido enviar. Inténtalo de nuevo en unos minutos o escríbenos por correo.", false);
        if (window.console) console.warn("Formulario:", err.message);
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });
})();

// Por qué Revibit: pestañas (clic y flechas del teclado)
(() => {
  const tabs = [...document.querySelectorAll(".why-tabs [role=tab]")];
  if (!tabs.length) return;
  const elige = (t, foco) => {
    tabs.forEach((b) => {
      const on = b === t;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
      document.querySelector('.why-slide[data-slide="' + b.dataset.tab + '"]').classList.toggle("is-on", on);
    });
    if (foco) t.focus();
  };
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => elige(b));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); elige(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
})();
