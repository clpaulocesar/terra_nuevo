---
actualizado: 2026-10-30
tags: [integracion, pagos, qr]
---

# Preparación para QR dinámico de Baneco

Estado: configuración de sandbox, validación y andamiaje backend preparados; la comunicación con el API **no está implementada**. Las rutas responden `501` sin realizar solicitudes ni registrar pagos.

Decisión: [[2026-10-30-preparacion-qr-dinamico-baneco]] · Pagos: [[2026-10-28-pagos-sin-comprobantes]] · Arquitectura: [[01-arquitectura]]

## Alcance actual

- El kiosco y los modales de cobro ya no muestran la imagen fija `QRPAGO.jpeg` ni presentan un pago QR como completado.
- La confirmación del kiosco sigue generando un pedido pendiente para pagar en caja. El estado “integración pendiente” no crea un QR ni verifica pagos.
- Se añadieron variables de ejemplo a `backend/.env.example` y un módulo de configuración/validación que solo acepta el ambiente y URL de sandbox documentados.
- Existe un contrato inicial bajo `/api/pagos/qr`: crear QR con `pedidoId`, consultar por `qrId` y cancelar por `qrId`. El servicio devuelve `501 baneco_no_implementado`; las rutas no llaman al banco, no generan QR ni registran pagos.
- Los puntos de implementación quedaron separados: `backend/src/services/banecoCrypto.js` para cifrar/descifrar y `backend/src/services/banecoApiClient.js` para autenticación, generación, consulta, cancelación y conciliación. Todas las funciones arrojan `ErrorBanecoNoImplementado`; las rutas lo traducen a HTTP `501`.
- Las rutas del banco ya están centralizadas en `obtenerConfiguracionBaneco()` (`config.rutas`), junto a las credenciales, base URL, timeout y vigencia.
- No hay callback, almacenamiento de QR ni credenciales configuradas.
- Las variables de Baneco deben ir únicamente en `backend/.env`, que no se versiona. Nunca deben ponerse en `frontend/.env`, `public/config.js`, el navegador ni el repositorio.

## Configuración de ejemplo

| Variable | Propósito |
|---|---|
| `BANECO_ENVIRONMENT` | Debe ser `sandbox`; la configuración rechaza otros ambientes. |
| `BANECO_API_URL` | Base del ambiente de certificación indicado en el manual. Confirmar con Baneco que corresponde al sandbox asignado. |
| `BANECO_API_USER` | Usuario de integración asignado por el banco. |
| `BANECO_API_PASSWORD` | Contraseña asignada; el futuro cliente del banco deberá aplicar el cifrado requerido. |
| `BANECO_AES_KEY` | Llave AES de 256 bits entregada por el banco. Nunca registrar en logs ni enviar desde el cliente web. |
| `BANECO_ACCOUNT_CREDIT` | Cuenta TERRA que recibirá los pagos QR; debe cifrarse en el backend según el contrato bancario. |
| `BANECO_BRANCH_CODE` | Código opcional de sucursal, de hasta 5 caracteres, si Baneco requiere abono por sucursal. |
| `BANECO_TIMEOUT_MS` | Límite propuesto para las solicitudes al banco; ajustar con la API de prueba. |
| `BANECO_QR_VALIDITY_MINUTES` | Vigencia de ejemplo, aún no confirmada con el banco. |

`backend/.env.example` contiene valores vacíos para secretos y datos bancarios. `backend/src/config/baneco.js` valida la configuración sin imprimir sus valores y solo acepta la URL de pruebas documentada. No copiar credenciales reales a esta nota ni al repositorio.

## Preparación de pruebas

- Para AES unitario, copia `backend/.env.baneco.test.example` a `backend/.env.baneco.test`. Ese archivo local está ignorado por Git y solo debe contener vectores de prueba públicos de Baneco: clave de prueba, texto claro y cifrado esperado.
- Ejecuta `cd backend && npm run test:baneco:crypto`. El test compara cifrado y descifrado con el vector oficial; si no está completo, informa que se omitió. No usa la llave real ni hace llamadas de red.
- No uses credenciales de producción como vectores. Aún falta que el propietario implemente `banecoCrypto.js`; hasta entonces, con un vector configurado, la prueba fallará explícitamente con `baneco_no_implementado`.
- El archivo de prueba reserva `BANECO_RUN_SANDBOX_TESTS` y `BANECO_TEST_ORDER_ID`, pero no habilita tráfico. Las pruebas reales al sandbox siguen pendientes del cliente API, del formato confirmado con Baneco y de un pedido de prueba válido. Nunca se ejecutan como parte de `npm test`.
- No se debe compartir ni guardar la llave personal en `.env.example`, archivos de test versionados, frontend o documentación.

## Andamiaje backend disponible

| Método | Ruta | Entrada prevista | Estado actual |
|---|---|---|---|
| `POST` | `/api/pagos/qr` | `pedidoId` UUID | Valida el ID y devuelve `501 baneco_no_implementado`. |
| `GET` | `/api/pagos/qr/:qrId` | ID de QR como segmento seguro | Valida el ID y devuelve `501 baneco_no_implementado`. |
| `DELETE` | `/api/pagos/qr/:qrId` | ID de QR como segmento seguro | Valida el ID y devuelve `501 baneco_no_implementado`. |

Implementación pendiente por el propietario:

1. Confirmar con Baneco el modo/padding, IV y codificación AES; implementar `cifrarDatoBaneco(valor, llaveAes)` y `descifrarDatoBaneco(valorCifrado, llaveAes)` en `backend/src/services/banecoCrypto.js`. La llave se obtiene de `config.llaveAes`.
2. Implementar las operaciones en `backend/src/services/banecoApiClient.js`: `autenticarBaneco({ config })`, `generarQrBaneco({ config, token, datos })`, `consultarQrBaneco({ config, token, qrId })`, `cancelarQrBaneco({ config, token, qrId })` y `conciliarQrBaneco({ config, token, fecha })`, con HTTPS, timeout `config.timeoutMs`, rutas `config.rutas` y cabeceras/payloads verificados contra el sandbox.
3. En `backend/src/services/banecoQrService.js`, validar la configuración y conectar esos métodos al flujo del pedido.
4. Verificar que el pedido exista y esté pendiente; tomar importe/moneda desde la base, nunca del cliente. Guardar la relación entre pedido, identificador de transacción TERRA y `qrId`.
5. Antes de activar rutas funcionales, agregar autorización/vinculación al pedido, límites de solicitudes e idempotencia. Registrar el pago solo después de comprobar en Baneco estado, importe, moneda e identidad de transacción.

No quitar el error `501` para simular una respuesta exitosa mientras falte una operación real y probada.

## Flujo documentado por el manual API Market v1.3.0

1. Solicitar token con `POST /api/authentication/authenticate`. El manual exige enviar un token en la cabecera de las llamadas siguientes, pero el formato exacto debe verificarse en el sandbox.
2. Crear el cobro con `POST /api/qrsimple/generateQR`: usar un identificador de transacción propio, moneda `BOB`, importe exacto, vencimiento, `singleUse: true` y `modifyAmount: false`. Baneco responde `qrId` y `qrImage` en Base64.
3. Consultar `GET /api/qrsimple/v2/statusQR/{id}`. Los estados documentados son `0` pendiente, `1` pagado y `9` anulado; cuando está pagado, se incluye el detalle del pago.
4. Cancelar un QR no pagado con `DELETE /api/qrsimple/cancelQR`. El endpoint opcional de notificación requiere un callback publicado por TERRA. `GET /api/qrsimple/v2/paidQR/{fecha}` está documentado para conciliación diaria.

Antes de programar, probar y confirmar: la URL entregada para el sandbox, la cabecera y vigencia del token, el modo/padding/formato AES, el formato de `dueDate`, la expiración permitida, el callback y la forma exacta del campo `statusQRCode` (el manual también lo escribe `statusQrCode` en un ejemplo).

## Diseño requerido para la implementación

- Toda comunicación y credenciales bancarias permanecen en el backend, por HTTPS y con verificación de certificados activa.
- No crear el QR desde el navegador ni aceptar del navegador una confirmación o referencia como prueba de pago. La confirmación debe salir de consultar Baneco o validar una notificación auténtica del banco.
- Asociar cada QR con un pedido y un identificador único; validar estado, importe, moneda e identificadores del pago antes de registrar `payments`.
- Hacer idempotente la confirmación para evitar doble cobro y conservar estados pendientes/desconocidos para conciliación. No completar el pedido ni emitir éxito mientras el banco no confirme el pago.
- Usar notificación bancaria y conciliación diaria como mecanismos complementarios; verificar autenticidad del callback con Baneco antes de habilitarlo.
- Las pruebas deben usar únicamente el sandbox y credenciales locales, no la cuenta ni servicios de producción.

## Referencia

Manual local proporcionado para esta tarea: `Api Market Baneco v1.3.0.pdf` (Banco Económico S.A.). El manual cubre QR Simple; la integración aún está pendiente de desarrollo y pruebas.
