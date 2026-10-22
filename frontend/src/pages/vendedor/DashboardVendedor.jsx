import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, ClipboardList, Clock3, PackageCheck, Printer, RefreshCw, ShoppingBag, Users, WalletCards } from 'lucide-react';
import { listarPedidos } from '../../services/pedidoService.js';
import { listarClientes } from '../../services/clienteService.js';
import { imprimirTicketPedido } from '../../utils/imprimirTicket.js';
import AnaliticaHoraria from '../../components/analytics/AnaliticaHoraria.jsx';
import './DashboardVendedor.css';

const ESTADOS_EN_GESTION = ['pendiente', 'confirmado', 'en_proceso', 'en preparación', 'preparando', 'enviado'];

const ESTADOS_COBRADOS = new Set(['completed', 'paid', 'pagado', 'shipped', 'delivered']);
const horaBolivia = (fecha) => new Intl.DateTimeFormat('es-BO', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/La_Paz' }).format(new Date(fecha));

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

function formatoFechaHora(fecha) {
  if (!fecha) return '—';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/La_Paz',
  }).format(valor);
}

function contarUnidades(items) {
  if (!items) return 0;
  if (Array.isArray(items)) {
    return items.reduce((acc, it) => acc + Number(it.cantidad || it.quantity || 1), 0);
  }
  if (typeof items === 'string') {
    const matches = [...items.matchAll(/(\d+)x\s+/gi)];
    if (matches.length > 0) {
      return matches.reduce((acc, m) => acc + Number(m[1] || 0), 0);
    }
    return items.trim() ? 1 : 0;
  }
  return 0;
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
    const pedidosValidos = pedidos.filter(
      (pedido) => !['cancelado', 'cancelled'].includes(String(pedido.estado || '').toLowerCase()),
    );
    const pedidosHoy = pedidosValidos.filter((pedido) => esDelDia(pedido.fecha || pedido.created_at));

    const cobradosHoy = pedidosHoy.filter((pedido) => ESTADOS_COBRADOS.has(String(pedido.estado || '').toLowerCase()));
    const horas = cobradosHoy.reduce((conteo, pedido) => {
      const hora = horaBolivia(pedido.fecha || pedido.created_at);
      conteo.set(hora, (conteo.get(hora) || 0) + 1);
      return conteo;
    }, new Map());
    const horaMasVendida = [...horas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;

    const ventasHoy = pedidosHoy.reduce(
      (total, pedido) => total + Number(pedido.total || pedido.total_final || 0),
      0,
    );

    const productosVendidosHoy = pedidosHoy.reduce(
      (total, pedido) => total + contarUnidades(pedido.items),
      0,
    );

    const totalProductosVendidos = pedidosValidos.reduce(
      (total, pedido) => total + contarUnidades(pedido.items),
      0,
    );

    const enGestion = pedidos.filter((pedido) =>
      ESTADOS_EN_GESTION.includes(String(pedido.estado || '').toLowerCase()),
    ).length;

    const clientesConContacto = clientes.filter((cliente) => cliente.telefono || cliente.email).length;

    return {
      pedidosHoy: pedidosHoy.length,
      ventasHoy,
      productosVendidosHoy,
      totalProductosVendidos,
      enGestion,
      clientesConContacto,
      horaMasVendida,
    };
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
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><Clock3 size={22} /></span>
          <div><p>Hora más vendida</p><strong>{cargando ? '—' : resumen.horaMasVendida ? `${resumen.horaMasVendida[0]}:00` : '—'}</strong><small>{cargando ? '' : resumen.horaMasVendida ? `${resumen.horaMasVendida[1]} pedido${resumen.horaMasVendida[1] === 1 ? '' : 's'} cobrado${resumen.horaMasVendida[1] === 1 ? '' : 's'}` : 'Sin ventas cobradas'}</small></div>
        </article>
        <article className="vendedor-metric vendedor-metric--primary">
          <span className="vendedor-metric__icon"><WalletCards size={22} /></span>
          <div><p>Ventas registradas hoy</p><strong>{cargando ? '—' : moneda(resumen.ventasHoy)}</strong></div>
        </article>
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><PackageCheck size={22} /></span>
          <div><p>Productos vendidos hoy</p><strong>{cargando ? '—' : `${resumen.productosVendidosHoy} un.`}</strong></div>
        </article>
        <article className="vendedor-metric">
          <span className="vendedor-metric__icon"><Boxes size={22} /></span>
          <div><p>Total productos vendidos</p><strong>{cargando ? '—' : `${resumen.totalProductosVendidos} un.`}</strong></div>
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
          <div><p>Clientes registrados</p><strong>{cargando ? '—' : resumen.clientesConContacto}</strong></div>
        </article>
      </div>

      <AnaliticaHoraria modo="vendedor" />
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
                <div>
                  <strong>{pedido.numero ? `Pedido #${pedido.numero}` : ''} {pedido.codigo ? `· #${pedido.codigo}` : (pedido.id ? `· #${pedido.id}` : '')}</strong>
                  <span>{pedido.cliente || pedido.nombre_cliente || 'Cliente sin nombre'}</span>
                  <small className="vendedor-order-row__time">{formatoFechaHora(pedido.fecha || pedido.created_at)}</small>
                </div>
                <span className="vendedor-order-row__status">{pedido.estado || 'Pendiente'}</span>
                <strong>{moneda(pedido.total || pedido.total_final)}</strong>
                <button
                  type="button"
                  className="vendedor-order-row__ticket"
                  onClick={() => imprimirTicketPedido(pedido)}
                  title="Imprimir ticket térmico de este pedido"
                >
                  <Printer size={14} /> Ticket
                </button>
              </div>
            ))}
          </div>
        )}
      </article>
      <p className="vendedor-dashboard__note">Las métricas corresponden a la operación general de la sucursal. La asignación individual por vendedor se incorporará cuando cada venta guarde su responsable.</p>
    </section>
  );
}
