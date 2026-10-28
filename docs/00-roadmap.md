---
actualizado: 2026-10-28
tags: [roadmap]
---

# Roadmap

Estado del proyecto TERRA Autoservicio. Se actualiza al cerrar cada tarea (ver `AGENTS.md`).
Contexto técnico: [[01-arquitectura]] · Decisiones: carpeta `decisiones/` · Terceros: [[pendientes-terceros]].

## Hecho

### 2026-10-28
- **Análisis técnico del repositorio**: [[ANALISIS_PROYECTO]] (foto previa a los cambios del día).
- **Integración con el ERP de TERRA**: verificación previa de cada ítem contra el ERP, cotización una sola vez al cobrar, descuento de stock local solo tras la cotización y conciliación manual de resultados dudosos. Detalle en [[erp-terra]]. Decisiones: [[2026-10-28-cotizacion-al-cobrar]], [[2026-10-28-stock-solo-almacen-central]], [[2026-10-28-ofertas-locales]].
- **Integración ERP sobre las tablas existentes**: `erp_quotations` (un intento por fila), `erp_product_sync_state` (código interno y última sincronización) y `erp_warehouse_stocks` (stock por almacén). En `orders` quedan solo `erp_estado`, `erp_intentado_at` y `erp_cotizacion_numero`.
- **Pagos en `payments`**: cada cobro registra una fila en la misma transacción que completa el pedido; no se suben comprobantes. Decisión: [[2026-10-28-pagos-sin-comprobantes]].
- **Login solo desde la base**: personal contra `staff_accounts` y mayoristas contra `users`, con bcrypt, tokens HMAC que llevan el id, relectura de la cuenta en cada petición y límite de intentos. Script `crear-admin.mjs` para el primer administrador. Decisión: [[2026-10-28-login-solo-bd]].
- **Supabase eliminado**: sin Auth, Storage ni claves; se dejó de redefinir `auth.uid()` desde el código. Decisión: [[2026-10-28-sin-supabase]].
- **Imágenes de producto en copyparty**: subida por el backend (`POST /api/archivos/productos`), nombre provisional `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}`, registro aditivo en `product_images`. Decisión: [[2026-10-28-imagenes-en-copyparty]]. Nomenclatura: [[imagenes-nomenclatura]].
- **Datos corregidos en producción** (con respaldo CSV en `backend/scripts/respaldos/`):
  - 8 URLs de `products.imagen_url` con saltos de línea corregidas.
  - 52 imágenes migradas de Supabase a copyparty, 0 fallidas; no queda ninguna URL de Supabase en `products` ni en `product_images`.
- **Pruebas automatizadas**: backend con `node --test` (46 pruebas: cliente ERP contra HTTPS falso, cobro, login, imágenes contra copyparty falso, scripts), sobre un Postgres local desechable. Frontend: 25 + 23 pruebas.
- **Fondo blanco detrás de las fotos de producto** en las tarjetas del catálogo y en "Otros modelos" de DetalleProducto, en modo claro, oscuro y alto contraste (variable `--terra-fondo-imagen-producto`). Sin cambios en tamaño ni recorte de las imágenes. Sin commit.
- **Catálogo móvil corregido** (sin commit): ancho completo con margen de 16 px, 2 columnas desde 360 px y 3 desde 768, paginación en una fila con versión compacta, sin bloque vacío al final, flotantes con una sola definición y zona segura, logo más legible y logo de reemplazo al 60 %. Se quitaron las reglas heredadas de `index.css` y las de `Responsive.css` que pisaban el layout. Decisión: [[2026-10-28-flotantes-y-catalogo-movil]].
- **Commits locales** `f24bf3a` (ERP y pagos) y `13f46df` (eliminar Supabase), sin push. La mayor parte del trabajo ya estaba en `812212d`, publicado en `origin/jhonatan`.

## En curso

### Migración del CSS a Tailwind v4
Por fases y por pantalla. Decisión: [[2026-10-28-migracion-tailwind]]. Reglas en `AGENTS.md`.

| Fase | Pantallas | Estado |
|---|---|---|
| 0 | Base: tokens `@theme`, variantes `dark:` y `contraste:`, reglas globales en `@layer base` | Hecha el 2026-10-28 |
| 1 | Catálogo, tarjeta, paginación, filtros, flotantes y Layout del cliente | Hecha el 2026-10-28. Código en `src/features/catalogo/` y `src/features/layout-cliente/`; se borraron `Catalogo.css`, `Layout.css`, `FloatingActions.css`, `NavigationFix.css` y `HeaderOptionsHidden.css` |
| 2 | DetalleProducto | Pendiente |
| 3 | Carrito, Identificación, Confirmación, PedidoGenerado | Pendiente |
| 4 | Bienvenida, Categorías | Pendiente |
| 5 | Mayorista | Pendiente |
| 6 | Admin | Pendiente |

### Otros
- **Extraer hooks de `CatalogoPage.jsx`** (tarea aparte): supera las 300 líneas por la lógica de filtros, orden, paginación, voz y teclado. Pasarla a hooks en `src/features/catalogo/hooks/` sin cambiar comportamiento.
- Subir los commits `f24bf3a` y `13f46df` **sin reescribir historia**: nada de force push sobre `812212d`, que ya está publicado.
- Asignar clave a los 4 mayoristas existentes desde Clientes (botón de llave): hasta entonces no pueden entrar.

## Pendiente

### Infraestructura y despliegue
- **Definir dónde corre el backend en producción.** `frontend/public/config.js` apunta a un backend en Vercel, pero el ERP está en la red interna (`192.168.0.82:9433`) y no es alcanzable desde ahí. El backend debe correr como proceso persistente dentro de la red interna (ver [[01-arquitectura]]).
- Cargar en `backend/.env` las credenciales `TERRA_ERP_*` y el certificado de TERRA cuando lleguen ([[pendientes-terceros]]).
- Dejar de versionar `frontend/.vite/` y `frontend/.npm-cache-terra/`. La caché de npm tiene una ruta de 183 caracteres que rompe `git worktree` en Windows.

### Seguridad (de [[ANALISIS_PROYECTO]])
- Rotar `ADMIN_TOKEN_SECRET`, `CLIENTE_TOKEN_SECRET` y la clave de la base (usuario y contraseña de `DATABASE_URL`): se compartieron fuera del repo. Rotar los secretos de token invalida todas las sesiones abiertas.
- Rotar los secretos que estuvieron versionados en el historial de git (`backend/.env` en commits antiguos).
- Proteger endpoints sin autenticación: `GET/DELETE /api/clientes`, CRUD de `/api/categorias` y `GET /api/pedidos/:id` (expone teléfono y NIT).
- Restringir CORS a `FRONTEND_URL` (hoy `cors()` acepta cualquier origen).
- Revisar permisos por rol: el rol `despacho` puede editar ítems, registrar ventas directas y ver reportes.

### Funcionalidad
- Fase 2 del ERP: job de sincronización con `GET /api/productos/catalogo` (usará `erp_sync_runs`) para que el kiosco muestre precio y stock reales antes de llegar a caja; importación única de imágenes del ERP. Ver [[erp-terra]].
- `frontend-global/`: el checkout envía un id de producto inválido y simula éxito si el backend falla ([[ANALISIS_PROYECTO]], sección 6.5).
- Reportes y dashboard calculan sobre los últimos 200 pedidos; usar los endpoints agregados.

### Calidad y documentación
- Revisión visual en modo claro, oscuro y alto contraste de Pedidos, Ventas directas y Clientes (cambios del 28/10 sin revisión en navegador).
- Resueltos en la fase 1 de Tailwind: el asistente ya no tapa "Total a pagar en caja" en Confirmación; desde 768 px el botón de accesibilidad no pasa sobre la grilla; el enlace "Catálogo de Productos" queda en una línea (solo ícono entre 640 y 1023 px). Además, con texto al 150 % el encabezado ya no recorta el logo ni "Carrito" (pasa a dos líneas).
- La guía de usuario `docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md` que cita `AGENTS.md` no existe.
- Scripts de la raíz (`scripts/asignar-productos-central.mjs`, `scripts/reclasificar-categorias.mjs`, `scripts/importar-excel-supabase.mjs`) todavía mencionan Supabase o deducen TLS por el host.

## Bloqueado por terceros
Detalle y responsables en [[pendientes-terceros]].
- Certificado del ERP y respuestas de TERRA sobre almacén, reserva de stock, precio mayorista y ofertas en la cotización.
- TLS en PostgreSQL y escritura anónima en copyparty (Oscar).
- Nomenclatura definitiva de las imágenes (Alex): propuesta `CODIGO_campaña_MM-AAAA_N.ext` enviada. Al confirmarse hay que implementar el nombre nuevo y la regla de selección por campaña ([[imagenes-nomenclatura]]).
