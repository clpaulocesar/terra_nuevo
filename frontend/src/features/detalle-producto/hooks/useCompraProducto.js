import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccesibilidad } from '../../../context/AccesibilidadContext.jsx';
import { useCarrito } from '../../../hooks/useCarrito.js';

// Cantidad y agregado al carrito desde la ficha: botón, comando de voz "agregar"
// y ?agregar=1 (llega desde la ficha QR).
export function useCompraProducto(producto, color) {
  const [searchParams, setSearchParams] = useSearchParams();
  const autoAgregar = searchParams.get('agregar') === '1';
  const { agregarProducto } = useCarrito();
  const { anunciar: anunciarVoz } = useAccesibilidad();
  // La cantidad se guarda junto al id del producto: al abrir otro vuelve a 1.
  const [elegida, setElegida] = useState({ id: null, valor: 1 });
  const cantidad = elegida.id === producto?.id ? elegida.valor : 1;
  const [agregado, setAgregado] = useState(false);
  const opciones = color ? { color } : {};

  const agregar = () => {
    for (let indice = 0; indice < cantidad; indice += 1) agregarProducto(producto, 1, opciones);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1800);
  };

  const comprarAhora = () => agregarProducto(producto, cantidad, opciones);

  const disminuir = () => setElegida({ id: producto.id, valor: Math.max(1, cantidad - 1) });
  const aumentar = () => setElegida({ id: producto.id, valor: Math.min(Number(producto.stock), cantidad + 1) });

  const agregarRef = useRef(agregar);
  agregarRef.current = agregar;
  useEffect(() => {
    const alComando = (evento) => {
      const { accion } = evento.detail || {};
      if (accion !== 'agregar') return;
      if (!producto) return;
      if (Number(producto.stock) <= 0) {
        anunciarVoz(`${producto.nombre} está agotado.`);
        return;
      }
      agregarRef.current();
      anunciarVoz(cantidad > 1
        ? `${cantidad} unidades de ${producto.nombre} agregadas al carrito.`
        : `${producto.nombre} agregado al carrito.`);
    };
    window.addEventListener('terra:voz', alComando);
    return () => window.removeEventListener('terra:voz', alComando);
  }, [producto, cantidad, anunciarVoz]);

  const autoAgregadoRef = useRef(false);
  useEffect(() => {
    if (!autoAgregar || autoAgregadoRef.current) return;
    if (!producto || Number(producto.stock) <= 0) return;
    autoAgregadoRef.current = true;
    agregarProducto(producto, 1, color ? { color } : {});
    // Quita ?agregar=1 de la URL: si no, al refrescar la página se vuelve a agregar solo.
    setSearchParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        siguientes.delete('agregar');
        return siguientes;
      },
      { replace: true },
    );
  }, [autoAgregar, producto, color, agregarProducto, setSearchParams]);

  return { cantidad, agregado, agregar, comprarAhora, disminuir, aumentar };
}
