import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCarrito } from '../hooks/useCarrito.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { emojiCategoria } from '../data/categorias.js';
import { limpiarCarritoQr, leerCarritoQr } from '../services/qrCartService.js';
import './CarritoPage.css';

export default function CarritoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { items, subtotal, cantidadTotal, actualizarCantidad, quitarProducto, vaciarCarrito, importarProductosQr } = useCarrito();
  const importacionQrProcesada = useRef(false);
  const confirmarQr = searchParams.get('confirmarQr') === '1';
  const errorQr = searchParams.get('errorQr');

  useEffect(() => {
    if (!confirmarQr || importacionQrProcesada.current) return;
    importacionQrProcesada.current = true;

    try {
      const productosQr = leerCarritoQr();
      if (!productosQr.length) {
        navigate('/carrito?errorQr=vacio', { replace: true });
        return;
      }
      importarProductosQr(productosQr);
      limpiarCarritoQr();
      navigate('/carrito', { replace: true });
    } catch {
      navigate('/carrito?errorQr=almacenamiento', { replace: true });
    }
  }, [confirmarQr, importarProductosQr, navigate]);

  if (confirmarQr) return <section className="cart-page cart-empty"><PackageOpen size={58}/><h1>Preparando tu compra</h1><p>Estamos reuniendo los productos que agregaste al escanear los códigos QR.</p></section>;
  if (errorQr) return <section className="cart-page cart-empty"><PackageOpen size={58}/><h1>No se pudo confirmar la compra QR</h1><p role="alert">{errorQr === 'vacio' ? 'No encontramos productos escaneados. Volvé a escanear los códigos QR y agregalos antes de confirmar.' : 'No se pudo recuperar la compra QR. Habilitá el almacenamiento del sitio y volvé a intentarlo.'}</p><Link to="/catalogo">Volver al catálogo <ArrowRight size={19}/></Link></section>;
  if (!items.length) return <section className="cart-page cart-empty"><PackageOpen size={58}/><h1>Tu carrito está vacío</h1><p>Explorá el catálogo y elegí los productos que más te gusten.</p><Link to="/catalogo">Explorar productos <ArrowRight size={19}/></Link></section>;
  return <section className="cart-page"><header className="cart-heading"><div><span><ShoppingBag size={16}/> Paso 3 · Resumen de compra</span><h1>Revisá tu pedido</h1><p>Verificá tus artículos antes de generar el ticket para pagar en caja.</p></div></header><div className="cart-notice"><ShoppingBag size={28}/><div><b>Pago en mostrador presencial</b><p>Tu pedido se generará para pagar en caja. No se realizará ningún cobro en este kiosco.</p></div></div><div className="cart-layout"><div className="cart-list-card"><div className="cart-list-title"><h2>Detalle de artículos ({cantidadTotal})</h2><button onClick={vaciarCarrito} type="button">Vaciar carrito</button></div>{items.map((item) => <article className="cart-item" key={item.lineaId}><div className="cart-item-image">{item.imagen_url ? <img src={item.imagen_url} alt=""/> : emojiCategoria(item.categoria)}</div><div className="cart-item-info"><span>{item.categoria}</span><h3>{item.nombre}</h3>{item.color && <small className="cart-item-color"><i style={{ backgroundColor: item.color.valor }} />Color: {item.color.nombre}</small>}<p>{formatoMoneda(item.precio)} por unidad</p></div><div className="cart-quantity"><button aria-label="Restar" onClick={() => actualizarCantidad(item.lineaId, item.cantidad - 1)} type="button"><Minus size={17}/></button><b>{item.cantidad}</b><button aria-label="Sumar" disabled={item.cantidad >= item.stock} onClick={() => actualizarCantidad(item.lineaId, item.cantidad + 1)} type="button"><Plus size={17}/></button></div><strong>{formatoMoneda(item.precio * item.cantidad)}</strong><button className="cart-delete" onClick={() => quitarProducto(item.lineaId)} type="button" aria-label={`Quitar ${item.nombre}`}><Trash2 size={19}/></button></article>)}</div><aside className="cart-summary"><h2>Liquidación final</h2><div className="cart-summary-box"><p><span>Subtotal de artículos</span><b>{formatoMoneda(subtotal)}</b></p><p><span>Impuestos</span><b>Incluidos</b></p><hr/><p className="cart-total"><span>Total a pagar en caja</span><b>{formatoMoneda(subtotal)}</b></p></div><div className="cart-payments"><span>Efectivo (Bs)</span><span>QR Simple</span><span>Tarjetas</span></div><Link className="cart-confirm" to="/identificacion"><PackageOpen size={23}/> Continuar y generar pedido</Link><Link className="cart-back" to="/catalogo">Seguir comprando</Link><small>Terminal seguro · Ticket inmediato en caja</small></aside></div></section>;
}
