import { useEffect, useState } from 'react';
import { SUCURSALES_DATA, evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';
import { useTemporada } from '../context/TemporadaContext.jsx';

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
  const { esHalloween, esNavidad, anioActual, cuentaRegresiva } = useTemporada();
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
        {/* Halloween Atmosphere Sky */}
        {esHalloween && (
          <div className="hal-hero-sky" aria-hidden="true" style={{ display: 'block', pointerEvents: 'none', zIndex: 0 }}>
            <div className="hal-stars" />
            <div className="hal-hero-moon" />
            <div
              className="hal-hero-landscape"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '42%',
                height: '170px',
                opacity: 0.28,
              }}
            >
              <svg viewBox="0 0 1000 270" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#090811"
                  d="M0 225l90-28 42 12 26-43 33 12 42-34 65 25 48-28 30 20 40-12 38 14 22-42 32 11 24-78 20 13 22-13 24 81 35-18 27 23 60-33 36 22 35-15 46 30 30-20 20 25 48-28 37 20 60-25v150H0z"
                />
                <path
                  fill="#100918"
                  d="M450 230V106h35V65l-15-14 34-34 31 34-14 14v41h34v124M568 230V133h35V76l-13-12 26-26 27 26-14 12v57h35v97"
                />
                <path fill="#e2854d" opacity="0.7" d="M495 147h13v28h-13zM607 159h14v24h-14z" />
              </svg>
            </div>
            <div className="hal-hero-fog" />
          </div>
        )}

        {/* Christmas Atmosphere Sky */}
        {esNavidad && (
          <div className="xmas-hero-sky" aria-hidden="true" style={{ display: 'block', pointerEvents: 'none', zIndex: 0 }}>
            <div className="xmas-hero-ring" />
            <div className="xmas-hero-star">✦</div>
            <div className="xmas-hero-tree" style={{ pointerEvents: 'none', opacity: 0.38 }}>
              <svg viewBox="0 0 700 330" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 330v-60q90-40 180 0 40 25 75 0 80-35 160 8 150-45 285 0v52z" fill="#041f23" />
                <path d="M140 300l65-98-27 0 52-72-23 0 58-77 57 77-24 0 53 72-28 0 64 98z" fill="#092d27" />
                <path d="M365 308l52-75-20 0 43-64-19 0 48-61 48 61-20 0 44 64-20 0 52 75z" fill="#0b352c" />
                <path d="M276 265V323M469 272V328" stroke="#70523c" strokeWidth="14" />
                <path
                  d="M217 234q50 24 100 0M201 206q66 28 130 0M427 239q43 20 80 0"
                  stroke="#d6b36b"
                  strokeWidth="3"
                  opacity="0.6"
                  fill="none"
                />
                <circle cx="265" cy="154" r="5" fill="#f4d49f" />
                <circle cx="477" cy="199" r="5" fill="#d14a53" />
                <circle cx="225" cy="248" r="5" fill="#d14a53" />
              </svg>
            </div>
          </div>
        )}

        {/* Atmospheric lighting blurs matching showroom ambience */}
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-tertiary-fixed-dim/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Copy Column */}
          <div className="lg:col-span-5 flex flex-col items-start z-10">
            {/* Christmas Copy Block */}
            {esNavidad && (
              <div className="w-full">
                <div className="xmas-season-tag inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-bold tracking-wider uppercase mb-4 shadow-sm backdrop-blur-sm">
                  <i className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> NAVIDAD EN TERRA · {anioActual}
                </div>
                <h1 className="xmas-season-title text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                  Esta Navidad, <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-emerald-300">tu hogar brilla más.</span>
                </h1>
                <p className="xmas-season-description text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-lg mb-6">
                  Que cada rincón invite a compartir. Descubre muebles para reunir a quienes más quieres y crear momentos inolvidables.
                </p>
                <div className="xmas-countdown-wrap p-4 rounded-2xl bg-black/40 border border-emerald-500/25 backdrop-blur-md shadow-xl mb-6 max-w-md" role="status" aria-live="off">
                  <div className="xmas-countdown-heading text-[11px] font-extrabold uppercase tracking-widest text-amber-200/90 mb-3">La magia de Navidad llega en</div>
                  {!cuentaRegresiva.finalizado ? (
                    <div className="xmas-time-grid flex items-center justify-start gap-2 sm:gap-3">
                      <div className="xmas-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="xmas-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.dd}</span>
                        <span className="xmas-time-label text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 mt-1">Días</span>
                      </div>
                      <span className="xmas-time-sep text-xl font-bold text-amber-400 -mt-3 select-none">:</span>
                      <div className="xmas-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="xmas-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.hh}</span>
                        <span className="xmas-time-label text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 mt-1">Horas</span>
                      </div>
                      <span className="xmas-time-sep text-xl font-bold text-amber-400 -mt-3 select-none">:</span>
                      <div className="xmas-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="xmas-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.mm}</span>
                        <span className="xmas-time-label text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 mt-1">Min</span>
                      </div>
                      <span className="xmas-time-sep text-xl font-bold text-amber-400 -mt-3 select-none">:</span>
                      <div className="xmas-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="xmas-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.ss}</span>
                        <span className="xmas-time-label text-[10px] font-bold uppercase tracking-wider text-emerald-200/70 mt-1">Seg</span>
                      </div>
                    </div>
                  ) : (
                    <p className="xmas-countdown-ended text-sm font-bold text-amber-300">¡Felices fiestas! Que la alegría llene tu hogar.</p>
                  )}
                </div>
              </div>
            )}

            {/* Halloween Copy Block */}
            {esHalloween && (
              <div className="w-full">
                <div className="hal-season-tag inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs font-bold tracking-wider uppercase mb-4 shadow-sm backdrop-blur-sm">
                  <span className="hal-dot w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> TEMPORADA DE HALLOWEEN · TERRA {anioActual}
                </div>
                <h1 className="hal-season-title text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                  Este Halloween, <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400">tu hogar se transforma.</span>
                </h1>
                <p className="hal-season-description text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-lg mb-6">
                  Una atmósfera diferente, diseños que enamoran y la magia de octubre en cada espacio. Descubre nuestro universo TERRA.
                </p>
                <div className="hal-countdown-wrap p-4 rounded-2xl bg-black/40 border border-orange-500/25 backdrop-blur-md shadow-xl mb-6 max-w-md" role="status" aria-live="off">
                  <div className="hal-countdown-heading text-[11px] font-extrabold uppercase tracking-widest text-orange-300/90 mb-3">La noche de Halloween llega en</div>
                  {!cuentaRegresiva.finalizado ? (
                    <div className="hal-time-grid flex items-center justify-start gap-2 sm:gap-3">
                      <div className="hal-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="hal-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.dd}</span>
                        <span className="hal-time-label text-[10px] font-bold uppercase tracking-wider text-orange-200/70 mt-1">Días</span>
                      </div>
                      <span className="hal-time-sep text-xl font-bold text-orange-400 -mt-3 select-none">:</span>
                      <div className="hal-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="hal-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.hh}</span>
                        <span className="hal-time-label text-[10px] font-bold uppercase tracking-wider text-orange-200/70 mt-1">Horas</span>
                      </div>
                      <span className="hal-time-sep text-xl font-bold text-orange-400 -mt-3 select-none">:</span>
                      <div className="hal-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="hal-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.mm}</span>
                        <span className="hal-time-label text-[10px] font-bold uppercase tracking-wider text-orange-200/70 mt-1">Min</span>
                      </div>
                      <span className="hal-time-sep text-xl font-bold text-orange-400 -mt-3 select-none">:</span>
                      <div className="hal-time-group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-2 px-1 bg-white/5 border border-white/10 rounded-xl">
                        <span className="hal-time-number text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{cuentaRegresiva.ss}</span>
                        <span className="hal-time-label text-[10px] font-bold uppercase tracking-wider text-orange-200/70 mt-1">Seg</span>
                      </div>
                    </div>
                  ) : (
                    <p className="hal-countdown-ended text-sm font-bold text-orange-300">¡Feliz Halloween! La celebración ya comenzó.</p>
                  )}
                </div>
              </div>
            )}

            {/* Standard Terra Copy (Only when Normal Mode) */}
            {!esHalloween && !esNavidad && (
              <>
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
              </>
            )}

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
            {esNavidad && (
              <div className="xmas-sticker" aria-hidden="true">
                🎁
              </div>
            )}
            {esHalloween && (
              <div
                className="hal-feature-sticker"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '2%',
                  top: '4%',
                  width: '76px',
                  height: '76px',
                  pointerEvents: 'none',
                  zIndex: 20,
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
                }}
              >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="pumpkinFill" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#ffb04b" />
                      <stop offset=".55" stopColor="#eb701a" />
                      <stop offset="1" stopColor="#a83b12" />
                    </linearGradient>
                  </defs>
                  <path d="M45 23c-5-9-2-18 7-21l5 6c-8 4-8 10-7 16" fill="#436b31" />
                  <path
                    d="M49 27C26 7 9 26 11 55c2 29 28 44 39 36 17 10 38-10 39-35C91 27 73 10 49 27Z"
                    fill="url(#pumpkinFill)"
                    stroke="#8a3215"
                    strokeWidth="2"
                  />
                  <path
                    d="M50 26c-19 0-22 12-22 35 0 18 7 28 22 30M50 26c19 0 22 12 22 35 0 18-7 28-22 30"
                    fill="none"
                    stroke="#a74717"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                  <path d="M27 53l12-15 7 18zM73 53L61 38l-7 18zM49 59l-6 8h13zM28 69q22 13 44 0l-6 11-8-6-8 6-9-6-7 6z" fill="#1a0c1c" />
                  <path d="M27 53l12-15 7 18zM73 53L61 38l-7 18z" fill="#ffd38c" opacity="0.5" />
                </svg>
              </div>
            )}

            <div className="relative bg-surface-container-lowest rounded-3xl p-4 sm:p-6 shadow-xl transition-all">
              <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] lg:aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container">
                <img
                  key={slideActivo.src}
                  className="w-full h-full object-cover transition-opacity duration-500 animate-fadeIn"
                  src={slideActivo.src}
                  alt={slideActivo.alt}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo-terra.png"; }}
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
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo-terra.png"; }}
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
    </div>
  );
}
