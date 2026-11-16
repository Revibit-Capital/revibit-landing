/* Revibit · landing. Pestañas de formulario y envío.
   FORM_ENDPOINT: dirección de la aplicación web de Google Apps Script (https://script.google.com/macros/s/…/exec),
   que guarda cada envío en Google Sheets (ver 06_Producto/formulario_google/).
   Mientras esté vacío, los formularios no envían nada y lo dicen claramente. */
(function () {
  "use strict";
  const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbwfiQ0v1y38jl50gaqi2CEWt8Fye_v84uIDwWsOAurIMfMEKIuGzV-rMqL1e-3ROuLs/exec"; // ← pegar aquí la dirección /exec de Google Apps Script

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
