---
actualizado: 2026-10-28
tags: [integracion, imagenes]
---

# Nomenclatura de imágenes de producto

Dónde viven y cómo se suben: [[01-arquitectura]] · Decisión: [[2026-10-28-imagenes-en-copyparty]] · Confirmación pendiente con Alex: [[pendientes-terceros]].

## Lo que hay en copyparty (análisis del 28/10/2026)
- 9.856 imágenes en una sola carpeta, `imagens/`, sin subcarpetas.
- **Nombre = `codigo_terra` + extensión** en 9.833 casos (`ACCE00001.jpg`, `COLN00558.jpg`). Todas empiezan con el código Terra del producto.
- Extensiones: 9.833 `.jpg` y 23 `.webp`.
- Variantes minoritarias:
  - `CODIGO_sufijo.webp` (por ejemplo, un sufijo con el color o la variante);
  - códigos antiguos `TRR-xxxxxx`;
  - unos pocos códigos solo numéricos.
- Sin espacios, tildes ni caracteres codificados; nombres en mayúsculas; largo máximo 41 caracteres.
- 9.909 productos tienen además su galería (`products.image_urls`) apuntando a copyparty.

## Propuesta enviada a Alex: `CODIGO_campaña_MM-AAAA_N.ext`
**Motivo**: la imagen de `ALMO00089` (almohada PARE) muestra Bs 35 y el sistema cobra Bs 40. Las imágenes con precio o promoción impresos quedan desactualizadas cuando cambia el precio o termina la campaña, y hoy nada impide mostrarlas.

| Parte | Regla |
|---|---|
| `CODIGO` | Código del producto. Falta elegir si es el código TERRA o el interno del ERP |
| `campaña` | Opcional. Una de una lista fija en minúsculas: `blackfriday`, `halloween`, etc. Sin campaña, se omite junto con su guion bajo |
| `MM-AAAA` | Mes y año de la imagen |
| `N` | `1` es la imagen principal; `2`, `3`, … son la galería |
| `ext` | `jpg`, `png` o `webp` |

Ejemplos: `ALMO00089_04-2027_1.jpg` (sin campaña) y `ALMO00089_blackfriday_11-2026_1.jpg`.

**Regla de selección**, por producto y por posición `N`:
1. Si hay una campaña activa y existe su imagen, se usa esa.
2. Si no, la imagen sin campaña más reciente (por `MM-AAAA`).
3. Las imágenes de campañas terminadas nunca se muestran.

Para aplicarla hacen falta la lista de campañas con sus fechas y que diseño entregue los archivos con este nombre ([[pendientes-terceros]]). Ni el nombre nuevo ni la regla de selección están implementados todavía.

## Regla provisional para imágenes nuevas
Vale **hasta que Alex responda**: `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}` dentro de `COPYPARTY_CARPETA_PRODUCTOS` (por defecto `imagens`).

- `codigo_terra`: sin tildes ni espacios; solo letras, números, guion y guion bajo; hasta 60 caracteres. Si el producto no tiene código, se usa su id.
- `yyyymmddHHMMss`: fecha y hora de la subida en hora de Bolivia (`America/La_Paz`).
- `n`: posición de la imagen dentro de la misma subida, desde 1.
- `ext`: según el tipo real del archivo (`jpg`, `png` o `webp`); `.jpeg` se guarda como `.jpg`.
- Nunca se usa el nombre original del archivo.
- Ejemplos de la migración desde Supabase: `COLN00579_20261028121011_1.jpg`, `2792_20261028121011_1.png`.

## Comportamiento de copyparty que afecta los nombres
- **No sobrescribe**: si el nombre ya existe, guarda el archivo con un sufijo y devuelve ese nombre en `fileurl`. Por eso se agrega la marca de tiempo y el backend siempre guarda la `fileurl` que devuelve copyparty, no el nombre que pidió.
- Al subir con `?j` responde JSON con `fileurl` y `sha512`.

## Dónde se registra cada imagen
- `products.imagen_url` e `image_urls`: lo que lee el frontend. El catálogo muestra `image_urls[0]` cuando la galería no está vacía.
- `product_images`: registro **aditivo** de cada imagen nueva (orden y principal). Nunca se borran filas: hay 7 filas heredadas con imágenes en base64 y de Cloudinary que no existen en otro lado.

## Pendiente con Alex
Lo que falta para cerrar la propuesta está en [[pendientes-terceros]]: código TERRA o interno, lista de campañas con fechas, y nombres desde diseño. Además conviene resolver:
- Qué pasa con las 9.833 imágenes heredadas `{codigo_terra}.jpg`: si se renombran o se tratan como "sin campaña, más antigua".
- Cómo se reemplaza una imagen del mismo mes, dado que copyparty no sobrescribe un nombre repetido.
- Cómo se nombran las variantes por color (hoy `CODIGO_sufijo.webp` en 23 casos).
- Qué nombre llevarán las imágenes que se importen del ERP en la fase 2 ([[erp-terra]]).
