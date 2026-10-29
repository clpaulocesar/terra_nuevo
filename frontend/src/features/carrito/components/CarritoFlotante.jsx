import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCarrito } from '../../../hooks/useCarrito.js';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import {
  BOTON_FLOTANTE, OCULTO_CON_ASISTENTE, OCULTO_EN_CARRITO, POSICION_CARRITO,
} from '../../../components/flotantes/estilosFlotantes.js';
import { idLinea } from '../utils/nombreLinea.js';
import LineaCarrito from './LineaCarrito.jsx';

// cart-widget y abierto: ganchos de la variante con-carrito-abierto (index.css).
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

  const cerrar = () => setAbierto(false);
  const resumenCantidad = cantidadTotal === 0
    ? 'Sin productos'
    : `${cantidadTotal} ${cantidadTotal === 1 ? 'producto' : 'productos'}`;

  return (
    <div
      className={`cart-widget z-75 font-terra ${abierto ? 'abierto' : ''} ${POSICION_CARRITO} ${OCULTO_EN_CARRITO}
        ${OCULTO_CON_ASISTENTE} en-identificacion:hidden`}
    >
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 border-0 bg-terra-velo p-0"
          onClick={cerrar}
          aria-label="Cerrar carrito"
        />
      )}

      <aside
        className={`fixed top-0 right-0 flex h-screen w-[min(25rem,calc(100vw-1rem))] flex-col bg-terra-superficie
          shadow-terra-cajon transition-transform duration-250 motion-reduce:transition-none
          ${abierto ? 'translate-x-0' : 'pointer-events-none translate-x-[105%]'}`}
        aria-hidden={!abierto}
        aria-label="Carrito de compra"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between bg-terra-primario px-4.5 py-4 text-terra-sobre-primario">
          <div>
            <strong className="block text-terra-lg">Tu carrito</strong>
            <small className="text-terra-xs opacity-85">{resumenCantidad}</small>
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border-0 bg-terra-sobre-primario/15
              text-terra-sobre-primario hover:bg-terra-sobre-primario/30"
            onClick={cerrar}
            aria-label="Cerrar carrito"
          >
            <X size={18} />
          </button>
        </header>

        <div className="@container flex flex-1 flex-col gap-2.75 overflow-y-auto bg-terra-fondo p-3.5">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-terra-texto-suave">
              Tu carrito esta vacio. Agrega productos desde el catalogo.
            </p>
          ) : (
            items.map((item) => (
              <LineaCarrito
                key={idLinea(item)}
                item={item}
                compacta
                onCambiarCantidad={(cantidad) => actualizarCantidad(idLinea(item), cantidad)}
                onQuitar={() => quitarProducto(idLinea(item))}
              />
            ))
          )}
        </div>

        <footer
          className="flex flex-col gap-2.5 border-t border-terra-borde-suave bg-terra-superficie px-4 pt-3.5 pb-4.5"
        >
          <div className="flex items-center justify-between font-extrabold">
            <span>Total</span>
            <strong className="text-terra-xl text-terra-acento">{formatoMoneda(subtotal)}</strong>
          </div>
          <Link
            to="/carrito"
            className="flex min-h-12 items-center justify-center rounded-terra-boton bg-terra-primario font-extrabold
              text-terra-sobre-primario hover:bg-terra-primario-oscuro"
            onClick={cerrar}
          >
            Ver Carrito
          </Link>
          {items.length > 0 && (
            <button
              type="button"
              className="min-h-11 border-0 bg-transparent text-terra-xs text-terra-texto-suave underline"
              onClick={vaciarCarrito}
            >
              Vaciar carrito
            </button>
          )}
        </footer>
      </aside>

      <button
        type="button"
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
