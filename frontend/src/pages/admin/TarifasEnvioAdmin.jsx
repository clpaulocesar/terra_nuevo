import { useEffect, useState } from 'react';
import { Edit3, MapPin, Plus, Trash2, Truck, X } from 'lucide-react';
import { actualizarTarifaEnvio, crearTarifaEnvio, eliminarTarifaEnvio, listarTarifasEnvioAdmin } from '../../services/envioService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './TarifasEnvioAdmin.css';

const tarifaVacia = { nombre: '', costo: '', activo: true };

export default function TarifasEnvioAdmin() {
  const [tarifas, setTarifas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarTarifas = async () => {
    setCargando(true);
    setError('');
    try {
      setTarifas(await listarTarifasEnvioAdmin());
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las tarifas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTarifas(); }, []);

  const guardar = async (event) => {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const datos = {
      nombre: String(formulario.get('nombre') || '').trim(),
      costo: Number(formulario.get('costo')),
      activo: formulario.get('activo') === 'on',
    };
    setGuardando(true);
    setError('');
    try {
      const guardada = editor.id
        ? await actualizarTarifaEnvio(editor.id, datos)
        : await crearTarifaEnvio(datos);
      setTarifas((actuales) => editor.id
        ? actuales.map((tarifa) => tarifa.id === guardada.id ? guardada : tarifa)
        : [...actuales, guardada]);
      setEditor(null);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la zona.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (tarifa) => {
    if (!window.confirm(`¿Eliminar la zona “${tarifa.nombre}”? Los pedidos ya registrados conservarán su tarifa.`)) return;
    try {
      await eliminarTarifaEnvio(tarifa.id);
      setTarifas((actuales) => actuales.filter((item) => item.id !== tarifa.id));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la zona.');
    }
  };

  return <section className="shipping-rates">
    <header className="shipping-rates__hero">
      <div><span><Truck size={18} /> Logística</span><h1>Tarifas de envío</h1><p>Administrá zonas, barrios y costos. Los cambios se aplican a pedidos nuevos.</p></div>
      <button type="button" onClick={() => setEditor(tarifaVacia)}><Plus size={18} /> Nueva zona</button>
    </header>
    <section className="shipping-rates__summary">
      <article><MapPin size={20} /><div><small>Zonas registradas</small><b>{tarifas.length}</b></div></article>
      <article><Truck size={20} /><div><small>Disponibles al cliente</small><b>{tarifas.filter((tarifa) => tarifa.activo).length}</b></div></article>
    </section>
    {error && <p className="shipping-rates__error" role="alert">{error}</p>}
    <section className="shipping-rates__table">
      <header><div><h2>Rango de precios de transporte</h2><p>Desactivá una zona para ocultarla temporalmente sin borrar su historial.</p></div></header>
      {cargando ? <p className="shipping-rates__state">Cargando tarifas…</p> : <div className="shipping-rates__scroll"><table><thead><tr><th>Zona o barrio</th><th>Costo</th><th>Estado</th><th aria-label="Acciones" /></tr></thead><tbody>{tarifas.map((tarifa) => <tr key={tarifa.id}><td><span className="shipping-rates__place"><MapPin size={17} /><b>{tarifa.nombre}</b></span></td><td><b>{formatoMoneda(tarifa.costo)}</b></td><td><span className={tarifa.activo ? 'shipping-rates__status is-active' : 'shipping-rates__status'}>{tarifa.activo ? 'Activa' : 'Inactiva'}</span></td><td><div className="shipping-rates__actions"><button type="button" onClick={() => setEditor(tarifa)} aria-label={`Editar ${tarifa.nombre}`}><Edit3 size={16} /></button><button type="button" onClick={() => eliminar(tarifa)} aria-label={`Eliminar ${tarifa.nombre}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {editor && <div className="shipping-rates__modal" role="dialog" aria-modal="true" aria-labelledby="titulo-editor-tarifa"><form onSubmit={guardar}><header><div><Truck size={20} /><h2 id="titulo-editor-tarifa">{editor.id ? 'Editar tarifa' : 'Nueva zona de envío'}</h2></div><button type="button" onClick={() => setEditor(null)} aria-label="Cerrar"><X /></button></header><label>Zona o barrios<input name="nombre" defaultValue={editor.nombre} maxLength="180" required /></label><label>Costo en bolivianos<input name="costo" type="number" min="0" max="10000" step="0.01" defaultValue={editor.costo} required /></label><label className="shipping-rates__toggle"><input name="activo" type="checkbox" defaultChecked={editor.activo} /> Disponible para clientes</label><footer><button type="button" onClick={() => setEditor(null)}>Cancelar</button><button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar tarifa'}</button></footer></form></div>}
  </section>;
}
