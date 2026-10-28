// Botones numerados del paginador del catálogo, con "…" entre saltos.
// Cada salto es un texto `gap-N` (N = la página que le sigue) para usarlo como key.

// Por debajo de este ancho, medido en rem de la raíz, la versión completa no entra
// en una fila. Se mide en rem para que el modo accesible (texto al 125 % o 150 %)
// pase antes a la versión compacta.
export const ANCHO_PAGINADOR_COMPACTO_REM = 30;

export function usarPaginadorCompacto(anchoPx, fuenteRaizPx = 16) {
  const fuente = Number(fuenteRaizPx) > 0 ? Number(fuenteRaizPx) : 16;
  return Number(anchoPx) / fuente < ANCHO_PAGINADOR_COMPACTO_REM;
}

function conSaltos(paginas) {
  const resultado = [];
  paginas.forEach((n, i) => {
    if (i > 0 && n - paginas[i - 1] > 1) resultado.push(`gap-${n}`);
    resultado.push(n);
  });
  return resultado;
}

// Completa: 1 … 4 5 6 … 826. Compacta: 1 … 5 … 826.
export function paginasVisibles(actual, total, { compacta = false } = {}) {
  const limiteTodas = compacta ? 3 : 7;
  if (total <= limiteTodas) return Array.from({ length: Math.max(0, total) }, (_, i) => i + 1);
  const conjunto = new Set([1, total, actual]);
  if (!compacta) {
    [actual - 1, actual + 1].forEach((n) => conjunto.add(n));
    if (actual <= 3) [2, 3, 4].forEach((n) => conjunto.add(n));
    if (actual >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => conjunto.add(n));
  }
  const lista = [...conjunto].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return conSaltos(lista);
}
