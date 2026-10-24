import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  MapPin,
  Minus,
  PackageOpen,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";
import { useCarrito } from "../hooks/useCarrito.js";
import { SesionClienteContext } from "../context/SesionClienteContext.jsx";
import { formatoMoneda } from "../utils/formatoMoneda.js";
import { leerCarritoQr, limpiarCarritoQr } from "../services/qrCartService.js";
import "./CarritoPage.css";

export default function CarritoPage() {
  const {
    items,
    subtotal,
    cantidadTotal,
    actualizarCantidad,
    quitarProducto,
    vaciarCarrito,
    importarProductosQr,
    entregaDomicilio,
    setEntregaDomicilio,
  } = useCarrito();
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const tieneDireccionEntrega = Boolean(sesion?.direccion?.trim());
  const destinoContinuar = esMayorista ? "/confirmacion" : "/identificacion";

  // Compra por QR: el catálogo y la ficha QR (detalle-qr.html) llegan a
  // /carrito?confirmarQr=1 con el borrador en localStorage. Se importa al
  // carrito (memoria), se limpia el borrador y se quita el parámetro de la URL.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const importacionQrProcesada = useRef(false);
  const inicioArrastreResumen = useRef(null);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const confirmarQr = searchParams.get("confirmarQr") === "1";
  const errorQr = searchParams.get("errorQr");
  const cerrarOAbrirResumen = () => setResumenAbierto((abierto) => !abierto);
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

  useEffect(() => {
    if (!confirmarQr || importacionQrProcesada.current) return;
    importacionQrProcesada.current = true;
    try {
      const productosQr = leerCarritoQr();
      if (!productosQr.length) {
        navigate("/carrito?errorQr=vacio", { replace: true });
        return;
      }
      importarProductosQr(productosQr);
      limpiarCarritoQr();
      navigate("/carrito", { replace: true });
    } catch {
      navigate("/carrito?errorQr=almacenamiento", { replace: true });
    }
  }, [confirmarQr, importarProductosQr, navigate]);

  // Si el mayorista elige envío y luego borra su dirección del perfil, el
  // carrito no debe quedar apuntando a una entrega sin dirección.
  useEffect(() => {
    if (!tieneDireccionEntrega) setEntregaDomicilio(false);
  }, [tieneDireccionEntrega, setEntregaDomicilio]);

  if (confirmarQr) {
    return (
      <section className="cart-page cart-empty">
        <div className="cart-empty__wrap">
          <div className="cart-empty__icon">
            <PackageOpen size={64} />
          </div>
          <h1 className="cart-empty__title">Preparando tu compra</h1>
          <p className="cart-empty__subtitle">
            Estamos reuniendo los productos que agregaste al escanear los códigos QR.
          </p>
        </div>
      </section>
    );
  }

  if (!items.length) {
    const mensajeError =
      errorQr === "vacio"
        ? "No encontramos productos escaneados. Volvé a escanear los códigos QR y agregalos antes de confirmar."
        : errorQr === "almacenamiento"
          ? "No se pudo recuperar la compra QR. Habilitá el almacenamiento del sitio y volvé a intentarlo."
          : "";
    return (
      <section className="cart-page cart-empty">
        <div className="cart-empty__wrap">
          <div className="cart-empty__icon">
            <PackageOpen size={64} />
          </div>
          <h1 className="cart-empty__title">
            {mensajeError ? "No se pudo confirmar la compra QR" : "Tu carrito está vacío"}
          </h1>
          <p className="cart-empty__subtitle" role={mensajeError ? "alert" : undefined}>
            {mensajeError || "Explorá el catálogo y elegí los productos que más te gusten."}
          </p>
          <Link to={mensajeError ? "/catalogo?abrirQr=1" : "/catalogo"} className="cart-empty__cta">
            {mensajeError ? "Volver a escanear" : "Explorar productos"} <ArrowRight size={18} />
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
      {esMayorista && (
        <section className="cart-delivery" aria-labelledby="entrega-titulo">
          <header className="cart-delivery__head">
            <div>
              <h2 id="entrega-titulo">¿Cómo querés recibir tu pedido?</h2>
              <p>El envío a domicilio es opcional. Si preferís, retirá en tienda sin costo.</p>
            </div>
            <span className="cart-delivery__tag">{entregaDomicilio ? 'Envío a domicilio' : 'Retiro en tienda'}</span>
          </header>
          <div className="cart-delivery__options" role="radiogroup" aria-labelledby="entrega-titulo">
            <button
              type="button"
              role="radio"
              aria-checked={!entregaDomicilio}
              className={`cart-delivery__option${!entregaDomicilio ? ' is-selected' : ''}`}
              onClick={() => setEntregaDomicilio(false)}
            >
              <span className="cart-delivery__icon"><PackageOpen size={21} /></span>
              <span className="cart-delivery__text">
                <b>Retiro en tienda</b>
                <small>Pagás y retirás en el mostrador.</small>
              </span>
              <span className="cart-delivery__mark" aria-hidden="true">{!entregaDomicilio && <Check size={14} />}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={entregaDomicilio}
              className={`cart-delivery__option${entregaDomicilio ? ' is-selected' : ''}`}
              disabled={!tieneDireccionEntrega}
              onClick={() => setEntregaDomicilio(true)}
            >
              <span className="cart-delivery__icon"><Truck size={21} /></span>
              <span className="cart-delivery__text">
                <b>Envío a domicilio</b>
                <small>{tieneDireccionEntrega ? 'A la dirección de tu perfil mayorista.' : 'Necesitás registrar una dirección.'}</small>
              </span>
              <span className="cart-delivery__mark" aria-hidden="true">{entregaDomicilio && <Check size={14} />}</span>
            </button>
          </div>
          {entregaDomicilio && tieneDireccionEntrega && (
            <div className="cart-delivery__address">
              <MapPin size={20} />
              <div>
                <b>Se envía a</b>
                <strong>{sesion.direccion}</strong>
                {sesion.referencia && <small>Referencia: {sesion.referencia}</small>}
              </div>
              <Link to="/mi-cuenta">Cambiar dirección</Link>
            </div>
          )}
          {!tieneDireccionEntrega && (
            <p className="cart-delivery__hint">
              <Info size={16} />
              <span>Para recibir a domicilio registrá una dirección. <Link to="/mi-cuenta">Registrar dirección</Link></span>
            </p>
          )}
        </section>
      )}
      {!esMayorista && <div className="cart-notice">
        <ShoppingBag size={24} />
        <div>
          <b>Pago en mostrador presencial</b>
          <p>Tu pedido se generará para pagar en caja. No se realizará ningún
            cobro en este terminal de autoservicio.</p>
        </div>
      </div>}
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
        <aside className={`cart-summary ${resumenAbierto ? 'is-mobile-open' : ''}`}>
          <button className="cart-mobile-summary-toggle" type="button" aria-label={resumenAbierto ? 'Contraer resumen del pedido' : 'Expandir resumen del pedido'} aria-expanded={resumenAbierto} onClick={cerrarOAbrirResumen} onTouchStart={iniciarArrastreResumen} onTouchEnd={terminarArrastreResumen}>
            <span aria-hidden="true" />
          </button>
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
          <Link className="cart-confirm" to={destinoContinuar}>
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
