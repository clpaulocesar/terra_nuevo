---
fecha: 2026-10-30
estado: aceptada
tags: [decision, frontend, ticket, admin]
---

# Un solo diseño de ticket para el cliente, el JPG y la impresión térmica

**Fecha:** 2026-10-30

## Contexto
- El cliente ve el ticket en `features/pedido-generado/components/TicketPedido.jsx` y además recibe un JPG al crear el pedido.
- En el admin había dos salidas independientes: "Descargar JPG" (`descargarTicket.js`) e "Imprimir ticket térmico" (`imprimirTicket.js`). Cada una armaba su propio HTML, con estructura y tamaños distintos al ticket del cliente.
- El diseño del cliente era el de referencia; el ticket del admin se veía más chico y con otra jerarquía.

## Decisión
- `utils/ticketPedidoHtml.js` concentra la plantilla compartida: mismos bloques, iconos, colores y orden que `TicketPedido.jsx`.
- El JPG del cliente y el del admin usan `construirTicketPedidoHtml` con `html-to-image` (`pixelRatio: 2`, ancho de 440 px).
- La impresión térmica usa la misma plantilla y agrega estilos de impresión: `@page` con margen de 6 mm y `main` de 80 mm como máximo.
- Tamaños base: datos a 15 px, código de pedido a 20 px y total a 22 px, para que se lean bien impresos.
- La plantilla usa fuentes del sistema; no depende de Google Fonts.

## Alternativas consideradas
- **Mantener dos plantillas y solo igualar tamaños**: cualquier cambio visual futuro habría que hacerlo dos veces.
- **Capturar el componente React del cliente con `html-to-image`**: depende del DOM montado, de la ruta y de los estilos globales; el ticket del admin no siempre tiene ese componente en pantalla.
- **Generar PDF en el backend**: agrega una dependencia y un viaje al servidor para una acción que hoy es local.

## Consecuencias
- Un cambio de diseño del ticket se hace una sola vez en `ticketPedidoHtml.js`.
- `html-to-image` registra un `SecurityError` al intentar leer la hoja remota de Google Fonts; no impide generar el JPG porque la plantilla no usa esa fuente.
- El ancho de 80 mm es una preparación para impresoras térmicas; si cambia el papel, se ajusta en `imprimirTicket.js`.

Relacionado: [[00-roadmap]] · [[2026-10-28-migracion-tailwind]]
