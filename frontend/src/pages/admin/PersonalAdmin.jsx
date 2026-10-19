import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, Plus, ShieldCheck, Truck, Users, X } from 'lucide-react';
import { crearPersonal, listarPersonal } from '../../services/personalService.js';
import './PersonalAdmin.css';

const ROLES = {
  admin: { etiqueta: 'Administrador', descripcion: 'Gestiona la operación y la configuración.', icono: ShieldCheck },
  vendedor: { etiqueta: 'Vendedor', descripcion: 'Atiende ventas y pedidos en sucursal.', icono: BriefcaseBusiness },
  despacho: { etiqueta: 'Despacho', descripcion: 'Prepara y entrega pedidos.', icono: Truck },
};
const vacio = { nombre: '', email: '', password: '', rol: 'vendedor' };

export default function PersonalAdmin() {
  const [personal, setPersonal] = useState([]);
  const [formulario, setFormulario] = useState(vacio);
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarPersonal().then(setPersonal).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, []);

  const conteos = useMemo(() => Object.fromEntries(Object.keys(ROLES).map((rol) => [rol, personal.filter((persona) => persona.rol === rol).length])), [personal]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setGuardando(true); setError('');
    try {
      const nuevo = await crearPersonal(formulario);
      setPersonal((actual) => [nuevo, ...actual]);
      setFormulario(vacio); setModal(false);
    } catch (e) { setError(e.message || 'No se pudo registrar al personal.'); }
    finally { setGuardando(false); }
  };

  return <main className="staff-admin">
    <header className="staff-heading">
      <div><span>Administración interna</span><h1>Personal administrativo</h1><p>Registra las cuentas del equipo y su función operativa.</p></div>
      <button type="button" onClick={() => setModal(true)}><Plus size={18} /> Registrar personal</button>
    </header>
    {error && <p className="staff-error" role="alert">{error}</p>}
    <section className="staff-kpis">
      {Object.entries(ROLES).map(([rol, dato]) => {
        const Icono = dato.icono;
        return <article key={rol}><Icono /><small>{dato.etiqueta}</small><b>{conteos[rol]}</b><span>{dato.descripcion}</span></article>;
      })}
    </section>
    <section className="staff-card">
      <header><div><Users size={20} /><h2>Equipo registrado</h2></div><span>{personal.length} cuentas</span></header>
      {cargando ? <p>Cargando personal…</p> : <div className="staff-table-wrap"><table><thead><tr><th>Colaborador</th><th>Rol</th><th>Correo</th><th>Estado</th><th>Registro</th></tr></thead><tbody>
        {personal.length ? personal.map((persona) => <tr key={persona.id}><td><b>{persona.nombre}</b></td><td><span className={`staff-role staff-role--${persona.rol}`}>{ROLES[persona.rol]?.etiqueta || persona.rol}</span></td><td>{persona.email}</td><td><span className={persona.activo ? 'staff-active' : 'staff-inactive'}>{persona.activo ? 'Activo' : 'Inactivo'}</span></td><td>{new Date(persona.fecha_registro).toLocaleDateString('es-BO')}</td></tr>) : <tr><td colSpan="5">Aún no hay personal registrado.</td></tr>}
      </tbody></table></div>}
    </section>
    {modal && <div className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-title"><form onSubmit={enviar}>
      <header><div><h2 id="staff-title">Registrar personal</h2><p>Se creará una cuenta de acceso en Supabase.</p></div><button type="button" aria-label="Cerrar" onClick={() => !guardando && setModal(false)}><X /></button></header>
      <div className="staff-form">
        <label>Nombre completo<input name="nombre" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required minLength="2" maxLength="120" /></label>
        <label>Correo electrónico<input name="email" type="email" value={formulario.email} onChange={(e) => setFormulario({ ...formulario, email: e.target.value })} required maxLength="150" /></label>
        <label>Rol<select value={formulario.rol} onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}>{Object.entries(ROLES).map(([rol, dato]) => <option value={rol} key={rol}>{dato.etiqueta}</option>)}</select><small>{ROLES[formulario.rol].descripcion}</small></label>
        <label>Contraseña temporal<input name="password" type="password" value={formulario.password} onChange={(e) => setFormulario({ ...formulario, password: e.target.value })} required minLength="8" maxLength="128" autoComplete="new-password" /><small>Comparte esta contraseña de forma segura.</small></label>
      </div>
      <footer><button type="button" className="staff-cancel" onClick={() => setModal(false)} disabled={guardando}>Cancelar</button><button className="staff-save" disabled={guardando}><BadgeCheck size={18} />{guardando ? 'Registrando…' : 'Crear cuenta'}</button></footer>
    </form></div>}
  </main>;
}
