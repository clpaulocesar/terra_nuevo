import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  ImagePlus,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  actualizarItemsPedido,
  actualizarEstadoPedido,
  listarPedidos,
  obtenerPedido,
  registrarPagoPedido,
  verificarPedidoErp,
  confirmarErpManual,
  reintentarErp,
} from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
import AvisoErp from '../../components/admin/AvisoErp.jsx';
import { etiquetaEstadoErp } from '../../utils/erpCambios.js';
import { getAdminUser } from '../../services/adminService.js';
import { subirComprobantePago } from '../../services/storageService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { imprimirTicketPedido } from '../../utils/imprimirTicket.js';
import { descargarTicket } from '../../utils/descargarTicket.js';
import ReportePedidosVendedor from '../../components/vendedor/ReportePedidosVendedor.jsx';
import './Admin.css';
import ModalQrPago from '../../components/ui/ModalQrPago.jsx';
import './PedidosAdmin.css';

const etiquetas = { pending: 'Pendiente de pago', pendiente_pago: 'Pendiente de pago', paid: 'Cobrado', completed: 'Cobrado', pagado: 'Cobrado', shipped: 'En despacho', delivered: 'Entregado', entregado: 'Entregado', cancelled: 'Cancelado', cancelado: 'Cancelado' };
const POR_COBRAR = ['pending', 'pendiente_pago'];
const esAnulado = (estado) => ['cancelled', 'cancelado'].includes(String(estado || '').toLowerCase());
const EN_DESPACHO = ['ready_for_pickup', 'out_for_delivery', 'shipped', 'entregado', 'delivered'];
const TEXTO_BUSQUEDA = 'Cliente, teléfono, NIT o ticket';

function formatoFechaHora(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/La_Paz',
  }).format(d);
}

export default function PedidosAdmin() {
  const [params] = useSearchParams();
  const location = useLocation();
  const usuario = getAdminUser();
  const esVendedor = location.pathname.startsWith('/vendedor') || usuario?.rol === 'vendedor';
  const [tab, setTab] = useState('todos');
  const [buscar, setBuscar] = useState(() => params.get('q') || '');
  const [pedidos, setPedidos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [metodo, setMetodo] = useState('qr');
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [subiendoPago, setSubiendoPago] = useState(false);
  const [anulandoId, setAnulandoId] = useState(null);
  const [imprimiendoId, setImprimiendoId] = useState(null);
  const [mostrarQrModal, setMostrarQrModal] = useState(false);

  // Verificación contra el ERP de TERRA al abrir el modal de cobro (§5 de la integración).
  const [verificandoErp, setVerificandoErp] = useState(false);
  const [cambiosErp, setCambiosErp] = useState([]);
  const [avisoErp, setAvisoErp] = useState('');
  const [erpListo, setErpListo] = useState(false);
  const [bloqueadoErp, setBloqueadoErp] = useState(false);
  const [procesandoErp, setProcesandoErp] = useState(false);

  // Estados para edición y adición de productos si el cliente cambia de opinión
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoItems, setCargandoItems] = useState(false);
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsEditados, setItemsEditados] = useState([]);
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mensajeEdicion, setMensajeEdicion] = useState('');
  const [direccionEdicion, setDireccionEdicion] = useState('');
  const [referenciaEdicion, setReferenciaEdicion] = useState('');

  const cargarPedidos = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      const data = await listarPedidos({ buscar: buscar.trim(), limite: 200 });
      setPedidos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) { setError(err.message || 'No se pudieron cargar los pedidos.'); }
    finally { setCargando(false); setActualizando(false); }
  }, [buscar]);

  useEffect(() => {
    const id = setTimeout(() => cargarPedidos(), buscar.trim() ? 350 : 0);
    return () => clearTimeout(id);
  }, [cargarPedidos, buscar]);
  useEffect(() => {
    const refrescar = () => cargarPedidos({ silencioso: true });
    window.addEventListener('terra:pedidos-nuevos', refrescar);
    return () => window.removeEventListener('terra:pedidos-nuevos', refrescar);
  }, [cargarPedidos]);

  // Escape cierra el modal del pedido (accesibilidad de teclado).
  useEffect(() => {
    if (!seleccion) return undefined;
    const alEscape = (event) => { if (event.key === 'Escape') setSeleccion(null); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [seleccion]);

  const tabs = useMemo(() => {
    const base = [
      ['todos', 'Todos'],
      ['pending', 'Pendientes de pago'],
      ['completed', 'Cobrados'],
    ];
    if (!esVendedor) {
      base.push(['shipped', 'En despacho']);
      base.push(['erp_verificar', 'Verificar ERP']);
    }
    base.push(['cancelled', 'Anulados']);
    return base;
  }, [esVendedor]);

  const vista = useMemo(() => pedidos.filter((pedido) => {
    if (tab === 'todos') return true;
    if (tab === 'pending') return POR_COBRAR.includes(pedido.estado);
    if (tab === 'shipped') return EN_DESPACHO.includes(pedido.estado);
    if (tab === 'cancelled') return ['cancelled', 'cancelado'].includes(String(pedido.estado || '').toLowerCase());
    if (tab === 'erp_verificar') return pedido.erp_estado === 'verificar';
    return pedido.estado === tab;
  }), [pedidos, tab]);
  const pendientes = pedidos.filter((pedido) => POR_COBRAR.includes(pedido.estado)).length;

  const abrirPedido = async (pedido, { iniciarEnEdicion = false } = {}) => {
    setSeleccion(pedido);
    setMetodo(pedido.metodo_pago === 'tarjeta' ? 'tarjeta' : 'efectivo');
    setArchivoComprobante(null);
    setError('');
    setModoEdicion(iniciarEnEdicion);
    setMensajeEdicion('');
    setDireccionEdicion(pedido.direccion_entrega || '');
    setReferenciaEdicion(pedido.referencia_entrega || '');
    setBusquedaCatalogo('');
    setMostrarCatalogo(false);

    if (iniciarEnEdicion) {
      cargarCatalogo();
      setCargandoItems(true);
    }

    try {
      const completo = await obtenerPedido(pedido.id);
      if (completo) {
        const nombreCliente = typeof completo.cliente === 'object' && completo.cliente !== null
          ? (completo.cliente.nombre || completo.cliente_nombre || pedido.cliente || 'Compra como invitado')
          : (completo.cliente || completo.cliente_nombre || pedido.cliente || 'Compra como invitado');
        const telCliente = typeof completo.cliente === 'object' && completo.cliente !== null
          ? (completo.cliente.telefono || completo.cliente_telefono || pedido.cliente_telefono || '')
          : (completo.cliente_telefono || pedido.cliente_telefono || '');
        const nitCliente = typeof completo.cliente === 'object' && completo.cliente !== null
          ? (completo.cliente.nit || completo.cliente_nit || pedido.cliente_nit || '')
          : (completo.cliente_nit || pedido.cliente_nit || '');
        const dirEntrega = typeof completo.cliente === 'object' && completo.cliente !== null
          ? (completo.cliente.direccion || completo.direccion_entrega || pedido.direccion_entrega || '')
          : (completo.direccion_entrega || pedido.direccion_entrega || '');
        const refEntrega = typeof completo.cliente === 'object' && completo.cliente !== null
          ? (completo.cliente.referencia || completo.referencia_entrega || pedido.referencia_entrega || '')
          : (completo.referencia_entrega || pedido.referencia_entrega || '');

        setDireccionEdicion(dirEntrega || '');
        setReferenciaEdicion(refEntrega || '');
        setSeleccion((prev) => (prev && prev.id === pedido.id ? {
          ...prev,
          ...completo,
          cliente: nombreCliente,
          cliente_nombre: nombreCliente,
          cliente_telefono: telCliente,
          cliente_nit: nitCliente,
          direccion_entrega: dirEntrega,
          referencia_entrega: refEntrega,
          items_detalle: completo.items || prev.items_detalle,
          cant_envio: (completo.items || []).filter((it) => (it.tipo_entrega || it.tipoEntrega) === 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
          cant_llevado: (completo.items || []).filter((it) => (it.tipo_entrega || it.tipoEntrega) !== 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
        } : prev));
        if (Array.isArray(completo.items)) {
          setItemsEditados(
            completo.items.map((it) => ({
              productoId: it.productoId || it.id,
              nombre: it.nombre || it.product_name,
              sku: it.sku || '',
              cantidad: Number(it.cantidad || 1),
              precioUnitario: Number(it.precioUnitario || 0),
              subtotal: Number(it.subtotal || 0),
              tipo_entrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
              tipoEntrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
            }))
          );
        }
      }
    } catch (err) {
      if (iniciarEnEdicion) {
        setError(err.message || 'No se pudieron cargar los artículos para edición.');
      }
    } finally {
      if (iniciarEnEdicion) {
        setCargandoItems(false);
      }
    }
    // Antes de cobrar, el ERP de TERRA valida stock y precio de cada ítem.
    if (POR_COBRAR.includes(pedido.estado) && !iniciarEnEdicion && pedido.erp_estado !== 'verificar') {
      await verificarConErp(pedido.id);
    }
  };

  const abrirPedidoParaEdicion = (pedido) => {
    abrirPedido(pedido, { iniciarEnEdicion: true });
  };

  const cargarCatalogo = async () => {
    if (catalogoProductos.length > 0) return;
    try {
      const prods = await listarProductos({ limite: 150 });
      setCatalogoProductos(Array.isArray(prods) ? prods : []);
    } catch (e) {
      console.error('Error cargando catálogo para edición:', e);
    }
  };

  const iniciarEdicion = async () => {
    setModoEdicion(true);
    setMensajeEdicion('');
    if (seleccion) {
      setDireccionEdicion(seleccion.direccion_entrega || '');
      setReferenciaEdicion(seleccion.referencia_entrega || '');
    }
    cargarCatalogo();
    if (!itemsEditados.length && seleccion) {
      setCargandoItems(true);
      try {
        const completo = await obtenerPedido(seleccion.id);
        if (completo && Array.isArray(completo.items)) {
          setItemsEditados(
            completo.items.map((it) => ({
              productoId: it.productoId || it.id,
              nombre: it.nombre || it.product_name,
              sku: it.sku || '',
              cantidad: Number(it.cantidad || 1),
              precioUnitario: Number(it.precioUnitario || 0),
              subtotal: Number(it.subtotal || 0),
              tipo_entrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
              tipoEntrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
            }))
          );
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los artículos para edición.');
      } finally {
        setCargandoItems(false);
      }
    }
  };

  const cambiarCantidadItem = (index, delta) => {
    setItemsEditados((prev) => {
      const copia = [...prev];
      const actual = copia[index];
      const nuevaCantidad = Math.max(1, Math.min(100, (actual.cantidad || 1) + delta));
      copia[index] = {
        ...actual,
        cantidad: nuevaCantidad,
        subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
      };
      return copia;
    });
  };

  const alternarTipoEntregaEditado = (index) => {
    setItemsEditados((prev) => {
      const copia = [...prev];
      const actual = copia[index];
      const nuevoTipo = (actual.tipo_entrega === 'home_delivery' || actual.tipoEntrega === 'home_delivery') ? 'store_pickup' : 'home_delivery';
      copia[index] = {
        ...actual,
        tipo_entrega: nuevoTipo,
        tipoEntrega: nuevoTipo,
      };
      return copia;
    });
  };

  const fijarCantidadItem = (index, valor) => {
    const num = parseInt(valor, 10);
    if (Number.isNaN(num)) return;
    const nuevaCantidad = Math.max(1, Math.min(100, num));
    setItemsEditados((prev) => {
      const copia = [...prev];
      const actual = copia[index];
      copia[index] = {
        ...actual,
        cantidad: nuevaCantidad,
        subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
      };
      return copia;
    });
  };

  const eliminarItem = (index) => {
    if (itemsEditados.length <= 1) {
      alert('El pedido debe tener al menos un producto.');
      return;
    }
    setItemsEditados((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarProductoAlPedido = (prod) => {
    setItemsEditados((prev) => {
      const idx = prev.findIndex(
        (it) => String(it.productoId) === String(prod.id) || (prod.sku && it.sku === prod.sku) || it.nombre === prod.nombre
      );
      if (idx >= 0) {
        const copia = [...prev];
        const actual = copia[idx];
        const nuevaCantidad = Math.min(100, (actual.cantidad || 1) + 1);
        copia[idx] = {
          ...actual,
          cantidad: nuevaCantidad,
          subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
        };
        return copia;
      }
      const precio = Number(prod.precio || 0);
      const defaultTipo = prev.length > 0 && prev.every((it) => (it.tipo_entrega || it.tipoEntrega) === 'home_delivery') ? 'home_delivery' : 'store_pickup';
      return [
        ...prev,
        {
          productoId: prod.id,
          nombre: prod.nombre,
          sku: prod.sku,
          cantidad: 1,
          precioUnitario: precio,
          subtotal: precio,
          tipo_entrega: defaultTipo,
          tipoEntrega: defaultTipo,
        },
      ];
    });
    setBusquedaCatalogo('');
    setMostrarCatalogo(false);
  };

  const totalItemsEditados = useMemo(() => {
    return itemsEditados.reduce((acc, it) => acc + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0);
  }, [itemsEditados]);

  const productosFiltrados = useMemo(() => {
    const query = busquedaCatalogo.trim().toLowerCase();
    if (!query) return catalogoProductos.slice(0, 8);
    return catalogoProductos.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.categoria || '').toLowerCase().includes(query)
    ).slice(0, 8);
  }, [catalogoProductos, busquedaCatalogo]);

  const cantEnvioEditados = useMemo(() => {
    return itemsEditados.filter((it) => (it.tipo_entrega || it.tipoEntrega) === 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0);
  }, [itemsEditados]);

  const cantLlevadoEditados = useMemo(() => {
    return itemsEditados.filter((it) => (it.tipo_entrega || it.tipoEntrega) !== 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0);
  }, [itemsEditados]);

  const marcarTodosComoLlevado = () => {
    setItemsEditados((prev) => prev.map((it) => ({
      ...it,
      tipo_entrega: 'store_pickup',
      tipoEntrega: 'store_pickup',
    })));
  };

  const marcarTodosComoEnvio = () => {
    setItemsEditados((prev) => prev.map((it) => ({
      ...it,
      tipo_entrega: 'home_delivery',
      tipoEntrega: 'home_delivery',
    })));
  };

  const guardarCambiosItems = async () => {
    if (!itemsEditados.length) {
      alert('El pedido debe contener al menos un producto.');
      return;
    }
    if (cantEnvioEditados > 0 && !direccionEdicion.trim()) {
      setError('Debes ingresar la dirección de entrega para los productos con envío.');
      return;
    }
    setGuardandoItems(true);
    setError('');
    setMensajeEdicion('');
    try {
      const dirFinal = cantEnvioEditados > 0 ? direccionEdicion.trim() : null;
      const refFinal = cantEnvioEditados > 0 ? referenciaEdicion.trim() : null;
      const respuesta = await actualizarItemsPedido(seleccion.id, itemsEditados, {
        direccion: dirFinal,
        referencia: refFinal,
      });
      const pedidoActualizado = respuesta.data || respuesta;

      const nuevoTotal = Number(pedidoActualizado.total || (pedidoActualizado.total_minor ? pedidoActualizado.total_minor / 100 : 0) || totalItemsEditados);
      const itemsCadena = Array.isArray(pedidoActualizado.items)
        ? pedidoActualizado.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')
        : itemsEditados.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ');

      const nuevaCantEnvio = itemsEditados.filter((it) => (it.tipo_entrega || it.tipoEntrega) === 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0);
      const nuevaCantLlevado = itemsEditados.filter((it) => (it.tipo_entrega || it.tipoEntrega) !== 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0);

      setSeleccion((prev) => ({
        ...prev,
        total: nuevoTotal,
        items: itemsCadena,
        items_detalle: Array.isArray(pedidoActualizado.items) ? pedidoActualizado.items : itemsEditados,
        cant_envio: nuevaCantEnvio,
        cant_llevado: nuevaCantLlevado,
        direccion_entrega: dirFinal || '',
        referencia_entrega: refFinal || '',
      }));

      if (Array.isArray(pedidoActualizado.items)) {
        setItemsEditados(
          pedidoActualizado.items.map((it) => ({
            productoId: it.productoId || it.id,
            nombre: it.nombre || it.product_name,
            sku: it.sku || '',
            cantidad: Number(it.cantidad || 1),
            precioUnitario: Number(it.precioUnitario || 0),
            subtotal: Number(it.subtotal || 0),
            tipo_entrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
            tipoEntrega: it.tipo_entrega || it.tipoEntrega || 'store_pickup',
          }))
        );
      }

      setPedidos((lista) =>
        lista.map((p) =>
          p.id === seleccion.id
            ? {
                ...p,
                total: nuevoTotal,
                items: itemsCadena,
                cant_envio: nuevaCantEnvio,
                cant_llevado: nuevaCantLlevado,
                direccion_entrega: dirFinal || '',
                referencia_entrega: refFinal || '',
              }
            : p
        )
      );

      setModoEdicion(false);
      setMensajeEdicion('¡Productos y modalidad de entrega actualizados con éxito!');
      setTimeout(() => setMensajeEdicion(''), 4000);
    } catch (err) {
      setError(err.message || 'Error al actualizar los productos del pedido.');
    } finally {
      setGuardandoItems(false);
    }
  };

  const actualizar = () => { setActualizando(true); cargarPedidos({ silencioso: true }); };

  // Mezcla el pedido que devuelve el ERP (ítems y total ajustados) en el modal y en la lista.
  const fusionarPedidoErp = (pedidoErp) => {
    if (!pedidoErp?.id) return;
    const items = Array.isArray(pedidoErp.items) ? pedidoErp.items : null;
    const datos = {
      estado: pedidoErp.estado,
      total: Number(pedidoErp.total ?? 0),
      erp_estado: pedidoErp.erp_estado ?? null,
      erp_cotizacion_numero: pedidoErp.erp_cotizacion_numero ?? null,
      ...(items ? {
        items: items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', '),
        items_detalle: items,
        cant_envio: items.filter((it) => (it.tipo_entrega || it.tipoEntrega) === 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
        cant_llevado: items.filter((it) => (it.tipo_entrega || it.tipoEntrega) !== 'home_delivery').reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
      } : {}),
    };
    setSeleccion((prev) => (prev && prev.id === pedidoErp.id ? { ...prev, ...datos } : prev));
    setPedidos((lista) => lista.map((p) => (p.id === pedidoErp.id ? { ...p, ...datos } : p)));
  };

  const verificarConErp = async (pedidoId) => {
    setVerificandoErp(true);
    setAvisoErp('');
    setCambiosErp([]);
    setErpListo(false);
    setBloqueadoErp(false);
    try {
      const resultado = await verificarPedidoErp(pedidoId);
      fusionarPedidoErp(resultado?.pedido);
      setCambiosErp(Array.isArray(resultado?.cambios) ? resultado.cambios : []);
      setBloqueadoErp(Boolean(resultado?.bloqueado));
      if (resultado?.erpDeshabilitado) setAvisoErp('Integración con el ERP desactivada: el cobro no se registrará en TERRA.');
      else if (!resultado?.yaCobrado && !resultado?.pedido?.items?.length) setAvisoErp('Ningún producto del pedido tiene stock en TERRA. Anulá el pedido o agregá otros productos.');
      setErpListo(true);
    } catch (err) {
      if (err.codigo === 'pedido_en_proceso') fusionarPedidoErp(err.datos?.pedido);
      setAvisoErp(err.message || 'No se pudo verificar con TERRA.');
    } finally {
      setVerificandoErp(false);
    }
  };

  // Estado `verificar`: la cotización pudo quedar registrada en TERRA. Solo el administrador concilia.
  const registrarCotizacionManual = async (pedido) => {
    const valor = window.prompt('Número de cotización registrado en TERRA para este pedido:', '');
    if (valor === null) return;
    const numero = Number(String(valor).trim());
    if (!Number.isSafeInteger(numero) || numero < 1) { setError('Ingresá un número de cotización válido.'); return; }
    setProcesandoErp(true);
    setError('');
    try {
      const actualizado = await confirmarErpManual(pedido.id, { numero, metodoPago: metodo === 'qr' ? 'efectivo' : metodo });
      fusionarPedidoErp(actualizado);
      setSeleccion(null);
    } catch (err) {
      setError(err.message || 'No se pudo registrar la cotización.');
    } finally {
      setProcesandoErp(false);
    }
  };

  const habilitarRecobro = async (pedido) => {
    if (!window.confirm('¿Confirmás que la cotización NO existe en el ERP de TERRA? El pedido quedará habilitado para cobrarse de nuevo.')) return;
    setProcesandoErp(true);
    setError('');
    try {
      const actualizado = await reintentarErp(pedido.id);
      fusionarPedidoErp(actualizado);
      await verificarConErp(pedido.id);
    } catch (err) {
      setError(err.message || 'No se pudo habilitar el cobro.');
    } finally {
      setProcesandoErp(false);
    }
  };

  const registrarPago = async () => {
    if (!seleccion) return;
    if (esAnulado(seleccion.estado)) { setError('Este pedido fue anulado. No se puede cobrar ni guardar un comprobante.'); return; }
    if (verificandoErp) return;
    if (!erpListo) { setError('Primero hay que verificar el pedido con TERRA.'); return; }
    if (bloqueadoErp) { setError('Hay productos sin código TERRA. Completá el código en Productos antes de cobrar.'); return; }
    let costoEnvio = null;
    if (seleccion.tarifa_envio_pendiente) {
      const valor = window.prompt('Ingresá el costo de envío en bolivianos antes de cobrar:', '');
      if (valor === null) return;
      costoEnvio = Number(String(valor).replace(',', '.'));
      if (!Number.isFinite(costoEnvio) || costoEnvio < 0) {
        setError('Ingresá un costo de envío válido.');
        return;
      }
    }
    setSubiendoPago(true); setError('');
    try {
      const comprobanteUrl = archivoComprobante ? await subirComprobantePago(archivoComprobante) : seleccion.comprobante_url || null;
      const actualizado = await registrarPagoPedido(seleccion.id, { metodoPago: metodo, comprobanteUrl, costoEnvio });
      const cambios = {
        estado: actualizado?.estado ?? 'completed',
        comprobante_url: actualizado?.comprobante_url ?? comprobanteUrl,
        metodo_pago: actualizado?.metodo_pago ?? metodo,
        erp_estado: actualizado?.erp_estado ?? null,
        erp_cotizacion_numero: actualizado?.erp_cotizacion_numero ?? null,
        total: Number(actualizado?.total ?? seleccion.total),
      };
      setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, ...cambios } : pedido));
      setSeleccion(null); setArchivoComprobante(null);
    } catch (err) {
      // El ERP ajustó stock o precio entre la verificación y el cobro: se muestra el nuevo
      // total y el cajero vuelve a confirmar (la segunda vez no habrá cambios).
      if (err.codigo === 'pedido_ajustado' || err.codigo === 'pedido_bloqueado') {
        fusionarPedidoErp(err.datos?.pedido);
        setCambiosErp(Array.isArray(err.datos?.cambios) ? err.datos.cambios : []);
        setBloqueadoErp(err.codigo === 'pedido_bloqueado');
        setErpListo(true);
        setError(err.message);
        return;
      }
      if (['cotizacion_rechazada', 'erp_resultado_desconocido', 'pedido_en_proceso', 'cierre_local_fallido'].includes(err.codigo)) {
        if (err.datos?.pedido) fusionarPedidoErp(err.datos.pedido);
        else cargarPedidos({ silencioso: true });
        setErpListo(false);
      }
      setError(err.message || 'No se pudo registrar el pago.');
      // El backend rechaza cobrar un pedido anulado: si esta lista estaba desactualizada
      // (lo anularon desde otra pantalla o dispositivo), traer el estado real.
      try {
        const real = await obtenerPedido(seleccion.id);
        if (real?.estado && real.estado !== seleccion.estado) {
          setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, estado: real.estado } : pedido));
          setSeleccion((actual) => actual && actual.id === seleccion.id ? { ...actual, estado: real.estado } : actual);
        }
      } catch { /* se mantiene el error original */ }
    }
    finally { setSubiendoPago(false); }
  };

  const anularPedido = async (pedido) => {
    if (!pedido || !POR_COBRAR.includes(pedido.estado)) return;
    const referencia = pedido.numero ? `el pedido #${pedido.numero}` : 'este pedido';
    if (!window.confirm(`¿Anular ${referencia}? La venta quedará registrada como anulada y no se podrá cobrar.`)) return;

    setAnulandoId(pedido.id);
    setError('');
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, 'cancelled');
      const cambios = { estado: actualizado?.estado || 'cancelled' };
      setPedidos((lista) => lista.map((actual) => actual.id === pedido.id ? { ...actual, ...cambios } : actual));
      setSeleccion(null);
      setModoEdicion(false);
      setArchivoComprobante(null);
    } catch (err) {
      setError(err.message || 'No se pudo anular el pedido.');
    } finally {
      setAnulandoId(null);
    }
  };

  const prepararPedidoParaTicket = async (pedido) => {
    const pedidoCompleto = await obtenerPedido(pedido.id);
    return {
      ...pedido,
      ...pedidoCompleto,
      cliente: pedidoCompleto?.cliente || {
        nombre: pedido.cliente || pedido.cliente_nombre || 'Compra como invitado',
        telefono: pedido.cliente_telefono || '',
        nit: pedido.cliente_nit || '',
        direccion: pedido.direccion_entrega || '',
        referencia: pedido.referencia_entrega || '',
      },
      items: pedidoCompleto?.items?.length ? pedidoCompleto.items : pedido.items,
    };
  };

  const imprimirTicket = async (pedido) => {
    const ventana = window.open('', '_blank', 'width=430,height=760');
    if (!ventana) { setError('Permite las ventanas emergentes para imprimir el ticket.'); return; }
    ventana.document.write('<title>Generando ticket…</title><p style="font-family:Arial;padding:24px">Generando ticket…</p>');
    ventana.document.close();
    setImprimiendoId(pedido.id);
    try {
      const pedidoParaTicket = await prepararPedidoParaTicket(pedido);
      imprimirTicketPedido(pedidoParaTicket, ventana);
    } catch (err) {
      ventana.close();
      setError(err.message || 'No se pudo generar el ticket del pedido.');
    } finally {
      setImprimiendoId(null);
    }
  };

  const descargarTicketJpg = async (pedido) => {
    setImprimiendoId(pedido.id);
    try {
      const pedidoParaTicket = await prepararPedidoParaTicket(pedido);
      await descargarTicket(pedidoParaTicket, pedidoParaTicket.cliente, pedidoParaTicket.items);
    } catch (err) {
      setError(err.message || 'No se pudo descargar el ticket del pedido.');
    } finally {
      setImprimiendoId(null);
    }
  };

  const contarUnidades = (items) => {
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
  };

  const productosVendidos = useMemo(() => {
    return pedidos
      .filter((pedido) => !['cancelado', 'cancelled'].includes(String(pedido.estado || '').toLowerCase()))
      .reduce((total, pedido) => total + contarUnidades(pedido.items), 0);
  }, [pedidos]);
  const pedidosAnulados = pedidos.filter((pedido) => ['cancelado', 'cancelled'].includes(String(pedido.estado || '').toLowerCase())).length;

  const comprobanteActual = archivoComprobante ? URL.createObjectURL(archivoComprobante) : seleccion?.comprobante_url;
  const pendiente = seleccion && POR_COBRAR.includes(seleccion.estado);
  const anulado = seleccion ? esAnulado(seleccion.estado) : false;

  return <main className="orders">
    <header className="orders-hero"><div><h1>{esVendedor ? 'Pedidos' : 'Recepción y despacho de pedidos'}</h1></div><form onSubmit={(event) => event.preventDefault()}><Barcode size={25} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} aria-label={`Buscar pedido: ${TEXTO_BUSQUEDA}`} /><button>Buscar</button></form></header>
    <section className="orders-metrics">
      <article><b>{pendientes} pedidos</b><span>Por cobrar en caja</span></article>
      <article><b>{productosVendidos} unidades</b><span>Productos vendidos</span></article>
      <article><b>{pedidos.length} pedidos</b><span>Registrados en el sistema</span></article>
      <article><b>{pedidosAnulados} pedidos</b><span>Ventas anuladas por clientes</span></article>
      {!esVendedor && <article><b>{pedidos.filter((pedido) => EN_DESPACHO.includes(pedido.estado)).length} pedidos</b><span>En despacho</span></article>}
    </section>
    <nav className="orders-tabs">{tabs.map(([id, etiqueta]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>{etiqueta}</button>)}</nav>
    <section className="orders-list">
      <header><div><span>Órdenes de autoservicio</span><h2>Pedidos en operación</h2></div><div className="orders-list-tools"><label><Search size={18} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} aria-label={`Filtrar pedidos: ${TEXTO_BUSQUEDA}`} /></label><ReportePedidosVendedor pedidos={pedidos} /><button type="button" className="orders-refresh" onClick={actualizar} disabled={actualizando}><RefreshCw size={16} className={actualizando ? 'is-spinning' : ''} /> Actualizar</button></div></header>
      {cargando && pedidos.length === 0 && <p>Cargando pedidos reales...</p>}{error && <p className="error-box">{error}</p>}
      {!cargando && !error && vista.length === 0 && <p>{buscar.trim() ? `No hay pedidos que coincidan con «${buscar.trim()}».` : 'No hay pedidos registrados todavía.'}</p>}
      {vista.map((pedido) => {
        const tieneDireccion = Boolean(pedido.direccion_entrega && pedido.direccion_entrega.trim());
        const cantEnvio = Number(pedido.cant_envio || 0);
        const cantLlevado = Number(pedido.cant_llevado || 0);
        const esMixto = tieneDireccion && cantEnvio > 0 && cantLlevado > 0;
        const esEnvioPuro = tieneDireccion && cantEnvio > 0 && cantLlevado === 0;

        return (
          <article key={pedido.id}>
            <div>
              <b>{pedido.numero ? `Pedido #${pedido.numero}` : ''} {pedido.codigo ? `· #${pedido.codigo}` : ''}</b>
              <small>{formatoFechaHora(pedido.fecha)}</small>
              {esMixto ? (
                <span className="order-delivery-badge is-mixed" title={`Mixto: ${cantEnvio} para envío y ${cantLlevado} llevado por cliente`}>
                  <Package size={12} /> Mixto: Envío + Retiro
                </span>
              ) : esEnvioPuro ? (
                <span className="order-delivery-badge is-delivery" title={`Envío a domicilio: ${pedido.direccion_entrega}`}>
                  <Truck size={12} /> Envío a domicilio
                </span>
              ) : (
                <span className="order-delivery-badge is-pickup" title="El cliente lleva sus productos en tienda">
                  <Store size={12} /> Retiro en tienda (Llevado)
                </span>
              )}
            </div>
            <div>
              <b>{pedido.cliente}</b>
              <small>
                {pedido.cliente_telefono ? `Tel. ${pedido.cliente_telefono}` : pedido.comprobante_url ? 'Comprobante adjunto' : 'Sin teléfono registrado'}
                {pedido.cliente_nit ? ` · NIT ${pedido.cliente_nit}` : ''}
                {pedido.repartidor_nombre ? ` · Conductor: ${pedido.repartidor_nombre}` : ''}
              </small>
              {tieneDireccion && cantEnvio > 0 ? (
                <span className="order-address-text" title={pedido.direccion_entrega}>
                  <MapPin size={11} /> {pedido.direccion_entrega}
                </span>
              ) : (
                <span className="order-pickup-text">
                  <Store size={11} /> Retiro en mostrador
                </span>
              )}
            </div>
            <div className="order-items-col">
              <p className="order-items-text">{pedido.items || 'Sin artículos'}</p>
              <div className="order-item-tags">
                {cantEnvio > 0 && <span className="tag-envio">🚚 {cantEnvio} para envío</span>}
                {cantLlevado > 0 && (
                  <span className="tag-llevado">
                    🛍️ {cantLlevado} {tieneDireccion && cantEnvio > 0 ? 'llevado' : 'llevado en tienda'}
                  </span>
                )}
                {cantEnvio === 0 && cantLlevado === 0 && (
                  <span className="tag-llevado">🛍️ {contarUnidades(pedido.items)} llevado en tienda</span>
                )}
              </div>
            </div>
            <strong>{formatoMoneda(pedido.total)}</strong>
            <i className={pedido.estado}>{etiquetas[pedido.estado] || pedido.estado}{etiquetaEstadoErp(pedido) && <span className={`badge-erp badge-erp--${pedido.erp_estado}`}>{etiquetaEstadoErp(pedido)}</span>}</i>
        <div className="order-actions">
          <button type="button" className="order-icon-btn" onClick={() => imprimirTicket(pedido)} disabled={imprimiendoId === pedido.id} title="Imprimir ticket térmico" aria-label={`Imprimir ticket del pedido ${pedido.numero || pedido.codigo || ''}`}>
            {imprimiendoId === pedido.id ? <RefreshCw size={15} className="is-spinning" /> : <Printer size={15} />}
          </button>
          {POR_COBRAR.includes(pedido.estado) && (
            <button type="button" className="order-icon-btn" onClick={() => abrirPedidoParaEdicion(pedido)} title="Editar o agregar productos" aria-label="Editar o agregar productos al pedido">
              <Edit3 size={15} />
            </button>
          )}
          {POR_COBRAR.includes(pedido.estado) && (
            <button type="button" className="order-edit-action" onClick={() => anularPedido(pedido)} disabled={anulandoId === pedido.id} title="Anular venta por cancelación del cliente">
              {anulandoId === pedido.id ? <RefreshCw size={15} className="is-spinning" /> : <><X size={15} /> Anular</>}
            </button>
          )}
          <button type="button" className="order-primary-action" onClick={() => abrirPedido(pedido)} disabled={pedido.erp_estado === 'enviando'} title={pedido.erp_estado === 'enviando' ? 'Cobro en curso con el ERP' : POR_COBRAR.includes(pedido.estado) ? 'Registrar el pago del pedido' : 'Consultar el detalle del pedido'}>{POR_COBRAR.includes(pedido.estado) ? <><CreditCard size={18} /> {pedido.erp_estado === 'verificar' ? 'Conciliar' : 'Cobrar'}</> : 'Ver detalle'}</button>
        </div>
      </article>
    );})}
    </section>
    {seleccion && (() => {
      const tieneDireccionModal = Boolean(seleccion.direccion_entrega && seleccion.direccion_entrega.trim());
      const cantEnvioModal = Number(seleccion.cant_envio || 0);
      const cantLlevadoModal = Number(seleccion.cant_llevado || 0);
      const esMixtoModal = tieneDireccionModal && cantEnvioModal > 0 && cantLlevadoModal > 0;
      const esEnvioPuroModal = tieneDireccionModal && cantEnvioModal > 0 && cantLlevadoModal === 0;

      return (
        <div className="orders-modal"><section role="dialog" aria-modal="true" aria-labelledby="pedido-modal-titulo"><header><div><span>Caja Equipetrol</span><h2 id="pedido-modal-titulo">{seleccion.numero ? `Pedido #${seleccion.numero} · ` : ''}#{seleccion.codigo}</h2><p>Cliente: {typeof seleccion.cliente === 'object' && seleccion.cliente !== null ? (seleccion.cliente.nombre || seleccion.cliente_nombre || 'Compra como invitado') : (seleccion.cliente || 'Compra como invitado')}</p>{(seleccion.cliente_telefono || seleccion.cliente_nit) && <p className="orders-client-data">{seleccion.cliente_telefono ? `Tel. ${seleccion.cliente_telefono}` : ''}{seleccion.cliente_telefono && seleccion.cliente_nit ? ' · ' : ''}{seleccion.cliente_nit ? `NIT ${seleccion.cliente_nit}` : ''}</p>}</div><button onClick={() => setSeleccion(null)} aria-label="Cerrar">×</button></header>
        {esMixtoModal ? (
          <div className="orders-modal-delivery-card is-mixed">
            <div className="delivery-card-header">
              <Package size={17} />
              <span>Modalidad Mixta: Envío a Domicilio + Retiro en Tienda</span>
            </div>
            <p>
              El cliente se lleva <b>{cantLlevadoModal} producto(s) en mano</b> y se despacha(n) <b>{cantEnvioModal} a domicilio</b>.
            </p>
            <div className="delivery-card-address">
              <MapPin size={13} />
              <span>Dirección de envío: <b>{seleccion.direccion_entrega}</b>{seleccion.referencia_entrega ? ` · Ref: ${seleccion.referencia_entrega}` : ''}</span>
            </div>
          </div>
        ) : esEnvioPuroModal ? (
          <div className="orders-modal-delivery-card is-delivery">
            <div className="delivery-card-header">
              <Truck size={17} />
              <span>Modalidad 100% Envío a Domicilio</span>
            </div>
            <div className="delivery-card-address">
              <MapPin size={13} />
              <span>Dirección: <b>{seleccion.direccion_entrega}</b>{seleccion.referencia_entrega ? ` · Ref: ${seleccion.referencia_entrega}` : ''}</span>
            </div>
          </div>
        ) : (
          <div className="orders-modal-delivery-card is-pickup">
            <div className="delivery-card-header">
              <Store size={17} />
              <span>Modalidad: Retiro en Tienda (Llevado en mano)</span>
            </div>
            <p>El cliente paga en caja y retira todos los productos directamente en el mostrador.</p>
          </div>
        )}
        <div className="orders-total"><span>{anulado ? 'Pedido anulado' : 'Monto a liquidar'}</span><b>{formatoMoneda(seleccion.total)}</b></div>{anulado && <p className="orders-alert is-error" role="status"><X size={15} /> Esta venta fue anulada. No se puede cobrar ni guardar un comprobante.</p>}
        {seleccion.erp_estado === 'ok' && seleccion.erp_cotizacion_numero && (
          <p className="badge-erp badge-erp--ok">Cotización TERRA Nº {seleccion.erp_cotizacion_numero}</p>
        )}
        {pendiente && seleccion.erp_estado === 'verificar' && (
          <section className="aviso-erp">
            <p className="aviso-erp__estado aviso-erp__estado--error">
              <X size={15} aria-hidden="true" />
              <span>Falta confirmar en TERRA si la cotización quedó registrada. Revisalo en el ERP antes de reintentar.</span>
            </p>
            {usuario?.rol === 'admin' && (
              <div className="aviso-erp__acciones">
                <button type="button" onClick={() => registrarCotizacionManual(seleccion)} disabled={procesandoErp}>Sí existe: registrar Nº de cotización</button>
                <button type="button" onClick={() => habilitarRecobro(seleccion)} disabled={procesandoErp}>No existe: habilitar cobro de nuevo</button>
              </div>
            )}
          </section>
        )}
        {pendiente && !modoEdicion && seleccion.erp_estado !== 'verificar' && (
          <AvisoErp
            verificando={verificandoErp}
            aviso={avisoErp}
            listo={erpListo}
            cambios={cambiosErp}
            total={cambiosErp.length ? seleccion.total : undefined}
            onReintentar={() => verificarConErp(seleccion.id)}
          />
        )}
      <div className="orders-items-section">
        <div className="orders-items-head">
          <h3>Artículos del pedido</h3>
          {pendiente && !modoEdicion && (
            <button type="button" className="orders-edit-toggle-btn" onClick={iniciarEdicion}>
              <Edit3 size={15} /> Editar / Agregar productos
            </button>
          )}
        </div>
        {mensajeEdicion && <p className="orders-edit-success">{mensajeEdicion}</p>}
        {!modoEdicion ? (
          <div className="orders-modal-items-list">
            {(Array.isArray(seleccion.items_detalle) && seleccion.items_detalle.length > 0) ? (
              seleccion.items_detalle.map((item, idx) => {
                const esEnvio = item.tipo_entrega === 'home_delivery';
                return (
                  <div key={item.id || idx} className="orders-modal-item-row">
                    <div>
                      <b>{item.nombre}</b>
                      <small>{item.cantidad} × {formatoMoneda(item.precioUnitario)}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {seleccion.direccion_entrega ? (
                        <span className={`orders-item-delivery-badge ${esEnvio ? 'is-delivery' : 'is-pickup'}`}>
                          {esEnvio ? '🚚 Para envío' : '🛍️ Llevado'}
                        </span>
                      ) : (
                        <span className="orders-item-delivery-badge is-pickup">
                          🛍️ Llevado en tienda
                        </span>
                      )}
                      <strong>{formatoMoneda(item.subtotal)}</strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="orders-items-summary">{seleccion.items || 'Sin artículos registrados'}</p>
            )}
          </div>
        ) : (
          <div className="orders-items-editor">
            {cargandoItems ? (
              <p className="orders-items-loading">Cargando productos del pedido...</p>
            ) : (
              <>
                <div className="orders-edit-delivery-box">
                  <div className="orders-edit-delivery-head">
                    <div className="orders-edit-delivery-title">
                      <Truck size={17} />
                      <span>Modalidad de entrega del cliente</span>
                    </div>
                    <div className="orders-edit-delivery-quick-btns">
                      <button
                        type="button"
                        className={`orders-quick-mode-btn ${cantEnvioEditados === 0 && cantLlevadoEditados > 0 ? 'is-active-pickup' : ''}`}
                        onClick={marcarTodosComoLlevado}
                        title="Marcar todos los productos como retiro en tienda"
                      >
                        <Store size={14} /> Llevárselo a mano (Todo)
                      </button>
                      <button
                        type="button"
                        className={`orders-quick-mode-btn ${cantEnvioEditados > 0 && cantLlevadoEditados === 0 ? 'is-active-delivery' : ''}`}
                        onClick={marcarTodosComoEnvio}
                        title="Marcar todos los productos para envío a domicilio"
                      >
                        <Truck size={14} /> Envío a domicilio (Todo)
                      </button>
                    </div>
                  </div>
                  <p className="orders-edit-delivery-desc">
                    {cantEnvioEditados > 0 && cantLlevadoEditados > 0 ? (
                      <><b>Modalidad Mixta:</b> {cantLlevadoEditados} producto(s) para llevar en mano y {cantEnvioEditados} para despacho a domicilio. Puedes cambiar cada producto con su botón a la derecha.</>
                    ) : cantEnvioEditados > 0 ? (
                      <><b>100% Envío a domicilio:</b> Todos los productos se enviarán a la dirección del cliente.</>
                    ) : (
                      <><b>100% Retiro en tienda:</b> El cliente se lleva todos los productos en mano en el mostrador.</>
                    )}
                  </p>
                  {cantEnvioEditados > 0 && (
                    <div className="orders-edit-address-fields">
                      <label>
                        <span><MapPin size={13} /> Dirección de entrega *</span>
                        <input
                          type="text"
                          placeholder="Ej: Calle Los Claveles #123, Equipetrol"
                          value={direccionEdicion}
                          onChange={(e) => setDireccionEdicion(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        <span>Referencia (opcional)</span>
                        <input
                          type="text"
                          placeholder="Ej: Portón blanco, frente al parque"
                          value={referenciaEdicion}
                          onChange={(e) => setReferenciaEdicion(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="orders-items-list">
                  {itemsEditados.map((item, idx) => (
                    <div key={item.productoId || idx} className="orders-item-row">
                      <div className="orders-item-info">
                        <b>{item.nombre}</b>
                        <small>{item.sku ? `SKU: ${item.sku} · ` : ''}{formatoMoneda(item.precioUnitario)} c/u</small>
                      </div>
                      <div className="orders-item-qty">
                        <button type="button" onClick={() => cambiarCantidadItem(idx, -1)} disabled={item.cantidad <= 1} aria-label="Quitar una unidad">
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.cantidad}
                          onChange={(e) => fijarCantidadItem(idx, e.target.value)}
                          aria-label={`Cantidad de ${item.nombre}`}
                        />
                        <button type="button" onClick={() => cambiarCantidadItem(idx, 1)} disabled={item.cantidad >= 100} aria-label="Agregar una unidad">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="orders-item-subtotal">
                        {formatoMoneda(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}
                      </div>
                      <button
                        type="button"
                        className={`orders-item-delivery-toggle ${(item.tipo_entrega || item.tipoEntrega) === 'home_delivery' ? 'is-delivery' : 'is-pickup'}`}
                        onClick={() => alternarTipoEntregaEditado(idx)}
                        title="Alternar entre Llevado en mano y Envío a domicilio"
                      >
                        {(item.tipo_entrega || item.tipoEntrega) === 'home_delivery' ? (
                          <><Truck size={13} /> Envío</>
                        ) : (
                          <><Store size={13} /> Llevado</>
                        )}
                      </button>
                      <button
                        type="button"
                        className="orders-item-remove"
                        onClick={() => eliminarItem(idx)}
                        title="Eliminar este producto"
                        aria-label="Eliminar este producto"
                        disabled={itemsEditados.length <= 1}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="orders-add-product-box">
                  <label htmlFor="pedido-buscar-producto">Agregar más productos al pedido:</label>
                  <div className="orders-search-input-wrap">
                    <Search size={16} />
                    <input
                      id="pedido-buscar-producto"
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={busquedaCatalogo}
                      onFocus={() => { cargarCatalogo(); setMostrarCatalogo(true); }}
                      onChange={(e) => { setBusquedaCatalogo(e.target.value); setMostrarCatalogo(true); }}
                    />
                    {busquedaCatalogo && (
                      <button type="button" className="orders-clear-search" onClick={() => setBusquedaCatalogo('')} aria-label="Limpiar búsqueda">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {mostrarCatalogo && (
                    <div className="orders-catalog-dropdown">
                      {productosFiltrados.length === 0 ? (
                        <div className="orders-catalog-empty">No se encontraron productos coincidentes</div>
                      ) : (
                        productosFiltrados.map((prod) => (
                          <div
                            key={prod.id}
                            className="orders-catalog-item"
                            role="button"
                            tabIndex={0}
                            onClick={() => agregarProductoAlPedido(prod)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); agregarProductoAlPedido(prod); } }}
                          >
                            <div className="orders-catalog-item-info">
                              <b>{prod.nombre}</b>
                              <small>{prod.categoria} · SKU: {prod.sku}</small>
                            </div>
                            <div className="orders-catalog-item-price">
                              <b>{formatoMoneda(prod.precio)}</b>
                              <span className="orders-add-badge"><Plus size={12} /> Agregar</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="orders-editor-summary">
                  <div>
                    <span>Nuevo total calculado:</span>
                    <b>{formatoMoneda(totalItemsEditados)}</b>
                  </div>
                  <div className="orders-editor-actions">
                    <button
                      type="button"
                      className="orders-cancel-edit-btn"
                      onClick={() => setModoEdicion(false)}
                      disabled={guardandoItems}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="orders-save-items-btn"
                      onClick={guardarCambiosItems}
                      disabled={guardandoItems || !itemsEditados.length}
                    >
                      <Check size={16} /> {guardandoItems ? 'Guardando cambios…' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {pendiente && <>
        <div className="orders-methods">
          <button
            className={metodo === 'efectivo' ? 'active' : ''}
            type="button"
            onClick={() => setMetodo('efectivo')}
          >
            <Package />Efectivo
          </button>
          <button
            className={metodo === 'tarjeta' ? 'active' : ''}
            type="button"
            onClick={() => setMetodo('tarjeta')}
          >
            <CreditCard />Tarjeta
          </button>
          <button type="button" disabled title="La confirmación QR llegará desde la entidad de pago">
            <QrCode />QR automático
          </button>
        </div>
        {(metodo === 'qr' || seleccion.metodo_pago_solicitado === 'qr') && (
          <div className="orders-hint" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
            <p>Cobro por QR Bancario: muestra el QR oficial al cliente y verifica el abono en la banca móvil.</p>
            <button
              type="button"
              className="orders-modal-ticket-btn"
              onClick={() => setMostrarQrModal(true)}
              style={{ background: 'var(--vino, #a6192e)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <QrCode size={16} /> Mostrar QR Oficial al Cliente
            </button>
          </div>
        )}
        {metodo === 'efectivo' && <p className="orders-hint">Recibí el monto en efectivo y registrá el cobro.</p>}
        {metodo === 'tarjeta' && <p className="orders-hint">Procesá la tarjeta en el POS y registrá el cobro.</p>}
      </>}
      <section className="orders-receipt"><div className="orders-receipt-head"><div><b><ImagePlus size={17} /> Comprobante de pago</b><span>Opcional · JPG, PNG o WEBP · máximo 8 MB</span></div>{comprobanteActual && <a href={comprobanteActual} target="_blank" rel="noreferrer" aria-label="Ver comprobante en una pestaña nueva"><ExternalLink size={17} /></a>}</div><label className="orders-receipt-btn"><ImagePlus size={17} /> {archivoComprobante ? 'Cambiar imagen' : comprobanteActual ? 'Reemplazar imagen' : 'Cargar comprobante'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setArchivoComprobante(event.target.files?.[0] || null)} /></label>{comprobanteActual ? <div className="orders-receipt-preview"><img src={comprobanteActual} alt="Comprobante de pago" /><div><p>{archivoComprobante ? archivoComprobante.name : 'Comprobante guardado en Supabase'}</p>{archivoComprobante && <button type="button" className="orders-receipt-remove" onClick={() => setArchivoComprobante(null)}><Trash2 size={14} /> Quitar cambio</button>}</div></div> : <span className="orders-receipt-empty">Aún no se adjuntó una imagen.</span>}</section>
      {error && <p className="orders-alert is-error">{error}</p>}<footer><button onClick={() => setSeleccion(null)}>Cerrar</button><button type="button" className="orders-modal-ticket-btn" onClick={() => imprimirTicket(seleccion)} disabled={imprimiendoId === seleccion.id} title="Imprimir ticket para impresora térmica POS">{imprimiendoId === seleccion.id ? 'Generando…' : <><Printer size={16} /> Imprimir ticket</>}</button><button type="button" className="orders-modal-ticket-btn" onClick={() => descargarTicketJpg(seleccion)} disabled={imprimiendoId === seleccion.id} title="Descargar ticket en formato imagen JPG" style={{ background: '#fff', border: '1px solid #dcdcdc', color: '#202020' }}>{imprimiendoId === seleccion.id ? 'Generando…' : <><Download size={16} /> Descargar JPG</>}</button>{pendiente && !modoEdicion && (<button type="button" className="orders-modal-edit-btn" onClick={iniciarEdicion}><Edit3 size={15} /> Editar / Agregar</button>)}{pendiente && !modoEdicion && (<button type="button" className="orders-modal-edit-btn" onClick={() => anularPedido(seleccion)} disabled={anulandoId === seleccion.id}>{anulandoId === seleccion.id ? 'Anulando…' : <><X size={15} /> Anular venta</>}</button>)}{pendiente && !modoEdicion && <button onClick={registrarPago} disabled={subiendoPago || verificandoErp || !erpListo || bloqueadoErp || ['enviando', 'verificar'].includes(seleccion.erp_estado)} title={!erpListo ? 'Primero hay que verificar el pedido con TERRA' : bloqueadoErp ? 'Hay productos sin código TERRA' : undefined}>{subiendoPago ? 'Cobrando en TERRA…' : verificandoErp ? 'Verificando…' : <><CheckCircle2 /> Confirmar cobro manual</>}</button>}</footer></section></div>);})()}
    <ModalQrPago
      abierto={mostrarQrModal}
      onCerrar={() => setMostrarQrModal(false)}
      monto={seleccion?.total}
      codigoPedido={seleccion?.codigo || seleccion?.ticket_number}
    />
  </main>;
}
