import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Grid2X2, LayoutGrid, Percent, ShoppingBag } from 'lucide-react';
import { listarCategorias } from '../services/productoService.js';
import ImagenProducto from '../components/ui/ImagenProducto.jsx';
import SelectorCategorias from '../components/ui/SelectorCategorias.jsx';
import IconoMaterial from '../components/ui/IconoMaterial.jsx';

const CANTIDAD_TOP = 10;

const FOTO_HERO = {
  src: '/images/inicio/Sal%C3%B3n%20moderno%20con%20luz%20c%C3%A1lida%20y%20plantas.png',
  alt: 'Salón moderno con luz cálida y plantas',
};

export default function Categorias() {
  const [listaCategorias, setListaCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState('');
  const navegar = useNavigate();

  useEffect(() => {
    let cancelado = false;
    listarCategorias()
      .then((data) => {
        if (!cancelado && Array.isArray(data)) setListaCategorias(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, []);

  // Las 10 categorías con más compras (unidades facturadas) y el listado completo.
  const topCategorias = useMemo(() => [...listaCategorias]
    .sort((a, b) => (Number(b.ventas) || 0) - (Number(a.ventas) || 0) || (Number(b.total) || 0) - (Number(a.total) || 0))
    .slice(0, CANTIDAD_TOP), [listaCategorias]);

  const todasCategorias = useMemo(() => [...listaCategorias]
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))), [listaCategorias]);

  const elegirCategoria = (nombre) => {
    setSeleccion(nombre);
    if (!nombre) return;
    navegar(`/catalogo?categoria=${encodeURIComponent(nombre)}`);
  };

  return (
    <div className="font-terra -my-2 sm:-my-4 space-y-6 sm:space-y-8">
      <section className="relative rounded-terra-tarjeta bg-gradient-to-br from-[#231a16] via-[#3d2622] to-terra-primario text-white grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] min-h-[15rem] sm:min-h-[16rem]">
        <div className="absolute inset-0 rounded-terra-tarjeta overflow-hidden pointer-events-none">
          <ImagenProducto src={FOTO_HERO.src} alt={FOTO_HERO.alt} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 rounded-terra-tarjeta bg-gradient-to-r from-[#1c120f]/95 via-[#231412]/85 to-terra-primario/60 pointer-events-none" />

        <div className="relative z-10 self-center p-5 sm:p-6 lg:p-7 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-terra-2xs font-extrabold uppercase tracking-wider bg-white/15 text-[#ffe2b8]">
            <LayoutGrid size={15} /> Catálogo dinámico 2026
          </span>
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight mt-2.5 mb-2 max-w-sm">
            Elige la categoría y empieza <span className="text-red-400">tu compra</span>
          </h1>
          <p className="text-white/85 text-terra-xs sm:text-terra-sm leading-relaxed mb-4 max-w-md">
            Descubre las líneas con más compras de la tienda o abre el selector para ver todas las categorías disponibles.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full text-terra-sm font-extrabold text-white bg-terra-primario hover:bg-terra-primario-oscuro transition-all hover:-translate-y-0.5 shadow-terra-sm"
          >
            <Grid2X2 size={18} /> Ver todos los productos <ArrowRight size={18} />
          </Link>
        </div>

        <div className="relative z-10 self-end lg:self-center m-4 lg:m-4 lg:mr-4 p-4 rounded-terra bg-white dark:bg-terra-superficie shadow-2xl">
          <SelectorCategorias
            categorias={todasCategorias}
            valor={seleccion}
            onSeleccionar={elegirCategoria}
          />
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1 text-terra-primario hover:gap-2 transition-all text-terra-sm font-extrabold mt-2.5"
          >
            Ver todos los productos <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-7">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <span className="inline-flex items-center gap-2 text-terra-texto-suave text-terra-2xs font-extrabold uppercase tracking-widest">
              <i className="w-6 h-0.5 bg-terra-primario rounded-full block" /> Categorías destacadas
            </span>
            <h2 className="text-terra-texto text-xl sm:text-2xl font-bold tracking-tight mt-1">
              Las {CANTIDAD_TOP} categorías con <span className="text-terra-primario">más compras</span>
            </h2>
          </div>
          <span className="text-terra-texto-suave text-terra-xs">Ordenadas por unidades facturadas</span>
        </header>

        {cargando && (
          <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: CANTIDAD_TOP }, (_, i) => (
              <div
                key={i}
                className="categoria-card aspect-[4/5] rounded-terra-tarjeta fondo-cargando border border-terra-borde-suave"
              />
            ))}
          </div>
        )}

        {!cargando && !topCategorias.length && (
          <p className="text-terra-texto-suave text-terra-sm text-center py-8">
            No hay categorías disponibles en este momento.
          </p>
        )}

        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {topCategorias.map((categoria, indice) => (
            <Link
              key={categoria.id}
              to={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
              className="group categoria-card flex flex-col bg-terra-superficie rounded-terra-tarjeta border border-terra-borde-suave shadow-terra-sm hover:shadow-terra-tarjeta-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden text-inherit no-underline"
            >
              <div className="relative aspect-[16/10] bg-terra-superficie-2 overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-t after:from-[#231a16]/60 after:via-transparent after:to-transparent">
                {categoria.imagen_url ? (
                  <ImagenProducto
                    src={categoria.imagen_url}
                    alt={categoria.nombre}
                    perezosa
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-terra-superficie-2 to-terra-borde-suave text-terra-primario/60">
                    <IconoMaterial nombre={categoria.icon || 'category'} className="text-4xl" />
                  </span>
                )}
                <span className="absolute top-2.5 left-2.5 z-10 w-6.5 h-6.5 rounded-full bg-white/95 text-terra-primario text-terra-2xs font-black flex items-center justify-center shadow-sm">
                  {indice + 1}
                </span>
                <span className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-terra-chico bg-terra-primario/95 text-white flex items-center justify-center shadow-md">
                  <IconoMaterial nombre={categoria.icon || 'category'} className="text-xl" />
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3.5 sm:p-4">
                <b className="text-terra-texto font-bold text-terra-md sm:text-terra-lg tracking-tight group-hover:text-terra-primario transition-colors truncate">
                  {categoria.nombre}
                </b>
                <div className="flex items-center justify-between text-terra-texto-suave text-terra-xs">
                  <span className="inline-flex items-center gap-1.5 text-terra-texto-suave text-terra-xs">
                    <ShoppingBag size={14} /> {categoria.ventas || 0} vendidos · {categoria.total} modelos
                  </span>
                  <span className="w-8 h-8 rounded-full bg-terra-primario-claro text-terra-primario flex items-center justify-center group-hover:bg-terra-primario group-hover:text-white transition-colors">
                    <ChevronRight size={17} />
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-terra-primario text-terra-xs font-extrabold mt-1">
                  Ver productos <ChevronRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-terra-tarjeta bg-terra-oro-fondo border border-terra-oro-borde mt-8">
        <div className="w-14 h-14 rounded-terra flex items-center justify-center shrink-0 bg-[#7c4100] text-white shadow-sm">
          <Percent size={28} />
        </div>
        <div>
          <span className="text-terra-2xs font-extrabold uppercase tracking-wider text-[#7c4100]">
            Edición especial Santa Cruz
          </span>
          <h2 className="text-terra-texto text-lg sm:text-xl font-bold my-1">
            Promociones y oportunidades
          </h2>
          <p className="text-terra-texto-suave text-terra-sm max-w-xl">
            Conjuntos seleccionados y combos familiares a precios preferenciales de tienda.
          </p>
        </div>
        <Link
          to="/catalogo?categoria=Promociones"
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-sm font-extrabold transition-all shrink-0"
        >
          Ver ofertas <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
