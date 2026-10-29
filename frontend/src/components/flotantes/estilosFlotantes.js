// Única definición de la posición de los botones flotantes de la tienda: asistente
// (abajo), carrito (medio) y QR (arriba), apilados con el mismo margen derecho.
// Las medidas son tokens de index.css (--terra-flotante-*), que cambian en teléfono
// y se suben en Confirmación (ver LayoutCliente).
export const POSICION_ASISTENTE = 'fixed right-terra-flotante-derecha bottom-terra-flotante-abajo';

export const POSICION_CARRITO = `fixed right-terra-flotante-derecha
  bottom-[calc(var(--terra-flotante-abajo)+var(--terra-flotante-tamano)+var(--terra-flotante-separacion))]`;

export const POSICION_QR = `fixed right-terra-flotante-derecha
  bottom-[calc(var(--terra-flotante-abajo)+(var(--terra-flotante-tamano)+var(--terra-flotante-separacion))*2)]`;

// En el carrito los flotantes se ocultan: la página ya muestra sus propios controles
// (sin desmontarlos, para no perder la conversación del asistente).
export const OCULTO_EN_CARRITO = 'en-carrito:hidden';

// Mientras el asistente o el carrito están abiertos, los demás flotantes se ocultan.
export const OCULTO_CON_ASISTENTE = `con-asistente-abierto:pointer-events-none con-asistente-abierto:invisible
  con-asistente-abierto:opacity-0`;
export const OCULTO_CON_CARRITO = `con-carrito-abierto:pointer-events-none con-carrito-abierto:invisible
  con-carrito-abierto:opacity-0`;

// Botón circular común (QR, carrito y asistente).
// Sin display: cada uso agrega inline-flex (o hidden).
export const BOTON_FLOTANTE = `size-terra-flotante items-center justify-center rounded-full
  bg-terra-primario text-terra-sobre-primario shadow-terra-flotante transition duration-150
  hover:-translate-y-px hover:bg-terra-primario-oscuro active:scale-97`;
