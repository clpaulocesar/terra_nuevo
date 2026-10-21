import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, ShoppingBag, Users, WalletCards } from 'lucide-react';
import { listarPedidos } from '../../services/pedidoService.js';
import { listarClientes } from '../../services/clienteService.js';
import './DashboardVendedor.css';

const ESTADOS_EN_GESTION = ['pendiente', 'confirmado', 'en_proceso', 'en preparación', 'preparando', 'enviado'];

function esDelDia(fecha) {
  if (!fecha) return false;
  const valor = new Date(fecha);
  const hoy = new Date();
  return !Number.isNaN(valor.getTime()) && valor.toDateString() === hoy.toDateString();
}

function moneda(valor) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

export default function DashboardVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarResumen = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [respuestaPedidos, respuestaClientes] = await Promise.all([
        listarPedidos({ limite: 100 }),
        listarClientes({ limite: 100 }),
      ]);
      setPedidos(Array.isArray(respuestaPedidos) ? respuestaPedidos : respuestaPedidos?.pedidos || []);
      setClientes(Array.isArray(respuestaClientes) ? respuestaClientes : respuestaClientes?.clientes || []);
    } catch {
      setError('No se pudo cargar el resumen operativo. Intenta actualizar nuevamente.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  const resumen = useMemo(() => {
    const pedidosHoy = pedidos.filter((pedido) => esDelDia(pedido.fecha || pedido.created_at));
    const ventasHoy = pedidosHoy
      .filter((pedido) => String(pedido.estado || '').toLowerCase() !== 'cancelado')
      .reduce((total, pedido) => total + Number(pedido.total || pedido.total_final || 0), 0);
    const enGestion = pedidos.filter((pedido) =>
      ESTADOS_EN_GESTION.includes(String(pedido.estado || '').toLowerCase()),
    ).length;
    const clientesConContacto = clientes.filter((cliente) => cliente.telefono || cliente.email).length;

    return { pedidosHoy: pedidosHoy.length, ventasHoy, enGestion, clientesConContacto };
  }, [clientes, pedidos]);

  const ultimosPedidos = useMemo(
    () => [...pedidos]
      .sort((a, b) => new Date(b.fecha || b.created_at || 0) - new Date(a.fecha || a.created_at || 0))
      .slice(0, 5),
    [pedidos],
  );

  return (
    <section className="vendedor-dashboard">
      <header className="vendedor-dashboard__header">
        <div>
          <p className="vendedor-dashboard__eyebrow">Portal de ventas</p>
          <h1>Resumen operativo</h1>
          <p>Consulta la actividad general de la sucursal durante la jornada.</p>
        </div>
        <button className="vendedor-dashboard__refresh" type="button" onClick={cargarResumen} disabled={cargando}>
          <RefreshCw size={18} className={cargando ? 'is-spinning' : ''} />
          Actualizar
        </button>
      </header>

      {error && <div className="vendedor-dashboard__error">{error}</div>}

      <div className="vendedor-dashboard__metrics">
        <article className="vendedor-metric vendedor-metric--primary">
          <span className="vendedor-metric__icon"><WalletCards size={22} /></span>
          <div><p>Ventas registradas hoy</p><strong>{cargando ? '—' : moneda(resumen.ventasHoy)}</strong></div>
        </article>
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><ShoppingBag size={22} /></span>
          <div><p>Pedidos de hoy</p><strong>{cargando ? '—' : resumen.pedidosHoy}</strong></div>
        </article>
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><ClipboardList size={22} /></span>
          <div><p>Pedidos en gestión</p><strong>{cargando ? '—' : resumen.enGestion}</strong></div>
        </article>
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><Users size={22} /></span>
          <div><p>Clientes con contacto</p><strong>{cargando ? '—' : resumen.clientesConContacto}</strong></div>
        </article>
      </div>

      <article className="vendedor-dashboard__orders">
        <div className="vendedor-dashboard__section-head">
          <div><h2>Últimos pedidos registrados</h2><p>Seguimiento rápido de la actividad reciente.</p></div>
          <span>{pedidos.length} pedidos cargados</span>
        </div>
        {cargando ? <p className="vendedor-dashboard__empty">Cargando actividad…</p> : ultimosPedidos.length === 0 ? (
          <p className="vendedor-dashboard__empty">Aún no hay pedidos para mostrar.</p>
        ) : (
          <div className="vendedor-orders-list">
            {ultimosPedidos.map((pedido) => (
              <div className="vendedor-order-row" key={pedido.id || pedido.codigo}>
                <div><strong>{pedido.codigo || `Pedido #${pedido.id}`}</strong><span>{pedido.cliente || pedido.nombre_cliente || 'Cliente sin nombre'}</span></div>
                <span className="vendedor-order-row__status">{pedido.estado || 'Pendiente'}</span>
                <strong>{moneda(pedido.total || pedido.total_final)}</strong>
              </div>
            ))}
          </div>
        )}
      </article>
      <p className="vendedor-dashboard__note">Las métricas corresponden a la operación general de la sucursal. La asignación individual por vendedor se incorporará cuando cada venta guarde su responsable.</p>
    </section>
  );
}
