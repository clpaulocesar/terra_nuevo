---
fecha: 2026-10-30
estado: aceptada
tags: [decision, frontend, imagenes, accesibilidad]
---

# Logo de reemplazo de las fotos de producto en un solo componente

**Fecha:** 2026-10-30

## Contexto
- Hay productos con `imagen_url` rota (404, HTML en lugar de imagen o error de red; ver [[imagenes-nomenclatura]] y [[2026-10-28-imagenes-en-copyparty]]). En varias pantallas se veía el texto alternativo del navegador ("SABARA") en lugar de la foto.
- El reemplazo dependía de `usarImagenFallback`, que cambiaba el `src` y la clase del `<img>` directamente en el DOM y marcaba `data-fallback` para no repetirse. Problemas:
  - el carrito y la identificación no lo usaban;
  - en la ficha, al pasar de una foto rota a otra en el mismo `<img>`, la marca quedaba puesta y la segunda foto mostraba el texto;
  - cada pantalla decidía por su cuenta qué mostrar sin URL (logo, ícono de carrito o de paquete) y cómo estilizar el logo.
- La caligrafía del logo es oscura: en modo noche y alto contraste, sobre el fondo de la tarjeta, no se lee (antes la ficha usaba una placa propia solo en modo noche y en alto contraste quedaba negro sobre negro).

## Decisión
- `components/ui/ImagenProducto.jsx` es la única forma de mostrar una foto de producto. Guarda en su estado la URL que falló, no un booleano: si cambia `src` vuelve a intentar, sin efectos. La lógica pura está en `fuenteImagenProducto` (`utils/imagenProducto.js`) y tiene pruebas.
  - Sin URL muestra el logo directamente, sin pedir nada.
  - Si la foto falla, pone el logo en la misma caja; si el logo también falla, ya no tiene `onError` y no se reintenta.
  - El `alt` es siempre el que pasa quien lo usa (el nombre del producto). `text-transparent` evita que se pinte si algo no carga, y los lectores de pantalla lo siguen leyendo.
  - `perezosa` usa `ImagenPerezosa` (catálogo).
  - Marca `data-reemplazo` para que cada pantalla ajuste el logo (`data-reemplazo:p-1` en las miniaturas del carrito).
- El logo va centrado, con relleno (15 %) y sobre `bg-terra-fondo-imagen`, el fondo blanco de las fotos, igual en los tres temas: se ve como una foto más. En alto contraste, `accesibilidad.css` excluye `[data-reemplazo]` de las reglas que vacían el fondo de imágenes y del contenido de botones (miniaturas de la ficha e Identificación).
- Se borran `usarImagenFallback`, `imagenDeProducto`, la clase `img-fallback` y la placa propia de la ficha. Los íconos de carrito y paquete sin foto se reemplazan por el logo.

## Alternativas consideradas
- **Mantener `usarImagenFallback` y agregarlo donde faltaba**: seguía sin arreglar el `<img>` reutilizado de la ficha, y cualquier re-render que tocara `className` borraba la clase del logo.
- **Placa clara solo en modo noche (como tenía la ficha)**: en alto contraste las reglas forzadas la anulaban igual, y la tarjeta del catálogo ya tiene fondo blanco en todos los temas.
- **Ocultar la imagen si el logo falla** (`visibility: hidden`): la saca del árbol de accesibilidad y se pierde el nombre del producto.

## Consecuencias
- En modo noche y alto contraste, un producto sin foto se ve como un recuadro blanco con el logo, igual que una foto con fondo blanco.
- Las hojas heredadas de Inicio mayorista, Categorías y Ventas directas siguen fijando `object-fit` y tamaño de sus `<img>` y le ganan a las utilidades; el reemplazo funciona igual, solo cambia el encuadre del logo en esas pantallas.
- Al fusionar `fix/reparar-imagenes` habrá conflictos en `LineaCarrito.jsx`, `TarjetaItemEnvio.jsx`, `InicioMayorista.jsx`, `utils/imagenProducto.js` y su prueba: hay que quedarse con la versión de este cambio.

Relacionado: [[00-roadmap]] · [[2026-10-28-imagenes-en-copyparty]] · [[2026-10-30-grilla-catalogo-auto-fill]]
