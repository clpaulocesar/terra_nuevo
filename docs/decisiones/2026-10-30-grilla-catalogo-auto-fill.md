---
fecha: 2026-10-30
estado: aceptada
tags: [decision, frontend, responsive, catalogo]
---

# Grilla del catálogo con auto-fill y ancho mínimo de tarjeta en rem

**Fecha:** 2026-10-30

## Contexto
- La grilla del catálogo (`GrillaProductos.jsx`, que usan el catálogo, las ofertas `?ofertas=1` y los filtros por categoría) tenía columnas fijas por breakpoint: 2 desde 360 px y 3 desde 768 px; el mayorista, otra combinación con `min-[84.375rem]`. En modo accesible, `accesibilidad.css` las anulaba con `auto-fill` de 260 px y `!important`.
- Las columnas no seguían al ancho disponible: a 768 px quedaban 3 tarjetas de 187 px; en teléfono, 2 de 158–193 px. Con texto al 150 % solo cambiaban por la regla forzada.
- [[2026-10-28-flotantes-y-catalogo-movil]] había fijado "2 columnas desde 360 px". La columna única que se descartó entonces era angosta y con franjas del fondo por reglas heredadas de `index.css` que ya no existen.

## Decisión
- `grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--spacing-terra-tarjeta-min)), 1fr))` para cliente y mayorista. El ancho mínimo es un token de `@theme`: `--spacing-terra-tarjeta-min: 13rem` (208 px con texto normal).
- Resultado con texto normal: 1 columna de 360 a 430 px, 2 a 640 y 768 px, 3 a 1024 × 768 (tarjetas de 270 px) y 5 a 1366 px. El mayorista, con el resumen al costado desde 1024 px, queda en 2 columnas a 1024 y 3 a 1366.
- Al estar en rem, con texto al 150 % entran menos columnas sin reglas aparte: 1 hasta 768 px y 2 a 1024. Se borra la anulación de `accesibilidad.css` (y con ella la clase gancho `terra-grid`, que ya no usa ninguna hoja).
- La foto de la tarjeta sigue cuadrada (`object-contain`, conserva su proporción) con un tope de alto, `--spacing-terra-foto-tarjeta: 13.125rem` (210 px, el alto que ya tenía desde 1024 px). En una columna la tarjeta no crece: la foto queda en 210 px aunque la tarjeta mida 400 px de ancho.
- Se borran las reglas de columnas de `.product-grid` en `index.css`, que ningún componente usaba.

### Tamaño de página según las columnas (agregado el 30/10)
- Con un límite fijo de 12 la última fila quedaba incompleta en casi todas las páginas (a 1366 y 1666 px hay 5 columnas: 12 = 2 filas y 2 tarjetas sueltas).
- El límite es un múltiplo de las columnas reales, con al menos 12 tarjetas y sin pasar de 200 (tope del backend): `limitePorColumnas` en `features/catalogo/utils/limitePagina.js`. El objetivo es 12 con 1 o 2 columnas (cada fila es casi una pantalla) y 16 desde 3: 3 → 15, 4 → 16, 5 → 15, 6 → 18.
- Las columnas se leen de la grilla (`getComputedStyle(...).gridTemplateColumns`, hook `useColumnasGrilla`), no se estiman por el ancho de la pantalla, porque dependen también del texto al 150 % y del resumen mayorista. Se mide al montar, antes de pintar: el catálogo no pide nada hasta saber el límite, así que no hay un primer pedido de 12 seguido de otro. La grilla queda montada aunque esté vacía (cargando, error o sin resultados, con el aviso debajo) para poder medirla.
- Al cambiar las columnas (ResizeObserver con 200 ms de espera, solo si la cantidad cambió) se fija el límite nuevo y la página que contiene la primera tarjeta que se veía antes del cambio. Esa tarjeta se recuerda al hacer scroll, porque al medir ya se reacomodó la grilla. Página y límite cambian juntos: un solo pedido.
- `useCatalogoPaginado` sigue mostrando la página anterior mientras llega la nueva si solo cambió el límite: sin indicador de carga ni parpadeo. La caché ya incluía el límite en la clave, así que no se mezclan páginas de tamaños distintos.

### Última página completa (agregado el 30/10)
- Si la última página trae menos productos que el límite y el filtro tiene más productos que el límite, se muestran los últimos `límite` productos del filtro: los que faltan salen del final de la página anterior y se repiten (`completarUltimaPagina` en `utils/paginacion.js`, en `useCatalogoPaginado`). Así la última página también tiene sus filas completas.
- La página anterior se toma de la caché (al llegar paso a paso ya está) o se pide; mientras llega se ve el indicador de carga, no una grilla incompleta que luego crece. Si ese pedido falla, la última página se muestra tal cual.
- Con un total menor o igual al límite (categorías chicas, búsquedas con pocos resultados) no hay nada que repetir: se muestran tal cual, con la fila incompleta.
- Al cambiar el límite en la última página, la posición de la primera tarjeta visible se calcula desde el total (`indicePrimero`), no desde `(página − 1) × límite`.

## Alternativas consideradas
- **12.25 rem (196 px) para 4 columnas a 1024 px**: queda en el límite (a 1024 px entran 4 solo con 196 px o menos, y a 430 px entran 2 con menos de 193 px). Una barra de desplazamiento o un cambio de padding movería las columnas.
- **Mantener breakpoints y solo cambiar los números**: el texto al 150 % y la columna del resumen mayorista seguirían necesitando reglas propias.
- **Limitar el ancho máximo de la grilla en una columna**: deja franjas a los costados en teléfonos de 430 px; con el tope de la foto alcanza.

- **Rellenar la última fila con tarjetas vacías**: ocupa espacio sin contenido. Se eligió repetir productos reales (ver abajo).
- **Estimar las columnas por el ancho de la ventana**: repetiría en JS el cálculo del CSS y fallaría con el texto al 150 % y el resumen mayorista.
- **Pedir siempre 60 (múltiplo de 1 a 6) y cortar en el cliente**: páginas mucho más pesadas en el kiosco.

## Consecuencias
- Pantallas anchas (1366 px) pasan de 3 tarjetas de 379 px a 5 de 218 px.
- Si cambia el contenido de la tarjeta (por ejemplo, un precio más largo), basta con ajustar `--spacing-terra-tarjeta-min`; el tamaño de página se adapta solo.
- En la última página se repiten hasta `límite − 1` productos de la anterior; quien recorre todas las páginas los ve dos veces. Saltar directo a la última cuesta un pedido más.
- El número de página cambia al rotar o redimensionar (la página 3 de 15 pasa a ser la 4 de 12). Un enlace con `?pagina=` apunta a otros productos según el ancho de quien lo abre.
- En mayorista el resumen del pedido ya se ve mientras cargan los productos (antes aparecía junto con la grilla).
- En teléfono los flotantes y la barra inferior siguen pasando sobre las tarjetas mientras se hace scroll; el botón de la última tarjeta siempre queda libre en algún punto del scroll (el pie reserva su alto al final).

Relacionado: [[00-roadmap]] · [[2026-10-28-migracion-tailwind]] · [[2026-10-28-flotantes-y-catalogo-movil]]
