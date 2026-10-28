import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SUCURSALES_DATA, evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';
import { useVoz } from '../context/VozContext.jsx';
import { listarProductos } from '../services/api.js';
import { mediaDeVideo } from '../utils/videoEmbed.js';

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
}

export default function DetalleProductoPage({
  producto,
  sucursalActiva,
  setSucursalActiva,
  onNavegar,
  onAgregarAlCarrito,
  onAbrirSucursales,
  onVerDetalle,
}) {
  const [modoMedia, setModoMedia] = useState('foto'); // 'foto' | 'video' | '360'
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [indice360, setIndice360] = useState(0);
  const [autoRotar360, setAutoRotar360] = useState(false);
  const [zoomModalAbierto, setZoomModalAbierto] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  const arrastre360Ref = useRef({ startX: 0, startIndice: 0, activo: false });
  const { vozActiva, hablar, anunciar } = useVoz();

  const productoActivo = useMemo(() => {
    if (!producto) return null;
    return {
      id: producto.id,
      sku: producto.sku || producto.codigoTerra || producto.codigoInterno || `TR-${producto.id}`,
      nombre: producto.nombre || producto.titulo || 'Producto TERRA',
      subtitulo: producto.sublinea || producto.categoria || 'Línea Confort & Descanso',
      descripcionCorta:
        producto.descripcion ||
        'Producto exclusivo TERRA Santa Cruz con garantía de fábrica y materiales certificados.',
      descripcionLarga:
        producto.descripcion ||
        'Este producto ha sido diseñado bajo estrictos estándares ergonómicos y de durabilidad, con materiales certificados para garantizar confort y resistencia en hogares cruceños.',
      categoria: producto.categoria || 'Catálogo General',
      marca: producto.marca || 'TERRA Confort & Hogar',
      precio: Number(producto.precio || 0),
      precioOriginal:
        producto.precioOriginal ||
        (producto.enOferta && Number(producto.precioLista || 0) > Number(producto.precio || 0)
          ? Number(producto.precioLista)
          : null),
      descuento: producto.descuento || null,
      enOferta: Boolean(producto.enOferta),
      masVendido: Boolean(producto.masVendido),
      stock: Number(producto.stock ?? producto.stock_quantity ?? 0),
      sucursales: Array.isArray(producto.sucursales) ? producto.sucursales : [],
      plazas: producto.plazas || producto.medida || null,
      firmeza: producto.firmeza || producto.detalle || null,
      calificacion: producto.calidad ? producto.calidad.replace(/[^\d.]/g, '') || '5.0' : '4.9',
      opiniones: 84,
      videoUrl: producto.videoUrl || producto.video_url || null,
      videos: Array.isArray(producto.videos) ? producto.videos : (producto.videoUrl ? [producto.videoUrl] : []),
      imagenes360: Array.isArray(producto.imagenes360) ? producto.imagenes360 : (Array.isArray(producto.imagenes_360) ? producto.imagenes_360 : []),
      imagenes: Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes : [producto.imagen || producto.src].filter(Boolean),
      imagen: producto.imagen || producto.src || null,
    };
  }, [producto]);

  const imagenesNormalizadas = useMemo(() => {
    if (!productoActivo) return [];
    let list = [];
    if (Array.isArray(productoActivo.imagenes) && productoActivo.imagenes.length > 0) {
      list = productoActivo.imagenes;
    } else if (productoActivo.imagen) {
      list = [productoActivo.imagen];
    } else {
      list = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'];
    }

    return list.map((img, idx) => ({
      tipo: 'image',
      src: typeof img === 'string' ? img : (img.src || img.thumb || img.url || ''),
      thumb: typeof img === 'string' ? img : (img.thumb || img.src || img.url || ''),
      alt: `${productoActivo.nombre} - Ángulo ${idx + 1}`,
    }));
  }, [productoActivo]);

  // Cuadros para la rotación 360°
  const frames360 = useMemo(() => {
    if (Array.isArray(productoActivo?.imagenes360) && productoActivo.imagenes360.length > 1) {
      return productoActivo.imagenes360.map((src, i) => ({
        src,
        alt: `${productoActivo.nombre} 360° - Cuadro ${i + 1}`,
      }));
    }
    // Si hay 2 o más fotos del producto, se usan como ángulos del giro 360°
    if (imagenesNormalizadas.length > 1) {
      return imagenesNormalizadas;
    }
    return imagenesNormalizadas;
  }, [productoActivo?.imagenes360, imagenesNormalizadas]);

  const grados360 = useMemo(() => {
    if (frames360.length <= 1) return 0;
    return Math.round((indice360 / frames360.length) * 360);
  }, [frames360.length, indice360]);

  // Giro automático 360°
  useEffect(() => {
    if (!autoRotar360 || modoMedia !== '360' || frames360.length <= 1) return undefined;
    const intervalo = setInterval(() => {
      setIndice360((prev) => (prev + 1) % frames360.length);
    }, 240);
    return () => clearInterval(intervalo);
  }, [autoRotar360, modoMedia, frames360.length]);

  // Arrastre con dedo/mouse para rotar 360°
  const onPointerDown360 = (e) => {
    setAutoRotar360(false);
    arrastre360Ref.current = {
      startX: e.clientX,
      startIndice: indice360,
      activo: true,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove360 = (e) => {
    if (!arrastre360Ref.current.activo || frames360.length <= 1) return;
    const deltaX = e.clientX - arrastre360Ref.current.startX;
    const pxPorFrame = 16;
    const paso = Math.floor(deltaX / pxPorFrame);
    const nuevo = (arrastre360Ref.current.startIndice + paso) % frames360.length;
    setIndice360(nuevo < 0 ? nuevo + frames360.length : nuevo);
  };

  const onPointerUp360 = (e) => {
    arrastre360Ref.current.activo = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Video embed o archivo
  const infoVideo = useMemo(() => {
    const url = productoActivo?.videoUrl || productoActivo?.videos?.[0];
    return mediaDeVideo(url);
  }, [productoActivo?.videoUrl, productoActivo?.videos]);

  // Si el producto no tiene video y el visor estaba en video, volver a foto automáticamente
  useEffect(() => {
    if (modoMedia === 'video' && !infoVideo) {
      setModoMedia('foto');
    }
  }, [infoVideo, modoMedia]);

  const especificaciones = useMemo(() => {
    if (!productoActivo) return [];
    const lista = [];
    lista.push({ label: 'Modelo', val: productoActivo.nombre });
    lista.push({ label: 'Categoría', val: productoActivo.categoria });
    if (productoActivo.sku) {
      lista.push({ label: 'Código SKU / Terra', val: productoActivo.sku });
    }
    if (productoActivo.plazas) {
      lista.push({ label: 'Medidas / Tamaño', val: productoActivo.plazas });
    }
    if (productoActivo.firmeza) {
      lista.push({ label: 'Nivel de Firmeza / Confort', val: productoActivo.firmeza });
    }
    lista.push({
      label: 'Disponibilidad en Almacén',
      val: productoActivo.stock > 0 ? `${productoActivo.stock} unidades en stock` : 'A pedido / Consultar',
    });
    lista.push({
      label: 'Garantía Oficial',
      val: 'Garantía oficial TERRA Bolivia',
      isPrimary: true,
    });
    return lista;
  }, [productoActivo]);

  // Carga de productos relacionados reales del backend
  useEffect(() => {
    if (!productoActivo) return;
    const controlador = new AbortController();
    listarProductos({
      signal: controlador.signal,
      categoria: productoActivo.categoria !== 'Catálogo General' ? productoActivo.categoria : '',
      limite: 8,
    })
      .then((res) => {
        const otros = (res?.productos || []).filter((p) => String(p.id) !== String(productoActivo.id));
        setProductosRelacionados(otros.slice(0, 4));
      })
      .catch(() => {});
    return () => controlador.abort();
  }, [productoActivo]);

  if (!productoActivo) {
    return (
      <div className="max-w-[1360px] mx-auto px-margin py-24 text-center">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 block">
          inventory_2
        </span>
        <h2 className="text-[22px] sm:text-[26px] font-bold text-on-surface mb-2">
          No se ha seleccionado ningún producto
        </h2>
        <p className="text-[14px] text-on-surface-variant mb-6 max-w-md mx-auto">
          Explora nuestro catálogo para descubrir colchones, sommiers, sofás y accesorios en tiempo real.
        </p>
        <button
          type="button"
          onClick={() => onNavegar('catalogo')}
          className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          <span>Explorar Catálogo</span>
        </button>
      </div>
    );
  }

  const disponibilidadActual = evaluarDisponibilidadSucursal(productoActivo, sucursalActiva);
  const currentMedia = imagenesNormalizadas[selectedMediaIdx] || imagenesNormalizadas[0];
  const currentMediaSrc = currentMedia?.src || '';
  const currentMediaAlt = currentMedia?.alt || productoActivo.nombre;

  const irFotoAnterior = () => {
    setModoMedia('foto');
    setSelectedMediaIdx((prev) => (prev > 0 ? prev - 1 : imagenesNormalizadas.length - 1));
  };

  const irFotoSiguiente = () => {
    setModoMedia('foto');
    setSelectedMediaIdx((prev) => (prev < imagenesNormalizadas.length - 1 ? prev + 1 : 0));
  };

  const salasAMostrar = SUCURSALES_DATA.map((s) => {
    const disp = evaluarDisponibilidadSucursal(productoActivo, s);
    const esActiva = s.id === sucursalActiva.id;
    return {
      id: s.id,
      sucursalObj: s,
      nombre: s.nombreCompleto || s.nombre,
      disp: disp.textoStock,
      inmediato: disp.inmediato,
      activo: esActiva,
    };
  });

  useEffect(() => {
    if (vozActiva) {
      anunciar(`${productoActivo.nombre}. Precio ${formatBs(productoActivo.precio)}`);
    }
  }, [productoActivo.nombre, productoActivo.precio, vozActiva, anunciar]);

  const handleAgregar = () => {
    setAgregando(true);
    for (let i = 0; i < cantidad; i++) {
      onAgregarAlCarrito({
        id: productoActivo.id,
        nombre: productoActivo.nombre,
        precio: productoActivo.precio,
        imagen: currentMediaSrc,
      });
    }
    setTimeout(() => {
      setAgregando(false);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-surface-container-low/40 pointer-events-none -z-10"></div>
      <div className="absolute top-12 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-96 right-10 w-[450px] h-[450px] bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-[1360px] mx-auto w-full px-margin py-space-lg flex flex-col gap-space-lg">
        {/* ========================================================= */}
        {/* TOP NAVIGATION & BREADCRUMBS                              */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-5 py-2.5 rounded-full font-label-interactive text-label-interactive shadow-[0_4px_14px_-2px_rgba(179,19,41,0.38)] transition-all transform active:scale-95 cursor-pointer"
              onClick={() => onNavegar('catalogo')}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Volver al catálogo</span>
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <button
                type="button"
                className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
                onClick={() => onNavegar('inicio')}
              >
                Inicio
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <button
                type="button"
                className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
                onClick={() => onNavegar('catalogo')}
              >
                Catálogo
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>{productoActivo.categoria}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-title-sm text-on-surface font-semibold">{productoActivo.nombre}</span>
            </nav>
          </div>

          {/* Quick Showroom Status Pill */}
          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-4 py-2 rounded-full shadow-[0_2px_10px_-2px_rgba(30,20,15,0.06)]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                disponibilidadActual.inmediato ? 'bg-tertiary animate-pulse' : 'bg-primary'
              }`}
            ></span>
            <span className="font-label-subtle text-label-subtle text-on-surface-variant">Disponibilidad:</span>
            <span className="font-label-interactive text-label-interactive text-primary font-bold">
              {disponibilidadActual.inmediato ? 'Disponible para retiro inmediato' : 'Disponible con transferencia 24h'}
            </span>
            <button
              type="button"
              className="text-on-surface hover:text-primary transition-colors flex items-center gap-0.5 ml-1 font-label-subtle text-label-subtle underline cursor-pointer"
              onClick={onAbrirSucursales}
            >
              Cambiar sala
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN PRODUCT CARD                                         */}
        {/* ========================================================= */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_-4px_rgba(30,20,15,0.06),0_18px_40px_-6px_rgba(30,20,15,0.05)] overflow-hidden">
          <div className="p-space-lg lg:p-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left: Product Media Gallery */}
            <div className="lg:col-span-6 flex flex-col gap-space-md">
              {/* Selector de modo: Fotos / Video / 360° */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
                  <button
                    type="button"
                    onClick={() => setModoMedia('foto')}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modoMedia === 'foto'
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">photo_library</span>
                    <span>Fotos ({imagenesNormalizadas.length})</span>
                  </button>

                  {Boolean(infoVideo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setModoMedia('video');
                        setAutoRotar360(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        modoMedia === 'video'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">play_circle</span>
                      <span>Video</span>
                    </button>
                  )}

                  {frames360.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setModoMedia('360')}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        modoMedia === '360'
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">360</span>
                      <span>Giro 360°</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-on-surface-variant hidden sm:inline">
                  SKU: {productoActivo.sku}
                </span>
              </div>

              {/* Main Stage */}
              <div className="relative bg-surface-container-low/70 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center group shadow-inner select-none">
                {/* Dynamic Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 items-start pointer-events-none">
                  {productoActivo.enOferta && (
                    <span className="inline-flex items-center gap-1.5 bg-[#b31329] text-white px-3.5 py-1.5 rounded-full font-label-caps text-label-caps text-[12px] font-bold tracking-wide shadow-md">
                      <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                      OFERTA
                    </span>
                  )}
                  {productoActivo.masVendido && (
                    <span className="inline-flex items-center gap-1.5 bg-[#7a0016] text-white px-3.5 py-1.5 rounded-full font-label-caps text-label-caps text-[12px] font-semibold shadow-md">
                      <span className="material-symbols-outlined text-[16px]">award_star</span>
                      Más vendido
                    </span>
                  )}
                </div>

                {/* Botón Zoom Pantalla Completa */}
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-surface-container-lowest/90 text-on-surface hover:text-primary hover:bg-surface-container-lowest shadow-md flex items-center justify-center transition-all cursor-pointer"
                    title="Ver en pantalla completa con zoom"
                    onClick={() => setZoomModalAbierto(true)}
                  >
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </button>
                </div>

                {/* ESCENARIO 1: FOTOS / ÁNGULOS */}
                {modoMedia === 'foto' && (
                  <div className="relative w-full h-full flex items-center justify-center p-6">
                    <img
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                      src={currentMediaSrc}
                      alt={currentMediaAlt}
                    />

                    {/* Navegación anterior / siguiente entre ángulos */}
                    {imagenesNormalizadas.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={irFotoAnterior}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-on-surface hover:text-primary flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100"
                          aria-label="Ver ángulo anterior"
                        >
                          <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                        </button>
                        <button
                          type="button"
                          onClick={irFotoSiguiente}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-on-surface hover:text-primary flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100"
                          aria-label="Ver siguiente ángulo"
                        >
                          <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                        </button>

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-sm text-on-surface font-label-subtle text-[11px] font-bold shadow-sm">
                          Ángulo {selectedMediaIdx + 1} de {imagenesNormalizadas.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ESCENARIO 2: REPRODUCTOR DE VIDEO REAL (solo si tiene video) */}
                {modoMedia === 'video' && infoVideo && (
                  <div className="w-full h-full bg-black flex items-center justify-center animate-fadeIn">
                    {infoVideo.tipo === 'embed' ? (
                      <iframe
                        src={infoVideo.src}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`Video demostrativo de ${productoActivo.nombre}`}
                      />
                    ) : (
                      <video
                        src={infoVideo.src}
                        controls
                        autoPlay
                        playsInline
                        poster={currentMediaSrc}
                        className="w-full h-full object-contain"
                      >
                        <track kind="captions" />
                        Tu navegador no soporta reproducción de video HTML5.
                      </video>
                    )}
                  </div>
                )}

                {/* ESCENARIO 3: VISOR INTERACTIVO 360° */}
                {modoMedia === '360' && (
                  <div
                    className="relative w-full h-full flex flex-col items-center justify-center p-4 cursor-grab active:cursor-grabbing touch-pan-y"
                    onPointerDown={onPointerDown360}
                    onPointerMove={onPointerMove360}
                    onPointerUp={onPointerUp360}
                    onPointerCancel={onPointerUp360}
                  >
                    <img
                      className="max-h-[82%] max-w-full object-contain filter drop-shadow-md pointer-events-none transition-transform duration-75"
                      src={frames360[indice360]?.src || currentMediaSrc}
                      alt={frames360[indice360]?.alt || `${productoActivo.nombre} vista 360`}
                    />

                    {/* Indicador de Grados y Giro */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm shadow-md text-on-surface font-label-subtle text-[12px] font-bold">
                      <span className="material-symbols-outlined text-primary text-[18px] animate-spin">
                        sync
                      </span>
                      <span>Giro 360° · {grados360}°</span>
                    </div>

                    {/* Barra de controles 360 */}
                    <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAutoRotar360((prev) => !prev);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                          autoRotar360
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {autoRotar360 ? 'pause' : 'autorenew'}
                        </span>
                        <span>{autoRotar360 ? 'Pausar' : 'Auto Rotar'}</span>
                      </button>

                      <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-lowest/80 px-2.5 py-1 rounded-full shadow-sm hidden sm:inline">
                        Arrastra con el dedo o mouse para girar
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAutoRotar360(false);
                          setIndice360(0);
                        }}
                        className="px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface text-[12px] font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        title="Volver a vista frontal (0°)"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        <span>0° Frente</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tira de Miniaturas (Ángulos + Video + 360°) */}
              <div className="flex items-center gap-space-sm overflow-x-auto pb-1 no-scrollbar">
                {/* Botón miniatura de cada ángulo disponible */}
                {imagenesNormalizadas.map((img, idx) => {
                  const activa = modoMedia === 'foto' && selectedMediaIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`thumb-btn relative flex-shrink-0 w-20 h-20 rounded-lg p-1 bg-surface-container-low transition-all shadow-sm cursor-pointer ${
                        activa ? 'ring-2 ring-primary scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                      onClick={() => {
                        setModoMedia('foto');
                        setSelectedMediaIdx(idx);
                        setAutoRotar360(false);
                      }}
                    >
                      <img
                        className="w-full h-full object-contain rounded"
                        src={img.thumb || img.src}
                        alt={img.alt}
                      />
                      <span className="absolute bottom-0.5 inset-x-0.5 text-center bg-black/60 text-white text-[9px] font-bold rounded-b py-0.5">
                        Ángulo {idx + 1}
                      </span>
                    </button>
                  );
                })}

                {/* Botón Miniatura: VIDEO (solo si el producto tiene video real) */}
                {Boolean(infoVideo) && (
                  <button
                    type="button"
                    className={`thumb-btn flex-shrink-0 w-22 h-20 rounded-lg p-1.5 bg-inverse-surface text-on-primary flex flex-col items-center justify-center text-center transition-all shadow-sm cursor-pointer ${
                      modoMedia === 'video' ? 'ring-2 ring-primary scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setModoMedia('video');
                      setAutoRotar360(false);
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px] text-primary-fixed mb-0.5">
                      smart_display
                    </span>
                    <span className="font-label-subtle text-[11px] leading-tight text-white font-bold">
                      VIDEO
                    </span>
                    <span className="text-[9px] text-primary-fixed/80">
                      HD Demo
                    </span>
                  </button>
                )}

                {/* Botón Miniatura: GIRO 360° (solo si tiene más de 1 imagen / ángulos) */}
                {frames360.length > 1 && (
                  <button
                    type="button"
                    className={`thumb-btn flex-shrink-0 w-22 h-20 rounded-lg p-1.5 bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      modoMedia === '360' ? 'ring-2 ring-primary scale-105 bg-primary/10' : 'opacity-85 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setModoMedia('360');
                      setAutoRotar360(true);
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px] text-primary mb-0.5 animate-spin">
                      360
                    </span>
                    <span className="font-label-subtle text-[11px] leading-tight text-on-surface font-bold">
                      GIRO 360°
                    </span>
                    <span className="text-[9px] text-tertiary font-semibold">
                      Interactivo
                    </span>
                  </button>
                )}
              </div>

              {/* Guía rápida de interacción táctil */}
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between font-label-subtle text-label-subtle text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">touch_app</span>
                  <span>
                    {modoMedia === '360'
                      ? 'Arrastra horizontalmente para rotar el producto en 360°.'
                      : modoMedia === 'video'
                      ? 'Reproduce la demostración de confort y materiales del producto.'
                      : `Explora los ${imagenesNormalizadas.length} ángulos de alta resolución con las flechas o miniaturas.`}
                  </span>
                </span>
                <span className="text-tertiary font-bold hidden sm:inline">{productoActivo.marca}</span>
              </div>
            </div>

            {/* Right: Purchasing Specs Column */}
            <div className="lg:col-span-6 flex flex-col justify-start">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                  {productoActivo.subtitulo}
                </span>
                <span className="font-label-subtle text-label-subtle text-on-surface-variant bg-surface-container-low px-2.5 py-0.5 rounded-full">
                  Ref: {productoActivo.ref}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                  {productoActivo.nombre}
                </h1>
                <button
                  type="button"
                  onClick={() => hablar(`${productoActivo.nombre}. Precio ${formatBs(productoActivo.precio)}. ${productoActivo.descripcionCorta || ''}`)}
                  className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary hover:text-white text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Escuchar descripción en voz alta"
                  aria-label="Escuchar descripción del producto"
                >
                  <span className="material-symbols-outlined text-[19px]">volume_up</span>
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-space-sm mb-space-md pb-space-sm">
                <div className="flex items-center text-amber-500">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <span className="font-label-subtle text-label-subtle text-on-surface font-semibold">
                  Producto recomendado TERRA
                </span>
                <span className="text-on-surface-variant text-[13px]">·</span>
                <span className="font-body-sm text-body-sm text-primary font-semibold">
                  ({productoActivo.opiniones} opiniones verificadas)
                </span>
              </div>

              {/* Price & Availability Tag */}
              <div className="bg-surface-container-low/60 rounded-xl p-space-md mb-space-md">
                <div className="flex items-baseline gap-space-sm">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                    {formatBs(productoActivo.precio)}
                  </span>
                  {productoActivo.precioOriginal && (
                    <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                      {formatBs(productoActivo.precioOriginal)}
                    </span>
                  )}
                  {productoActivo.descuento && (
                    <span className="bg-primary/10 text-primary font-label-caps text-label-caps px-2 py-0.5 rounded-full font-bold ml-1">
                      {productoActivo.descuento}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 font-label-interactive text-label-interactive text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  <span>Disponible para entrega inmediata y retiro hoy</span>
                </div>
              </div>

              {/* Short Summary */}
              <p className="font-body-md text-body-md text-on-surface-variant mb-2 leading-relaxed">
                {productoActivo.descripcionCorta}
              </p>
              <button
                type="button"
                className="self-start text-primary font-label-interactive text-label-interactive hover:underline flex items-center gap-1 mb-space-lg cursor-pointer"
                onClick={() => {
                  setDescOpen(true);
                  document.getElementById('seccion-descripcion')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Ver descripción completa</span>
              </button>

              {/* Branch Stock Selector Context */}
              <div className="bg-surface-container-low rounded-lg p-space-sm mb-space-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                  <div className="font-body-sm text-body-sm">
                    <span className="text-on-surface font-semibold">Retiro en Santa Cruz:</span>
                    <span className="text-on-surface-variant"> Sucursal {sucursalActiva.nombre} (Inmediato)</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="font-label-subtle text-label-subtle text-primary font-bold hover:underline cursor-pointer"
                  onClick={onAbrirSucursales}
                >
                  Ver las 3 salas
                </button>
              </div>

              {/* Quantity Selector & CTAs */}
              <div className="flex flex-col gap-space-md mb-space-lg">
                <div className="flex items-center gap-space-md">
                  <span className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                    Cantidad:
                  </span>
                  <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1 shadow-inner">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-10 text-center font-title-sm text-title-sm font-bold text-on-surface">
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                      onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <span className="font-label-subtle text-label-subtle text-on-surface-variant">
                    Total: <strong className="text-on-surface">{formatBs(productoActivo.precio * cantidad)}</strong>
                  </span>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  className="w-full h-14 bg-primary text-on-primary hover:bg-primary-container rounded-full font-label-interactive text-label-interactive text-base flex items-center justify-center gap-space-sm shadow-[0_10px_24px_-4px_rgba(179,19,41,0.4)] transition-all transform active:scale-[0.99] cursor-pointer"
                  onClick={handleAgregar}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {agregando ? 'sync' : 'shopping_cart'}
                  </span>
                  <span>{agregando ? `Agregando ${cantidad} unidad(es)...` : 'Agregar al carrito'}</span>
                </button>

                {/* Secondary CTA */}
                <button
                  type="button"
                  className="w-full h-14 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-full font-label-interactive text-label-interactive text-base flex items-center justify-center gap-space-sm shadow-sm transition-colors cursor-pointer"
                  onClick={() => {
                    handleAgregar();
                    onNavegar('carrito');
                  }}
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">shopping_bag_speed</span>
                  <span>Comprar ahora con QR o Tarjeta</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-sm text-on-surface-variant font-body-sm text-body-sm border-t border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                  <span>Garantía oficial TERRA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
                  <span>Envío seguro a Bolivia / SCZ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">barcode</span>
                  <span>SKU: {productoActivo.ref}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                  <span>Retiro gratis en 3 Showrooms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature & Trust Ribbon */}
          <div className="bg-surface-container-low/70 px-space-lg py-space-md grid grid-cols-2 md:grid-cols-4 gap-space-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <div>
                <p className="font-label-interactive text-label-interactive text-on-surface text-[14px]">Confort superior</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Materiales seleccionados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">check</span>
              </div>
              <div>
                <p className="font-label-interactive text-label-interactive text-on-surface text-[14px]">Calidad garantizada</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Respaldo oficial TERRA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <div>
                <p className="font-label-interactive text-label-interactive text-on-surface text-[14px]">Despacho coordinado</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Atención personalizada</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <p className="font-label-interactive text-label-interactive text-on-surface text-[14px]">Compra 100% segura</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Soporte en showroom</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LOWER SECTION 1: COLLAPSIBLE FULL DESCRIPTION             */}
        {/* ========================================================= */}
        <div
          className="bg-surface-container-lowest rounded-xl shadow-[0_4px_16px_-2px_rgba(30,20,15,0.05)] overflow-hidden transition-all"
          id="seccion-descripcion"
        >
          <button
            type="button"
            className="w-full px-space-lg py-4 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors cursor-pointer"
            onClick={() => setDescOpen((o) => !o)}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[22px]">description</span>
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                Descripción completa y beneficios para el descanso
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${
                descOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {descOpen && (
            <div className="px-space-lg pb-space-lg pt-space-sm text-on-surface-variant font-body-md text-body-md space-y-space-md animate-fadeIn">
              <p className="leading-relaxed">{productoActivo.descripcionLarga}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2">
                <div className="bg-surface-container-low p-space-md rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[24px] mb-2">airline_seat_flat</span>
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">Alineación Cervical</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Soporte firme medio que previene la curvatura forzada de vértebras durante largas horas de sueño.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[24px] mb-2">air</span>
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">Tejido Respirable Fresco</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Ideal para el clima cálido de Santa Cruz, evitando la acumulación de sudoración y olores nocturnos.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[24px] mb-2">sanitizer</span>
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">Hipoalergénico 100%</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Fibras vírgenes tratadas que no permiten la anidación de ácaros ni polvo ambiental doméstico.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* LOWER SECTION 2: SPECIFICATIONS & SHOWROOM EXPERIENCES    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          {/* Ficha técnica y dimensiones */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_4px_16px_-2px_rgba(30,20,15,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-space-md">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">Ficha técnica y dimensiones</h2>
              </div>
              <div className="space-y-space-sm font-body-sm text-body-sm">
                {especificaciones.map((esp, i) => (
                  <div
                    key={i}
                    className={`flex justify-between py-2.5 px-3 rounded ${
                      i % 2 === 0 ? 'bg-surface-container-low/50' : ''
                    }`}
                  >
                    <span className="text-on-surface-variant font-medium">{esp.label}</span>
                    <span className={esp.isPrimary ? 'text-primary font-bold' : 'text-on-surface font-semibold'}>
                      {esp.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center gap-2 text-on-surface-variant font-label-subtle text-label-subtle border-t border-surface-container-low">
              <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
              <span>Calidad e inspección técnica verificada en planta TERRA Santa Cruz.</span>
            </div>
          </div>

          {/* Pruébalo en nuestro showroom */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_4px_16px_-2px_rgba(30,20,15,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-space-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold">Pruébalo en nuestro showroom</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Visita cualquiera de nuestros 3 showrooms en Santa Cruz para probar este producto y recibir asesoría
                personalizada inmediata.
              </p>

              {/* Branch Stock Selector Radios */}
              <div className="space-y-2 mb-space-md">
                {salasAMostrar.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                      s.activo ? 'bg-primary/10 ring-2 ring-primary/40 font-semibold' : 'bg-surface-container-low/60 hover:bg-surface-container-low'
                    }`}
                    onClick={() => {
                      if (setSucursalActiva && s.sucursalObj) {
                        setSucursalActiva(s.sucursalObj);
                      }
                    }}
                    title={`Seleccionar ${s.nombre}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          s.activo ? 'bg-primary animate-pulse' : (s.inmediato ? 'bg-tertiary' : 'bg-surface-variant')
                        }`}
                      ></span>
                      <span className="font-label-interactive text-label-interactive text-on-surface text-[13px]">
                        {s.nombre} {s.activo && <span className="text-primary text-[11px] font-bold">(Sala Activa)</span>}
                      </span>
                    </div>
                    <span
                      className={`font-label-subtle text-label-subtle text-[12px] ${
                        s.activo ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                      }`}
                    >
                      {s.disp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                className="flex-1 py-2.5 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full font-label-interactive text-label-interactive text-[13px] flex items-center justify-center gap-1.5 transition-colors"
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">directions</span>
                <span>Cómo llegar (Maps)</span>
              </a>
              <button
                type="button"
                className="flex-1 py-2.5 px-3 bg-primary text-on-primary hover:bg-primary-container rounded-full font-label-interactive text-label-interactive text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                onClick={() => alert(`Prueba agendada en Showroom ${sucursalActiva.nombre}`)}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>Agendar prueba</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LOWER SECTION 3: VIDEO BANNER                             */}
        {/* ========================================================= */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_20px_-2px_rgba(30,20,15,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            {/* Video Mock Frame */}
            <div className="lg:col-span-5 relative rounded-xl overflow-hidden shadow-lg group bg-inverse-surface aspect-video flex items-center justify-center">
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUslHr9V0XoRlKhAKRoXk1E-WQaqeZe0-5i21-5TVfqcp4pY15HhIcfhDoYr-cc-3PtOzzofS-HYhQ0MSESgFThrk_kX8g_7dj0zcMQoQGldg3noI4kjUTPqs6JCbwUq_dC3McFU2AI2h2-099g7dBHS5oqvXIW-8ovfb4kRcx58NyukaY4lYmwDQQ7WktCPWPsUanbQUifPzw0NecdrvzAUWSbIGKDQXqvwT--LBb"
                alt="Showroom de descanso en Santa Cruz"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent"></div>
              <button
                type="button"
                className="relative z-10 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_20px_rgba(179,19,41,0.5)] transform group-hover:scale-110 active:scale-95 transition-all cursor-pointer"
                onClick={() => alert('Reproduciendo guía audiovisual de descanso TERRA')}
              >
                <span className="material-symbols-outlined text-[36px] ml-1">play_arrow</span>
              </button>
              <span className="absolute bottom-3 right-3 z-10 bg-inverse-surface/80 text-white font-label-subtle text-label-subtle px-2 py-0.5 rounded">
                1:45 min · HD
              </span>
            </div>

            {/* Video Description */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 text-primary font-label-caps text-label-caps uppercase mb-2">
                <span className="material-symbols-outlined text-[16px]">ondemand_video</span>
                <span>Guía audiovisual TERRA Descanso</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-2">
                ¿Cómo elegir tu almohada ideal según tu postura al dormir?
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                Nuestros especialistas de Sucursal Central te muestran en este video cómo testear la densidad del relleno de
                fibra siliconada de la CONFORT LYA, la alineación en vivo con colchones de resortes ensacados y consejos de
                mantenimiento para mantener el volumen por años.
              </p>
              <div className="flex flex-wrap items-center gap-space-md">
                <span className="flex items-center gap-1 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                  Prueba de presión cervical
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                  Funda lavable recomendada
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                  Explicación de fibra hueca virgen
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LOWER SECTION 4: RECOMMENDATIONS                          */}
        {/* ========================================================= */}
        {productosRelacionados.length > 0 && (
          <div className="pt-space-md">
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <span className="font-label-caps text-label-caps text-primary uppercase font-bold">
                  Completa tu ambiente TERRA
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  Recomendados para combinar con {productoActivo.nombre}
                </h2>
              </div>
              <button
                type="button"
                className="font-label-interactive text-label-interactive text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                onClick={() => onNavegar('catalogo')}
              >
                <span>Ver catálogo completo</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {productosRelacionados.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_14px_-2px_rgba(30,20,15,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(30,20,15,0.09)] transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => (onVerDetalle ? onVerDetalle(rec) : onNavegar('detalle', 'todas', rec))}
                >
                  <div className="relative bg-surface-container-low rounded-lg aspect-square mb-space-sm overflow-hidden flex items-center justify-center p-4">
                    {rec.enOferta && (
                      <span className="absolute top-2 left-2 bg-primary text-on-primary font-label-subtle text-label-subtle px-2 py-0.5 rounded-full shadow-sm font-bold">
                        Oferta
                      </span>
                    )}
                    <img
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      src={rec.imagen || rec.src}
                      alt={rec.nombre}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="font-label-subtle text-label-subtle text-on-surface-variant">{rec.categoria}</p>
                    <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-1 truncate">{rec.nombre}</h4>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-title-sm text-title-sm text-primary font-bold">{formatBs(rec.precio)}</span>
                      {rec.precioOriginal && (
                        <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                          {formatBs(rec.precioOriginal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface font-label-interactive text-label-interactive rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgregarAlCarrito(rec);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    <span>Agregar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terminal Kiosk Footer Note */}
        <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 pointer-events-auto">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-on-surface font-label-subtle text-label-subtle flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[15px]">touch_app</span>
            <span>Terminal Autoservicio {sucursalActiva.nombre} #04</span>
          </div>
        </div>
      </div>

      {/* Modal Zoom Pantalla Completa */}
      {zoomModalAbierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn select-none"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de producto"
          >
            {/* Barra superior con título y botón cerrar */}
            <div className="absolute top-4 inset-x-6 flex items-center justify-between text-white z-20">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px]">{productoActivo.nombre}</span>
                <span className="text-white/60 text-[13px]">
                  (Ángulo {selectedMediaIdx + 1} de {imagenesNormalizadas.length})
                </span>
              </div>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setZoomModalAbierto(false)}
                aria-label="Cerrar vista ampliada"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Imagen Principal en Zoom */}
            <div className="relative max-w-5xl max-h-[82vh] w-full h-full flex items-center justify-center p-4">
              <img
                src={currentMediaSrc}
                alt={currentMediaAlt}
                className="max-h-full max-w-full object-contain filter drop-shadow-2xl"
              />

              {imagenesNormalizadas.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={irFotoAnterior}
                    className="absolute left-2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Ángulo anterior"
                  >
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={irFotoSiguiente}
                    className="absolute right-2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Siguiente ángulo"
                  >
                    <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            {/* Tira inferior en modal de zoom */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-2 overflow-x-auto pb-1">
              {imagenesNormalizadas.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedMediaIdx(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-black/40 cursor-pointer ${
                    selectedMediaIdx === idx ? 'border-primary scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.thumb || img.src} alt={img.alt} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
