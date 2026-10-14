import { useContext, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, ReceiptText, ShieldCheck } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './Confirmacion.css';

export default function Confirmacion() {
  const { items, subtotal, vaciarCarrito } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const enviando = useRef(false);
  const clienteId = useRef(null);

  // Tiene prioridad sobre el carrito vacío luego de completar la compra.
  if (pedidoGenerado) return <Navigate to="/pedido" replace state={{ pedido: pedidoGenerado }} />;
  if (!items.length) return <Navigate to="/carrito" replace />;

  const confirmar = async () => {
    if (enviando.current) return;

    // La ventana se abre durante el clic para evitar que el navegador bloquee el popup.
    const ventanaTicket = window.open('', '_blank');
    enviando.current = true;
    setProcesando(true);
    setError('');

    try {
      let id = null;
      if (cliente.nombre) {
        clienteId.current ??= await crearCliente(cliente);
        id = clienteId.current?.id ?? null;
      }

      const pedido = await crearPedido({
        clienteId: id,
        items: items.map((item) => ({ productoId: item.id, cantidad: item.cantidad })),
      });

      if (ventanaTicket && pedido.id) {
        ventanaTicket.location.href = `/pedido/${pedido.id}?imprimir=1`;
      } else if (ventanaTicket) {
        ventanaTicket.close();
      }
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
      <Link className="confirm-back" to="/identificacion"><ArrowLeft size={19} /> Volver a identificación</Link>
      <header><span>Paso 3 de 3 · Confirmación</span><h1>Revisá y confirmá tu pedido</h1><p>Generaremos un ticket para pagar en caja. No se cobra nada desde este kiosco.</p></header>
      <div className="confirm-notice"><ReceiptText size={30} /><div><b>Pago en mostrador presencial</b><p>Presentá el código del pedido al cajero para efectuar el pago y coordinar la entrega.</p></div></div>
      <div className="confirm-layout">
        <div className="confirm-card">
          <h2>Datos del pedido</h2>
          <div className="confirm-client"><ShieldCheck size={23} /><div><b>{cliente.nombre || 'Compra como invitado'}</b><span>{cliente.telefono || 'Sin teléfono registrado'} {cliente.email && `· ${cliente.email}`}</span></div></div>
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
