import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Grid2X2, Search, X } from 'lucide-react';

export default function SelectorCategorias({ categorias, valor, onSeleccionar, etiqueta = 'Ver todas las categorías' }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [posicion, setPosicion] = useState(null);
  const contenedorRef = useRef(null);
  const controlRef = useRef(null);
  const inputRef = useRef(null);

  const lista = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return categorias;
    return categorias.filter((categoria) => String(categoria.nombre).toLowerCase().includes(texto));
  }, [categorias, busqueda]);

  const medir = () => {
    const caja = controlRef.current?.getBoundingClientRect();
    if (!caja) return null;
    return {
      top: Math.round(caja.bottom + 6),
      left: Math.round(caja.left),
      width: Math.round(caja.width),
      visible: caja.bottom > 0 && caja.top < window.innerHeight,
    };
  };

  const abrirMenu = () => {
    const caja = medir();
    if (!caja || !caja.visible) return;
    setPosicion(caja);
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return undefined;
    const clicFuera = (evento) => {
      if (contenedorRef.current?.contains(evento.target)) return;
      if (evento.target.closest?.('.cat-select__menu')) return;
      setAbierto(false);
    };
    const escape = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    // Al desplazar, el menú sigue al control; si el control sale de pantalla, se cierra.
    const reposicionar = () => {
      const caja = medir();
      if (!caja) return;
      if (!caja.visible) { setAbierto(false); return; }
      setPosicion(caja);
    };
    document.addEventListener('mousedown', clicFuera);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', reposicionar);
    window.addEventListener('scroll', reposicionar, true);
    const foco = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('mousedown', clicFuera);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', reposicionar);
      window.removeEventListener('scroll', reposicionar, true);
      clearTimeout(foco);
    };
  }, [abierto]);

  const total = categorias.length;
  const resumen = valor ? valor : `Todas las categorías (${total})`;

  return (
    <div className="cat-select" ref={contenedorRef}>
      <span className="cat-select__label">{etiqueta}</span>
      <button
        type="button"
        ref={controlRef}
        className={`cat-select__control ${abierto ? 'is-open' : ''}`}
        onClick={() => (abierto ? setAbierto(false) : abrirMenu())}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <Grid2X2 size={18} />
        <span>{resumen}</span>
        <span className="cat-select__chevron"><Check size={16} /></span>
      </button>

      {abierto && posicion && createPortal(
        <div
          className="cat-select__menu"
          role="listbox"
          style={{ position: 'fixed', top: posicion.top, left: posicion.left, width: posicion.width }}
        >
          <div className="cat-select__search">
            <Search size={17} />
            <input
              ref={inputRef}
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar categoría..."
              aria-label="Buscar categoría"
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="cat-select__list">
            <button
              type="button"
              className={`cat-select__option ${!valor ? 'is-active' : ''}`}
              onClick={() => { onSeleccionar(''); setAbierto(false); setBusqueda(''); }}
            >
              <span className="cat-select__icon"><Grid2X2 size={16} /></span>
              <span className="cat-select__name">Todas las categorías</span>
              <span className="cat-select__count">({total})</span>
            </button>
            {lista.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                className={`cat-select__option ${valor === categoria.nombre ? 'is-active' : ''}`}
                onClick={() => { onSeleccionar(categoria.nombre); setAbierto(false); setBusqueda(''); }}
              >
                <span className="cat-select__icon">
                  <span className="material-symbols-outlined" aria-hidden="true">{categoria.icon || 'category'}</span>
                </span>
                <span className="cat-select__name">{categoria.nombre}</span>
                <span className="cat-select__count">({categoria.total})</span>
              </button>
            ))}
            {!lista.length && <p className="cat-select__empty">Sin resultados para “{busqueda}”.</p>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
