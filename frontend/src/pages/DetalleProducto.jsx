import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, CircleMinus, CirclePlus, MapPin, Play, ShieldCheck, ShoppingCart, Sparkles, Star, Truck } from 'lucide-react';
import { obtenerProducto, listarProductos } from '../services/productoService.js';
import { useCarrito } from '../hooks/useCarrito.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { mediaDeVideo } from '../utils/videoEmbed.js';
import './DetalleProducto.css';
import './DetalleProductoSpecs.css';
import './DetalleProductoRelated.css';
import './DetalleProductoPalette.css';

const colores = [{ nombre: 'Gris marengo', valor: '#54595f' }, { nombre: 'Gris perla', valor: '#9b9b9b' }, { nombre: 'Azul petróleo', valor: '#455a64' }, { nombre: 'Terracota', valor: '#8d5b4c' }, { nombre: 'Borgoña', valor: '#8e2828' }, { nombre: 'Verde oliva', valor: '#5d6b4f' }];
const fallbackFotos = ['https://lh3.googleusercontent.com/aida-public/AB6AXuA_0IGZ5s0DjeFACULr5bK2zw8jNwY_4ygmGz_44Kd65Bb13xtjOAWf_fm_SD4sowQnCxMzCwU_ZD_DlXUGgV7nKlnEyI79XA31Ux46VzAsTssz8IaDziDvdlnriYJndVw-fukT_eKvBuoZjUQ7TIUvqEM4I4DJGnrYW6oGxCOdnHj9ITk2DfjrYEHNFCmMYaIS2C5r-2fvONkPGloLIafxeLD40KaqPvmWXpvg6uCzUefyXPRDfnq2'];
const NOMBRES_COLOR = Object.fromEntries(colores.map((color) => [color.valor.toLowerCase(), color.nombre]));
// El soporte de video (YouTube/Vimeo/MP4) vive en utils/videoEmbed.js

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [color, setColor] = useState(null);
  const [menuColoresAbierto, setMenuColoresAbierto] = useState(false);
  const selectorColorRef = useRef(null);
  const autoAgregarProcesadoRef = useRef(null);
  const [agregado, setAgregado] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true); setError(''); setFoto(0); setCantidad(1); setVideoError(false); setMenuColoresAbierto(false);
    obtenerProducto(id).then((dato) => { if (activo) setProducto(dato); }).catch((err) => { if (activo) setError(err.message || 'No fue posible cargar el producto.'); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [id]);

  useEffect(() => {
    if (!menuColoresAbierto) return undefined;
    const cerrarMenu = (evento) => {
      if (evento.type === 'keydown' && evento.key === 'Escape') {
        setMenuColoresAbierto(false);
      } else if (evento.type === 'pointerdown' && !selectorColorRef.current?.contains(evento.target)) {
        setMenuColoresAbierto(false);
      }
    };
    document.addEventListener('pointerdown', cerrarMenu);
    document.addEventListener('keydown', cerrarMenu);
    return () => {
      document.removeEventListener('pointerdown', cerrarMenu);
      document.removeEventListener('keydown', cerrarMenu);
    };
  }, [menuColoresAbierto]);

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
      const normalizar = (dato) => ({
        ...dato,
        id: dato.id || `${dato.nombre}-${dato.valor}`,
        nombre: String(dato.nombre),
        valor: String(dato.valor),
        imagenes: Array.isArray(dato.imagenes) ? dato.imagenes : [],
        modo: dato.modo === 'paleta' ? 'paleta' : 'variante',
      });
      try {
        const dato = typeof registro === 'object' ? registro : JSON.parse(String(registro));
        if (dato?.nombre && dato?.valor) return normalizar(dato);
      } catch { /* Compatibilidad con colores guardados antes de asociar fotos. */ }
      const [nombreGuardado, valorGuardado] = String(registro).split('|');
      const valor = valorGuardado || nombreGuardado;
      return normalizar({
        valor: valor || '#54595f',
        nombre: valorGuardado ? nombreGuardado : (NOMBRES_COLOR[String(valor).toLowerCase()] || valor || 'Color'),
        imagenes: [],
      });
    });
  }, [producto]);
  // Un mismo producto puede combinar colores únicos (variantes) y una paleta
  // multicolor. Cada grupo se muestra por separado y de forma dinámica.
  const coloresPaleta = useMemo(() => coloresProducto.filter((opcion) => opcion.modo === 'paleta'), [coloresProducto]);
  const coloresUnicos = useMemo(() => coloresProducto.filter((opcion) => opcion.modo !== 'paleta'), [coloresProducto]);
  useEffect(() => { const inicial = coloresUnicos[0] || coloresProducto[0]; if (inicial) setColor(inicial); }, [producto?.id, coloresProducto, coloresUnicos]);
  const ruedaPaleta = useMemo(() => {
    if (!coloresPaleta.length) return 'transparent';
    const paso = 100 / coloresPaleta.length;
    const segmentos = coloresPaleta.map((opcion, indice) => {
      const inicio = (indice * paso).toFixed(2);
      const fin = ((indice + 1) * paso).toFixed(2);
      return `${opcion.valor} ${inicio}% ${fin}%`;
    });
    return `conic-gradient(${segmentos.join(', ')})`;
  }, [coloresPaleta]);
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
  const seleccionarColor = (opcion) => {
    const siguiente = opcion?.modo === 'paleta'
      ? { id: '__paleta__', nombre: 'Multicolor', valor: 'multicolor', modo: 'paleta', imagenes: [] }
      : opcion;
    setColor(siguiente);
    const fotoDelColor = opcion?.imagenes?.[0];
    const indice = fotos.indexOf(fotoDelColor);
    if (indice >= 0) {
      setFoto(video ? indice + 1 : indice);
      return;
    }
    // Compatibilidad con productos registrados antes de vincular fotos por color.
    // Usa el orden de la galería hasta que el administrador haga la asociación explícita.
    const indiceColor = coloresUnicos.findIndex((item) => (item.id || item.valor) === (opcion.id || opcion.valor));
    if (indiceColor >= 0 && fotos.length) setFoto(video ? Math.min(indiceColor + 1, fotos.length) : Math.min(indiceColor, fotos.length - 1));
  };
  const nombreSeleccionado = color?.modo === 'paleta' ? 'Multicolor' : (color?.nombre || coloresUnicos[0]?.nombre || 'Sin color');
  const autoAgregarSolicitado = searchParams.get('agregar') === '1';
  useEffect(() => {
    if (!autoAgregarSolicitado) {
      autoAgregarProcesadoRef.current = null;
      return;
    }
    if (!producto || String(producto.id) !== String(id) || autoAgregarProcesadoRef.current === String(id)) return;
    autoAgregarProcesadoRef.current = String(id);
    const colorInicial = color || coloresUnicos[0] || coloresProducto[0];
    const agregadoAlCarrito = agregarProducto(producto, 1, { color: colorInicial });
    navigate(agregadoAlCarrito ? '/carrito' : `/productos/${encodeURIComponent(id)}`, { replace: true });
  }, [agregarProducto, autoAgregarSolicitado, color, coloresProducto, coloresUnicos, id, navigate, producto]);
  const opcionesColores = [
    ...coloresUnicos,
    ...(coloresPaleta.length ? [{ id: '__paleta__', nombre: 'Multicolor', valor: 'multicolor', modo: 'paleta', imagenes: [] }] : []),
  ];
  const coloresVisibles = opcionesColores.slice(0, 3);
  const coloresAdicionales = opcionesColores.slice(3);
  const opcionSeleccionada = (opcion) => opcion.modo === 'paleta'
    ? color?.modo === 'paleta'
    : color?.valor === opcion.valor && color?.nombre === opcion.nombre;
  const renderOpcionColor = (opcion, adicional = false) => {
    const esPaleta = opcion.modo === 'paleta';
    const seleccionado = opcionSeleccionada(opcion);
    const nombre = esPaleta ? 'Multicolor' : opcion.nombre;
    const swatch = esPaleta
      ? (ruedaPaleta || 'conic-gradient(#f59e0b, #ef4444, #3b82f6, #f59e0b)')
      : opcion.valor;
    return (
      <button
        type="button"
        key={opcion.id || `${opcion.nombre}-${opcion.valor}`}
        className={`product-buy__color-choice${adicional ? ' product-buy__color-choice--menu' : ''}${seleccionado ? ' is-selected' : ''}`}
        onClick={() => {
          seleccionarColor(opcion);
          setMenuColoresAbierto(false);
        }}
        aria-label={esPaleta ? 'Elegir paleta multicolor' : `Elegir color ${opcion.nombre}`}
        aria-pressed={seleccionado}
        title={nombre}
      >
        <span
          className={`product-buy__color-choice-swatch${esPaleta ? ' is-palette' : ''}`}
          style={{ background: swatch }}
        />
        <span className="product-buy__color-choice-name">{nombre}</span>
        {seleccionado && <Check size={14} className="product-buy__color-choice-check" />}
        {esPaleta && adicional && (
          <small className="product-buy__color-choice-note">{coloresPaleta.length > 1 ? `${coloresPaleta.length} tonos en 1` : '1 tono'}</small>
        )}
      </button>
    );
  };
  const seleccionarFoto = (indice) => {
    const fuente = fotos[indice];
    const colorDeLaFoto = coloresProducto.find((opcion) => opcion.imagenes?.includes(fuente));
    if (colorDeLaFoto) setColor(colorDeLaFoto);
    setFoto(video ? indice + 1 : indice);
  };
  const viendoVideo = Boolean(video) && foto === 0;
  const indiceFoto = video ? foto - 1 : foto;
  // Divide la descripción en líneas: respeta los saltos de línea ya existentes
  // y corta después de cada punto para que cada frase quede en su propia línea.
  const lineasDescripcion = useMemo(() => String(producto?.descripcion || '')
    .split(/\r?\n/)
    .flatMap((linea) => linea.split(/(?<=\.)\s+/))
    .map((frase) => frase.trim())
    .filter(Boolean), [producto?.descripcion]);
  const agregar = () => { for (let indice = 0; indice < cantidad; indice += 1) agregarProducto(producto, 1, { color }); setAgregado(true); setTimeout(() => setAgregado(false), 1800); };

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
                onClick={() => seleccionarFoto(indice)}
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
          <p className="product-buy__description">{lineasDescripcion.length ? lineasDescripcion.slice(0, 2).map((linea, indice) => <span key={`${indice}-${linea}`}>{linea}</span>) : 'Conocé las características y dimensiones en la ficha técnica.'}</p>
          <div ref={selectorColorRef} className={`product-buy__color-selector${menuColoresAbierto ? ' is-open' : ''}`}>
            <div className="product-buy__color-head">
              <span className="product-buy__color-label">Color / Acabado:</span>
              <span className="product-buy__color-current">Seleccionado: <strong>{nombreSeleccionado}</strong></span>
            </div>
            <div className="product-buy__color-options">
              {coloresVisibles.map((opcion) => renderOpcionColor(opcion))}
              {coloresAdicionales.length > 0 && (
                <div className="product-buy__color-more">
                  <button
                    type="button"
                    className="product-buy__color-more-trigger"
                    onClick={() => setMenuColoresAbierto((abierto) => !abierto)}
                    aria-expanded={menuColoresAbierto}
                    aria-haspopup="true"
                  >
                    Más <span>+{coloresAdicionales.length}</span>
                    <ChevronDown size={14} className="product-buy__color-more-icon" />
                  </button>
                  {menuColoresAbierto && (
                    <div className="product-buy__color-menu" aria-label="Más opciones de color">
                      {coloresAdicionales.map((opcion) => renderOpcionColor(opcion, true))}
                    </div>
                  )}
                </div>
              )}
              {!coloresProducto.length && <span className="product-buy__color-empty">Colores por confirmar</span>}
            </div>
          </div>
          <div className="product-buy__quantity"><b>Cantidad:</b><div><button type="button" aria-label="Disminuir" disabled={cantidad <= 1} onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}><CircleMinus size={19} /></button><span>{cantidad}</span><button type="button" aria-label="Aumentar" disabled={cantidad >= Number(producto.stock)} onClick={() => setCantidad((valor) => Math.min(Number(producto.stock), valor + 1))}><CirclePlus size={19} /></button></div></div>
          <button className="product-buy__add" disabled={!disponible} onClick={agregar} type="button">{agregado ? <><Check size={19} /> Agregado al carrito</> : <><ShoppingCart size={19} /> Agregar al carrito</>}</button><Link className="product-buy__now" to="/carrito">Comprar ahora</Link>
          <div className="product-buy__guarantees"><span><ShieldCheck size={15} /> Garantía oficial TERRA</span><span><Truck size={15} /> Envío seguro a Bolivia</span></div>
        </section>
      </div>
      <div className="product-highlights"><article><Sparkles size={23} /><b>Confort superior</b><small>Materiales seleccionados</small></article><article><Check size={23} /><b>Calidad garantizada</b><small>Respaldo TERRA</small></article><article><Truck size={23} /><b>Despacho coordinado</b><small>Atención personalizada</small></article><article><ShieldCheck size={23} /><b>Compra segura</b><small>Soporte en showroom</small></article></div>
    </section>
    <section className="product-detail__bottom"><article><h2>Ficha técnica y dimensiones</h2><dl><dt>Modelo</dt><dd>{producto.nombre}</dd><dt>Categoría</dt><dd>{producto.categoria}</dd><dt>Medidas</dt><dd>{producto.medida || producto.detalle || 'Consultar medidas disponibles'}</dd><dt>Disponibilidad</dt><dd>{disponible ? `${producto.stock} unidades disponibles` : 'Consultar en showroom'}</dd><dt>Garantía</dt><dd>Garantía oficial de fábrica TERRA</dd></dl>{lineasDescripcion.length > 0 && <details className="product-detail__specs"><summary>Descripción y características del producto</summary><div>{lineasDescripcion.map((linea, indice) => <p key={`${indice}-${linea}`}>{linea}</p>)}</div></details>}</article><aside><MapPin size={24} /><h2>Pruébalo en nuestro showroom</h2><p>Visitá nuestro espacio de descanso para conocer el producto y recibir asesoramiento.</p><Link to="/catalogo">Coordinar visita por WhatsApp</Link></aside></section>
    {!!relacionados.length && <section className="product-related"><header><h2>Otros modelos que te pueden interesar</h2><Link to="/catalogo">Ver catálogo <ChevronRight size={16} /></Link></header><div>{relacionados.map((item) => <Link className="product-related-card" to={`/productos/${item.id}`} key={item.id}><figure>{item.imagen_url && <img src={item.imagen_url} alt={item.nombre} />}</figure><section><span className="product-related-card__category">{item.categoria}</span><h3>{item.nombre}</h3><p>{item.descripcion || 'Conocé sus características, disponibilidad y opciones de color.'}</p><div className="product-related-card__footer"><div><small className={Number(item.stock) > 0 ? 'in-stock' : 'out-stock'}>{Number(item.stock) > 0 ? 'Disponible' : 'Consultar stock'}</small><strong>{formatoMoneda(item.precio)}</strong></div><span>Ver detalle <ChevronRight size={15} /></span></div></section></Link>)}</div></section>}
  </main>;
}
