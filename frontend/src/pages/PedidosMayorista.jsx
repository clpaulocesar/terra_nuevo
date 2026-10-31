import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileSpreadsheet,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Repeat2,
  Search,
  Truck,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { listarMisPedidosMayorista, obtenerMiPedidoMayorista } from '../services/sesionClienteService.js';
import { WHATSAPP_COMPROBANTES } from '../services/api.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';

const ESTADOS_ESTILOS = {
  out_for_delivery: {
    label: 'En tránsito',
    badgeClase: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
    activeStep: 3,
  },
  preparing: {
    label: 'En preparación',
    badgeClase: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    activeStep: 3,
  },
  completed: {
    label: 'Entregado',
    badgeClase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    activeStep: 4,
  },
  pending: {
    label: 'Pendiente pago',
    badgeClase: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    activeStep: 1,
  },
  confirmed: {
    label: 'Cobrado',
    badgeClase: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    activeStep: 2,
  },
  cancelled: {
    label: 'Cancelado',
    badgeClase: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    activeStep: 0,
  },
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
  const [errorCarga, setErrorCarga] = useState('');

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
        const adaptados = lista.map((p, idx) => {
          const estadoKey = p.estado || 'pending';
          const estadoConfig = ESTADOS_ESTILOS[estadoKey] || {
            label: p.estado,
            badgeClase: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-300 dark:border-slate-700',
            activeStep: 1,
          };
          const fechaObj = new Date(p.fecha || Date.now());
          return {
            id: p.id || `p-${idx}`,
            codigo: p.codigo || `#TR-${String(p.id).slice(-4)}`,
            factura: 'Factura pendiente de emisión',
            facturaCompleta: 'Factura pendiente de emisión',
            fecha: p.fecha || new Date().toISOString(),
            fechaTexto: fechaObj.toLocaleDateString('es-BO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            horaTexto: fechaObj.toLocaleTimeString('es-BO', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            itemsResumen: p.items || 'Detalle no especificado',
            totalUnidades: calcularUnidades(p.items),
            total: Number(p.total || 0),
            metodoPago: p.metodo_pago ? p.metodo_pago.slice(0, 15) : 'Crédito 30d',
            metodoPagoCompleto: p.metodo_pago || 'Línea de Crédito 30 días (Aprobado)',
            estado: estadoKey,
            estadoTexto: estadoConfig.label,
            badgeClase: estadoConfig.badgeClase,
            llegadaEstimada:
              estadoKey === 'completed' ? 'Entregado conforme' : 'En proceso de despacho',
            lugarEntrega: p.direccion_entrega || 'Retiro en tienda / coordinar en caja',
            direccion_entrega: p.direccion_entrega || '',
            referencia_entrega: p.referencia_entrega || '',
            chofer: 'Pendiente de asignación',
            asesor: 'Consulta con un asesor TERRA',
            itemsDetalle: [
              {
                id: `linea-${idx}`,
                nombre: p.items || 'Lote de productos B2B',
                detalle: 'Medidas comerciales de catálogo mayorista',
                cantidad: calcularUnidades(p.items),
                precioUnitario: Math.round(Number(p.total || 0) / Math.max(1, calcularUnidades(p.items))),
                subtotal: Number(p.total || 0),
                descuento: null,
              },
            ],
          };
        });
        setPedidos(adaptados);
        setPedidoActivoId(adaptados[0]?.id || null);
        setErrorCarga('');
      })
      .catch((error) => {
        setPedidos([]);
        setPedidoActivoId(null);
        setErrorCarga(error.message || 'No se pudieron cargar tus pedidos.');
      })
      .finally(() => setCargando(false));
  }, [esMayorista, sesion?.token]);

  // Si se selecciona un pedido numérico real, intentar cargar items detallados
  useEffect(() => {
    if (!pedidoActivoId) return;
    let vigente = true;
    obtenerMiPedidoMayorista(sesion?.token, pedidoActivoId)
      .then((det) => {
        if (vigente && det?.items && Array.isArray(det.items) && det.items.length > 0) {
          setPedidos((prev) =>
            prev.map((p) => {
              if (p.id !== pedidoActivoId) return p;
              return {
                ...p,
                itemsDetalle: det.items.map((it, idx) => ({
                  id: it.productoId || `it-${idx}`,
                  nombre: it.nombre || 'Producto',
                  detalle: it.color ? `Color: ${it.color}` : 'Medida estándar mayorista',
                  cantidad: it.cantidad,
                  precioUnitario: it.precioUnitario || Math.round(it.subtotal / it.cantidad),
                  subtotal: it.subtotal,
                  descuento: null,
                })),
              };
            })
          );
        }
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [pedidoActivoId, sesion?.token]);

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

  const indicadores = useMemo(() => {
    const ahora = new Date();
    const activos = pedidos.filter((pedido) => !['completed', 'cancelled'].includes(pedido.estado));
    const entregadosMes = pedidos.filter((pedido) => {
      const fecha = new Date(pedido.fecha);
      return (
        pedido.estado === 'completed' &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    });
    const inversionAnual = pedidos
      .filter((pedido) => new Date(pedido.fecha).getFullYear() === ahora.getFullYear() && pedido.estado !== 'cancelled')
      .reduce((total, pedido) => total + Number(pedido.total || 0), 0);
    return {
      activos,
      enCamino: activos.filter((pedido) => pedido.estado === 'out_for_delivery').length,
      enPlanta: activos.filter((pedido) => pedido.estado !== 'out_for_delivery').length,
      entregadosMes: entregadosMes.length,
      inversionAnual,
    };
  }, [pedidos]);

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
    <div className="w-full max-w-[1580px] mx-auto flex flex-col gap-6 font-terra text-terra-texto pb-14">
      {/* 1. Header de Página */}
      <section className="p-5 sm:p-6 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-texto tracking-tight m-0">
              Mis pedidos
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-terra-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              {sesion?.nombre || 'Cliente mayorista'} • NIT: {sesion?.nit || 'Sin NIT'}
            </span>
          </div>
          <p className="text-terra-xs sm:text-terra-sm text-terra-texto-suave m-0">
            Gestión de pedidos mayoristas directos de fábrica y estado de despachos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer"
            onClick={handleExportarExcel}
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </button>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-xs font-bold transition-colors shadow-terra-sm"
          >
            <Plus size={16} />
            Nueva compra / Catálogo
          </Link>
        </div>
      </section>

      {/* 2. Sección de KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 sm:p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm divide-y md:divide-y-0 md:divide-x divide-terra-borde">
        {/* KPI 1: Activos en curso */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:px-3.5 first:pt-0 first:px-0">
          <div className="size-11 rounded-terra-campo bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider">
              Activos en curso
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-terra-texto">
                {indicadores.activos.length} pedidos
              </span>
              <span className="px-2 py-0.5 rounded-full text-terra-3xs font-extrabold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                {indicadores.enCamino} en camino · {indicadores.enPlanta} en gestión
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Entregados este mes */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:px-3.5 first:pt-0 first:px-0">
          <div className="size-11 rounded-terra-campo bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider">
              Entregados este mes
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {indicadores.entregadosMes} pedidos
              </span>
              <span className="px-2 py-0.5 rounded-full text-terra-3xs font-bold bg-terra-control text-terra-texto border border-terra-borde">
                Datos de tu cuenta
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Inversión acumulada */}
        <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:px-3.5 first:pt-0 first:px-0">
          <div className="size-11 rounded-terra-campo bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Coins size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider">
              Inversión acumulada {new Date().getFullYear()}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-terra-texto">
                {formatoMoneda(indicadores.inversionAnual)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-terra-3xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Total de pedidos
              </span>
            </div>
          </div>
        </div>
      </section>

      {errorCarga && (
        <div
          role="alert"
          className="p-3.5 rounded-terra-campo bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 text-terra-xs font-semibold"
        >
          {errorCarga}
        </div>
      )}

      {/* 3. Barra de Filtros */}
      <section className="p-4 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md flex items-center">
          <Search size={16} className="absolute left-3 text-terra-texto-suave pointer-events-none" />
          <input
            className="w-full min-h-[2.5rem] pl-9 pr-3 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-xs placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-terra-campo bg-terra-control border border-terra-borde gap-1">
            <button
              type="button"
              className={`px-3 py-1 rounded-terra-chico text-terra-xs font-bold transition-colors cursor-pointer ${
                segmentoActivo === 'todos'
                  ? 'bg-terra-superficie text-terra-texto shadow-terra-sm'
                  : 'text-terra-texto-suave hover:text-terra-texto'
              }`}
              onClick={() => {
                setSegmentoActivo('todos');
                setPaginaActual(1);
              }}
            >
              Todos
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-terra-chico text-terra-xs font-bold transition-colors cursor-pointer ${
                segmentoActivo === 'en_camino'
                  ? 'bg-terra-superficie text-terra-texto shadow-terra-sm'
                  : 'text-terra-texto-suave hover:text-terra-texto'
              }`}
              onClick={() => {
                setSegmentoActivo('en_camino');
                setPaginaActual(1);
              }}
            >
              En camino ({indicadores.enCamino})
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-terra-chico text-terra-xs font-bold transition-colors cursor-pointer ${
                segmentoActivo === 'completados'
                  ? 'bg-terra-superficie text-terra-texto shadow-terra-sm'
                  : 'text-terra-texto-suave hover:text-terra-texto'
              }`}
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
            className="px-3 py-1.5 text-terra-xs font-bold text-terra-texto-suave hover:text-terra-primario transition-colors cursor-pointer"
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

      {/* 4. Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Subsección A: Tabla Histórica de Pedidos (7 Cols en LG) */}
        <div className="lg:col-span-7 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-terra-borde bg-terra-superficie-2">
            <div className="flex items-center gap-2">
              <strong className="text-terra-xs font-bold text-terra-texto">Histórico de Pedidos</strong>
              <span className="px-2 py-0.5 rounded-full text-terra-3xs font-extrabold bg-terra-control text-terra-texto border border-terra-borde">
                {pedidosFiltrados.length} registros
              </span>
            </div>
            <span className="text-terra-3xs text-terra-texto-suave font-medium">Orden: Recientes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-terra-xs border-collapse">
              <thead>
                <tr className="border-b border-terra-borde bg-terra-superficie-2 text-terra-texto-suave font-extrabold uppercase tracking-wider text-terra-3xs">
                  <th className="p-3 pl-4">Pedido / Estado</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Productos</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 pr-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-terra-texto-suave">
                      Cargando pedidos mayoristas...
                    </td>
                  </tr>
                ) : pedidosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-terra-texto-suave">
                      No se encontraron pedidos con el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  pedidosPaginados.map((pedido) => {
                    const esSeleccionado = pedido.id === pedidoActivo?.id;

                    return (
                      <tr
                        key={pedido.id}
                        className={`border-b border-terra-borde transition-colors cursor-pointer ${
                          esSeleccionado
                            ? 'bg-terra-primario-suave/40 dark:bg-terra-primario-suave'
                            : 'hover:bg-terra-control/50'
                        }`}
                        onClick={() => setPedidoActivoId(pedido.id)}
                      >
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2">
                            <strong
                              className={`font-mono font-bold ${
                                esSeleccionado
                                  ? 'text-terra-primario dark:text-terra-acento'
                                  : 'text-terra-texto'
                              }`}
                            >
                              {pedido.codigo}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-terra-3xs font-extrabold border ${pedido.badgeClase}`}
                            >
                              {pedido.estadoTexto}
                            </span>
                          </div>
                          <div className="text-terra-3xs text-terra-texto-suave mt-0.5">
                            Factura: {pedido.factura}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-terra-texto">{pedido.fechaTexto}</div>
                          <div className="text-terra-3xs text-terra-texto-suave">{pedido.horaTexto}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-terra-texto truncate max-w-[180px]">
                            {pedido.itemsResumen}
                          </div>
                          <div className="text-terra-3xs text-terra-texto-suave">
                            {pedido.totalUnidades} unid. en total
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-terra-primario dark:text-terra-acento">
                            {formatoMoneda(pedido.total)}
                          </div>
                          <div className="text-terra-3xs font-medium text-terra-texto-suave">
                            {pedido.metodoPago}
                          </div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-terra-boton text-terra-xs font-bold transition-colors cursor-pointer ${
                              esSeleccionado
                                ? 'bg-terra-primario text-white shadow-terra-sm'
                                : 'bg-terra-control hover:bg-terra-control-hover text-terra-texto border border-terra-borde'
                            }`}
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

          {/* Paginador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-terra-borde bg-terra-superficie-2 text-terra-xs text-terra-texto-suave">
            <span>
              Mostrando {pedidosFiltrados.length === 0 ? 0 : (paginaActual - 1) * LIMITE_PAGINA + 1}-
              {Math.min(paginaActual * LIMITE_PAGINA, pedidosFiltrados.length)} de {pedidosFiltrados.length} pedidos
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="px-3 py-1 rounded-terra-chico border border-terra-borde bg-terra-superficie hover:bg-terra-control text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={paginaActual <= 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`w-7 h-7 rounded-terra-chico text-terra-xs font-bold transition-colors cursor-pointer ${
                    paginaActual === num
                      ? 'bg-terra-primario text-white'
                      : 'border border-terra-borde bg-terra-superficie hover:bg-terra-control text-terra-texto'
                  }`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="px-3 py-1 rounded-terra-chico border border-terra-borde bg-terra-superficie hover:bg-terra-control text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Subsección B: Panel de Detalle (5 Cols en LG) */}
        <aside className="lg:col-span-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm overflow-hidden sticky top-4 flex flex-col gap-4">
          {pedidoActivo ? (
            <>
              {/* Cabecera del Detalle */}
              <div className="p-5 border-b border-terra-borde bg-terra-superficie-2 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-terra-3xs font-extrabold uppercase tracking-wider text-terra-primario dark:text-terra-acento">
                        Detalle del Pedido
                      </span>
                      <span className="text-terra-sm font-mono font-bold text-terra-texto">
                        {pedidoActivo.codigo}
                      </span>
                    </div>
                    <p className="text-terra-xs text-terra-texto-suave m-0 mt-0.5">
                      {pedidoActivo.fechaTexto} • Factura {pedidoActivo.facturaCompleta || pedidoActivo.factura}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-terra-3xs font-extrabold border ${pedidoActivo.badgeClase}`}
                    >
                      <span className="size-1.5 rounded-full bg-current animate-pulse" />
                      {pedidoActivo.estadoTexto}
                    </span>
                    <div className="text-terra-3xs font-semibold text-terra-texto-suave">
                      {pedidoActivo.llegadaEstimada}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-terra-borde/60 text-terra-xs text-terra-texto-suave">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={14} className="shrink-0 text-terra-primario dark:text-terra-acento" />
                    <span className="truncate">{pedidoActivo.lugarEntrega}</span>
                  </div>
                  <span className="font-semibold shrink-0">{pedidoActivo.chofer}</span>
                </div>
              </div>

              {/* Lista de Ítems del Lote */}
              <div className="px-5 flex flex-col gap-3">
                <div className="text-terra-xs font-bold text-terra-texto">
                  Ítems del Lote ({pedidoActivo.totalUnidades} unidades)
                </div>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {(pedidoActivo.itemsDetalle || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-terra-campo border border-terra-borde bg-terra-superficie-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-8 rounded-md bg-terra-control border border-terra-borde text-terra-texto text-terra-xs font-bold flex items-center justify-center shrink-0">
                          {item.cantidad}x
                        </span>
                        <div className="flex flex-col min-w-0">
                          <h5 className="text-terra-xs font-bold text-terra-texto m-0 truncate">
                            {item.nombre}
                          </h5>
                          <p className="text-terra-3xs text-terra-texto-suave m-0 truncate">
                            {item.detalle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-terra-xs font-extrabold text-terra-primario dark:text-terra-acento">
                          {formatoMoneda(item.subtotal)}
                        </div>
                        <div className="text-terra-3xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.descuento || '-22% B2B'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total a pagar */}
                <div className="flex items-center justify-between p-3.5 rounded-terra-campo bg-terra-primario-suave border border-terra-primario/20">
                  <span className="text-terra-xs font-bold text-terra-texto">Total a pagar:</span>
                  <div className="text-right">
                    <div className="text-lg font-black text-terra-primario dark:text-terra-acento">
                      {formatoMoneda(pedidoActivo.total)}
                    </div>
                    <div className="text-terra-3xs font-semibold text-terra-texto-suave">
                      {pedidoActivo.metodoPagoCompleto}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stepper Horizontal */}
              <div className="px-5 flex flex-col gap-2.5">
                <div className="text-terra-xs font-bold text-terra-texto">
                  Seguimiento de Despacho
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 pb-2">
                  {/* Paso 1: Confirmado */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="size-7 rounded-full bg-terra-primario text-white flex items-center justify-center text-xs">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-terra-3xs font-bold text-terra-texto">Confirmado</span>
                  </div>

                  {/* Paso 2: Pago OK */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs ${
                        pedidoActivo.estado !== 'pending' && pedidoActivo.estado !== 'cancelled'
                          ? 'bg-terra-primario text-white'
                          : 'bg-terra-control text-terra-texto-suave border border-terra-borde'
                      }`}
                    >
                      {pedidoActivo.estado !== 'pending' && pedidoActivo.estado !== 'cancelled' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>
                    <span className="text-terra-3xs font-bold text-terra-texto">Pago OK</span>
                  </div>

                  {/* Paso 3: En camión */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs ${
                        pedidoActivo.estado === 'completed'
                          ? 'bg-terra-primario text-white'
                          : ['out_for_delivery', 'preparing', 'ready_for_pickup'].includes(pedidoActivo.estado)
                          ? 'bg-sky-600 text-white animate-pulse'
                          : 'bg-terra-control text-terra-texto-suave border border-terra-borde'
                      }`}
                    >
                      {pedidoActivo.estado === 'completed' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Truck size={14} />
                      )}
                    </div>
                    <span className="text-terra-3xs font-bold text-terra-texto">
                      {pedidoActivo.estado === 'preparing' ? 'En planta' : 'En camión'}
                    </span>
                  </div>

                  {/* Paso 4: Entregado */}
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs ${
                        pedidoActivo.estado === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-terra-control text-terra-texto-suave border border-terra-borde'
                      }`}
                    >
                      {pedidoActivo.estado === 'completed' ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                    </div>
                    <span className="text-terra-3xs font-bold text-terra-texto">Entregado</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="p-5 pt-0 flex flex-col gap-2.5">
                <a
                  className="w-full py-2.5 px-4 rounded-terra-boton bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-terra-xs font-bold flex items-center justify-center gap-2 transition-colors no-underline"
                  href={wspAsesor}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  <span>Contactar asesor Carlos Mercado</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer"
                    onClick={() => handleRepetirCompra(pedidoActivo)}
                  >
                    <Repeat2 size={14} />
                    <span>Repetir compra</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer"
                    onClick={() => handleDescargarTicket(pedidoActivo)}
                  >
                    <FileText size={14} />
                    <span>Descargar ticket</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-terra-texto-suave">
              <Package size={36} className="mx-auto mb-3 text-terra-texto-suave opacity-60" />
              <p className="text-terra-xs m-0">Selecciona un pedido para ver su detalle logístico.</p>
            </div>
          )}
        </aside>
      </div>

      {/* 5. Footer Institucional B2B */}
      <footer className="p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde text-terra-xs text-terra-texto-suave flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-extrabold text-terra-texto">TERRA</strong>
          <span className="px-2 py-0.5 rounded-full text-terra-3xs font-extrabold bg-terra-primario-suave text-terra-primario dark:text-terra-acento">
            Autoservicio
          </span>
          <span>— Portal Oficial para Distribuidores y Cuentas Mayoristas Bolivia.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-terra-3xs sm:text-terra-xs font-medium">
          <a href="#terminos" onClick={(e) => e.preventDefault()} className="hover:underline">
            Términos Comerciales B2B
          </a>
          <span>•</span>
          <a href="#garantia" onClick={(e) => e.preventDefault()} className="hover:underline">
            Garantía de Fábrica
          </a>
          <span>•</span>
          <span>Central Telefónica: +591 (2) 284-0000</span>
        </div>
      </footer>
    </div>
  );
}
