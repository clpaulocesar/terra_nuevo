# TERRA Autoservicio · Mapa del proyecto para bots de navegación

Documento de referencia para construir asistentes (chat o voz) que guíen al usuario por la app.
Describe qué pantallas existen, cómo se llega a cada una, qué botones hay y qué endpoints usa.
Todas las rutas del frontend son relativas al dominio de la app (en local `http://localhost:5173`).

---

## 1. Visión general

| Pieza | Tecnología | Dónde corre |
|---|---|---|
| Frontend (kiosco, tienda web, panel mayorista, backoffice) | React 19 + Vite, React Router | `frontend/`, puerto 5173 |
| Backend (API REST) | Express 5 + PostgreSQL (Supabase) | `backend/`, puerto 3001, prefijo `/api` |
| Chatbot | n8n (webhook configurado en `frontend/public/config.js`, clave `N8N_CHAT_URL`) | externo |
| Voz | Web Speech API (`SpeechRecognition` + `speechSynthesis`), idioma `es-ES` | en el navegador |

La app es **un solo sitio** con cuatro "mundos" que comparten dominio:

1. **Kiosco / tienda pública**: cualquiera, sin cuenta. Compra y genera un ticket para pagar en caja.
2. **Mayorista (B2B)**: cliente con cuenta. Mismo catálogo con precios mayoristas, panel "Mi cuenta".
3. **Backoffice admin**: personal con rol `admin` (también `vendedor` y `despacho` con menos permisos).
4. **Panel vendedor**: rol `vendedor` (o `admin`), versión reducida del backoffice.

---

## 2. Roles, credenciales y cómo entra cada uno

| Rol | Cómo se identifica | Dónde inicia sesión | A dónde lo lleva | Dónde se guarda la sesión |
|---|---|---|---|---|
| Cliente anónimo (kiosco) | No inicia sesión. Da nombre y teléfono solo al confirmar el pedido | — | — | Solo en memoria de React (`ClienteContext`), nunca `localStorage` |
| **Mayorista** | Correo + contraseña de Supabase Auth. Su perfil en `customers` tiene `rol = 'mayorista'` | Botón **"Iniciar sesión"** de la cabecera (abre el modal `WebAccountModal`, no es una ruta) | Se queda en la página actual; aparece el menú de cuenta y `/mi-cuenta` | `SesionClienteContext` (token de Supabase en memoria) |
| **Administrador** | Correo + contraseña (`ADMIN_EMAIL`/`ADMIN_PASSWORD` del `.env` del backend, o un registro de `personal` con rol `admin`) | Ruta **`/admin/login`** | `/admin` (Dashboard) | `sessionStorage` (`terra_admin_token`, 8 h) |
| **Vendedor** | Registro de `personal` con rol `vendedor` | Ruta **`/vendedor/login`** | `/vendedor` | `sessionStorage` (mismo mecanismo que admin) |
| Despacho | Registro de `personal` con rol `despacho` | `/admin/login` | `/admin/pedidos` (solo ve Dashboard y Pedidos) | `sessionStorage` |

Detalles útiles para un bot:

- **No hay enlace visible al login de administrador.** El acceso oculto es tocar el logo TERRA de la cabecera 5 veces en menos de 2,5 s, o escribir la URL `/admin/login`. Un bot puede navegar directo a `/admin/login`.
- **El login mayorista no es una ruta**, es un modal. Para "mandar al login mayorista" el bot debe abrir el modal (hoy solo se abre con el botón "Iniciar sesión" de la cabecera) o navegar a `/mi-cuenta`, que si no hay sesión muestra el aviso para iniciar sesión. Recomendación: agregar un parámetro `?login=1` o un comando de voz que dispare `setCuentaAbierta(true)` en `AppRoutes.jsx`.
- El modal mayorista tiene: campo `usuario` (correo), campo `password`, botón "Iniciar sesión", "Olvidé mi contraseña" (sin flujo todavía), enlace a WhatsApp para pedir acceso mayorista (`WHATSAPP_COMPROBANTES` en `config.js`).
- Las cuentas mayoristas las crea el admin desde **Clientes** (`POST /api/clientes/mayoristas`, requiere token admin). No hay autorregistro.
- Credenciales de admin/vendedor: `POST /api/admin/auth/login` con `{ email, password }`. Respuesta `{ data: { token, usuario: { nombre, rol } } }`.
- El cierre de sesión mayorista está en el menú de cuenta ("Cerrar sesión") y vuelve a `/`. El del backoffice está al pie del sidebar y vuelve a `/`.

---

## 3. Rutas públicas (kiosco y tienda)

Todas dentro del `Layout` con cabecera, navegación móvil, lector de voz, carrito flotante y chat.

| Ruta | Pantalla | Para qué sirve | Botones y acciones principales |
|---|---|---|---|
| `/` | Bienvenida | Portada con carrusel de fotos y beneficios | "Probar aquí" → `/catalogo`; flechas "Foto anterior / siguiente" |
| `/categorias` | Líneas y categorías | Tarjetas por categoría con cantidad de productos | Cada tarjeta → `/catalogo?categoria=NOMBRE`; chip "Ofertas" |
| `/catalogo` | Catálogo de productos | Grilla paginada con buscador, filtros y escáner QR | Buscador (teclado en pantalla en modo táctil); desplegable **"Categorías"** y chips de categoría; chip **"Ofertas"** (solo `en_oferta`); desplegable **"Orden"**: Recomendados, En oferta, Precio menor a mayor, Precio mayor a menor, Nombre A-Z; paginador; tarjeta de producto → `/productos/:id`; botón **"Agregar al carrito"**; botón flotante **QR** (abre la cámara); `?abrirQr=1` abre la cámara al entrar; `?buscar=`, `?categoria=`, `?pagina=`, `?ofertas=1` |
| `/productos/:id` | Detalle de producto | Galería, colores, precio, ficha técnica, relacionados | "Agregar al carrito", "Comprar ahora" (→ `/carrito`), selector de cantidad, selector de color, "Descripción completa", "Ver catálogo", miniatura de video |
| `/carrito` | Carrito | Revisión del pedido antes del ticket | ± cantidad, papelera, "Vaciar carrito", **"Continuar y generar pedido"** (→ `/identificacion`), "Seguir comprando" (→ `/catalogo`). `?confirmarQr=1` importa la compra escaneada por QR |
| `/identificacion` | Identificación | Datos del cliente para el ticket (teclado en pantalla) | Nombre, teléfono, casilla "Deseo recibir mi comprobante por WhatsApp", **"Continuar a confirmación"**, "Comprar como invitado" (salta datos) |
| `/confirmacion` | Confirmación | Resumen final, método de pago en caja | "Modificar carrito", **"Confirmar pedido"** (crea el pedido con `POST /api/pedidos`) |
| `/pedido/:id` (y `/pedido`) | Pedido generado | Ticket con código para pagar en caja y QR | "Descargar ticket", "Volver al inicio", "Seguir comprando", enviar por WhatsApp. Es la página que abre el QR del ticket |
| `*` | No encontrado | 404 | "Volver al inicio" |

Elementos fijos de la cabecera (todas las rutas públicas):

- Logo TERRA → `/` (5 toques rápidos → `/admin/login`).
- "Catálogo de Productos" → `/catalogo`. "Líneas y Categorías" → `/categorias`.
- Botones de voz: **altavoz** (activar/desactivar lectura por voz) y **micrófono** (decir un comando).
- Botón de tema (modo día / noche, se guarda en `localStorage` `terra_tema`).
- **"Iniciar sesión"** (abre el modal mayorista). Con sesión mayorista se convierte en el menú de cuenta.
- Carrito con contador → `/carrito`. Botón casa → `/`.
- En móvil: barra inferior con Catálogo, Categorías, Carrito e Inicio; menú hamburguesa.

Elementos flotantes:

- **Carrito flotante** (`CarritoFlotante`): panel lateral con ± cantidad, quitar, "Ir al carrito".
- **Asistente** (`ChatAsistente`): burbuja "Asistente" abajo a la derecha. Campo "Escribe o graba tu consulta…", botón "Enviar", botón "Grabar nota de voz" / "Detener y enviar audio", "Cerrar chat". Envía al webhook de n8n.
- **QR** (solo en catálogo): abre la cámara; cada lectura agrega el producto a un borrador en `localStorage` (`terra_qr_cart_v1`, caduca a las 2 h). Tras leer, la cámara se apaga; control de cantidad, "Escanear otro", "Ver detalle" (abre `public/detalle-qr.html?id=`), **"Confirmar compra"** → `/carrito?confirmarQr=1`.

---

## 4. Rutas del mayorista (requieren sesión con `rol = 'mayorista'`)

| Ruta | Pantalla | Acciones |
|---|---|---|
| `/mi-cuenta` y `/mi-cuenta/perfil` | Mi Perfil Mayorista | Razón social, NIT, nombre del encargado, correo de facturación, teléfono/WhatsApp, dirección, referencia, **mapa interactivo (Leaflet)** para fijar el domicilio, foto/logo, "Guardar cambios", "Cancelar" |
| `/mi-cuenta/pedidos` | Mis pedidos | KPIs, buscador por Nº de pedido o factura, filtros por estado, tabla de pedidos, panel de detalle con seguimiento, "Repetir pedido", "Factura PDF", "Exportar Excel" |
| `/catalogo` | Catálogo mayorista | Mismo catálogo; muestra PVP tachado, precio mayorista, escalas por cantidad y selector de cantidad por tarjeta |

Menú de cuenta (cabecera, con sesión): "Mi panel mayorista" (`/mi-cuenta`), "Catálogo mayorista con precios B2B" (`/catalogo`), "Mis pedidos" (`/mi-cuenta/pedidos`), "Mis cotizaciones y licitaciones" (deshabilitado), "Mi perfil y datos de facturación" (`/mi-cuenta`), "Cerrar sesión".

Endpoints que usa: `GET /api/clientes/sesion` (perfil con el token de Supabase), `PUT|PATCH /api/clientes/perfil`, `GET /api/clientes/mis-pedidos`, `GET /api/geocodificacion/reverse` (dirección desde coordenadas).

---

## 5. Backoffice (`/admin`, requiere token de `/admin/login`)

Sidebar (orden real) y rol mínimo:

| Ruta | Sección | Roles | Qué hay |
|---|---|---|---|
| `/admin/login` | Acceso de administrador | — | Correo, contraseña, "Ingresar". Al entrar → `/admin` |
| `/admin` | Dashboard | admin, vendedor, despacho | KPIs del día, ventas, pedidos recientes, "Actualizar" |
| `/admin/pedidos` | Pedidos | admin, vendedor, despacho | Buscar, filtros por estado, abrir pedido, editar ítems, cambiar estado, registrar pago, imprimir ticket, "Actualizar" |
| `/admin/ventas-directas` | Ventas directas | admin, vendedor | Venta en mostrador: buscar/agregar productos, ± cantidad, cliente, cobrar (`POST /api/pedidos/venta-directa`) |
| `/admin/productos` | Productos | admin | Tabla de productos (datatable), "Registrar nuevo producto" (formulario en 5 pasos: Información comercial, Variantes y colores, Galería multimedia, Instrucciones, Publicación), editar, ocultar/mostrar en catálogo, ajuste rápido de stock, QR del producto (imprimir, descargar, ticket de góndola), exportar Excel/PDF, eliminar |
| `/admin/categorias` | Categorías | admin | KPIs, buscar, "Nueva categoría", editar, eliminar (bloqueado si tiene productos) |
| `/admin/almacen` | Almacén | admin | **Ingreso por QR**: "Abrir cámara", leer QR, cantidad que ingresa, "Registrar ingreso", "Escanear otro", búsqueda manual por código; **Stock por categoría**: desplegar categoría, "+ Stock" por producto, filtro, historial de la sesión |
| `/admin/clientes` | Clientes | admin, vendedor | Directorio, "Nuevo cliente", crear usuario mayorista (correo + contraseña), eliminar |
| `/admin/personal` | Personal | admin | Lista de personal (admin / vendedor / despacho), "Nuevo", editar |
| `/admin/reportes` | Reportes | admin | Rangos de fecha, granularidad, tablas paginadas, "Aplicar", "Exportar vista" |

Cabecera del backoffice: buscador, botón de tema, usuario y "Cerrar sesión". Las rutas sin permiso redirigen según el rol.

---

## 6. Panel vendedor (`/vendedor`, roles vendedor o admin)

| Ruta | Sección |
|---|---|
| `/vendedor/login` | Acceso de vendedor (correo + contraseña, mismo endpoint que admin) → `/vendedor` |
| `/vendedor` | Resumen operativo (dashboard) |
| `/vendedor/pedidos` | Pedidos (misma pantalla que el admin) |
| `/vendedor/ventas` | Ventas directas |
| `/vendedor/clientes` | Clientes |

---

## 7. Flujos completos que un bot debería conocer

**Compra en kiosco (sin cuenta)**
`/catalogo` → "Agregar al carrito" → `/carrito` → "Continuar y generar pedido" → `/identificacion` (nombre, teléfono o "Comprar como invitado") → `/confirmacion` → "Confirmar pedido" → `/pedido/:id` con el **código del ticket** para pagar en caja. El pago lo registra caja en el backoffice (`PATCH /api/pedidos/:id/pago`). El pedido no descuenta stock.

**Compra por QR (cámara)**
`/catalogo?abrirQr=1` → leer QR → ajustar cantidad → "Escanear otro" o "Confirmar compra" → `/carrito?confirmarQr=1` → sigue el flujo normal.

**Compra desde el chatbot (n8n)**
1. `GET /api/asistente/productos?termino=` → productos con `id`, `stock`, `precio_venta`, `en_oferta`. `termino=ofertas` devuelve solo ofertas.
2. `GET /api/asistente/instrucciones?termino=` → instrucciones de armado/uso.
3. `POST /api/asistente/pedidos` con `{ "items": [{ "productoId": "<uuid>", "cantidad": n }] }` → `{ data: { id, codigo, total, qr: { url } } }`. El cliente paga en caja con `codigo`; la URL del QR abre `/pedido/:id`.

**Entrar como mayorista**
Cabecera → "Iniciar sesión" → correo y contraseña → el menú de cuenta aparece → "Mi panel mayorista" (`/mi-cuenta`).

**Entrar como administrador**
`/admin/login` (o 5 toques en el logo) → correo y contraseña → `/admin`.

**Entrar como vendedor**
`/vendedor/login` → correo y contraseña → `/vendedor`.

**Ingreso de mercadería**
`/admin/almacen` → "Abrir cámara" → leer QR del producto → cantidad → "Registrar ingreso" (`PATCH /api/productos/:id/stock` con `{ agregar: n }`).

---

## 8. Navegación por voz: lo que existe hoy

Componentes: `frontend/src/components/accesibilidad/BotonesVoz.jsx` (botones altavoz y micrófono), `LectorVoz.jsx` (anuncia páginas, lee elementos enfocados e interpreta comandos), `frontend/src/context/AccesibilidadContext.jsx` (reconocimiento `es-ES`, no continuo; síntesis con voz en español). Está montado dentro del router, así que funciona en todas las rutas.

Comandos reconocidos (coincidencia por "contiene", sin acentos):

| Decir | Hace |
|---|---|
| ayuda, qué puedo decir, comandos | Lee la lista de comandos |
| silencio, cállate, parar, detener, basta | Detiene la lectura |
| activar lectura / desactivar lectura (voz) | Enciende o apaga la lectura por voz |
| modo noche / modo oscuro, modo día / modo claro | Cambia el tema |
| leer página, dónde estoy, qué hay aquí, leer | Lee título, secciones y cantidad de controles |
| buscar <término> | Busca en el catálogo (evento `buscar`) |
| limpiar búsqueda, quitar filtros | Limpia filtros del catálogo |
| siguiente / anterior | Cambia de página del catálogo |
| volver, atrás, regresar | `navigate(-1)` |
| inicio, principal, portada | `/` |
| catálogo, productos, colchones, sommiers, camas | `/catalogo` |
| categorías, líneas | `/categorias` |
| carrito, mi compra, mi pedido | `/carrito` |
| finalizar, confirmar compra, generar pedido, pagar | `/carrito` |
| agregar / añadir <producto> | Evento `agregar` al catálogo |
| escanear, qr, cámara | `/catalogo?abrirQr=1` |

Faltan (y son el objetivo de la mejora): "soy mayorista", "iniciar sesión", "soy administrador", "soy vendedor", "mi cuenta", "mis pedidos", "almacén", "cerrar sesión", nombres de página para `/mi-cuenta`, `/vendedor` y `/admin/*` en `NOMBRES_PAGINA`.

### Intenciones sugeridas para el bot de voz

| Intención (frases) | Acción propuesta |
|---|---|
| "soy mayorista", "cliente mayorista", "iniciar sesión", "entrar a mi cuenta" | Si ya hay sesión mayorista → `/mi-cuenta`. Si no → abrir el modal de cuenta y pedir por voz correo y contraseña (dictado), o navegar a `/mi-cuenta` y anunciar "Tocá Iniciar sesión". Requiere exponer una función `abrirLoginMayorista()` desde `AppRoutes.jsx` al contexto de accesibilidad |
| "soy administrador", "panel de administración", "backoffice" | `/admin/login` y anunciar "Ingresá tu correo y contraseña de administrador" |
| "soy vendedor" | `/vendedor/login` |
| "mis pedidos" (mayorista) | `/mi-cuenta/pedidos` |
| "mi perfil", "mis datos" | `/mi-cuenta/perfil` |
| "cerrar sesión", "salir" | `cerrarSesion()` del `SesionClienteContext` o `cerrarSesionAdmin()` según dónde esté |
| "almacén", "ingresar mercadería" (admin) | `/admin/almacen` |
| "productos" (en `/admin`) | `/admin/productos` (hoy "productos" lleva al catálogo público; conviene decidir por la ruta actual) |
| "ofertas", "promociones" | `/catalogo?ofertas=1` |
| "instrucciones de <producto>", "cómo se arma" | Consultar `GET /api/asistente/instrucciones?termino=` y leer el resultado |

Para dictar credenciales por voz: el reconocimiento no es continuo (`rec.continuous = false`), así que hay que pedir correo y contraseña en dos turnos y confirmar lo entendido antes de llamar a `iniciarSesionCliente(email, password)` o `iniciarSesionAdmin(email, password)`. Por privacidad en tablet compartida no se debe leer la contraseña en voz alta ni guardarla.

---

## 9. Endpoints del backend (`/api`)

| Método y ruta | Auth | Uso |
|---|---|---|
| `GET /health` | — | Estado del servidor y base de datos |
| `GET /productos` | — | Catálogo paginado. Query: `pagina`, `limite` (≤200), `orden` (recomendados, ofertas, precio-asc, precio-desc, nombre, nuevos, mas-vendidos), `buscar`, `categoria`, `ofertas=true`, `promos=true`, `stock=true`, `precioMin`, `precioMax`, `todos=true` (incluye ocultos, solo admin) |
| `GET /productos/:id` | — | Detalle por id, slug o código |
| `POST /productos`, `PUT /productos/:id`, `DELETE /productos/:id` | — (lo usa el admin) | Alta, edición, borrado. Campos: `nombre`, `sku` (código Terra), `codigoInterno`, `categoria`, `precio`, `precioMayorista`, `precioFabrica`, `precioOferta`, `enOferta`, `showroom`, `medida`, `descripcion`, `imagenes`, `video_url`, `colores`, `escalasMayorista`, `instrucciones { texto, detalle, video_url, imagenes_url }` |
| `PATCH /productos/:id/stock` | — | `{ showroom: n }` fija el stock; `{ agregar: n }` suma |
| `PATCH /productos/:id/visibilidad` | — | Ocultar/mostrar en catálogo |
| `GET /categorias` | — | Solo categorías con productos activos. `?todas=1` incluye vacías |
| `POST|PUT|DELETE /categorias` | — | Gestión de categorías |
| `POST /pedidos` | — | Pedido del kiosco (recalcula precios en BD, valida stock) |
| `GET /pedidos/:id` | — | Ticket por id |
| `PATCH /pedidos/:id/estado`, `PATCH /pedidos/:id/pago` | — | Cambio de estado y registro de pago (caja) |
| `GET /pedidos`, `PUT /pedidos/:id/items`, `POST /pedidos/venta-directa`, `GET /pedidos/analitica-horaria` | admin | Backoffice |
| `GET|POST /asistente/productos` | — | Buscador del chatbot (`termino`, `ofertas=true`) |
| `GET|POST /asistente/instrucciones` | — | Instrucciones de armado/uso (`termino`) |
| `POST /asistente/pedidos` | — | Pedido sin datos del cliente, devuelve código y QR |
| `POST /admin/auth/login`, `GET /admin/auth/me` | — / admin | Login y sesión del backoffice |
| `POST /clientes`, `GET /clientes`, `GET|DELETE /clientes/:id` | — | Clientes del kiosco |
| `POST /clientes/mayoristas` | admin | Crear cuenta mayorista |
| `GET /clientes/sesion`, `PUT|PATCH /clientes/perfil`, `GET /clientes/mis-pedidos` | token Supabase | Sesión mayorista |
| `GET|POST /personal` | — | Personal del backoffice |
| `GET /geocodificacion/reverse` | — | Dirección a partir de coordenadas (mapa mayorista) |

---

## 10. Configuración que el bot debe respetar

- `frontend/public/config.js` (se lee en tiempo de ejecución, no se compila): `API_URL` (local → `http://localhost:3001/api`; producción → `https://terratabletv2-0.vercel.app/api`), `N8N_CHAT_URL`, `WHATSAPP_COMPROBANTES`.
- `frontend/.env`: `VITE_API_URL`, `VITE_MODO_DEMO` (`"true"` desactiva las llamadas reales), credenciales públicas de Supabase para el login mayorista.
- `backend/.env`: `DATABASE_URL`, `PORT`, `FRONTEND_URL` (se usa para armar la URL del QR del ticket), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`.
- Privacidad en tablet compartida: los datos personales del cliente viven solo en memoria; el único dato persistente es el borrador de QR (líneas de producto) y el tema.
- Vercel despliega la rama `main`; los cambios hechos en `jhonatan` no están en producción hasta fusionarlos.

---

## 11. Archivos clave

| Qué | Archivo |
|---|---|
| Rutas y cabecera | `frontend/src/routes/AppRoutes.jsx` |
| Voz (botones, lector, contexto) | `frontend/src/components/accesibilidad/*`, `frontend/src/context/AccesibilidadContext.jsx` |
| Login mayorista (modal) | `frontend/src/components/WebAccountModal.jsx`, `frontend/src/services/sesionClienteService.js`, `frontend/src/context/SesionClienteContext.jsx` |
| Login admin / vendedor | `frontend/src/pages/admin/LoginAdmin.jsx`, `frontend/src/pages/vendedor/LoginVendedor.jsx`, `frontend/src/services/adminService.js` |
| Sidebar admin y roles | `frontend/src/components/admin/AdminLayout.jsx`, `frontend/src/components/admin/RutaAdmin.jsx` |
| Catálogo, QR y chips | `frontend/src/pages/Catalogo.jsx`, `frontend/src/context/CatalogoContext.jsx`, `frontend/src/services/qrCartService.js` |
| Carrito y checkout | `frontend/src/context/CarritoContext.jsx`, `pages/CarritoPage.jsx`, `pages/Identificacion.jsx`, `pages/Confirmacion.jsx`, `pages/PedidoGenerado.jsx` |
| Chat n8n | `frontend/src/components/chat/ChatAsistente.jsx` |
| Ficha QR independiente | `frontend/public/detalle-qr.html` |
| API del chatbot | `backend/src/routes/asistenteRoutes.js`, `controllers/asistenteController.js`, `models/asistenteModel.js` |
| Productos / pedidos | `backend/src/models/productoModel.js`, `backend/src/models/pedidoModel.js` |

---

## 12. Navegación guiada por voz y chat (implementado)

Código en `frontend/src/navegacion/`:

| Archivo | Qué hace |
|---|---|
| `registroNavegacion.js` | Fuente única de destinos: clave estable, ruta o acción, nombre, `acceso` (publico / mayorista / sesion / roles) y alias. Deriva `NOMBRES_PAGINA`, `destinosDisponibles(contexto)` para la ayuda contextual y el destino pendiente tras login (`terra_nav_pendiente` en `sessionStorage`). |
| `interpretarIntencion.js` | Función pura: frase → `{ destino, parametros }`. Normaliza acentos, resuelve comandos con parámetro (`buscar`, `categoria`, `instrucciones`), elige el alias más largo y desambigua por zona (`/admin`, `/vendedor`, sesión mayorista, público). |
| `NavegacionContext.jsx` | Dentro del router. `ejecutarIntencion()` verifica sesión y rol, navega o abre el modal mayorista, guarda el destino pendiente y anuncia. Expone `abrirLoginMayorista()`, soporta `?login=1`, pide confirmación por voz antes de cerrar sesión. |
| `__tests__/interpretarIntencion.test.js` | Tests con `node --test` (sin dependencias): `cd frontend && node --test src/navegacion/__tests__/interpretarIntencion.test.js`. |

Integraciones: `LectorVoz.jsx` delega la navegación al intérprete y lee la ayuda contextual y las instrucciones de armado; `ChatAsistente.jsx` procesa `[[NAVEGAR:clave]]` con lista blanca (`CLAVES_CHAT`); `LoginAdmin.jsx` y `LoginVendedor.jsx` redirigen al destino pendiente si el rol lo permite; el lector y los botones de voz también están montados en el backoffice y el portal vendedor.

### Prompt para el agente de n8n (agregar al system prompt)

```
# NAVEGACIÓN
Si el cliente pide ir a una sección de la app, respondé con una línea corta y agregá AL FINAL:
[[NAVEGAR:clave]]
Claves permitidas: inicio, catalogo, ofertas, categorias, carrito, escanear, loginMayorista, miCuenta, misPedidos.
Ejemplos: "ver ofertas" -> [[NAVEGAR:ofertas]]; "soy mayorista" o "quiero iniciar sesión" -> [[NAVEGAR:loginMayorista]];
"mis pedidos" -> [[NAVEGAR:misPedidos]]; "quiero escanear un producto" -> [[NAVEGAR:escanear]].
No uses claves del backoffice ni inventes otras. Si pide algo fuera de esta lista, no pongas etiqueta.
```

### Pendiente / fuera de alcance

- Dictado de correo y contraseña por voz: la bandera `VOZ_DICTADO_CREDENCIALES` existe en `public/config.js` (en `false`) pero el flujo de dictado no está implementado; el asistente abre el formulario y el usuario escribe.
- Reconocimiento continuo y palabra de activación.
