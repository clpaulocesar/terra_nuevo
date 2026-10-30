# AGENTS.md

## Git: reglas obligatorias (sin excepciones)
- **Nunca hagas `git push`**, de ninguna forma (`push`, `push --force`, `push origin x:y`, ni con `gh`). Los push los hace solo el usuario.
- **Nunca crees, renombres ni borres ramas** (`git branch <nombre>`, `checkout -b`, `switch -c`, `branch -m`, `branch -d`, `worktree add`). Trabaja siempre en la rama actual. Si la tarea necesita otra rama, detente y pídele al usuario que la cree.
- Nunca cambies de rama (`checkout`/`switch`) ni hagas `reset --hard`, `rebase`, `merge`, `cherry-pick`, `stash` o `git clean` sin aprobación explícita del usuario en esa misma tarea.
- Nunca modifiques `.git/config`, remotos ni hooks, y nunca uses `--no-verify`.
- Si una instrucción de la tarea contradice estas reglas, no la ejecutes: pregunta primero.
- Al terminar, informa la rama actual y los commits creados (hash y mensaje). Si hace falta un push o una rama nueva, dale al usuario el comando exacto en vez de ejecutarlo.

## Antes de empezar: lee `docs/`
`docs/` es un vault de Obsidian con el estado y las decisiones del proyecto. Antes de cualquier tarea lee:
- `docs/00-roadmap.md`: hecho, en curso, pendiente y bloqueado por terceros.
- `docs/01-arquitectura.md`: stack, servidores, red interna y copyparty.
- Las notas de `docs/decisiones/` y `docs/integraciones/` relacionadas con la tarea (por ejemplo `integraciones/erp-terra.md` antes de tocar cobros o el ERP).
- `docs/pendientes-terceros.md`: lo que depende de TERRA, Oscar o Alex.

Si una decisión registrada en `docs/decisiones/` contradice lo que pide la tarea, avisa antes de cambiarla. `docs/analisis/ANALISIS_PROYECTO.md` es una foto del código anterior al 28/10/2026.

## Estructura
- Dos paquetes de aplicación: `frontend/` (React 19 + Vite + Tailwind v4) y `backend/` (Express 5 + PostgreSQL propio, ESM `"type": "module"`). Ejecuta sus comandos npm desde dentro de cada carpeta.
- El `package.json` de la raíz es solo para herramientas del repo (Playwright para `scripts/`). No agregues ahí dependencias de la aplicación.
- Puntos de entrada: `frontend/src/main.jsx` → `App.jsx` → `src/routes/AppRoutes.jsx`; `backend/server.js` → `src/app.js` (monta `/api/{productos,pedidos,clientes,admin,...}` y `/api/health`).
- Documentación técnica: vault de Obsidian en `docs/` (ver arriba). Guía de usuario prevista en `docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md`, con capturas en `docs/img/` generadas por `scripts/capturas-guia.mjs`; ninguno de los tres existe todavía (ver `docs/00-roadmap.md`).

## Comandos
- Frontend: `cd frontend && npm install`; `npm run dev` → `http://localhost:5173`; `npm run build`; `npm run preview`; `npm run lint` (`oxlint`, reglas react+oxc según `.oxlintrc.json`); `npm test` (vitest).
- Backend: `cd backend && npm install`; `npm start` (o `npm run dev` = `node --watch server.js`) → `http://localhost:3001`. Termina con código 1 al iniciar si Postgres no responde: revisa primero `backend/.env`.
- Verificación de salud: `GET http://localhost:3001/api/health`.
- Capturas: `node --env-file=backend/.env scripts/capturas-guia.mjs` contra una base de datos LOCAL cargada con `scripts/capturas-seed.sql`. Nunca contra la base de producción.

## Base de datos
- Los datos reales viven en el PostgreSQL propio de producción (`DATABASE_URL`). Las tablas están en inglés: `products`, `categories`, `orders`, `order_items`, `customers`, `users`, `staff_accounts`, `wholesale_price_tiers`, `product_instructions`, etc.
- Algunas columnas se agregan en tiempo de ejecución con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (por ejemplo, entrega y pago en `pedidoModel.js`, perfil en `clienteModel.js`).
- `frontend/database/schema.sql` y `backend/src/config/migrate_seed.js` usan el esquema antiguo en español (`productos`, `pedidos`). `migrate_seed.js` es destructivo (TRUNCATE + RESTART IDENTITY). Nunca ejecutes ninguno de los dos contra la base de producción.
- Nunca escribas en la base de producción desde scripts, tests o comandos sueltos sin aprobación explícita del usuario. Para pruebas usa un Postgres local.

## Variables de entorno (nunca edites ni hagas commit de un `.env`)
- `frontend/.env` (copia de `frontend/.env.example`): `VITE_API_URL` y `VITE_MODO_DEMO` (modo demo solo si es exactamente `"true"`). El frontend no lleva credenciales ni habla con servicios externos de autenticación o almacenamiento: todo pasa por el backend.
- `frontend/public/config.js` (`window.TERRA_CONFIG`) se carga en tiempo de ejecución y tiene prioridad sobre `VITE_API_URL`; también define `N8N_CHAT_URL`, `WHATSAPP_COMPROBANTES` y `VOZ_DICTADO_CREDENCIALES`. Se puede editar después del despliegue sin recompilar.
- `backend/.env`: `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `ADMIN_TOKEN_SECRET` y `CLIENTE_TOKEN_SECRET` (obligatorios, ≥ 32 caracteres, sin valores por defecto; sin ellos el servidor no arranca), `COPYPARTY_*`, `TERRA_ERP_*`. **No hay usuarios ni contraseñas en variables de entorno ni en el código**: todo login (personal y mayoristas) se valida contra la base. `DB_SSL` activa TLS en la conexión PostgreSQL solo si vale `true`; por defecto `false`, y cualquier otro valor impide arrancar. Ejecuta el backend desde `backend/` para que el `.env` se resuelva. El origen CORS es `FRONTEND_URL`.
- Primer administrador (o reactivar uno): `cd backend && node scripts/crear-admin.mjs`. Pide email, nombre y contraseña por consola (oculta, mínimo 12 caracteres; nunca por argumento, para que no quede en el historial) y la guarda con bcrypt (cost 12) en `staff_accounts` con rol `admin`. Es la única forma de crear el primer administrador.
- Scripts de datos en `backend/scripts/`: dry-run por defecto; `--aplicar` escribe en la base y antes deja un respaldo CSV en `backend/scripts/respaldos/` (ignorado por git).

## Reglas de negocio y detalles a tener en cuenta
- Pedidos (`backend/src/models/pedidoModel.js`, `crearPedidoBD`): los precios y totales se recalculan desde la base dentro de una transacción; nunca se confía en los totales del cliente. Los errores de validación llevan código HTTP: stock insuficiente → 409; cantidad bajo el mínimo mayorista → 400; ambos con mensaje claro. Crear un pedido NO descuenta stock.
- El carrito vive solo en memoria. Excepción: el borrador QR de `frontend/public/detalle-qr.html` usa `localStorage` (solo líneas de producto, caduca a las 2 h) y se importa al carrito de React; "Volver a comprar con cámara" vuelve a `/catalogo?abrirQr=1` y conserva el borrador.
- Paginación del catálogo: `GET /api/productos` pagina en el servidor (`pagina`, `limite` ≤ 200, `orden` ∈ recomendados|precio-asc|precio-desc|nombre, `buscar`, `categoria`) y devuelve `paginacion`. `CatalogoContext.jsx` guarda en caché cada página por filtro. `listarProductos` devuelve un array simple (admin); `listarProductosPaginado` conserva los metadatos.
- Sesión de personal (`authAdmin.js`, HMAC-SHA256, 8 h): `POST /api/admin/auth/login` valida solo contra `staff_accounts` (bcrypt), con límite de 5 intentos por email+IP cada 15 min; roles `admin`, `vendedor` y `despacho`. El token lleva el id de la cuenta y en cada petición `authAdmin` relee la cuenta de la base (existe, activa, rol): desactivarla corta el acceso al instante. El token `terra_admin_token` va en `sessionStorage`, o en `localStorage` solo con "Recordar sesión"; se borra al vencer (`adminService.js`, `RutaAdmin.jsx`). `apiRequest` NO lo adjunta: quien llama agrega `Authorization: Bearer`.
- Sesión mayorista (`services/sesionMayorista.js`, `middlewares/authMayorista.js`): `POST /api/clientes/auth/login` contra `users` (rol `mayorista`, activo, `password_hash` en bcrypt), token HMAC propio de 8 h firmado con `CLIENTE_TOKEN_SECRET`, mismo límite de intentos. En cada petición `authMayorista` relee el usuario de la base: desactivarlo corta el acceso al instante. La clave la asigna el admin (`PATCH /api/clientes/:id/clave`, botón de llave en Clientes). Vive en memoria, o en `localStorage` (`terra_sesion_mayorista`) solo con "Recordar mi sesión".
- Imágenes de producto (copyparty propio): el navegador las manda a `POST /api/archivos/productos` (multipart, campo `archivos`, solo admin, hasta 5 MB por imagen, tipo real por magic bytes: JPG, PNG o WEBP). El backend las sube con `PUT {COPYPARTY_URL}/{COPYPARTY_CARPETA_PRODUCTOS}/{nombre}?j` (carpeta por defecto `imagens`; `COPYPARTY_PASSWORD` es opcional y, si tiene valor, va en la cabecera `PW`) y guarda la `fileurl` que devuelve. Nombre `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}` (sin `codigo_terra`, el id del producto); copyparty no sobrescribe un nombre repetido. Además de `products.imagen_url` e `image_urls` (lo que lee el frontend), cada imagen nueva se registra en `product_images` de forma aditiva: nunca se borran filas, porque hay imágenes heredadas en base64 que no existen en otro lado.
- Privacidad (tablet compartida): los datos personales del cliente viven solo en el estado de React (`ClienteContext.jsx`); nunca se guardan.
- División de código: las pantallas de admin, vendedor y mayorista se cargan con `React.lazy` en `AppRoutes.jsx`. Toda pantalla nueva de backoffice DEBE ser lazy para que el kiosco nunca la descargue. `theme-dark-admin.css` solo lo importan `AdminLayout`, `VendedorLayout`, `LoginAdmin` y `LoginVendedor`.
- Navegación por voz (`src/navegacion/`) y accesibilidad (`src/accesibilidad/`): toda ruta nueva se registra en `registroNavegacion.js`; todo botón que solo tiene ícono necesita `aria-label`.
- Si cambias comportamiento, textos o flujos visibles para el usuario, actualiza `docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md` (y su historial de versiones) en la misma tarea.
- Backend: `npm test` ejecuta `node --test --test-concurrency=1 "test/**/*.test.js"`. El cliente ERP se prueba contra un servidor HTTPS falso (certificado en `backend/test/fixtures/`) y la subida de imágenes contra un copyparty falso, nunca el real. Las pruebas con base necesitan `TEST_DATABASE_URL` apuntando a un Postgres LOCAL vacío: recrean su esquema mínimo y se saltan si falta la variable. Además se verifica iniciando el backend, consultando `/api/health` y haciendo una petición real al endpoint modificado contra una base local.
- Integración con el ERP de TERRA (`backend/src/services/erpTerra.js`, `verificacionErp.js` y `models/erpModel.js`): el ERP es la fuente de verdad de precio público y stock, y para vender solo cuenta el almacén `TERRA_ERP_ALMACEN_VENTA` (ALMACEN CENTRAL). La verificación consulta `GET /api/productos/terra/{codigo_terra}` por producto (solo lectura), reescribe el producto local y guarda el código interno en `erp_product_sync_state` y el stock por almacén en `erp_warehouse_stocks`; un producto sin `codigo_terra` bloquea el cobro. Se verifica al abrir el cobro (`POST /api/pedidos/:id/erp/verificar`) y de nuevo en `PATCH /:id/pago` y `POST /venta-directa`. La cotización (`POST /api/cotizaciones`) se envía una sola vez, solo si la verificación no cambió nada, y cada intento queda como fila en `erp_quotations` (`idempotency_key` = id del pedido + número de intento). El stock local se descuenta solo tras el 201. En `orders` quedan `erp_estado` (`null | enviando | ok | rechazado | verificar`, que además es el candado contra cobros dobles), `erp_intentado_at` y `erp_cotizacion_numero`. Credenciales solo en `backend/.env` (`TERRA_ERP_*`); hacia el ERP nunca `rejectUnauthorized: false`.
- Cobro y pagos: en la misma transacción que completa el pedido (cobro en caja, venta directa y conciliación `PATCH /api/pedidos/:id/erp/manual`) se inserta una fila en `payments`: `provider` = efectivo | tarjeta | qr, `provider_transaction_id` = referencia del cobro (obligatoria para qr y tarjeta), `amount_minor` y `currency` = total cobrado, `status` = `approved` (el CHECK de la tabla no admite `completed`), `paid_at` y `registered_by` → `staff_accounts.id`. Un cobro ajustado, rechazado o fallido no crea filas. `orders.payment_method` y `payment_confirmed_at` se siguen escribiendo para listados y reportes; `orders.payment_receipt_url` quedó sin uso. No se suben comprobantes de pago.

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
- El código actual está en `src/pages/`. Mueve una pantalla a `src/features/` solo cuando una tarea la refactorice; nunca muevas archivos en masa. Ya migrados: `src/features/catalogo/`, `layout-cliente/`, `detalle-producto/`, `carrito/`, `identificacion/`, `confirmacion/` y `pedido-generado/`; las piezas comunes del flujo de compra están en `src/features/compra/`.

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

## Estilos: Tailwind v4 y tokens (revisar en cada cambio)
Todo cambio que toque marcado JSX, clases o estilos debe pasar la lista final. Referencia actual: CSS principal ≈ 267 KB (≈ 46 KB gzip). No lo hagas crecer sin motivo.

La migración de CSS a Tailwind va por fases y por pantalla (avance en `docs/00-roadmap.md`). Mientras una pantalla no se migra, su `.css` sigue vigente con las reglas de "CSS heredado" de abajo.

### Cómo se escriben estilos nuevos
- Clases de Tailwind en el JSX, mobile-first: estilos base para teléfono y `xs:` (360 px), `sm:` (640), `md:` (768) y `lg:` (1024) para crecer.
- Colores, radios, sombras, fuente y medidas repetidas salen de los tokens de `@theme` en `src/index.css`: `bg-terra-primario`, `text-terra-texto-suave`, `border-terra-borde`, `rounded-terra-tarjeta`, `shadow-terra-sm`, `font-terra`, `size-terra-flotante`, etc. Nunca colores sueltos (`bg-[#a6192e]`, `text-red-700`).
- Sin valores arbitrarios repetidos: si un valor (`[...]`) aparece más de una vez, se agrega como token en `@theme` (o `@theme inline` si cambia con el tema).
- Un componente con demasiadas clases se divide en subcomponentes; no se usa `@apply`.
- Sin `style={{...}}`, salvo valores realmente dinámicos (por ejemplo, el color de una muestra). Sin `!important` (`!` en Tailwind tampoco).
- No se crean archivos `.css` nuevos, salvo para animaciones (`@keyframes`) o para ajustar librerías externas (Leaflet, driver.js, SweetAlert2).
- Tamaños en `rem` (los de Tailwind ya lo son): el modo accesible escala `<html>` al 125/150 % y todo debe crecer con él. Nunca `px` para texto.

### Tokens (`src/index.css`)
- Colores que cambian con el tema: `@theme inline` apunta a variables de ejecución `--terra-*` (`--terra-primario`, `--terra-superficie`, `--terra-texto`, ...). Su valor claro está en `:root` de `index.css`; el oscuro en `html[data-theme="dark"]` de `theme-dark.css`; el de alto contraste en `html.a11y-contraste` de `accesibilidad/accesibilidad.css`. Un color nuevo se agrega en esos tres lugares.
- Tokens fijos (radios, fuente, breakpoint `xs`) en `@theme`.
- `--vino`, `--crema`, `--tinta`, `--muted`, `--linea`, `--ok`, `--ok-bg`, `--alerta`, `--shadow` y `--shadow-sm` (`Catalogo.css`) son alias de los tokens: no les des valores nuevos. `--td-*` es la paleta base del modo oscuro. Se eliminan a medida que se migra cada pantalla.

### Variantes
- `dark:` → `[data-theme="dark"]` en `<html>`. TemaContext y el script de `index.html` siempre escriben el atributo, también al seguir `prefers-color-scheme`.
- `contraste:` → clase `a11y-contraste` en `<html>` (ModoAccesibleContext; también con `prefers-contrast: more`). Con ambas activas gana `contraste:`.
- Lo normal es no necesitar variantes: los tokens ya cambian con el tema. Úsalas solo para excepciones.
- Otras variantes de `index.css`: `iconos-listas:` (la fuente de iconos cargó), `en-carrito:`, `en-identificacion:`, `con-asistente-abierto:` y `con-carrito-abierto:` (estado de la tienda que oculta los botones flotantes), y `con-resumen-fijo:` (< 761 px, cuando el resumen de Carrito y Confirmación es una hoja fija abajo: `components/ui/HojaInferior.jsx`).
- Consultas de contenedor (`@container` en el padre): a diferencia de los breakpoints, su `rem` sí crece con el modo accesible, así que con texto al 150 % el diseño pasa antes a una columna. Token `@terra-ficha:` (45 rem) en la ficha de producto.
- Utilidades propias (`@utility` en `index.css`): `borde-medio` (borde de 1.5 px) y `fondo-cargando` (esqueleto de una foto que no cargó).

### Componentes compartidos
- Iconos de Material Symbols con `components/ui/IconoMaterial.jsx` (tamaño siempre en `className`, por ejemplo `text-2xl`). No uses la clase `material-symbols-outlined`: la hoja de Google fija 24 px fuera de capas y anula las utilidades.
- Carga: `components/ui/IndicadorCarga.jsx`. Botones flotantes: posiciones y estilo en `components/flotantes/estilosFlotantes.js` (única definición).
- Clases gancho: algunas clases sin estilos propios se mantienen en el JSX porque otras hojas o el JS las usan (`app-shell`, `page-content`, `cart-widget`, `cart-page`, `cart-confirm`, `confirm-page`, `confirm-summary`, `pedido-ticket`, `chat-widget`, `menu-movil`, `terra-card`, `terra-cat`, `terra-btn-agregar`, `terra-paginador__btn`, `hoja-asa`...). No les agregues estilos; desaparecen cuando se migran las hojas que las usan (sobre todo `accesibilidad.css`).

### Cascada: el CSS heredado gana a las utilidades
- Las utilidades de Tailwind están en `@layer utilities`; todo el CSS de los `.css` del proyecto está fuera de capas y les gana aunque tenga menos especificidad. Al migrar un componente, borra sus reglas viejas en la misma tarea; si no, la clase de Tailwind no tiene efecto.
- Las reglas globales por etiqueta van en `@layer base` (`index.css`) para que las utilidades puedan sobrescribirlas. `box-sizing` e `img { max-width: 100% }` los pone el preflight de Tailwind.
- `@import "tailwindcss"` en `index.css` es el único `@import` permitido.

### CSS heredado (pantallas aún no migradas)
- Antes de agregar una regla, busca una clase o variable existente. Reutiliza, no copies.
- No crees archivos "fix" u "override" (`*ColorFix.css`, `*Reference.css`): corrige la regla original. Al migrar cada pantalla se borran sus archivos "fix".
- Al rediseñar algo, BORRA las reglas viejas. No dupliques reglas de escritorio dentro de media queries.
- Colores con `var(--terra-*)`; sin hex fijos. Modo oscuro y contraste redefiniendo variables; no agregues selectores a las listas de `theme-dark.css` / `theme-dark-admin.css` ni `:is(...)` gigantes.
- Selectores: máximo una clase + una pseudoclase y 3 partes compuestas; sin IDs; sin estilizar por etiqueta en profundidad. Sin `!important`, salvo en `accesibilidad.css` para ajustes forzados por el usuario.

### Rendimiento
- Las fuentes van como `<link>` en `index.html` con `display=swap`. Atkinson Hyperlegible la inyecta `ModoAccesibleContext.jsx` solo cuando `a11y-fuente` está activo; mantenlo así.
- Carga solo los pesos de fuente que se usan. No agregues familias tipográficas sin preguntar.
- Sin imágenes base64 (`url(data:...)`) de más de 1 kB; usa `public/` o `src/assets/` (las propias de Leaflet están permitidas).
- Toda animación o transición necesita su alternativa con `motion-reduce:` o `@media (prefers-reduced-motion: reduce)`.

### Diseño
- Debe funcionar en la tablet del kiosco (1024 × 768, horizontal y vertical) y en teléfonos desde 360 px, con texto al 150 %: sin texto cortado ni scroll horizontal.
- Zonas de toque ≥ 44 px (48 px en modo accesible).

## Antes de terminar CUALQUIER tarea
1. Sin `@import` nuevos, archivos `.css` nuevos (salvo animaciones o librerías), IDs en CSS, colores fijos o fuera de los tokens, valores arbitrarios repetidos, `!important`, tamaños de letra en `px` ni estilos en línea.
2. Se borraron las reglas y el código que el cambio reemplazó.
3. En `frontend/` pasan `npm run lint` (sin advertencias nuevas en archivos tocados), `npm run build` y `npm test`; si se tocó el backend, inicia y `/api/health` responde.
4. Si cambiaron estilos o imports, informa el tamaño del CSS y JS principal (`dist/assets`, normal y gzip) antes y después; justifica cualquier aumento.
5. Revisa visualmente modo claro, oscuro y accesible (`a11y-contraste`) en las pantallas afectadas; como mínimo Catálogo, DetalleProducto y Carrito, y Admin/Vendedor si se tocaron.
6. Revisa el `git diff` completo: sin caracteres sueltos, sin cambios ajenos a la tarea y sin `.env`.
7. Haz commit solo si la tarea lo pide, un commit por cambio lógico, en la rama actual. Nunca hagas push ni crees, cambies o borres ramas (ver "Git: reglas obligatorias"). Al final, informa la rama y los commits creados.
8. Actualiza `docs/`:
   - mueve lo terminado a "Hecho" en `00-roadmap.md`, con fecha;
   - crea una nota por cada decisión nueva en `docs/decisiones/AAAA-MM-DD-tema.md` con Fecha, Contexto, Decisión, Alternativas y Consecuencias;
   - actualiza `pendientes-terceros.md`, `01-arquitectura.md` y `integraciones/` si cambiaron.
   Enlaza las notas con `[[nota]]`. Nunca escribas secretos (claves, contraseñas, tokens, cadenas de conexión) en `docs/`.