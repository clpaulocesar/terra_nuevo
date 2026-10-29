---
fecha: 2026-10-29
estado: aceptada
tags: [decision, estilos, carrito, accesibilidad]
---

# La hoja del resumen siempre por encima del pie, con alto medido

**Fecha:** 2026-10-29

## Contexto
- En una tablet en vertical (Chrome Android), en Carrito no se veía el total ni "Continuar y generar pedido": debajo de las líneas quedaba un bloque vacío y luego el pie "Contacto y ubicación".
- Producción (`origin/main` `c4041f9`, mismo `frontend/` que `jhonatan` `9e2b009`) une dos cambios del mismo día: el pie nuevo de `684e119` (`relative z-30`) y la hoja inferior de la fase 3 de Tailwind ([[2026-10-28-migracion-tailwind]]), fija con `z-30` por debajo de 761 px. Con el mismo z-index gana el que va después en el DOM: el pie tapaba la hoja en cuanto llegaba al fondo de la pantalla. El "bloque vacío" era la reserva de 8.5 rem que la página dejaba para la hoja.
- A 768, 800 y 884 px el resumen es una tarjeta en el flujo y no se reproduce. Coincide con la descripción del bug por debajo de 761 px de ancho CSS (por ejemplo, una tablet de 1280 × 800 px físicos con densidad 1.33 mide 601 px CSS en vertical). Confirmación tenía el mismo problema.
- Además, la hoja cerrada medía 8.5 rem fijos: con texto al 100 % le faltaban 10 px y a 360–412 px con texto al 125–150 % "Total a pagar en caja" ocupaba de 3 a 5 líneas y el botón quedaba cortado debajo de la barra inferior.

## Decisión
- El pie (`PieCliente.jsx`) va en el flujo, sin `position` ni `z-index`: nunca puede quedar por encima de la hoja.
- La reserva para la hoja la hace el pie, al final de la página (su `padding-bottom` ya usa `--terra-flotante-abajo`, que `LayoutCliente` sube por encima de la hoja). Se quitó la reserva de Carrito y Confirmación, que dejaba el hueco vacío entre las líneas y el pie. En el carrito la reserva del pie suma además el botón de accesibilidad (`--terra-a11y-reserva`), que tapaba su última línea.
- El alto de la hoja cerrada es una variable de ejecución, `--terra-hoja-alto` (8.5 rem por defecto, en `index.css`). `useHojaInferior` la mide con un `ResizeObserver` sobre los hijos de la hoja y la escribe en `<html>`. Con ella se calculan el alto máximo de la hoja cerrada, la posición de los flotantes y la reserva del pie. Al desmontar la hoja, se borra.
- Con la hoja cerrada, si la etiqueta no entra al lado del monto, el monto pasa a su propia línea (`flex-wrap` en `TotalesCompra`).
- El asa no depende de las reglas forzadas del modo accesible. Con "Botones grandes" se convertía en un recuadro vacío de 48 px (en contraste, con borde amarillo y la barra negra sobre negro). La barra se dibuja con `::after`; la zona de toque es un `::before` de 48 px que no ocupa lugar. En `accesibilidad.css`, la clase gancho `hoja-asa` la excluye de los 48 px mínimos y del estilo de botón de alto contraste, con `:where(:not(.hoja-asa))` para no cambiar la especificidad (si no, la regla de `:hover` del contraste dejaría de ganar).

## Alternativas consideradas
- **Solo bajar el z-index del pie**: el botón seguía cortado con texto grande y el hueco vacío seguía ahí.
- **Hoja `sticky` en vez de `fixed`**: reserva su lugar sola, pero cambia su ancho (quedaría dentro del margen del `main`) y el área donde se mantiene pegada (en Confirmación empezaría después del encabezado y del aviso). Además, al abrirla tendría que volver a ser `fixed`, con un salto del contenido.
- **Subir el token fijo a ~10.5 rem**: cubre el texto grande, pero deja 2 rem vacíos en la hoja en el caso normal.

## Consecuencias
- Con texto al 100 % la hoja cerrada mide 145 px (antes 136, con el margen inferior cortado).
- Si se agrega contenido visible a la hoja cerrada, la reserva se ajusta sola.
- Script de reproducción y capturas (fuera del repo): `bug-carrito.cjs` del scratchpad de la sesión, que compara `684e119`, producción y la corrección.

Relacionado: [[00-roadmap]] · [[2026-10-28-migracion-tailwind]]
