import { useContext, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  PackageOpen,
  Plus,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Trash2,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { ClienteContext } from "../context/ClienteContext.jsx";
import { useCarrito } from "../hooks/useCarrito.js";
import { crearCliente } from "../services/clienteService.js";
import { crearPedido } from "../services/pedidoService.js";
import { formatoMoneda } from "../utils/formatoMoneda.js";
import { emojiCategoria } from "../data/categorias.js";
import { descargarTicket } from "../utils/descargarTicket.js";
import "./Confirmacion.css";

export default function Confirmacion() {
  const { items, subtotal, vaciarCarrito } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [pedidoGenerado, setPedidoGenerado] = useState(null);
  const [clienteTicket, setClienteTicket] = useState(null);
  const enviando = useRef(false);
  const clienteId = useRef(null);

  // Tiene prioridad sobre el carrito vacío luego de completar la compra.
  if (pedidoGenerado)
    return (
      <Navigate
        to="/pedido"
        replace
        state={{ pedido: pedidoGenerado, cliente: clienteTicket, items }}
      />
    );
  if (!items.length) return <Navigate to="/carrito" replace />;

  const confirmar = async () => {
    if (enviando.current) return;

    enviando.current = true;
    setProcesando(true);
    setError("");

    try {
      // Conserva los datos de facturación antes de limpiar el kiosco compartido.
      const datosClienteTicket = { ...cliente };
      let id = null;
      if (cliente.nombre) {
        clienteId.current ??= await crearCliente(cliente);
        id = clienteId.current?.id ?? null;
      }

      const pedido = await crearPedido({
        clienteId: id,
        items: items.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          color: item.color?.nombre || null,
        })),
      });

      // Descarga automática directa del ticket sin abrir otra ventana
      descargarTicket(pedido, datosClienteTicket, items);

      setClienteTicket(datosClienteTicket);
      setPedidoGenerado(pedido);
      vaciarCarrito();
      limpiarCliente();
    } catch (e) {
      setError(e.message || "No se pudo generar el pedido.");
    } finally {
      enviando.current = false;
      setProcesando(false);
    }
  };

  return (
    <section className="confirm-page">
      <Link className="confirm-back" to="/identificacion">
        <ArrowLeft size={19} /> Volver a identificación
      </Link>
      <header className="cart-heading">
        <div>
          <h1>Revisá y confirmá tu pedido</h1>
          <p>
            Generaremos un ticket para pagar en caja. No se cobra nada desde este
            kiosco.
          </p>
        </div>
      </header>
      <div className="confirm-notice">
        <ReceiptText size={24} />
        <div>
          <b>Pago en mostrador presencial, Presentá el código del pedido al cajero para efectuar el pago y
            coordinar la entrega.</b>
        </div>
      </div>
      <div className="confirm-layout">
        <div className="confirm-card">
          <h2>Datos del pedido</h2>
          <div className="confirm-client">
            <ShieldCheck size={23} />
            <div>
              <b>{cliente.nombre || "Compra como invitado"}</b>
              <span>
                {cliente.telefono || "Sin teléfono registrado"}{" "}
                {cliente.nit && `· NIT ${cliente.nit}`}
              </span>
            </div>
          </div>
          <h2>Artículos seleccionados ({items.length})</h2>
          {items.map((item) => (
            <article className="confirm-item" key={item.lineaId || item.id}>
              <div className="confirm-item-thumb">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} />
                ) : (
                  <ShoppingCart size={20} />
                )}
              </div>
              <div className="confirm-item-info">
                <b>
                  {String(item.nombre || '')
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, ' ')
                    .replace(/\t/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                </b>
                {item.color && (
                  <small className="confirm-item-color">
                    <i style={{ backgroundColor: item.color.valor }} />
                    {item.color.nombre}
                  </small>
                )}
                <div className="confirm-item-precio-qty">
                  <span>{formatoMoneda(item.precio)} c/u</span>
                  <div className="confirm-item-qty">
                    <button
                      type="button"
                      onClick={() =>
                        actualizarCantidad(item.lineaId || item.id, item.cantidad - 1)
                      }
                      aria-label="Quitar uno"
                    >
                      <Minus size={14} />
                    </button>
                    <b>{item.cantidad}</b>
                    <button
                      type="button"
                      onClick={() =>
                        actualizarCantidad(item.lineaId || item.id, item.cantidad + 1)
                      }
                      disabled={item.cantidad >= item.stock}
                      aria-label="Agregar uno"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="confirm-item-side">
                <strong>{formatoMoneda(item.precio * item.cantidad)}</strong>
                <button
                  className="confirm-delete"
                  onClick={() => quitarProducto(item.lineaId)}
                  type="button"
                  aria-label={`Quitar ${item.nombre}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <aside className="confirm-summary">
          <h2>Liquidación final</h2>
          <div>
            <p>
              <span>Subtotal</span>
              <b>{formatoMoneda(subtotal)}</b>
            </p>
            <hr />
            <p className="confirm-total">
              <span>Total a pagar en caja</span>
              <b>{formatoMoneda(subtotal)}</b>
            </p>
          </div>
          <p className="confirm-payment">
            <span>Medios de pago</span>
            <i>Bs</i>
            <i>
              <QrCode size={18} /> QR
            </i>
            <i>
              <CreditCard size={18} /> Tarjeta
            </i>
          </p>
          {error && <p className="confirm-error">{error}</p>}
          <button disabled={procesando} onClick={confirmar} type="button">
            <CheckCircle2 size={23} />
            {procesando ? "Generando ticket…" : "Confirmar y generar pedido"}
          </button>
          <Link to="/carrito">Modificar carrito</Link>
          <small>Terminal seguro · Ticket inmediato en caja</small>
        </aside>
      </div>
    </section>
  );
}
