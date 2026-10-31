---
fecha: 2026-10-30
estado: aceptada
tags: [decision, pagos, qr]
---

# Preparar QR dinámico Baneco sin activar la API

**Fecha:** 2026-10-30

**Actualización:** se añadió un andamiaje backend con validación de configuración sandbox, validación de entradas y rutas de contrato que responden `501` mientras no exista el cliente Baneco. La decisión de no llamar al banco ni confirmar pagos sigue vigente.

## Contexto

- El kiosco mostraba una imagen QR fija (`QRPAGO.jpeg`) junto al total del pedido, y el modal reutilizado por administración y ventas directas también mostraba esa imagen.
- Se dispone del manual API Market Baneco v1.3.0 y de un API de prueba; las credenciales se configuran localmente y no se guardan en la documentación ni en el repositorio.
- El flujo actual del kiosco crea pedidos pendientes para pago en caja; no tiene confirmación automática con un proveedor QR.

## Decisión

- Retirar la imagen QR fija y sustituirla por un estado explícito de integración pendiente. No indicar que el cliente puede escanear un código inexistente ni que el pedido fue pagado.
- Preparar en `backend/.env.example` la URL de certificación y valores vacíos para secretos/cuenta; validar solo el sandbox documentado.
- Añadir servicio, controlador y rutas de contrato para generación, consulta y cancelación que respondan explícitamente `501` hasta que el propietario implemente cliente API y cifrado AES en módulos separados. No añadir callbacks ni llamadas a Baneco.
- Mantener credenciales y cifrado exclusivamente en backend; los pagos siguen sin confirmarse hasta una futura integración con el banco.
- Documentar el contrato conocido y las verificaciones pendientes en [[qr-baneco]].

## Alternativas

- **Mantener el QR fijo mientras se implementa el dinámico**: descartada porque puede aceptar pagos sin importe o referencia verificables.
- **Conectar Baneco ahora**: descartada porque esta etapa prepara el andamiaje, pero la implementación del cliente y sus pruebas contra el sandbox las hará el propietario.
- **Mostrar el QR codificado directamente en el frontend**: descartada porque expondría credenciales/datos bancarios y no permitiría confirmar el pago de forma confiable.

## Consecuencias

- Los usuarios ya no pueden escanear el QR desde el kiosco; deben presentar el pedido en caja mientras el QR dinámico no esté implementado.
- Las rutas nuevas nunca simulan éxito: responden `501` y no cambian el comportamiento del checkout ni registran pagos. La futura implementación debe validar el estado e importe en Baneco y registrar el pago de forma idempotente.
- El sandbox, las credenciales, el cifrado y la vigencia del QR deben probarse antes de habilitar cobros.

Relacionado: [[qr-baneco]] · [[2026-10-28-pagos-sin-comprobantes]] · [[01-arquitectura]]
