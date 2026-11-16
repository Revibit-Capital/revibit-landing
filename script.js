/* Revibit · landing. Pestañas de formulario y envío.
   FORM_ENDPOINT: dirección del servicio que recibe los formularios (p. ej. Formspree o Tally).
   Mientras esté vacío, los formularios no envían nada y lo dicen claramente. */
(function () {
  "use strict";
  const FORM_ENDPOINT = ""; // ← pegar aquí la URL del servicio de formularios

  // ---------- Pestañas ----------
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function select(id) {
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
  document.querySelectorAll("[data-tab]").forEach((a) => a.addEventListener("click", () => select(a.dataset.tab)));

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
      if (form.web.value) return; // trampa para bots

      if (!FORM_ENDPOINT) { say("Formulario todavía sin conectar: no se ha enviado nada. (Versión de prueba)", false); return; }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const data = new FormData(form);
        data.delete("web");
        data.append("tipo", form.dataset.form);
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(r.status);
        form.reset();
        say(form.dataset.form === "persona" ? "¡Gracias! Te escribiremos cuando tengamos novedades del primer proyecto." : "Gracias. Te llamaremos en los próximos días.", true);
      } catch (err) {
        say("No se ha podido enviar. Inténtalo de nuevo en unos minutos.", false);
      } finally { btn.disabled = false; }
    });
  });
})();
