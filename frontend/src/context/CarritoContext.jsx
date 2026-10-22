import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SesionClienteContext } from './SesionClienteContext.jsx';

export const CarritoContext = createContext(null);
const CARRITO_STORAGE_KEY = 'terra_cart_v1';
const CARRITO_TTL_MS = 2 * 60 * 60 * 1000;

function leerCarritoGuardado() {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = JSON.parse(localStorage.getItem(CARRITO_STORAGE_KEY) || 'null');
    const edad = Date.now() - Number(guardado?.actualizadoEn);
    if (
      guardado?.version !== 1 ||
      !Number.isFinite(edad) ||
      edad < 0 ||
      edad > CARRITO_TTL_MS ||
      !Array.isArray(guardado.items)
    ) {
      localStorage.removeItem(CARRITO_STORAGE_KEY);
      return [];
    }

    return guardado.items.reduce((validos, item) => {
      const id = String(item?.id || '').trim();
      const nombre = String(item?.nombre || '').trim();
      const precio = Number(item?.precio);
      const stock = Math.floor(Number(item?.stock));
      const cantidad = Math.floor(Number(item?.cantidad));
      if (!id || !nombre || !Number.isFinite(precio) || !Number.isSafeInteger(stock) || stock < 1 || !Number.isSafeInteger(cantidad) || cantidad < 1) return validos;

      const color = item?.color && typeof item.color === 'object'
        ? { nombre: String(item.color.nombre || ''), valor: String(item.color.valor || '') }
        : null;
      const lineaId = `${id}::${color?.valor || color?.nombre || 'sin-color'}`;
      validos.push({
        id,
        nombre,
        precio,
        precioPublico: Number.isFinite(Number(item?.precioPublico)) ? Number(item.precioPublico) : precio,
        precioMayorista: Number.isFinite(Number(item?.precioMayorista)) ? Number(item.precioMayorista) : null,
        stock,
        categoria: String(item?.categoria || 'Sin categoría'),
        imagen_url: item?.imagen_url || null,
        color,
        lineaId,
        cantidad: Math.min(cantidad, stock),
      });
      return validos;
    }, []);
  } catch {
    localStorage.removeItem(CARRITO_STORAGE_KEY);
    return [];
  }
}

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
  const valorMayorista = producto?.precioMayorista;
  const precioMayorista = valorMayorista === null || valorMayorista === undefined || valorMayorista === ''
    ? Number.NaN
    : Number(valorMayorista);
  return Number.isFinite(tramo?.precio)
    ? tramo.precio
    : (Number.isFinite(precioMayorista) ? precioMayorista : precioPublico);
};

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);
  const [entregaDomicilio, setEntregaDomicilio] = useState(false);
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

  const vaciarCarrito = useCallback(() => {
    setItems([]);
    setEntregaDomicilio(false);
  }, []);

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
      entregaDomicilio, setEntregaDomicilio,
    };
  }, [items, agregarProducto, importarProductosQr, quitarProducto, actualizarCantidad, vaciarCarrito, entregaDomicilio]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
