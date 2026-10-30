---
fecha: 2026-10-30
estado: aceptada
tags: [decision, imagenes]
---

# Una sola foto se sube como {codigo_terra}.jpg y reemplaza la anterior

**Fecha:** 2026-10-30

## Contexto
- La regla provisional de [[2026-10-28-imagenes-en-copyparty]] nombraba toda foto nueva `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}`. Las 9.833 heredadas de copyparty se llaman `{codigo_terra}.jpg` ([[imagenes-nomenclatura]]).
- El admin subía cada foto en su propio pedido y sin el código Terra, así que en la práctica quedaban como `producto_{fecha}_1.jpg`.
- El usuario pidió que una subida de una sola foto use el código Terra como nombre y, si ya existe, reemplace la foto anterior.

## Decisión
- El admin manda todas las fotos elegidas en un solo pedido (`subirImagenesProducto`), con el código Terra que haya en el formulario, aunque el producto no esté guardado todavía.
- Si el pedido trae **una sola** imagen y hay código Terra, el backend la sube como `{codigo_terra}.{ext}` (el admin siempre manda JPG, así que `.jpg`) con la cabecera `Replace: 1`. Con varias imágenes o sin código, sigue la regla anterior.
- Copyparty solo reemplaza si la cuenta tiene permiso de borrar; si no, guarda con un sufijo propio (`COLN00579-<marca>-<ip>.jpg`) sin dar error. El backend compara el nombre de la `fileurl` con el pedido y, si no coincide, lo registra en el log y responde `noReemplazada: true`; el admin muestra un aviso.
- No se agrega `?v=` para invalidar la caché: copyparty interpreta `?v` (devuelve una página HTML) y ya sirve las fotos con `Cache-Control: no-cache` y `Last-Modified`, así que el navegador revalida al cargar la página.
- En la galería del admin, la URL reemplazada no se duplica (vuelve igual que la que ya estaba).

## Alternativas consideradas
- **Usar `{codigo}.jpg` solo si está libre y si no el nombre largo**: no pisa nada, pero casi todos los productos ya tienen `{codigo}.jpg` y el pedido quedaría casi siempre en el nombre largo.
- **Dejar el sufijo de copyparty**: más simple, pero nombres impredecibles y la foto vieja seguiría en la URL que ya usa el producto.

## Consecuencias
- La foto anterior se pierde: en copyparty era la única copia. `product_images` no cambia (la URL es la misma).
- **Hoy no reemplaza**: la cuenta anónima no tiene permiso de borrar. Hace falta la cuenta del backend con escritura y borrado en `imagens/` y su clave en `COPYPARTY_PASSWORD` ([[pendientes-terceros]], Oscar). Mientras tanto la foto se guarda con sufijo y el admin ve el aviso.
- Una página que sigue abierta (el kiosco, la vista previa del admin) puede mostrar la foto anterior hasta recargarse, porque el navegador reutiliza la imagen de la misma URL en memoria.
- Todo producto con un mismo código comparte el archivo: dos productos con el mismo `codigo_terra` se pisan la foto.
- Esta regla convive con la propuesta por campañas pendiente con Alex; si se aprueba, se revisa.

Relacionado: [[2026-10-28-imagenes-en-copyparty]] · [[imagenes-nomenclatura]] · [[00-roadmap]]
