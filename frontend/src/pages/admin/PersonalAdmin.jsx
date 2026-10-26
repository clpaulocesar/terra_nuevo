import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, Mail, Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2, Truck, Users, X } from 'lucide-react';
import { actualizarPersonal, crearPersonal, eliminarPersonal, listarPersonal } from '../../services/personalService.js';
import './PersonalAdmin.css';

const ROLES = {
  admin: { etiqueta: 'Administrador', descripcion: 'Gestiona la operación y la configuración.', icono: ShieldCheck },
  vendedor: { etiqueta: 'Vendedor', descripcion: 'Atiende ventas y pedidos en sucursal.', icono: BriefcaseBusiness },
  despacho: { etiqueta: 'Despacho', descripcion: 'Prepara y entrega pedidos.', icono: Truck },
};
const vacio = { nombre: '', email: '', password: '', rol: 'vendedor', vehiculo: '', placa: '' };
const iniciales = (nombre) => String(nombre || '?').split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

export default function PersonalAdmin() {
  const [personal, setPersonal] = useState([]);
  const [formulario, setFormulario] = useState(vacio);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    listarPersonal().then(setPersonal).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, []);

  // Escape cierra el modal de registro (accesibilidad de teclado).
  useEffect(() => {
    if (!modal) return undefined;
    const alEscape = (evento) => { if (evento.key === 'Escape' && !guardando) setModal(false); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [modal, guardando]);

  const conteos = useMemo(() => Object.fromEntries(Object.keys(ROLES).map((rol) => [rol, personal.filter((persona) => persona.rol === rol).length])), [personal]);
  const lista = useMemo(() => personal.filter((persona) => {
    const texto = `${persona.nombre || ''} ${persona.email || ''} ${persona.rol || ''} ${persona.vehiculo || ''} ${persona.placa || ''}`.toLowerCase();
    const coincideBusqueda = texto.includes(buscar.toLowerCase());
    const coincideRol = filtroRol === 'todos' || persona.rol === filtroRol;
    const coincideEstado = filtroEstado === 'todos' || (filtroEstado === 'activo' ? persona.activo !== false : persona.activo === false);
    return coincideBusqueda && coincideRol && coincideEstado;
  }), [personal, buscar, filtroRol, filtroEstado]);
  const porPagina = 10;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const personalPagina = lista.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  useEffect(() => { setPagina(1); }, [buscar, filtroRol, filtroEstado]);

  const abrirRegistro = () => {
    setError('');
    setEditando(null);
    setFormulario(vacio);
    setModal(true);
  };

  const abrirEdicion = (persona) => {
    setError('');
    setEditando(persona);
    setFormulario({
      nombre: persona.nombre || '',
      email: persona.email || '',
      password: '',
      rol: persona.rol || 'vendedor',
      vehiculo: persona.vehiculo || '',
      placa: persona.placa || '',
      activo: persona.activo !== false,
    });
    setModal(true);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setGuardando(true); setError('');
    try {
      if (editando) {
        const actualizado = await actualizarPersonal(editando.id, formulario);
        setPersonal((actual) => actual.map((persona) => persona.id === actualizado.id ? actualizado : persona));
      } else {
        const nuevo = await crearPersonal(formulario);
        setPersonal((actual) => [nuevo, ...actual]);
      }
      setFormulario(vacio); setModal(false);
    } catch (e) { setError(e.message || 'No se pudo registrar al personal.'); }
    finally { setGuardando(false); }
  };

  const borrar = async (persona) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${persona.nombre}? Sus envíos pendientes quedarán sin asignar.`)) return;
    setGuardando(true); setError('');
    try {
      await eliminarPersonal(persona.id);
      setPersonal((actual) => actual.filter((cuenta) => cuenta.id !== persona.id));
    } catch (e) { setError(e.message || 'No se pudo eliminar la cuenta.'); }
    finally { setGuardando(false); }
  };

  return <main className="staff-admin">
    <header className="staff-heading">
      <div className="staff-heading-copy"><div className="staff-heading-title"><span className="staff-heading-icon"><Users size={29} /></span><div><em>Administración interna</em><h1>Personal administrativo</h1></div></div><p>Registra las cuentas del equipo y su función operativa.</p></div>
      <button type="button" onClick={abrirRegistro}><Plus size={18} /> Registrar personal</button>
    </header>
    {error && <p className="staff-error" role="alert">{error}</p>}
    <section className="staff-kpis">
      <article className="staff-kpi staff-kpi--total"><span className="staff-kpi-icon"><Users size={28} /></span><div><small>Total de personal</small><b>{personal.length}</b><span>Cuentas registradas</span></div><SlidersHorizontal className="staff-kpi-watermark" size={31} /></article>
      {Object.entries(ROLES).map(([rol, dato]) => {
        const Icono = dato.icono;
        const etiquetaKpi = rol === 'admin' ? 'Administradores' : rol === 'vendedor' ? 'Vendedores' : 'Despacho';
        return <article key={rol} className={`staff-kpi staff-kpi--${rol}`}><span className="staff-kpi-icon"><Icono size={28} /></span><div><small>{etiquetaKpi}</small><b>{conteos[rol]}</b><span>{dato.descripcion}</span></div><SlidersHorizontal className="staff-kpi-watermark" size={31} /></article>;
      })}
    </section>
    <section className="staff-filters"><label className="staff-search"><Search size={21} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar por nombre, correo, rol, vehículo o placa..." aria-label="Buscar personal" /></label><label className="staff-select"><Users size={18} /><select value={filtroRol} onChange={(event) => setFiltroRol(event.target.value)} aria-label="Filtrar por rol"><option value="todos">Todos los roles</option>{Object.entries(ROLES).map(([rol, dato]) => <option key={rol} value={rol}>{dato.etiqueta}</option>)}</select></label><label className="staff-select"><SlidersHorizontal size={18} /><select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} aria-label="Filtrar por estado"><option value="todos">Todos los estados</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select></label><button type="button" onClick={() => { setBuscar(''); setFiltroRol('todos'); setFiltroEstado('todos'); }}><X size={17} /> Limpiar</button></section>
    <section className="staff-card">
      <header><div className="staff-card-title"><span><Users size={23} /></span><div><h2>Equipo registrado</h2><p>Mostrando {lista.length} cuentas · Página {paginaSegura} de {totalPaginas}</p></div></div><div className="staff-pagination"><button type="button" aria-label="Página anterior" onClick={() => setPagina((actual) => Math.max(1, actual - 1))} disabled={paginaSegura <= 1}><ChevronLeft size={18} /></button><span>{paginaSegura}</span><button type="button" aria-label="Página siguiente" onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} disabled={paginaSegura >= totalPaginas}><ChevronRight size={18} /></button></div></header>
      {cargando ? <p>Cargando personal…</p> : <div className="staff-table-wrap"><table><thead><tr><th>Colaborador</th><th>Rol</th><th>Correo</th><th>Vehículo / placa</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>
        {personalPagina.length ? personalPagina.map((persona) => <tr key={persona.id}><td><div className="staff-person"><i>{iniciales(persona.nombre)}</i><div><b>{persona.nombre}</b><small>ID: {persona.id}</small></div></div></td><td><span className={`staff-role staff-role--${persona.rol}`}>{ROLES[persona.rol]?.etiqueta || persona.rol}</span></td><td><span className="staff-email"><Mail size={16} />{persona.email}</span></td><td>{persona.rol === 'despacho' ? [persona.vehiculo, persona.placa].filter(Boolean).join(' · ') || '—' : '—'}</td><td><span className={persona.activo !== false ? 'staff-active' : 'staff-inactive'}>{persona.activo !== false ? 'Activo' : 'Inactivo'}</span></td><td><span className="staff-date"><CalendarDays size={16} />{new Date(persona.fecha_registro).toLocaleDateString('es-BO')}</span></td><td><div className="staff-actions"><button type="button" className="staff-cancel" onClick={() => abrirEdicion(persona)} disabled={guardando} aria-label={`Editar a ${persona.nombre}`}><Pencil size={16} aria-hidden="true" /></button><button type="button" className="staff-save" onClick={() => borrar(persona)} disabled={guardando} aria-label={`Eliminar a ${persona.nombre}`}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>) : <tr><td className="staff-empty" colSpan="7">No se encontró personal con estos filtros.</td></tr>}
      </tbody></table></div>}
    </section>
    {modal && <div className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-title"><form onSubmit={enviar}>
      <header><div><h2 id="staff-title">{editando ? 'Editar personal' : 'Registrar personal'}</h2><p>{editando ? 'Actualiza los datos operativos de la cuenta.' : 'Se creará una cuenta de acceso en Supabase.'}</p></div><button type="button" aria-label="Cerrar" onClick={() => !guardando && setModal(false)}><X /></button></header>
      <div className="staff-form">
        <label>Nombre completo<input name="nombre" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required minLength="2" maxLength="120" /></label>
        <label>Correo electrónico<input name="email" type="email" value={formulario.email} onChange={(e) => setFormulario({ ...formulario, email: e.target.value })} required maxLength="150" disabled={Boolean(editando)} /></label>
        <label>Rol<select value={formulario.rol} onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })} disabled={Boolean(editando)}>{Object.entries(ROLES).map(([rol, dato]) => <option value={rol} key={rol}>{dato.etiqueta}</option>)}</select><small>{ROLES[formulario.rol].descripcion}</small></label>
        {formulario.rol === 'despacho' && <>
          <label>Vehículo<input name="vehiculo" value={formulario.vehiculo} onChange={(e) => setFormulario({ ...formulario, vehiculo: e.target.value })} maxLength="60" placeholder="Moto, auto, furgoneta…" /><small>Se puede completar o editar después en Repartidores.</small></label>
          <label>Número de placa<input name="placa" value={formulario.placa} onChange={(e) => setFormulario({ ...formulario, placa: e.target.value.toUpperCase() })} minLength="3" maxLength="12" placeholder="ABC123" /></label>
        </>}
        {!editando && <label>Contraseña temporal<input name="password" type="password" value={formulario.password} onChange={(e) => setFormulario({ ...formulario, password: e.target.value })} required minLength="8" maxLength="128" autoComplete="new-password" /><small>Comparte esta contraseña de forma segura.</small></label>}
        {editando && <label>Estado<select value={formulario.activo ? 'activo' : 'inactivo'} onChange={(e) => setFormulario({ ...formulario, activo: e.target.value === 'activo' })}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select><small>Las cuentas inactivas no pueden iniciar sesión.</small></label>}
      </div>
      <footer><button type="button" className="staff-cancel" onClick={() => setModal(false)} disabled={guardando}>Cancelar</button><button className="staff-save" disabled={guardando}><BadgeCheck size={18} />{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cuenta'}</button></footer>
    </form></div>}
  </main>;
}
