---
fecha: 2026-10-28
estado: aceptada
tags: [decision, erp]
---

# Cotización en el ERP solo al cobrar

**Fecha:** 2026-10-28

## Contexto
- El pedido `TER-XXXXXXXX` que genera el kiosco es nuestra proforma: se crea sin tocar el ERP y en caja se puede editar varias veces mientras está pendiente.
- En el ERP de TERRA cada `POST /api/cotizaciones` crea una cotización nueva: la API no es idempotente.
- El ERP es la fuente de verdad de precio y stock, y estos pueden cambiar entre que el cliente arma el pedido y llega a caja.

## Decisión
- Al abrir el modal de cobro se **verifica** cada ítem contra el ERP (solo lectura): si cambió el precio o hay menos stock, se corrige la base y el pedido, y el cajero ve el total nuevo antes de recibir el dinero.
- Al confirmar el cobro se verifica **otra vez** y la cotización se envía **una sola vez**, solo si esa verificación no cambió nada. Si cambió, se responde `pedido_ajustado` y el cajero reconfirma.
- `orders.erp_estado` (`null | enviando | ok | rechazado | verificar`) funciona como candado: un `UPDATE … WHERE status='pending' AND erp_estado IS NULL OR 'rechazado'` impide dos cobros simultáneos.
- Cada intento queda como fila en `erp_quotations` con `idempotency_key` = id del pedido + número de intento.
- El stock local se descuenta solo después del 201 del ERP, en la misma transacción que completa el pedido y registra el pago ([[2026-10-28-pagos-sin-comprobantes]]).
- Si la cotización no responde (timeout, red, 5xx) el pedido queda en `verificar` y **no se reintenta solo**. Un administrador concilia con `PATCH /api/pedidos/:id/erp/manual` (sí existe, con su número) o `POST /api/pedidos/:id/erp/reintentar` (no existe).

## Alternativas consideradas
- **Cotizar al crear el pedido en el kiosco**: descartada. Muchos pedidos se editan o no se cobran, y cada uno dejaría cotizaciones huérfanas en TERRA.
- **Cotizar en cada edición en caja**: descartada por la misma razón.
- **Reintentar automáticamente ante un timeout**: descartada. Sin idempotencia en el ERP podría duplicar la cotización.

## Consecuencias
- Si el ERP no responde, no se cobra: es la fuente de verdad.
- Los resultados dudosos requieren conciliación manual de un administrador (pestaña "Verificar ERP" en Pedidos).
- El backend tiene que alcanzar la red interna del ERP ([[01-arquitectura]]).
- Pendiente con TERRA: si la cotización reserva stock o solo al facturar ([[pendientes-terceros]]).

Relacionado: [[erp-terra]] · [[2026-10-28-stock-solo-almacen-central]] · [[2026-10-28-ofertas-locales]]
