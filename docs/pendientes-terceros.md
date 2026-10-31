---
actualizado: 2026-10-28
tags: [pendientes]
---

# Pendientes con terceros

Lo que bloquea o condiciona el trabajo y depende de otra persona o equipo. Cuando se resuelva algo, se actualiza aquí y en [[00-roadmap]].

## TERRA (ERP)

### Certificado del ERP
- **Qué falta**: el certificado de la CA de TERRA (`.crt` o `.pem`) para `TERRA_ERP_CA_CERT_PATH`. Tiene que incluir la IP `192.168.0.82` en el SAN.
- **Por qué importa**: el backend nunca desactiva la verificación TLS; sin el certificado no se puede conectar al ERP y no se puede cobrar con el ERP habilitado.
- **Atención**: hoy `backend/.env` tiene `TERRA_ERP_HABILITADO=true` y no tiene `TERRA_ERP_CA_CERT_PATH`. **Debe quedar en `false` hasta tener el certificado**: con `true`, la verificación previa no puede conectarse y **todo cobro falla** (caja y ventas directas responden 503 "No se pudo verificar con TERRA").
- **Mientras tanto**: `TERRA_ERP_HABILITADO=false` (se cobra y se registra el pago, sin cotización ni descuento de stock); las pruebas usan un servidor HTTPS falso.
- Ver [[erp-terra]] · [[01-arquitectura]].

### Precio mayorista en la cotización
- **Qué falta**: definir cómo se refleja el precio B2B (escalas y `precio_mayorista`) en la cotización, que hoy sale a precio público.
- **Mientras tanto**: cobramos el precio mayorista y la cotización registra el precio público. Ver [[2026-10-28-ofertas-locales]].

### Ofertas en la cotización
- **Qué falta**: definir cómo se aplica en el ERP el descuento de una oferta local (`precio_oferta`).
- **Mientras tanto**: la diferencia entre `orders.total_minor` y el total de la cotización (en `erp_quotations.response`) queda para conciliar. Ver [[2026-10-28-ofertas-locales]].

### Otras confirmaciones
- Que la cotización valida stock contra ALMACEN CENTRAL ([[2026-10-28-stock-solo-almacen-central]]).
- Si la cotización reserva stock en el ERP o solo al facturar ([[2026-10-28-cotizacion-al-cobrar]]).

## Banco Económico (Baneco)

### QR dinámico
- **Situación**: se recibió el manual API Market v1.3.0; se prepararon configuración/validación sandbox y rutas backend que responden `501`. No hay llamadas a Baneco y el QR estático se retiró.
- **Qué falta confirmar para implementar**: URL y credenciales del sandbox, llave AES, cuenta de abono, encabezado del token, modo/formato de cifrado, vigencia de token/QR y si se habilitará el callback.
- **Seguridad**: valores sensibles solo en `backend/.env`; nunca compartirlos por chat, añadirlos al frontend ni versionarlos.
- Ver [[qr-baneco]] · [[2026-10-30-preparacion-qr-dinamico-baneco]].

## Oscar (infraestructura)

### TLS en PostgreSQL
- **Situación**: la base de producción conecta sin TLS (`DB_SSL` no está definido).
- **Qué falta**: habilitar TLS en el servidor y entregar su certificado de CA. Hoy, con `DB_SSL=true`, el backend cifraría pero sin verificar el certificado.
- **Después**: `DB_SSL=true` en `backend/.env` y verificación del certificado en `backend/src/config/database.js`.

### Escritura anónima en copyparty
- **Situación**: la cuenta anónima tiene permisos de lectura y escritura sobre el raíz e `imagens/`. Cualquiera puede subir archivos y listar todo; borrar sí requiere cuenta.
- **Qué falta**: una cuenta para el backend con escritura en `imagens/`, y solo lectura (o solo descarga directa, sin listado) para anónimos.
- **Después**: cargar la clave en `COPYPARTY_PASSWORD`; el backend ya envía la cabecera `PW` cuando tiene valor.
- Ver [[2026-10-28-imagenes-en-copyparty]].

## Alex

### Nomenclatura de imágenes
- **Propuesta enviada**: `CODIGO_campaña_MM-AAAA_N.ext`, con regla de selección por campaña. Detalle y motivo en [[imagenes-nomenclatura]].
- **Qué falta**:
  - elegir qué código va en el nombre: el código TERRA (`codigo_terra`) o el código interno del ERP;
  - la lista fija de campañas con sus fechas de inicio y fin;
  - que diseño nombre así las imágenes nuevas.
- **Mientras tanto**: se aplica la regla provisional `{codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}`.
