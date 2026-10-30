---
fecha: 2026-10-28
estado: aceptada
tags: [decision, frontend, responsive]
---

# Botones flotantes con una sola definición y catálogo móvil a dos columnas

**Fecha:** 2026-10-28

## Contexto
- En el catálogo móvil (412 × 968, Galaxy Z Fold 6) el contenido quedaba en una columna angosta con franjas del fondo, la paginación se partía en tres filas, había un bloque blanco vacío al final y una sola tarjeta por fila.
- Las causas estaban repartidas: reglas heredadas de `index.css` (`.page-content` y `.site-footer`) que ganaban en la cascada, reglas con `!important` en `Responsive.css` y la posición de los botones flotantes (QR, carrito y asistente) definida en cuatro archivos.
- El botón "Asistente" era una píldora con texto y tapaba tarjetas a 884, 1024 y 1280 px, también en la tablet del kiosco.

## Decisión
- La posición de los tres flotantes se define solo en `routes/FloatingActions.css`, con las medidas de `.app-shell` en `routes/Layout.css` (`--floating-cart-*`, `--terra-flotantes-*`). Incluye `env(safe-area-inset-bottom)`.
- El botón del asistente es un círculo del mismo tamaño que el carrito y el QR, en todos los anchos. Su nombre accesible sigue en `aria-label` ("Abrir asistente").
- Desde 768 px la grilla del catálogo reserva a la derecha el ancho de la columna de flotantes, salvo lo que ya cubre el margen de la página en pantallas anchas.
- Por debajo de 768 px, el pie de página reserva bajo su texto el alto de los flotantes y de la barra inferior. Así, al final del scroll ningún botón tapa la paginación ni la última tarjeta.
- `viewport-fit=cover` en `index.html`. El encabezado suma `env(safe-area-inset-top)` y la barra inferior móvil `env(safe-area-inset-bottom)`.
- Catálogo: 2 columnas desde 360 px y 3 desde 768 px. La imagen es cuadrada por debajo de 1024 px y conserva 210 px de alto desde 1024. En modo accesible la grilla usa tarjetas de 260 px como mínimo, una columna en teléfono. *Reemplazado el 30/10 por [[2026-10-30-grilla-catalogo-auto-fill]] (auto-fill con ancho mínimo en rem).*
- Paginador en una fila. La versión compacta (`‹ 1 … 5 … 826 ›`) se elige con `usarPaginadorCompacto` (`utils/paginacion.js`), medido en rem para que el texto al 125 % o 150 % cambie antes de versión.

## Alternativas consideradas
- **Mantener la píldora "Asistente" y reservar su ancho**: las tarjetas del kiosco a 1024 px bajaban de unos 290 a unos 250 px.
- **Píldora solo en pantallas anchas (≥ 1440 px)**: agregaba un breakpoint fuera de 360/768/1024.
- **Reservar espacio con `padding-bottom` del catálogo**: no sirve en las demás pantallas y dependía de la altura del pie.

## Consecuencias
- El texto "Asistente" ya no se ve. Para recuperarlo hay que volver a la píldora y aumentar `--terra-flotantes-reserva`.
- En teléfono los flotantes siguen pasando sobre las tarjetas mientras se hace scroll. Solo al final del scroll quedan libres.
- El botón de accesibilidad (abajo a la izquierda) sigue pasando sobre la primera columna mientras se hace scroll. No se cambió en esta tarea.
- Sin las reglas de `index.css`, todas las pantallas del cliente usan el ancho y el padding de `routes/Layout.css`. En teléfono el margen lateral es 16 px.

Relacionado: [[01-arquitectura]] · [[00-roadmap]]
