import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Box, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard,
  Download, ExternalLink, Eye, Package, Percent, ReceiptText, RotateCcw, Search,
  ShoppingBag, SlidersHorizontal, Tags, TrendingUp, Users,
} from 'lucide-react';
import { listarPedidos } from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
import { listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './Admin.css';
import './ReportesAdmin.css';

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const ESTADOS_COBRADOS = ['completed', 'paid', 'pagado', 'shipped', 'delivered', 'entregado'];

const ETIQUETA_ESTADO = {
  pending: 'Pendiente de caja',
  pendiente_pago: 'Pendiente de caja',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready_for_pickup: 'Listo para retiro',
  out_for_delivery: 'En despacho',
  paid: 'Cobrado',
  completed: 'Cobrado',
  pagado: 'Cobrado',
  shipped: 'En despacho',
  delivered: 'Entregado',
  entregado: 'Entregado',
  cancelled: 'Cancelado',
  cancelado: 'Cancelado',
};

const TONO_ESTADO = {
  Cobrado: 'ok', Entregado: 'ok', Confirmado: 'info', 'En preparación': 'info',
  'Listo para retiro': 'info', 'En despacho': 'info', 'Pendiente de caja': 'warn',
  Cancelado: 'bad', 'Sin estado': 'muted',
};

const PILLS = [
  ['hoy', 'Hoy'],
  ['ayer', 'Ayer'],
  ['7d', 'Últimos 7 días'],
  ['mes', 'Este mes'],
  ['mesAnterior', 'Mes anterior'],
  ['anio', 'Este año'],
  ['personalizado', 'Personalizado'],
];

const POR_PAGINA = 8;

/* ------------------------------------------------------------------ */
/* Utilidades de fecha y datos                                         */
/* ------------------------------------------------------------------ */

const inicioDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
const finDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
const sumarDias = (fecha, dias) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
const aISO = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
const deISO = (texto) => {
  const [anio, mes, dia] = String(texto || '').split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
};

const fechaCorta = (fecha) => new Date(fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
/** Convierte una clave de bucket (día/semana "yyyy-mm-dd" o mes "yyyy-mm") en fecha. */
const fechaDeClave = (clave) => (String(clave || '').length === 7
  ? new Date(Number(clave.slice(0, 4)), Number(clave.slice(5, 7)) - 1, 1)
  : deISO(clave));
const fechaHora = (fecha) => new Date(fecha).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const numero = (valor, decimales = 0) => Number(valor || 0).toLocaleString('es-BO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

function calcularRango(id) {
  const hoy = new Date();
  const base = inicioDia(hoy);
  if (id === 'hoy') return { inicio: base, fin: finDia(hoy) };
  if (id === 'ayer') { const ayer = sumarDias(base, -1); return { inicio: ayer, fin: finDia(ayer) }; }
  if (id === '7d') return { inicio: sumarDias(base, -6), fin: finDia(hoy) };
  if (id === 'mesAnterior') {
    return { inicio: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), fin: finDia(new Date(hoy.getFullYear(), hoy.getMonth(), 0)) };
  }
  if (id === 'anio') return { inicio: new Date(hoy.getFullYear(), 0, 1), fin: finDia(hoy) };
  return { inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1), fin: finDia(hoy) };
}

const esCobrado = (estado) => ESTADOS_COBRADOS.includes(String(estado || ''));

/** Métodos de pago registrados en las órdenes (payment_method). */
const METODO_PAGO = {
  qr: { etiqueta: 'QR / transferencia', corto: 'QR', color: '#a6192e', tono: 'red' },
  efectivo: { etiqueta: 'Efectivo', corto: 'Efectivo', color: '#b52619', tono: 'gray' },
  tarjeta: { etiqueta: 'Tarjeta', corto: 'Tarjeta', color: '#3d3d3d', tono: 'gray' },
  sin: { etiqueta: 'Sin registrar', corto: 'Sin dato', color: '#c8c6c5', tono: 'gray' },
};

const metodoDe = (pedido) => {
  const clave = String(pedido?.metodo_pago || '').trim().toLowerCase();
  return METODO_PAGO[clave] ? clave : 'sin';
};

const infoMetodo = (clave) => METODO_PAGO[clave] || METODO_PAGO.sin;

/** Convierte "2x Sofá Nikki, 1x Sahara" en [{ cantidad, nombre }]. */
function parsearItems(texto) {
  const items = [];
  const patron = /(\d+)\s*x\s*([^,]+)/gi;
  let coincidencia = patron.exec(String(texto || ''));
  while (coincidencia) {
    const nombre = coincidencia[2].trim();
    if (nombre) items.push({ cantidad: Number(coincidencia[1]) || 0, nombre });
    coincidencia = patron.exec(String(texto || ''));
  }
  return items;
}

function claveBucket(fecha, granularidad) {
  const valor = new Date(fecha);
  if (granularidad === 'mes') return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}`;
  if (granularidad === 'semana') {
    const dia = (valor.getDay() + 6) % 7;
    return aISO(sumarDias(inicioDia(valor), -dia));
  }
  return aISO(valor);
}

function etiquetaBucket(clave, granularidad) {
  if (granularidad === 'mes') {
    const [anio, mes] = clave.split('-').map(Number);
    return new Date(anio, mes - 1, 1).toLocaleDateString('es-BO', { month: 'short', year: '2-digit' });
  }
  return fechaCorta(deISO(clave));
}

function clavesDelPeriodo({ inicio, fin }, granularidad) {
  const claves = [];
  if (granularidad === 'mes') {
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    while (cursor <= fin) { claves.push(claveBucket(cursor, 'mes')); cursor.setMonth(cursor.getMonth() + 1); }
    return claves;
  }
  let cursor = inicioDia(inicio);
  if (granularidad === 'semana') cursor = sumarDias(cursor, -((cursor.getDay() + 6) % 7));
  const paso = granularidad === 'semana' ? 7 : 1;
  while (cursor <= fin) { claves.push(aISO(cursor)); cursor = sumarDias(cursor, paso); }
  return claves;
}

function agruparVentas(registros, granularidad) {
  const acc = new Map();
  registros.forEach((pedido) => {
    if (!esCobrado(pedido.estado)) return;
    const clave = claveBucket(pedido.fecha, granularidad);
    acc.set(clave, (acc.get(clave) || 0) + Number(pedido.total || 0));
  });
  return acc;
}

/** Trazo SVG suavizado (curvas Bézier con puntos de control horizontales). */
function trazoSuave(puntos) {
  if (!puntos.length) return '';
  if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;
  let trazo = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i += 1) {
    const medio = (puntos[i].x + puntos[i + 1].x) / 2;
    trazo += ` C ${medio} ${puntos[i].y}, ${medio} ${puntos[i + 1].y}, ${puntos[i + 1].x} ${puntos[i + 1].y}`;
  }
  return trazo;
}

function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csv = (filas) => filas.map((fila) => fila.map((celda) => `"${String(celda ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function ReportesAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [rango, setRango] = useState('mes');
  const [periodo, setPeriodo] = useState(() => calcularRango('mes'));
  const [borrador, setBorrador] = useState(() => {
    const inicial = calcularRango('mes');
    return { inicio: aISO(inicial.inicio), fin: aISO(inicial.fin) };
  });

  const [pago, setPago] = useState('todos');
  const [estado, setEstado] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [granularidad, setGranularidad] = useState('dia');
  const [tab, setTab] = useState('ventas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [menuExportAbierto, setMenuExportAbierto] = useState(false);
  const menuExportRef = useRef(null);

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const [pedidosData, productosData, clientesData] = await Promise.all([
        listarPedidos({ limite: 200 }),
        listarProductos({ limite: 200, todos: true }),
        listarClientes({ limite: 200 }),
      ]);
      setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
      setProductos(Array.isArray(productosData) ? productosData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos.');
      setPedidos([]);
      setProductos([]);
      setClientes([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(''), 2600);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  useEffect(() => {
    if (!menuExportAbierto) return undefined;
    const cerrar = (evento) => {
      if (menuExportRef.current && !menuExportRef.current.contains(evento.target)) setMenuExportAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [menuExportAbierto]);

  /* ---------------- Filtros ---------------- */

  const aplicarRango = (id) => {
    setRango(id);
    setPagina(1);
    if (id === 'personalizado') return;
    const nuevo = calcularRango(id);
    setPeriodo(nuevo);
    setBorrador({ inicio: aISO(nuevo.inicio), fin: aISO(nuevo.fin) });
  };

  const aplicarFechas = () => {
    const inicio = deISO(borrador.inicio);
    const fin = deISO(borrador.fin);
    if (!inicio || !fin) return;
    const [desde, hasta] = inicio <= fin ? [inicio, fin] : [fin, inicio];
    setPeriodo({ inicio: inicioDia(desde), fin: finDia(hasta) });
    setRango('personalizado');
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setPago('todos');
    setEstado('');
    setCategoria('todas');
    setBorrador({ inicio: '', fin: '' });
    aplicarRango('mes');
  };

  /* ---------------- Datos derivados ---------------- */

  const filtrados = useMemo(() => pedidos.filter((pedido) => {
    const fecha = new Date(pedido.fecha);
    if (Number.isNaN(fecha.getTime()) || fecha < periodo.inicio || fecha > periodo.fin) return false;
    if (estado && pedido.estado !== estado) return false;
    if (pago !== 'todos' && metodoDe(pedido) !== pago) return false;
    return true;
  }), [pedidos, periodo, estado, pago]);

  const periodoPrevio = useMemo(() => {
    const dias = Math.max(1, Math.round((periodo.fin.getTime() - periodo.inicio.getTime()) / 86400000));
    const fin = sumarDias(periodo.inicio, -1);
    return { inicio: inicioDia(sumarDias(fin, -dias)), fin: finDia(fin) };
  }, [periodo]);

  const cobrados = useMemo(() => filtrados.filter((pedido) => esCobrado(pedido.estado)), [filtrados]);
  const porCobrar = useMemo(() => filtrados.filter((pedido) => !esCobrado(pedido.estado) && !['cancelled', 'cancelado'].includes(pedido.estado)), [filtrados]);

  const ventas = useMemo(() => cobrados.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0), [cobrados]);
  const montoPorCobrar = useMemo(() => porCobrar.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0), [porCobrar]);
  const ticketPromedio = cobrados.length ? ventas / cobrados.length : 0;

  const previos = useMemo(() => pedidos.filter((pedido) => {
    const fecha = new Date(pedido.fecha);
    return !Number.isNaN(fecha.getTime()) && fecha >= periodoPrevio.inicio && fecha <= periodoPrevio.fin && esCobrado(pedido.estado);
  }), [pedidos, periodoPrevio]);
  const ventasPrevias = useMemo(() => previos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0), [previos]);
  const ticketPrevio = previos.length ? ventasPrevias / previos.length : 0;

  const itemsVendidos = useMemo(() => filtrados
    .filter((pedido) => esCobrado(pedido.estado))
    .reduce((suma, pedido) => suma + parsearItems(pedido.items).reduce((total, item) => total + item.cantidad, 0), 0), [filtrados]);

  const catalogo = useMemo(() => {
    const mapa = new Map();
    productos.forEach((producto) => mapa.set(String(producto.nombre || '').trim().toLowerCase(), producto));
    return mapa;
  }, [productos]);

  const categoriasDisponibles = useMemo(() => {
    const conjunto = new Set(productos.map((producto) => producto.categoria).filter(Boolean));
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const porProducto = useMemo(() => {
    const acumulado = new Map();
    filtrados.filter((pedido) => esCobrado(pedido.estado)).forEach((pedido) => {
      parsearItems(pedido.items).forEach(({ cantidad, nombre }) => {
        const clave = nombre.toLowerCase();
        const producto = catalogo.get(clave);
        if (categoria !== 'todas' && producto?.categoria !== categoria) return;
        const actual = acumulado.get(clave) || { nombre, unidades: 0, ingresos: 0, categoria: producto?.categoria || 'Sin categoría', stock: Number(producto?.stock ?? 0), precio: Number(producto?.precio || 0) };
        actual.unidades += cantidad;
        actual.ingresos += cantidad * actual.precio;
        acumulado.set(clave, actual);
      });
    });
    return Array.from(acumulado.values()).sort((a, b) => b.ingresos - a.ingresos || b.unidades - a.unidades);
  }, [filtrados, catalogo, categoria]);

  const porCategoria = useMemo(() => {
    const acumulado = new Map();
    porProducto.forEach((producto) => {
      const actual = acumulado.get(producto.categoria) || { categoria: producto.categoria, ingresos: 0, unidades: 0 };
      actual.ingresos += producto.ingresos;
      actual.unidades += producto.unidades;
      acumulado.set(producto.categoria, actual);
    });
    return Array.from(acumulado.values()).sort((a, b) => b.ingresos - a.ingresos);
  }, [porProducto]);

  const porEstado = useMemo(() => {
    const acumulado = new Map();
    filtrados.forEach((pedido) => {
      const clave = ETIQUETA_ESTADO[pedido.estado] || pedido.estado || 'Sin estado';
      const actual = acumulado.get(clave) || { estado: clave, cantidad: 0, monto: 0 };
      actual.cantidad += 1;
      actual.monto += Number(pedido.total || 0);
      acumulado.set(clave, actual);
    });
    return Array.from(acumulado.values()).sort((a, b) => b.cantidad - a.cantidad);
  }, [filtrados]);

  const clientesOrdenados = useMemo(() => [...clientes].sort((a, b) => Number(b.gasto || 0) - Number(a.gasto || 0)), [clientes]);
  const clientesActivos = useMemo(() => clientes.filter((cliente) => Number(cliente.compras) > 0).length, [clientes]);
  const stockCritico = useMemo(() => productos.filter((producto) => Number(producto.stock ?? 0) < 5).sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0)), [productos]);

  const porMetodo = useMemo(() => {
    const acumulado = new Map();
    cobrados.forEach((pedido) => {
      const clave = metodoDe(pedido);
      const actual = acumulado.get(clave) || { clave, pedidos: 0, monto: 0 };
      actual.pedidos += 1;
      actual.monto += Number(pedido.total || 0);
      acumulado.set(clave, actual);
    });
    return Array.from(acumulado.values()).sort((a, b) => b.monto - a.monto);
  }, [cobrados]);

  const donutMetodos = useMemo(() => {
    const segmentos = porMetodo.map((item) => {
      const fraccion = ventas > 0 ? item.monto / ventas : 0;
      return { ...item, ...infoMetodo(item.clave), porcentaje: fraccion * 100, porcion: fraccion * 238.76 };
    });
    return segmentos.map((segmento, indice) => ({
      ...segmento,
      offset: -segmentos.slice(0, indice).reduce((suma, previo) => suma + previo.porcion, 0),
    }));
  }, [porMetodo, ventas]);

  const metodoLider = porMetodo[0] || { clave: 'sin', monto: 0, pedidos: 0 };
  const porcentajeMetodoLider = ventas > 0 ? (metodoLider.monto / ventas) * 100 : 0;
  const tasaCobro = filtrados.length ? (cobrados.length / filtrados.length) * 100 : 0;

  /* ---------------- Serie del gráfico ---------------- */

  const serie = useMemo(() => {
    const claves = clavesDelPeriodo(periodo, granularidad);
    const valoresActual = agruparVentas(filtrados, granularidad);
    const clavesPrevias = clavesDelPeriodo(periodoPrevio, granularidad);
    const valoresPrevio = agruparVentas(previos, granularidad);
    return claves.map((clave, indice) => ({
      clave,
      etiqueta: etiquetaBucket(clave, granularidad),
      actual: valoresActual.get(clave) || 0,
      previo: valoresPrevio.get(clavesPrevias[indice]) || 0,
    }));
  }, [periodo, periodoPrevio, granularidad, filtrados, previos]);

  const grafico = useMemo(() => {
    const ancho = 760;
    const techo = 22;
    const piso = 206;
    const maximo = Math.max(...serie.map((punto) => Math.max(punto.actual, punto.previo)), 1);
    const ejeX = (indice) => (serie.length <= 1 ? ancho / 2 : (indice / (serie.length - 1)) * ancho);
    const ejeY = (valor) => piso - (valor / maximo) * (piso - techo);
    const puntos = serie.map((punto, indice) => ({ x: ejeX(indice), y: ejeY(punto.actual), valor: punto.actual }));
    const puntosPrevios = serie.map((punto, indice) => ({ x: ejeX(indice), y: ejeY(punto.previo) }));
    const indiceRecord = serie.reduce((mejor, punto, indice) => (punto.actual > serie[mejor].actual ? indice : mejor), 0);
    const linea = trazoSuave(puntos);
    const area = puntos.length ? `${linea} L ${puntos[puntos.length - 1].x} ${piso} L ${puntos[0].x} ${piso} Z` : '';
    return {
      ancho, techo, piso, maximo, puntos, puntosPrevios, linea, area, indiceRecord,
      previa: trazoSuave(puntosPrevios),
      record: serie[indiceRecord] || { etiqueta: '—', actual: 0 },
      recordX: puntos[indiceRecord]?.x ?? 0,
      recordY: puntos[indiceRecord]?.y ?? 0,
    };
  }, [serie]);

  const categoriasGrafico = useMemo(() => {
    const primeras = porCategoria.slice(0, 4);
    const resto = porCategoria.slice(4);
    if (resto.length) {
      primeras.push(resto.reduce((acc, item) => ({ categoria: 'Otras líneas', ingresos: acc.ingresos + item.ingresos, unidades: acc.unidades + item.unidades }), { categoria: 'Otras líneas', ingresos: 0, unidades: 0 }));
    }
    const maximo = Math.max(...primeras.map((item) => item.ingresos), 1);
    return { items: primeras, maximo, total: porCategoria.reduce((suma, item) => suma + item.ingresos, 0) };
  }, [porCategoria]);

  const topProductos = useMemo(() => {
    const maximo = Math.max(...porProducto.slice(0, 5).map((item) => item.ingresos), 1);
    return { items: porProducto.slice(0, 5), maximo };
  }, [porProducto]);

  const diaRecord = useMemo(() => {
    if (!serie.length) return null;
    return serie.reduce((mejor, punto) => (punto.actual > mejor.actual ? punto : mejor), serie[0]);
  }, [serie]);

  const variacion = (actual, previo) => (previo > 0 ? ((actual - previo) / previo) * 100 : null);

  /* ---------------- Tablas ---------------- */

  const textoBusqueda = busqueda.trim().toLowerCase();

  const pedidosTabla = useMemo(() => filtrados
    .filter((pedido) => !textoBusqueda || `${pedido.codigo} ${pedido.cliente} ${pedido.items}`.toLowerCase().includes(textoBusqueda))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)), [filtrados, textoBusqueda]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosTabla.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = pedidosTabla.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const clientesTabla = useMemo(() => clientesOrdenados
    .filter((cliente) => !textoBusqueda || `${cliente.nombre} ${cliente.telefono || ''} ${cliente.nit || ''}`.toLowerCase().includes(textoBusqueda))
    .slice(0, 12), [clientesOrdenados, textoBusqueda]);

  const inventarioTabla = useMemo(() => stockCritico
    .filter((producto) => !textoBusqueda || `${producto.nombre} ${producto.categoria}`.toLowerCase().includes(textoBusqueda)), [stockCritico, textoBusqueda]);

  /* ---------------- Exportación ---------------- */

  const filasExportables = () => {
    if (tab === 'productos') {
      return [['Producto', 'Categoría', 'Unidades', 'Facturación estimada (Bs)', 'Stock'],
        ...porProducto.map((item) => [item.nombre, item.categoria, item.unidades, item.ingresos.toFixed(2), item.stock])];
    }
    if (tab === 'pedidos') {
      return [['Estado', 'Pedidos', 'Monto (Bs)'], ...porEstado.map((item) => [item.estado, item.cantidad, item.monto.toFixed(2)])];
    }
    if (tab === 'clientes') {
      return [['Cliente', 'Teléfono', 'NIT', 'Compras', 'Gasto (Bs)'], ...clientesOrdenados.map((cliente) => [cliente.nombre, cliente.telefono || '', cliente.nit || '', cliente.compras || 0, Number(cliente.gasto || 0).toFixed(2)])];
    }
    if (tab === 'inventario') {
      return [['Producto', 'Categoría', 'Stock', 'Precio (Bs)'], ...stockCritico.map((producto) => [producto.nombre, producto.categoria, producto.stock, Number(producto.precio || 0).toFixed(2)])];
    }
    return [['Fecha', 'Ticket', 'Cliente', 'Método de pago', 'Artículos', 'Importe (Bs)', 'Estado'],
      ...pedidosTabla.map((pedido) => [fechaHora(pedido.fecha), `#${pedido.codigo}`, pedido.cliente, infoMetodo(metodoDe(pedido)).etiqueta, pedido.items, Number(pedido.total || 0).toFixed(2), ETIQUETA_ESTADO[pedido.estado] || pedido.estado])];
  };

  const exportarCSV = () => {
    descargar(`reporte-${tab}-${aISO(periodo.inicio)}_${aISO(periodo.fin)}.csv`, `\uFEFF${csv(filasExportables())}`, 'text/csv;charset=utf-8;');
    setMenuExportAbierto(false);
    setAviso('CSV del reporte generado.');
  };

  const exportarExcel = () => {
    const filas = filasExportables();
    const [encabezado, ...cuerpo] = filas;
    const tabla = `<table border="1"><thead><tr>${encabezado.map((celda) => `<th>${celda}</th>`).join('')}</tr></thead><tbody>${cuerpo.map((fila) => `<tr>${fila.map((celda) => `<td>${celda}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    descargar(`reporte-${tab}.xls`, `\uFEFF<html><head><meta charset="utf-8" /><style>@page{size:landscape;} table{border-collapse:collapse;font-size:11px;} th,td{border:1px solid #999;padding:4px 6px;white-space:nowrap;} th{background:#a6192e;color:#fff;font-weight:700;} tr:nth-child(even) td{background:#f6f3f2;}</style></head><body><h2 style="color:#a6192e;margin:0 0 8px;">TERRA Autoservicio · Reporte ${tab}</h2><p style="font-size:11px;color:#555;margin:0 0 10px;">Período: ${aISO(periodo.inicio)} a ${aISO(periodo.fin)} · ${filas.length - 1} filas · ${new Date().toLocaleString('es-BO')}</p>${tabla}</body></html>`, 'application/vnd.ms-excel');
    setMenuExportAbierto(false);
    setAviso('Exportación Excel generada.');
  };

  const exportarPDF = () => {
    setMenuExportAbierto(false);
    const filas = filasExportables();
    const [encabezado, ...cuerpo] = filas;
    const thead = encabezado.map((c) => `<th>${c}</th>`).join('');
    const tbody = cuerpo.map((fila) => `<tr>${fila.map((celda) => `<td>${celda ?? ''}</td>`).join('')}</tr>`).join('');
    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Reporte TERRA</title><style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1b1c1c; margin: 0; }
      h1 { color: #a6192e; font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 10px; color: #56605c; margin: 0 0 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 9px; }
      th, td { border: 1px solid #d9d4d3; padding: 4px 6px; text-align: left; vertical-align: top; }
      th { background: #a6192e; color: #fff; font-weight: 700; }
      tr:nth-child(even) td { background: #f6f3f2; }
      td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
      <h1>Reporte ${tab} · TERRA Autoservicio</h1>
      <p class="meta">Período: ${aISO(periodo.inicio)} a ${aISO(periodo.fin)} · ${cuerpo.length} filas · ${new Date().toLocaleString('es-BO')}</p>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
      <script>onload = () => { setTimeout(() => { window.print(); }, 250); };</script>
    </body></html>`;
    const ventana = window.open('', '_blank', 'width=1100,height=760');
    if (!ventana) { setAviso('Permite las ventanas emergentes para generar el PDF.'); return; }
    ventana.document.write(html);
    ventana.document.close();
    setAviso('PDF preparado (usa "Guardar como PDF").');
  };

  /* ---------------- Render ---------------- */

  const comparativa = variacion(ventas, ventasPrevias);
  const comparativaTicket = variacion(ticketPromedio, ticketPrevio);

  const kpis = [
    { clave: 'ventas', etiqueta: 'Ventas totales', valor: formatoMoneda(ventas), icono: CreditCard, detalle: comparativa === null ? 'Sin base de comparación' : `${comparativa >= 0 ? '+' : ''}${numero(comparativa, 1)}% vs período previo`, tono: comparativa === null ? 'neutro' : comparativa >= 0 ? 'ok' : 'bad' },
    { clave: 'pedidos', etiqueta: 'Pedidos totales', valor: `${numero(filtrados.length)} pedidos`, icono: ShoppingBag, detalle: `${numero(cobrados.length)} cobrados`, tono: 'ok' },
    { clave: 'ticket', etiqueta: 'Ticket promedio', valor: formatoMoneda(ticketPromedio), icono: ReceiptText, detalle: comparativaTicket === null ? 'Sin base de comparación' : `${comparativaTicket >= 0 ? '+' : ''}${numero(comparativaTicket, 1)}% vs período previo`, tono: comparativaTicket === null ? 'neutro' : comparativaTicket >= 0 ? 'ok' : 'bad' },
    { clave: 'items', etiqueta: 'Ítems vendidos', valor: `${numero(itemsVendidos)} unidades`, icono: Box, detalle: `${numero(porProducto.length)} productos con salida`, tono: 'ok' },
    { clave: 'clientes', etiqueta: 'Clientes activos', valor: `${numero(clientesActivos)} clientes`, icono: Users, detalle: `${numero(clientes.length)} registrados en total`, tono: 'ok' },
    { clave: 'cobrar', etiqueta: 'Por cobrar', valor: formatoMoneda(montoPorCobrar), icono: Clock3, detalle: `${numero(porCobrar.length)} pedidos en caja`, tono: porCobrar.length ? 'warn' : 'ok' },
  ];

  const insights = [
    {
      icono: TrendingUp, titulo: 'Mayor facturación',
      principal: topProductos.items[0]?.nombre || 'Sin ventas registradas',
      valor: topProductos.items[0] ? formatoMoneda(topProductos.items[0].ingresos) : '—',
      detalle: topProductos.items[0] ? `${numero(topProductos.items[0].unidades)} unidades vendidas en el período.` : 'Registrá pedidos para ver el ranking.',
    },
    {
      icono: Tags, titulo: 'Línea líder',
      principal: categoriasGrafico.items[0]?.categoria || 'Sin datos',
      valor: categoriasGrafico.total > 0 ? `${numero((categoriasGrafico.items[0].ingresos / categoriasGrafico.total) * 100, 1)}% del total` : '—',
      detalle: 'Participación de la categoría con mayor facturación estimada.',
    },
    {
      icono: CheckCircle2, titulo: 'Día récord',
      principal: diaRecord ? fechaCorta(fechaDeClave(diaRecord.clave)) : 'Sin datos',
      valor: diaRecord ? formatoMoneda(diaRecord.actual) : '—',
      detalle: diaRecord ? 'Jornada con mayor ingreso cobrado del período.' : 'Sin ventas en el período.',
    },
    {
      icono: CreditCard, titulo: 'Método más usado',
      principal: infoMetodo(metodoLider.clave).etiqueta,
      valor: `${numero(porcentajeMetodoLider, 1)}% del volumen`,
      detalle: metodoLider.pedidos
        ? `${numero(metodoLider.pedidos)} pedidos cobrados por ${formatoMoneda(metodoLider.monto)}.`
        : 'Sin pagos registrados en el período.',
    },
    {
      icono: Percent, titulo: 'Tasa de cobro',
      principal: `${numero(tasaCobro, 1)}% cobrado`,
      valor: `${numero(cobrados.length)} de ${numero(filtrados.length)}`,
      detalle: `${formatoMoneda(montoPorCobrar)} pendientes de liquidar en caja.`,
    },
    {
      icono: AlertTriangle, titulo: 'Reposición sugerida',
      principal: stockCritico[0]?.nombre || 'Inventario saludable',
      valor: stockCritico.length ? `${numero(stockCritico.length)} productos` : 'Sin alertas',
      detalle: stockCritico[0] ? `Solo ${numero(stockCritico[0].stock)} unidad(es) disponibles en showroom.` : 'Ningún producto por debajo de 5 unidades.',
    },
  ];

  const etiquetasEje = serie.length <= 8
    ? serie.map((punto) => punto.etiqueta)
    : Array.from({ length: 7 }, (_, indice) => serie[Math.round((indice * (serie.length - 1)) / 6)]?.etiqueta).filter(Boolean);

  const tabs = [
    ['ventas', 'Ventas'],
    ['productos', 'Productos'],
    ['pedidos', 'Pedidos'],
    ['clientes', 'Clientes'],
    ['inventario', 'Inventario'],
  ];

  return (
    <main className="reports">
      {/* Encabezado del módulo */}
      <header className="rep-hero">
        <div className="rep-hero__text">
          <span className="rep-eyebrow"><i /> Business Intelligence &amp; Analítica</span>
          <h1>Reportes y analítica</h1>
        </div>
        <div className="rep-actions">
          <div className="rep-dropdown" ref={menuExportRef}>
            <button type="button" className="rep-btn rep-btn--ghost" onClick={() => setMenuExportAbierto((abierto) => !abierto)} aria-expanded={menuExportAbierto}>
              <Download size={18} /> Exportar reporte <ChevronRight size={16} className={`rep-caret ${menuExportAbierto ? 'open' : ''}`} />
            </button>
            {menuExportAbierto && (
              <div className="rep-menu">
                <span className="rep-menu__title">Formatos de exportación</span>
                <button type="button" onClick={exportarExcel}><Box size={18} /><span><b>Excel (.xls)</b><small>Hojas con la vista actual</small></span></button>
                <button type="button" onClick={exportarPDF}><ReceiptText size={18} /><span><b>PDF ejecutivo</b><small>Resumen formateado</small></span></button>
                <button type="button" onClick={exportarCSV}><Download size={18} /><span><b>CSV delimitado</b><small>Compatible con ERP y BI</small></span></button>
              </div>
            )}
          </div>
          <button type="button" className="rep-btn rep-btn--primary" onClick={cargar} disabled={cargando}>
            <RotateCcw size={18} className={cargando ? 'rep-spin' : ''} /> {cargando ? 'Actualizando…' : 'Actualizar datos'}
          </button>
        </div>
        {aviso && <p className="rep-toast" role="status">{aviso}</p>}
      </header>

      {/* Filtros */}
      <section className="rep-filters">
        <div className="rep-filters__pills">
          <span className="rep-filters__label"><SlidersHorizontal size={15} /> Rango rápido</span>
          {PILLS.map(([id, etiqueta]) => (
            <button type="button" key={id} className={`rep-pill ${rango === id ? 'active' : ''}`} onClick={() => aplicarRango(id)}>{etiqueta}</button>
          ))}
        </div>
        <div className="rep-filters__fields">
          <label><span>Fecha inicio</span><input type="date" value={borrador.inicio} onChange={(evento) => setBorrador((actual) => ({ ...actual, inicio: evento.target.value }))} /></label>
          <label><span>Fecha término</span><input type="date" value={borrador.fin} onChange={(evento) => setBorrador((actual) => ({ ...actual, fin: evento.target.value }))} /></label>
          <label><span>Método de pago</span>
            <select value={pago} onChange={(evento) => { setPago(evento.target.value); setPagina(1); }}>
              <option value="todos">Todos los métodos</option>
              <option value="qr">QR / transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="sin">Sin registrar</option>
            </select>
          </label>
          <label><span>Estado de pago</span>
            <select value={estado} onChange={(evento) => { setEstado(evento.target.value); setPagina(1); }}>
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente de caja</option>
              <option value="completed">Cobrado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label><span>Línea de producto</span>
            <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
              <option value="todas">Todas las líneas</option>
              {categoriasDisponibles.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          </label>
          <div className="rep-filters__actions">
            <button type="button" className="rep-btn rep-btn--primary" onClick={aplicarFechas}><SlidersHorizontal size={16} /> Aplicar</button>
            <button type="button" className="rep-btn rep-btn--icon" onClick={limpiarFiltros} title="Limpiar parámetros"><RotateCcw size={16} /></button>
          </div>
        </div>
      </section>

      {error && <p className="rep-alert" role="alert"><AlertTriangle size={17} /> {error}</p>}

      {/* KPIs */}
      <section className="rep-kpis">
        {kpis.map(({ clave, etiqueta, valor, icono: Icono, detalle, tono }) => (
          <article className="rep-kpi" key={clave}>
            <div className="rep-kpi__top"><span>{etiqueta}</span><i><Icono size={17} /></i></div>
            <b>{valor}</b>
            <small className={`rep-badge rep-badge--${tono}`}>{detalle}</small>
          </article>
        ))}
      </section>

      {/* Gráficos principales */}
      <section className="rep-charts">
        <article className="rep-card rep-span-8">
          <header className="rep-card__head">
            <div><h2>Evolución de ventas y pedidos</h2><p>Ingresos cobrados por {granularidad === 'dia' ? 'día' : granularidad === 'semana' ? 'semana' : 'mes'} comparados con el período anterior (Bs).</p></div>
            <div className="rep-switch">
              {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([id, etiqueta]) => (
                <button type="button" key={id} className={granularidad === id ? 'active' : ''} onClick={() => setGranularidad(id)}>{etiqueta}</button>
              ))}
            </div>
          </header>
          <div className="rep-legend">
            <span><i className="dot dot--red" /> Período actual ({formatoMoneda(ventas)})</span>
            <span><i className="dot dot--gray" /> Período anterior ({formatoMoneda(ventasPrevias)})</span>
          </div>
          <div className="rep-chart">
            {serie.length === 0
              ? <p className="rep-empty">Sin pedidos para el rango seleccionado.</p>
              : (
                <>
                  <svg viewBox={`0 0 ${grafico.ancho} 220`} preserveAspectRatio="none" role="img" aria-label="Evolución de ventas">
                    <defs>
                      <linearGradient id="repArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#a6192e" stopOpacity="0.26" />
                        <stop offset="92%" stopColor="#a6192e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[22, 70, 118, 166].map((y) => <line key={y} x1="0" x2={grafico.ancho} y1={y} y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />)}
                    <line x1="0" x2={grafico.ancho} y1={grafico.piso} y2={grafico.piso} stroke="#e2e8f0" strokeWidth="1" />
                    <path d={grafico.previa} fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="6 5" />
                    <path d={grafico.area} fill="url(#repArea)" />
                    <path d={grafico.linea} fill="none" stroke="#a6192e" strokeWidth="3" />
                    {grafico.puntos.length <= 40 && grafico.puntos.map((punto, indice) => (
                      <circle key={indice} cx={punto.x} cy={punto.y} r={indice === grafico.indiceRecord ? 6 : 4} fill={indice === grafico.indiceRecord ? '#a6192e' : '#fff'} stroke={indice === grafico.indiceRecord ? '#fff' : '#a6192e'} strokeWidth={indice === grafico.indiceRecord ? 3 : 2} />
                    ))}
                  </svg>
                  {grafico.record.actual > 0 && (
                    <div className="rep-tooltip" style={{ left: `${(grafico.recordX / grafico.ancho) * 100}%` }}>
                      <span>Récord · {fechaCorta(fechaDeClave(grafico.record.clave))}</span>
                      <b>{formatoMoneda(grafico.record.actual)}</b>
                    </div>
                  )}
                </>
              )}
          </div>
          <footer className="rep-axis">{etiquetasEje.map((etiqueta, indice) => <span key={`${etiqueta}-${indice}`}>{etiqueta}</span>)}</footer>
        </article>

        <article className="rep-card rep-span-4">
          <header className="rep-card__head">
            <div><h2>Ventas por método de pago</h2><p>Participación de cada forma de cobro registrada en las órdenes cobradas.</p></div>
            <CreditCard size={20} />
          </header>
          <div className="rep-donut">
            <svg viewBox="0 0 100 100" role="img" aria-label="Distribución por método de pago">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <g transform="rotate(-90 50 50)">
                {donutMetodos.map((segmento) => (
                  <circle
                    key={segmento.clave}
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke={segmento.color}
                    strokeDasharray={`${segmento.porcion} 238.76`}
                    strokeDashoffset={`${segmento.offset}`}
                    strokeWidth="12"
                  />
                ))}
              </g>
            </svg>
            <div className="rep-donut__center"><b>{numero(porcentajeMetodoLider, 0)}%</b><span>{infoMetodo(metodoLider.clave).corto}</span></div>
          </div>
          <div className="rep-rows">
            {donutMetodos.map((segmento) => (
              <div key={segmento.clave}>
                <i className="dot" style={{ background: segmento.color }} />
                <span><b>{segmento.etiqueta} ({numero(segmento.porcentaje, 0)}%)</b><small>{numero(segmento.pedidos)} pedidos cobrados</small></span>
                <strong>{formatoMoneda(segmento.monto)}</strong>
              </div>
            ))}
            {donutMetodos.length === 0 && <p className="rep-empty">Sin pagos registrados en el período.</p>}
          </div>
        </article>

        <article className="rep-card rep-span-7">
          <header className="rep-card__head">
            <div><h2>TOP 5 productos con mayor facturación</h2><p>Ranking por ingresos estimados usando el precio vigente del catálogo.</p></div>
            <TrendingUp size={20} />
          </header>
          {topProductos.items.length === 0 ? <p className="rep-empty">Sin productos vendidos en el período.</p> : (
            <div className="rep-bars">
              {topProductos.items.map((item, indice) => (
                <div className="rep-bar" key={item.nombre}>
                  <div className="rep-bar__top">
                    <span className="rep-bar__rank">{indice + 1}</span>
                    <span className="rep-bar__name">{item.nombre}<small>({numero(item.unidades)} unidades)</small></span>
                    <b>{formatoMoneda(item.ingresos)}</b>
                  </div>
                  <div className="rep-bar__track"><div style={{ width: `${Math.max(6, (item.ingresos / topProductos.maximo) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rep-card rep-span-5">
          <header className="rep-card__head">
            <div><h2>Ventas por categoría</h2><p>Distribución de la facturación estimada por línea de producto.</p></div>
            <Tags size={20} />
          </header>
          {categoriasGrafico.items.length === 0 ? <p className="rep-empty">Sin datos de categoría.</p> : (
            <>
              <div className="rep-columns">
                {categoriasGrafico.items.map((item) => (
                  <div className="rep-column" key={item.categoria}>
                    <span>{categoriasGrafico.total > 0 ? `${numero((item.ingresos / categoriasGrafico.total) * 100, 0)}%` : '0%'}</span>
                    <div><i style={{ height: `${Math.max(5, (item.ingresos / categoriasGrafico.maximo) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <footer className="rep-columns__labels">
                {categoriasGrafico.items.map((item) => (
                  <span key={item.categoria}><b>{item.categoria}</b><small>{formatoMoneda(item.ingresos)}</small></span>
                ))}
              </footer>
            </>
          )}
        </article>
      </section>

      {/* Tablas por pestaña */}
      <section className="rep-card rep-card--table">
        <header className="rep-card__head rep-card__head--tabs">
          <div className="rep-tabs">
            {tabs.map(([id, etiqueta]) => (
              <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setPagina(1); }}>{etiqueta}</button>
            ))}
          </div>
          <div className="rep-tools">
            <label><Search size={16} /><input value={busqueda} onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }} placeholder="Filtrar por ticket, cliente o producto…" /></label>
            <button type="button" className="rep-btn rep-btn--ghost rep-btn--sm" onClick={exportarCSV}><Download size={15} /> Exportar vista</button>
          </div>
        </header>

        {tab === 'ventas' && (
          <>
            <div className="rep-table-wrap">
              <table className="rep-table">
                <thead><tr><th>Fecha y hora</th><th>N° ticket</th><th>Cliente</th><th>Pago</th><th>Artículos</th><th>Importe</th><th>Estado</th><th className="right">Acciones</th></tr></thead>
                <tbody>
                  {filasPagina.map((pedido) => {
                    const etiqueta = ETIQUETA_ESTADO[pedido.estado] || pedido.estado || 'Sin estado';
                    return (
                      <tr key={pedido.id}>
                        <td className="mono muted">{fechaHora(pedido.fecha)}</td>
                        <td className="mono red">#{pedido.codigo}</td>
                        <td><b>{pedido.cliente}</b></td>
                        <td><span className={`rep-tag ${infoMetodo(metodoDe(pedido)).tono === 'red' ? 'rep-tag--red' : 'rep-tag--gray'}`}>{infoMetodo(metodoDe(pedido)).etiqueta}</span></td>
                        <td className="muted small">{pedido.items || '—'}</td>
                        <td><b>{formatoMoneda(pedido.total)}</b></td>
                        <td><span className={`rep-estado rep-estado--${TONO_ESTADO[etiqueta] || 'muted'}`}>{etiqueta}</span></td>
                        <td className="right">
                          {pedido.comprobante_url
                            ? <a className="rep-action" href={pedido.comprobante_url} target="_blank" rel="noreferrer" title="Ver comprobante"><ExternalLink size={17} /></a>
                            : <span className="rep-action is-off" title="Sin comprobante adjunto"><Eye size={17} /></span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filasPagina.length === 0 && <tr><td colSpan="8" className="rep-empty">No hay pedidos registrados con los filtros actuales.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="rep-pager">
              <span>Mostrando <b>{filasPagina.length}</b> de <b>{numero(pedidosTabla.length)}</b> registros emitidos</span>
              <div className="rep-pager__controls">
                <button type="button" disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(totalPaginas, 5) }, (_, indice) => indice + 1).map((numeroPagina) => (
                  <button type="button" key={numeroPagina} className={paginaActual === numeroPagina ? 'active' : ''} onClick={() => setPagina(numeroPagina)}>{numeroPagina}</button>
                ))}
                {totalPaginas > 5 && <span className="rep-pager__dots">… {totalPaginas}</span>}
                <button type="button" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)} aria-label="Página siguiente"><ChevronRight size={16} /></button>
              </div>
            </footer>
          </>
        )}

        {tab !== 'ventas' && (
          <div className="rep-table-wrap">
            <table className="rep-table">
              {tab === 'productos' && (
                <>
                  <thead><tr><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Facturación estimada</th><th>Stock</th></tr></thead>
                  <tbody>
                    {porProducto.slice(0, 12).map((item) => (
                      <tr key={item.nombre}>
                        <td><b>{item.nombre}</b></td>
                        <td className="muted">{item.categoria}</td>
                        <td>{numero(item.unidades)}</td>
                        <td><b>{formatoMoneda(item.ingresos)}</b></td>
                        <td><span className={`rep-estado rep-estado--${item.stock > 0 ? 'ok' : 'bad'}`}>{numero(item.stock)} u.</span></td>
                      </tr>
                    ))}
                    {porProducto.length === 0 && <tr><td colSpan="5" className="rep-empty">Sin productos vendidos con los filtros actuales.</td></tr>}
                  </tbody>
                </>
              )}
              {tab === 'pedidos' && (
                <>
                  <thead><tr><th>Estado</th><th>Pedidos</th><th>Monto</th><th>Participación</th></tr></thead>
                  <tbody>
                    {porEstado.map((item) => (
                      <tr key={item.estado}>
                        <td><span className={`rep-estado rep-estado--${TONO_ESTADO[item.estado] || 'muted'}`}>{item.estado}</span></td>
                        <td><b>{numero(item.cantidad)}</b></td>
                        <td>{formatoMoneda(item.monto)}</td>
                        <td className="muted">{filtrados.length ? numero((item.cantidad / filtrados.length) * 100, 1) : '0'}%</td>
                      </tr>
                    ))}
                    {porEstado.length === 0 && <tr><td colSpan="4" className="rep-empty">Sin pedidos en el período.</td></tr>}
                  </tbody>
                </>
              )}
              {tab === 'clientes' && (
                <>
                  <thead><tr><th>Cliente</th><th>Contacto</th><th>Compras</th><th>Gasto acumulado</th></tr></thead>
                  <tbody>
                    {clientesTabla.map((cliente) => (
                      <tr key={cliente.id}>
                        <td><b>{cliente.nombre}</b><small className="rep-sub">{new Date(cliente.fecha_registro).toLocaleDateString('es-BO')}</small></td>
                        <td className="muted">{cliente.telefono || 'Sin teléfono'}<small className="rep-sub">{cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT'}</small></td>
                        <td>{numero(cliente.compras)} compras</td>
                        <td><b>{formatoMoneda(cliente.gasto)}</b></td>
                      </tr>
                    ))}
                    {clientesTabla.length === 0 && <tr><td colSpan="4" className="rep-empty">Sin clientes que coincidan con la búsqueda.</td></tr>}
                  </tbody>
                </>
              )}
              {tab === 'inventario' && (
                <>
                  <thead><tr><th>Producto</th><th>Categoría</th><th>Stock showroom</th><th>Precio</th><th>Estado</th></tr></thead>
                  <tbody>
                    {inventarioTabla.slice(0, 12).map((producto) => (
                      <tr key={producto.id}>
                        <td><b>{producto.nombre}</b></td>
                        <td className="muted">{producto.categoria}</td>
                        <td>{numero(producto.stock)} u.</td>
                        <td>{formatoMoneda(producto.precio)}</td>
                        <td><span className={`rep-estado rep-estado--${Number(producto.stock) === 0 ? 'bad' : 'warn'}`}>{Number(producto.stock) === 0 ? 'Sin stock' : 'Reponer'}</span></td>
                      </tr>
                    ))}
                    {inventarioTabla.length === 0 && <tr><td colSpan="5" className="rep-empty">Inventario sin alertas: todos los productos superan 5 unidades.</td></tr>}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </section>

      {/* Insights */}
      <section className="rep-insights-wrap">
        <h3><TrendingUp size={18} /> Insights y diagnóstico comercial</h3>
        <div className="rep-insights">
          {insights.map(({ icono: Icono, titulo, principal, valor, detalle }) => (
            <article className="rep-insight" key={titulo}>
              <span className="rep-insight__top"><Icono size={18} /> {titulo}</span>
              <b>{principal}</b>
              <strong>{valor}</strong>
              <p>{detalle}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="rep-footnote"><Package size={14} /> Información calculada con {numero(pedidos.length)} pedidos, {numero(productos.length)} productos y {numero(clientes.length)} clientes registrados en la base de datos.</p>
    </main>
  );
}
