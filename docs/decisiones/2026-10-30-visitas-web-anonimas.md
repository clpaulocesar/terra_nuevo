---
fecha: 2026-10-30
estado: aceptada
tags: [decision, analitica, privacidad]
---

# Analítica anónima del sitio público

**Fecha:** 2026-10-30

## Contexto
- Se necesita conocer el volumen de visitas del sitio público y consultar los resultados desde el backoffice.
- El sitio público y el kiosco/backoffice son aplicaciones separadas; esta medición cubre solo el sitio público.
- La métrica debe distinguir vistas de página de sesiones sin identificar a las personas.

## Decisión
- Registrar cada vista de las secciones públicas Inicio, Catálogo, Detalle de producto, Carrito y Finalizar compra.
- Generar un UUID aleatorio por pestaña mediante `sessionStorage` y usarlo solo para agrupar las vistas de esa sesión anónima.
- Guardar únicamente UUID de sesión, ruta canónica y fecha/hora. No almacenar IP, agente de usuario, datos personales, referer ni parámetros de URL.
- Mostrar vistas, sesiones, promedio de vistas por sesión, páginas populares y tráfico diario en una sección de administración con filtro de fechas.
- Proteger la consulta de analítica con autenticación y rol `admin`. La recepción pública acepta únicamente UUID y rutas incluidas en una lista cerrada.

## Alternativas consideradas
- **Contar solo cargas iniciales**: descartada; no mide el recorrido en la SPA.
- **Usar Google Analytics u otro servicio externo**: descartada para mantener los datos dentro del backend y no enviar navegación a terceros.
- **Medir el kiosco al mismo tiempo**: descartada para esta primera fase; sus visitas de operación no representan tráfico del sitio público.
- **Guardar IP, dispositivo o referer**: descartada por no ser necesaria para los indicadores solicitados.

## Consecuencias
- Las sesiones representan pestañas, no personas ni dispositivos; se reinician al cerrar la pestaña.
- No se puede atribuir tráfico por fuente, ubicación o tipo de dispositivo.
- Los datos se guardan en PostgreSQL y el aviso de privacidad del sitio debe explicar esta medición anónima.
- Como siguiente mejora se recomienda medir el embudo agregado Catálogo → Carrito → Pedido completado, sin vincularlo con datos de identidad.

Relacionado: [[01-arquitectura]] · [[00-roadmap]]
