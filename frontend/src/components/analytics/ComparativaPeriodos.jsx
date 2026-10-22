import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CircleAlert, GitCompareArrows, Minus, Sparkles } from 'lucide-react';
import { obtenerComparativaPeriodos } from '../../services/pedidoService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './ComparativaPeriodos.css';

// Comparativa de períodos del dashboard: hoy vs ayer, esta semana vs la anterior,
// este mes vs el anterior o dos rangos elegidos a mano. Los totales los calcula el
// backend (GET /api/pedidos/comparativa) sobre todos los pedidos, no sólo los últimos 100.

const PRESETS = [
  { clave: 'dia', etiqueta: 'Hoy vs ayer' },
  { clave: 'semana', etiqueta: 'Esta semana vs anterior' },
  { clave: 'mes', etiqueta: 'Este mes vs anterior' },
  { clave: 'personalizado', etiqueta: 'Personalizado' },
];

const METRICAS = [
  { clave: 'ventas', etiqueta: 'Ventas cobradas', formato: formatoMoneda },
  { clave: 'pedidos', etiqueta: 'Pedidos cobrados', formato: (valor) => String(valor) },
  { clave: 'ticketPromedio', etiqueta: 'Ticket promedio', formato: formatoMoneda },
  { clave: 'unidades', etiqueta: 'Unidades vendidas', formato: (valor) => String(valor) },
  { clave: 'pedidosTotales', etiqueta: 'Pedidos registrados', formato: (valor) => String(valor), nota: 'Incluye pendientes y cancelados' },
  { clave: 'clientes', etiqueta: 'Clientes con compra', formato: (valor) => String(valor), nota: 'Sólo compras identificadas' },
  { clave: 'horaPico', etiqueta: 'Hora de mayor venta', nota: 'Franja con más ventas cobradas', formato: formatoHoraPico, valorNumerico: (pico) => Number(pico?.ventas || 0) },
];

// Hora pico: "16:00 · Bs 520,00 (3 pedidos)".
function formatoHoraPico(pico) {
  if (!pico || !pico.pedidos) return 'Sin ventas';
  return `${String(pico.hora).padStart(2, '0')}:00 · ${formatoMoneda(pico.ventas)} (${pico.pedidos} ${pico.pedidos === 1 ? 'pedido' : 'pedidos'})`;
}
const fechaLaPaz = (dias = 0) => { const fecha = new Date(); fecha.setDate(fecha.getDate() - dias); return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(fecha); };
const formatoDia = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatoPorcentaje = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 });
const etiquetaFecha = (iso) => (iso ? formatoDia.format(new Date(`${iso}T00:00:00Z`)) : '');
const etiquetaRango = ({ desde, hasta } = {}) => (!desde ? '' : desde === hasta ? etiquetaFecha(desde) : `${etiquetaFecha(desde)} – ${etiquetaFecha(hasta)}`);

// Variación entre períodos: sube, baja, igual o "nuevo" (antes no había nada).
function calcularVariacion(actual, anterior) {
  const a = Number(actual || 0); const b = Number(anterior || 0);
  if (a === b) return { tipo: 'igual', texto: 'Sin cambio', porcentaje: 0 };
  if (b === 0) return { tipo: 'nuevo', texto: 'Nuevo', porcentaje: null };
  const porcentaje = ((a - b) / b) * 100;
  return { tipo: porcentaje > 0 ? 'sube' : 'baja', porcentaje, texto: `${porcentaje > 0 ? '+' : '−'}${formatoPorcentaje.format(Math.abs(porcentaje))} %` };
}

const ICONO_VARIACION = { sube: ArrowUpRight, baja: ArrowDownRight, igual: Minus, nuevo: Sparkles };

export default function ComparativaPeriodos({ id, actualizadoEn = null }) {
  const [periodo, setPeriodo] = useState('dia');
  const [rangoLibre, setRangoLibre] = useState(() => ({ desde: fechaLaPaz(), hasta: fechaLaPaz(), desde2: fechaLaPaz(1), hasta2: fechaLaPaz(1) }));
  const [consulta, setConsulta] = useState({ periodo: 'dia' });
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const elegirPreset = (clave) => {
    setPeriodo(clave);
    if (clave !== 'personalizado') setConsulta({ periodo: clave });
  };
  const compararRangoLibre = (evento) => {
    evento.preventDefault();
    setError('');
    const { desde, hasta, desde2, hasta2 } = rangoLibre;
    if (!desde || !hasta || !desde2 || !hasta2) return setError('Completa las cuatro fechas para comparar.');
    if (desde > hasta || desde2 > hasta2) return setError('En cada período la fecha inicial debe ser anterior o igual a la final.');
    setConsulta({ periodo: 'personalizado', desde, hasta, desde2, hasta2 });
  };
  const cambiarFecha = (campo) => (evento) => setRangoLibre((valor) => ({ ...valor, [campo]: evento.target.value }));

  const cargar = useCallback(async (parametros) => {
    setCargando(true);
    try {
      const respuesta = await obtenerComparativaPeriodos(parametros);
      setDatos(respuesta?.actual ? respuesta : null);
      setError('');
    } catch (err) {
      setDatos(null);
      setError(err?.message || 'No se pudo calcular la comparación.');
    } finally { setCargando(false); }
  }, []);

  // Se recalcula al cambiar el período elegido y cuando el dashboard se refresca.
  useEffect(() => { cargar(consulta); }, [consulta, actualizadoEn, cargar]);

  const filas = useMemo(() => {
    if (!datos) return [];
    return METRICAS.map((metrica) => { const actual = datos.actual[metrica.clave]; const anterior = datos.anterior[metrica.clave]; const numero = metrica.valorNumerico || ((valor) => valor); return { ...metrica, actual, anterior, variacion: calcularVariacion(numero(actual), numero(anterior)) }; });
  }, [datos]);
  const ventas = filas.find((fila) => fila.clave === 'ventas');
  const resumenVentas = !ventas ? '' : ventas.variacion.tipo === 'igual' ? 'Las ventas cobradas se mantienen iguales.'
    : ventas.variacion.tipo === 'nuevo' ? 'En el período anterior no hubo ventas cobradas.'
      : `Las ventas cobradas ${ventas.variacion.tipo === 'sube' ? 'subieron' : 'bajaron'} ${ventas.variacion.texto.slice(1)} (${formatoMoneda(Math.abs(Number(ventas.actual) - Number(ventas.anterior)))}).`;

  return <section className="comparativa dash-card" id={id} aria-label="Comparativa de períodos" aria-busy={cargando}>
    <header>
      <div><span><GitCompareArrows size={15} /> Comparativa</span><h2>Comparar períodos</h2><p>Ventas cobradas en zona horaria de Bolivia. Semana y mes se comparan hasta la fecha con la misma porción del período anterior.</p></div>
      <div className="comparativa__filtros" role="group" aria-label="Período a comparar">{PRESETS.map((preset) => <button key={preset.clave} type="button" className={periodo === preset.clave ? 'active' : ''} aria-pressed={periodo === preset.clave} onClick={() => elegirPreset(preset.clave)}>{preset.etiqueta}</button>)}</div>
    </header>

    {periodo === 'personalizado' && <form className="comparativa__personalizado" onSubmit={compararRangoLibre}>
      <fieldset><legend>Período A</legend><label>Desde<input type="date" value={rangoLibre.desde} max={rangoLibre.hasta || undefined} onChange={cambiarFecha('desde')} required /></label><label>Hasta<input type="date" value={rangoLibre.hasta} min={rangoLibre.desde || undefined} onChange={cambiarFecha('hasta')} required /></label></fieldset>
      <fieldset><legend>Período B</legend><label>Desde<input type="date" value={rangoLibre.desde2} max={rangoLibre.hasta2 || undefined} onChange={cambiarFecha('desde2')} required /></label><label>Hasta<input type="date" value={rangoLibre.hasta2} min={rangoLibre.desde2 || undefined} onChange={cambiarFecha('hasta2')} required /></label></fieldset>
      <button type="submit" disabled={cargando}>Comparar</button>
    </form>}

    {error && <p className="comparativa__error" role="alert"><CircleAlert size={16} />{error}</p>}

    {datos && <div className="comparativa__rangos"><div><small>{datos.periodo === 'personalizado' ? 'Período A' : 'Período actual'}</small><b>{etiquetaRango(datos.actual)}</b></div><div><small>{datos.periodo === 'personalizado' ? 'Período B' : 'Período anterior'}</small><b>{etiquetaRango(datos.anterior)}</b></div></div>}

    <div className="comparativa__tabla-wrap">
      <table className="comparativa__tabla">
        <thead><tr><th scope="col">Indicador</th><th scope="col">{datos?.periodo === 'personalizado' ? 'Período A' : 'Actual'}</th><th scope="col">{datos?.periodo === 'personalizado' ? 'Período B' : 'Anterior'}</th><th scope="col">Variación</th></tr></thead>
        <tbody>
          {cargando && !datos && <tr><td colSpan={4} className="comparativa__vacio">Calculando comparación…</td></tr>}
          {!cargando && !datos && !error && <tr><td colSpan={4} className="comparativa__vacio">Sin datos para comparar.</td></tr>}
          {filas.map((fila) => { const Icono = ICONO_VARIACION[fila.variacion.tipo]; return <tr key={fila.clave} className={cargando ? 'dash-loading' : ''}>
            <th scope="row">{fila.etiqueta}{fila.nota && <small>{fila.nota}</small>}</th>
            <td className="comparativa__actual">{fila.formato(fila.actual)}</td>
            <td className="comparativa__anterior">{fila.formato(fila.anterior)}</td>
            <td><span className={`comparativa__delta comparativa__delta--${fila.variacion.tipo}`}><Icono size={14} aria-hidden="true" />{fila.variacion.texto}</span></td>
          </tr>; })}
        </tbody>
      </table>
    </div>
    {resumenVentas && <p className="comparativa__nota" aria-live="polite">{resumenVentas}</p>}
  </section>;
}
