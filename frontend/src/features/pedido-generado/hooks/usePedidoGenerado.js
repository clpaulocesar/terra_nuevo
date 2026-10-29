import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { obtenerPedido } from '../../../services/pedidoService.js';

// El pedido llega en el estado de la navegación desde Confirmación; con /pedido/:id
// (enlace del ticket) se pide al backend. Con ?imprimir abre el diálogo de impresión.
export function usePedidoGenerado() {
  const { state, search } = useLocation();
  const { id } = useParams();
  const [pedido, setPedido] = useState(state?.pedido || null);
  const [cargando, setCargando] = useState(Boolean(id && !state?.pedido));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || pedido) return;
    obtenerPedido(id)
      .then(setPedido)
      .catch((err) => setError(err.message || 'No se pudo cargar el ticket.'))
      .finally(() => setCargando(false));
  }, [id, pedido]);

  useEffect(() => {
    if (!pedido || !new URLSearchParams(search).has('imprimir')) return undefined;
    const temporizador = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(temporizador);
  }, [pedido, search]);

  const cliente = state?.cliente?.nombre || state?.cliente?.nit ? state.cliente : pedido?.cliente;
  const items = state?.items?.length ? state.items : (pedido?.items || []);
  return { pedido, cliente, items, cargando, error };
}
