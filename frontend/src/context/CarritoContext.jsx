import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SesionClienteContext } from './SesionClienteContext.jsx';

export const CarritoContext = createContext(null);

const escalasValidas = (escalas) => (Array.isArray(escalas) ? escalas : [])
  .map((escala) => ({ minCantidad: Number(escala?.minCantidad), precio: Number(escala?.precio) }))
  .filter((escala) => Number.isSafeInteger(escala.minCantidad) && escala.minCantidad > 0 && Number.isFinite(escala.precio))
  .sort((a, b) => a.minCantidad - b.minCantidad);

const precioParaCantidad = (producto, cantidad, esMayorista) => {
  const precioPublico = Number(producto?.precioPublico ?? producto?.precio);
  if (!esMayorista) return precioPublico;

  const tramo = escalasValidas(producto?.escalasMayorista)
    .filter((escala) => escala.minCantidad <= cantidad)
    .at(-1);
  const precioMayorista = Number(producto?.precioMayorista);
  return Number.isFinite(tramo?.precio)
    ? tramo.precio
    : (Number.isFinite(precioMayorista) ? precioMayorista : precioPublico);
};

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);
  const { esMayorista } = useContext(SesionClienteContext);

  useEffect(() => {
    setItems((anterior) => anterior.map((item) => ({
      ...item,
      precio: precioParaCantidad(item, item.cantidad, esMayorista),
    })));
  }, [esMayorista]);

  const agregarProducto = useCallback((producto, cantidad = 1, opcion = {}) => {
    const id = String(producto?.id || '').trim();
    const precioPublico = Number(producto?.precio);
    const stock = Number(producto?.stock);
    const unidades = Number(cantidad);

    if (!id || !Number.isFinite(precioPublico) ||
        !Number.isSafeInteger(unidades) || unidades < 1 ||
        !Number.isSafeInteger(stock) || stock < 1) return false;

    const color = opcion?.color ? { nombre: opcion.color.nombre, valor: opcion.color.valor } : null;
    const lineaId = `${id}::${color?.valor || color?.nombre || 'sin-color'}`;

    setItems((anterior) => {
      const existente = anterior.find((item) => item.lineaId === lineaId);
      const nuevaCantidad = Math.min(Math.floor(stock), (existente?.cantidad ?? 0) + unidades);
      if (existente?.cantidad === nuevaCantidad) return anterior;

      if (existente) {
        return anterior.map((item) => item.lineaId === lineaId
          ? { ...item, cantidad: nuevaCantidad, precio: precioParaCantidad(item, nuevaCantidad, esMayorista) }
          : item);
      }

      const nuevoItem = {
        id, nombre: producto.nombre, precioPublico, precioMayorista: producto.precioMayorista ?? null,
        escalasMayorista: escalasValidas(producto.escalasMayorista), stock: Math.floor(stock),
        categoria: producto.categoria, imagen_url: producto.imagen_url,
        color, lineaId, cantidad: nuevaCantidad,
      };
      return [...anterior, { ...nuevoItem, precio: precioParaCantidad(nuevoItem, nuevaCantidad, esMayorista) }];
    });
    return true;
  }, [esMayorista]);

  const quitarProducto = useCallback((lineaId) => {
    setItems((anterior) => anterior.filter((item) => item.lineaId !== String(lineaId)));
  }, []);

  const actualizarCantidad = useCallback((lineaId, cantidad) => {
    const n = Number(cantidad);
    if (!Number.isSafeInteger(n)) return;
    setItems((anterior) => anterior
      .map((item) => item.lineaId === String(lineaId)
        ? (() => {
            const nuevaCantidad = Math.min(Math.max(0, n), item.stock);
            return { ...item, cantidad: nuevaCantidad, precio: precioParaCantidad(item, nuevaCantidad, esMayorista) };
          })()
        : item)
      .filter((item) => item.cantidad > 0));
  }, [esMayorista]);

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
