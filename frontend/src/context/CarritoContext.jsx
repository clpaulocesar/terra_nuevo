import { createContext, useCallback, useMemo, useState } from 'react';

export const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregarProducto = useCallback((producto, cantidad = 1) => {
    const id = Number(producto?.id);
    const precio = Number(producto?.precio);
    const stock = Number(producto?.stock);
    const unidades = Number(cantidad);

    if (!Number.isSafeInteger(id) || id < 1 || !Number.isFinite(precio) ||
        !Number.isSafeInteger(unidades) || unidades < 1 ||
        !Number.isSafeInteger(stock) || stock < 1) return false;

    const existente = items.find((item) => item.id === id);
    const actual = existente?.cantidad ?? 0;
    const nuevaCantidad = Math.min(Math.floor(stock), actual + unidades);
    if (nuevaCantidad === actual) return false;

    setItems((anterior) => {
      const encontrado = anterior.some((item) => item.id === id);
      return encontrado
        ? anterior.map((item) => item.id === id ? { ...item, cantidad: nuevaCantidad } : item)
        : [...anterior, {
            id, nombre: producto.nombre, precio, stock: Math.floor(stock),
            categoria: producto.categoria, imagen_url: producto.imagen_url,
            cantidad: nuevaCantidad,
          }];
    });
    return true;
  }, [items]);

  const quitarProducto = useCallback((id) => {
    setItems((anterior) => anterior.filter((item) => item.id !== Number(id)));
  }, []);

  const actualizarCantidad = useCallback((id, cantidad) => {
    const n = Number(cantidad);
    if (!Number.isSafeInteger(n)) return;
    setItems((anterior) => anterior
      .map((item) => item.id === Number(id)
        ? { ...item, cantidad: Math.min(Math.max(0, n), item.stock) }
        : item)
      .filter((item) => item.cantidad > 0));
  }, []);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const valor = useMemo(() => {
    const cantidadTotal = items.reduce((suma, item) => suma + item.cantidad, 0);
    const centavos = items.reduce(
      (suma, item) => suma + Math.round(item.precio * 100) * item.cantidad, 0
    );
    const subtotal = centavos / 100;
    return {
      items, cantidadTotal, subtotal, total: subtotal,
      agregarProducto, quitarProducto, actualizarCantidad, vaciarCarrito,
    };
  }, [items, agregarProducto, quitarProducto, actualizarCantidad, vaciarCarrito]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}