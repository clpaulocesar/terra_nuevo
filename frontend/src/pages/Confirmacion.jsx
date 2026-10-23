import { useContext, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, ReceiptText, ShieldCheck, Truck } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';
import './Confirmacion.css';

export default function Confirmacion() {
  const { items, subtotal, vaciarCarrito } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const [clienteTicket, setClienteTicket] = useState(null);
  const [itemsTicket, setItemsTicket] = useState([]);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const enviando = useRef(false);
  const clienteId = useRef(null);
  const inicioArrastreResumen = useRef(null);

  // Tiene prioridad sobre el carrito vacío luego de completar la compra.
  if (pedidoGenerado) return <Navigate to="/pedido" replace state={{ pedido: pedidoGenerado, cliente: clienteTicket, items: itemsTicket }} />;
  if (!items.length) return <Navigate to="/carrito" replace />;

  const iniciarArrastreResumen = (event) => {
    inicioArrastreResumen.current = event.touches[0]?.clientY ?? null;
  };
  const terminarArrastreResumen = (event) => {
    if (inicioArrastreResumen.current === null) return;
    const desplazamiento = (event.changedTouches[0]?.clientY ?? inicioArrastreResumen.current) - inicioArrastreResumen.current;
    if (desplazamiento < -30) setResumenAbierto(true);
    if (desplazamiento > 30) setResumenAbierto(false);
    inicioArrastreResumen.current = null;
  };

  const confirmar = async () => {
    if (enviando.current) return;
    if (!metodoPago) {
      setError('Seleccioná un medio de pago para continuar.');
      return;
    }

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
      <header><span>Paso 3 de 3 · Confirmación</span><h1>Revisá y confirmá tu pedido</h1><p>Generaremos un ticket para pagar en caja. No se cobra nada desde este kiosco.</p></header>
      <div className="confirm-notice"><ReceiptText size={30} /><div><b>Pago en mostrador presencial</b><p>Presentá el código del pedido al cajero para efectuar el pago y coordinar la entrega.</p></div></div>
      <div className="confirm-layout">
        <div className="confirm-card">
          <h2>Datos del pedido</h2>
          <div className="confirm-client"><ShieldCheck size={23} /><div><b>{esMayorista ? (sesion?.nombre || 'Cliente mayorista') : (cliente.nombre || 'Compra como invitado')}</b><span>{esMayorista ? (sesion?.telefono || 'Sin teléfono registrado') : (cliente.telefono || 'Sin teléfono registrado')} {(esMayorista ? sesion?.nit : cliente.nit) && `· NIT ${esMayorista ? sesion.nit : cliente.nit}`}</span></div></div>
          {esMayorista && (
            <div className="confirm-delivery">
              <Truck size={21} />
              <div>
                <b>{sesion?.direccion ? 'Envío a domicilio' : 'Retiro en tienda'}</b>
                <span>{sesion?.direccion || 'Todavía no registraste una dirección de envío.'}</span>
                {sesion?.referencia && <small>Referencia: {sesion.referencia}</small>}
                <Link to="/mi-cuenta">{sesion?.direccion ? 'Cambiar dirección' : 'Registrar dirección de envío'}</Link>
              </div>
            </div>
          )}
          <h2>Artículos seleccionados ({items.length})</h2>
          {items.map((item) => <div className="confirm-item" key={item.id}><span>{item.cantidad} ×</span><div><b>{item.nombre}</b><small>{item.categoria}</small></div><strong>{formatoMoneda(item.precio * item.cantidad)}</strong></div>)}
        </div>
        <aside className={`confirm-summary ${resumenAbierto ? 'is-mobile-open' : ''}`}>
          <button className="confirm-mobile-summary-toggle" type="button" aria-label={resumenAbierto ? 'Contraer resumen del pedido' : 'Expandir resumen del pedido'} aria-expanded={resumenAbierto} onClick={() => setResumenAbierto((abierto) => !abierto)} onTouchStart={iniciarArrastreResumen} onTouchEnd={terminarArrastreResumen}>
            <span aria-hidden="true" />
          </button>
          <h2>Liquidación final</h2>
          <div className="confirm-summary-box">
            <p><span>Subtotal de artículos</span><b>{formatoMoneda(subtotal)}</b></p>
            <hr />
            <p className="confirm-total"><span>Total a pagar en caja</span><b>{formatoMoneda(subtotal)}</b></p>
          </div>
          <section className="confirm-payment-methods" aria-labelledby="confirm-payment-title">
            <span id="confirm-payment-title">Medios de pago</span>
            <div className="confirm-payments" role="radiogroup" aria-label="Seleccioná un medio de pago">
              <button className={metodoPago === 'efectivo' ? 'is-selected' : ''} type="button" role="radio" aria-checked={metodoPago === 'efectivo'} onClick={() => { setMetodoPago('efectivo'); setError(''); }}>
                <span className="confirm-payment-icon"><Banknote size={15} /></span>
                <b>Efectivo</b>
              </button>
              <button className={metodoPago === 'qr' ? 'is-selected' : ''} type="button" role="radio" aria-checked={metodoPago === 'qr'} onClick={() => { setMetodoPago('qr'); setError(''); }}>
                <span className="confirm-payment-icon"><CreditCard size={15} /></span>
                <b>QR/Transfer.</b>
              </button>
            </div>
          </section>
          {error && <p className="confirm-error">{error}</p>}
          {!metodoPago && <p className="confirm-payment-help">Seleccioná un medio de pago para continuar.</p>}
          <button className="confirm-submit" disabled={procesando || !metodoPago} onClick={confirmar} type="button"><CheckCircle2 size={23} />{procesando ? 'Generando ticket…' : 'Confirmar y generar pedido'}</button>
          <Link className="confirm-edit" to="/carrito">Modificar carrito</Link>
          <small>Terminal seguro · Ticket inmediato en caja</small>
        </aside>
      </div>
    </section>
  );
}
