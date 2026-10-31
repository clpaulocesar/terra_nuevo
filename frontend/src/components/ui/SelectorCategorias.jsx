import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Grid2X2, Search, X } from 'lucide-react';
import IconoMaterial from './IconoMaterial.jsx';

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
    <div className="relative" ref={contenedorRef}>
      <span className="block text-terra-2xs font-extrabold uppercase tracking-wider text-terra-texto-suave mb-2">
        {etiqueta}
      </span>
      <button
        type="button"
        ref={controlRef}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-terra-boton text-terra-sm font-bold text-terra-texto transition-colors border cursor-pointer ${
          abierto
            ? 'border-terra-primario bg-terra-superficie shadow-terra-sm'
            : 'border-transparent bg-terra-control hover:bg-terra-control-hover'
        }`}
        onClick={() => (abierto ? setAbierto(false) : abrirMenu())}
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <Grid2X2 size={18} className="text-terra-primario shrink-0" />
        <span className="flex-1 truncate text-left">{resumen}</span>
        <span className="w-6 h-6 rounded-full bg-terra-superficie text-terra-primario flex items-center justify-center shrink-0">
          <Check size={15} />
        </span>
      </button>

      {abierto && posicion && createPortal(
        <div
          role="listbox"
          style={{ position: 'fixed', top: posicion.top, left: posicion.left, width: posicion.width }}
          className="cat-select__menu fixed z-[120] rounded-terra bg-terra-superficie border border-terra-borde shadow-2xl overflow-hidden animate-terra-aparecer"
        >
          <div className="flex items-center gap-2.5 px-3 py-2 bg-terra-control border-b border-terra-borde text-terra-texto-suave">
            <Search size={17} className="shrink-0" />
            <input
              ref={inputRef}
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar categoría..."
              aria-label="Buscar categoría"
              className="w-full bg-transparent border-0 text-terra-sm text-terra-texto placeholder:text-terra-texto-suave outline-none py-1"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="p-1 text-terra-texto-suave hover:text-terra-texto transition-colors rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            <button
              type="button"
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-terra-chico text-left text-terra-sm font-bold transition-colors cursor-pointer ${
                !valor
                  ? 'bg-terra-primario-claro text-terra-primario'
                  : 'text-terra-texto hover:bg-terra-control'
              }`}
              onClick={() => { onSeleccionar(''); setAbierto(false); setBusqueda(''); }}
            >
              <span
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-sm ${
                  !valor ? 'bg-terra-primario text-white' : 'bg-terra-control text-terra-texto-suave'
                }`}
              >
                <Grid2X2 size={16} />
              </span>
              <span className="flex-1 truncate">Todas las categorías</span>
              <span className={`text-terra-xs font-semibold ${!valor ? 'text-terra-primario' : 'text-terra-texto-suave'}`}>
                ({total})
              </span>
            </button>
            {lista.map((categoria) => {
              const activo = valor === categoria.nombre;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-terra-chico text-left text-terra-sm font-bold transition-colors cursor-pointer ${
                    activo
                      ? 'bg-terra-primario-claro text-terra-primario'
                      : 'text-terra-texto hover:bg-terra-control'
                  }`}
                  onClick={() => { onSeleccionar(categoria.nombre); setAbierto(false); setBusqueda(''); }}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-sm ${
                      activo ? 'bg-terra-primario text-white' : 'bg-terra-control text-terra-texto-suave'
                    }`}
                  >
                    <IconoMaterial nombre={categoria.icon || 'category'} className="text-base" />
                  </span>
                  <span className="flex-1 truncate">{categoria.nombre}</span>
                  <span className={`text-terra-xs font-semibold ${activo ? 'text-terra-primario' : 'text-terra-texto-suave'}`}>
                    ({categoria.total})
                  </span>
                </button>
              );
            })}
            {!lista.length && (
              <p className="text-terra-texto-suave text-terra-xs p-3 text-center">
                Sin resultados para “{busqueda}”.
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
