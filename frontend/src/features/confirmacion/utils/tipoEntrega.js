// Tipo de entrega de un producto del pedido. Sin envío todo se retira; el mayorista envía
// todo a su dirección; el cliente minorista elige en Identificación qué productos van a
// domicilio (itemsEnvio guarda lineaId o, en datos antiguos, el id del producto).
export function tipoEntregaItem(item, { quiereEnvio, esFlujoMayorista, itemsEnvio }) {
  if (!quiereEnvio) return 'store_pickup';
  if (esFlujoMayorista) return 'home_delivery';
  if (!Array.isArray(itemsEnvio)) return 'home_delivery';
  const lineaId = String(item.lineaId || '');
  const productoId = String(item.id || item.productoId || '');
  const esEnvio = itemsEnvio.some((guardado) => {
    const id = String(guardado);
    return id === lineaId || id === productoId || (lineaId && lineaId.startsWith(`${id}::`));
  });
  return esEnvio ? 'home_delivery' : 'store_pickup';
}
