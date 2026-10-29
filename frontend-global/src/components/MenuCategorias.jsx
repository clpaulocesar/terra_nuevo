import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const GRUPOS_CATEGORIAS = [
  {
    id: 'dormitorio',
    titulo: 'Dormitorio & Colchones',
    categoriaFiltro: 'dormitorio',
    items: [
      { id: 'colchones', nombre: 'Colchones & Sommiers', query: 'colchón' },
      { id: 'almohadas', nombre: 'Almohadas y accesorios', query: 'almohada' },
      { id: 'espaldar', nombre: 'Espaldares y cabeceros', query: 'espaldar' },
      { id: 'camas', nombre: 'Bases y camas tapizadas', query: 'sommier' },
    ],
  },
  {
    id: 'sala',
    titulo: 'Sala & Confort',
    categoriaFiltro: 'sofas',
    items: [
      { id: 'sofas', nombre: 'Sofás modulares y seccionales', query: 'sofá' },
      { id: 'poltronas', nombre: 'Poltronas y reclinables', query: 'poltrona' },
      { id: 'sofacamas', nombre: 'Sofá camas de sala', query: 'sofá cama' },
      { id: 'recamier', nombre: 'Recamier y banquetas', query: 'recamier' },
    ],
  },
  {
    id: 'comedor',
    titulo: 'Comedor & Cocina',
    categoriaFiltro: 'comedores',
    items: [
      { id: 'juegos-comedor', nombre: 'Juegos de comedor completos', query: 'comedor' },
      { id: 'mesas', nombre: 'Mesas de comedor modernas', query: 'mesa' },
      { id: 'sillas', nombre: 'Sillas de comedor y butacas', query: 'silla' },
      { id: 'buffets', nombre: 'Buffets y muebles bar', query: 'buffet' },
    ],
  },
  {
    id: 'oficina',
    titulo: 'Estudio & Home Office',
    categoriaFiltro: 'oficina',
    items: [
      { id: 'escritorios', nombre: 'Escritorios de trabajo', query: 'escritorio' },
      { id: 'sillas-oficina', nombre: 'Sillas ergonómicas', query: 'silla' },
      { id: 'estantes', nombre: 'Estantes y libreros', query: 'librero' },
      { id: 'organizadores', nombre: 'Muebles archivadores', query: 'mueble' },
    ],
  },
  {
    id: 'hogar-jardin',
    titulo: 'Hogar & Jardín',
    categoriaFiltro: 'almohadas',
    items: [
      { id: 'exteriores', nombre: 'Artículos para el jardín y exteriores', query: 'exterior' },
      { id: 'artesanias', nombre: 'Artesanías y deco hogar', query: 'artesanía' },
      { id: 'mejoras', nombre: 'Mejoras y alfombras al hogar', query: 'alfombra' },
      { id: 'mascotas', nombre: 'Telas antimanchas para mascotas', query: 'antimanchas' },
    ],
  },
  {
    id: 'muebles-aux',
    titulo: 'Muebles Auxiliares',
    categoriaFiltro: 'muebles',
    items: [
      { id: 'mesas-centro', nombre: 'Mesas de centro y laterales', query: 'mesa de centro' },
      { id: 'racks-tv', nombre: 'Racks de TV y paneles', query: 'rack' },
      { id: 'comodas', nombre: 'Cómodas y gaveteros', query: 'cómoda' },
      { id: 'zapateras', nombre: 'Zapateras y consolas', query: 'zapatera' },
    ],
  },
  {
    id: 'juvenil',
    titulo: 'Juvenil & Niños',
    categoriaFiltro: 'dormitorio',
    items: [
      { id: 'colchones-1p', nombre: 'Colchones de 1 y 1.5 plazas', query: '1 plaza' },
      { id: 'bicamas', nombre: 'Bicamas y camas nido', query: 'cama' },
      { id: 'protectores', nombre: 'Protectores impermeables', query: 'protector' },
      { id: 'almohadas-kids', nombre: 'Almohadas ergonómicas', query: 'almohada' },
    ],
  },
  {
    id: 'coleccion-arte',
    titulo: 'Colección & Arte',
    categoriaFiltro: 'todas',
    items: [
      { id: 'cuadros', nombre: 'Cuadros y arte de pared', query: 'cuadro' },
      { id: 'madera', nombre: 'Muebles en madera noble', query: 'madera' },
      { id: 'lino', nombre: 'Tapizados en Lino Premium', query: 'lino' },
      { id: 'espejos', nombre: 'Espejos y lámparas decorativas', query: 'espejo' },
    ],
  },
  {
    id: 'promociones-otras',
    titulo: 'Otras categorías & Ofertas',
    categoriaFiltro: 'ofertas',
    items: [
      { id: 'ofertas-scz', nombre: 'Promociones Showroom SCZ', query: 'ofertas' },
      { id: 'liquidacion', nombre: 'Liquidación de stock', query: 'liquidación' },
      { id: 'combos', nombre: 'Combos sala + comedor', query: 'combo' },
      { id: 'express', nombre: 'Mobiliario para retiro express', query: 'express' },
    ],
  },
];

export default function MenuCategorias({ onSeleccionar, categorias = [] }) {
  const [abierto, setAbierto] = useState(false);
  const botonCerrarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    botonCerrarRef.current?.focus();

    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [abierto]);

  const seleccionar = (categoria, query) => {
    onSeleccionar(categoria, query);
    setAbierto(false);
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 sm:px-2.5 font-label-interactive font-bold text-on-surface transition-colors hover:bg-surface-container cursor-pointer shrink-0"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
      >
        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">menu</span>
        <span>Todas</span>
      </button>

      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-[80] overflow-y-auto" role="presentation">
            {/* Backdrop oscuro con blur suave */}
            <button
              type="button"
              className="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-[2px] transition-opacity cursor-pointer border-0 p-0"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú de categorías"
            />

            {/* Mega Panel de Categorías estilo directorio 3 columnas */}
            <div className="relative min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-6 pb-12 pointer-events-none">
              <aside
                className="pointer-events-auto relative w-full max-w-5xl bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/30 p-6 sm:p-10 animate-fadeIn"
                role="dialog"
                aria-modal="true"
                aria-label="Directorio de todas las categorías"
              >
                {/* Botón Cerrar (X) superior */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">category</span>
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-on-surface">Explorar por categoría</h2>
                  </div>
                  <button
                    ref={botonCerrarRef}
                    type="button"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    onClick={() => setAbierto(false)}
                    aria-label="Cerrar menú"
                  >
                    <span className="material-symbols-outlined text-[22px]">close</span>
                  </button>
                </div>

                {/* Grid de 3 columnas de categorías */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 sm:gap-x-14 gap-y-7 sm:gap-y-9">
                  {GRUPOS_CATEGORIAS.map((grupo) => (
                    <div key={grupo.id} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => seleccionar(grupo.categoriaFiltro)}
                        className="font-bold text-[15px] sm:text-[16px] text-on-surface hover:text-primary transition-colors text-left mb-3 cursor-pointer select-none"
                      >
                        {grupo.titulo}
                      </button>
                      <ul className="space-y-2">
                        {grupo.items.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => seleccionar(grupo.categoriaFiltro, item.query)}
                              className="text-[13px] sm:text-[14px] text-on-surface-variant hover:text-primary transition-colors text-left block w-full py-0.5 cursor-pointer leading-snug"
                            >
                              {item.nombre}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Footer del panel: Ver todas las categorías > */}
                <div className="border-t border-outline-variant/30 pt-5 mt-8 sm:mt-10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => seleccionar('todas')}
                    className="font-bold text-[14px] sm:text-[15px] text-on-surface hover:text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1 group"
                  >
                    <span>Ver todas las categorías</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      chevron_right
                    </span>
                  </button>
                  <span className="text-[12px] text-on-surface-variant hidden sm:inline">
                    Red Showrooms Santa Cruz · Entrega Express
                  </span>
                </div>
              </aside>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
