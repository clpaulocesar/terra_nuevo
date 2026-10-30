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

## Alternativas consideradas
- **12.25 rem (196 px) para 4 columnas a 1024 px**: queda en el límite (a 1024 px entran 4 solo con 196 px o menos, y a 430 px entran 2 con menos de 193 px). Una barra de desplazamiento o un cambio de padding movería las columnas.
- **Mantener breakpoints y solo cambiar los números**: el texto al 150 % y la columna del resumen mayorista seguirían necesitando reglas propias.
- **Limitar el ancho máximo de la grilla en una columna**: deja franjas a los costados en teléfonos de 430 px; con el tope de la foto alcanza.

## Consecuencias
- Pantallas anchas (1366 px) pasan de 3 tarjetas de 379 px a 5 de 218 px.
- Si cambia el contenido de la tarjeta (por ejemplo, un precio más largo), basta con ajustar `--spacing-terra-tarjeta-min`.
- En teléfono los flotantes y la barra inferior siguen pasando sobre las tarjetas mientras se hace scroll; el botón de la última tarjeta siempre queda libre en algún punto del scroll (el pie reserva su alto al final).

Relacionado: [[00-roadmap]] · [[2026-10-28-migracion-tailwind]] · [[2026-10-28-flotantes-y-catalogo-movil]]
