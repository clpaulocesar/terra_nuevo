import { useContext, useEffect, useRef, useState } from 'react';
import { ClienteContext } from '../../../context/ClienteContext.jsx';
import { SesionClienteContext } from '../../../context/SesionClienteContext.jsx';
import { useCarrito } from '../../../hooks/useCarrito.js';
import { crearCliente } from '../../../services/clienteService.js';
import { crearPedido } from '../../../services/pedidoService.js';
import { listarTarifasEnvio } from '../../../services/envioService.js';
import { descargarTicket } from '../../../utils/descargarTicket.js';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import { tipoEntregaItem } from '../utils/tipoEntrega.js';

// Estado y acciones de Confirmación: datos del pedido (mayorista con sesión o cliente de
// Identificación), tarifas de envío del mayorista, medio de pago y creación del pedido.
export function useConfirmacionPedido() {
  const { items, subtotal, vaciarCarrito, entregaDomicilio } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const [tarifasEnvio, setTarifasEnvio] = useState([]);
  const [zonaEnvioId, setZonaEnvioId] = useState(() => cliente?.zonaEnvioId || '');
  const [cargandoTarifas, setCargandoTarifas] = useState(false);
  const enviando = useRef(false);
  const clienteId = useRef(null);
  // Un mayorista que compra con datos de un cliente minorista sigue el flujo minorista.
  const esCompraMinorista = Boolean(cliente?.nombre || cliente?.telefono || cliente?.direccion || !esMayorista);
  const esFlujoMayorista = esMayorista && !esCompraMinorista;
  const quiereEnvio = esFlujoMayorista ? Boolean(entregaDomicilio) : Boolean(cliente.entregaDomicilio);

  useEffect(() => {
    if (!esFlujoMayorista || !quiereEnvio) return undefined;
    let vigente = true;
    setCargandoTarifas(true);
    listarTarifasEnvio()
      .then((tarifas) => {
        if (vigente) setTarifasEnvio(Array.isArray(tarifas) ? tarifas : []);
      })
      .catch(() => {
        if (vigente) setError('No se pudieron cargar las tarifas de envío. Vuelve a intentarlo.');
      })
      .finally(() => {
        if (vigente) setCargandoTarifas(false);
      });
    return () => {
      vigente = false;
    };
  }, [esFlujoMayorista, quiereEnvio]);

  const tarifaSeleccionada = tarifasEnvio.find((tarifa) => tarifa.id === zonaEnvioId);
  const costoEnvio = Number(tarifaSeleccionada?.costo || 0);
  const valorEnvio = esFlujoMayorista
    ? (tarifaSeleccionada ? formatoMoneda(costoEnvio) : 'Selecciona una zona')
    : 'Por definir en caja';
  const filaEnvio = {
    etiqueta: `Envío${tarifaSeleccionada ? ` · ${tarifaSeleccionada.nombre}` : ''}`,
    valor: valorEnvio,
  };
  const tipoEntrega = (item) => tipoEntregaItem(item, {
    quiereEnvio,
    esFlujoMayorista,
    itemsEnvio: cliente?.itemsEnvio,
  });

  const elegirMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    setError('');
  };

  const elegirZona = (id) => {
    setZonaEnvioId(id);
    setError('');
  };

  const confirmar = async () => {
    if (enviando.current) return;
    if (!metodoPago) {
      setError('Selecciona un medio de pago para continuar.');
      return;
    }
    if (esFlujoMayorista && quiereEnvio && !zonaEnvioId) {
      setError('Selecciona la zona de entrega para calcular el envío.');
      return;
    }

    enviando.current = true;
    setProcesando(true);
    setError('');

    try {
      const direccionEntrega = esFlujoMayorista
        ? (sesion?.direccion || null)
        : (quiereEnvio ? (cliente.direccion || null) : null);
      const referenciaEntrega = esFlujoMayorista
        ? (sesion?.referencia || null)
        : (quiereEnvio ? (cliente.referencia || null) : null);

      // Conserva los datos de facturación antes de limpiar el terminal compartido.
      const datosClienteTicket = esFlujoMayorista
        ? {
          nombre: sesion?.nombre || 'Cliente mayorista',
          telefono: sesion?.telefono || '',
          nit: sesion?.nit || '',
          direccion: sesion?.direccion || '',
          referencia: sesion?.referencia || '',
        }
        : { ...cliente, direccion: direccionEntrega || '', referencia: referenciaEntrega || '' };

      let id = null;
      if (cliente.nombre && !esFlujoMayorista) {
        clienteId.current ??= await crearCliente(cliente);
        id = clienteId.current?.id ?? null;
      }

      const detalleItemsTicket = items.map((item) => ({ ...item, tipoEntrega: tipoEntrega(item) }));
      const pedido = await crearPedido({
        clienteId: id,
        token: esFlujoMayorista ? sesion?.token : null,
        entregaDomicilio: quiereEnvio,
        zonaEnvioId: esFlujoMayorista && quiereEnvio ? zonaEnvioId : null,
        direccion: direccionEntrega,
        referencia: referenciaEntrega,
        metodoPago,
        items: detalleItemsTicket.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          color: item.color?.nombre || null,
          tipoEntrega: item.tipoEntrega,
        })),
      });

      // Descarga automática directa del ticket sin abrir otra ventana
      descargarTicket(pedido, datosClienteTicket, detalleItemsTicket);

      setPedidoGenerado({ pedido, cliente: datosClienteTicket, items: detalleItemsTicket });
      vaciarCarrito();
      limpiarCliente();
    } catch (e) {
      setError(e.message || 'No se pudo generar el pedido.');
    } finally {
      enviando.current = false;
      setProcesando(false);
    }
  };

  return {
    items,
    subtotal,
    cliente,
    sesion,
    esFlujoMayorista,
    quiereEnvio,
    procesando,
    error,
    metodoPago,
    pedidoGenerado,
    tarifasEnvio,
    tarifaSeleccionada,
    zonaEnvioId,
    cargandoTarifas,
    filaEnvio,
    totalConEnvio: subtotal + costoEnvio,
    tipoEntrega,
    elegirMetodoPago,
    elegirZona,
    confirmar,
  };
}
