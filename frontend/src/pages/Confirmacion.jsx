import { useContext, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, ReceiptText, ShieldCheck, Truck } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';
import './Confirmacion.css';

export default function Confirmacion() {
  const { items, subtotal, vaciarCarrito, entregaDomicilio } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const [clienteTicket, setClienteTicket] = useState(null);
  const [itemsTicket, setItemsTicket] = useState([]);
  const enviando = useRef(false);
  const clienteId = useRef(null);

  // Tiene prioridad sobre el carrito vacío luego de completar la compra.
  if (pedidoGenerado) return <Navigate to="/pedido" replace state={{ pedido: pedidoGenerado, cliente: clienteTicket, items: itemsTicket }} />;
  if (!items.length) return <Navigate to="/carrito" replace />;

  const confirmar = async () => {
    if (enviando.current) return;

    enviando.current = true;
    setProcesando(true);
    setError('');

    try {
      // Conserva los datos de facturación antes de limpiar el kiosco compartido.
      const datosClienteTicket = esMayorista
        ? { nombre: sesion?.nombre || 'Cliente mayorista', telefono: sesion?.telefono || '', nit: sesion?.nit || '' }
        : { ...cliente };
      // El carrito se limpia al final; el ticket y WhatsApp necesitan conservar
      // todos los datos visuales de sus líneas (nombre, cantidad y color).
      const detalleItemsTicket = items.map((item) => ({ ...item }));
      let id = null;
      if (cliente.nombre && !esMayorista) {
        clienteId.current ??= await crearCliente(cliente);
        id = clienteId.current?.id ?? null;
      }

      const pedido = await crearPedido({
        clienteId: id,
        token: esMayorista ? sesion?.token : null,
        entregaDomicilio: esMayorista && entregaDomicilio,
        items: items.map((item) => ({ productoId: item.id, cantidad: item.cantidad, color: item.color?.nombre || null })),
      });

      // Descarga automática directa del ticket sin abrir otra ventana
      descargarTicket(pedido, datosClienteTicket, items);

      setClienteTicket(datosClienteTicket);
      setItemsTicket(detalleItemsTicket);
      setPedidoGenerado(pedido);
      vaciarCarrito();
      limpiarCliente();
    } catch (e) {
      setError(e.message || 'No se pudo generar el pedido.');
    } finally {
      enviando.current = false;
      setProcesando(false);
    }
  };

  return (
    <section className="confirm-page">
      <Link className="confirm-back" to={esMayorista ? '/mi-cuenta' : '/identificacion'}><ArrowLeft size={19} /> {esMayorista ? 'Volver a mi perfil' : 'Volver a identificación'}</Link>
      <header>
        <span>Paso 3 de 3 · Confirmación</span>
        <h1>Revisá y confirmá tu pedido</h1>
        <p>{esMayorista && entregaDomicilio ? 'Generamos el pedido para pagar en caja y coordinamos el envío a tu dirección.' : 'Generaremos un ticket para pagar en caja. No se cobra nada desde este kiosco.'}</p>
      </header>
      <div className="confirm-notice"><ReceiptText size={30} /><div><b>Pago en mostrador presencial</b><p>{esMayorista && entregaDomicilio ? 'Presentá el código del pedido al cajero para efectuar el pago y coordinar el envío a domicilio.' : 'Presentá el código del pedido al cajero para efectuar el pago y coordinar la entrega.'}</p></div></div>
      <div className="confirm-layout">
        <div className="confirm-card">
          <h2>Datos del pedido</h2>
          <div className="confirm-client"><ShieldCheck size={23} /><div><b>{esMayorista ? (sesion?.nombre || 'Cliente mayorista') : (cliente.nombre || 'Compra como invitado')}</b><span>{esMayorista ? (sesion?.telefono || 'Sin teléfono registrado') : (cliente.telefono || 'Sin teléfono registrado')} {(esMayorista ? sesion?.nit : cliente.nit) && `· NIT ${esMayorista ? sesion.nit : cliente.nit}`}</span></div></div>
          {esMayorista && (
            <div className={`confirm-delivery${entregaDomicilio ? '' : ' is-pickup'}`}>
              <Truck size={21} />
              <div>
                <b>{entregaDomicilio ? 'Envío a domicilio' : 'Retiro en tienda'}</b>
                {entregaDomicilio ? (
                  <>
                    <span>{sesion?.direccion || 'Sin dirección registrada'}</span>
                    {sesion?.referencia && <small>Referencia: {sesion.referencia}</small>}
                  </>
                ) : (
                  <span>Pagás y retirás tu pedido en el mostrador de la tienda.</span>
                )}
                <Link to="/carrito">{entregaDomicilio ? 'Cambiar dirección o modalidad' : 'Cambiar a envío a domicilio'}</Link>
              </div>
            </div>
          )}
          <h2>Artículos seleccionados ({items.length})</h2>
          {items.map((item) => <div className="confirm-item" key={item.id}><span>{item.cantidad} ×</span><div><b>{item.nombre}</b><small>{item.categoria}</small></div><strong>{formatoMoneda(item.precio * item.cantidad)}</strong></div>)}
        </div>
        <aside className="confirm-summary">
          <h2>Liquidación final</h2>
          <div><p><span>Subtotal</span><b>{formatoMoneda(subtotal)}</b></p><p><span>IVA</span><b>Incluido</b></p><hr /><p className="confirm-total"><span>Total a pagar en caja</span><b>{formatoMoneda(subtotal)}</b></p></div>
          <p className="confirm-payment"><span>Medios de pago</span><i>Bs</i><i><QrCode size={18} /> QR</i><i><CreditCard size={18} /> Tarjeta</i></p>
          {error && <p className="confirm-error">{error}</p>}
          <button disabled={procesando} onClick={confirmar} type="button"><CheckCircle2 size={23} />{procesando ? 'Generando ticket…' : 'Confirmar y generar pedido'}</button>
          <Link to="/carrito">Modificar carrito</Link><small>Terminal seguro · Ticket inmediato en caja</small>
        </aside>
      </div>
    </section>
  );
}
