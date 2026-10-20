import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { listarCategorias, listarProductosPaginado } from '../services/productoService.js';

// Store del catálogo (estilo redux: estado + reducer + acciones) que vive por encima
// del router. Cachea cada página por combinación de filtros, así al volver de la
// página 2 a la 1 (o del detalle de un producto al catálogo) no se vuelve a pedir
// al backend lo que ya está en memoria. Es sólo datos de productos: nada personal.

export const LIMITE_CATALOGO = 12;

const CatalogoContext = createContext(null);

const estadoInicial = {
  // clave de filtros -> { paginas: { [n]: Producto[] }, total, totalPaginas, limite }
  consultas: {},
  // clave de filtros -> { [n]: 'cargando' | 'error' }
  estados: {},
  errores: {},
  categorias: [],
  categoriasCargadas: false,
};

export function claveFiltros({ buscar = '', categoria = '', orden = 'recomendados', limite = LIMITE_CATALOGO } = {}) {
  return JSON.stringify({ b: buscar.trim().toLowerCase(), c: categoria.trim().toLowerCase(), o: orden, l: limite });
}

function reducer(estado, accion) {
  switch (accion.type) {
    case 'pagina/cargando': {
      const { clave, pagina } = accion;
      return {
        ...estado,
        estados: { ...estado.estados, [clave]: { ...(estado.estados[clave] || {}), [pagina]: 'cargando' } },
        errores: { ...estado.errores, [clave]: { ...(estado.errores[clave] || {}), [pagina]: '' } },
      };
    }
    case 'pagina/recibida': {
      const { clave, pagina, productos, paginacion } = accion;
      const previa = estado.consultas[clave] || { paginas: {}, siguiente: {} };
      const estadosClave = { ...(estado.estados[clave] || {}) };
      delete estadosClave[pagina];
      return {
        ...estado,
        consultas: {
          ...estado.consultas,
          [clave]: {
            paginas: { ...previa.paginas, [pagina]: productos },
            // Por página: si hay otra después (sirve cuando el backend no manda total).
            siguiente: { ...(previa.siguiente || {}), [pagina]: paginacion.tieneSiguiente },
            total: paginacion.total,
            totalPaginas: paginacion.totalPaginas,
            limite: paginacion.limite,
          },
        },
        estados: { ...estado.estados, [clave]: estadosClave },
      };
    }
    case 'pagina/error': {
      const { clave, pagina, mensaje } = accion;
      return {
        ...estado,
        estados: { ...estado.estados, [clave]: { ...(estado.estados[clave] || {}), [pagina]: 'error' } },
        errores: { ...estado.errores, [clave]: { ...(estado.errores[clave] || {}), [pagina]: mensaje } },
      };
    }
    case 'categorias/recibidas':
      return { ...estado, categorias: accion.categorias, categoriasCargadas: true };
    case 'cache/limpiar':
      return { ...estadoInicial, categorias: estado.categorias, categoriasCargadas: estado.categoriasCargadas };
    default:
      return estado;
  }
}

export function CatalogoProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);
  // Peticiones en vuelo por clave+página, para no duplicar llamadas si varios
  // componentes piden lo mismo a la vez (React StrictMode monta dos veces).
  const enVuelo = useRef(new Map());
  const estadoRef = useRef(estado);
  useEffect(() => { estadoRef.current = estado; }, [estado]);

  const cargarPagina = useCallback(async (filtros, pagina) => {
    const clave = claveFiltros(filtros);
    const yaCargada = estadoRef.current.consultas[clave]?.paginas?.[pagina];
    if (yaCargada) return yaCargada;
    const idVuelo = `${clave}#${pagina}`;
    if (enVuelo.current.has(idVuelo)) return enVuelo.current.get(idVuelo);

    dispatch({ type: 'pagina/cargando', clave, pagina });
    const promesa = listarProductosPaginado({
      buscar: filtros.buscar?.trim() || '',
      categoria: filtros.categoria?.trim() || '',
      orden: filtros.orden || 'recomendados',
      limite: filtros.limite || LIMITE_CATALOGO,
      pagina,
    })
      .then(({ productos, paginacion }) => {
        dispatch({ type: 'pagina/recibida', clave, pagina, productos, paginacion });
        return productos;
      })
      .catch((error) => {
        dispatch({ type: 'pagina/error', clave, pagina, mensaje: error?.message || 'No se pudieron cargar los productos.' });
        throw error;
      })
      .finally(() => { enVuelo.current.delete(idVuelo); });
    enVuelo.current.set(idVuelo, promesa);
    return promesa;
  }, []);

  const cargarCategorias = useCallback(async () => {
    if (estadoRef.current.categoriasCargadas) return estadoRef.current.categorias;
    if (enVuelo.current.has('categorias')) return enVuelo.current.get('categorias');
    const promesa = listarCategorias()
      .then((cats) => {
        const lista = Array.isArray(cats) ? cats : [];
        dispatch({ type: 'categorias/recibidas', categorias: lista });
        return lista;
      })
      .finally(() => { enVuelo.current.delete('categorias'); });
    enVuelo.current.set('categorias', promesa);
    return promesa;
  }, []);

  const limpiarCache = useCallback(() => dispatch({ type: 'cache/limpiar' }), []);

  const valor = useMemo(
    () => ({ estado, cargarPagina, cargarCategorias, limpiarCache }),
    [estado, cargarPagina, cargarCategorias, limpiarCache]
  );

  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>;
}

// Hook de consumo: devuelve la página pedida desde caché y la carga si falta.
export function useCatalogoPaginado({ buscar = '', categoria = '', orden = 'recomendados', pagina = 1, limite = LIMITE_CATALOGO }) {
  const contexto = useContext(CatalogoContext);
  if (!contexto) throw new Error('useCatalogoPaginado debe usarse dentro de <CatalogoProvider>.');
  const { estado, cargarPagina, cargarCategorias } = contexto;

  const filtros = useMemo(() => ({ buscar, categoria, orden, limite }), [buscar, categoria, orden, limite]);
  const clave = claveFiltros(filtros);
  const consulta = estado.consultas[clave];
  const productos = consulta?.paginas?.[pagina];
  const estadoPagina = estado.estados[clave]?.[pagina];
  const error = estado.errores[clave]?.[pagina] || '';

  useEffect(() => {
    if (!productos && estadoPagina !== 'error') cargarPagina(filtros, pagina).catch(() => {});
  }, [productos, estadoPagina, filtros, pagina, cargarPagina]);

  useEffect(() => {
    if (!estado.categoriasCargadas) cargarCategorias().catch(() => {});
  }, [estado.categoriasCargadas, cargarCategorias]);

  const totalConocido = typeof consulta?.total === 'number';
  const paginasCargadas = consulta ? Object.keys(consulta.paginas).map(Number) : [];
  const ultimaCargada = paginasCargadas.length ? Math.max(...paginasCargadas) : 1;
  const tieneSiguiente = totalConocido
    ? pagina < (consulta?.totalPaginas ?? 1)
    : Boolean(consulta?.siguiente?.[pagina]);
  // Con total desconocido, el "total de páginas" es lo que se sabe hasta ahora:
  // la última cargada, más una si esa anuncia que hay siguiente.
  const totalPaginas = totalConocido
    ? (consulta?.totalPaginas ?? 1)
    : Math.max(ultimaCargada, consulta?.siguiente?.[ultimaCargada] ? ultimaCargada + 1 : ultimaCargada);

  return {
    productos: productos || [],
    enCache: Boolean(productos),
    cargando: !productos && estadoPagina !== 'error',
    error,
    total: totalConocido ? consulta.total : null,
    totalConocido,
    totalPaginas,
    tieneSiguiente,
    categorias: estado.categorias,
    categoriasCargadas: estado.categoriasCargadas,
    reintentar: () => cargarPagina(filtros, pagina).catch(() => {}),
  };
}

export function useCatalogoStore() {
  const contexto = useContext(CatalogoContext);
  if (!contexto) throw new Error('useCatalogoStore debe usarse dentro de <CatalogoProvider>.');
  return contexto;
}
