---
actualizado: 2026-10-28
tags: [integracion, erp]
referencia: "API TERRA – Guía de conexión v1.2 (Alex Mansilla, 26/10/2026)"
---

# Integración con la API ERP de TERRA

> [!note] Origen de esta nota
> Reemplaza a `INTEGRACION_ERP_TERRA.md`, que no estaba en el repositorio. Se reconstruyó el 28/10/2026 a partir de la especificación revisada de la integración y del código implementado. Donde la implementación se apartó de la especificación, se indica.

Decisiones: [[2026-10-28-cotizacion-al-cobrar]] · [[2026-10-28-stock-solo-almacen-central]] · [[2026-10-28-ofertas-locales]] · [[2026-10-28-pagos-sin-comprobantes]]
Pendientes con TERRA: [[pendientes-terceros]]

## Reglas de negocio
1. **El ERP es la fuente de verdad.** Stock, precio público y datos maestros que devuelve el ERP sobrescriben los de nuestra base.
2. **Ofertas locales.** Si el producto está en oferta en nuestra base se cobra `precio_oferta`; si no, el `precioPublico` del ERP. `public_price` se reescribe siempre ([[2026-10-28-ofertas-locales]]).
3. El pedido `TER-XXXXXXXX` es nuestra proforma: se crea sin tocar el ERP y se puede editar en caja mientras está `pending`.
4. **Antes de cobrar** se verifica cada ítem contra el ERP (solo lectura). Si hay menos stock o cambió el precio, se corrige la base y el pedido, y el cajero ve el total nuevo antes de recibir el dinero.
5. **La cotización se registra una sola vez por pedido**, al confirmar el pago, solo si la verificación no ajustó nada. En el mismo paso se completa el pedido, se registra el pago y se descuenta el stock local.
6. Ningún otro flujo (crear, editar, verificar, anular) llama a `POST /api/cotizaciones`, y nunca se reenvía automáticamente.
7. **Stock: solo cuenta ALMACEN CENTRAL** ([[2026-10-28-stock-solo-almacen-central]]).

| Momento | Verifica en ERP | Registra cotización | Reescribe producto | Descuenta stock |
|---|---|---|---|---|
| `POST /api/pedidos` (kiosco, mayorista, chatbot) | No | No | No | No |
| `PUT /api/pedidos/:id/items` | No | No | No | No |
| `POST /api/pedidos/:id/erp/verificar` (al abrir el cobro) | Sí | No | Sí | No |
| `PATCH /api/pedidos/:id/pago` | Sí, de nuevo | Sí, solo sin cambios | Sí | Sí |
| `POST /api/pedidos/venta-directa` | Sí | Sí | Sí | Sí |

## Endpoints del ERP que se usan
Base `TERRA_ERP_URL` (red interna, `https://192.168.0.82:9433`). Todas las llamadas, salvo el token, llevan `Authorization: Bearer {token}`.

| Uso | Endpoint | Cuándo |
|---|---|---|
| Token | `POST /api/auth/token` `{ usuario, clave }` → `{ token, expiraEnSegundos }` (8 h) | Primer uso y al vencer (se renueva 5 min antes) |
| Verificar stock y precio | `GET /api/productos/terra/{codigoTerra}` con `products.codigo_terra` | Verificación previa, por producto, solo lectura |
| Cotización | `POST /api/cotizaciones` `{ productos: [{ codigo, cantidad }] }` → 201 `{ numero, fecha, productos[], total }` | Una vez, al confirmar el cobro |
| Catálogo | `GET /api/productos/catalogo` | Fase 2, sin implementar |

- La respuesta de `/terra/{codigoTerra}` trae el `codigo` interno: se guarda en `erp_product_sync_state.erp_internal_code` y es el que se envía en la cotización.
- Campos usados: `codigo`, `codigoTerra`, `nombre`, `medida`, `color`, `marca`, `precioPublico`, `almacenes[{ almacen, stock }]`. 404 `producto_no_encontrado` si no existe o no está habilitado.
- Cotización: `codigo` es el código interno como texto; `cantidad` entera entre 1 y 9999; los ítems se agrupan por código. Precio, cliente, vendedor y fecha los pone TERRA. El envío a domicilio no va en la cotización.

## Errores del ERP
Forma `{ error: { codigo, mensaje, detalles? } }`. Se programa por `codigo`.

| HTTP | `codigo` | Acción |
|---|---|---|
| 401 | `token_vencido`, `token_invalido`, `token_requerido` | Borrar el token en caché, pedir uno nuevo y repetir **una vez** |
| 401 | `credenciales_invalidas` | No reintentar (5 fallos = bloqueo de 15 min). Responder 502 y registrar en el log |
| 429 | `demasiados_intentos` | No reintentar. Responder 503 "ERP bloqueado temporalmente" |
| 404 | `producto_no_encontrado` | Producto no disponible: se quita el ítem y se desactiva el producto |
| 422 | `productos_invalidos` | No se grabó nada. Responder 409 con `detalles` mapeados a nuestros ítems |
| 400 | `datos_invalidos`, `json_invalido` | Error de mapeo. 502 y log |
| 403 | `https_requerido` | Configuración errónea. 502 y log |
| 500/503, timeout, red | — | En verificación: 503, no se cobra. En cotización: resultado **desconocido**, estado `verificar` |

## Configuración (`backend/.env`, sin valores en esta nota)
| Variable | Uso |
|---|---|
| `TERRA_ERP_URL` | URL base de la API (https, red interna) |
| `TERRA_ERP_API_USER`, `TERRA_ERP_API_PASSWORD` | Credenciales; solo backend |
| `TERRA_ERP_CA_CERT_PATH` | Certificado de la CA de TERRA; nunca se desactiva la verificación TLS |
| `TERRA_ERP_TIMEOUT_MS` | Timeout de la cotización (20 s) |
| `TERRA_ERP_TIMEOUT_CONSULTA_MS` | Timeout de token y consultas (10 s) |
| `TERRA_ERP_CONCURRENCIA` | Consultas de producto en paralelo (5) |
| `TERRA_ERP_ALMACEN_VENTA` | Almacén que cuenta para vender (`ALMACEN CENTRAL`) |
| `TERRA_ERP_HABILITADO` | `false` = cobrar sin ERP (solo desarrollo): sin cotización ni descuento de stock, pero el pago sí se registra |

## Modelo de datos
**Cambio respecto de la especificación:** en vez de agregar columnas `erp_*` a `products` y `orders`, se usan las tablas que ya existían en la base.

| Tabla | Uso |
|---|---|
| `erp_quotations` | Una fila por intento de cotización. `idempotency_key` = id del pedido + número de intento; `status` (enviando, ok, rechazado o verificar), `erp_number`, `request_products`, `response`, `error_message`, `completed_at`, y `order_id` (columna agregada, FK a `orders`) |
| `erp_product_sync_state` | Por producto: `erp_internal_code` (código interno del ERP), `source_hash`, `last_synced_at`, `last_error` |
| `erp_warehouse_stocks` | Stock por almacén informado en la última verificación (referencia) |
| `erp_sync_runs` | Reservada para el job de la fase 2. Tiene 3 filas de prueba del 24/10 que no deben borrarse |
| `orders` | Solo `erp_estado` (también es el candado del cobro), `erp_intentado_at` y `erp_cotizacion_numero` |
| `order_items` | `product_id` y `erp_codigo` en cada ítem; los pedidos antiguos sin `product_id` se resuelven por `sku` |
| `payments` | Una fila por cobro, en la misma transacción ([[2026-10-28-pagos-sin-comprobantes]]) |

## Verificación previa (`verificarPedidoConErp`)
1. Carga los ítems del pedido con su producto.
2. Por cada producto distinto con `codigo_terra` (máximo `TERRA_ERP_CONCURRENCIA` en paralelo) consulta `GET /api/productos/terra/{codigo_terra}` y calcula el stock de ALMACEN CENTRAL.
3. Reescribe el producto local (tabla siguiente), guarda el código interno y el stock por almacén.
4. Ajusta cada ítem y recalcula los totales en **una** transacción.
5. Devuelve `{ pedido, cambios, hayCambios, bloqueado }`.

Si cualquier consulta falla por red, 5xx o timeout, aborta sin modificar nada y responde 503 "No se pudo verificar con TERRA".

| Campo del ERP | Columna local | Regla |
|---|---|---|
| `precioPublico` | `products.public_price` | Siempre se sobrescribe |
| stock de ALMACEN CENTRAL | `products.stock_quantity` | Siempre se sobrescribe (nunca `stockTotal`) |
| `almacenes[]` | `erp_warehouse_stocks` | Siempre se sobrescribe |
| `nombre`, `medida`, `color`, `marca`, `codigoTerra` | `name`, `size`, `color`, `marca`, `codigo_terra` | Se sobrescriben |
| `codigo` | `erp_product_sync_state.erp_internal_code` | Se guarda |

No se tocan `precio_oferta`, `en_oferta`, `precio_mayorista`, escalas mayoristas, imágenes, descripción, categoría ni `slug`. Un 404 deja el producto con `stock_quantity = 0`, `activo = false` e `is_active = false`.

Ajuste por ítem:
- producto sin `codigo_terra` → cambio `sin_codigo`, el cobro queda **bloqueado** hasta completar el código;
- producto inexistente en el ERP o sin stock → se quita el ítem (`sin_stock`);
- cantidad mayor al stock → se reduce (`cantidad_reducida`);
- precio distinto del válido → se actualiza (`precio_actualizado`).

## Flujo de cobro (`confirmarPagoConErp`)
1. **Reclamar** el pedido de forma atómica: `erp_estado = 'enviando'` solo si está `pending` y sin cobro en curso. Si no, 409 `pedido_en_proceso`.
2. **Verificar** siempre, aunque ya se haya verificado al abrir el cobro. Con cambios: se liberan el candado y se responde 409 `pedido_ajustado` con los cambios; el cajero reconfirma. Con productos sin código: 409 `pedido_bloqueado`.
3. **Cotizar**: se crea la fila del intento en `erp_quotations` y se llama a `POST /api/cotizaciones` con los ítems agrupados por código interno.
4. Según el resultado:
   - **201**: en una transacción, pedido `completed`, `erp_estado = 'ok'`, número de cotización, intento `ok`, fila en `payments` y descuento de stock. Si la transacción local falla después del 201, no se revierte en el ERP: el pedido queda en `verificar` con el número, para conciliar.
   - **422**: intento y pedido `rechazado`; el pedido sigue editable. 409 `cotizacion_rechazada` con detalles.
   - **Timeout, red o 5xx**: intento y pedido `verificar`. 502 "Verificá en el ERP si se registró la cotización antes de reintentar". Sin reintento automático.
   - **Credenciales, 429, 400, 403**: nada se grabó; se libera el candado y se responde 502 o 503.

## Endpoints propios
| Método | Ruta | Roles | Uso |
|---|---|---|---|
| POST | `/api/pedidos/:id/erp/verificar` | admin, vendedor | Verificación previa; no cobra |
| PATCH | `/api/pedidos/:id/pago` `{ metodoPago, referencia, costoEnvio }` | admin, vendedor | Cobro con verificación y cotización |
| POST | `/api/pedidos/venta-directa` | personal | Crea el pedido y lo cobra con el mismo flujo |
| PATCH | `/api/pedidos/:id/erp/manual` `{ numero, metodoPago, referencia }` | admin | La cotización sí existe en el ERP: cierra el cobro con ese número sin llamar al ERP |
| POST | `/api/pedidos/:id/erp/reintentar` `{ confirmoQueNoExiste: true }` | admin | No existe: pasa de `verificar` a `rechazado` para cobrar de nuevo |

`PUT /:id/items` y la anulación se rechazan mientras `erp_estado` sea `enviando`, `ok` o `verificar`.

## Código
- Backend: `services/erpTerra.js` (cliente HTTPS, token, errores tipados), `services/verificacionErp.js` (verificación y cobro), `models/erpModel.js`, `models/pedidoModel.js`, `models/productoModel.js`, `controllers/pedidoController.js`.
- Frontend: `components/admin/AvisoErp.jsx`, `utils/erpCambios.js`, `pages/admin/PedidosAdmin.jsx` (verificación al abrir el cobro, avisos, conciliación) y `pages/admin/VentasDirectasAdmin.jsx`.
- Pruebas: `backend/test/erpTerra.test.js`, con un servidor HTTPS falso y Postgres local.

## Fase 2 (preparada, sin implementar)
- Job con `GET /api/productos/catalogo` cada N minutos aplicando la misma reescritura a todo el catálogo, registrado en `erp_sync_runs`. Los productos ausentes del catálogo quedarían con stock 0.
- Importación única de imágenes del ERP (`/imagenes`, base64, timeout de al menos 60 s) a copyparty ([[imagenes-nomenclatura]]).
