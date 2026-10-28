import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Home,
  MessageCircle,
  QrCode,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { obtenerPedido } from "../services/pedidoService.js";
import { WHATSAPP_COMPROBANTES } from "../services/api.js";
import { formatoMoneda } from "../utils/formatoMoneda.js";
import "./PedidoGenerado.css";

function formatoFechaPedido(fecha) {
  const valor = new Date(fecha || Date.now());
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(Number.isNaN(valor.getTime()) ? new Date() : valor);
}

function crearMensajeComprobante({ pedido, cliente, items }) {
  const tieneEnvio = Boolean(pedido.direccion_entrega);
  const lineas = (items || []).map((item) => {
    const nombre = item.nombre || item.product_name || "Producto";
    const cantidad = item.cantidad || item.quantity || 1;
    const color = item.color?.nombre || item.color;
    const tipo = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
    const modalidad = tieneEnvio
      ? (tipo === 'home_delivery' ? ' [Envío a domicilio]' : ' [Retiro en tienda]')
      : '';
    return `• ${cantidad} × ${nombre}${color ? ` (${color})` : ""}${modalidad}`;
  });

  return [
    "SOLICITUD DE COMPROBANTE — TERRA",
    `Pedido: ${pedido.codigo || pedido.id}`,
    `Cliente: ${cliente?.nombre || "No registrado"}`,
    `WhatsApp del cliente: +591 ${cliente?.telefono || "No registrado"}`,
    ...(pedido.direccion_entrega ? [`Envío: ${pedido.direccion_entrega}`, ...(pedido.referencia_entrega ? [`Referencia: ${pedido.referencia_entrega}`] : [])] : []),
    "",
    "Productos:",
    ...(lineas.length ? lineas : ["• Consulta el detalle del pedido"]),
    "",
    `Total: ${formatoMoneda(pedido.total)}`,
    "Por favor, envíen el comprobante a este cliente.",
  ].join("\n");
}

export default function PedidoGenerado() {
  const { state, search } = useLocation();
  const { id } = useParams();
  const [pedido, setPedido] = useState(state?.pedido || null);
  const [cargando, setCargando] = useState(Boolean(id && !state?.pedido));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || pedido) return;
    obtenerPedido(id)
      .then(setPedido)
      .catch((err) => setError(err.message || "No se pudo cargar el ticket."))
      .finally(() => setCargando(false));
  }, [id, pedido]);

  useEffect(() => {
    if (!pedido || !new URLSearchParams(search).has("imprimir")) return;
    const temporizador = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(temporizador);
  }, [pedido, search]);

  if (cargando)
    return (
      <section className="pedido-page">
        <p>Cargando ticket...</p>
      </section>
    );
  if (error)
    return (
      <section className="pedido-page">
        <h1>No se pudo abrir el ticket</h1>
        <p>{error}</p>
      </section>
    );
  if (!pedido) return <Navigate to="/" replace />;

  const fechaGeneracion = formatoFechaPedido(
    pedido.fecha || pedido.fecha_creacion || pedido.created_at,
  );
  const clienteTicket =
    state?.cliente?.nombre || state?.cliente?.nit
      ? state.cliente
      : pedido.cliente;
  const itemsTicket = state?.items?.length ? state.items : (pedido.items || []);
  const pagoQrPendiente = pedido.metodo_pago_solicitado === 'qr' && !pedido.metodo_pago;
  const solicitarComprobante = Boolean(clienteTicket?.whatsapp && WHATSAPP_COMPROBANTES);
  const mensajeWhatsApp = encodeURIComponent(crearMensajeComprobante({
    pedido,
    cliente: clienteTicket,
    items: itemsTicket,
  }));

  return (
    <section className="pedido-page">
      <div className="pedido-success">
        <CheckCircle2 />
        <span>Pedido generado correctamente</span>
      </div>
      <h1>¡Tu ticket está listo!</h1>
      <p className="pedido-lead">
        Presentá este código en caja para realizar el pago y coordinar la
        entrega o retiro.
      </p>
      <div className="pedido-layout">
        <article className="pedido-ticket">
          <header>
            <ShoppingBag size={25} />
            <div>
              <b>TERRA AUTOSERVICIO</b>
              <span>Ticket de pago en caja</span>
            </div>
          </header>
          <div className="pedido-code">
            <span>Código de pedido</span>
            <strong>{pedido.codigo}</strong>
            {pedido.erp_cotizacion_numero && (
              <small>Cotización TERRA Nº {pedido.erp_cotizacion_numero}</small>
            )}
            <QrCode size={100} />
          </div>
          <div className="pedido-row">
            <span>Fecha y hora de emisión</span>
            <b>{fechaGeneracion}</b>
          </div>
          {clienteTicket?.nit && (
            <div className="pedido-row">
              <span>NIT</span>
              <b>{clienteTicket.nit}</b>
            </div>
          )}
          {pedido.direccion_entrega && (
            <div className="pedido-row">
              <span>Envío</span>
              <b>{pedido.direccion_entrega}</b>
            </div>
          )}
          {pedido.direccion_entrega && pedido.referencia_entrega && (
            <div className="pedido-row">
              <span>Referencia</span>
              <b>{pedido.referencia_entrega}</b>
            </div>
          )}
          {pedido.zona_envio && (
            <div className="pedido-row">
              <span>Tarifa de envío</span>
              <b>{pedido.tarifa_envio_pendiente ? 'Por definir en caja' : `${pedido.zona_envio} · ${formatoMoneda(pedido.costo_envio)}`}</b>
            </div>
          )}
          <div className="pedido-row">
            <span>Estado</span>
            <b>{pagoQrPendiente ? 'Pendiente de confirmación QR' : 'Pendiente de pago'}</b>
          </div>
          {itemsTicket.length > 0 && (
            <div className="pedido-ticket-items">
              <span className="pedido-ticket-items-title">Detalle de productos ({itemsTicket.length})</span>
              {itemsTicket.map((it, idx) => {
                const tipo = it.tipoEntrega || it.tipo_entrega || it.delivery_type;
                const tieneEnvio = Boolean(pedido.direccion_entrega);
                return (
                  <div key={it.id || idx} className="pedido-ticket-item-row">
                    <div className="pedido-ticket-item-main">
                      <span className="pedido-ticket-item-name">{it.nombre || it.product_name || 'Producto'}</span>
                      <small className="pedido-ticket-item-sub">
                        {it.cantidad} × {formatoMoneda(it.precio || it.precioUnitario || 0)}
                        {it.color?.nombre || it.color ? ` · ${it.color?.nombre || it.color}` : ''}
                      </small>
                    </div>
                    {tieneEnvio && (
                      <span className={`pedido-ticket-badge ${tipo === 'home_delivery' ? 'is-delivery' : 'is-pickup'}`}>
                        {tipo === 'home_delivery' ? '🚚 Envío' : '🛍️ Retiro'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="pedido-row">
            <span>Total a pagar</span>
            <b>{formatoMoneda(pedido.total)}</b>
          </div>
          <footer>
            <ReceiptText size={18} /> Conservá este código hasta finalizar tu
            compra.
          </footer>
        </article>
        <aside className="pedido-steps">
          <h2>¿Qué sigue?</h2>
          <div>
            <i>1</i>
            <p>
              <b>Acercate a caja</b>
              <span>Mostrá el código de tu pedido al personal en mostrador.</span>
            </p>
          </div>
          <div>
            <i>2</i>
            <p>
              <b>{pagoQrPendiente ? 'Pago con QR Simple' : 'Realizá el pago'}</b>
              <span>
                {pagoQrPendiente
                  ? `Mostrá tu comprobante de transferencia por ${formatoMoneda(pedido.total)} en caja.`
                  : 'Podés pagar con efectivo, QR Simple o tarjeta en caja.'}
              </span>
            </p>
          </div>
          <div>
            <i>3</i>
            <p>
              <b>Coordiná tu entrega</b>
              <span>Retirá en tienda o consultá opciones de despacho.</span>
            </p>
          </div>
          <div className="pedido-time">
            <Clock3 size={19} /> Tu ticket tiene validez limitada. Consultá en
            caja.
          </div>
        </aside>
      </div>
      <div className="pedido-actions">
        {solicitarComprobante && (
          <a
            className="pedido-whatsapp"
            href={`https://wa.me/${WHATSAPP_COMPROBANTES}?text=${mensajeWhatsApp}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={20} /> Enviar ticket a WhatsApp TERRA
          </a>
        )}
        <Link to="/" className="pedido-home">
          <Home size={20} /> Nueva compra
        </Link>
        <Link to="/catalogo" className="pedido-catalog">
          Seguir explorando
        </Link>
      </div>
    </section>
  );
}
