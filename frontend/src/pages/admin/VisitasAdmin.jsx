import { useEffect, useState } from 'react';
import { CalendarDays, Eye, LayoutDashboard, MousePointerClick, RefreshCw, Users } from 'lucide-react';
import { obtenerAnaliticaVisitas } from '../../services/visitaService.js';
import './Admin.css';
import './ReportesAdmin.css';

const FORMATO_NUMERO = new Intl.NumberFormat('es-BO');
const ANALITICA_VACIA = {
  totalVistas: 0,
  sesionesUnicas: 0,
  porDia: [],
  paginas: [],
};
const ETIQUETAS_PAGINA = {
  '/': 'Inicio',
  '/catalogo': 'Catálogo',
  '/productos': 'Detalle de producto',
  '/carrito': 'Carrito',
  '/checkout': 'Finalizar compra',
};

function fechaISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function rangoDeDias(dias) {
  const hasta = new Date();
  const desde = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() - dias + 1);
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
}

function formatoFecha(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function numero(valor) {
  return FORMATO_NUMERO.format(Number(valor || 0));
}

export default function VisitasAdmin() {
  const [rango, setRango] = useState(() => rangoDeDias(30));
  const [analitica, setAnalitica] = useState(ANALITICA_VACIA);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controlador = new AbortController();

    obtenerAnaliticaVisitas({ ...rango, signal: controlador.signal })
      .then(setAnalitica)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setAnalitica(ANALITICA_VACIA);
        setError(err.message || 'No se pudieron cargar las visitas.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, [rango]);

  const paginaMasVista = analitica.paginas[0];
  const diaMasVisitado = [...analitica.porDia].sort((a, b) => b.vistas - a.vistas)[0];
  const kpis = [
    {
      etiqueta: 'Vistas de página',
      valor: numero(analitica.totalVistas),
      detalle: 'Cargas y cambios de página',
      icono: Eye,
    },
    {
      etiqueta: 'Sesiones anónimas',
      valor: numero(analitica.sesionesUnicas),
      detalle: 'Por pestaña del navegador',
      icono: Users,
    },
    {
      etiqueta: 'Vistas por sesión',
      valor: analitica.sesionesUnicas
        ? (analitica.totalVistas / analitica.sesionesUnicas).toFixed(1)
        : '0',
      detalle: 'Promedio del período',
      icono: MousePointerClick,
    },
    {
      etiqueta: 'Página más vista',
      valor: paginaMasVista ? ETIQUETAS_PAGINA[paginaMasVista.pagina] : '—',
      detalle: `${numero(paginaMasVista?.vistas)} vistas`,
      icono: LayoutDashboard,
    },
    {
      etiqueta: 'Día con más visitas',
      valor: diaMasVisitado ? formatoFecha(diaMasVisitado.fecha) : '—',
      detalle: `${numero(diaMasVisitado?.vistas)} vistas`,
      icono: CalendarDays,
    },
    {
      etiqueta: 'Páginas consultadas',
      valor: numero(analitica.paginas.length),
      detalle: 'Secciones con actividad',
      icono: Eye,
    },
  ];

  const cambiarDias = (dias) => {
    setCargando(true);
    setError('');
    setAnalitica(ANALITICA_VACIA);
    setRango(rangoDeDias(dias));
  };
  const actualizarFecha = (campo, valor) => {
    setCargando(true);
    setError('');
    setAnalitica(ANALITICA_VACIA);
    setRango((actual) => ({ ...actual, [campo]: valor }));
  };
  const actualizar = () => {
    setCargando(true);
    setError('');
    setAnalitica(ANALITICA_VACIA);
    setRango({ ...rango });
  };
  const rangoInvalido = !rango.desde || !rango.hasta || rango.desde > rango.hasta;

  return (
    <main className="reports reports--visitas">
      <header className="rep-hero">
        <div className="rep-hero__text">
          <span className="rep-eyebrow"><i /> Tráfico del sitio público</span>
          <h1>Visitas web</h1>
          <p>Vistas de página y sesiones anónimas, sin registrar datos personales.</p>
        </div>
        <div className="rep-actions">
          <button type="button" className="rep-btn rep-btn--primary" onClick={actualizar} disabled={cargando}>
            <RefreshCw size={17} className={cargando ? 'rep-spin' : ''} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </header>

      <section className="rep-filters" aria-label="Filtrar visitas por fecha">
        <div className="rep-filters__pills">
          <span className="rep-filters__label">Período</span>
          {[7, 30, 90].map((dias) => (
            <button type="button" key={dias} className="rep-pill" onClick={() => cambiarDias(dias)}>
              Últimos {dias} días
            </button>
          ))}
        </div>
        <div className="rep-filters__fields">
          <label>
            <span>Desde</span>
            <input
              type="date"
              value={rango.desde}
              onChange={(evento) => actualizarFecha('desde', evento.target.value)}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              value={rango.hasta}
              onChange={(evento) => actualizarFecha('hasta', evento.target.value)}
            />
          </label>
        </div>
      </section>

      {rangoInvalido && <p className="rep-alert" role="alert">Selecciona un rango de fechas válido.</p>}
      {error && <p className="rep-alert" role="alert">{error}</p>}

      <section className="rep-kpis" aria-label="Resumen de visitas">
        {kpis.map(({ etiqueta, valor, detalle, icono: Icono }) => (
          <article className="rep-kpi" key={etiqueta}>
            <div className="rep-kpi__top"><span>{etiqueta}</span><i><Icono size={17} /></i></div>
            <b>{error ? '—' : cargando ? '…' : valor}</b>
            <small className="rep-badge rep-badge--neutro">
              {error ? 'No disponible: verifica la conexión con la API' : detalle}
            </small>
          </article>
        ))}
      </section>

      <section className="rep-charts">
        <article className="rep-card rep-card--table">
          <header className="rep-card__head">
            <div>
              <h2>Tráfico por día</h2>
              <p>Vistas y sesiones en el período seleccionado.</p>
            </div>
          </header>
          <div className="rep-table-wrap">
            <table className="rep-table">
              <thead><tr><th>Fecha</th><th>Vistas</th><th>Sesiones anónimas</th></tr></thead>
              <tbody>
                {error && <tr><td colSpan="3" className="rep-empty">No se pudieron cargar las visitas.</td></tr>}
                {cargando && !error && (
                  <tr><td colSpan="3" className="rep-empty">Cargando visitas…</td></tr>
                )}
                {!cargando && !error && analitica.porDia.length === 0 && (
                  <tr><td colSpan="3" className="rep-empty">No hay visitas en el período seleccionado.</td></tr>
                )}
                {!cargando && !error && analitica.porDia.map((dia) => (
                  <tr key={dia.fecha}>
                    <td>{formatoFecha(dia.fecha)}</td>
                    <td><b>{numero(dia.vistas)}</b></td>
                    <td>{numero(dia.sesiones)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rep-card rep-card--table">
          <header className="rep-card__head">
            <div>
              <h2>Páginas más consultadas</h2>
              <p>Popularidad de cada sección pública.</p>
            </div>
          </header>
          <div className="rep-table-wrap">
            <table className="rep-table">
              <thead><tr><th>Página</th><th>Vistas</th><th>Sesiones</th></tr></thead>
              <tbody>
                {error && <tr><td colSpan="3" className="rep-empty">No se pudieron cargar las visitas.</td></tr>}
                {cargando && !error && (
                  <tr><td colSpan="3" className="rep-empty">Cargando visitas…</td></tr>
                )}
                {!cargando && !error && analitica.paginas.length === 0 && (
                  <tr><td colSpan="3" className="rep-empty">Todavía no hay páginas consultadas.</td></tr>
                )}
                {!cargando && !error && analitica.paginas.map((pagina) => (
                  <tr key={pagina.pagina}>
                    <td><b>{ETIQUETAS_PAGINA[pagina.pagina] || pagina.pagina}</b></td>
                    <td>{numero(pagina.vistas)}</td>
                    <td>{numero(pagina.sesiones)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
