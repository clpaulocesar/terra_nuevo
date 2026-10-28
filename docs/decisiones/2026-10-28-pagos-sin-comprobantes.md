---
fecha: 2026-10-28
estado: aceptada
tags: [decision, pagos]
---

# Los cobros se registran en `payments`, sin comprobantes

**Fecha:** 2026-10-28

## Contexto
- Antes, el modal de cobro permitía subir una imagen de comprobante a Supabase Storage y guardaba su URL en `orders.payment_receipt_url`.
- El plan intermedio era guardar los comprobantes en copyparty y servirlos con un proxy autenticado. Se cambió el alcance: no se suben comprobantes.
- La base ya tenía la tabla `payments`, vacía y sin uso.

## Decisión
- El cobro en caja, la venta directa y la conciliación `PATCH /api/pedidos/:id/erp/manual` insertan una fila en `payments` **dentro de la misma transacción** que completa el pedido, cierra la cotización y descuenta stock ([[2026-10-28-cotizacion-al-cobrar]]):
  - `provider`: efectivo, tarjeta o qr;
  - `provider_transaction_id`: número de referencia o transacción, obligatorio para qr y tarjeta;
  - `amount_minor` y `currency`: el total cobrado;
  - `status`: `approved`;
  - `paid_at`: fecha y hora del cobro;
  - `registered_by`: cuenta de `staff_accounts` que cobró (columna agregada con FK).
- Se quitó la subida de comprobante del modal y se agregó el campo de referencia. Se habilitó el método QR.
- `orders.payment_method` y `payment_confirmed_at` se siguen escribiendo para no romper listados y reportes. `orders.payment_receipt_url` queda sin uso y no se borra.

## Alternativas consideradas
- **Comprobantes en copyparty con proxy autenticado**: descartada por cambio de alcance.
- **`status = 'completed'`**: el CHECK de la tabla solo admite `pending | approved | rejected | refunded`; se usa `approved` en lugar de modificar la restricción.

## Consecuencias
- No queda evidencia en imagen del pago; la conciliación se hace por el número de referencia.
- Un cobro ajustado, rechazado o fallido no crea filas en `payments`; uno correcto crea exactamente una (cubierto por pruebas).

Relacionado: [[erp-terra]] · [[2026-10-28-sin-supabase]]
