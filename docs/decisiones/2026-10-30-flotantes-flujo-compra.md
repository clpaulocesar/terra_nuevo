---
fecha: 2026-10-30
estado: aceptada
tags: [decision, frontend, accesibilidad, carrito, tutorial]
---

# Botón de accesibilidad fuera del flujo de compra y carrito flotante sin solapes

**Fecha:** 2026-10-30

## Contexto
- El botón flotante de accesibilidad (`.a11y-flotante`, `z-index: 1300`) quedaba por encima del carrito flotante (`z-75`).
- En teléfono el botón de accesibilidad se alinea con los flotantes (`bottom: var(--terra-flotante-abajo)`) y su círculo de 56 px caía justo sobre la esquina inferior izquierda de "Ver Carrito".
- El tutorial tenía un paso para el carrito flotante, pero el botón del carrito no llevaba `data-tour="carrito-flotante"`. Driver.js lo omitía por no encontrarlo.
- El cajón del carrito usaba `h-screen`; en navegadores móviles el alto visible puede ser menor y el pie del cajón quedaba debajo de la barra del navegador.

## Decisión
- Se agrega la variante `en-flujo-compra` en `index.css`, que reconoce `.cart-page`, `.confirm-page`, `.pedido-page` y `[data-pagina=identificacion]`.
- El botón de accesibilidad lleva `en-flujo-compra:hidden` y `con-carrito-abierto:hidden`: desaparece en Carrito, Identificación, Confirmación y Pedido generado, y también mientras el carrito flotante está abierto en cualquier pantalla.
- El botón del carrito flotante lleva `data-tour="carrito-flotante"` para que el tutorial muestre ese paso.
- El cajón usa `h-dvh` y el pie respeta `env(safe-area-inset-bottom)`, así "Ver Carrito" queda dentro del área visible y de la zona segura.

## Alternativas consideradas
- **Ocultar el botón desde cada página con estado de React**: repetía la condición en cuatro pantallas y no cubría el carrito flotante abierto en el catálogo.
- **Subir el `z-index` del carrito**: el botón de accesibilidad seguiría tapando el enlace en teléfono porque comparten la misma zona.
- **Quitar el botón de accesibilidad solo en Carrito**: Confirmación e Identificación conservaban el mismo solape.

## Consecuencias
- En el flujo de compra no se puede abrir el panel de accesibilidad con el botón ni con Alt + A; al salir del flujo vuelve a estar disponible.
- El tutorial conserva el paso "Carrito flotante" en lugar de saltarlo.
- Si se agrega otra pantalla al flujo de compra, hay que sumarla al selector de `en-flujo-compra`.

Relacionado: [[00-roadmap]] · [[2026-10-28-flotantes-y-catalogo-movil]] · [[2026-10-30-grilla-catalogo-auto-fill]]
