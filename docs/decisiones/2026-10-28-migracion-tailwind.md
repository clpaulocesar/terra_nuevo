---
fecha: 2026-10-28
estado: aceptada
tags: [decision, frontend, css]
---

# Migración del CSS a Tailwind v4 con tokens propios

**Fecha:** 2026-10-28

## Contexto
- Tailwind v4 ya estaba instalado (`@tailwindcss/vite`), pero casi todo el estilo vive en archivos `.css` por pantalla, con varios archivos "fix" que pisan reglas y `!important` en `Responsive.css`.
- La paleta estaba repetida: `--vino`, `--crema`, `--tinta` y similares en `Catalogo.css`, redefinidas en `theme-dark.css` y `accesibilidad.css`, más variables `--terra-*` sueltas por pantalla.
- Todo el CSS del proyecto está fuera de capas, así que gana a las utilidades de Tailwind (`@layer utilities`) aunque tenga menos especificidad.

## Decisión
- Se migra por fases y por pantalla, nunca todo junto. Orden: base, Catálogo y Layout del cliente, DetalleProducto, flujo de compra, Bienvenida y Categorías, Mayorista, Admin. En cada fase se borran las reglas migradas y los archivos "fix" relacionados.
- Fase 0 (base, en `src/index.css`):
  - Tokens de color en `@theme inline` que apuntan a variables de ejecución `--terra-*`. Valor claro en `:root` de `index.css`, oscuro en `theme-dark.css` y alto contraste en `accesibilidad.css`. Así `bg-terra-primario` cambia solo con el tema.
  - Tokens fijos en `@theme`: radios (`terra-boton`, `terra`, `terra-tarjeta`, en rem), fuente `font-terra` (Manrope) y breakpoint `xs` (360 px).
  - Variantes `dark:` (`[data-theme="dark"]`) y `contraste:` (`.a11y-contraste`), registradas en ese orden para que gane contraste.
  - Las reglas globales por etiqueta pasan a `@layer base`. Se borran las de `Responsive.css` que repetía el preflight.
  - `--vino`, `--crema` y demás quedan como alias de los tokens, sin valores propios por tema.
- Reglas de escritura en `AGENTS.md`, sección "Estilos: Tailwind v4 y tokens".

## Alternativas consideradas
- **Tokens con `@theme` normal (sin `inline`)**: la utilidad referencia la variable de `@theme`, que se calcula una vez en `:root`. Funciona si los temas se redefinen en `<html>`, pero se rompe con cualquier redefinición local. Con `inline` la utilidad usa directamente `var(--terra-*)`.
- **Variante `dark` por `prefers-color-scheme`** (la de Tailwind por defecto): no respeta la elección manual de tema. TemaContext ya traduce la preferencia del sistema a `data-theme`.
- **Poner todo el CSS heredado en una capa** para que las utilidades le ganen: cambia la cascada de todas las pantallas a la vez. Se prefirió borrar las reglas viejas al migrar cada pantalla.

## Consecuencias
- Durante la migración conviven utilidades y CSS heredado. Una clase de Tailwind no tiene efecto si una regla vieja fuera de capas fija la misma propiedad: hay que borrarla en la misma tarea.
- Con el texto al 125 % o 150 % también crecen los espaciados de Tailwind (están en rem), no solo las letras.
- Un color nuevo se define en tres lugares (claro, oscuro y contraste) y se expone en `@theme inline`.
- Al pasar las reglas globales a `@layer base`, el login del admin empezó a mostrar las clases de Tailwind que ya tenía y que esas reglas anulaban (título de 24 px, enlace en vino). Se aceptó ese diseño, con campos y botón en `text-base` (16 px) para evitar el zoom de iOS. En DetalleProducto se restauró el cursor del botón de cantidad deshabilitado.
- Se quitó la carga de la fuente Fraunces de `index.html`: ningún estilo la usaba.

## Fase 1 (catálogo y layout del cliente)
- Código nuevo en `src/features/catalogo/` (página, componentes, hook del escáner QR y funciones puras con tests) y `src/features/layout-cliente/`.
- Clases gancho sin estilos (`terra-card`, `terra-cat`, `page-content`, `site-header`...) se mantienen porque `accesibilidad.css` y pantallas no migradas las usan.
- Iconos con `IconoMaterial` en lugar de la clase de Google, que fija 24 px fuera de capas. Se respetó el tamaño de 24 px que esa clase imponía en el catálogo.
- El paginador usa medidas en px (`terra-toque`, 44 px) y pasa a la versión compacta por debajo de 40 rem: así entra en una fila con texto al 150 %.
- Cortes del catálogo mayorista: 600, 800 y 1100 px pasaron a `sm`, `md` y `lg`. Entre 1024 y 1100 px ahora se ven 2 columnas con el resumen al costado, en vez de 3 columnas con precios partidos en dos líneas. El de 1350 px se conserva (`min-[84.375rem]`): llevarlo a `xl` (1280) dejaba 3 columnas demasiado angostas.
- Desde 768 px la grilla reserva también el ancho del botón de accesibilidad a la izquierda. En Confirmación, por debajo de 761 px (variante `con-resumen-fijo:`), los flotantes y el botón de accesibilidad arrancan sobre la barra del resumen.
- Desde 640 px las acciones del encabezado pasan a una segunda línea cuando no entran (texto al 150 %), en vez de recortar el logo y "Carrito".

### Diferencias aceptadas (revisión del 2026-10-28)
Cambios visibles respecto del diseño anterior que se revisaron en las capturas y se dejan a propósito:
- **Catálogo mayorista entre 1024 y 1100 px**: 2 columnas con el resumen al costado (antes 3 columnas con los precios partidos en dos líneas).
- **Botón deshabilitado rosado**: "Agregar" sin stock usa el token `terra-deshabilitado` en lugar del gris anterior.
- **Reserva para el botón de accesibilidad entre 768 y 1024 px**: la grilla deja libre a la izquierda el ancho de ese botón para que no tape tarjetas.

## Fase 2 (DetalleProducto)
- Código en `src/features/detalle-producto/`: página, componentes, hooks (`useDetalleProducto`, `useCompraProducto`, `useColoresProducto`) y funciones puras con tests (colores y video). El selector de colores sigue oculto con `MOSTRAR_COLORES`, como antes.
- Galería y compra pasan a dos columnas con una consulta de contenedor (`@terra-ficha:`, 45 rem) en lugar de un breakpoint: con texto normal el corte queda cerca de los 930 px (antes 900); con texto al 150 % la ficha queda en una columna y el título ya no queda tapado por los flotantes. Ficha técnica y showroom usan el mismo corte.
- Desde 768 px la ficha reserva a cada lado el ancho de los flotantes y del botón de accesibilidad: a 1024 px ya no tapan "Agregar al carrito" ni "Comprar ahora". Con texto al 150 % la reserva crece con los botones.
- A 768 px "Otros modelos" va en 3 columnas (antes 2 + 1 suelta) y los destacados en 4.
- La etiqueta "Vista N" de las miniaturas nunca se vio (quedaba fuera del botón): ahora es `sr-only` y la miniatura es cuadrada, sin el hueco de abajo.
- En modo oscuro la miniatura elegida muestra su borde vino (antes la regla oscura lo anulaba) y "Ver descripción completa" usa el acento rosado legible.
- El botón "Agregar al carrito" deshabilitado usa `terra-deshabilitado`, como en el catálogo. El botón para cerrar el video pasa a 44 px.
- El contenedor de la ficha pasa de `<main>` a `<div>`: ya estaba dentro del `<main>` del layout.

## Fase 3 (Carrito, Identificación, Confirmación, PedidoGenerado y carrito flotante)
Estado: en revisión (2026-10-29), sin commit.
- Código en `src/features/carrito/` (página y carrito flotante, que comparten `LineaCarrito`), `identificacion/`, `confirmacion/` y `pedido-generado/`. Lo común del flujo de compra está en `src/features/compra/`: botones y tarjetas (`estilosCompra.js`), aviso de pago en mostrador, insignia envío/retiro y caja de totales. Piezas genéricas nuevas: `components/ui/EnlaceVolver.jsx`, `components/ui/HojaInferior.jsx` y `hooks/useHojaInferior.js`.
- El carrito flotante se migra en esta fase porque sus clases (`cart-drawer-*`) también daban forma a las líneas de la página del carrito.
- Funciones puras con pruebas `node --test`: nombre de la línea, campos de Identificación, tipo de entrega de cada producto y mensaje y fecha del ticket.
- Tokens nuevos: `terra-oro-borde` y `terra-ok-borde` (claro, oscuro y contraste), sombras `terra-panel`, `terra-boton`, `terra-hoja`, `terra-cajon` y `terra-anillo-fino`, títulos `text-terra-titulo` / `titulo-movil`, colores de WhatsApp y medidas de la hoja inferior. Variante nueva `en-identificacion:` (oculta el carrito flotante, antes `:has(.ident-page)`).
- Se borraron reglas muertas: el teclado `ident-teclado` (no se usaba; el teclado es `TecladoTactil`), `.cart-row`, `.cart-list`, `.cart-emoji` y `.cart-description` de `index.css`, y `site-header` / `site-footer`, reemplazadas por `print:hidden`.

### Cambios visibles
- **Barra inferior del teléfono**: la hoja del resumen (Carrito y Confirmación) quedaba debajo de la barra de navegación y tapaba "Continuar y generar pedido". Ahora arranca sobre la barra (`--terra-hoja-abajo`) y los flotantes y el botón de accesibilidad, sobre la hoja. El Carrito usa la misma hoja y el mismo corte (761 px) que Confirmación (antes 640 px). Abierta, la hoja queda por encima de los flotantes y del botón de accesibilidad, que antes se superponían a su contenido, con un velo detrás. Se cierra con el asa, con el botón "Cerrar" (44 px, `aria-label`), tocando el velo o con Esc, y el foco vuelve al asa. El asa se sigue viendo de 14 px, pero se toca en 44 px (un `::before` absoluto que no le quita lugar a la hoja cerrada, que sigue en 136 px).
- **Carrito flotante angosto**: cuando el cuerpo del cajón mide menos de 18 rem (360 px con el texto al 150 %), cada línea pasa a dos filas: foto, nombre en dos renglones, precio y cantidad arriba; total y quitar abajo. A 360 px con texto normal (19.75 rem) sigue en una fila.
- **Monto a transferir**: con texto al 150 % "Bs 9.530,00" ya no se parte en dos renglones (pasa entero debajo de la etiqueta).
- **Ticket en teléfono**: el ticket de PedidoGenerado ya no genera scroll horizontal ni corta el QR y la dirección.
- **Reserva de los flotantes desde 768 px** en Carrito, Identificación, Confirmación y PedidoGenerado, como en la ficha. Para que no queden columnas apretadas, Confirmación y PedidoGenerado pasan a dos columnas con una consulta de contenedor (48 y 42 rem): a 768 y 884 px van en una columna.
- **Zonas de toque de 44 px**: botones − / + y quitar de la página del carrito y del carrito flotante (en este, fijos con `terra-toque` para que la línea entre a 360 px), medios de pago, enlace "Volver", "Enviar todos", cerrar y "Vaciar carrito" del carrito flotante. Los medios de pago tenían texto de 10 px: ahora 12.5 px.
- En PedidoGenerado, con texto al 150 % los tres botones de abajo pasan a dos filas en vez de salirse bajo los flotantes.
- **Color en las líneas del carrito**: el nombre del color se ve con su muestra y ya no queda pegado al precio.
- **Modo oscuro**: el total del carrito usa el acento rosado (antes verde), los recuadros de modalidad de Identificación y las insignias de retiro ya no quedan claros sobre fondo oscuro, y el título del aviso de pago es legible.
- **Unificaciones**: "Total a pagar en caja" en vino en Carrito y Confirmación; el aviso de pago en mostrador es el mismo en las dos pantallas; títulos a 2.1 rem (Confirmación tenía 2.3 rem).
- El botón "Ampliar QR para escanear" muestra su texto: antes una regla de `ClienteTheme.css` pintaba de vino el fondo de todos los botones del resumen y el texto quedaba vino sobre vino (contraste 1:1 en claro y oscuro). Ahora 7.5:1 en claro, 10.3:1 en oscuro y 14.7:1 en alto contraste (sin cambios), con el mismo tamaño de letra (`text-terra-sm`).

- La tarjeta de producto para envío de Identificación pasa de `<article role="button">` a `<button>`.

### Diferencias aceptadas (revisión del 2026-10-29)
- **Contraste de "Ampliar QR para escanear"**: de 1:1 (texto invisible en claro y oscuro) a 7.5:1 y 10.3:1.
- **Corte de la hoja del Carrito de 640 a 761 px**: entre 641 y 760 px el resumen del carrito es la hoja inferior, como en Confirmación.
- **Total del carrito en modo oscuro**: rosado (acento), antes verde.
- **Títulos del flujo de compra a 2.1 rem**: Confirmación tenía 2.3 rem.
- **Confirmación en una columna entre 768 y 1023 px**: con la reserva de los flotantes, las dos columnas quedaban demasiado angostas; desde 1024 px siguen siendo dos.

Relacionado: [[00-roadmap]] · [[2026-10-28-flotantes-y-catalogo-movil]]

## Fase 5 (Portal B2B Mayorista)
Estado: completada (2026-10-30).
- Componentes migrados: `src/pages/InicioMayorista.jsx`, `src/pages/PanelMayorista.jsx`, `src/pages/PedidosMayorista.jsx` y `src/components/mayorista/MapaEntregaMayorista.jsx`.
- Se eliminaron físicamente `src/pages/InicioMayorista.css`, `src/pages/PanelMayorista.css` y `src/pages/PedidosMayorista.css`.
- Para el mapa Leaflet en `MapaEntregaMayorista.jsx`, el marcado interactivo dinámico inyectado en el DOM mediante `L.divIcon` se aisló en `src/components/mayorista/MapaEntregaMayorista.css` (permitido por `AGENTS.md` para bibliotecas externas) con variables de token `--terra-*`.
- Se purgaron selectores obsoletos de `.b2b-*` en `src/theme-dark.css`.
- Modo oscuro y contraste completamente funcionales a través de tokens semánticos nativos de Tailwind v4.

