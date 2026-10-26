import { useContext, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, Maximize2, QrCode, ReceiptText, ShieldCheck, Truck, ZoomIn } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { listarTarifasEnvio } from '../services/envioService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { descargarTicket } from '../utils/descargarTicket.js';
import ModalQrPago from '../components/ui/ModalQrPago.jsx';
import './Confirmacion.css';

export default function Confirmacion() {
  const { items, subtotal, vaciarCarrito, entregaDomicilio } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const [clienteTicket, setClienteTicket] = useState(null);
  const [itemsTicket, setItemsTicket] = useState([]);
  const [mostrarModalQr, setMostrarModalQr] = useState(false);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [tarifasEnvio, setTarifasEnvio] = useState([]);
  const [zonaEnvioId, setZonaEnvioId] = useState(() => cliente?.zonaEnvioId || '');
  const [cargandoTarifas, setCargandoTarifas] = useState(false);
  const enviando = useRef(false);
  const clienteId = useRef(null);
  const inicioArrastreResumen = useRef(null);
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
        if (vigente) setError('No se pudieron cargar las tarifas de envío. Volvé a intentarlo.');
      })
      .finally(() => {
        if (vigente) setCargandoTarifas(false);
      });
    return () => {
      vigente = false;
    };
  }, [esFlujoMayorista, quiereEnvio]);

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
    if (esFlujoMayorista && quiereEnvio && !zonaEnvioId) {
      setError('Seleccioná la zona de entrega para calcular el envío.');
      return;
    }

    enviando.current = true;
    setProcesando(true);
    setError('');

    try {
      const esCompraMinorista = Boolean(cliente?.nombre || cliente?.telefono || cliente?.direccion || !esMayorista);
      const esFlujoMayorista = esMayorista && !esCompraMinorista;

      const quiereEnvio = esFlujoMayorista ? Boolean(entregaDomicilio) : Boolean(cliente.entregaDomicilio);
      const direccionEntrega = esFlujoMayorista ? (sesion?.direccion || null) : (quiereEnvio ? (cliente.direccion || null) : null);
      const referenciaEntrega = esFlujoMayorista ? (sesion?.referencia || null) : (quiereEnvio ? (cliente.referencia || null) : null);

      // Conserva los datos de facturación antes de limpiar el terminal compartido.
      const datosClienteTicket = esFlujoMayorista
        ? { nombre: sesion?.nombre || 'Cliente mayorista', telefono: sesion?.telefono || '', nit: sesion?.nit || '', direccion: sesion?.direccion || '', referencia: sesion?.referencia || '' }
        : { ...cliente, direccion: direccionEntrega || '', referencia: referenciaEntrega || '' };

      let id = null;
      if (cliente.nombre && !esFlujoMayorista) {
        clienteId.current ??= await crearCliente(cliente);
        id = clienteId.current?.id ?? null;
      }

      const itemsParaPedido = items.map((item) => ({
        productoId: item.id,
        cantidad: item.cantidad,
        color: item.color?.nombre || null,
        tipoEntrega: obtenerTipoEntregaItem(item),
      }));

      const detalleItemsTicket = items.map((item) => ({
        ...item,
        tipoEntrega: obtenerTipoEntregaItem(item),
      }));

      const pedido = await crearPedido({
        clienteId: id,
        token: esFlujoMayorista ? sesion?.token : null,
        entregaDomicilio: quiereEnvio,
        zonaEnvioId: esFlujoMayorista && quiereEnvio ? zonaEnvioId : null,
        direccion: direccionEntrega,
        referencia: referenciaEntrega,
        metodoPago,
        items: itemsParaPedido,
      });

      // Descarga automática directa del ticket sin abrir otra ventana
      descargarTicket(pedido, datosClienteTicket, detalleItemsTicket);

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

  const tarifaSeleccionada = tarifasEnvio.find((tarifa) => tarifa.id === zonaEnvioId);
  const costoEnvio = Number(tarifaSeleccionada?.costo || 0);
  const totalConEnvio = subtotal + costoEnvio;

  const obtenerTipoEntregaItem = (item) => {
    if (!quiereEnvio) return 'store_pickup';
    if (esFlujoMayorista) return 'home_delivery';
    if (!Array.isArray(cliente?.itemsEnvio)) return 'home_delivery';
    const lineaId = String(item.lineaId || '');
    const prodId = String(item.id || item.productoId || '');
    const esEnvio = cliente.itemsEnvio.some((g) => {
      const idGuardado = String(g);
      return idGuardado === lineaId || idGuardado === prodId || (lineaId && lineaId.startsWith(idGuardado + '::'));
    });
    return esEnvio ? 'home_delivery' : 'store_pickup';
  };

  return (
    <section className="confirm-page">
      <Link className="confirm-back" to={esFlujoMayorista ? '/mi-cuenta' : '/identificacion'}><ArrowLeft size={19} /> {esFlujoMayorista ? 'Volver a mi perfil' : 'Volver a identificación'}</Link>
      <header>
        <span>Paso 3 de 3 · Confirmación</span>
        <h1>Revisá y confirmá tu pedido</h1>
        <p>{quiereEnvio ? 'Generamos el pedido para pagar en caja y coordinamos el envío a tu dirección.' : 'Generaremos un ticket para pagar en caja. No se cobra nada desde este terminal de autoservicio.'}</p>
      </header>
      <div className="confirm-notice"><ReceiptText size={30} /><div><b>Pago en mostrador presencial</b><p>{quiereEnvio ? 'Presentá el código del pedido al cajero para efectuar el pago y coordinar el envío a domicilio.' : 'Presentá el código del pedido al cajero para efectuar el pago y coordinar la entrega.'}</p></div></div>
      <div className="confirm-layout">
        <div className="confirm-card">
          <h2>Datos del pedido</h2>
          <div className="confirm-client"><ShieldCheck size={23} /><div><b>{esFlujoMayorista ? (sesion?.nombre || 'Cliente mayorista') : (cliente.nombre || 'Compra como invitado')}</b><span>{esFlujoMayorista ? (sesion?.telefono || 'Sin teléfono registrado') : (cliente.telefono || 'Sin teléfono registrado')} {(esFlujoMayorista ? sesion?.nit : cliente.nit) && `· NIT ${esFlujoMayorista ? sesion.nit : cliente.nit}`}</span></div></div>
          <div className={`confirm-delivery${quiereEnvio ? '' : ' is-pickup'}`}>
            <Truck size={21} />
            <div>
              <b>{quiereEnvio ? 'Envío a domicilio' : 'Retiro en tienda'}</b>
              {quiereEnvio ? (
                <>
                  <span>{esFlujoMayorista ? (sesion?.direccion || 'Sin dirección registrada') : cliente.direccion}</span>
                  {(esFlujoMayorista ? sesion?.referencia : cliente.referencia) && (
                    <small>Referencia: {esFlujoMayorista ? sesion.referencia : cliente.referencia}</small>
                  )}
                </>
              ) : (
                <span>Pagás y retirás tu pedido en el mostrador de la tienda.</span>
              )}
              <Link to={esFlujoMayorista ? '/carrito' : '/identificacion'}>
                {quiereEnvio ? 'Cambiar dirección o modalidad' : 'Cambiar a envío a domicilio'}
              </Link>
            </div>
          </div>
          {esFlujoMayorista && quiereEnvio && (
            <label className="confirm-delivery-rate">
              <span>Zona de entrega y tarifa</span>
              <select
                value={zonaEnvioId}
                onChange={(event) => {
                  setZonaEnvioId(event.target.value);
                  setError('');
                }}
                disabled={cargandoTarifas}
              >
                <option value="">
                  {cargandoTarifas ? 'Cargando tarifas…' : 'Seleccioná tu zona'}
                </option>
                {tarifasEnvio.map((tarifa) => (
                  <option key={tarifa.id} value={tarifa.id}>
                    {tarifa.nombre} — {formatoMoneda(tarifa.costo)}
                  </option>
                ))}
              </select>
              <small>Bs. 50 aplica para sucursal central y Radial 10: 3 Pasos al Frente, Radial 10 y Av. Sudamericana.</small>
            </label>
          )}
          <h2>Artículos seleccionados ({items.length})</h2>
          {items.map((item) => {
            const tipoEntregaItem = obtenerTipoEntregaItem(item);
            return (
              <div className="confirm-item" key={item.lineaId || item.id}>
                <span>{item.cantidad} ×</span>
                <div className="confirm-item-details">
                  <b>{item.nombre}</b>
                  <div className="confirm-item-meta">
                    <small>{item.categoria || 'Producto'}{item.color?.nombre ? ` · ${item.color.nombre}` : ''}</small>
                    {quiereEnvio && (
                      <span className={`confirm-item-badge ${tipoEntregaItem === 'home_delivery' ? 'is-delivery' : 'is-pickup'}`}>
                        {tipoEntregaItem === 'home_delivery' ? '🚚 Envío a domicilio' : '🛍️ Retiro en tienda (Llevado en mano)'}
                      </span>
                    )}
                  </div>
                </div>
                <strong>{formatoMoneda(item.precio * item.cantidad)}</strong>
              </div>
            );
          })}
        </div>
        <aside className={`confirm-summary ${resumenAbierto ? 'is-mobile-open' : ''}`}>
          <button className="confirm-mobile-summary-toggle" type="button" aria-label={resumenAbierto ? 'Contraer resumen del pedido' : 'Expandir resumen del pedido'} aria-expanded={resumenAbierto} onClick={() => setResumenAbierto((abierto) => !abierto)} onTouchStart={iniciarArrastreResumen} onTouchEnd={terminarArrastreResumen}>
            <span aria-hidden="true" />
          </button>
          <h2>Liquidación final</h2>
          <div className="confirm-summary-box">
            <p><span>Subtotal de artículos</span><b>{formatoMoneda(subtotal)}</b></p>
            {quiereEnvio && <p><span>Envío{tarifaSeleccionada ? ` · ${tarifaSeleccionada.nombre}` : ''}</span><b>{esFlujoMayorista ? (tarifaSeleccionada ? formatoMoneda(costoEnvio) : 'Seleccioná una zona') : 'Por definir en caja'}</b></p>}
            <hr />
            <p className="confirm-total"><span>Total a pagar en caja</span><b>{formatoMoneda(totalConEnvio)}</b></p>
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
          {metodoPago === 'qr' && (
            <div className="confirm-qr-box">
              <div className="confirm-qr-header">
                <QrCode size={18} />
                <span>QR Simple Interoperable</span>
              </div>
              <div
                className="confirm-qr-img-wrapper"
                role="button"
                tabIndex={0}
                onClick={() => setMostrarModalQr(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMostrarModalQr(true); } }}
                title="Tocar para ampliar código QR"
                aria-label="Tocar para ampliar código QR en pantalla completa"
              >
                <img
                  src="/images/QRPAGO.jpeg"
                  alt="Código QR Oficial de Pago TERRA - Tocar para ampliar"
                  className="confirm-qr-img"
                />
                <span className="confirm-qr-expand-hint">
                  <ZoomIn size={13} /> Tocar para ampliar
                </span>
              </div>
              <div className="confirm-qr-monto">
                <span>Total a transferir:</span>
                <strong>{formatoMoneda(totalConEnvio)}</strong>
              </div>
              <button
                type="button"
                className="confirm-qr-zoom-action"
                onClick={() => setMostrarModalQr(true)}
              >
                <Maximize2 size={16} /> Ampliar QR para escanear
              </button>
              <p className="confirm-qr-instruction">
                Escaneá desde cualquier banca móvil (BCP, Unión, BNB, Mercantil, Bisa, GanaMóvil, etc.) y confirmá para generar tu ticket de retiro.
              </p>
            </div>
          )}
          {error && <p className="confirm-error">{error}</p>}
          {!metodoPago && <p className="confirm-payment-help">Seleccioná un medio de pago para continuar.</p>}
          <button className="confirm-submit" disabled={procesando || !metodoPago || (esFlujoMayorista && quiereEnvio && (!zonaEnvioId || cargandoTarifas))} onClick={confirmar} type="button"><CheckCircle2 size={23} />{procesando ? 'Generando ticket…' : 'Confirmar y generar pedido'}</button>
          <Link className="confirm-edit" to="/carrito">Modificar carrito</Link>
          <small>Terminal seguro · Ticket inmediato en caja</small>
        </aside>
      </div>
      <ModalQrPago
        abierto={mostrarModalQr}
        onCerrar={() => setMostrarModalQr(false)}
        monto={subtotal}
      />
    </section>
  );
}
