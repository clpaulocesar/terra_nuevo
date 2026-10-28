---
fecha: 2026-10-28
estado: aceptada
tags: [decision, erp, stock]
---

# Para vender solo cuenta ALMACEN CENTRAL

**Fecha:** 2026-10-28

## Contexto
- El ERP devuelve por producto `almacenes[{ almacen, stock }]` y `stockTotal`, que suma todos los almacenes.
- Los nombres de almacén llegan con espacios sobrantes (por ejemplo `" ALMACEN ALEMANA"`).
- El ejemplo de rechazo 422 de la guía del ERP menciona ALMACEN CENTRAL, lo que sugiere que la cotización valida contra ese almacén.

## Decisión
- El stock vendible es el del almacén configurado en `TERRA_ERP_ALMACEN_VENTA` (por defecto `ALMACEN CENTRAL`), comparando nombres con `trim`, espacios internos colapsados y mayúsculas.
- Si ese almacén no aparece en la respuesta, el stock es 0. **Nunca** se usa `stockTotal`.
- `products.stock_quantity` se reescribe con ese valor en cada verificación.
- Todos los almacenes se guardan como referencia en `erp_warehouse_stocks` (uno por fila).
- Si un pedido pide más de lo disponible, la cantidad se reduce; si no hay stock, el ítem se quita. El cajero ve el ajuste antes de cobrar.

## Alternativas consideradas
- **Usar `stockTotal`**: descartada. Mostraría como vendible stock de otros almacenes y la cotización lo rechazaría en caja.
- **Sumar varios almacenes configurables**: no hace falta hoy; la variable admite un solo almacén.

## Consecuencias
- El kiosco muestra el stock de la última verificación; hasta la fase 2 (sincronización del catálogo) puede estar desactualizado antes de llegar a caja ([[00-roadmap]]).
- Pendiente con TERRA: confirmar que la cotización valida contra ALMACEN CENTRAL ([[pendientes-terceros]]).

Relacionado: [[erp-terra]] · [[2026-10-28-cotizacion-al-cobrar]]
