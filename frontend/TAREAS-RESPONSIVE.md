# Lista de tareas — Responsive en todos los módulos

Objetivo: que cliente y backoffice se vean bien en celular (≥320px), tablet (768px) y PC (≥1024px).
Breakpoints base unificados: **1024 / 768 / 520** (todo lo nuevo se agrega ahí, en `src/Responsive.css`).

Verificación final de cada fase: `npm run build` y `npm run lint` (desde `frontend/`).

---

## Fase 0 — Base y bugs globales ✅ COMPLETADA (build + lint OK)

- [x] **0.1 Corregir conflicto en `src/index.css`.** Eliminado el bloque `@media (max-width: 750px)` que hacía `.site-header{flex-direction:column}` (el encabezado cliente se apilaba en 3 filas entre 521–750px). También se eliminaron los bloques muertos de 1000px y las reglas de `.product-grid`, `.feature-grid`, `.cart-row`, `.section-heading`, `.cart-description`, `.actions` (clases sin uso en ningún JSX).
- [x] **0.2 Paleta verde heredada en `index.css` → rojo `#a6192e`.** `.brand`, `.site-header nav a.active` (`#ffe4e6`/`#a6192e`), `.cart-link b`, `.btn-primary`, `.summary strong`, `.success-icon`, `.code-card` (borde `#e4b6bd`) y grises verdosos `.muted`/`.empty-state`/`.site-footer` → `#707974`. Reglas muertas con verde (`.hero-card`, `.btn-outline`, `.category-chip`, `.notice`, `.price`) quedaron intactas por no renderizarse.
- [x] **0.3 Selectores muertos en `Responsive.css`:** quitados `.catalogo-hero`, `.category-hero`, `.catalogo-toolbar`(+button), `.catalogo-grid` (×2) y `.catalogo-filters`; se conservan `.welcome-hero`, `.products-*`, `.clients-*`, `.orders-*` (vivos). Regla muerta `.terra-sucursal-tag` y `.desktop-nav{display:none}` (nunca ganaba a Responsive) eliminadas de `Layout.css`.
- [x] **0.4 Breakpoints unificados en 1024/768/520.** Mapeo aplicado (redondeo al estándar más cercano): 1100/1050/1000→1024; 900→1024; 850/800/700/680/650→768; 640/600/550/500/480→520. **Excepción justificada:** el bloque `700px` de `Admin.css` → **520** (contiene `.admin-shell aside img{display:none}`, que oculta el logo de la marca: pasar a 768 lo ocultaría en todo el drawer). La regla redundante `@media 700` de `AdminContentFix.css` se eliminó (duplicaba la base del mismo archivo). `AdminSidebar.css` ya usaba 1024/768 (+`min-width:769px`, coherente).
- [x] **0.5 Archivos muertos eliminados:** `src/App.css` (no importado), `components/layout/{Navbar,Header,Footer}.jsx` y `pages/NoEncontrado.jsx` (0 bytes, `NoEncontrado` vive definido en `AppRoutes.jsx`); carpeta `components/layout/` eliminada.
- [x] **0.6 Corrección derivada:** `Layout.css` móvil (antes 640) pasó a 520 → la barra inferior cliente ahora coincide con el ocultamiento del nav (≤520 = solo barra inferior; 521–768 = nav compacto scrollable; >768 = header completo). Se eliminaron del bloque móvil las reglas muertas de header/padding (las gana `Responsive.css` con `!important`); el clearance inferior lo aporta `.site-footer{padding-bottom:5rem}` (siempre presente y después del `main`).

## Fase 1 — Módulos de cliente

- [ ] **1.1 `/catálogo` — doble encabezado (bug visual).** La ruta vive dentro de `Layout` (que dibuja `site-header terra-header`) y `Catalogo.jsx` además dibuja su propio `<header className="fixed top-0 … h-20 …">` (línea 185). Se superponen. Decidir si el catálogo usa el header de Layout o el propio, y ajustar `padding-top` del `main`.
- [ ] **1.2 Header propio del catálogo en móvil**: logo + nav de 3 botones + carrito + inicio + avatar sin clases responsivas → desborda en 360px. Ocultar nav en ≤520px o convertirlo en menú.
- [ ] **1.3 Filtros/orden del catálogo**: verificar el toolbar (`flex-col md:flex-row`) y que los `<select>` no desborden a 320px. El grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) ya está ok.
- [ ] **1.4 `Categorias.css`**: `.categorias-pills` usa `flex` + `white-space: nowrap` → desborde horizontal garantizado en pantallas chicas. Añadir `overflow-x: auto` con scroll o `flex-wrap` en ≤600px.
- [ ] **1.5 `Bienvenida.css`**: `.welcome-hero` (7fr 5fr, min-height 490px) ya tiene 900/600. Verificar CTA e imagen a 320–360px.
- [ ] **1.6 `CarritoPage.css`**: revisar fila de artículo (img + info + cantidad + precio) a 360px; **botones de cantidad de 2rem < 44px** → subir a ≥2.75rem en móvil.
- [ ] **1.7 `DetalleProducto.css`**: galería 1fr 1fr ya colapsa (800/520). Verificar miniaturas y acciones sticky a 320px.
- [ ] **1.8 `Identificacion.css`**: teclado en pantalla (850/520). Verificar que las teclas midan ≥44px y que en landscape no tape el formulario.
- [ ] **1.9 `Confirmacion.css` y `PedidoGenerado.css`**: resumen/totales a 360px (grid 7fr/5fr ya colapsa). Estilos de impresión del pedido: comprobar siguen ok.
- [ ] **1.10 Header cliente (`Layout.css` + `Responsive.css`)**: probar a 320px que logo + carrito + botón inicio quepan sin scroll (nav ya se oculta <520px) y que la barra inferior móvil no tape contenido.

## Fase 2 — Módulos de backoffice

- [ ] **2.1 Dashboard (`Admin.css`)**: `.dash-kpis` 4 col → 2 col en 520; **añadir 1 col en ≤400px**. Barras de ingresos con altura fija: verificar que no recorte etiquetas.
- [ ] **2.2 Pedidos (`Admin.css`)**: `.orders-list > article` tiene **6 columnas** y sólo colapsa a `1fr 1fr` en ≤520. Añadir regla intermedia en 768 (2 col o scroll) y 1 col en ≤400.
- [ ] **2.3 Productos (`ProductosAdmin.css`)**: tabla `min-width: 900px` + `.products-scroll{overflow:auto}` ok; añadir scroll táctil (`-webkit-overflow-scrolling: touch`) y confirmar toolbar/filtros ≤600 (reglas ya existen).
- [ ] **2.4 Clientes (`ClientesAdmin.css`)**: `.clients-kpis` 3 col → 2 col en 520; **añadir 1 col en ≤400**. Tabla `min-width: 850px` con scroll ok.
- [ ] **2.5 Tablas (`dash-table`, `products-scroll`, `clients-scroll`)**: añadir indicador visual de scroll horizontal (flecha o sombra) para que en móvil se note que hay más columnas.
- [ ] **2.6 Login admin**: `LoginAdminTheme.css` no tiene `@media` (el 520 de `.terra-login` está en `Admin.css`). Probar a 320px (logo 85px, inputs y botón a ancho completo).
- [ ] **2.7 Sidebar/drawer (`AdminSidebar.css`, `AdminSidebarFix.css`)**: probar el toggle en exactamente 768px y en tablets 768–1024 (drawer ≤768, sidebar fija >768); overlay, cierre y `overflow-y` de los menús.
- [ ] **2.8 Modales (`products-modal`, `orders-modal`)**: `max-height: calc(100dvh - 1rem)` ya está; verificar ancho, botones de acción y scroll de contenido a 360px.
- [ ] **2.9 Header admin (`AdminHeader.css`)**: buscar/admin/notificaciones a 768 y a 360px; que los menús desplegables no se salgan de la pantalla.

## Fase 3 — Calidad transversal

- [ ] **3.1 Objetivos táctiles ≥44px** en toda la app (enlaces del nav, chips, botones de icono).
- [ ] **3.2 Auditoría de scroll horizontal a 320px** en todas las rutas (que `body{overflow-x:hidden}` no esté enmascarando desbordes).
- [ ] **3.3 Landscape de celular/tablet**: encabezados fijos + `100dvh` (modales ya usan `dvh`) + teclado virtual.
- [ ] **3.4 Imágenes**: `img{max-width:100%}` global existe; verificar `aspect-ratio` en grids y `object-fit` en logos.
- [ ] **3.5 Prueba en dispositivos reales o DevTools**: 320/360/390 (celular), 768/834 (tablet), 1024/1280/1440 (PC).
- [ ] **3.6 Opcional**: `prefers-reduced-motion` para animaciones.
- [ ] **3.7 Cierre**: `npm run build` + `npm run lint` sin errores y revisión visual de cada ruta.
