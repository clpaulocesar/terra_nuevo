import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Repeat2,
  RotateCcw,
  Search,
  Truck,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { obtenerPedido } from '../services/pedidoService.js';
import { WHATSAPP_COMPROBANTES } from '../services/api.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';
import './PedidosMayorista.css';

// Pedidos institucionales B2B de alta fidelidad según diseño
const PEDIDOS_B2B = [
  {
    id: 'TR-9821',
    codigo: '#TR-9821',
    factura: '#FC-4491',
    facturaCompleta: '#FC-004491',
    fecha: '2025-03-14T10:30:00',
    fechaTexto: '14 Mar 2025',
    horaTexto: '10:30 AM',
    itemsResumen: '12x Somier L1, 8x Colchón Bugatti',
    totalUnidades: 20,
    total: 24600,
    metodoPago: 'Crédito 30d',
    metodoPagoCompleto: 'Línea de Crédito 30 días (Aprobado)',
    estado: 'out_for_delivery',
    estadoTexto: 'En tránsito',
    llegadaEstimada: 'Llegada: Hoy 16:30',
    lugarEntrega: 'Almacén Central Av. Banzer, 4to Anillo',
    chofer: 'Chofer: Roberto C.',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p1',
        nombre: 'Somier Línea 1 - 2 Plazas',
        detalle: '140x190 cm • Color Gris Grafito',
        cantidad: 12,
        precioUnitario: 1050,
        subtotal: 12600,
        descuento: '-22% B2B',
      },
      {
        id: 'p2',
        nombre: 'Colchón Bugatti Línea 1 - Queen',
        detalle: '160x200 cm • Doble Pillow Top',
        cantidad: 8,
        precioUnitario: 1500,
        subtotal: 12000,
        descuento: '-22% B2B',
      },
    ],
  },
  {
    id: 'TR-9750',
    codigo: '#TR-9750',
    factura: '#FC-4482',
    facturaCompleta: '#FC-004482',
    fecha: '2025-03-10T16:15:00',
    fechaTexto: '10 Mar 2025',
    horaTexto: '16:15 PM',
    itemsResumen: '15x Colchón Tatami L2, 5x Espaldar',
    totalUnidades: 20,
    total: 19800,
    metodoPago: 'Transferencia',
    metodoPagoCompleto: 'Transferencia Bancaria QR',
    estado: 'preparing',
    estadoTexto: 'En preparación',
    llegadaEstimada: 'Turno de carga: 16 Mar',
    lugarEntrega: 'Sucursal Equipetrol Norte',
    chofer: 'Chofer: Pendiente asignación',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p3',
        nombre: 'Colchón Tatami Línea 2',
        detalle: '140x190 cm • Espuma HR alta densidad',
        cantidad: 15,
        precioUnitario: 980,
        subtotal: 14700,
        descuento: '-20% B2B',
      },
      {
        id: 'p4',
        nombre: 'Espaldar Tapizado Gris',
        detalle: 'Tapizado lino antimancha',
        cantidad: 5,
        precioUnitario: 1020,
        subtotal: 5100,
        descuento: '-20% B2B',
      },
    ],
  },
  {
    id: 'TR-9614',
    codigo: '#TR-9614',
    factura: '#FC-4399',
    facturaCompleta: '#FC-004399',
    fecha: '2025-02-28T09:00:00',
    fechaTexto: '28 Feb 2025',
    horaTexto: '09:00 AM',
    itemsResumen: '20x Poltrona Eco, 10x Somier L2',
    totalUnidades: 30,
    total: 38450,
    metodoPago: 'Cheque B2B',
    metodoPagoCompleto: 'Cheque Corporativo 15 días',
    estado: 'completed',
    estadoTexto: 'Entregado',
    llegadaEstimada: 'Entregado conforme',
    lugarEntrega: 'Depósito Parque Industrial',
    chofer: 'Chofer: Marco Antonio R.',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p5',
        nombre: 'Poltrona Reclinable Eco',
        detalle: 'Cuero ecológico negro 3 posiciones',
        cantidad: 20,
        precioUnitario: 1250,
        subtotal: 25000,
        descuento: '-20% B2B',
      },
      {
        id: 'p6',
        nombre: 'Somier Línea 2 Queen',
        detalle: '160x200 cm • Patas aluminio reforzado',
        cantidad: 10,
        precioUnitario: 1345,
        subtotal: 13450,
        descuento: '-20% B2B',
      },
    ],
  },
  {
    id: 'TR-9540',
    codigo: '#TR-9540',
    factura: 'Cotización: #COT-881',
    facturaCompleta: 'Cotización B2B #COT-881',
    fecha: '2025-02-18T11:20:00',
    fechaTexto: '18 Feb 2025',
    horaTexto: '11:20 AM',
    itemsResumen: '30x Almohadas Visco, 6x Colchón King',
    totalUnidades: 36,
    total: 14200,
    metodoPago: 'Pendiente val.',
    metodoPagoCompleto: 'En revisión de cupo crediticio B2B',
    estado: 'pending',
    estadoTexto: 'Pendiente pago',
    llegadaEstimada: 'Esperando validación',
    lugarEntrega: 'Almacén Central Av. Banzer, 4to Anillo',
    chofer: 'Chofer: Por asignar',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p7',
        nombre: 'Almohadas Viscoelásticas Ergonómicas',
        detalle: 'Espuma con memoria termosensible',
        cantidad: 30,
        precioUnitario: 220,
        subtotal: 6600,
        descuento: '-25% B2B',
      },
      {
        id: 'p8',
        nombre: 'Colchón Imperial King',
        detalle: '200x200 cm • Resortes Pocket',
        cantidad: 6,
        precioUnitario: 1266,
        subtotal: 7600,
        descuento: '-20% B2B',
      },
    ],
  },
];

const ESTADOS_ESTILOS = {
  out_for_delivery: { label: 'En tránsito', pillClass: 'status-pill-clean--blue', activeStep: 3 },
  preparing: { label: 'En preparación', pillClass: 'status-pill-clean--slate', activeStep: 3 },
  completed: { label: 'Entregado', pillClass: 'status-pill-clean--green', activeStep: 4 },
  pending: { label: 'Pendiente pago', pillClass: 'status-pill-clean--amber', activeStep: 1 },
  confirmed: { label: 'Cobrado', pillClass: 'status-pill-clean--slate', activeStep: 2 },
  cancelled: { label: 'Cancelado', pillClass: 'status-pill-clean--rose', activeStep: 0 },
};

function calcularUnidades(itemsTexto = '') {
  const matches = itemsTexto.match(/(\d+)\s*x/g);
  if (!matches) return 1;
  return matches.reduce((acc, m) => acc + (parseInt(m, 10) || 0), 0);
}

export default function PedidosMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const { agregarProducto } = useCarrito();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [segmentoActivo, setSegmentoActivo] = useState('todos'); // 'todos' | 'en_camino' | 'completados'

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const LIMITE_PAGINA = 4;

  // Selección Master-Detail
  const [pedidoActivoId, setPedidoActivoId] = useState(null);

  // Carga inicial de datos
  useEffect(() => {
    if (!esMayorista) return;
    setCargando(true);

    listarMisPedidosMayorista(sesion?.token)
      .then((res) => {
        const lista = Array.isArray(res) ? res : [];
        if (lista.length > 0) {
          const adaptados = lista.map((p, idx) => {
            const estadoKey = p.estado || 'pending';
            const estadoConfig = ESTADOS_ESTILOS[estadoKey] || { label: p.estado, pillClass: 'status-pill-clean--slate', activeStep: 1 };
            const fechaObj = new Date(p.fecha || Date.now());
            return {
              id: p.id || `p-${idx}`,
              codigo: p.codigo || `#TR-${String(p.id).slice(-4)}`,
              factura: `Factura: #FC-${String(p.id).slice(-4)}`,
              facturaCompleta: `#FC-00${String(p.id).slice(-4)}`,
              fecha: p.fecha || new Date().toISOString(),
              fechaTexto: fechaObj.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
              horaTexto: fechaObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
              itemsResumen: p.items || 'Detalle no especificado',
              totalUnidades: calcularUnidades(p.items),
              total: Number(p.total || 0),
              metodoPago: p.metodo_pago ? p.metodo_pago.slice(0, 15) : 'Crédito 30d',
              metodoPagoCompleto: p.metodo_pago || 'Línea de Crédito 30 días (Aprobado)',
              estado: estadoKey,
              estadoTexto: estadoConfig.label,
              llegadaEstimada: estadoKey === 'completed' ? 'Entregado conforme' : 'En proceso de despacho',
              lugarEntrega: p.direccion_entrega || 'Retiro en tienda / coordinar en caja',
              direccion_entrega: p.direccion_entrega || '',
              referencia_entrega: p.referencia_entrega || '',
              chofer: 'Chofer asignado en planta',
              asesor: 'Carlos Mercado (+591 712-34567)',
              itemsDetalle: [
                {
                  id: `linea-${idx}`,
                  nombre: p.items || 'Lote de productos B2B',
                  detalle: 'Medidas comerciales de catálogo mayorista',
                  cantidad: calcularUnidades(p.items),
                  precioUnitario: Math.round(Number(p.total || 0) / Math.max(1, calcularUnidades(p.items))),
                  subtotal: Number(p.total || 0),
                  descuento: '-22% B2B',
                },
              ],
            };
          });
          setPedidos(adaptados);
          setPedidoActivoId(adaptados[0].id);
        } else {
          setPedidos(PEDIDOS_B2B);
          setPedidoActivoId(PEDIDOS_B2B[0].id);
        }
      })
      .catch(() => {
        setPedidos(PEDIDOS_B2B);
        setPedidoActivoId(PEDIDOS_B2B[0].id);
      })
      .finally(() => setCargando(false));
  }, [esMayorista, sesion?.token]);

  // Si se selecciona un pedido numérico real, intentar cargar items detallados
  useEffect(() => {
    if (!pedidoActivoId) return;
    const seleccionado = pedidos.find((p) => p.id === pedidoActivoId);
    if (!seleccionado || !Number.isInteger(Number(seleccionado.id))) return;

    obtenerPedido(seleccionado.id)
      .then((det) => {
        if (det?.items && Array.isArray(det.items) && det.items.length > 0) {
          setPedidos((prev) =>
            prev.map((p) => {
              if (p.id !== seleccionado.id) return p;
              return {
                ...p,
                itemsDetalle: det.items.map((it, idx) => ({
                  id: it.productoId || `it-${idx}`,
                  nombre: it.nombre || 'Producto',
                  detalle: it.color ? `Color: ${it.color}` : 'Medida estándar mayorista',
                  cantidad: it.cantidad,
                  precioUnitario: it.precioUnitario || Math.round(it.subtotal / it.cantidad),
                  subtotal: it.subtotal,
                  descuento: '-22% B2B',
                })),
              };
            })
          );
        }
      })
      .catch(() => {});
  }, [pedidoActivoId, pedidos]);

  // Filtrado reactivo
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Búsqueda por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincideCod = String(pedido.codigo || '').toLowerCase().includes(q);
        const coincideFac = String(pedido.factura || '').toLowerCase().includes(q);
        const coincideItems = String(pedido.itemsResumen || '').toLowerCase().includes(q);
        if (!coincideCod && !coincideFac && !coincideItems) return false;
      }

      // Segmento activo
      if (segmentoActivo === 'en_camino') {
        return ['out_for_delivery', 'preparing', 'ready_for_pickup'].includes(pedido.estado);
      }
      if (segmentoActivo === 'completados') {
        return pedido.estado === 'completed';
      }

      return true;
    });
  }, [pedidos, busqueda, segmentoActivo]);

  // Paginación
  const totalPaginas = Math.ceil(pedidosFiltrados.length / LIMITE_PAGINA) || 1;
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * LIMITE_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + LIMITE_PAGINA);
  }, [pedidosFiltrados, paginaActual]);

  // Pedido seleccionado activo
  const pedidoActivo = useMemo(() => {
    return pedidos.find((p) => p.id === pedidoActivoId) || pedidosFiltrados[0] || pedidos[0] || null;
  }, [pedidos, pedidoActivoId, pedidosFiltrados]);

  // Exportar Excel (CSV con UTF-8 BOM)
  const handleExportarExcel = () => {
    const encabezados = ['N° Pedido', 'Factura', 'Fecha', 'Detalle Unidades', 'Total (Bs)', 'Estado', 'Metodo de Pago'];
    const filas = pedidosFiltrados.map((p) => [
      `"${p.codigo || p.id}"`,
      `"${p.factura || 'N/A'}"`,
      `"${p.fechaTexto || ''} ${p.horaTexto || ''}"`,
      `"${(p.itemsResumen || '').replace(/"/g, '""')}"`,
      p.total,
      `"${p.estadoTexto || p.estado}"`,
      `"${p.metodoPagoCompleto || p.metodoPago}"`,
    ]);
    const contenido = '\uFEFF' + [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedidos_mayorista_terra_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Descargar Comprobante / Ticket
  const handleDescargarTicket = (pedido) => {
    if (!pedido) return;
    const clienteDatos = {
      nombre: sesion?.nombre || 'Cliente mayorista',
      nit: sesion?.nit || '',
      telefono: sesion?.telefono || '',
    };
    const itemsTicket = (pedido.itemsDetalle || []).map((it) => ({
      nombre: it.nombre,
      cantidad: it.cantidad,
      precio: it.precioUnitario,
      subtotal: it.subtotal,
    }));
    descargarTicket(pedido, clienteDatos, itemsTicket);
  };

  // Repetir compra
  const handleRepetirCompra = (pedido) => {
    if (!pedido?.itemsDetalle) return;
    for (const it of pedido.itemsDetalle) {
      agregarProducto(
        {
          id: it.id || `rep-${Math.random()}`,
          nombre: it.nombre,
          precio: it.precioUnitario,
          precioMayorista: it.precioUnitario,
          stock: 99,
          categoria: 'Mayorista',
        },
        it.cantidad || 1
      );
    }
    navigate('/carrito');
  };

  // WhatsApp del asesor asignado
  const wspAsesor = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent(
    `Hola Carlos, deseo consultar el estado del pedido ${pedidoActivo?.codigo || ''} de ${sesion?.nombre || 'mi cuenta comercial'}.`
  )}`;

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  return (
    <div className="wholesale-orders-dashboard" data-purpose="wholesale-orders-dashboard">
      {/* ====================================================================
          1. PAGE HEADER
          ==================================================================== */}
      <section className="orders-page-header" data-purpose="orders-header">
        <div className="orders-page-header__left">
          <div className="orders-page-header__title-row">
            <h1>Mis pedidos</h1>
            <span className="orders-account-badge">
              <CheckCircle2 size={14} style={{ color: '#059669' }} />
              {sesion?.nombre || 'Cliente mayorista'} • NIT: {sesion?.nit || 'Sin NIT'}
            </span>
          </div>
          <p className="orders-page-header__desc">
            Gestión de pedidos mayoristas directos de fábrica y estado de despachos.
          </p>
        </div>
        <div className="orders-page-header__actions">
          <button type="button" className="btn-export-excel" onClick={handleExportarExcel}>
            <FileSpreadsheet size={15} />
            Exportar Excel
          </button>
          <Link to="/catalogo" className="btn-new-order">
            <Plus size={15} />
            Nueva compra / Catálogo
          </Link>
        </div>
      </section>

      {/* ====================================================================
          2. KPI SECTION (3 COLUMNAS CON DIVISORES)
          ==================================================================== */}
      <section className="orders-kpi-bar" data-purpose="b2b-kpis">
        {/* KPI 1: Activos en curso */}
        <div className="orders-kpi-col">
          <div className="kpi-icon-square kpi-icon-square--blue">
            <Truck size={20} />
          </div>
          <div className="kpi-meta-wrap">
            <span className="kpi-title-tiny">Activos en curso</span>
            <div className="kpi-values-row">
              <span className="kpi-number-bold">2 pedidos</span>
              <span className="kpi-pill-badge kpi-pill-badge--blue">1 en camino • 1 en planta</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Entregados este mes */}
        <div className="orders-kpi-col">
          <div className="kpi-icon-square kpi-icon-square--green">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-meta-wrap">
            <span className="kpi-title-tiny">Entregados este mes</span>
            <div className="kpi-values-row">
              <span className="kpi-number-bold" style={{ color: '#065f46' }}>18 pedidos</span>
              <span className="kpi-pill-badge kpi-pill-badge--gray">100% conformidad</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Inversión acumulada 2025 */}
        <div className="orders-kpi-col">
          <div className="kpi-icon-square kpi-icon-square--amber">
            <Coins size={20} />
          </div>
          <div className="kpi-meta-wrap">
            <span className="kpi-title-tiny">Inversión acumulada 2025</span>
            <div className="kpi-values-row">
              <span className="kpi-number-bold">Bs 142.850</span>
              <span className="kpi-pill-badge kpi-pill-badge--green" style={{ backgroundColor: '#ecfdf5', fontWeight: 700 }}>
                Descuento B2B 22%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. BARRA DE FILTROS RÁPIDOS
          ==================================================================== */}
      <section className="orders-filter-container" data-purpose="advanced-order-filters">
        <div className="orders-search-input-wrap">
          <span className="orders-search-icon">
            <Search size={15} />
          </span>
          <input
            className="orders-search-field"
            type="text"
            placeholder="Buscar por Nº de pedido (#TR-9821) o factura..."
            aria-label="Buscar pedido por número o factura"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>

        <div className="orders-filter-pills-row">
          <div className="segmented-pill-box">
            <button
              type="button"
              className={`segmented-tab-btn ${segmentoActivo === 'todos' ? 'is-active' : ''}`}
              onClick={() => {
                setSegmentoActivo('todos');
                setPaginaActual(1);
              }}
            >
              Todos
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${segmentoActivo === 'en_camino' ? 'is-active' : ''}`}
              onClick={() => {
                setSegmentoActivo('en_camino');
                setPaginaActual(1);
              }}
            >
              En camino (1)
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${segmentoActivo === 'completados' ? 'is-active' : ''}`}
              onClick={() => {
                setSegmentoActivo('completados');
                setPaginaActual(1);
              }}
            >
              Completados
            </button>
          </div>

          <button
            type="button"
            className="btn-filter-clear"
            onClick={() => {
              setBusqueda('');
              setSegmentoActivo('todos');
              setPaginaActual(1);
            }}
          >
            Limpiar
          </button>
        </div>
      </section>

      {/* ====================================================================
          4. MASTER-DETAIL GRID
          ==================================================================== */}
      <div className="orders-master-detail-grid" data-purpose="master-detail-view">
        {/* SUBSECCIÓN A: TABLA HISTÓRICA DE PEDIDOS (7 Cols en XL) */}
        <div className="orders-table-wrapper">
          <div className="orders-table-bar-top">
            <div className="orders-table-title-left">
              <strong>Histórico de Pedidos</strong>
              <span className="orders-table-counter">{pedidosFiltrados.length} registros</span>
            </div>
            <span className="orders-table-sort-label">Orden: Recientes</span>
          </div>

          <div className="orders-scrollable-area">
            <table className="orders-data-table" id="orders-master-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Pedido / Estado</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                      Cargando pedidos mayoristas...
                    </td>
                  </tr>
                ) : pedidosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                      No se encontraron pedidos con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  pedidosPaginados.map((pedido) => {
                    const esSeleccionado = pedido.id === pedidoActivo?.id;
                    const estadoConfig = ESTADOS_ESTILOS[pedido.estado] || {
                      label: pedido.estadoTexto || pedido.estado,
                      pillClass: 'status-pill-clean--slate',
                    };

                    return (
                      <tr
                        key={pedido.id}
                        className={esSeleccionado ? 'is-selected' : ''}
                        onClick={() => setPedidoActivoId(pedido.id)}
                      >
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <div className="cell-order-code">
                            <strong className={esSeleccionado ? 'cell-order-code--wine' : 'cell-order-code--dark'}>
                              {pedido.codigo}
                            </strong>
                            <span className={`status-pill-clean ${estadoConfig.pillClass}`}>
                              {estadoConfig.label}
                            </span>
                          </div>
                          <div className="cell-subtext-gray">Factura: {pedido.factura}</div>
                        </td>
                        <td>
                          <div className="cell-date-bold">{pedido.fechaTexto}</div>
                          <div className="cell-subtext-gray">{pedido.horaTexto}</div>
                        </td>
                        <td>
                          <div className="cell-items-text">{pedido.itemsResumen}</div>
                          <div className="cell-subtext-gray">{pedido.totalUnidades} unid. en total</div>
                        </td>
                        <td>
                          <div className="cell-total-bold">{formatoMoneda(pedido.total)}</div>
                          <div
                            className={`cell-payment-cond ${
                              pedido.metodoPago.toLowerCase().includes('crédito')
                                ? 'cell-payment-cond--green'
                                : pedido.metodoPago.toLowerCase().includes('pendiente')
                                ? 'cell-payment-cond--amber'
                                : ''
                            }`}
                          >
                            {pedido.metodoPago}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <button
                            type="button"
                            className={esSeleccionado ? 'btn-table-action-primary' : 'btn-table-action-secondary'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPedidoActivoId(pedido.id);
                            }}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de Paginación */}
          <div className="orders-table-pagination">
            <span>
              Mostrando {pedidosFiltrados.length === 0 ? 0 : (paginaActual - 1) * LIMITE_PAGINA + 1}-
              {Math.min(paginaActual * LIMITE_PAGINA, pedidosFiltrados.length)} de {pedidosFiltrados.length} pedidos recientes
            </span>
            <div className="pagination-controls-box">
              <button
                type="button"
                className="pagination-btn-base"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pagination-btn-base ${paginaActual === num ? 'is-active' : ''}`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="pagination-btn-base"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* SUBSECCIÓN B: PANEL DE DETALLE PROFUNDO (5 Cols en XL) */}
        <aside className="order-detail-panel-card" data-purpose="order-detail-card">
          {pedidoActivo ? (
            <>
              {/* Cabecera del Detalle */}
              <div className="detail-panel-head">
                <div className="detail-head-top-flex">
                  <div>
                    <div className="detail-head-code-row">
                      <span className="detail-head-tag">Detalle del Pedido</span>
                      <span className="detail-head-number">{pedidoActivo.codigo}</span>
                    </div>
                    <p className="detail-head-date">
                      {pedidoActivo.fechaTexto} • Factura {pedidoActivo.facturaCompleta || pedidoActivo.factura}
                    </p>
                  </div>
                  <div className="detail-head-status-box">
                    <span className="status-badge-pulse-wrap">
                      <span className="status-pulse-dot" />
                      {pedidoActivo.estadoTexto}
                    </span>
                    <div className="detail-head-eta">{pedidoActivo.llegadaEstimada}</div>
                  </div>
                </div>

                {/* Sub-fila de Ubicación y Chofer */}
                <div className="detail-head-subrow">
                  <div className="detail-location-pin">
                    <MapPin size={15} style={{ color: '#9ca3af' }} />
                    <span>{pedidoActivo.lugarEntrega}</span>
                  </div>
                  <span className="detail-driver-text">{pedidoActivo.chofer}</span>
                </div>
              </div>

              {/* Lista de Ítems del Lote */}
              <div className="detail-panel-body">
                <div className="detail-section-title-sm">
                  Ítems del Lote ({pedidoActivo.totalUnidades} unidades)
                </div>
                <div className="detail-items-stack">
                  {(pedidoActivo.itemsDetalle || []).map((item, idx) => (
                    <div key={item.id || idx} className="detail-item-pill-card">
                      <div className="detail-item-left">
                        <span className="item-qty-sq">{item.cantidad}x</span>
                        <div className="item-meta-titles">
                          <h5>{item.nombre}</h5>
                          <p>{item.detalle}</p>
                        </div>
                      </div>
                      <div className="detail-item-right">
                        <div className="detail-item-price-bold">{formatoMoneda(item.subtotal)}</div>
                        <div className="detail-item-b2b-tag">{item.descuento || '-22% B2B'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total a pagar */}
                <div className="detail-cost-total-row">
                  <span>Total a pagar:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="detail-total-amount">{formatoMoneda(pedidoActivo.total)}</div>
                    <div className="detail-credit-label">{pedidoActivo.metodoPagoCompleto}</div>
                  </div>
                </div>
              </div>

              {/* Seguimiento de Despacho (Stepper Horizontal de 4 Pasos) */}
              <div className="detail-tracking-section">
                <div className="detail-section-title-sm">Seguimiento de Despacho</div>
                <div className="tracking-4steps-grid">
                  {/* Paso 1: Confirmado */}
                  <div className="tracking-step-col">
                    <div className="tracking-step-circle tracking-step-circle--done">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="tracking-step-label tracking-step-label--bold">Confirmado</span>
                  </div>

                  {/* Paso 2: Pago OK */}
                  <div className="tracking-step-col">
                    <div
                      className={`tracking-step-circle ${
                        pedidoActivo.estado !== 'pending' && pedidoActivo.estado !== 'cancelled'
                          ? 'tracking-step-circle--done'
                          : 'tracking-step-circle--gray'
                      }`}
                    >
                      {pedidoActivo.estado !== 'pending' && pedidoActivo.estado !== 'cancelled' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>
                    <span
                      className={`tracking-step-label ${
                        pedidoActivo.estado !== 'pending' && pedidoActivo.estado !== 'cancelled'
                          ? 'tracking-step-label--bold'
                          : 'tracking-step-label--gray'
                      }`}
                    >
                      Pago OK
                    </span>
                  </div>

                  {/* Paso 3: En camión / En planta */}
                  <div className="tracking-step-col">
                    <div
                      className={`tracking-step-circle ${
                        pedidoActivo.estado === 'completed'
                          ? 'tracking-step-circle--done'
                          : ['out_for_delivery', 'preparing', 'ready_for_pickup'].includes(pedidoActivo.estado)
                          ? 'tracking-step-circle--active'
                          : 'tracking-step-circle--gray'
                      }`}
                    >
                      {pedidoActivo.estado === 'completed' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Truck size={14} />
                      )}
                    </div>
                    <span
                      className={`tracking-step-label ${
                        ['out_for_delivery', 'preparing', 'ready_for_pickup'].includes(pedidoActivo.estado)
                          ? 'tracking-step-label--active'
                          : pedidoActivo.estado === 'completed'
                          ? 'tracking-step-label--bold'
                          : 'tracking-step-label--gray'
                      }`}
                    >
                      {pedidoActivo.estado === 'preparing' ? 'En planta' : 'En camión'}
                    </span>
                  </div>

                  {/* Paso 4: Entregado */}
                  <div className="tracking-step-col">
                    <div
                      className={`tracking-step-circle ${
                        pedidoActivo.estado === 'completed'
                          ? 'tracking-step-circle--done'
                          : 'tracking-step-circle--gray'
                      }`}
                    >
                      {pedidoActivo.estado === 'completed' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                    </div>
                    <span
                      className={`tracking-step-label ${
                        pedidoActivo.estado === 'completed'
                          ? 'tracking-step-label--bold'
                          : 'tracking-step-label--gray'
                      }`}
                    >
                      Entregado
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="detail-actions-box">
                <a
                  className="btn-whatsapp-advisor-full"
                  href={wspAsesor}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={15} />
                  <span>Contactar asesor Carlos Mercado</span>
                </a>

                <div className="detail-actions-2cols">
                  <button
                    type="button"
                    className="btn-repeat-order-subtle"
                    onClick={() => handleRepetirCompra(pedidoActivo)}
                  >
                    <Repeat2 size={14} />
                    <span>Repetir compra</span>
                  </button>
                  <button
                    type="button"
                    className="btn-invoice-pdf-subtle"
                    onClick={() => handleDescargarTicket(pedidoActivo)}
                  >
                    <FileText size={14} />
                    <span>Factura PDF</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <Package size={36} style={{ margin: '0 auto 0.75rem', color: '#9ca3af' }} />
              <p>Selecciona un pedido para ver su detalle logístico.</p>
            </div>
          )}
        </aside>
      </div>

      {/* ====================================================================
          5. FOOTER INSTITUCIONAL B2B
          ==================================================================== */}
      <footer className="orders-institutional-footer" data-purpose="institutional-footer">
        <div className="orders-footer-inner">
          <div className="orders-footer-brand-wrap">
            <strong>Terra</strong>
            <span className="orders-footer-pill">Autoservicio</span>
            <span>— Portal Oficial para Distribuidores y Cuentas Mayoristas Bolivia.</span>
          </div>
          <div className="orders-footer-links">
            <a href="#terminos" onClick={(e) => e.preventDefault()}>Términos Comerciales B2B</a>
            <a href="#garantia" onClick={(e) => e.preventDefault()}>Garantía de Fábrica</a>
            <span>Central Telefónica: +591 (2) 284-0000</span>
            <span style={{ color: '#9ca3af' }}>© 2025 Terra Autoservicio. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
