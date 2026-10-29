---
fecha: 2026-10-29
estado: aceptada
tags: [decision, catalogo, stock]
---

# El catálogo no muestra productos con stock 0

**Fecha:** 2026-10-29

## Contexto
- Hasta el 26/10 el listado público (`GET /api/productos` sin `todos`) ocultaba los productos con `stock_quantity` 0. El commit `64d7b7f` ("muestra los que no tienen stock") fijó `conStock = false` para todos los llamados.
- Con eso el kiosco mostraba productos que no se pueden vender, y la casilla "Solo con stock" de Ventas directas (manda `stock=true`) dejó de tener efecto.
- El stock vendible es el del almacén central, reescrito en cada verificación con el ERP ([[2026-10-28-stock-solo-almacen-central]]).

## Decisión
- El filtro es explícito: `GET /api/productos?stock=true` y `GET /api/categorias?stock=true` dejan fuera los productos con `stock_quantity` 0 o nulo. Sin el parámetro se lista todo, como hoy.
- El catálogo del kiosco (`CatalogoContext.jsx`, también el de mayoristas) pide los dos con `stock=true`. Así los conteos de las categorías coinciden con lo que se ve y no aparecen categorías que al tocarlas quedan vacías.
- La ficha de un producto sin stock se sigue abriendo (QR, enlace directo): muestra "Consultar disponibilidad" y el botón de agregar deshabilitado. "Otros modelos" en la ficha e Inicio mayorista no filtran.

## Alternativas consideradas
- **Volver al filtro por defecto de antes del 26/10** (todo llamado sin `todos` filtra): cambia también la ficha, "Otros modelos", Inicio mayorista y Pedidos del admin sin que nadie lo pida.
- **Filtrar en el frontend**: rompe la paginación del servidor (páginas incompletas y totales que no coinciden).

## Consecuencias
- Hasta la fase 2 del ERP (sincronización del catálogo), `stock_quantity` solo se actualiza al verificar un pedido o desde Almacén: un producto con stock real en el ERP pero 0 en la base local no aparece en el kiosco hasta que se actualice.
- La casilla "Solo con stock" de Ventas directas vuelve a funcionar.
- Pruebas en `backend/test/catalogoStock.test.js`.

Relacionado: [[00-roadmap]] · [[erp-terra]] · [[2026-10-28-stock-solo-almacen-central]]
