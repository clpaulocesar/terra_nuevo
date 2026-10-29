import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import {
  BOTON_FLOTANTE, OCULTO_CON_ASISTENTE, OCULTO_EN_CARRITO, POSICION_CARRITO,
} from '../flotantes/estilosFlotantes.js';
import './CarritoFlotante.css';

export default function CarritoFlotante() {
  const [abierto, setAbierto] = useState(false);
  const { items, cantidadTotal, subtotal, actualizarCantidad, quitarProducto, vaciarCarrito } = useCarrito();

  // Escape cierra el panel del carrito (accesibilidad de teclado).
  useEffect(() => {
    if (!abierto) return undefined;
    const alEscape = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [abierto]);

  return (
    <div
      className={`cart-widget z-75 font-terra ${abierto ? 'abierto' : ''} ${POSICION_CARRITO} ${OCULTO_EN_CARRITO}
        ${OCULTO_CON_ASISTENTE}`}
    >
      {abierto && <button type="button" className="cart-overlay" onClick={() => setAbierto(false)} aria-label="Cerrar carrito" />}

      <aside className="cart-drawer" aria-hidden={!abierto} aria-label="Carrito de compra" role="dialog" aria-modal="true">
        <header className="cart-drawer-header">
          <div>
            <strong>Tu carrito</strong>
            <small>{cantidadTotal === 0 ? 'Sin productos' : `${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`}</small>
          </div>
          <button type="button" className="cart-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar carrito">
            <X size={18} />
          </button>
        </header>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <p className="cart-vacio">Tu carrito esta vacio. Agrega productos desde el catalogo.</p>
          ) : (
            items.map((item) => (
              <article className="cart-drawer-item" key={item.lineaId || item.id}>
                <div className="cart-drawer-thumb">
                  {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} /> : <ShoppingCart size={20} />}
                </div>
                <div className="cart-drawer-info">
                  <b>{item.nombre}</b>
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
            ))
          )}
        </div>

        <footer className="cart-drawer-footer">
          <div className="cart-drawer-total">
            <span>Total</span>
            <strong>{formatoMoneda(subtotal)}</strong>
          </div>
          <Link to="/carrito" className="cart-drawer-ver" onClick={() => setAbierto(false)}>
            Ver Carrito
          </Link>
          {items.length > 0 && (
            <button type="button" className="cart-drawer-vaciar" onClick={vaciarCarrito}>
              Vaciar carrito
            </button>
          )}
        </footer>
      </aside>

      <button
        type="button"
        data-tour="carrito-flotante"
        className={`relative ${BOTON_FLOTANTE} ${abierto ? 'hidden' : 'inline-flex'}`}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar carrito' : 'Abrir carrito'}
      >
        {abierto ? <X size={24} /> : <ShoppingCart size={24} />}
        {!abierto && cantidadTotal > 0 && <b
            className="absolute -top-1.5 -right-1.5 inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full
              bg-terra-texto px-1.25 text-xs font-extrabold text-terra-superficie"
          >
            {cantidadTotal}
          </b>}
      </button>
    </div>
  );
}
