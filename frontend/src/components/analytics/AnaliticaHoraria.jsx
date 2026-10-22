import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock3, Package } from 'lucide-react';
import { obtenerAnaliticaHoraria } from '../../services/pedidoService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './AnaliticaHoraria.css';

const fechaBolivia = (dias = 0) => { const fecha = new Date(); fecha.setDate(fecha.getDate() - dias); return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(fecha); };

export default function AnaliticaHoraria({ modo = 'admin' }) {
  const [dias, setDias] = useState(modo === 'admin' ? 1 : 30);
  const [seleccion, setSeleccion] = useState(modo === 'vendedor' ? new Date().getHours() : null);
  const [datos, setDatos] = useState({ horas: [], productos: [] });
  const [cargando, setCargando] = useState(true);
  const desde = useMemo(() => fechaBolivia(dias - 1), [dias]);
  const hasta = fechaBolivia();

  useEffect(() => {
    let activo = true;
    setCargando(true);
    obtenerAnaliticaHoraria({ desde, hasta, horaInicio: seleccion, horaFin: seleccion }).then((respuesta) => {
      if (activo) setDatos(respuesta || { horas: [], productos: [] });
    }).catch(() => activo && setDatos({ horas: [], productos: [] })).finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [desde, hasta, seleccion]);

  const maximo = Math.max(1, ...datos.horas.map((hora) => Number(hora.pedidos || 0)));
  const horaPico = [...datos.horas].sort((a, b) => Number(b.pedidos) - Number(a.pedidos))[0];
  const titulo = seleccion === null ? 'Todas las horas' : `${String(seleccion).padStart(2, '0')}:00 a ${String(seleccion).padStart(2, '0')}:59`;

  return <section className={`hourly-analytics hourly-analytics--${modo}`}>
    <header><div><span><BarChart3 size={15} /> Inteligencia por horario</span><h2>{modo === 'admin' ? 'Ventas y productos por franja horaria' : 'Tendencia operativa del turno'}</h2><p>{modo === 'admin' ? 'Selecciona una hora para ver los productos que lideran la venta.' : 'Prepara inventario según el comportamiento histórico de cada hora.'}</p></div><div className="hourly-analytics__filters">{[1, 7, 30].map((valor) => <button type="button" key={valor} className={dias === valor ? 'active' : ''} onClick={() => setDias(valor)}>{valor === 1 ? 'Hoy' : `${valor} días`}</button>)}</div></header>
    <div className="hourly-analytics__peak"><Clock3 size={18} /><div><small>Hora pico del período</small><b>{horaPico?.pedidos ? `${String(horaPico.hora).padStart(2, '0')}:00` : 'Sin datos'}</b></div><span>{horaPico?.pedidos ? `${horaPico.pedidos} pedidos cobrados` : 'Aún no hay pedidos cobrados'}</span></div>
    <div className="hourly-bars" aria-label="Gráfico de pedidos por hora">{Array.from({ length: 24 }, (_, hora) => { const fila = datos.horas.find((item) => Number(item.hora) === hora) || { pedidos: 0 }; return <button type="button" key={hora} onClick={() => setSeleccion(seleccion === hora ? null : hora)} className={seleccion === hora ? 'active' : ''} title={`${String(hora).padStart(2, '0')}:00 · ${fila.pedidos} pedidos`}><i style={{ height: `${Math.max(5, Number(fila.pedidos || 0) / maximo * 100)}%` }} /><small>{hora % 3 === 0 ? `${String(hora).padStart(2, '0')}` : ''}</small></button>; })}</div>
    <div className="hourly-products"><div><h3>Productos más vendidos · {titulo}</h3><small>{desde} a {hasta}</small></div>{cargando ? <p>Cargando analítica…</p> : datos.productos.length ? <ol>{datos.productos.slice(0, 4).map((producto, indice) => <li key={`${producto.nombre}-${indice}`}><b>{indice + 1}</b><span>{producto.nombre}<small>{producto.unidades} unidades</small></span><strong>{formatoMoneda(producto.ventas)}</strong></li>)}</ol> : <p>No hay ventas cobradas en esta franja.</p>}</div>
  </section>;
}
