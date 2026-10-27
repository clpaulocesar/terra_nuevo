import { useState, useEffect } from 'react';
import { SUCURSALES_DATA, evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';
import { useVoz } from '../context/VozContext.jsx';

const PRODUCTO_DETALLE_DEFAULT = {
  id: 1,
  nombre: 'CONFORT LYA',
  subtitulo: 'Línea Descanso & Almohadas TERRA',
  ref: 'ALMO00094',
  sku: 'TER-SCZ-LYA',
  precio: 20,
  precioOriginal: 32,
  descuento: '-37% AUTOSERVICIO',
  enOferta: true,
  masVendido: true,
  calificacion: '5.0',
  opiniones: 128,
  descripcionCorta:
    'Confort LYA, diseñada para brindar firmeza, comodidad y ayudar a mantener el cuello alineado durante el descanso. Características: Suave y confortable. Diseño de soporte ergonómico para el cuello. Relleno de fibra 100% siliconada virgen hipoalergénica...',
  descripcionLarga:
    'La almohada CONFORT LYA ha sido diseñada bajo estrictos estándares ergonómicos para maximizar el descanso reparador en hogares cruceños. Gracias a su microfibra siliconada virgen con tratamiento antialérgico y antiácaros, esta pieza disipa eficazmente la acumulación térmica y brinda una sustentación precisa en la zona cervical, impidiendo contracturas matutinas y manteniendo alineada la columna sin importar si duermes de costado o de espaldas.',
  imagenes: [
    {
      tipo: 'image',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXiQ6yJlZs-IOwGE_72hPGxPY0DnPCClt7MU6FGu_wr2-pWGHAvCWKDyPQTUY5x9Z25hLTVPGYFXky0CFOCFblQDkIr0RhxJHHJLn161WIPmmXSkiPKdt6BjVM-i1ooQkW4VQPkviYt8A70UtYhm9jyDpEqbOqrdCPAbNV3JtGstGKVxDcwn6Y79evf_sxrSTF5O_ag1VNmSB7njRBpggeRPFnEvhSPydr4G__HTtY',
      thumb:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCRzWDN1rPWAAcwRmolQanYrNIfnvbFu3zGDOaKSADTpSE2qWvDzUfsxZNKpuTqqFu2UkSVaKagz6vFjA2Rll2w6AB0sD71yoYb9ZPhilzp_ctI_0-fZYN1uIM2fbw0gI8tDSAnAUO9c8-I46-Pt434yfpB0qBNCevwL8WY6S5q-Q6wlylVdk3qiF4NmSqUIAlLF9xc7FoptDBE9gIyH06-sIg0z-lwrDPMHMtuaRFS',
      alt: 'Vista frontal empaque CONFORT LYA TERRA',
    },
    {
      tipo: 'image',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKGpqvD2WT55SSrIVzvdUhx1GXlDWHnBCaPnYktnstcw_UU9oM29vUxPNZg8iPDCwPAGztpGph6RTZbCBY70ZuUZH8mnA9GscYy1Am8_OcnfiGCJbonz2VOcjz4O7fdSqvaOVseMEPs2ROPLqtqcoh_bJA1sJD8EBjCoXfQhbix_Z_hSLbBX_LlbGk83sjtELEjK7YmdJU_NKELoLqx5PZURdFHINqGVBRcLWhL3tb',
      thumb:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCKGpqvD2WT55SSrIVzvdUhx1GXlDWHnBCaPnYktnstcw_UU9oM29vUxPNZg8iPDCwPAGztpGph6RTZbCBY70ZuUZH8mnA9GscYy1Am8_OcnfiGCJbonz2VOcjz4O7fdSqvaOVseMEPs2ROPLqtqcoh_bJA1sJD8EBjCoXfQhbix_Z_hSLbBX_LlbGk83sjtELEjK7YmdJU_NKELoLqx5PZURdFHINqGVBRcLWhL3tb',
      alt: 'Perfil y espesor de la almohada CONFORT LYA',
    },
    {
      tipo: 'image',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8gjkUu2ned0TgG3NCGvS0V7SaL3_k-9UB7gE5arvSX0-Gfb2_6J5DBU4WxiyuZdZTYjyzIAdhUmQw6bwgqB7pI-1n8B3m51bhldGSMXxG1eJRY2xo6XPVuuz4Bij1vD3T7JDOW1Xw47hMdM-2ca54xP2kqCWVltwuqnGqzWo0RHl0AjM-75eJ70NKcZccKzXGUz79ofCWzWyEBpPYVhiTd_WpMfz6cnK5iHBelctG',
      thumb:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB8gjkUu2ned0TgG3NCGvS0V7SaL3_k-9UB7gE5arvSX0-Gfb2_6J5DBU4WxiyuZdZTYjyzIAdhUmQw6bwgqB7pI-1n8B3m51bhldGSMXxG1eJRY2xo6XPVuuz4Bij1vD3T7JDOW1Xw47hMdM-2ca54xP2kqCWVltwuqnGqzWo0RHl0AjM-75eJ70NKcZccKzXGUz79ofCWzWyEBpPYVhiTd_WpMfz6cnK5iHBelctG',
      alt: 'Detalle de etiqueta y composición técnica',
    },
  ],
  especificaciones: [
    { label: 'Modelo', val: 'CONFORT LYA (Línea PARE)' },
    { label: 'Categoría', val: 'Almohada ergonómica hipoalergénica' },
    { label: 'Medidas Estándar', val: '50 cm x 70 cm' },
    { label: 'Nivel de Firmeza', val: 'Intermedia Firme (Resorteo Rápido)' },
    { label: 'Relleno Interior', val: '100% Fibra Siliconada Virgen Movelpro' },
    { label: 'Funda Exterior', val: 'Microfibra poliéster con acabado suave al tacto' },
    { label: 'Garantía TERRA', val: '1 Año contra pérdida de volumen', isPrimary: true },
  ],
  stockSalas: [
    { nombre: 'Sucursal Central (Barrio Lindo)', disp: '18 disp. (Pruébalo hoy)', activo: true },
    { nombre: 'Sucursal Norte (SEARPI)', disp: '12 disp.', activo: false },
    { nombre: 'Sucursal Sur (Radial 10)', disp: '8 disp.', activo: false },
  ],
};

const RECOMENDADOS = [
  {
    id: 201,
    nombre: 'Protector Almohada Impermeable',
    categoria: 'Fundas & Protectores',
    precio: 45,
    precioOriginal: 60,
    tag: 'Impermeable',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFSUCuNUxzdxNVf5KuEQYcS2Eechgux8DiYIolor3p4HxLwDkTD3K6Q7bDLeQz43VIfdSz5Ac9xRm3gwti6_aNk-nFgVho5OIFnuirYsXgUAX-XhEcsJqHdJxy84bGnC2JxtMFX6HzB7WNl9JPggBSLrc_AO1DWk3_7iJxt2uSRI-NdOBNohBerpfQbPFVPdEljuQpIzxdoSHCvWfoDXHzdrmM3wo9AsybrTa8SM0v',
  },
  {
    id: 202,
    nombre: 'Almohada PARE Fibra Color',
    categoria: 'Línea Confort',
    precio: 25,
    tag: 'Top Ventas',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN9A5nGqrYFyCtP6bQwkzt14FnGlPhYCf5WpxIDL2-ozyZi47DaJhrAg8hoy6z3YyTPmlKiX0mvXhKyUBcpjVi7I8_Gz3wVJfEEJ6GD9hoh3pM1FrEBtdFvSAdcL2xTbHW7Nn0DH93QOroPVJ_x5sY9YJGarkdMDWQsghMf6AuIOb68iyFQAdLqmp6yCGupw4UMEoK1eXCuqShtLfQCJHzrkyWUmiI0rx2Z7sLlKY0',
  },
  {
    id: 203,
    nombre: 'Colchón 2 Plazas Bio-Gel Fresh',
    categoria: 'Colchones Premium',
    precio: 1890,
    tag: '1 Año Garantía',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiNjtIt58ow2XJ_lhdGor84_upBEh1LLGT9E6HLBwptD3IIVd6ykzJR28UUpTzpnv-CIbLXQzIatARXhFzGu1Xlwd8oVi_r1dRvoyKGAC0NhyVCTtEQ8KcQqlW15Eu37S8NXPdvmOMuL3McibnFxo4e2D98W3VdpBil_dkGKlNa5aoyB1dm9TTP7u4J-fJrITObQW7_rbTALn1JZK9I1OHty_mMC_hczqGIkuIkdS4',
  },
  {
    id: 204,
    nombre: 'Pack 2x Almohadas CONFORT LYA',
    categoria: 'Pack Dúo Matrimonial',
    precio: 36,
    precioOriginal: 40,
    tag: 'Pack Ahorro',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYqOsrCqQLGYgp4gYj82NJ0AWsgG50uXOue9HcIWAtx_9yqlHDV3a6FmlAP_bBQpDgd9rPVxHLirVZJ69m3mOJA2305LmuZBNZdL3gPkadeomn31gwJRelZ-DW2fkvLyM9R3M6X4FdblxMMz90L23aBLH8Xkkisk5mGgyq54l8p6wpy7CMrONeqDc6SJqY82HcUAOkc7ul2Yt98yXUlZcVZcKpv02IfUp228ylpZVw',
  },
];

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
}

export default function DetalleProductoPage({
  producto = PRODUCTO_DETALLE_DEFAULT,
  sucursalActiva,
  setSucursalActiva,
  onNavegar,
  onAgregarAlCarrito,
  onAbrirSucursales,
}) {
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [showVideoStage, setShowVideoStage] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const { vozActiva, hablar, anunciar } = useVoz();

  const productoActivo = {
    ...PRODUCTO_DETALLE_DEFAULT,
    ...producto,
    nombre: producto.nombre || producto.titulo || PRODUCTO_DETALLE_DEFAULT.nombre,
    precio: producto.precio || PRODUCTO_DETALLE_DEFAULT.precio,
    descripcionCorta: producto.descripcion || producto.descripcionCorta || PRODUCTO_DETALLE_DEFAULT.descripcionCorta,
    descripcionLarga: producto.descripcion || producto.descripcionLarga || PRODUCTO_DETALLE_DEFAULT.descripcionLarga,
  };

  const disponibilidadActual = evaluarDisponibilidadSucursal(productoActivo, sucursalActiva);

  const currentMedia = productoActivo.imagenes?.[selectedMediaIdx] || productoActivo.imagen || PRODUCTO_DETALLE_DEFAULT.imagenes[0];
  const currentMediaSrc = typeof currentMedia === 'string' ? currentMedia : (currentMedia?.src || productoActivo.imagen || productoActivo.src);
  const currentMediaAlt = typeof currentMedia === 'object' ? (currentMedia?.alt || productoActivo.nombre) : productoActivo.nombre;

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
              <span>Almohadas &amp; Descanso</span>
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
              <div className="relative bg-surface-container-low/70 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center group shadow-inner">
                {/* Dynamic Badges idénticos a la referencia */}
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

                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-surface-container-lowest/90 text-on-surface hover:text-primary hover:bg-surface-container-lowest shadow-md flex items-center justify-center transition-all cursor-pointer"
                    title="Ver en pantalla completa"
                    onClick={() => alert('Vista ampliada en alta resolución')}
                  >
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </button>
                </div>

                {/* Media Container 1: Image Stage */}
                {!showVideoStage ? (
                  <div className="w-full h-full flex items-center justify-center p-6 transition-all duration-300">
                    <img
                      className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                      src={currentMediaSrc}
                      alt={currentMediaAlt}
                    />
                  </div>
                ) : (
                  /* Media Container 2: Video Stage */
                  <div className="absolute inset-0 w-full h-full bg-inverse-surface/95 flex flex-col items-center justify-center text-on-primary p-6 text-center animate-fadeIn">
                    <button
                      type="button"
                      className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(179,19,41,0.6)] cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => setVideoPlaying((p) => !p)}
                    >
                      <span className="material-symbols-outlined text-[32px] ml-1">
                        {videoPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <p className="font-title-sm text-title-sm text-on-primary font-bold">
                      Test de Firmeza &amp; Densidad {productoActivo.nombre}
                    </p>
                    <p className="font-body-sm text-body-sm text-inverse-on-surface/80 max-w-md mt-1">
                      Demostración en laboratorio TERRA Santa Cruz: Recuperación elástica inmediata de fibra siliconada y
                      soporte cervical ergonómico.
                    </p>
                    <span className="mt-3 px-3 py-1 rounded-full bg-surface-container-lowest/20 text-on-primary text-label-subtle font-label-subtle flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">videocam</span>
                      Video 4K Showroom · Duración: 1:15 min
                    </span>
                  </div>
                )}

                {/* Video Prompt Overlay Button */}
                <button
                  type="button"
                  className="absolute bottom-4 right-4 z-20 bg-surface-container-lowest/90 hover:bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-full font-label-subtle text-label-subtle shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  onClick={() => setShowVideoStage((v) => !v)}
                >
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    {showVideoStage ? 'image' : 'smart_display'}
                  </span>
                  <span>{showVideoStage ? 'Ver Fotos' : 'Ver Test en Video'}</span>
                </button>
              </div>

              {/* Thumbnails Strip */}
              <div className="flex items-center gap-space-sm overflow-x-auto pb-1">
                {productoActivo.imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`thumb-btn flex-shrink-0 w-20 h-20 rounded-lg p-1 bg-surface-container-low transition-all shadow-sm cursor-pointer ${
                      !showVideoStage && selectedMediaIdx === idx
                        ? 'ring-2 ring-primary'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    onClick={() => {
                      setShowVideoStage(false);
                      setSelectedMediaIdx(idx);
                    }}
                  >
                    <img
                      className="w-full h-full object-contain rounded"
                      src={typeof img === 'string' ? img : (img.thumb || img.src || img.imagen_url || '')}
                      alt={typeof img === 'object' ? (img.alt || productoActivo.nombre) : productoActivo.nombre}
                    />
                  </button>
                ))}

                {/* Thumb: Video Demo */}
                <button
                  type="button"
                  className={`thumb-btn flex-shrink-0 w-24 h-20 rounded-lg p-1.5 bg-inverse-surface text-on-primary flex flex-col items-center justify-center text-center hover:bg-inverse-surface/90 transition-all shadow-sm relative overflow-hidden cursor-pointer ${
                    showVideoStage ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => setShowVideoStage(true)}
                >
                  <span className="material-symbols-outlined text-[24px] text-primary-fixed mb-0.5">smart_display</span>
                  <span className="font-label-subtle text-label-subtle text-[11px] leading-tight text-white font-bold">
                    VIDEO DEMO
                  </span>
                  <span className="text-[10px] text-primary-fixed/80">Test de Uso</span>
                </button>

                {/* Thumb: 360° Sala */}
                <button
                  type="button"
                  className="thumb-btn flex-shrink-0 w-20 h-20 rounded-lg p-1.5 bg-surface-container-low hover:bg-surface-container flex flex-col items-center justify-center text-center transition-all opacity-85 hover:opacity-100 cursor-pointer"
                  onClick={() => alert('Tour 360° disponible en pantalla táctil de sala')}
                >
                  <span className="material-symbols-outlined text-[22px] text-tertiary mb-0.5">view_in_ar</span>
                  <span className="font-label-subtle text-label-subtle text-[11px] leading-tight text-on-surface">
                    360° Sala
                  </span>
                </button>
              </div>

              {/* Quick Notice pill */}
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between font-label-subtle text-label-subtle text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">touch_app</span>
                  Toca o haz clic en las miniaturas para alternar vista y video demostrativo.
                </span>
                <span className="text-tertiary font-bold hidden sm:inline">Código: {productoActivo.sku}</span>
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
                {productoActivo.especificaciones.map((esp, i) => (
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
              <span>Aprobado por el departamento de descanso ergonómico de TERRA Santa Cruz.</span>
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
                Visita nuestro espacio de descanso para testear la almohada en combinación con nuestros colchones y recibir
                asesoría personalizada en Santa Cruz.
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
        <div className="pt-space-md">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold">
                Completa tu equipo de descanso
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
            {RECOMENDADOS.map((rec) => (
              <div
                key={rec.id}
                className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_14px_-2px_rgba(30,20,15,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(30,20,15,0.09)] transition-all flex flex-col justify-between group"
              >
                <div className="relative bg-surface-container-low rounded-lg aspect-square mb-space-sm overflow-hidden flex items-center justify-center p-4">
                  <span className="absolute top-2 left-2 bg-surface-container-lowest text-on-surface font-label-subtle text-label-subtle px-2 py-0.5 rounded-full shadow-sm">
                    {rec.tag}
                  </span>
                  <img
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    src={rec.src}
                    alt={rec.nombre}
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-label-subtle text-label-subtle text-on-surface-variant">{rec.categoria}</p>
                  <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">{rec.nombre}</h4>
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
                  onClick={() => onAgregarAlCarrito(rec)}
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  <span>Agregar</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Kiosk Footer Note */}
        <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 pointer-events-auto">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-on-surface font-label-subtle text-label-subtle flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[15px]">touch_app</span>
            <span>Terminal Autoservicio {sucursalActiva.nombre} #04</span>
          </div>
        </div>
      </div>
    </div>
  );
}
