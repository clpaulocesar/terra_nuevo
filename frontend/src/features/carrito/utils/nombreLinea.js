// Nombre de producto en una sola línea: algunos nombres importados del ERP traen
// saltos de línea, tabulaciones o espacios repetidos.
export function nombreEnUnaLinea(nombre) {
  return String(nombre ?? '').replace(/\s+/g, ' ').trim();
}

// Las líneas del carrito se identifican por lineaId (producto + color); las antiguas, por id.
export function idLinea(item) {
  return item.lineaId || item.id;
}
