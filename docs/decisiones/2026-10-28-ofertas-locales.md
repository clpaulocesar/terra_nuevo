---
fecha: 2026-10-28
estado: aceptada
tags: [decision, erp, precios]
---

# Las ofertas se definen localmente

**Fecha:** 2026-10-28

## Contexto
- El ERP es la fuente de verdad del precio público (`precioPublico`).
- Las ofertas (`products.en_oferta`, `products.precio_oferta`) y los precios mayoristas (`precio_mayorista`, `wholesale_price_tiers`) existen solo en nuestra base; el ERP no los conoce.

## Decisión
- En cada verificación `products.public_price` se reescribe siempre con el `precioPublico` del ERP.
- Precio que se cobra por ítem:
  - si el producto está en oferta (`en_oferta = true` y `precio_oferta > 0`), `precio_oferta`;
  - si no, el `precioPublico` del ERP.
- Mayoristas: se mantiene la regla actual (escala por cantidad o `precio_mayorista`), a la espera de definir con TERRA cómo se refleja en la cotización.
- La verificación nunca toca `precio_oferta`, `en_oferta`, `precio_mayorista`, escalas, imágenes, descripción, categoría ni `slug`: son datos propios del sistema.

## Alternativas consideradas
- **Cobrar siempre el precio del ERP e ignorar las ofertas locales**: descartada; dejaría sin efecto las promociones del kiosco.
- **Cargar las ofertas en el ERP**: no depende de nosotros; queda como consulta a TERRA.

## Consecuencias
- La cotización del ERP sale a precio público aunque cobremos `precio_oferta` o precio mayorista. La diferencia entre `orders.total_minor` y el total que devuelve el ERP (guardado en `erp_quotations.response`) hay que conciliarla.
- Pendiente con TERRA: cómo aplicar descuentos de oferta y precio B2B en la cotización ([[pendientes-terceros]]).

Relacionado: [[erp-terra]] · [[2026-10-28-cotizacion-al-cobrar]]
