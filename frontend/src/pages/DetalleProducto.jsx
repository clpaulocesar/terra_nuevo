import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, CircleMinus, CirclePlus, FileText, MapPin, ShieldCheck, ShoppingCart, Sparkles, Star, Truck, X } from 'lucide-react';
import { obtenerProducto, listarProductos } from '../services/productoService.js';
import { useCarrito } from '../hooks/useCarrito.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './DetalleProducto.css';

const coloresBase = [{ nombre: 'Gris marengo', valor: '#54595f' }, { nombre: 'Gris perla', valor: '#9b9b9b' }, { nombre: 'Azul petróleo', valor: '#455a64' }, { nombre: 'Terracota', valor: '#8d5b4c' }, { nombre: 'Borgoña', valor: '#8e2828' }, { nombre: 'Verde oliva', valor: '#5d6b4f' }];
const coloresExtra = [{ nombre: 'Blanco humo', valor: '#f1efe9' }, { nombre: 'Negro azabache', valor: '#211d1d' }, { nombre: 'Grafito', valor: '#3a3f44' }, { nombre: 'Arena', valor: '#cbb894' }, { nombre: 'Chocolate', valor: '#5a3b2a' }, { nombre: 'Azul noche', valor: '#233a63' }, { nombre: 'Celeste', valor: '#8fb8d8' }, { nombre: 'Verde bosque', valor: '#2f5233' }, { nombre: 'Mostaza', valor: '#cf8a2b' }, { nombre: 'Rosa empolvado', valor: '#d9a5a0' }];
const colores = [...coloresBase, ...coloresExtra];
const fallbackFotos = ['https://lh3.googleusercontent.com/aida-public/AB6AXuA_0IGZ5s0DjeFACULr5bK2zw8jNwY_4ygmGz_44Kd65Bb13xtjOAWf_fm_SD4sowQnCxMzCwU_ZD_DlXUGgV7nKlnEyI79XA31Ux46VzAsTssz8IaDziDvdlnriYJndVw-fukT_eKvBuoZjUQ7TIUvqEM4I4DJGnrYW6oGxCOdnHj9ITk2DfjrYEHNFCmMYaIS2C5r-2fvONkPGloLIafxeLD40KaqPvmWXpvg6uCzUefyXPRDfnq2'];

function videoIncrustado(url) {
  const coincidencia = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return coincidencia ? `https://www.youtube.com/embed/${coincidencia[1]}` : null;
}

export default function DetalleProducto() {
  const { id } = useParams();
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [videoAmpliado, setVideoAmpliado] = useState(false);
  const [color, setColor] = useState(colores[0]);
  const [paletaAbierta, setPaletaAbierta] = useState(false);
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);
  const [descripcionAbajoAbierta, setDescripcionAbajoAbierta] = useState(false);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true); setError(''); setFoto(0); setCantidad(1); setDescripcionExpandida(false); setDescripcionAbajoAbierta(false);
    obtenerProducto(id).then((dato) => { if (activo) setProducto(dato); }).catch((err) => { if (activo) setError(err.message || 'No fue posible cargar el producto.'); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id]);

  useEffect(() => {
    if (!producto?.categoria) return undefined;
    let activo = true;
    listarProductos({ categoria: producto.categoria, limite: 4 }).then((lista) => { if (activo) setRelacionados(lista.filter((item) => String(item.id) !== String(producto.id)).slice(0, 3)); }).catch(() => { if (activo) setRelacionados([]); });
    return () => { activo = false; };
  }, [producto]);

  const fotos = useMemo(() => producto?.imagenes?.length ? producto.imagenes : (producto?.imagen_url ? [producto.imagen_url] : fallbackFotos), [producto]);
  const agregar = () => { for (let indice = 0; indice < cantidad; indice += 1) agregarProducto(producto); setAgregado(true); setTimeout(() => setAgregado(false), 1800); };

  if (cargando) return <p className="detalle-status">Cargando producto…</p>;
  if (error || !producto) return <div className="detalle-status"><p>{error || 'Producto no encontrado.'}</p><Link to="/catalogo">Volver al catálogo</Link></div>;
  const disponible = Number(producto.stock) > 0;
  const videoEmbed = producto.video_url ? videoIncrustado(producto.video_url) : null;
  const videoSrc = videoEmbed ? `${videoEmbed}?autoplay=1&mute=1&loop=1&playlist=${videoEmbed.split('/').pop()}` : null;

  return <main className="product-detail">
    <nav className="product-detail__crumb"><Link to="/">Inicio</Link><ChevronRight size={14} /><Link to="/catalogo">Catálogo</Link><ChevronRight size={14} /><span>{producto.nombre}</span></nav>
    <section className="product-detail__card">
      <div className="product-detail__layout">
        <div className="product-gallery">
          <div className="product-gallery__main">{fotos[foto] ? <span className="tint-wrap"><img className="tint-base" src={fotos[foto]} alt={producto.nombre} /><i className="tint-overlay" style={{ backgroundColor: color.valor }} aria-hidden="true" /></span> : null}<b><Sparkles size={13} /> Más vendido</b><div className={`product-gallery__colors${paletaAbierta ? ' abierta' : ''}`}><b>Color:</b><div>{coloresBase.map((opcion) => <button type="button" title={opcion.nombre} aria-label={opcion.nombre} key={opcion.nombre} onClick={() => setColor(opcion)} className={color.nombre === opcion.nombre ? 'active' : ''} style={{ backgroundColor: opcion.valor }} />)}</div>{paletaAbierta && <div className="paleta-extra">{coloresExtra.map((opcion) => <button type="button" title={opcion.nombre} aria-label={opcion.nombre} key={opcion.nombre} onClick={() => setColor(opcion)} className={color.nombre === opcion.nombre ? 'active' : ''} style={{ backgroundColor: opcion.valor }} />)}<label className="paleta-custom" title="Elegir cualquier color"><span aria-hidden="true">+</span><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(color.valor) ? color.valor : '#808080'} onChange={(e) => setColor({ nombre: 'Personalizado', valor: e.target.value })} aria-label="Color personalizado" /></label></div>}<button type="button" className="paleta-toggle" onClick={() => setPaletaAbierta((v) => !v)} aria-expanded={paletaAbierta}>{paletaAbierta ? 'Ver menos' : 'Ver todos'}</button><small>Tono actual: <strong>{color.nombre}</strong></small></div>{producto.video_url && <button type="button" className="video-mini" onClick={() => setVideoAmpliado(true)} aria-label="Ampliar video del producto">{videoEmbed ? <iframe src={videoSrc} title={`Video de ${producto.nombre}`} tabIndex={-1} /> : <video src={producto.video_url} autoPlay muted loop playsInline preload="metadata" />}</button>}</div>
          <div className="product-gallery__thumbs">{fotos.slice(0, 4).map((src, indice) => <button className={foto === indice ? 'active' : ''} onClick={() => setFoto(indice)} type="button" key={`${src}-${indice}`}><span className="tint-wrap tint-thumb"><img className="tint-base" src={src} alt={`Vista ${indice + 1}`} /><i className="tint-overlay" style={{ backgroundColor: color.valor }} aria-hidden="true" /></span><span>Vista {indice + 1}</span></button>)}</div>
          {videoAmpliado && producto.video_url && <div className="video-modal" onClick={() => setVideoAmpliado(false)}><div className="video-box" onClick={e => e.stopPropagation()}><button type="button" className="video-close" onClick={() => setVideoAmpliado(false)} aria-label="Cerrar video"><X size={20} /></button>{videoEmbed ? <iframe src={videoSrc} title={`Video de ${producto.nombre}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={producto.video_url} controls autoPlay playsInline />}</div></div>}
        </div>
        <section className="product-buy">
          <h1>{producto.nombre}</h1><div className="product-buy__rating"><span>{[1, 2, 3, 4, 5].map((n) => <Star size={15} fill="currentColor" key={n} />)}</span><small>Producto recomendado TERRA</small></div>
          <div className="product-buy__price"><strong>{formatoMoneda(producto.precio)}</strong><small>{disponible ? 'Disponible para entrega inmediata' : 'Consultar disponibilidad'}</small></div>
          <div className="product-buy__desc-wrap"><p className={`product-buy__description ${descripcionExpandida ? 'expanded' : 'collapsed'}`}>{producto.descripcion || 'Diseño funcional y materiales de calidad para brindar confort a tu hogar todos los días.'}</p><button type="button" className="product-buy__desc-toggle" onClick={() => setDescripcionExpandida((v) => !v)} aria-expanded={descripcionExpandida}>{descripcionExpandida ? 'Ver menos' : 'Ver descripción completa'} <ChevronDown size={14} style={descripcionExpandida ? { transform: 'rotate(180deg)' } : undefined} /></button></div>
          <div className="product-buy__quantity"><b>Cantidad:</b><div><button type="button" aria-label="Disminuir" disabled={cantidad <= 1} onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}><CircleMinus size={19} /></button><span>{cantidad}</span><button type="button" aria-label="Aumentar" disabled={cantidad >= Number(producto.stock)} onClick={() => setCantidad((valor) => Math.min(Number(producto.stock), valor + 1))}><CirclePlus size={19} /></button></div></div>
          <button className="product-buy__add" disabled={!disponible} onClick={agregar} type="button">{agregado ? <><Check size={19} /> Agregado al carrito</> : <><ShoppingCart size={19} /> Agregar al carrito</>}</button><Link className="product-buy__now" to="/carrito">Comprar ahora</Link>
          <div className="product-buy__guarantees"><span><ShieldCheck size={15} /> Garantía oficial TERRA</span><span><Truck size={15} /> Envío seguro a Bolivia</span></div>
        </section>
      </div>
      <div className="product-highlights"><article><Sparkles size={23} /><b>Confort superior</b><small>Materiales seleccionados</small></article><article><Check size={23} /><b>Calidad garantizada</b><small>Respaldo TERRA</small></article><article><Truck size={23} /><b>Despacho coordinado</b><small>Atención personalizada</small></article><article><ShieldCheck size={23} /><b>Compra segura</b><small>Soporte en showroom</small></article></div>
    </section>
    <section className="product-detail__accordion"><div className={`accordion-item ${descripcionAbajoAbierta ? 'open' : ''}`}><button type="button" className="accordion-header" onClick={() => setDescripcionAbajoAbierta((v) => !v)} aria-expanded={descripcionAbajoAbierta}><span><FileText size={17} /> Descripción completa</span><ChevronDown size={18} className={`accordion-chevron ${descripcionAbajoAbierta ? 'rotated' : ''}`} /></button>{descripcionAbajoAbierta && <div className="accordion-body"><p>{producto.descripcion || 'Diseño funcional y materiales de calidad para brindar confort a tu hogar todos los días.'}</p></div>}</div></section>
    <section className="product-detail__bottom"><article><h2>Ficha técnica y dimensiones</h2><dl><dt>Modelo</dt><dd>{producto.nombre}</dd><dt>Categoría</dt><dd>{producto.categoria}</dd><dt>Medidas</dt><dd>{producto.medida || producto.detalle || 'Consultar medidas disponibles'}</dd><dt>Disponibilidad</dt><dd>{disponible ? `${producto.stock} unidades disponibles` : 'Consultar en showroom'}</dd><dt>Garantía</dt><dd>Garantía oficial de fábrica TERRA</dd></dl></article><aside><MapPin size={24} /><h2>Pruébalo en nuestro showroom</h2><p>Visitá nuestro espacio de descanso para conocer el producto y recibir asesoramiento.</p><Link to="/catalogo">Coordinar visita por WhatsApp</Link></aside></section>
    {!!relacionados.length && <section className="product-related"><header><h2>Otros modelos que te pueden interesar</h2><Link to="/catalogo">Ver catálogo <ChevronRight size={16} /></Link></header><div>{relacionados.map((item) => <Link to={`/productos/${item.id}`} key={item.id}><figure>{item.imagen_url && <img src={item.imagen_url} alt={item.nombre} />}</figure><h3>{item.nombre}</h3><p>{item.descripcion || item.categoria}</p><strong>{formatoMoneda(item.precio)}</strong></Link>)}</div></section>}
  </main>;
}
