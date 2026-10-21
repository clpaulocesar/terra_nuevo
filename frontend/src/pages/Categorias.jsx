import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Grid2X2, LayoutGrid, Percent, ShoppingBag } from 'lucide-react';
import { listarCategorias } from '../services/productoService.js';
import { imagenDeProducto, usarImagenFallback } from '../utils/imagenProducto.js';
import SelectorCategorias from '../components/ui/SelectorCategorias.jsx';
import './Categorias.css';

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
    <div className="categorias-page">
      <section className="categorias-hero">
        <div className="categorias-hero__slides">
          <img src={FOTO_HERO.src} alt={FOTO_HERO.alt} className="activo" onError={usarImagenFallback} />
        </div>
        <div className="categorias-hero__overlay" />

        <div className="categorias-hero__copy">
          <span className="categorias-tag">
            <LayoutGrid size={15} /> Catálogo dinámico 2026
          </span>
          <h1>Elegí la categoría y empezá <span>tu compra</span></h1>
          <p>Descubrí las líneas con más compras de la tienda o abrí el selector para ver todas las categorías disponibles.</p>
          <Link to="/catalogo" className="categorias-hero__cta">
            <Grid2X2 size={18} /> Ver todos los productos <ArrowRight size={18} />
          </Link>
        </div>

        <div className="categorias-hero__panel">
          <SelectorCategorias
            categorias={todasCategorias}
            valor={seleccion}
            onSeleccionar={elegirCategoria}
          />
          <Link to="/catalogo" className="categorias-hero__link">
            Ver todos los productos <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="categorias-top">
        <header className="categorias-top__head">
          <div>
            <span className="categorias-top__tag"><i /> Categorías destacadas</span>
            <h2>Las {CANTIDAD_TOP} categorías con <span>más compras</span></h2>
          </div>
          <span className="categorias-top__hint">Ordenadas por unidades facturadas</span>
        </header>

        {cargando && (
          <div className="categorias-top__grid">
            {Array.from({ length: CANTIDAD_TOP }, (_, i) => <div key={i} className="categoria-card categoria-card--skeleton" />)}
          </div>
        )}

        {!cargando && !topCategorias.length && (
          <p className="categorias-top__vacio">No hay categorías disponibles en este momento.</p>
        )}

        <div className="categorias-top__grid">
          {topCategorias.map((categoria, indice) => (
            <Link
              key={categoria.id}
              to={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
              className="categoria-card"
            >
              <div className="categoria-card__media">
                {categoria.imagen_url ? (
                  <img
                    src={imagenDeProducto(categoria.imagen_url)}
                    alt={categoria.nombre}
                    loading="lazy"
                    onError={usarImagenFallback}
                  />
                ) : (
                  <span className="categoria-card__placeholder">
                    <span className="material-symbols-outlined">{categoria.icon || 'category'}</span>
                  </span>
                )}
                <span className="categoria-card__rank">{indice + 1}</span>
                <span className="categoria-card__icon">
                  <span className="material-symbols-outlined">{categoria.icon || 'category'}</span>
                </span>
              </div>
              <div className="categoria-card__body">
                <b>{categoria.nombre}</b>
                <div className="categoria-card__meta">
                  <span className="categoria-card__stats">
                    <ShoppingBag size={14} /> {categoria.ventas || 0} vendidos · {categoria.total} modelos
                  </span>
                  <span className="categoria-card__go"><ChevronRight size={17} /></span>
                </div>
                <span className="categoria-card__link">Ver productos <ChevronRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="categorias-offer">
        <div className="categorias-offer-icon">
          <Percent size={29} />
        </div>
        <div>
          <span>Edición especial Santa Cruz</span>
          <h2>Promociones y oportunidades</h2>
          <p>Conjuntos seleccionados y combos familiares a precios preferenciales de tienda.</p>
        </div>
        <Link to="/catalogo?categoria=Promociones">
          Ver ofertas <ArrowRight size={19} />
        </Link>
      </section>
    </div>
  );
}
