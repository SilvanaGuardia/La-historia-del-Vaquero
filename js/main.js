/* ==========================================================================
   Del Vaquero al Chalán — interacción
   1. Rellena plantillas con los datos (window.VAQUEROS)
   2. Ilustraciones: busca assets/riders/<id>.webp|png|jpg; si no hay, muestra un aviso
   3. Carril horizontal: flechas, rueda del mouse y teclado
   4. Ventana emergente con la ficha completa (<dialog> nativo)
   ========================================================================== */
(() => {
  "use strict";

  const data  = window.VAQUEROS || [];
  const rail  = document.getElementById("rail");
  const tpl   = document.getElementById("card-tpl");
  const prev  = document.querySelector(".rail-btn--prev");
  const next  = document.querySelector(".rail-btn--next");
  const modal = document.getElementById("modal");

  const EXTENSIONES = ["webp", "png", "jpg"];   // formatos aceptados para los jinetes

  /* ---------- Utilidades ---------- */

  // Rellena todos los [data-field] dentro de "raiz" con los valores de "v".
  // Si un campo viene vacío, se oculta su fila entera (no quedan etiquetas huérfanas).
  function rellenar(raiz, v) {
    raiz.querySelectorAll("[data-field]").forEach(el => {
      const valor = v[el.dataset.field] ?? "";
      el.textContent = valor;
      const fila = el.closest(".facts > div") || el;
      fila.hidden = !valor;
    });
  }

  // Coloca la ilustración del jinete probando cada extensión; si no existe ninguna,
  // deja un recuadro que dice qué archivo falta.
  function ponerJinete(contenedor, v) {
    contenedor.innerHTML = "";
    contenedor.classList.remove("is-missing");
    const img = new Image();
    img.className = "ink";
    img.alt = `Ilustración: ${v.nombre} (${v.pais})`;
    img.decoding = "async";
    let intento = 0;
    img.onerror = () => {
      if (++intento < EXTENSIONES.length) { img.src = `assets/riders/${v.id}.${EXTENSIONES[intento]}`; return; }
      contenedor.classList.add("is-missing");
      contenedor.innerHTML = `
        <img class="ink" src="assets/ic-horse.webp" alt="" width="64" height="64">
        <span>Ilustración pendiente</span>
        <code>assets/riders/${v.id}.webp</code>`;
    };
    // (la versión de un solo archivo trae las imágenes embebidas en window.JINETES_EMBEBIDOS)
    img.src = window.JINETES_EMBEBIDOS?.[v.id] || `assets/riders/${v.id}.${EXTENSIONES[0]}`;
    contenedor.appendChild(img);
  }

  const ponerMapa = (raiz, v) => raiz.querySelectorAll("[data-mapa]").forEach(svg => {
    svg.classList.remove("is-country");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.innerHTML = '<use href="#i-mapa"/>';
    window.Mapas?.dibujar(svg, v.mapa);
  });

  /* ---------- 1. Render de tarjetas ---------- */
  function renderCard(v, index) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = v.id;
    rellenar(node, v);
    // nombres largos → letra un poco más chica para que entren en la columna
    if (v.nombre.length > 14) node.querySelector(".card__name").classList.add("is-long");
    ponerJinete(node.querySelector("[data-rider]"), v);
    ponerMapa(node, v);

    const hit = node.querySelector(".card__hit");
    hit.setAttribute("aria-label", `Ver ficha: ${v.nombre}, ${v.pais}`);
    hit.addEventListener("click", () => abrirFicha(index));
    return node;
  }

  const frag = document.createDocumentFragment();
  data.forEach((v, i) => frag.appendChild(renderCard(v, i)));
  rail.appendChild(frag);

  /* ---------- 2. Carril horizontal ---------- */
  const paso = () => (rail.querySelector(".card")?.offsetWidth || 220) + 15;

  function actualizarFlechas() {
    const desborda = rail.scrollWidth > rail.clientWidth + 2;
    prev.hidden = !desborda || rail.scrollLeft <= 2;
    next.hidden = !desborda || rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
  }

  // avanza de a "página" (las tarjetas que se ven menos una)
  const avanzar = dir => {
    const n = Math.max(1, Math.floor(rail.clientWidth / paso()) - 1);
    rail.scrollBy({ left: dir * n * paso(), behavior: "smooth" });
  };

  prev.addEventListener("click", () => avanzar(-1));
  next.addEventListener("click", () => avanzar(1));
  rail.addEventListener("scroll", actualizarFlechas, { passive: true });
  window.addEventListener("resize", actualizarFlechas);
  window.addEventListener("load", actualizarFlechas);

  // Nota: la rueda del mouse NO mueve el carril (así el scroll vertical de la página
  // nunca se traba). Para avanzar: flechas, Shift + rueda, trackpad o deslizar con el dedo.

  // Teclado: flechas cuando el carril tiene el foco
  rail.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { avanzar(1);  e.preventDefault(); }
    if (e.key === "ArrowLeft")  { avanzar(-1); e.preventDefault(); }
  });

  actualizarFlechas();

  /* ---------- 3. Ventana emergente ---------- */
  function abrirFicha(i) {
    const v = data[i];
    rellenar(modal, v);
    ponerJinete(modal.querySelector("[data-rider]"), v);
    ponerMapa(modal, v);
    modal.querySelector(".modal__text").scrollTop = 0;
    modal.showModal();
  }

  modal.querySelector(".modal__close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });  // clic afuera cierra
})();
