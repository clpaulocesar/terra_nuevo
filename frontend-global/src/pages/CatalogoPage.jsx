import { useEffect, useMemo, useState } from 'react';
import { evaluarDisponibilidadSucursal } from '../data/sucursalesData.js';
import { listarProductos } from '../services/api.js';
import { normalizarCategoria, coincideCategoriaProducto } from '../utils/categoriaUtils.js';

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
}

function normalizarPlaza(prod) {
  const texto = `${prod?.plazas || ''} ${prod?.medida || ''} ${prod?.size || ''} ${prod?.nombre || ''}`.toLowerCase();
  if (texto.includes('3.5 plz') || texto.includes('super king') || texto.includes('3.5')) return '3.5 Plz (Super)';
  if (texto.includes('3 plz') || texto.includes('king') || texto.includes('3 plazas')) return '3 Plz (King)';
  if (texto.includes('2.5 plz') || texto.includes('queen') || texto.includes('2.5')) return '2.5 Plz (Queen)';
  if (texto.includes('2 plaza') || texto.includes('2 plz') || texto.includes('matrimonial') || texto.includes('140x190')) return '2 Plazas';
  if (texto.includes('1.5 plaza') || texto.includes('1 1/2') || texto.includes('1.5 plz') || texto.includes('105x190')) return '1.5 Plazas';
  if (texto.includes('1 plaza') || texto.includes('1 plz') || texto.includes('soltero') || texto.includes('90x190') || texto.includes('almohada')) return '1 Plaza';
  return '2 Plazas';
}

function normalizarFirmeza(prod) {
  const f = `${prod?.firmeza || ''} ${prod?.descripcion || ''}`.toLowerCase();
  if (f.includes('extra') || f.includes('bio')) return 'Extra Firme / Bio';
  if (f.includes('ortopéd') || f.includes('ortoped') || f.includes('firme')) return 'Firme Ortopédico';
  if (f.includes('suave') || f.includes('acolchado') || f.includes('soft') || f.includes('pluma')) return 'Suave Acolchado';
  return 'Confort Intermedio';
}

const PLAZAS_DISPONIBLES = [
  '1 Plaza',
  '1.5 Plazas',
  '2 Plazas',
  '2.5 Plz (Queen)',
  '3 Plz (King)',
  '3.5 Plz (Super)',
];

const FIRMEZAS_DISPONIBLES = [
  'Todas',
  'Suave Acolchado',
  'Confort Intermedio',
  'Firme Ortopédico',
  'Extra Firme / Bio',
];

function FiltrosAvanzadosContenido({
  orden,
  setOrden,
  minPrecioCatalogo,
  maxPrecioCatalogo,
  precioMaximo,
  setPrecioMaximo,
  filtroPlazas,
  togglePlaza,
  conteoPlazas,
  filtroFirmeza,
  setFirmeza,
  conteoFirmezas,
  filtroRetiro,
  setFiltroRetiro,
  filtroOfertas,
  setFiltroOfertas,
  filtroMasVendidos,
  setFiltroMasVendidos,
  conteosEspeciales,
  sucursalActiva,
  limpiarFiltros,
  totalFiltrosActivos,
  onCerrarMobile,
}) {
  return (
    <div className="space-y-space-md">
      <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-md -mt-space-md p-space-md rounded-t-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
          <span className="font-title-sm text-title-sm font-semibold text-on-surface">Filtros Avanzados</span>
          {totalFiltrosActivos > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold">
              {totalFiltrosActivos}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalFiltrosActivos > 0 && (
            <button
              type="button"
              className="font-label-subtle text-label-subtle text-primary hover:underline cursor-pointer"
              onClick={limpiarFiltros}
            >
              Limpiar todo
            </button>
          )}
          {onCerrarMobile && (
            <button
              type="button"
              onClick={onCerrarMobile}
              className="lg:hidden w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              aria-label="Cerrar filtros"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-space-xs">
        <label className="font-label-interactive text-label-interactive font-semibold text-on-surface" htmlFor={onCerrarMobile ? 'catalog-sort-mobile' : 'catalog-sort-desktop'}>
          Ordenar productos
        </label>
        <div className="relative flex min-h-11 items-center rounded-xl bg-surface-container-low px-3 text-on-surface transition-colors focus-within:ring-2 focus-within:ring-primary/20">
          <span className="material-symbols-outlined mr-2 text-[19px] text-primary">swap_vert</span>
          <select
            id={onCerrarMobile ? 'catalog-sort-mobile' : 'catalog-sort-desktop'}
            className="w-full cursor-pointer bg-transparent py-2 font-label-interactive text-label-interactive font-semibold text-on-surface outline-none"
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
          >
            <option value="recomendados" className="bg-surface-container-lowest text-on-surface">Recomendados</option>
            <option value="precio-asc" className="bg-surface-container-lowest text-on-surface">Precio: menor a mayor</option>
            <option value="precio-desc" className="bg-surface-container-lowest text-on-surface">Precio: mayor a menor</option>
            <option value="nombre" className="bg-surface-container-lowest text-on-surface">Nombre: A–Z</option>
          </select>
        </div>
      </div>

      {/* Rango de Precio */}
      <div className="space-y-space-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-interactive text-label-interactive font-semibold text-on-surface">
            Rango de Precio
          </span>
          <span className="font-label-subtle text-label-subtle text-primary font-bold">
            {formatBs(precioMaximo)}
          </span>
        </div>
        <input
          type="range"
          min={minPrecioCatalogo}
          max={maxPrecioCatalogo}
          step="20"
          value={precioMaximo}
          onChange={(e) => setPrecioMaximo(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex items-center justify-between pt-1 font-body-sm text-body-sm text-on-surface-variant text-[12px]">
          <span className="bg-surface-container-low px-2 py-0.5 rounded">{formatBs(minPrecioCatalogo)}</span>
          <span className="text-on-surface-variant">hasta</span>
          <span className="bg-surface-container-low px-2 py-0.5 rounded font-semibold text-on-surface">
            {formatBs(precioMaximo)}
          </span>
        </div>
      </div>

      {/* Medidas / Plazas */}
      <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/20">
        <div className="flex items-center justify-between">
          <span className="font-label-interactive text-label-interactive font-semibold text-on-surface">
            Medidas de Cama / Plazas
          </span>
          {filtroPlazas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                filtroPlazas.forEach((p) => togglePlaza(p));
              }}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5 font-body-sm text-body-sm">
          {PLAZAS_DISPONIBLES.map((plz) => {
            const checked = filtroPlazas.includes(plz);
            const count = conteoPlazas[plz] || 0;
            return (
              <label
                key={plz}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                  checked
                    ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlaza(plz)}
                    className="accent-primary rounded cursor-pointer"
                  />
                  <span className="truncate text-[12px]">{plz}</span>
                </span>
                <span className={`text-[11px] font-bold ${checked ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Nivel de Firmeza */}
      <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/20">
        <span className="font-label-interactive text-label-interactive font-semibold text-on-surface block">
          Nivel de Confort / Firmeza
        </span>
        <div className="space-y-1 font-body-sm text-body-sm">
          {FIRMEZAS_DISPONIBLES.map((fir) => {
            const selected = filtroFirmeza === fir;
            const count = conteoFirmezas[fir] || 0;
            return (
              <label
                key={fir}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selected
                    ? 'bg-surface-container-high font-semibold text-on-surface border border-outline-variant/30'
                    : 'hover:bg-surface-container-low text-on-surface'
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="firmeza"
                    checked={selected}
                    onChange={() => setFirmeza(fir)}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-[13px]">{fir}</span>
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    selected ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Filtros Especiales y Disponibilidad */}
      <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/20">
        <span className="font-label-interactive text-label-interactive font-semibold text-on-surface block">
          Disponibilidad &amp; Promociones
        </span>
        <div className="space-y-1.5 font-body-sm text-body-sm">
          {/* Retiro Hoy en Showroom */}
          <label className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-lg flex items-center justify-between cursor-pointer border border-outline-variant/20 transition-colors">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px]">storefront</span>
              <div>
                <span className="block text-[13px] font-semibold text-on-surface leading-tight">Retiro Hoy en Showroom</span>
                <span className="text-[11px] text-on-surface-variant">{sucursalActiva.nombre}</span>
              </div>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">
                {conteosEspeciales.enSala}
              </span>
              <input
                type="checkbox"
                checked={filtroRetiro}
                onChange={(e) => setFiltroRetiro(e.target.checked)}
                className="accent-primary rounded cursor-pointer w-4 h-4"
              />
            </div>
          </label>

          {/* Solo Ofertas Especiales */}
          <label className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-lg flex items-center justify-between cursor-pointer border border-outline-variant/20 transition-colors">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">local_fire_department</span>
              <div>
                <span className="block text-[13px] font-semibold text-on-surface leading-tight">Solo Ofertas</span>
                <span className="text-[11px] text-on-surface-variant">Precios con descuento</span>
              </div>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {conteosEspeciales.ofertas}
              </span>
              <input
                type="checkbox"
                checked={filtroOfertas}
                onChange={(e) => setFiltroOfertas(e.target.checked)}
                className="accent-primary rounded cursor-pointer w-4 h-4"
              />
            </div>
          </label>

          {/* Más Vendidos */}
          <label className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-lg flex items-center justify-between cursor-pointer border border-outline-variant/20 transition-colors">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">award_star</span>
              <div>
                <span className="block text-[13px] font-semibold text-on-surface leading-tight">Más Vendidos SCZ</span>
                <span className="text-[11px] text-on-surface-variant">Los favoritos de los clientes</span>
              </div>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-on-surface bg-surface-container-high px-1.5 py-0.5 rounded">
                {conteosEspeciales.masVendidos}
              </span>
              <input
                type="checkbox"
                checked={filtroMasVendidos}
                onChange={(e) => setFiltroMasVendidos(e.target.checked)}
                className="accent-primary rounded cursor-pointer w-4 h-4"
              />
            </div>
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
    </div>
  );
}

export default function CatalogoPage({
  sucursalActiva,
  onAgregarAlCarrito,
  categoriaInicial = 'todas',
  onCambiarCategoria,
  busquedaInicial = '',
  onLimpiarBusqueda,
  onVerDetalle,
}) {
  const [categoriaActiva, setCategoriaActiva] = useState(categoriaInicial);
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaInicial);
  const [filtroOfertas, setFiltroOfertas] = useState(false);
  const [filtroMasVendidos, setFiltroMasVendidos] = useState(false);
  const [filtroPlazas, setFiltroPlazas] = useState([]);
  const [filtroFirmeza, setFirmeza] = useState('Todas');
  const [filtroRetiro, setFiltroRetiro] = useState(false);
  const [precioMaximo, setPrecioMaximo] = useState(null);
  const [precioMaximoDebounced, setPrecioMaximoDebounced] = useState(null);
  const [limitesPrecio, setLimitesPrecio] = useState({ min: 10, max: 29000 });
  const [drawerFiltrosAbierto, setDrawerFiltrosAbierto] = useState(false);
  const [orden, setOrden] = useState('recomendados');
  const [pagina, setPagina] = useState(1);
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});
  const [productosReales, setProductosReales] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPaginas: 1 });
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    setBusquedaLocal(busquedaInicial || '');
    setPagina(1);
  }, [busquedaInicial]);

  useEffect(() => {
    setCategoriaActiva(categoriaInicial || 'todas');
    setPagina(1);
  }, [categoriaInicial]);

  useEffect(() => {
    onCambiarCategoria?.(categoriaActiva);
  }, [categoriaActiva, onCambiarCategoria]);

  // Debounce del precio para no saturar peticiones mientras se arrastra el slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrecioMaximoDebounced(precioMaximo);
    }, 350);
    return () => clearTimeout(timer);
  }, [precioMaximo]);

  // Actualizar tope máximo de precio sin encoger la barra al filtrar
  useEffect(() => {
    if (productosReales.length) {
      const precios = productosReales.map((p) => Number(p.precio) || 0).filter((p) => p > 0);
      if (precios.length) {
        const minObs = Math.floor(Math.min(...precios));
        const maxObs = Math.ceil(Math.max(...precios));
        setLimitesPrecio((prev) => ({
          min: Math.min(prev.min, minObs),
          max: Math.max(prev.max, maxObs),
        }));
      }
    }
  }, [productosReales]);

  const minPrecioCatalogo = limitesPrecio.min;
  const maxPrecioCatalogo = limitesPrecio.max;
  const precioMaximoActivo = precioMaximo !== null ? precioMaximo : maxPrecioCatalogo;

  const cambiarPrecioMaximo = (nuevoPrecio) => {
    setPrecioMaximo(nuevoPrecio);
    setPagina(1);
  };

  useEffect(() => {
    const controlador = new AbortController();

    const cargarProductos = async () => {
      setErrorCarga('');
      try {
        const precioFiltro =
          precioMaximoDebounced !== null && precioMaximoDebounced < maxPrecioCatalogo
            ? precioMaximoDebounced
            : null;

        const resultado = await listarProductos({
          signal: controlador.signal,
          pagina,
          limite: 48,
          buscar: busquedaLocal,
          categoria: categoriaActiva !== 'ofertas' && categoriaActiva !== 'todas' ? categoriaActiva : '',
          orden,
          ofertas: filtroOfertas || categoriaActiva === 'ofertas',
          precioMax: precioFiltro,
        });
        setProductosReales(resultado.productos);
        setPaginacion(resultado.paginacion);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorCarga(error.message);
        }
      }
    };

    cargarProductos();
    return () => controlador.abort();
  }, [busquedaLocal, categoriaActiva, filtroOfertas, orden, pagina, precioMaximoDebounced, sucursalActiva, maxPrecioCatalogo]);

  // Normalización con sucursal y atributos dinámicos
  const productosConDisponibilidad = useMemo(() => {
    return productosReales.map((prod) => ({
      ...prod,
      disponibilidadSucursal: evaluarDisponibilidadSucursal(prod, sucursalActiva),
      plazaNormalizada: normalizarPlaza(prod),
      firmezaNormalizada: normalizarFirmeza(prod),
    }));
  }, [productosReales, sucursalActiva]);

  // Conteos dinámicos en tiempo real para cada opción de filtro
  const conteoPlazas = useMemo(() => {
    const mapa = {};
    PLAZAS_DISPONIBLES.forEach((p) => { mapa[p] = 0; });
    productosConDisponibilidad.forEach((p) => {
      if (mapa[p.plazaNormalizada] !== undefined) {
        mapa[p.plazaNormalizada] += 1;
      } else {
        mapa['2 Plazas'] = (mapa['2 Plazas'] || 0) + 1;
      }
    });
    return mapa;
  }, [productosConDisponibilidad]);

  const conteoFirmezas = useMemo(() => {
    const mapa = { Todas: paginacion.total || productosConDisponibilidad.length };
    FIRMEZAS_DISPONIBLES.slice(1).forEach((f) => { mapa[f] = 0; });
    productosConDisponibilidad.forEach((p) => {
      if (mapa[p.firmezaNormalizada] !== undefined) {
        mapa[p.firmezaNormalizada] += 1;
      }
    });
    return mapa;
  }, [productosConDisponibilidad, paginacion.total]);

  const conteosEspeciales = useMemo(() => {
    let enSala = 0;
    let ofertas = 0;
    let masVendidos = 0;
    productosConDisponibilidad.forEach((p) => {
      if (p.disponibilidadSucursal?.inmediato) enSala += 1;
      if (p.enOferta) ofertas += 1;
      if (p.masVendido) masVendidos += 1;
    });
    return { enSala, ofertas, masVendidos };
  }, [productosConDisponibilidad]);

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
    setFiltroMasVendidos(false);
    setFiltroPlazas([]);
    setFirmeza('Todas');
    setFiltroRetiro(false);
    setPrecioMaximo(null);
    setBusquedaLocal('');
    onLimpiarBusqueda?.();
    setPagina(1);
  };

  // Cálculo de filtros activos
  const totalFiltrosActivos = useMemo(() => {
    let count = 0;
    if (precioMaximoActivo < maxPrecioCatalogo) count += 1;
    if (filtroPlazas.length > 0) count += filtroPlazas.length;
    if (filtroFirmeza !== 'Todas') count += 1;
    if (filtroRetiro) count += 1;
    if (filtroOfertas) count += 1;
    if (filtroMasVendidos) count += 1;
    if (busquedaLocal.trim()) count += 1;
    return count;
  }, [precioMaximoActivo, maxPrecioCatalogo, filtroPlazas, filtroFirmeza, filtroRetiro, filtroOfertas, filtroMasVendidos, busquedaLocal]);

  // Filtrado reactivo en memoria con priorización dinámica
  const productosFiltrados = useMemo(() => {
    return productosConDisponibilidad
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
        if (!coincideCategoriaProducto(prod, categoriaActiva)) {
          return false;
        }

        // Ofertas
        if (filtroOfertas && !prod.enOferta) return false;

        // Más Vendidos
        if (filtroMasVendidos && !prod.masVendido) return false;

        // Precio
        if (prod.precio > precioMaximoActivo) return false;

        // Plazas
        if (filtroPlazas.length > 0) {
          if (!filtroPlazas.includes(prod.plazaNormalizada)) return false;
        }

        // Firmeza
        if (filtroFirmeza && filtroFirmeza !== 'Todas') {
          if (prod.firmezaNormalizada !== filtroFirmeza) return false;
        }

        // Retiro hoy en showroom activo
        if (filtroRetiro && !prod.disponibilidadSucursal?.inmediato) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === 'precio-asc') return a.precio - b.precio;
        if (orden === 'precio-desc') return b.precio - a.precio;
        if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
        // Recomendados: prioridad a retiro inmediato en sala activa, luego enOferta, luego más vendido
        const aInmediato = a.disponibilidadSucursal?.inmediato ? 1 : 0;
        const bInmediato = b.disponibilidadSucursal?.inmediato ? 1 : 0;
        if (bInmediato !== aInmediato) return bInmediato - aInmediato;
        const aOferta = a.enOferta ? 1 : 0;
        const bOferta = b.enOferta ? 1 : 0;
        if (bOferta !== aOferta) return bOferta - aOferta;
        const aVendido = a.masVendido ? 1 : 0;
        const bVendido = b.masVendido ? 1 : 0;
        return bVendido - aVendido;
      });
  }, [
    productosConDisponibilidad,
    busquedaLocal,
    categoriaActiva,
    filtroOfertas,
    filtroMasVendidos,
    precioMaximoActivo,
    filtroPlazas,
    filtroFirmeza,
    filtroRetiro,
    orden,
  ]);

  return (
    <div className="relative w-full px-margin py-space-md">
      {/* ========================================================= */}
      {/* MOBILE / TABLET FILTER DRAWER                             */}
      {/* ========================================================= */}
      {drawerFiltrosAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerFiltrosAbierto(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest h-full shadow-2xl p-space-md overflow-y-auto flex flex-col justify-between z-10 border-l border-outline-variant/30 animate-fadeIn">
            <div>
              <FiltrosAvanzadosContenido
                orden={orden}
                setOrden={setOrden}
                minPrecioCatalogo={minPrecioCatalogo}
                maxPrecioCatalogo={maxPrecioCatalogo}
                precioMaximo={precioMaximoActivo}
                setPrecioMaximo={cambiarPrecioMaximo}
                filtroPlazas={filtroPlazas}
                togglePlaza={togglePlaza}
                conteoPlazas={conteoPlazas}
                filtroFirmeza={filtroFirmeza}
                setFirmeza={setFirmeza}
                conteoFirmezas={conteoFirmezas}
                filtroRetiro={filtroRetiro}
                setFiltroRetiro={setFiltroRetiro}
                filtroOfertas={filtroOfertas}
                setFiltroOfertas={setFiltroOfertas}
                filtroMasVendidos={filtroMasVendidos}
                setFiltroMasVendidos={setFiltroMasVendidos}
                conteosEspeciales={conteosEspeciales}
                sucursalActiva={sucursalActiva}
                limpiarFiltros={limpiarFiltros}
                totalFiltrosActivos={totalFiltrosActivos}
                onCerrarMobile={() => setDrawerFiltrosAbierto(false)}
              />
            </div>
            <div className="pt-4 border-t border-outline-variant/20 mt-4 sticky bottom-0 bg-surface-container-lowest">
              <button
                type="button"
                className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl shadow-md cursor-pointer hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
                onClick={() => setDrawerFiltrosAbierto(false)}
              >
                <span>Ver {productosFiltrados.length} resultados</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DUAL-PANEL LAYOUT: FILTERS & PRODUCT GRID                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* DESKTOP FILTER ASIDE */}
        <aside className="hidden lg:block lg:col-span-3 bg-surface-container-lowest p-space-md rounded-xl shadow-sm sticky top-48 border border-outline-variant/30">
          <FiltrosAvanzadosContenido
            orden={orden}
            setOrden={setOrden}
            minPrecioCatalogo={minPrecioCatalogo}
            maxPrecioCatalogo={maxPrecioCatalogo}
            precioMaximo={precioMaximoActivo}
            setPrecioMaximo={cambiarPrecioMaximo}
            filtroPlazas={filtroPlazas}
            togglePlaza={togglePlaza}
            conteoPlazas={conteoPlazas}
            filtroFirmeza={filtroFirmeza}
            setFirmeza={setFirmeza}
            conteoFirmezas={conteoFirmezas}
            filtroRetiro={filtroRetiro}
            setFiltroRetiro={setFiltroRetiro}
            filtroOfertas={filtroOfertas}
            setFiltroOfertas={setFiltroOfertas}
            filtroMasVendidos={filtroMasVendidos}
            setFiltroMasVendidos={setFiltroMasVendidos}
            conteosEspeciales={conteosEspeciales}
            sucursalActiva={sucursalActiva}
            limpiarFiltros={limpiarFiltros}
            totalFiltrosActivos={totalFiltrosActivos}
          />
        </aside>

        {/* PRODUCT GRID SECTION */}
        <section className="col-span-1 lg:col-span-9 space-y-space-md">
          <div className="flex justify-end lg:hidden">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-interactive font-semibold text-on-surface shadow-xs transition-colors hover:bg-surface-container-highest"
              onClick={() => setDrawerFiltrosAbierto(true)}
            >
              <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
              Filtros
              {totalFiltrosActivos > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
                  {totalFiltrosActivos}
                </span>
              )}
            </button>
          </div>

          {/* Live Alert Ribbon */}
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-2 border border-outline-variant/20">
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

          {/* ACTIVE FILTER CHIPS STRIP */}
          {totalFiltrosActivos > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 animate-fadeIn">
              <span className="text-[12px] font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">filter_alt</span>
                Filtros aplicados ({totalFiltrosActivos}):
              </span>

              {busquedaLocal.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-[12px] font-medium text-on-surface shadow-xs border border-outline-variant/30">
                  <span>Texto: "{busquedaLocal}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBusquedaLocal('');
                      onLimpiarBusqueda?.();
                    }}
                    className="hover:text-primary cursor-pointer"
                    aria-label="Quitar búsqueda"
                  >
                    ✕
                  </button>
                </span>
              )}

              {precioMaximoActivo < maxPrecioCatalogo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-[12px] font-medium text-on-surface shadow-xs border border-outline-variant/30">
                  <span>Hasta {formatBs(precioMaximoActivo)}</span>
                  <button type="button" onClick={() => setPrecioMaximo(null)} className="hover:text-primary cursor-pointer">✕</button>
                </span>
              )}

              {filtroPlazas.map((plz) => (
                <span key={plz} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold shadow-xs border border-primary/20">
                  <span>{plz}</span>
                  <button type="button" onClick={() => togglePlaza(plz)} className="hover:text-primary-container cursor-pointer">✕</button>
                </span>
              ))}

              {filtroFirmeza !== 'Todas' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-[12px] font-medium text-on-surface shadow-xs border border-outline-variant/30">
                  <span>{filtroFirmeza}</span>
                  <button type="button" onClick={() => setFirmeza('Todas')} className="hover:text-primary cursor-pointer">✕</button>
                </span>
              )}

              {filtroRetiro && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary text-[12px] font-semibold shadow-xs border border-tertiary/25">
                  <span>Retiro hoy ({sucursalActiva.nombre})</span>
                  <button type="button" onClick={() => setFiltroRetiro(false)} className="hover:text-tertiary cursor-pointer">✕</button>
                </span>
              )}

              {filtroOfertas && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[12px] font-semibold shadow-xs">
                  <span>Solo Ofertas</span>
                  <button type="button" onClick={() => setFiltroOfertas(false)} className="opacity-80 hover:opacity-100 cursor-pointer">✕</button>
                </span>
              )}

              {filtroMasVendidos && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface text-[12px] font-semibold shadow-xs">
                  <span>Más Vendidos</span>
                  <button type="button" onClick={() => setFiltroMasVendidos(false)} className="hover:text-primary cursor-pointer">✕</button>
                </span>
              )}

              <button
                type="button"
                onClick={limpiarFiltros}
                className="ml-auto text-[12px] font-bold text-primary hover:underline cursor-pointer"
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* EMPTY STATE SI NINGÚN PRODUCTO CUMPLE LOS FILTROS */}
          {productosFiltrados.length === 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-outline-variant/30 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px]">filter_list_off</span>
              </div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                No se encontraron productos con estos filtros
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                Prueba ajustando el rango de precios, seleccionando otras medidas o quitando algunos de los filtros activos.
              </p>
              <button
                type="button"
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors shadow-md cursor-pointer"
                onClick={limpiarFiltros}
              >
                Restablecer todos los filtros
              </button>
            </div>
          )}

          {/* Products 3-Column Bento Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md">
            {productosFiltrados.map((prod) => {
              const activeColorIdx = coloresSeleccionados[prod.id] || 0;
              return (
                <div
                  key={prod.id}
                  className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col justify-between hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => onVerDetalle && onVerDetalle(prod)}
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
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo-terra.png"; }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgregarAlCarrito(prod);
                      }}
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
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-lg border border-outline-variant/20">
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              Mostrando <strong>{productosFiltrados.length}</strong> de <strong>{(paginacion.total || productosReales.length || productosFiltrados.length).toLocaleString('es-BO')}</strong> productos en catálogo
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
