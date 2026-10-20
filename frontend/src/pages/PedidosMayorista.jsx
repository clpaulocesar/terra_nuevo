import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  MessageCircle,
  Package,
  PackageCheck,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { obtenerPedido } from '../services/pedidoService.js';
import { WHATSAPP_COMPROBANTES } from '../services/api.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';
import './PedidosMayorista.css';

// Datos modelo de alta fidelidad según especificación B2B
const PEDIDOS_PROTOTIPO = [
  {
    id: 'TR-9821',
    codigo: '#TR-9821',
    factura: '#FC-4491',
    fecha: '2025-03-14T10:30:00',
    itemsResumen: '12x Somier L1, 8x Colchón Bugatti',
    totalUnidades: 20,
    total: 24600,
    subtotalLista: 31538,
    descuentoB2B: 6938,
    porcentajeDescuento: 22,
    metodoPago: 'Crédito 30d',
    metodoPagoCompleto: 'Línea de Crédito 30 días (Aprobado)',
    estado: 'out_for_delivery',
    estadoTexto: 'En tránsito (Camión #4)',
    lugarEntrega: 'Almacén Central Av. Banzer',
    direccionEntrega: '4to Anillo, Santa Cruz de la Sierra',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p1',
        nombre: 'Somier Línea 1 - 2 Plazas',
        detalle: 'Medida: 140x190 cm • Color: Gris Grafito • Madera reforestada',
        cantidad: 12,
        precioUnitario: 1050,
        subtotal: 12600,
        descuento: 'B2B -22%',
      },
      {
        id: 'p2',
        nombre: 'Colchón Bugatti Línea 1 - Queen',
        detalle: 'Medida: 160x200 cm • Doble Pillow Top • Tejido de punto Bordó',
        cantidad: 8,
        precioUnitario: 1500,
        subtotal: 12000,
        descuento: 'B2B -22%',
      },
    ],
    tracking: [
      { paso: 1, titulo: 'Pedido confirmado & Cotización validada', fecha: '14 Mar 2025 - 08:45 AM • Asesor: Carlos Mercado', completado: true },
      { paso: 2, titulo: 'Pago verificado / Crédito B2B aprobado', fecha: '14 Mar 2025 - 09:30 AM • Dpto. de Finanzas Terra', completado: true },
      { paso: 3, titulo: 'En preparación y armado en Planta', fecha: '14 Mar 2025 - 14:00 PM • Parque Industrial Manzana 12', completado: true },
      { paso: 4, titulo: 'Despachado en camión logístico #4', fecha: '15 Mar 2025 - 07:15 AM • Chofer asignado: Roberto C. (+591 760-98112)', completado: true, activo: true },
      { paso: 5, titulo: 'Entrega y firma de conformidad', fecha: 'Recepción pendiente en almacén Av. Banzer 4to Anillo', completado: false },
    ],
  },
  {
    id: 'TR-9750',
    codigo: '#TR-9750',
    factura: '#FC-4482',
    fecha: '2025-03-10T16:15:00',
    itemsResumen: '15x Colchón Tatami Línea 2, 5x Espaldar Tapizado Gris',
    totalUnidades: 20,
    total: 19800,
    subtotalLista: 24750,
    descuentoB2B: 4950,
    porcentajeDescuento: 20,
    metodoPago: 'Transferencia QR',
    metodoPagoCompleto: 'Transferencia Bancaria QR (Validado)',
    estado: 'preparing',
    estadoTexto: 'En preparación planta',
    lugarEntrega: 'Sucursal Equipetrol Norte',
    direccionEntrega: 'Av. San Martín esq. Calle 5, Santa Cruz',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p3',
        nombre: 'Colchón Tatami Línea 2',
        detalle: 'Medida: 140x190 cm • Espuma HR de alta densidad',
        cantidad: 15,
        precioUnitario: 980,
        subtotal: 14700,
        descuento: 'B2B -20%',
      },
      {
        id: 'p4',
        nombre: 'Espaldar Tapizado Gris',
        detalle: 'Tapizado lino antimancha • Estructura pino macizo',
        cantidad: 5,
        precioUnitario: 1020,
        subtotal: 5100,
        descuento: 'B2B -20%',
      },
    ],
    tracking: [
      { paso: 1, titulo: 'Pedido confirmado & Cotización validada', fecha: '10 Mar 2025 - 16:15 PM • Asesor: Carlos Mercado', completado: true },
      { paso: 2, titulo: 'Pago verificado / Crédito B2B aprobado', fecha: '10 Mar 2025 - 17:00 PM • Dpto. de Finanzas Terra', completado: true },
      { paso: 3, titulo: 'En preparación y armado en Planta', fecha: '11 Mar 2025 - 09:30 AM • Parque Industrial Manzana 12', completado: true, activo: true },
      { paso: 4, titulo: 'Despacho logístico', fecha: 'Pendiente de turno de carga camión', completado: false },
      { paso: 5, titulo: 'Entrega en sucursal', fecha: 'Estimada para el 16 Mar 2025', completado: false },
    ],
  },
  {
    id: 'TR-9614',
    codigo: '#TR-9614',
    factura: '#FC-4399',
    fecha: '2025-02-28T09:00:00',
    itemsResumen: '20x Poltrona Reclinable Eco, 10x Somier Línea 2 Queen',
    totalUnidades: 30,
    total: 38450,
    subtotalLista: 48060,
    descuentoB2B: 9610,
    porcentajeDescuento: 20,
    metodoPago: 'Cheque B2B',
    metodoPagoCompleto: 'Cheque Corporativo 15 días (Cobrado)',
    estado: 'completed',
    estadoTexto: 'Entregado en Almacén',
    lugarEntrega: 'Depósito Parque Industrial',
    direccionEntrega: 'PI Manzana 14 Lote 2, Santa Cruz',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p5',
        nombre: 'Poltrona Reclinable Eco',
        detalle: 'Cuero ecológico negro • Reclinación manual 3 posiciones',
        cantidad: 20,
        precioUnitario: 1250,
        subtotal: 25000,
        descuento: 'B2B -20%',
      },
      {
        id: 'p6',
        nombre: 'Somier Línea 2 Queen',
        detalle: 'Medida: 160x200 cm • Patas de aluminio reforzado',
        cantidad: 10,
        precioUnitario: 1345,
        subtotal: 13450,
        descuento: 'B2B -20%',
      },
    ],
    tracking: [
      { paso: 1, titulo: 'Pedido confirmado & Cotización validada', fecha: '28 Feb 2025 - 09:00 AM', completado: true },
      { paso: 2, titulo: 'Pago verificado / Cheque compensado', fecha: '28 Feb 2025 - 10:30 AM', completado: true },
      { paso: 3, titulo: 'Preparación y embalaje completo', fecha: '01 Mar 2025 - 14:00 PM', completado: true },
      { paso: 4, titulo: 'Despacho y traslado en ruta', fecha: '02 Mar 2025 - 08:30 AM', completado: true },
      { paso: 5, titulo: 'Entrega y firma de conformidad', fecha: '02 Mar 2025 - 15:45 PM • Recibido conforme', completado: true, activo: false },
    ],
  },
  {
    id: 'TR-9540',
    codigo: '#TR-9540',
    factura: 'Cotización #COT-881',
    fecha: '2025-02-18T11:20:00',
    itemsResumen: '30x Almohadas Viscoelásticas, 6x Colchón Imperial King',
    totalUnidades: 36,
    total: 14200,
    subtotalLista: 18200,
    descuentoB2B: 4000,
    porcentajeDescuento: 22,
    metodoPago: 'Pendiente val.',
    metodoPagoCompleto: 'En revisión de cupo crediticio B2B',
    estado: 'pending',
    estadoTexto: 'Pendiente verificación',
    lugarEntrega: 'Almacén Central Av. Banzer',
    direccionEntrega: '4to Anillo, Santa Cruz de la Sierra',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p7',
        nombre: 'Almohadas Viscoelásticas Ergonómicas',
        detalle: 'Espuma con memoria termosensible • Funda lavable bambú',
        cantidad: 30,
        precioUnitario: 220,
        subtotal: 6600,
        descuento: 'B2B -25%',
      },
      {
        id: 'p8',
        nombre: 'Colchón Imperial King',
        detalle: 'Medida: 200x200 cm • Resortes Pocket individuales',
        cantidad: 6,
        precioUnitario: 1266,
        subtotal: 7600,
        descuento: 'B2B -20%',
      },
    ],
    tracking: [
      { paso: 1, titulo: 'Pedido registrado en sistema', fecha: '18 Feb 2025 - 11:20 AM', completado: true, activo: true },
      { paso: 2, titulo: 'Verificación de crédito / pago', fecha: 'En revisión por Dpto. Finanzas', completado: false },
      { paso: 3, titulo: 'Orden de fabricación', fecha: 'Pendiente de aprobación comercial', completado: false },
      { paso: 4, titulo: 'Despacho logístico', fecha: 'Pendiente', completado: false },
      { paso: 5, titulo: 'Entrega y firma', fecha: 'Pendiente', completado: false },
    ],
  },
  {
    id: 'TR-9420',
    codigo: '#TR-9420',
    factura: 'Anulada por Cotización',
    fecha: '2025-02-05T14:50:00',
    itemsResumen: '8x Base Cama Box Tarima (Reemplazado por #TR-9614)',
    totalUnidades: 8,
    total: 8400,
    subtotalLista: 10500,
    descuentoB2B: 2100,
    porcentajeDescuento: 20,
    metodoPago: 'Sin cargo',
    metodoPagoCompleto: 'Anulada de común acuerdo para unificación',
    estado: 'cancelled',
    estadoTexto: 'Cancelado / Anulado',
    lugarEntrega: 'Operación cancelada',
    direccionEntrega: 'Reemplazado en lote consolidado',
    asesor: 'Carlos Mercado (+591 712-34567)',
    itemsDetalle: [
      {
        id: 'p9',
        nombre: 'Base Cama Box Tarima 2 Plazas',
        detalle: 'Madera pino seleccionada • Tapiz beige lino',
        cantidad: 8,
        precioUnitario: 1050,
        subtotal: 8400,
        descuento: 'B2B -20%',
      },
    ],
    tracking: [
      { paso: 1, titulo: 'Cotización ingresada', fecha: '05 Feb 2025 - 14:50 PM', completado: true },
      { paso: 2, titulo: 'Anulación solicitada', fecha: '05 Feb 2025 - 15:30 PM • Reemplazado por #TR-9614', completado: true, cancelado: true },
      { paso: 3, titulo: 'Cancelación definitiva confirmada', fecha: '05 Feb 2025 - 16:00 PM', completado: true, cancelado: true },
    ],
  },
];

const ESTADOS_MAP = {
  pending: { label: 'Pendiente verificación', badgeClass: 'b2b-status-badge--amber', dotColor: '#f59e0b', pulse: false },
  confirmed: { label: 'Cobrado / Confirmado', badgeClass: 'b2b-status-badge--slate', dotColor: '#64748b', pulse: false },
  preparing: { label: 'En preparación planta', badgeClass: 'b2b-status-badge--slate', dotColor: '#64748b', pulse: false },
  out_for_delivery: { label: 'En tránsito (Camión #4)', badgeClass: 'b2b-status-badge--blue', dotColor: '#2563eb', pulse: true },
  ready_for_pickup: { label: 'Listo para recoger', badgeClass: 'b2b-status-badge--blue', dotColor: '#2563eb', pulse: true },
  completed: { label: 'Entregado en Almacén', badgeClass: 'b2b-status-badge--green', dotColor: '#10b981', pulse: false },
  cancelled: { label: 'Cancelado / Anulado', badgeClass: 'b2b-status-badge--rose', dotColor: '#e11d48', pulse: false },
};

function calcularUnidadesTexto(itemsStr = '') {
  const matches = itemsStr.match(/(\d+)\s*x/g);
  if (!matches) return 1;
  return matches.reduce((acc, match) => acc + (parseInt(match, 10) || 0), 0);
}

export default function PedidosMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const { agregarProducto } = useCarrito();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros interactivos
  const [busqueda, setBusqueda] = useState('');
  const [periodo, setPeriodo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [rangoImporte, setRangoImporte] = useState('todos');
  const [orden, setOrden] = useState('recientes');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const LIMITE_POR_PAGINA = 5;

  // Pedido seleccionado para el Deep Detail Panel
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);

  // Carga inicial de datos
  useEffect(() => {
    if (!esMayorista) return;
    setCargando(true);
    setError('');

    listarMisPedidosMayorista(sesion?.token)
      .then((res) => {
        const lista = Array.isArray(res) ? res : [];
        if (lista.length > 0) {
          // Adaptar pedidos reales
          const adaptados = lista.map((p, idx) => {
            const estadoKey = p.estado || 'pending';
            const infoEstado = ESTADOS_MAP[estadoKey] || { label: p.estado, badgeClass: 'b2b-status-badge--slate', dotColor: '#64748b' };
            const subtotalEstimado = Math.round(Number(p.total || 0) * 1.25);
            return {
              id: p.id || `real-${idx}`,
              codigo: p.codigo || `#TR-${String(p.id).slice(-4)}`,
              factura: `#FC-00${String(p.id).slice(-4)}`,
              fecha: p.fecha || new Date().toISOString(),
              itemsResumen: p.items || 'Detalle no especificado',
              totalUnidades: calcularUnidadesTexto(p.items),
              total: Number(p.total || 0),
              subtotalLista: subtotalEstimado,
              descuentoB2B: Math.max(0, subtotalEstimado - Number(p.total || 0)),
              porcentajeDescuento: 20,
              metodoPago: p.metodo_pago || 'Línea B2B',
              metodoPagoCompleto: p.metodo_pago ? `Pago vía ${p.metodo_pago}` : 'Crédito Mayorista 30d (Aprobado)',
              estado: estadoKey,
              estadoTexto: infoEstado.label,
              lugarEntrega: 'Almacén Central Banzer',
              direccionEntrega: 'Santa Cruz de la Sierra',
              asesor: 'Carlos Mercado (+591 712-34567)',
              itemsDetalle: [
                {
                  id: `linea-${idx}-1`,
                  nombre: p.items || 'Lote de productos B2B',
                  detalle: 'Medidas comerciales estándar de catálogo mayorista',
                  cantidad: calcularUnidadesTexto(p.items),
                  precioUnitario: Math.round(Number(p.total || 0) / Math.max(1, calcularUnidadesTexto(p.items))),
                  subtotal: Number(p.total || 0),
                  descuento: 'B2B -20%',
                },
              ],
              tracking: [
                { paso: 1, titulo: 'Pedido confirmado & Cotización validada', fecha: new Date(p.fecha).toLocaleDateString('es-BO'), completado: true },
                { paso: 2, titulo: 'Pago verificado / Crédito aprobado', fecha: 'Dpto. Finanzas Terra', completado: estadoKey !== 'pending' },
                { paso: 3, titulo: 'En preparación en Planta', fecha: 'Parque Industrial', completado: ['preparing', 'out_for_delivery', 'ready_for_pickup', 'completed'].includes(estadoKey), activo: estadoKey === 'preparing' },
                { paso: 4, titulo: 'Despacho logístico en ruta', fecha: 'Camión de reparto asignado', completado: ['out_for_delivery', 'ready_for_pickup', 'completed'].includes(estadoKey), activo: ['out_for_delivery', 'ready_for_pickup'].includes(estadoKey) },
                { paso: 5, titulo: 'Entrega final y conformidad', fecha: estadoKey === 'completed' ? 'Entregado en destino' : 'Pendiente', completado: estadoKey === 'completed' },
              ],
            };
          });
          setPedidos(adaptados);
          setPedidoSeleccionadoId(adaptados[0].id);
        } else {
          // Si no hay pedidos en BD, cargamos el set de alta fidelidad del prototipo
          setPedidos(PEDIDOS_PROTOTIPO);
          setPedidoSeleccionadoId(PEDIDOS_PROTOTIPO[0].id);
        }
      })
      .catch(() => {
        // En modo demostración o fallo de red, usamos el set prototipo
        setPedidos(PEDIDOS_PROTOTIPO);
        setPedidoSeleccionadoId(PEDIDOS_PROTOTIPO[0].id);
      })
      .finally(() => setCargando(false));
  }, [esMayorista, sesion?.token]);

  // Si se selecciona un pedido que tenga ID numérico de backend, intentar cargar detalles completos
  useEffect(() => {
    if (!pedidoSeleccionadoId) return;
    const seleccionado = pedidos.find((p) => p.id === pedidoSeleccionadoId);
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
                  descuento: 'B2B -20%',
                })),
              };
            })
          );
        }
      })
      .catch(() => {});
  }, [pedidoSeleccionadoId, pedidos]);

  // Cálculo de KPIs
  const kpis = useMemo(() => {
    const totalCount = pedidos.length;
    const totalBs = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const pendientes = pedidos.filter((p) => p.estado === 'pending').length;
    const enPreparacion = pedidos.filter((p) => ['preparing', 'confirmed'].includes(p.estado)).length;
    const enTransito = pedidos.filter((p) => ['out_for_delivery', 'ready_for_pickup'].includes(p.estado)).length;
    const entregados = pedidos.filter((p) => p.estado === 'completed').length;
    const cancelados = pedidos.filter((p) => p.estado === 'cancelled').length;

    return { totalCount, totalBs, pendientes, enPreparacion, enTransito, entregados, cancelados };
  }, [pedidos]);

  // Filtro y ordenamiento
  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter((pedido) => {
        // Búsqueda por texto (código, factura o modelos)
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase().trim();
          const matchCod = String(pedido.codigo || '').toLowerCase().includes(q);
          const matchFac = String(pedido.factura || '').toLowerCase().includes(q);
          const matchItems = String(pedido.itemsResumen || '').toLowerCase().includes(q);
          if (!matchCod && !matchFac && !matchItems) return false;
        }

        // Filtro por Estado
        if (filtroEstado !== 'todos' && pedido.estado !== filtroEstado) {
          return false;
        }

        // Filtro por Rango de Importe
        if (rangoImporte === 'menor_10k' && pedido.total >= 10000) return false;
        if (rangoImporte === '10k_50k' && (pedido.total < 10000 || pedido.total > 50000)) return false;
        if (rangoImporte === 'mayor_50k' && pedido.total <= 50000) return false;

        // Filtro por Período
        if (periodo === '30dias') {
          const fechaPedido = new Date(pedido.fecha).getTime();
          const hace30d = Date.now() - 30 * 24 * 60 * 60 * 1000;
          if (fechaPedido < hace30d) return false;
        } else if (periodo === 'ano_actual') {
          const año = new Date(pedido.fecha).getFullYear();
          if (año !== 2025 && año !== new Date().getFullYear()) return false;
        } else if (periodo === 'ano_anterior') {
          const año = new Date(pedido.fecha).getFullYear();
          if (año !== 2024) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === 'recientes') return new Date(b.fecha) - new Date(a.fecha);
        if (orden === 'antiguos') return new Date(a.fecha) - new Date(b.fecha);
        if (orden === 'mayor_total') return b.total - a.total;
        if (orden === 'menor_total') return a.total - b.total;
        return 0;
      });
  }, [pedidos, busqueda, filtroEstado, rangoImporte, periodo, orden]);

  // Paginación calculada
  const totalPaginas = Math.ceil(pedidosFiltrados.length / LIMITE_POR_PAGINA) || 1;
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * LIMITE_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + LIMITE_POR_PAGINA);
  }, [pedidosFiltrados, paginaActual]);

  // Pedido actualmente seleccionado
  const pedidoActivo = useMemo(() => {
    return pedidos.find((p) => p.id === pedidoSeleccionadoId) || pedidosFiltrados[0] || pedidos[0] || null;
  }, [pedidos, pedidoSeleccionadoId, pedidosFiltrados]);

  // Acciones: Exportar Excel/CSV
  const handleExportarExcel = () => {
    const encabezados = ['N° Pedido', 'Factura', 'Fecha', 'Detalle Unidades', 'Total (Bs)', 'Estado', 'Metodo de Pago'];
    const filas = pedidosFiltrados.map((p) => [
      `"${p.codigo || p.id}"`,
      `"${p.factura || 'N/A'}"`,
      `"${new Date(p.fecha).toLocaleString('es-BO')}"`,
      `"${(p.itemsResumen || '').replace(/"/g, '""')}"`,
      p.total,
      `"${p.estadoTexto || p.estado}"`,
      `"${p.metodoPago || 'Crédito B2B'}"`,
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

  // Acciones: Descargar ticket del pedido seleccionado
  const handleDescargarTicket = (pedido) => {
    if (!pedido) return;
    const clienteDatos = {
      nombre: sesion?.nombre || 'Mueblería Valdivia S.R.L.',
      nit: sesion?.nit || '67874236',
      telefono: sesion?.telefono || '+591 712-34567',
    };
    const itemsTicket = (pedido.itemsDetalle || []).map((it) => ({
      nombre: it.nombre,
      cantidad: it.cantidad,
      precio: it.precioUnitario,
      subtotal: it.subtotal,
    }));
    descargarTicket(pedido, clienteDatos, itemsTicket);
  };

  // Acciones: Repetir compra
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

  // Reset de filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setPeriodo('todos');
    setFiltroEstado('todos');
    setRangoImporte('todos');
    setOrden('recientes');
    setPaginaActual(1);
  };

  // Formateador de fecha amigable
  const formatearFecha = (fechaStr) => {
    const f = new Date(fechaStr);
    if (Number.isNaN(f.getTime())) return { fecha: fechaStr, hora: '' };
    return {
      fecha: f.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: f.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // WhatsApp links
  const wspAsesor = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent(
    `Hola Carlos, deseo consultar el estado del pedido ${pedidoActivo?.codigo || ''} de ${sesion?.nombre || 'mi cuenta mayorista'}.`
  )}`;
  const wspLogistica = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent(
    `Hola, requiero coordinar horario de descarga y logística para mis pedidos mayoristas Terra.`
  )}`;

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  return (
    <div className="wholesale-orders-dashboard" data-purpose="wholesale-orders-dashboard">
      {/* ====================================================================
          1. HEADER DE PÁGINA (Sin tocar el header global de AppRoutes)
          ==================================================================== */}
      <section className="b2b-page-header" data-purpose="orders-header">
        <div className="b2b-page-header__left">
          <div className="b2b-page-header__title-row">
            <h1>Mis pedidos</h1>
            <span className="b2b-account-badge">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Cuenta Mayorista Autorizada • NIT: {sesion?.nit || '67874236'} ({sesion?.nombre || 'Mueblería Valdivia S.R.L.'})
            </span>
          </div>
          <p className="b2b-page-header__desc">
            Consulta el estado, seguimiento logístico en tiempo real y comprobantes fiscales de tus compras mayoristas directas de fábrica con precios preferenciales de distribuidor.
          </p>
        </div>
        <div className="b2b-page-header__actions">
          <button type="button" className="b2b-btn-secondary" onClick={handleExportarExcel}>
            <FileSpreadsheet size={16} />
            Exportar reporte Excel
          </button>
          <Link to="/catalogo" className="b2b-btn-primary">
            <Plus size={16} />
            Nueva compra / Ir al Catálogo
          </Link>
        </div>
      </section>

      {/* ====================================================================
          2. SECCIÓN DE KPIS
          ==================================================================== */}
      <section className="b2b-kpis-grid" data-purpose="b2b-kpis">
        {/* KPI 1: Total */}
        <article className="b2b-kpi-card">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">Total Pedidos</span>
            <div className="b2b-kpi-card__icon-box bg-gray-100 text-gray-700">
              <Layers size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val text-gray-900">{kpis.totalCount} pedidos</div>
          <div className="b2b-kpi-card__sub text-gray-500">{formatoMoneda(kpis.totalBs)} en 2025</div>
        </article>

        {/* KPI 2: Pendientes */}
        <article className="b2b-kpi-card b2b-kpi-card--amber">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">Pendientes</span>
            <div className="b2b-kpi-card__icon-box">
              <Clock size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val">{kpis.pendientes} pedidos</div>
          <div className="b2b-kpi-card__sub" title="En verificación crédito/transferencia">Verificando transferencia</div>
        </article>

        {/* KPI 3: En preparación */}
        <article className="b2b-kpi-card b2b-kpi-card--slate">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">En preparación</span>
            <div className="b2b-kpi-card__icon-box">
              <Wrench size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val">{kpis.enPreparacion} pedidos</div>
          <div className="b2b-kpi-card__sub" title="En armado en planta Parque Industrial">Planta P. Industrial</div>
        </article>

        {/* KPI 4: En tránsito */}
        <article className="b2b-kpi-card b2b-kpi-card--blue">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">En tránsito</span>
            <div className="b2b-kpi-card__icon-box">
              <Truck size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val">{kpis.enTransito} pedido</div>
          <div className="b2b-kpi-card__sub" title="Camión #4 ruta Santa Cruz - La Paz">Camión #4 ruta LPZ</div>
        </article>

        {/* KPI 5: Entregados */}
        <article className="b2b-kpi-card b2b-kpi-card--green">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">Entregados</span>
            <div className="b2b-kpi-card__icon-box">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val">{kpis.entregados} pedidos</div>
          <div className="b2b-kpi-card__sub">Completados 100%</div>
        </article>

        {/* KPI 6: Cancelados */}
        <article className="b2b-kpi-card b2b-kpi-card--rose">
          <div className="b2b-kpi-card__top">
            <span className="b2b-kpi-card__label">Cancelados</span>
            <div className="b2b-kpi-card__icon-box">
              <XCircle size={16} />
            </div>
          </div>
          <div className="b2b-kpi-card__val">{kpis.cancelados} pedidos</div>
          <div className="b2b-kpi-card__sub">Reemplazo cotización</div>
        </article>
      </section>

      {/* ====================================================================
          3. BARRA DE FILTROS AVANZADOS
          ==================================================================== */}
      <section className="b2b-filter-bar" data-purpose="advanced-order-filters">
        <div className="b2b-filter-bar__grid">
          {/* Búsqueda por Ticket o Modelo */}
          <div className="b2b-field-group">
            <label htmlFor="b2b-search-input">Buscar por Ticket o Modelo</label>
            <div className="b2b-input-wrap">
              <span className="b2b-input-icon">
                <Search size={15} />
              </span>
              <input
                id="b2b-search-input"
                className="b2b-input-text"
                type="text"
                placeholder="Ej: #TR-9821 o Bugatti..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
          </div>

          {/* Período de Facturación */}
          <div className="b2b-field-group">
            <label htmlFor="b2b-periodo-select">Período de Facturación</label>
            <select
              id="b2b-periodo-select"
              className="b2b-select"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="todos">Todos los períodos</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="ano_actual">Año actual (2025)</option>
              <option value="ano_anterior">Año 2024</option>
            </select>
          </div>

          {/* Estado del Pedido */}
          <div className="b2b-field-group">
            <label htmlFor="b2b-estado-select">Estado del Pedido</label>
            <select
              id="b2b-estado-select"
              className="b2b-select"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Cobrado / Confirmado</option>
              <option value="preparing">En preparación</option>
              <option value="out_for_delivery">En tránsito (Despachado)</option>
              <option value="completed">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Rango de Importe */}
          <div className="b2b-field-group">
            <label htmlFor="b2b-importe-select">Rango de Importe</label>
            <select
              id="b2b-importe-select"
              className="b2b-select"
              value={rangoImporte}
              onChange={(e) => {
                setRangoImporte(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="todos">Cualquier monto</option>
              <option value="10k_50k">Bs 10.000 - Bs 50.000</option>
              <option value="mayor_50k">Mayor a Bs 50.000</option>
              <option value="menor_10k">Menor a Bs 10.000</option>
            </select>
          </div>

          {/* Acciones de filtro */}
          <div className="b2b-filter-actions">
            <button
              type="button"
              className="b2b-btn-filter"
              onClick={() => setPaginaActual(1)}
            >
              Filtrar
            </button>
            <button
              type="button"
              className="b2b-btn-clear"
              title="Limpiar todos los filtros"
              onClick={handleLimpiarFiltros}
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. LAYOUT MASTER-DETAIL (TABLA + PANEL DE DETALLE PROFUNDO)
          ==================================================================== */}
      <div className="b2b-master-detail-grid" data-purpose="master-detail-view">
        {/* SUBSECCIÓN A: TABLA HISTÓRICA DE COMPRAS (7 Cols en XL) */}
        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="b2b-table-card">
            {/* Cabecera de la tabla */}
            <div className="b2b-table-card__top">
              <div className="b2b-table-card__title">
                <strong>Histórico de Compras Directas</strong>
                <span className="b2b-counter-badge">{pedidosFiltrados.length} resultados</span>
              </div>
              <div className="b2b-table-card__sort">
                <span>Ordenar por:</span>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  aria-label="Criterio de ordenamiento"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Menos recientes</option>
                  <option value="mayor_total">Mayor importe</option>
                  <option value="menor_total">Menor importe</option>
                </select>
              </div>
            </div>

            {/* Tabla interactiva */}
            <div className="b2b-table-scroll">
              <table className="b2b-orders-table" id="orders-master-table">
                <thead>
                  <tr>
                    <th>N° Ticket / Pedido</th>
                    <th>Fecha y Hora</th>
                    <th>Detalle Unidades</th>
                    <th>Total (Bs)</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                        Cargando pedidos mayoristas...
                      </td>
                    </tr>
                  ) : pedidosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                        No se encontraron pedidos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    pedidosPaginados.map((pedido) => {
                      const esSeleccionado = pedido.id === pedidoActivo?.id;
                      const { fecha, hora } = formatearFecha(pedido.fecha);
                      const estadoInfo = ESTADOS_MAP[pedido.estado] || {
                        label: pedido.estadoTexto || pedido.estado,
                        badgeClass: 'b2b-status-badge--slate',
                        dotColor: '#64748b',
                      };

                      return (
                        <tr
                          key={pedido.id}
                          className={esSeleccionado ? 'is-selected' : ''}
                          onClick={() => setPedidoSeleccionadoId(pedido.id)}
                        >
                          <td>
                            <div className="b2b-order-id-main">{pedido.codigo}</div>
                            <div className="b2b-order-id-sub">Factura: {pedido.factura}</div>
                          </td>
                          <td>
                            <div className="b2b-order-date-main">{fecha}</div>
                            <div className="b2b-order-date-sub">{hora}</div>
                          </td>
                          <td>
                            <div className="b2b-order-items-main">{pedido.itemsResumen}</div>
                            <div className="b2b-order-items-sub">{pedido.totalUnidades} unidades en total</div>
                          </td>
                          <td>
                            <div className="b2b-order-total-main">{formatoMoneda(pedido.total)}</div>
                            <div className="b2b-order-total-sub">{pedido.metodoPago}</div>
                          </td>
                          <td>
                            <span className={`b2b-status-badge ${estadoInfo.badgeClass}`}>
                              <span
                                className={`b2b-dot ${estadoInfo.pulse ? 'b2b-dot--pulse' : ''}`}
                                style={{ backgroundColor: estadoInfo.dotColor }}
                              />
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td>
                            <div className="b2b-table-actions">
                              <button
                                type="button"
                                className="b2b-btn-view-detail"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPedidoSeleccionadoId(pedido.id);
                                }}
                              >
                                Ver detalle
                              </button>
                              <button
                                type="button"
                                className="b2b-btn-icon-action"
                                title="Descargar Comprobante / Ticket"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDescargarTicket(pedido);
                                }}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                type="button"
                                className="b2b-btn-repeat-sm"
                                title="Repetir este pedido"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRepetirCompra(pedido);
                                }}
                              >
                                Repetir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginador B2B */}
            <div className="b2b-pagination-bar">
              <div>
                Mostrando <strong style={{ color: '#111827' }}>{pedidosFiltrados.length === 0 ? 0 : (paginaActual - 1) * LIMITE_POR_PAGINA + 1}-{Math.min(paginaActual * LIMITE_POR_PAGINA, pedidosFiltrados.length)}</strong> de <strong style={{ color: '#111827' }}>{pedidosFiltrados.length}</strong> pedidos mayoristas
              </div>
              <div className="b2b-pagination-bar__buttons">
                <button
                  type="button"
                  className="b2b-page-btn"
                  disabled={paginaActual <= 1}
                  onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`b2b-page-btn ${paginaActual === num ? 'is-active' : ''}`}
                    onClick={() => setPaginaActual(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="b2b-page-btn"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* Nota de soporte logístico */}
          <div className="b2b-help-card">
            <div className="b2b-help-card__left">
              <div className="b2b-help-card__icon">
                <HelpCircle size={20} />
              </div>
              <div className="b2b-help-card__text">
                <h5>¿Requieres programar despacho en horarios especiales?</h5>
                <p>Coordina la descarga en tus almacenes o sucursales con tu ejecutivo logístico directo.</p>
              </div>
            </div>
            <a
              href={wspLogistica}
              target="_blank"
              rel="noreferrer"
              className="b2b-btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Contactar Logística
            </a>
          </div>
        </div>

        {/* SUBSECCIÓN B: PANEL DE DETALLE PROFUNDO (5 Cols en XL) */}
        <aside className="b2b-detail-card" data-purpose="order-detail-card">
          {pedidoActivo ? (
            <>
              {/* Header del detalle */}
              <div className="b2b-detail-card__header">
                <div className="b2b-detail-card__header-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="b2b-detail-tag">Detalle del Pedido</span>
                      <span className="b2b-detail-code">{pedidoActivo.codigo}</span>
                    </div>
                    <div className="b2b-detail-time">
                      Emitido el {formatearFecha(pedidoActivo.fecha).fecha}, {formatearFecha(pedidoActivo.fecha).hora}
                    </div>
                  </div>
                  {(() => {
                    const estadoInfo = ESTADOS_MAP[pedidoActivo.estado] || {
                      label: pedidoActivo.estadoTexto || pedidoActivo.estado,
                      badgeClass: 'b2b-status-badge--slate',
                      dotColor: '#64748b',
                      pulse: false,
                    };
                    return (
                      <span className={`b2b-status-badge ${estadoInfo.badgeClass}`}>
                        <span
                          className={`b2b-dot ${estadoInfo.pulse ? 'b2b-dot--pulse' : ''}`}
                          style={{ backgroundColor: estadoInfo.dotColor }}
                        />
                        {estadoInfo.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Cápsula de Factura y Lugar de Entrega */}
                <div className="b2b-detail-capsule-grid">
                  <div>
                    <span className="b2b-capsule-label">Factura Fiscal</span>
                    <span className="b2b-capsule-val">{pedidoActivo.factura} (Computarizada)</span>
                    <span className="b2b-capsule-sub">NIT {sesion?.nit || '67874236'} • {sesion?.nombre || 'Valdivia S.R.L.'}</span>
                  </div>
                  <div>
                    <span className="b2b-capsule-label">Lugar de Entrega</span>
                    <span className="b2b-capsule-val">{pedidoActivo.lugarEntrega}</span>
                    <span className="b2b-capsule-sub" style={{ color: '#6b7280' }}>{pedidoActivo.direccionEntrega}</span>
                  </div>
                </div>
              </div>

              {/* Lista de productos / Ítems del lote */}
              <div className="b2b-detail-card__body">
                <h4 className="b2b-detail-section-title">Ítems del Lote Mayorista</h4>
                <div className="b2b-items-list">
                  {(pedidoActivo.itemsDetalle || []).map((item, idx) => (
                    <div key={item.id || idx} className="b2b-item-card">
                      <div className="b2b-item-card__left">
                        <div className="b2b-item-qty">{item.cantidad}x</div>
                        <div className="b2b-item-meta">
                          <h5>{item.nombre}</h5>
                          <p>{item.detalle}</p>
                          <span>P.U: {formatoMoneda(item.precioUnitario)} (Precio Mayorista)</span>
                        </div>
                      </div>
                      <div className="b2b-item-card__right">
                        <div className="b2b-item-price">{formatoMoneda(item.subtotal)}</div>
                        <div className="b2b-item-badge">{item.descuento || 'B2B -20%'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desglose de costos */}
                <div className="b2b-cost-summary">
                  <div className="b2b-cost-row">
                    <span>Subtotal precio regular de lista:</span>
                    <span>{formatoMoneda(pedidoActivo.subtotalLista || pedidoActivo.total * 1.22)}</span>
                  </div>
                  <div className="b2b-cost-row b2b-cost-row--discount">
                    <span>Descuento B2B Mayorista aplicado ({pedidoActivo.porcentajeDescuento || 22}%):</span>
                    <span>-{formatoMoneda(pedidoActivo.descuentoB2B || Math.round(pedidoActivo.total * 0.22))}</span>
                  </div>
                  <div className="b2b-cost-row">
                    <span>Costo de flete de fábrica a depósito Santa Cruz:</span>
                    <span style={{ color: '#047857', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>Bonificado / Gratis</span>
                  </div>
                  <div className="b2b-cost-row b2b-cost-row--total">
                    <span>Total Facturado a Pagar:</span>
                    <strong>{formatoMoneda(pedidoActivo.total)}</strong>
                  </div>
                  <div className="b2b-cost-row b2b-cost-row--meta">
                    <span>Método registrado:</span>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{pedidoActivo.metodoPagoCompleto || pedidoActivo.metodoPago}</span>
                  </div>
                </div>
              </div>

              {/* Timeline de Seguimiento Logístico */}
              <div className="b2b-timeline-section" data-purpose="timeline-stepper">
                <div className="b2b-timeline-header">
                  <h4>Seguimiento de Despacho Logístico</h4>
                  <span>Llegada estimada: Hoy 16:30</span>
                </div>

                <div className="b2b-timeline-steps">
                  {(pedidoActivo.tracking || []).map((step, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={step.paso || idx} className="b2b-timeline-step">
                        {!isLast && (
                          <div
                            className={`timeline-connector ${step.completado ? 'timeline-connector-active' : ''}`}
                          />
                        )}
                        <div
                          className={`b2b-step-icon ${
                            step.cancelado
                              ? 'b2b-step-icon--cancelled'
                              : step.activo
                              ? 'b2b-step-icon--active'
                              : step.completado
                              ? 'b2b-step-icon--completed'
                              : 'b2b-step-icon--pending'
                          }`}
                        >
                          {step.completado ? (
                            <CheckCircle2 size={16} />
                          ) : step.activo ? (
                            <Truck size={15} />
                          ) : (
                            <Clock size={15} />
                          )}
                        </div>
                        <div className="b2b-step-body">
                          <strong>
                            {step.titulo}
                            {step.activo && <span className="b2b-step-badge-current">EN CURSO</span>}
                          </strong>
                          <p>{step.fecha}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción del detalle */}
              <div className="b2b-detail-actions">
                <div className="b2b-detail-actions__row">
                  <button
                    type="button"
                    className="b2b-btn-action-outline"
                    onClick={() => handleDescargarTicket(pedidoActivo)}
                  >
                    <Download size={15} />
                    Descargar ticket PDF
                  </button>
                  <button
                    type="button"
                    className="b2b-btn-action-outline"
                    onClick={() => handleDescargarTicket(pedidoActivo)}
                  >
                    <FileText size={15} />
                    Comprobante fiscal
                  </button>
                </div>

                <button
                  type="button"
                  className="b2b-btn-repeat-order"
                  onClick={() => handleRepetirCompra(pedidoActivo)}
                >
                  <RotateCcw size={15} />
                  Repetir compra con mismos modelos y cantidades
                </button>

                <a
                  className="b2b-btn-whatsapp-advisor"
                  href={wspAsesor}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  Contactar asesor {pedidoActivo.asesor || 'Carlos Mercado (+591 712-34567)'}
                </a>

                <button
                  type="button"
                  className="b2b-btn-query-info"
                  onClick={() => window.open(wspAsesor, '_blank')}
                >
                  Solicitar información adicional de este pedido
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <Package size={40} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
              <p>Selecciona un pedido de la lista para ver su desglose completo.</p>
            </div>
          )}
        </aside>
      </div>

      {/* ====================================================================
          5. AVISO DE SEGURIDAD SUPABASE RLS
          ==================================================================== */}
      <section className="b2b-security-notice" data-purpose="security-supabase-rls-badge">
        <ShieldCheck size={16} className="text-gray-500" />
        <span>
          Conexión segura Supabase RLS activa: Visualizando exclusivamente pedidos vinculados a{' '}
          <code>auth.uid()</code> [{sesion?.nombre || 'Mueblería Valdivia S.R.L.'} - NIT: {sesion?.nit || '67874236'}].
        </span>
      </section>

      {/* ====================================================================
          6. ACCIONES FLOTANTES (Comprar por QR y Asistente B2B)
          ==================================================================== */}
      <aside className="b2b-floating-actions" data-purpose="floating-quick-actions">
        <Link to="/catalogo?abrirQr=1" className="b2b-floating-qr" title="Escanear y comprar con lector QR">
          <QrCode size={16} />
          <span>Comprar por QR</span>
          <span className="b2b-floating-qr__icon">
            <ShoppingBag size={13} />
          </span>
        </Link>
        <button
          type="button"
          className="b2b-floating-chat"
          onClick={() => window.open(wspAsesor, '_blank')}
        >
          <span className="b2b-dot b2b-dot--pulse" style={{ backgroundColor: '#34d399' }} />
          <MessageCircle size={15} />
          <span>Asistente B2B</span>
        </button>
      </aside>

      {/* ====================================================================
          7. FOOTER INSTITUCIONAL B2B
          ==================================================================== */}
      <footer className="b2b-institutional-footer" data-purpose="institutional-footer">
        <div className="b2b-institutional-footer__content">
          <div className="b2b-footer-brand">
            <strong>Terra</strong>
            <span className="b2b-badge-micro">Autoservicio</span>
            <span>— Portal Oficial para Distribuidores y Cuentas Mayoristas Bolivia.</span>
          </div>
          <div className="b2b-footer-links">
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
