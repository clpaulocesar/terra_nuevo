import { useEffect, useMemo, useState } from 'react';
import { CATEGORY_PILLS } from '../data/catalogoData.js';
import { SUCURSALES_DATA, evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';
import { listarProductos, obtenerCategorias } from '../services/api.js';

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
}

export default function CatalogoPage({
  sucursalActiva,
  setSucursalActiva,
  onAgregarAlCarrito,
  categoriaInicial = 'todas',
  busquedaInicial = '',
  onVerDetalle,
}) {
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState(categoriaInicial);
  const [listaCategorias, setListaCategorias] = useState(CATEGORY_PILLS);
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaInicial);
  const [filtroOfertas, setFiltroOfertas] = useState(false);
  const [filtroPlazas, setFiltroPlazas] = useState(['2 Plazas', '3 Plz (King)', '3.5 Plz (Super)']);
  const [filtroFirmeza, setFirmeza] = useState('Confort Intermedio');
  const [filtroExpress, setFiltroExpress] = useState(true);
  const [filtroRetiro, setFiltroRetiro] = useState(true);
  const [precioMaximo, setPrecioMaximo] = useState(6500);
  const [orden, setOrden] = useState('recomendados');
  const [pagina, setPagina] = useState(1);
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});
  const [productosReales, setProductosReales] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 });
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  // Cargar categorías del backend
  useEffect(() => {
    obtenerCategorias()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setListaCategorias(
            cats.map((c) => ({
              id: c.key || c.id,
              label: c.nombre,
              icon: c.icono || 'chair',
              isOffer: c.key === 'ofertas' || c.id === 'ofertas',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    const cargarProductos = async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const resultado = await listarProductos({
          signal: controlador.signal,
          pagina,
          limite: 18,
          buscar: busquedaLocal,
          categoria: categoriaActiva !== 'ofertas' && categoriaActiva !== 'todas' ? categoriaActiva : '',
          orden,
          ofertas: filtroOfertas || categoriaActiva === 'ofertas',
        });
        setProductosReales(resultado.productos);
        setPaginacion(resultado.paginacion);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorCarga(error.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarProductos();
    return () => controlador.abort();
  }, [busquedaLocal, categoriaActiva, filtroOfertas, orden, pagina, sucursalActiva]);

  // Manejar selector de color individual de producto
  const seleccionarColor = (prodId, colIdx) => {
    setColoresSeleccionados((prev) => ({ ...prev, [prodId]: colIdx }));
  };

  const togglePlaza = (plaza) => {
    setFiltroPlazas((prev) =>
      prev.includes(plaza) ? prev.filter((p) => p !== plaza) : [...prev, plaza]
    );
  };

  const limpiarFiltros = () => {
    setCategoriaActiva('todas');
    setFiltroOfertas(false);
    setFiltroPlazas(['2 Plazas', '3 Plz (King)', '3.5 Plz (Super)']);
    setFirmeza('Confort Intermedio');
    setPrecioMaximo(6500);
    setBusquedaLocal('');
    setPagina(1);
  };

  // Filtrado de productos y ordenamiento dinámico por disponibilidad en sucursal activa
  const productosFiltrados = useMemo(() => {
    return productosReales
      .map((prod) => {
        const disponibilidad = evaluarDisponibilidadSucursal(prod, sucursalActiva);
        return {
          ...prod,
          disponibilidadSucursal: disponibilidad,
        };
      })
      .filter((prod) => {
        // Búsqueda
        if (busquedaLocal.trim()) {
          const query = busquedaLocal.toLowerCase();
          const coincide =
            prod.nombre.toLowerCase().includes(query) ||
            prod.descripcion.toLowerCase().includes(query) ||
            prod.categoria.toLowerCase().includes(query);
          if (!coincide) return false;
        }

        // Categoría
        if (categoriaActiva === 'ofertas') {
          if (!prod.enOferta) return false;
        } else if (categoriaActiva !== 'todas') {
          if (prod.categoriaKey !== categoriaActiva) return false;
        }

        // Oferta check
        if (filtroOfertas && !prod.enOferta) return false;

        // Precio
        if (prod.precio > precioMaximo) return false;

        // Si se activó filtro de retiro hoy en showroom
        if (filtroRetiro && !prod.disponibilidadSucursal.inmediato) {
          // Si no tiene stock inmediato, sólo mostrar si no hay suficientes
          // o permitir priorizar
        }

        return true;
      })
      .sort((a, b) => {
        // Priorizar automáticamente productos con stock inmediato en la sucursal activa
        const aInmediato = a.disponibilidadSucursal?.inmediato ? 1 : 0;
        const bInmediato = b.disponibilidadSucursal?.inmediato ? 1 : 0;
        return bInmediato - aInmediato;
      });
  }, [busquedaLocal, categoriaActiva, filtroOfertas, filtroRetiro, precioMaximo, productosReales, sucursalActiva]);

  return (
    <div className="relative w-full px-margin py-space-md">
      {/* ========================================================= */}
      {/* CATALOG CONTROL HUB                                       */}
      {/* ========================================================= */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-md lg:p-space-lg mb-space-lg">
        {/* Top Row: Search & Store Availability Badge */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md mb-space-md">
          {/* Large Touch Search Bar */}
          <div className="relative flex-1">
            <div className="flex items-center w-full h-14 pl-12 pr-4 bg-surface-container-low rounded-xl text-on-surface focus-within:bg-surface-container-lowest focus-within:shadow-md transition-all">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[24px]">search</span>
              <input
                className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none"
                id="catalog-search"
                placeholder="Buscar colchones, sommiers, almohadas, camas, sofás..."
                type="text"
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
              />
              <button
                type="button"
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-interactive text-label-interactive hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                onClick={() => setPagina(1)}
              >
                <span className="material-symbols-outlined text-[18px]">manage_search</span>
                Buscar
              </button>
            </div>
          </div>

          {/* Store Switcher Pill & Kiosk Stock Indicator */}
          <div className="flex items-center gap-space-sm bg-surface-container-low p-1.5 rounded-xl self-start lg:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <div className="leading-tight">
                <span className="font-label-subtle text-label-subtle text-on-surface-variant block">Showroom Activo:</span>
                <span className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                  {sucursalActiva.nombre} · Santa Cruz
                </span>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-2 text-primary hover:bg-surface-container rounded-lg font-label-interactive text-label-interactive flex items-center gap-1 transition-colors cursor-pointer"
              id="branch-select-btn"
              onClick={() => setBranchDropdownOpen((open) => !open)}
            >
              <span>{branchDropdownOpen ? 'Cerrar' : 'Cambiar sala'}</span>
              <span className="material-symbols-outlined text-[18px]">
                {branchDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Branch Selector Dropdown Box */}
        {branchDropdownOpen && (
          <div
            className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-space-xs pb-space-sm border-t-0 bg-surface-container-low p-3 rounded-lg mb-space-md animate-fadeIn"
            id="branch-dropdown"
          >
            {SUCURSALES_DATA.map((s) => {
              const activa = s.id === sucursalActiva.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`flex flex-col text-left p-2.5 rounded-lg transition-all cursor-pointer ${
                    activa
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                  onClick={() => {
                    setSucursalActiva(s);
                    setBranchDropdownOpen(false);
                  }}
                >
                  <span
                    className={`text-[11px] uppercase tracking-wider ${
                      activa ? 'text-on-primary-container/80' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.tag}
                  </span>
                  <span className="text-[13px] font-semibold">{s.nombre}</span>
                  <span
                    className={`text-[11px] font-normal ${
                      activa ? 'opacity-90' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.stockKiosk}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inventory Metrics Bar & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container-low">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full text-on-surface">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-interactive text-label-interactive text-on-surface">
              <strong>{productosFiltrados.length * 1100 + 12} disponibles</strong> · pág. {pagina}/826
            </span>
          </div>

          {/* Sorting Control */}
          <div className="flex items-center gap-2">
            <label className="font-label-subtle text-label-subtle text-on-surface-variant hidden sm:inline" htmlFor="catalog-sort">
              Visualización:
            </label>
            <div className="relative inline-flex items-center bg-primary text-on-primary px-4 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1.5">swap_vert</span>
              <select
                id="catalog-sort"
                className="bg-transparent text-on-primary font-label-interactive text-label-interactive font-semibold outline-none cursor-pointer pr-4"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recomendados" className="text-on-surface bg-surface-container-lowest">
                  Orden: Recomendados
                </option>
                <option value="precio-asc" className="text-on-surface bg-surface-container-lowest">
                  Precio: Menor a Mayor
                </option>
                <option value="precio-desc" className="text-on-surface bg-surface-container-lowest">
                  Precio: Mayor a Menor
                </option>
                <option value="nombre" className="text-on-surface bg-surface-container-lowest">
                  Nombre: A - Z
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Category Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-space-xs no-scrollbar py-2">
          {listaCategorias.map((pill) => {
            const esActiva = categoriaActiva === pill.id;
            if (pill.isOffer) {
              return (
                <button
                  key={pill.id}
                  type="button"
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-label-interactive text-label-interactive shadow-sm transition-colors cursor-pointer ${
                    esActiva
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-primary-fixed text-on-primary-fixed font-bold hover:bg-primary-fixed-dim'
                  }`}
                  onClick={() => setCategoriaActiva(esActiva ? 'todas' : pill.id)}
                >
                  <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                  <span>{pill.label}</span>
                </button>
              );
            }

            return (
              <button
                key={pill.id}
                type="button"
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-label-interactive text-label-interactive transition-colors cursor-pointer ${
                  esActiva
                    ? 'bg-inverse-surface text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
                onClick={() => setCategoriaActiva(pill.id)}
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="shrink-0 flex items-center gap-1 px-3 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-label-interactive text-label-interactive hover:bg-surface-container-highest transition-colors cursor-pointer"
            onClick={() => setCategoriaActiva('todas')}
          >
            <span className="material-symbols-outlined text-[16px]">more_horiz</span>
            <span>+23 más</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DUAL-PANEL LAYOUT: FILTERS & PRODUCT GRID                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* DESKTOP FILTER ASIDE */}
        <aside className="hidden lg:block lg:col-span-3 bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-md sticky top-48">
          <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-md -mt-space-md p-space-md rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">Filtros Avanzados</span>
            </div>
            <button
              type="button"
              className="font-label-subtle text-label-subtle text-primary hover:underline cursor-pointer"
              onClick={limpiarFiltros}
            >
              Limpiar todo
            </button>
          </div>

          {/* Filter: Rango de Precio */}
          <div className="space-y-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-interactive text-label-interactive font-semibold text-on-surface">Rango de Precio</span>
              <span className="font-label-subtle text-label-subtle text-on-surface-variant">Bs 20 - Bs 15.000</span>
            </div>
            <input
              type="range"
              min="20"
              max="15000"
              step="50"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="bg-surface-container-low px-2 py-1 rounded">Bs. 20</span>
              <span className="text-on-surface-variant">hasta</span>
              <span className="bg-surface-container-low px-2 py-1 rounded font-semibold text-on-surface">
                {formatBs(precioMaximo)}
              </span>
            </div>
          </div>

          {/* Filter: Medidas / Plazas */}
          <div className="space-y-space-xs pt-space-xs border-t border-surface-container-low">
            <span className="font-label-interactive text-label-interactive font-semibold text-on-surface block">
              Medidas de Cama / Plazas
            </span>
            <div className="grid grid-cols-2 gap-1.5 font-body-sm text-body-sm">
              {[
                '1 Plaza',
                '1.5 Plazas',
                '2 Plazas',
                '2.5 Plz (Queen)',
                '3 Plz (King)',
                '3.5 Plz (Super)',
              ].map((plz) => {
                const checked = filtroPlazas.includes(plz);
                return (
                  <label
                    key={plz}
                    className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg hover:bg-surface-container cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlaza(plz)}
                      className="accent-primary rounded cursor-pointer"
                    />
                    <span className={checked ? 'font-medium text-primary' : 'text-on-surface'}>{plz}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filter: Firmeza & Descanso */}
          <div className="space-y-space-xs pt-space-xs border-t border-surface-container-low">
            <span className="font-label-interactive text-label-interactive font-semibold text-on-surface block">
              Nivel de Firmeza
            </span>
            <div className="space-y-1 font-body-sm text-body-sm">
              {[
                { label: 'Suave Acolchado', count: 48 },
                { label: 'Confort Intermedio', count: 126 },
                { label: 'Firme Ortopédico', count: 84 },
                { label: 'Extra Firme / Bio', count: 32 },
              ].map((fir) => {
                const selected = filtroFirmeza === fir.label;
                return (
                  <label
                    key={fir.label}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selected ? 'bg-surface-container-low font-semibold text-on-surface' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="firmeza"
                        checked={selected}
                        onChange={() => setFirmeza(fir.label)}
                        className="accent-primary cursor-pointer"
                      />
                      <span>{fir.label}</span>
                    </span>
                    <span
                      className={`font-label-subtle text-label-subtle ${
                        selected ? 'text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      {fir.count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filter: Modalidad de Despacho en Santa Cruz */}
          <div className="space-y-space-xs pt-space-xs border-t border-surface-container-low">
            <span className="font-label-interactive text-label-interactive font-semibold text-on-surface block">
              Modalidad de Despacho
            </span>
            <div className="space-y-1.5 font-body-sm text-body-sm">
              <label className="p-2 bg-surface-container-low rounded-lg flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                  <span>Entrega Express 24h</span>
                </span>
                <input
                  type="checkbox"
                  checked={filtroExpress}
                  onChange={(e) => setFiltroExpress(e.target.checked)}
                  className="accent-primary rounded cursor-pointer"
                />
              </label>
              <label className="p-2 bg-surface-container-low rounded-lg flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">storefront</span>
                  <span>Retiro Hoy en Showroom</span>
                </span>
                <input
                  type="checkbox"
                  checked={filtroRetiro}
                  onChange={(e) => setFiltroRetiro(e.target.checked)}
                  className="accent-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Assist Kiosk Callout Card */}
          <div className="bg-primary/5 p-space-sm rounded-xl flex items-center gap-3 border border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
            </div>
            <div>
              <p className="font-label-interactive text-label-interactive font-bold text-on-surface leading-tight">
                ¿Estás en Showroom?
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                Pide a un asesor escanear la etiqueta de prueba en piso.
              </p>
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID SECTION */}
        <section className="col-span-1 lg:col-span-9 space-y-space-md">
          {/* Live Alert Ribbon */}
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">storefront</span>
              <span className="font-body-sm text-body-sm font-medium">
                Retiro sin costo en nuestras 3 sucursales · Envíos con flete y comisión según zona.
              </span>
            </div>
            <span className="bg-surface-container-high px-2 py-0.5 rounded text-[12px] font-label-subtle text-on-surface font-semibold">
              Garantía de Fábrica Terra 1 Año
            </span>
          </div>

          {/* Products 3-Column Bento Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md">
            {productosFiltrados.map((prod) => {
              const activeColorIdx = coloresSeleccionados[prod.id] || 0;
              return (
                <div
                  key={prod.id}
                  className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
                >
                  <div>
                    {/* Image Container & Badges */}
                    <div
                      className="relative w-full aspect-square bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center p-space-md mb-space-sm cursor-pointer"
                      onClick={() => onVerDetalle && onVerDetalle(prod)}
                      title="Ver ficha técnica y detalles"
                    >
                      {/* Badges superiores (OFERTA y Más vendido apilados idénticos a la foto de referencia) */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none items-start">
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

                      <img
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        src={prod.imagen}
                        alt={prod.nombre}
                        loading="lazy"
                      />
                    </div>

                    {/* Quality & Availability Bar */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 text-tertiary-fixed-dim text-[15px]">
                        <span className="text-tertiary font-bold tracking-tighter">{prod.calidad}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary bg-tertiary-fixed/20 px-2.5 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">
                          {prod.disponibilidadSucursal?.inmediato ? 'check_circle' : 'local_shipping'}
                        </span>
                        <span>{prod.disponibilidadSucursal?.inmediato ? 'Disponible hoy' : 'Entrega 24h'}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3
                      className="font-title-sm text-title-sm font-bold text-on-surface tracking-tight uppercase mb-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onVerDetalle && onVerDetalle(prod)}
                      title="Ver detalle del producto"
                    >
                      {prod.nombre}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-sm">
                      {prod.descripcion}
                    </p>

                    {/* Color Dot Selector (if colors available) */}
                    {prod.colores && prod.colores.length > 0 && (
                      <div className="flex items-center gap-2 mb-space-md">
                        {prod.colores.map((colorItem, idx) => {
                          const bgStyle = typeof colorItem === 'object' && colorItem.valor ? { backgroundColor: colorItem.valor } : {};
                          const bgClass = typeof colorItem === 'string' ? colorItem : '';
                          return (
                            <button
                              key={idx}
                              type="button"
                              style={bgStyle}
                              className={`w-4 h-4 rounded-full ${bgClass} shadow-inner inline-block transition-transform cursor-pointer ${
                                activeColorIdx === idx ? 'ring-2 ring-primary scale-110' : ''
                              }`}
                              onClick={() => seleccionarColor(prod.id, idx)}
                              aria-label={`Color opción ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Attributes Badges (if any) */}
                    {prod.atributos && (
                      <div className="flex items-center gap-2 mb-space-md text-[12px] font-label-subtle text-on-surface-variant">
                        {prod.atributos.map((at, i) => (
                          <span key={i} className="bg-surface-container-high px-2 py-0.5 rounded">
                            {at}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Add Action */}
                  <div className="pt-space-xs border-t border-surface-container-low">
                    <div className="flex items-baseline gap-2 mb-space-sm">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        {formatBs(prod.precio)}
                      </span>
                      {prod.precioOriginal && (
                        <span className="text-on-surface-variant line-through text-[13px]">
                          {formatBs(prod.precioOriginal)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="w-full h-12 bg-primary text-on-primary rounded-xl font-label-interactive text-label-interactive flex items-center justify-center gap-2 hover:bg-primary-container shadow-[0_4px_12px_rgba(139,0,26,0.25)] transition-all active:scale-[0.98] cursor-pointer"
                      onClick={() => onAgregarAlCarrito(prod)}
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                      <span>Agregar al carrito</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FULL PAGINATION BAR */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-lg">
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              Mostrando <strong>{(pagina - 1) * 18 + 1} - {Math.min(pagina * 18, paginacion.total || productosFiltrados.length)}</strong> de <strong>{(paginacion.total || productosFiltrados.length).toLocaleString('es-BO')}</strong> productos registrados
            </div>

            {/* Page Switcher Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 h-10 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer text-[13px] font-semibold gap-1"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span> Anterior
              </button>

              <span className="px-3 py-2 bg-surface-container-high rounded-lg font-bold text-on-surface text-[13px]">
                Pág. {pagina} de {paginacion.totalPaginas || 1}
              </span>

              <button
                type="button"
                className="px-3 h-10 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-center hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer text-[13px] font-semibold gap-1"
                disabled={pagina >= (paginacion.totalPaginas || 1)}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
