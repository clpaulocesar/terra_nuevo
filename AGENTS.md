# AGENTS.md

## Estructura
- Dos paquetes de aplicación: `frontend/` (React 19 + Vite + Tailwind v4) y `backend/` (Express 5 + PostgreSQL en Supabase, ESM `"type": "module"`). Ejecuta sus comandos npm desde dentro de cada carpeta.
- El `package.json` de la raíz es solo para herramientas del repo (Playwright para `scripts/`). No agregues ahí dependencias de la aplicación.
- Puntos de entrada: `frontend/src/main.jsx` → `App.jsx` → `src/routes/AppRoutes.jsx`; `backend/server.js` → `src/app.js` (monta `/api/{productos,pedidos,clientes,admin,...}` y `/api/health`).
- Documentación: guía de usuario en `docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md`, con capturas en `docs/img/` generadas por `scripts/capturas-guia.mjs` (ver su encabezado).

## Comandos
- Frontend: `cd frontend && npm install`; `npm run dev` → `http://localhost:5173`; `npm run build`; `npm run preview`; `npm run lint` (`oxlint`, reglas react+oxc según `.oxlintrc.json`); `npm test` (vitest).
- Backend: `cd backend && npm install`; `npm start` (o `npm run dev` = `node --watch server.js`) → `http://localhost:3001`. Termina con código 1 al iniciar si Postgres no responde: revisa primero `backend/.env`.
- Verificación de salud: `GET http://localhost:3001/api/health`.
- Capturas: `node --env-file=backend/.env scripts/capturas-guia.mjs` contra una base de datos LOCAL cargada con `scripts/capturas-seed.sql`. Nunca contra Supabase.

## Base de datos
- Los datos reales viven en Postgres de Supabase. Las tablas están en inglés: `products`, `categories`, `orders`, `order_items`, `customers`, `users`, `staff_accounts`, `wholesale_price_tiers`, `product_instructions`, etc.
- Algunas columnas se agregan en tiempo de ejecución con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (por ejemplo, entrega y pago en `pedidoModel.js`, perfil en `clienteModel.js`).
- `frontend/database/schema.sql` y `backend/src/config/migrate_seed.js` usan el esquema antiguo en español (`productos`, `pedidos`). `migrate_seed.js` es destructivo (TRUNCATE + RESTART IDENTITY). Nunca ejecutes ninguno de los dos contra Supabase.
- Nunca escribas en la base de Supabase desde scripts, tests o comandos sueltos sin aprobación explícita del usuario. Para pruebas usa un Postgres local.

## Variables de entorno (nunca edites ni hagas commit de un `.env`)
- `frontend/.env` (copia de `frontend/.env.example`): `VITE_API_URL`, `VITE_MODO_DEMO` (modo demo solo si es exactamente `"true"`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_STORAGE_BUCKET`.
- `frontend/public/config.js` (`window.TERRA_CONFIG`) se carga en tiempo de ejecución y tiene prioridad sobre `VITE_API_URL`; también define `N8N_CHAT_URL`, `WHATSAPP_COMPROBANTES` y `VOZ_DICTADO_CREDENCIALES`. Se puede editar después del despliegue sin recompilar.
- `backend/.env`: `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` (y la clave de servicio que usa `supabaseAuth.js`). `DB_SSL=true/false` (opcional) fuerza TLS en la conexión PostgreSQL; si se omite, se deduce del host. Ejecuta el backend desde `backend/` para que el `.env` se resuelva. El origen CORS es `FRONTEND_URL`.

## Reglas de negocio y detalles a tener en cuenta
- Pedidos (`backend/src/models/pedidoModel.js`, `crearPedidoBD`): los precios y totales se recalculan desde la base dentro de una transacción; nunca se confía en los totales del cliente. Los errores de validación llevan código HTTP: stock insuficiente → 409; cantidad bajo el mínimo mayorista → 400; ambos con mensaje claro. Crear un pedido NO descuenta stock.
- El carrito vive solo en memoria. Excepción: el borrador QR de `frontend/public/detalle-qr.html` usa `localStorage` (solo líneas de producto, caduca a las 2 h) y se importa al carrito de React; "Volver a comprar con cámara" vuelve a `/catalogo?abrirQr=1` y conserva el borrador.
- Paginación del catálogo: `GET /api/productos` pagina en el servidor (`pagina`, `limite` ≤ 200, `orden` ∈ recomendados|precio-asc|precio-desc|nombre, `buscar`, `categoria`) y devuelve `paginacion`. `CatalogoContext.jsx` guarda en caché cada página por filtro. `listarProductos` devuelve un array simple (admin); `listarProductosPaginado` conserva los metadatos.
- Sesión de personal (`authAdmin.js`, HMAC-SHA256, 8 h): `POST /api/admin/auth/login`, roles `admin`, `vendedor` y `despacho`. El token `terra_admin_token` va en `sessionStorage`, o en `localStorage` solo con "Recordar sesión"; se borra al vencer (`adminService.js`, `RutaAdmin.jsx`). `apiRequest` NO lo adjunta: quien llama agrega `Authorization: Bearer`.
- Sesión mayorista: token de Supabase Auth verificado en `services/sesionMayorista.js`. Vive en memoria, o en `localStorage` (`terra_sesion_mayorista`) solo con "Recordar mi sesión"; vence junto con el token de Supabase.
- Privacidad (tablet compartida): los datos personales del cliente viven solo en el estado de React (`ClienteContext.jsx`); nunca se guardan.
- División de código: las pantallas de admin, vendedor y mayorista se cargan con `React.lazy` en `AppRoutes.jsx`. Toda pantalla nueva de backoffice DEBE ser lazy para que el kiosco nunca la descargue. `theme-dark-admin.css` solo lo importan `AdminLayout`, `VendedorLayout`, `LoginAdmin` y `LoginVendedor`.
- Navegación por voz (`src/navegacion/`) y accesibilidad (`src/accesibilidad/`): toda ruta nueva se registra en `registroNavegacion.js`; todo botón que solo tiene ícono necesita `aria-label`.
- Si cambias comportamiento, textos o flujos visibles para el usuario, actualiza `docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md` (y su historial de versiones) en la misma tarea.
- El backend no tiene tests (`npm test` termina con 1 a propósito). Se verifica iniciando el backend, consultando `/api/health` y haciendo una petición real al endpoint modificado.

## Arquitectura de componentes
- Este proyecto es React + Vite, no Next.js: no uses Server Components, `'use client'` ni el router `app/`. Aplica solo los principios de componentes.

### Carpetas por funcionalidad
- Agrupa por funcionalidad, con todo lo de una pantalla junto:
  ```
  src/features/productos/
    ProductosPage.jsx        # compone; sin lógica de negocio
    components/
      ProductosTabla.jsx
      ProductoForm.jsx       # compartido entre crear y editar
      ProductoQrModal.jsx
    hooks/
      useProductos.js        # carga, filtros, orden, paginación
    utils/
      colores.js
  ```
- Las piezas compartidas y sin dominio van en `src/components/ui/` (Button, Modal, Input, Toast) y `src/hooks/`.
- El código actual está en `src/pages/`. Mueve una pantalla a `src/features/` solo cuando una tarea la refactorice; nunca muevas archivos en masa.

### Reglas de componentes
- Página (`*Page.jsx`): obtiene los datos con hooks y compone componentes.
- Componentes de funcionalidad: reciben datos y callbacks por props (`onGuardar`, `onCerrar`); solo manejan su estado de interfaz.
- Componentes UI: genéricos, no saben qué es un producto o un pedido.
- Una responsabilidad por componente. Si su nombre necesita una "y", divídelo.
- El estado vive lo más cerca posible de donde se usa; súbelo solo si dos componentes lo comparten. Evita pasar props por más de 2 niveles (usa un contexto de la funcionalidad o composición con `children`).
- Los modales son componentes propios con `abierto` y `onCerrar`; nunca van escritos dentro de la página.
- Si el elemento de un `.map` tiene más de ~10 líneas de JSX, pasa a ser su propio componente.
- Nunca dupliques formularios: crear y editar usan el mismo componente con `valoresIniciales` y `onSubmit`.
- Las llamadas HTTP van solo en `src/services/`; los componentes nunca llaman a `fetch` directamente.
- Las funciones puras (formateo, parsing, cálculos) van en `utils/` y tienen tests con vitest.

## Estilo de código (código nuevo o modificado)
- Archivos de componente de ~300 líneas como máximo; divide si crecen más.
- Una sentencia por línea. Nunca varios `useState` o funciones completas en una sola línea.
- JSX: un elemento por línea; props en líneas separadas cuando son más de 3. Máximo ~120 caracteres por línea.
- `const` por defecto, `let` solo si se reasigna, nunca `var`.
- Componentes: `export default function Nombre()`, un componente principal por archivo. Handlers: `const manejarX = () => {}`.
- Nombres en español, descriptivos y coherentes con el código existente (`cargarProductos`, `guardarEdicion`).
- Sin código muerto: nada de `{false && ...}`, funciones o imports sin usar, ni código comentado.
- Los comentarios explican el *por qué*, no el *qué*.
- No refactorices archivos que la tarea no requiere. Si un archivo que tocas incumple mucho estas reglas, indícalo en el resumen y propone el refactor como tarea aparte.

## Reglas de CSS (revisar en cada cambio)
Todo cambio que toque marcado JSX, clases o estilos debe pasar la lista final. Referencia actual: CSS principal ≈ 212 KB (≈ 37 KB gzip), 0 `@import`. No lo hagas crecer sin motivo.

### Dónde van los estilos
- Prioriza clases utilitarias de Tailwind en el JSX. Escribe CSS solo para lo que Tailwind no expresa bien (animaciones complejas, ajustes de librerías como Leaflet).
- Nada de `style={{...}}` en línea, salvo valores realmente dinámicos (por ejemplo, el color de una muestra).
- Antes de agregar una regla, busca una clase o variable existente (`grep -r "<propiedad>: <valor>" frontend/src`). Reutiliza, no copies.
- Un archivo CSS por componente o pantalla, importado por ese componente (no global), con una clase raíz (`.orders-list`, `.orders-list__item`, `.orders-list--empty`).
- No crees archivos "fix" u "override" (`*ColorFix.css`, `*Reference.css`): corrige la regla original.
- Al rediseñar algo, BORRA las reglas viejas. Nunca apiles un diseño nuevo encima del anterior (deuda actual: login admin, botón QR, modal de producto, hero de categorías).
- No dupliques reglas de escritorio dentro de media queries; sobrescribe solo lo que cambia.

### Tokens de diseño
- Colores, radios, sombras y tamaños de letra salen de variables CSS definidas una vez en `:root` y redefinidas en `html[data-theme="dark"]` y `html.a11y-contraste`.
- Sin colores hex fijos en CSS de componentes ni en JSX: usa `var(--...)`.
- El código nuevo usa variables `--terra-*`. No migres los prefijos antiguos (`--vino/--crema`, `--td-*`) dentro de una tarea no relacionada.

### Modo oscuro y alto contraste
- Ambos funcionan redefiniendo variables. Los componentes nuevos no deben necesitar `html[data-theme="dark"] .mi-componente {...}`.
- No agregues selectores a las listas de modo oscuro de `theme-dark.css` / `theme-dark-admin.css`; usa variables.
- No agregues selectores `:is(...)` gigantes sobre todas las etiquetas.

### Selectores
- Máximo una clase + una pseudoclase (`.card:hover`) y 3 partes compuestas. Sin IDs en CSS.
- Sin `!important`, salvo en `accesibilidad.css` para ajustes de accesibilidad forzados por el usuario.
- No estilices por etiqueta en profundidad (`.admin-content table td span`).

### Rendimiento
- Sin `@import` en CSS. Las fuentes van como `<link>` en `index.html` con `display=swap`. Atkinson Hyperlegible la inyecta `ModoAccesibleContext.jsx` solo cuando `a11y-fuente` está activo; mantenlo así.
- Carga solo los pesos de fuente que se usan. No agregues familias tipográficas sin preguntar.
- Sin imágenes base64 (`url(data:...)`) de más de 1 kB; usa `public/` o `src/assets/` (las propias de Leaflet están permitidas).
- Toda animación o transición necesita su alternativa en `@media (prefers-reduced-motion: reduce)`.

### Unidades y diseño
- Tamaños de letra en `rem` (el modo accesible escala `html` al 125/150 %). Nunca `px` para texto.
- Mobile-first con los breakpoints de Tailwind. Debe funcionar en la tablet de tienda de 768 px con texto al 150 %: sin texto cortado ni scroll horizontal.
- Zonas de toque ≥ 44 px (48 px en modo accesible).

## Antes de terminar CUALQUIER tarea
1. Sin `@import` nuevos, IDs en CSS, colores fijos, `!important`, tamaños de letra en `px` ni estilos en línea.
2. Se borraron las reglas y el código que el cambio reemplazó.
3. En `frontend/` pasan `npm run lint` (sin advertencias nuevas en archivos tocados), `npm run build` y `npm test`; si se tocó el backend, inicia y `/api/health` responde.
4. Si cambiaron estilos o imports, informa el tamaño del CSS y JS principal (`dist/assets`, normal y gzip) antes y después; justifica cualquier aumento.
5. Revisa visualmente modo claro, oscuro y accesible (`a11y-contraste`) en las pantallas afectadas; como mínimo Catálogo, DetalleProducto y Carrito, y Admin/Vendedor si se tocaron.
6. Revisa el `git diff` completo: sin caracteres sueltos, sin cambios ajenos a la tarea y sin `.env`.
7. Haz commit solo si la tarea lo pide, un commit por cambio lógico. Nunca hagas push.