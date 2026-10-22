const QR_CART_KEY = 'terra_qr_cart_v1';
const QR_CART_TTL_MS = 2 * 60 * 60 * 1000;

export function leerCarritoQr() {
  const guardado = localStorage.getItem(QR_CART_KEY);
  if (!guardado) return [];

  let borrador;
  try {
    borrador = JSON.parse(guardado);
  } catch {
    localStorage.removeItem(QR_CART_KEY);
    return [];
  }

  const edad = Date.now() - Number(borrador?.actualizadoEn);
  if (
    borrador?.version !== 1 ||
    !Number.isFinite(edad) ||
    edad < 0 ||
    edad > QR_CART_TTL_MS ||
    !Array.isArray(borrador.items)
  ) {
    localStorage.removeItem(QR_CART_KEY);
    return [];
  }

  return borrador.items.filter((item) =>
    item &&
    typeof item.id === 'string' &&
    typeof item.nombre === 'string' &&
    Number.isFinite(Number(item.precio)) &&
    Number.isSafeInteger(Number(item.stock)) &&
    Number(item.stock) > 0 &&
    Number.isSafeInteger(Number(item.cantidad)) &&
    Number(item.cantidad) > 0 &&
    Number(item.cantidad) <= Number(item.stock)
  );
}

export function agregarProductoCarritoQr(producto) {
  const id = String(producto?.id || '').trim();
  const nombre = String(producto?.nombre || '').trim();
  const precio = Number(producto?.precio);
  const stock = Math.floor(Number(producto?.stock));
  if (!id || !nombre || !Number.isFinite(precio) || !Number.isSafeInteger(stock) || stock < 1) {
    return { agregado: false, motivo: 'no-disponible', items: leerCarritoQr() };
  }

  const items = leerCarritoQr();
  const existente = items.find((item) => item.id === id && !item.color);
  if (existente && existente.cantidad >= stock) {
    return { agregado: false, motivo: 'stock-maximo', items };
  }

  if (existente) {
    existente.cantidad += 1;
  } else {
    items.push({
      id,
      nombre,
      precio,
      stock,
      categoria: String(producto.categoria || 'Sin categoría'),
      imagen_url: producto.imagen_url || null,
      color: null,
      cantidad: 1,
    });
  }

  localStorage.setItem(QR_CART_KEY, JSON.stringify({ version: 1, actualizadoEn: Date.now(), items }));
  return { agregado: true, items };
}

// Ajusta la cantidad de una línea del borrador QR (1..stock). Con 0 la quita.
export function actualizarCantidadCarritoQr(id, cantidad) {
  const items = leerCarritoQr();
  const indice = items.findIndex((item) => item.id === String(id) && !item.color);
  if (indice === -1) return items;
  const nueva = Math.floor(Number(cantidad));
  if (!Number.isSafeInteger(nueva) || nueva < 1) {
    items.splice(indice, 1);
  } else {
    items[indice].cantidad = Math.min(nueva, Number(items[indice].stock));
  }
  localStorage.setItem(QR_CART_KEY, JSON.stringify({ version: 1, actualizadoEn: Date.now(), items }));
  return items;
}

export function limpiarCarritoQr() {
  localStorage.removeItem(QR_CART_KEY);
}
