// Estilos comunes del flujo de compra (Carrito, Identificación y Confirmación):
// única definición de las tarjetas y de los botones grandes de acción.

export const TARJETA_COMPRA = 'rounded-terra-tarjeta border border-terra-borde bg-terra-superficie shadow-terra-panel';

// Sin margen: cada uso agrega el suyo.
export const BOTON_PRINCIPAL = `flex min-h-13.5 w-full items-center justify-center gap-2 rounded-terra-campo border-0
  bg-terra-primario font-extrabold text-terra-sobre-primario shadow-terra-boton transition-colors duration-200
  hover:bg-terra-primario-oscuro disabled:cursor-not-allowed disabled:opacity-55
  disabled:hover:bg-terra-primario motion-reduce:transition-none`;

export const BOTON_SECUNDARIO = `flex min-h-13.5 w-full items-center justify-center gap-2 rounded-terra-campo border
  border-terra-borde bg-terra-superficie font-extrabold text-terra-texto transition-colors duration-200
  hover:bg-terra-superficie-2 motion-reduce:transition-none`;

// Título de sección dentro de una tarjeta ("Detalle de artículos", "Liquidación final").
export const TITULO_SECCION = 'm-0 text-terra-lg font-black tracking-terra-ajustado';
