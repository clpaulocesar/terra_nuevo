import { createContext, useCallback, useMemo, useState } from 'react';

export const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregarProducto = useCallback((producto, cantidad = 1, opcion = {}) => {
    const id = String(producto?.id || '').trim();
    const precio = Number(producto?.precio);
    const stock = Number(producto?.stock);
    const unidades = Number(cantidad);

    if (!id || !Number.isFinite(precio) ||
        !Number.isSafeInteger(unidades) || unidades < 1 ||
        !Number.isSafeInteger(stock) || stock < 1) return false;

    const color = opcion?.color ? { nombre: opcion.color.nombre, valor: opcion.color.valor } : null;
    const lineaId = `${id}::${color?.valor || color?.nombre || 'sin-color'}`;
    const existente = items.find((item) => item.lineaId === lineaId);
    const actual = existente?.cantidad ?? 0;
    const nuevaCantidad = Math.min(Math.floor(stock), actual + unidades);
    if (nuevaCantidad === actual) return false;

    setItems((anterior) => {
      const encontrado = anterior.some((item) => item.lineaId === lineaId);
      return encontrado
        ? anterior.map((item) => item.lineaId === lineaId ? { ...item, cantidad: nuevaCantidad } : item)
        : [...anterior, {
            id, nombre: producto.nombre, precio, stock: Math.floor(stock),
            categoria: producto.categoria, imagen_url: producto.imagen_url,
            color, lineaId, cantidad: nuevaCantidad,
          }];
    });
    return true;
  }, [items]);

  const quitarProducto = useCallback((lineaId) => {
    setItems((anterior) => anterior.filter((item) => item.lineaId !== String(lineaId)));
  }, []);

  const actualizarCantidad = useCallback((lineaId, cantidad) => {
    const n = Number(cantidad);
    if (!Number.isSafeInteger(n)) return;
    setItems((anterior) => anterior
      .map((item) => item.lineaId === String(lineaId)
        ? { ...item, cantidad: Math.min(Math.max(0, n), item.stock) }
        : item)
      .filter((item) => item.cantidad > 0));
  }, []);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const importarProductosQr = useCallback((productos) => {
    if (!Array.isArray(productos)) return;

    setItems((anterior) => {
      const siguientes = [...anterior];
      for (const producto of productos) {
        const id = String(producto?.id || '').trim();
        const precio = Number(producto?.precio);
        const stock = Number(producto?.stock);
        const cantidad = Number(producto?.cantidad);
        if (!id || !Number.isFinite(precio) ||
            !Number.isSafeInteger(stock) || stock < 1 ||
            !Number.isSafeInteger(cantidad) || cantidad < 1) continue;

        const color = producto.color
          ? { nombre: producto.color.nombre, valor: producto.color.valor }
          : null;
        const lineaId = `${id}::${color?.valor || color?.nombre || 'sin-color'}`;
        const existente = siguientes.find((item) => item.lineaId === lineaId);
        const actual = existente?.cantidad ?? 0;
        const nuevaCantidad = Math.min(stock, actual + cantidad);
        if (nuevaCantidad === actual) continue;
        if (existente) {
          existente.cantidad = nuevaCantidad;
        } else {
          siguientes.push({
            id,
            nombre: String(producto.nombre),
            precio,
            stock,
            categoria: producto.categoria || 'Sin categoría',
            imagen_url: producto.imagen_url || null,
            color,
            lineaId,
            cantidad: nuevaCantidad,
          });
        }
      }
      return siguientes;
    });
  }, []);

  const valor = useMemo(() => {
    const cantidadTotal = items.reduce((suma, item) => suma + item.cantidad, 0);
    const centavos = items.reduce(
      (suma, item) => suma + Math.round(item.precio * 100) * item.cantidad, 0
    );
    const subtotal = centavos / 100;
    return {
      items, cantidadTotal, subtotal, total: subtotal,
      agregarProducto, importarProductosQr, quitarProducto, actualizarCantidad, vaciarCarrito,
    };
  }, [items, agregarProducto, importarProductosQr, quitarProducto, actualizarCantidad, vaciarCarrito]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
