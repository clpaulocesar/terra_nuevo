import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, CircleMinus, CirclePlus, MapPin, Play, ShieldCheck, ShoppingCart, Sparkles, Star, Truck } from 'lucide-react';
import { obtenerProducto, listarProductos } from '../services/productoService.js';
import { useCarrito } from '../hooks/useCarrito.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { mediaDeVideo } from '../utils/videoEmbed.js';
import './DetalleProducto.css';

const colores = [{ nombre: 'Gris marengo', valor: '#54595f' }, { nombre: 'Gris perla', valor: '#9b9b9b' }, { nombre: 'Azul petróleo', valor: '#455a64' }, { nombre: 'Terracota', valor: '#8d5b4c' }, { nombre: 'Borgoña', valor: '#8e2828' }, { nombre: 'Verde oliva', valor: '#5d6b4f' }];
const fallbackFotos = ['https://lh3.googleusercontent.com/aida-public/AB6AXuA_0IGZ5s0DjeFACULr5bK2zw8jNwY_4ygmGz_44Kd65Bb13xtjOAWf_fm_SD4sowQnCxMzCwU_ZD_DlXUGgV7nKlnEyI79XA31Ux46VzAsTssz8IaDziDvdlnriYJndVw-fukT_eKvBuoZjUQ7TIUvqEM4I4DJGnrYW6oGxCOdnHj9ITk2DfjrYEHNFCmMYaIS2C5r-2fvONkPGloLIafxeLD40KaqPvmWXpvg6uCzUefyXPRDfnq2'];
const NOMBRES_COLOR = Object.fromEntries(colores.map((color) => [color.valor.toLowerCase(), color.nombre]));
// El soporte de video (YouTube/Vimeo/MP4) vive en utils/videoEmbed.js

export default function DetalleProducto() {
  const { id } = useParams();
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [color, setColor] = useState(colores[0]);
  const [agregado, setAgregado] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true); setError(''); setFoto(0); setCantidad(1); setVideoError(false);
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
  const coloresProducto = useMemo(() => {
    const lista = Array.isArray(producto?.colores) ? producto.colores : [];
    return lista.map((registro) => {
      const [nombreGuardado, valorGuardado] = String(registro).split('|');
      const valor = valorGuardado || nombreGuardado;
      return { valor, nombre: valorGuardado ? nombreGuardado : (NOMBRES_COLOR[String(valor).toLowerCase()] || valor) };
    });
  }, [producto]);
  useEffect(() => { if (coloresProducto.length) setColor(coloresProducto[0]); }, [producto?.id, coloresProducto]);
  const video = useMemo(() => mediaDeVideo(producto?.video_url), [producto?.video_url]);
  // URL del video con reproducción automática (autoplay). Los navegadores
  // solo permiten autoplay en modo silenciado, por eso agregamos mute/autoplay.
  const videoSrc = useMemo(() => {
    if (!video || video.tipo !== 'embed') return video?.src;
    const separador = video.src.includes('?') ? '&' : '?';
    const esVimeo = /player\.vimeo\.com/i.test(video.src);
    const parametros = esVimeo ? 'autoplay=1&muted=1' : 'autoplay=1&mute=1';
    return `${video.src}${separador}${parametros}`;
  }, [video]);
  const viendoVideo = Boolean(video) && foto === 0;
  const indiceFoto = video ? foto - 1 : foto;
  // Divide la descripción en líneas: respeta los saltos de línea ya existentes
  // y corta después de cada punto para que cada frase quede en su propia línea.
  const lineasDescripcion = useMemo(() => String(producto?.descripcion || '')
    .split(/\r?\n/)
    .flatMap((linea) => linea.split(/(?<=\.)\s+/))
    .map((frase) => frase.trim())
    .filter(Boolean), [producto?.descripcion]);
  const agregar = () => { for (let indice = 0; indice < cantidad; indice += 1) agregarProducto(producto); setAgregado(true); setTimeout(() => setAgregado(false), 1800); };

  if (cargando) return <p className="detalle-status">Cargando producto…</p>;
  if (error || !producto) return <div className="detalle-status"><p>{error || 'Producto no encontrado.'}</p><Link to="/catalogo">Volver al catálogo</Link></div>;
  const disponible = Number(producto.stock) > 0;

  return <main className="product-detail">
    <nav className="product-detail__crumb"><Link to="/">Inicio</Link><ChevronRight size={14} /><Link to="/catalogo">Catálogo</Link><ChevronRight size={14} /><span>{producto.nombre}</span></nav>
    <section className="product-detail__card">
      <div className="product-detail__layout">
        <div className="product-gallery">
          <div className={`product-gallery__main ${viendoVideo ? 'product-gallery__main--media' : ''}`}>
            {viendoVideo
              ? (video.tipo === 'embed'
                ? <iframe key={videoSrc} src={videoSrc} title={`Video de ${producto.nombre}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                : (videoError ? (
                  <div className="product-gallery__video-error">
                    <p>No se pudo reproducir el video en el navegador.</p>
                    <a href={video.src} target="_blank" rel="noopener noreferrer">Abrir video en nueva pestaña</a>
                  </div>
                ) : (
                  <video
                    key={video.src}
                    src={video.src}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={fotos[0]}
                    className="product-gallery__video"
                    onError={() => setVideoError(true)}
                  >
                    <source src={video.src} type={video.mime || 'video/mp4'} />
                    Tu navegador no soporta la reproducción de video.
                  </video>
                )))
              : (fotos[indiceFoto] ? <img src={fotos[indiceFoto]} alt={producto.nombre} /> : null)}
          </div>
          <div className="product-gallery__thumbs">
            {video && (
              <button
                className={`product-gallery__thumbs-video${foto === 0 ? ' active' : ''}`}
                onClick={() => setFoto(0)}
                type="button"
                key="video"
                title="Ver video del producto"
                aria-label="Ver video del producto"
              >
                <Play size={16} fill="currentColor" />
                <span>Video</span>
              </button>
            )}
            {fotos.slice(0, video ? 3 : 4).map((src, indice) => (
              <button
                className={foto === (video ? indice + 1 : indice) ? 'active' : ''}
                onClick={() => setFoto(video ? indice + 1 : indice)}
                type="button"
                key={`${src}-${indice}`}
              >
                <img src={src} alt={`Vista ${indice + 1}`} />
                <span>Vista {indice + 1}</span>
              </button>
            ))}
          </div>
        </div>
        <section className="product-buy">
          <h1>{producto.nombre}</h1><div className="product-buy__rating"><span>{[1, 2, 3, 4, 5].map((n) => <Star size={15} fill="currentColor" key={n} />)}</span><small>Producto recomendado TERRA</small></div>
          <div className="product-buy__price"><strong>{formatoMoneda(producto.precio)}</strong><small>{disponible ? 'Disponible para entrega inmediata' : 'Consultar disponibilidad'}</small></div>
<<<<<<< .merge_file_gjcsqs
          <p className="product-buy__description">{lineasDescripcion.map((linea, indice) => <span key={`${indice}-${linea}`}>{linea}</span>)}</p>
          <div className="product-buy__choice"><b>Color:</b><div>{colores.map((opcion) => <button type="button" title={opcion.nombre} aria-label={opcion.nombre} key={opcion.nombre} onClick={() => setColor(opcion)} className={color.nombre === opcion.nombre ? 'active' : ''} style={{ backgroundColor: opcion.valor }} />)}</div><small>Tono actual: <strong>{color.nombre}</strong></small></div>
=======
          <p className="product-buy__description">{producto.descripcion || 'Diseño funcional y materiales de calidad para brindar confort a tu hogar todos los días.'}</p>
          <div className="product-buy__choice"><b>Color:</b>{coloresProducto.length ? <><div>{coloresProducto.map((opcion) => <button type="button" title={opcion.nombre} aria-label={opcion.nombre} key={opcion.valor} onClick={() => setColor(opcion)} className={color.valor === opcion.valor ? 'active' : ''} style={{ backgroundColor: opcion.valor }} />)}</div><small>Tono actual: <strong>{color.nombre}</strong></small></> : <small>Colores por confirmar</small>}</div>
>>>>>>> .merge_file_OnzSke
          <div className="product-buy__quantity"><b>Cantidad:</b><div><button type="button" aria-label="Disminuir" disabled={cantidad <= 1} onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}><CircleMinus size={19} /></button><span>{cantidad}</span><button type="button" aria-label="Aumentar" disabled={cantidad >= Number(producto.stock)} onClick={() => setCantidad((valor) => Math.min(Number(producto.stock), valor + 1))}><CirclePlus size={19} /></button></div></div>
          <button className="product-buy__add" disabled={!disponible} onClick={agregar} type="button">{agregado ? <><Check size={19} /> Agregado al carrito</> : <><ShoppingCart size={19} /> Agregar al carrito</>}</button><Link className="product-buy__now" to="/carrito">Comprar ahora</Link>
          <div className="product-buy__guarantees"><span><ShieldCheck size={15} /> Garantía oficial TERRA</span><span><Truck size={15} /> Envío seguro a Bolivia</span></div>
        </section>
      </div>
      <div className="product-highlights"><article><Sparkles size={23} /><b>Confort superior</b><small>Materiales seleccionados</small></article><article><Check size={23} /><b>Calidad garantizada</b><small>Respaldo TERRA</small></article><article><Truck size={23} /><b>Despacho coordinado</b><small>Atención personalizada</small></article><article><ShieldCheck size={23} /><b>Compra segura</b><small>Soporte en showroom</small></article></div>
    </section>
    <section className="product-detail__bottom"><article><h2>Ficha técnica y dimensiones</h2><dl><dt>Modelo</dt><dd>{producto.nombre}</dd><dt>Categoría</dt><dd>{producto.categoria}</dd><dt>Medidas</dt><dd>{producto.medida || producto.detalle || 'Consultar medidas disponibles'}</dd><dt>Disponibilidad</dt><dd>{disponible ? `${producto.stock} unidades disponibles` : 'Consultar en showroom'}</dd><dt>Garantía</dt><dd>Garantía oficial de fábrica TERRA</dd></dl></article><aside><MapPin size={24} /><h2>Pruébalo en nuestro showroom</h2><p>Visitá nuestro espacio de descanso para conocer el producto y recibir asesoramiento.</p><Link to="/catalogo">Coordinar visita por WhatsApp</Link></aside></section>
    {!!relacionados.length && <section className="product-related"><header><h2>Otros modelos que te pueden interesar</h2><Link to="/catalogo">Ver catálogo <ChevronRight size={16} /></Link></header><div>{relacionados.map((item) => <Link to={`/productos/${item.id}`} key={item.id}><figure>{item.imagen_url && <img src={item.imagen_url} alt={item.nombre} />}</figure><h3>{item.nombre}</h3><p>{item.descripcion || item.categoria}</p><strong>{formatoMoneda(item.precio)}</strong></Link>)}</div></section>}
  </main>;
}
