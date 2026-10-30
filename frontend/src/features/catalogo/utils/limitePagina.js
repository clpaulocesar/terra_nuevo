// Tamaño de página del catálogo según las columnas reales de la grilla (auto-fill), para
// que todas las filas queden completas salvo en la última página.

const MINIMO = 12;
// Con 1 o 2 columnas (teléfono, tablet vertical) cada fila es casi una pantalla: 12
// tarjetas. Desde 3 columnas el objetivo sube a 16 (3 → 15, 4 → 16, 5 → 15, 6 → 18).
const OBJETIVO_ANGOSTO = 12;
const OBJETIVO = 16;
// El backend rechaza limite > 200.
const MAXIMO_BACKEND = 200;

// Cantidad de columnas de un grid-template-columns ya resuelto por el navegador
// ("268px 268px 268px" → 3). "none" o vacío (sin grilla) → 0.
export function contarColumnas(valor) {
  const texto = String(valor || '').trim();
  if (!texto || texto === 'none') return 0;
  return texto.split(/\s+/).length;
}

// Múltiplo de las columnas más cercano al objetivo, con al menos 12 tarjetas y sin
// pasar de 200.
export function limitePorColumnas(columnas) {
  const cantidad = Math.max(1, Math.floor(Number(columnas)) || 1);
  const objetivo = cantidad <= 2 ? OBJETIVO_ANGOSTO : OBJETIVO;
  const filas = Math.max(Math.ceil(MINIMO / cantidad), Math.round(objetivo / cantidad));
  const tope = Math.floor(MAXIMO_BACKEND / cantidad) * cantidad || MAXIMO_BACKEND;
  return Math.min(filas * cantidad, tope);
}

// Página (desde 1) que contiene el producto en la posición `indice` (desde 0) del
// listado completo, con `limite` productos por página.
export function paginaConProducto(indice, limite) {
  return Math.floor(Math.max(0, indice) / Math.max(1, limite)) + 1;
}
