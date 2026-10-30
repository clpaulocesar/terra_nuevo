---
fecha: 2026-10-29
estado: aceptada
tags: [decision, textos, accesibilidad]
---

# Textos de la tienda en español neutro de Bolivia (tú)

**Fecha:** 2026-10-29

## Contexto
- La tienda y el kiosco mezclaban voseo ("Revisá tu pedido", "Podés decir…", "Decime") con tuteo. El público es boliviano y en Bolivia el registro esperado en un comercio es el tuteo.

## Decisión
- Todo texto para el cliente (pantallas, `aria-label`, mensajes de error y lo que se lee en voz alta) va en tú: "Revisa", "Puedes", "Di", "Dime", "agrégalos".
- El 29/10 se corrigieron 88 textos en `frontend/src/` del cliente (carrito, identificación, confirmación, ticket, catálogo y escáner QR, ficha, Categorías, navegación por voz y accesibilidad) y 15 en `public/detalle-qr.html` (página del QR).
- No es voseo y no cambia la primera persona del asistente de voz: "No entendí", "No encontré", "No escuché", "No recibí".

## Alternativas consideradas
- **Usted**: más formal, pero los textos ya estaban escritos en segunda persona de confianza y el kiosco apunta a un trato cercano.

## Consecuencias
- Falta, como tarea aparte en [[00-roadmap]]: el panel de administración y de vendedores (`src/pages/admin`, `src/pages/vendedor`, `src/components/admin`, `services/envioService.js`) y los mensajes del backend (por ejemplo, en [[erp-terra]]).

Relacionado: [[00-roadmap]]
