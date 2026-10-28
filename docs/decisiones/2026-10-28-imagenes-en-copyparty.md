---
fecha: 2026-10-28
estado: aceptada
tags: [decision, imagenes]
---

# Imágenes de producto en copyparty, a través del backend

**Fecha:** 2026-10-28

## Contexto
- Al eliminar Supabase hacía falta otro almacenamiento para las imágenes que sube el administrador.
- El catálogo ya tenía 9.856 imágenes en el copyparty propio, carpeta `imagens/`.
- Se decidió no crear cuentas ni cambiar permisos en copyparty por ahora.

## Decisión
- El navegador manda las imágenes a `POST /api/archivos/productos`: multipart, solo administrador, hasta 5 MB por imagen, tipo real validado por los primeros bytes (JPG, PNG o WEBP). Un PDF renombrado como `.jpg` se rechaza.
- El backend las sube con `PUT {COPYPARTY_URL}/{COPYPARTY_CARPETA_PRODUCTOS}/{nombre}?j` (carpeta por defecto `imagens`) y guarda la `fileurl` que devuelve copyparty.
- `COPYPARTY_PASSWORD` es opcional: si tiene valor se envía la cabecera `PW`; si está vacía se sube sin autenticación. La falta de credenciales no impide arrancar ni subir.
- Nombre del archivo, provisional hasta que Alex confirme la propuesta `CODIGO_campaña_MM-AAAA_N.ext`: `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}`, nunca el nombre original ([[imagenes-nomenclatura]]).
- Además de `products.imagen_url` e `image_urls` (lo que lee el frontend), cada imagen nueva se registra en `product_images` de forma **aditiva**: nunca se borran filas, porque hay imágenes heredadas en base64 y de Cloudinary que no existen en otro lado.
- `express.json` bajó a 1 MB: las fotos ya no viajan en base64.

## Alternativas consideradas
- **Disco local del backend (`UPLOADS_DIR`) servido con `express.static`**: era el plan inicial; descartado porque las imágenes del catálogo ya están en copyparty.
- **Sincronizar `product_images` como espejo exacto de `image_urls`** (borrar y reinsertar): descartada al descubrir 7 filas heredadas que se habrían perdido.

## Consecuencias
- Mientras la cuenta anónima tenga escritura, cualquiera puede subir archivos a copyparty ([[pendientes-terceros]], Oscar).
- La nomenclatura provisional difiere de la heredada (`{codigo_terra}.jpg`) y de la propuesta por campañas; falta que Alex la confirme ([[pendientes-terceros]]).
- Las pruebas usan un copyparty falso, nunca el real.

Relacionado: [[01-arquitectura]] · [[2026-10-28-sin-supabase]]
