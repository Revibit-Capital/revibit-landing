/* Acceso con contraseña mientras la landing no esté lanzada (barrera básica, no es seguridad real).
   Misma contraseña que el prototipo. Para quitarla al lanzar: borrar este archivo y su <script> en cada página. */
(function () {
  "use strict";
  var HASH = "96b04d6957bbb0e75bb32736bdcfbe0ee336ea9f81c8f2d95b7a6f0f4ab93c1e";
  var KEY = "revibit-landing-acceso";
  var force = /[?&]gate=1\b/.test(location.search); // para probar la contraseña en local
  var local = !force && (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === "file:");
  var ok = false;
  try { ok = localStorage.getItem(KEY) === HASH; } catch (e) { /* sin almacenamiento */ }
  if (local || ok) return;

  document.documentElement.classList.add("locked");
  function sha256(t) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var g = document.createElement("div");
    g.className = "gate";
    g.setAttribute("role", "dialog");
    g.setAttribute("aria-modal", "true");
    g.setAttribute("aria-labelledby", "gate-t");
    g.innerHTML =
      '<form class="gate-box">' +
      '<span class="logo">Revibit<span class="dot">.</span></span>' +
      '<h1 id="gate-t">Vista previa privada<span class="dot">.</span></h1>' +
      '<p>Esta web todavía no está lanzada. Escribe la contraseña que te han pasado.</p>' +
      '<label class="sr-only" for="gate-pw">Contraseña</label>' +
      '<input id="gate-pw" type="password" autocomplete="current-password" placeholder="Contraseña" required>' +
      '<button class="btn btn-neon btn-block" type="submit">Entrar</button>' +
      '<p class="gate-err" role="alert"></p></form>';
    document.body.appendChild(g);
    var input = g.querySelector("input");
    input.focus();
    g.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      sha256(input.value.trim().toLowerCase()).then(function (h) {
        if (h === HASH) {
          try { localStorage.setItem(KEY, h); } catch (x) { /* sin almacenamiento */ }
          document.documentElement.classList.remove("locked");
          g.remove();
        } else {
          g.querySelector(".gate-err").textContent = "Contraseña incorrecta. Prueba otra vez.";
          input.select();
        }
      });
    });
  });
})();
