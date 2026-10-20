import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCarrito } from "../hooks/useCarrito.js";
import { formatoMoneda } from "../utils/formatoMoneda.js";
import { emojiCategoria } from "../data/categorias.js";
import "./CarritoPage.css";

export default function CarritoPage() {
  const {
    items,
    subtotal,
    cantidadTotal,
    actualizarCantidad,
    quitarProducto,
    vaciarCarrito,
  } = useCarrito();
  if (!items.length) {
    return (
      <section className="cart-page cart-empty">
        <div className="cart-empty__wrap">
          <div className="cart-empty__icon">
            <PackageOpen size={64} />
          </div>
          <h1 className="cart-empty__title">Tu carrito está vacío</h1>
          <p className="cart-empty__subtitle">
            Explorá el catálogo y elegí los productos que más te gusten.
          </p>
          <Link to="/catalogo" className="cart-empty__cta">
            Explorar productos <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className="cart-page">
      <header className="cart-heading">
        <Link to="/catalogo" className="cart-back-link">
          <ArrowLeft size={18} /> Volver al catálogo
        </Link>
        <div>
          <h1>Revisá tu pedido</h1>
          <p>
            Verificá tus artículos antes de generar el ticket para pagar en
            caja.
          </p>
        </div>
      </header>
      <div className="cart-notice">
        <ShoppingBag size={24} />
        <div>
          <b>Pago en mostrador presencial</b>
          <p>Tu pedido se generará para pagar en caja. No se realizará ningún
            cobro en este kiosco.</p>
        </div>
      </div>
      <div className="cart-layout">
        <div className="cart-list-card">
          <div className="cart-list-title">
            <h2>Detalle de artículos ({cantidadTotal})</h2>
            <button onClick={vaciarCarrito} type="button">
              Vaciar carrito
            </button>
          </div>
          {items.map((item) => (
            <article className="cart-drawer-item" key={item.lineaId || item.id}>
                <div className="cart-drawer-thumb">
                  {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} /> : <ShoppingCart size={20} />}
                </div>
                <div className="cart-drawer-info">
                  <b>{String(item.nombre || '').replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim()}</b>
                  {item.color && (
                    <small className="cart-drawer-color">
                      <i style={{ backgroundColor: item.color.valor }} />
                      {item.color.nombre}
                    </small>
                  )}
                  <span>{formatoMoneda(item.precio)} c/u</span>
                  <div className="cart-drawer-qty">
                    <button type="button" onClick={() => actualizarCantidad(item.lineaId || item.id, item.cantidad - 1)} aria-label="Quitar uno">
                      <Minus size={14} />
                    </button>
                    <b>{item.cantidad}</b>
                    <button type="button" onClick={() => actualizarCantidad(item.lineaId || item.id, item.cantidad + 1)} disabled={item.cantidad >= item.stock} aria-label="Agregar uno">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-drawer-side">
                  <strong>{formatoMoneda(item.precio * item.cantidad)}</strong>
                  <button type="button" className="cart-drawer-del" onClick={() => quitarProducto(item.lineaId || item.id)} aria-label={`Quitar ${item.nombre}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
          ))}
        </div>
        <aside className="cart-summary">
          <h2>Liquidación final</h2>
          <div className="cart-summary-box">
            <p>
              <span>Subtotal de artículos</span>
              <b>{formatoMoneda(subtotal)}</b>
            </p>
            <hr />
            <p className="cart-total">
              <span>Total a pagar en caja</span>
              <b>{formatoMoneda(subtotal)}</b>
            </p>
          </div>
          <div className="cart-payments">
            <span>Efectivo (Bs)</span>
            <span>QR Simple</span>
            <span>Tarjetas</span>
          </div>
          <Link className="cart-confirm" to="/identificacion">
            <PackageOpen size={23} /> Continuar y generar pedido
          </Link>
          <Link className="cart-back" to="/catalogo">
            Seguir comprando
          </Link>
          <small>Terminal seguro · Ticket inmediato en caja</small>
        </aside>
      </div>
    </section>
  );
}
