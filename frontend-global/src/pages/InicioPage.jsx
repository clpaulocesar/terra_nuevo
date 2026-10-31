import { useEffect, useState } from 'react';
import { SUCURSALES_DATA, evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';

const HERO_SLIDES = [
  {
    category: 'POLTRONAS',
    title: 'Poltronas y Sofás Cama',
    price: 'Desde Bs. 3.490',
    alt: 'Warm atmospheric Scandinavian style living room in modern apartment Santa Cruz. Centerpiece is a plush cream textured linen sofa bed with throw pillows, warm natural wooden flooring, minimalist side table, warm gentle sunlight and house plants.',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzz3kVEwHh1cdkT05CsRLEW-_ezNmJcMnQKbVHbhn5p683oU3VFOpAtEoCp6iaXXC4sChLYJUILADW7DX8AV-W_sSib-5nsOL69K-JKP0riDq95QDSymRpfVdd7e5JHGozdT5Sd-hraJr4z9WtRPjBwjRJ64DBAWjLsisJSlb2SOJL826YdqKrRR22k3da0mB7LAptOb0LYT46aEEGazw0uxWVpHjwrg1cYvS81ny2',
  },
  {
    category: 'COLCHONES KING',
    title: 'Sommier Terra Rest Pocket',
    price: 'Desde Bs. 4.950',
    alt: 'Luxury King size Terra spring mattress sommier with pillow top and textured headboard in modern bright bedroom with wood finishes and neutral linens in Santa Cruz.',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5-oN1Sf_NHCSlJNA_3vhfRtz6zj7ClIg1i9NkeZIx308IpMmOcHdI4fzgVsPPOLi0WoGZTbEI3uUxljlyKiGsim1Oaeo5xvGbnxoZaS4WPFLFUHEAWOsYUeolIvo5W5EO_hBTEiyGyGJM6x-5lP5Kslm3Hf31k1y7QfXwe7NQEZjZpJdfYhgSczIB0ZWOANkpp1MIdmeiR3iFimsYZf5EkcZUNWsjSswnAwD2es9S',
  },
  {
    category: 'COMEDORES',
    title: 'Juegos de Mesa Roble & Lino',
    price: 'Desde Bs. 5.890',
    alt: 'Modern organic oak wood dining table set with 6 upholstered chairs in warm cream tones inside contemporary architectural dining area with warm hanging pendant lights.',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfWEZ7xkKrat9US47SOfyWxPRrQLfhWKgAjHcS--YQNIWDr1WSfXL4x0CQ2xj-mfSbkbfqONTHwtCBCK2UG9coa3XxuTL8Y2QH3Pr8H8EYZHXqt2lLLiiPLnCMxnc54ope7GlhEUpwg2V36c2m9nDmiB8SYd6DnHXAij7fZKsuzAeDZFovbRZnwuK3dzmvxC1d8ZwyKullORwPPPbdil_4aWNvIobc4uOyAAsbeR-1',
  },
  {
    category: 'RELAX & BERGER',
    title: 'Poltronas Reclinables Ergonómicas',
    price: 'Desde Bs. 2.190',
    alt: 'Terra cozy modern armchair recliner poltrona in textured rust cognac fabric in sunlit stylish reading corner Santa Cruz showroom design.',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVGXgAv_rD6CusyOnm95LUK5WC2kvYQgE5JAD7H5P_HTqBFTIlqKhzOZjoyOJR0Sh_WBKJv4LBYpDQRxZZ5mDrS_muFSdgNdvxy1bFpx3-beH2EJYfWaAp83ItYoHErrNhvgQLp0JUNmqeiyjzesXPP0qCOSMB7YVzUH8pbmo85WTCtY3f-rsenKxtmtw9v25CWSOyF3dA_b-4DOLS7-7NeOAzyN1mz1DrbhRbcCTJ',
  },
];

const CATEGORIAS_FILTRO = [
  { id: 'todos', nombre: 'Todos los Espacios' },
  { id: 'sofas', nombre: 'Poltronas & Sofás' },
  { id: 'dormitorio', nombre: 'Colchones Sommier' },
  { id: 'comedores', nombre: 'Comedores Modernos' },
  { id: 'oficina', nombre: 'Estudio & Home Office' },
];

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
}

export default function InicioPage({
  sucursalActiva,
  setSucursalActiva,
  onNavegar,
  onAgregarAlCarrito,
  onVerDetalle,
  productosDestacados = [],
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setSlideIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);

  const slideActivo = HERO_SLIDES[slideIndex];

  const productosBase = (productosDestacados || []).map((producto) => {
    const textoLimpio = String(producto.descripcion || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)[0] || 'Diseño de confort y alta durabilidad para el hogar.';
    const descripcionCorta =
      textoLimpio.length > 115 ? `${textoLimpio.slice(0, 115).trim()}...` : textoLimpio;

    const disponibilidad = evaluarDisponibilidadSucursal(producto, sucursalActiva);

    return {
      ...producto,
      cat: producto.categoriaKey || producto.cat,
      titulo: producto.nombre || producto.titulo,
      descripcion: descripcionCorta,
      src: producto.imagen || producto.src,
      sublinea: producto.categoria || producto.sublinea,
      rating: producto.calidad ? String(producto.calidad).replace(/[^\d.]/g, '') || '4.9' : (producto.rating || '4.9'),
      stock: disponibilidad.textoStock,
      stockInmediato: disponibilidad.inmediato,
      enOferta: Boolean(producto.enOferta || producto.en_oferta),
      masVendido: Boolean(producto.masVendido || producto.mas_vendido || producto.badge === 'MÁS VENDIDO SCZ'),
      badge: disponibilidad.badge,
      badgeClass: disponibilidad.badgeClass,
      extraBadge: disponibilidad.inmediato ? 'Retiro Hoy' : 'Transferencia 24h',
      extraIcon: disponibilidad.inmediato ? 'check_circle' : 'local_shipping',
    };
  });

  const coincideCategoria = (producto, filtro) => {
    if (!filtro || filtro === 'todos') return true;
    const catLimpia = String(producto.cat || producto.categoriaKey || '').toLowerCase();
    const textoCompleto = `${catLimpia} ${producto.sublinea || ''} ${producto.categoria || ''} ${producto.titulo || producto.nombre || ''}`.toLowerCase();

    if (filtro === 'sofas') {
      return /sofa|poltrona|living|sill|relax|mueble|banco|recamier/i.test(textoCompleto);
    }
    if (filtro === 'dormitorio') {
      return /dormitorio|colch|sommier|cama|almohada|cubrecama|edredon|espaldar|sabana|toalla/i.test(textoCompleto);
    }
    if (filtro === 'comedores') {
      return /comedor|mesa|vajillero|buffet|silla/i.test(textoCompleto);
    }
    if (filtro === 'oficina') {
      return /oficina|escritorio|estudio|librero|estante|repisa|computadora|trabajo/i.test(textoCompleto);
    }
    return catLimpia === filtro;
  };

  const productosFiltrados = productosBase
    .filter((p) => coincideCategoria(p, filtroCategoria))
    .sort((a, b) => (b.stockInmediato ? 1 : 0) - (a.stockInmediato ? 1 : 0))
    .slice(0, 9);

  return (
    <div className="flex flex-col w-full">
      {/* Top Branch Switcher & Live Context Strip */}
      <section className="w-full bg-surface-container-high px-margin py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </div>
            <div>
              <span className="font-label-subtle text-label-subtle text-on-surface-variant block uppercase tracking-wider">
                Sucursal Activa Santa Cruz
              </span>
              <div className="flex items-center gap-2">
                <span className="font-title-sm text-title-sm text-on-surface font-bold">
                  {sucursalActiva.nombre} ({sucursalActiva.direccionCorta})
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Stock en Tiempo Real
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="font-label-subtle text-label-subtle text-on-surface-variant mr-1">Cambiar showroom:</span>
            {SUCURSALES_DATA.map((s) => {
              const esActiva = s.id === sucursalActiva.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`branch-btn px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                    esActiva
                      ? 'bg-inverse-surface text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                  onClick={() => setSucursalActiva(s)}
                >
                  {s.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section
        id="terra-hero"
        className="w-full relative overflow-hidden px-margin py-space-xl lg:py-space-2xl bg-gradient-to-b from-surface via-surface-container-low to-surface"
      >
        {/* Atmospheric lighting blurs matching showroom ambience */}
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-tertiary-fixed-dim/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-5 flex flex-col items-start z-10">
            {/* Standard Terra Copy */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-sm mb-6">
              <span className="material-symbols-outlined text-primary text-[16px]">chair</span>
              <span className="font-label-caps text-label-caps tracking-widest text-on-surface-variant font-bold">
                MUEBLES PARA CADA ESPACIO
              </span>
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface font-extrabold tracking-tight leading-none mb-6">
              Bienvenido a <br />
              <span className="text-primary font-black tracking-normal">TERRA</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              Tu hogar merece lo mejor. Encuentra los muebles ideales para cada espacio, con la calidad, confort y disponibilidad
              inmediata en toda nuestra red de Santa Cruz.
            </p>

            {/* Action Buttons Matching Reference */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                className="group inline-flex items-center justify-between gap-4 bg-primary text-on-primary hover:bg-primary-container px-8 py-4 rounded-full font-label-interactive text-label-interactive shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => onNavegar('catalogo')}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-lowest/20">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                </span>
                <div className="text-left">
                  <span className="block font-bold text-[16px]">Comenzar compra</span>
                  <span className="block text-[12px] opacity-90 font-normal">Ver catálogo autoservicio</span>
                </div>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface px-6 py-4 rounded-full font-label-interactive text-label-interactive shadow-sm transition-all cursor-pointer"
                onClick={() => document.getElementById('sucursales-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                <span>Ver 5 Salas SCZ</span>
              </button>
            </div>

            {/* Live Showroom Assistant status */}
            <div className="mt-8 flex items-center gap-3 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-sm">
              <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Kiosco interactivo activo en <strong className="text-on-surface">{sucursalActiva.nombre}</strong> · Escanea y sincroniza con tu móvil
              </span>
            </div>
          </div>

          {/* Right Interactive Showcase Card */}
          <div className="lg:col-span-7 relative z-10">
            <div className="relative bg-surface-container-lowest rounded-3xl p-4 sm:p-6 shadow-xl transition-all">
              <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] lg:aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container">
                <img
                  key={slideActivo.src}
                  className="w-full h-full object-cover transition-opacity duration-500 animate-fadeIn"
                  src={slideActivo.src}
                  alt={slideActivo.alt}
                />
                <button
                  type="button"
                  aria-label="Anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container-lowest shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  onClick={prevSlide}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface hover:bg-surface-container-lowest shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  onClick={nextSlide}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>

                {/* Floating Sub-Overlay Tag Pill */}
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl shadow-lg sm:max-w-xs transition-all hover:bg-surface-container-lowest">
                  <div className="flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant font-bold text-[10px] uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">chair</span>
                    <span>{slideActivo.category}</span>
                  </div>
                  <h2 className="font-title-sm text-title-sm text-on-surface font-bold leading-tight mb-2">
                    {slideActivo.title}
                  </h2>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-body-sm text-body-sm text-primary font-bold">{slideActivo.price}</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-label-interactive text-label-interactive text-on-surface hover:text-primary transition-colors text-[13px] cursor-pointer"
                      onClick={() => onNavegar('catalogo')}
                    >
                      <span>Probar aquí</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Slide Pagination Dots */}
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5">
                  {HERO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      className={`transition-all cursor-pointer ${
                        i === slideIndex
                          ? 'w-6 h-2 rounded-full bg-primary'
                          : 'w-2 h-2 rounded-full bg-surface-container-highest/80'
                      }`}
                      onClick={() => setSlideIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Value Proposition Strip */}
      <section className="w-full px-margin -mt-6 z-20">
        <div className="max-w-6xl mx-auto bg-surface-container-lowest rounded-2xl shadow-lg p-3 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-0">
          <div className="flex items-center justify-center gap-3.5 py-3 px-4 md:border-r-0 hover:bg-surface-container-low rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
            <div>
              <span className="font-title-sm text-title-sm text-on-surface font-bold block leading-snug">Pedido en Línea</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block">Retiro en showroom o flete 24h</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3.5 py-3 px-4 hover:bg-surface-container-low rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <span className="font-title-sm text-title-sm text-on-surface font-bold block leading-snug">Garantía oficial de Terra</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block">Hasta 10 años en resortes y maderas</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3.5 py-3 px-4 hover:bg-surface-container-low rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">credit_card</span>
            </div>
            <div>
              <span className="font-title-sm text-title-sm text-on-surface font-bold block leading-snug">Pago seguro en caja</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant block">QR Simple, tarjeta o financiamiento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Santa Cruz Multi-Branch Hub */}
      <section className="w-full px-margin py-space-xl" id="sucursales-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-label-caps text-label-caps tracking-widest text-primary font-bold uppercase block mb-1">
                RED METROPOLITANA SANTA CRUZ
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                Nuestras 5 Salas &amp; Puntos de Retiro
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Verifica existencias en vivo, programa retiro sin costo o solicita asesoría personalizada en el salón.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="font-body-sm text-body-sm text-on-surface font-semibold">Todas las salas con autoservicio táctil</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUCURSALES_DATA.map((s) => {
              const esActiva = s.id === sucursalActiva.id;
              return (
                <div
                  key={s.id}
                  className={`bg-surface-container-lowest rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                    esActiva ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full font-label-subtle text-label-subtle font-bold ${s.tagClass}`}>
                        {s.tag}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] font-bold text-tertiary">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Abierto Ahora
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-title-sm text-title-sm text-on-surface font-bold">{s.nombreCompleto}</h3>
                      {s.googleMapsUrl && (
                        <a
                          href={s.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-primary hover:underline font-semibold flex items-center gap-0.5 shrink-0"
                          title="Ver en Google Maps"
                        >
                          <span>Mapa</span>
                          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{s.subtitulo}</p>
                    <div className="space-y-2 mb-4 bg-surface-container-low p-3 rounded-xl font-body-sm text-body-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Horario:</span>
                        <span className="font-semibold text-on-surface text-[12px]">{s.horario}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Inventario:</span>
                        <span className="font-semibold text-primary">{s.stock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Terminales:</span>
                        <span className="font-semibold text-on-surface">{s.terminales}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-label-interactive text-label-interactive transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      esActiva
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container hover:bg-primary hover:text-on-primary'
                    }`}
                    onClick={() => setSucursalActiva(s)}
                  >
                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                    <span>{esActiva ? 'Sucursal seleccionada' : 'Seleccionar esta sucursal'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Furniture Collections */}
      <section className="w-full px-margin py- space-xl bg-surface-container-low" id="catalogo-preview">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <span className="font-label-caps text-label-caps tracking-widest text-primary font-bold uppercase block mb-1">
                COLECCIÓN SHOWROOM 2025
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight">
                Mobiliario de Confort Superior
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Explora productos listos para retiro inmediato en Santa Cruz o despacho garantizado.
              </p>
            </div>

            {/* Filter Pill Chips */}
            <div className="flex items-center flex-wrap gap-2">
              {CATEGORIAS_FILTRO.map((c) => {
                const activa = c.id === filtroCategoria;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`category-chip px-4 py-2 rounded-full font-label-interactive text-label-interactive transition-all cursor-pointer ${
                      activa
                        ? 'bg-inverse-surface text-on-primary shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                    }`}
                    onClick={() => setFiltroCategoria(c.id)}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Branch Stock Indicator Banner */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-6 p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[13px] text-on-surface font-medium">
                Inventario sincronizado con: <strong className="text-primary font-bold">{sucursalActiva.nombreCompleto || sucursalActiva.nombre}</strong>
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-semibold bg-surface-container px-3 py-1 rounded-full">
              Actualización automática de disponibilidad
            </span>
          </div>

          {/* Products Grid */}
          {productosFiltrados.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">inventory_2</span>
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold mb-2">
                No encontramos productos en esta categoría
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
                Puedes explorar todos los espacios o revisar el catálogo general completo de Terra.
              </p>
              <button
                type="button"
                className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-interactive text-label-interactive font-semibold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                onClick={() => setFiltroCategoria('todos')}
              >
                Ver Todos los Espacios
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {productosFiltrados.map((prod) => (
                <div
                  key={prod.id}
                  className="product-item bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div
                    className="relative w-full aspect-[4/3] bg-surface-container overflow-hidden cursor-pointer"
                    onClick={() => onVerDetalle && onVerDetalle(prod)}
                    title="Ver detalle del producto"
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={prod.src}
                      alt={prod.titulo}
                      loading="lazy"
                    />
                    {/* Badges superiores (OFERTA y Más vendido apilados idénticos a la foto de referencia) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none items-start">
                      {prod.enOferta && (
                        <span className="inline-flex items-center gap-1.5 bg-[#b31329] text-white px-3 py-1 rounded-full font-label-caps text-label-caps text-[11px] font-bold tracking-wide shadow-md">
                          <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
                          OFERTA
                        </span>
                      )}
                      {prod.masVendido && (
                        <span className="inline-flex items-center gap-1.5 bg-[#7a0016] text-white px-3 py-1 rounded-full font-label-caps text-label-caps text-[11px] font-semibold shadow-md">
                          <span className="material-symbols-outlined text-[15px]">award_star</span>
                          Más vendido
                        </span>
                      )}
                    </div>
                    {prod.extraBadge && (
                      <div className="absolute bottom-3 left-3 bg-inverse-surface/80 backdrop-blur-sm text-on-primary px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">{prod.extraIcon || 'view_in_ar'}</span>{' '}
                        {prod.extraBadge}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[12px] text-on-surface-variant mb-1 font-label-subtle text-label-subtle">
                        <span>{prod.sublinea}</span>
                        <span className="text-tertiary font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">star</span> {prod.rating}
                        </span>
                      </div>
                      <h3
                        className="font-title-sm text-title-sm text-on-surface font-bold mb-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onVerDetalle && onVerDetalle(prod)}
                      >
                        {prod.titulo}
                      </h3>
                      <p
                        className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2 leading-relaxed h-10 overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={prod.descripcion}
                      >
                        {prod.descripcion}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-surface-container-low">
                      <div>
                        <span className="font-label-subtle text-label-subtle text-on-surface-variant block">Precio Autoservicio</span>
                        <span className="font-headline-md text-headline-md text-primary font-black">{formatBs(prod.precio)}</span>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-full font-label-interactive text-label-interactive shadow-md transition-all cursor-pointer"
                        onClick={() => onAgregarAlCarrito(prod)}
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-interactive text-label-interactive font-bold hover:bg-primary-container shadow-md transition-all cursor-pointer"
              onClick={() => onNavegar('catalogo')}
            >
              <span>Ver Catálogo Completo (9.912 productos)</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Terminal Footnote matching Reference */}
      <div className="w-full text-center py-4 bg-surface-container text-on-surface-variant font-label-subtle text-label-subtle">
        <p>TERRA AUTOSERVICIO · {sucursalActiva.nombre}, Santa Cruz de la Sierra</p>
        <p className="text-[11px] opacity-80 mt-0.5">Terminal táctil optimizado para celular, tablet, kiosco físico y PC</p>
      </div>
    </div>
  );
}
