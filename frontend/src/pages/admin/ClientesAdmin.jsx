import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownUp, ChevronLeft, ChevronRight, Crown, Eye, EyeOff, KeyRound, MessageCircle, Search, ShoppingCart, Trash2, UserPlus, Users, X } from 'lucide-react';
import { asignarClaveMayorista, crearUsuarioMayorista, eliminarCliente, listarClientes } from '../../services/clienteService.js';
import { getAdminUser } from '../../services/adminService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { avisoEliminado, avisoError, avisoExito, confirmarEliminacion } from '../../utils/alertas.js';
import './Admin.css';
import './ClientesAdmin.css';
import './ClientesAdminDelivery.css';
import './AdminViewsColorFix.css';

const iniciales = (nombre) => String(nombre || '?').split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [compras, setCompras] = useState('todas');
  const [orden, setOrden] = useState('recientes');
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [formulario, setFormulario] = useState({ nombre: '', email: '', telefono: '', nit: '', password: '' });
  const [asignandoClave, setAsignandoClave] = useState(null);
  const esAdmin = getAdminUser()?.rol === 'admin';

  useEffect(() => {
    listarClientes({ limite: 100 }).then(setClientes).catch((err) => setError(err.message));
  }, []);

  // Escape cierra el formulario de usuario mayorista (accesibilidad de teclado).
  useEffect(() => {
    if (!mostrarFormulario) return undefined;
    const alEscape = (event) => { if (event.key === 'Escape' && !guardando) setMostrarFormulario(false); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [mostrarFormulario, guardando]);

  const lista = useMemo(() => clientes.filter((cliente) => {
    const coincideBusqueda = `${cliente.nombre} ${cliente.telefono || ''} ${cliente.email || ''} ${cliente.nit || ''} ${cliente.direccion || ''}`.toLowerCase().includes(buscar.toLowerCase());
    const esMayorista = cliente.rol === 'mayorista';
    const coincideCompras = compras === 'todas' || (compras === 'con-compras' ? Number(cliente.compras) > 0 : Number(cliente.compras) === 0);
    return coincideBusqueda && coincideCompras && (tipo === 'todos' || (tipo === 'mayorista' ? esMayorista : !esMayorista));
  }), [clientes, buscar, tipo, compras]);

  const listaOrdenada = useMemo(() => [...lista].sort((a, b) => {
    if (orden === 'nombre') return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    if (orden === 'gasto') return Number(b.gasto || 0) - Number(a.gasto || 0);
    if (orden === 'compras') return Number(b.compras || 0) - Number(a.compras || 0);
    return new Date(b.fecha_registro || 0) - new Date(a.fecha_registro || 0);
  }), [lista, orden]);

  const porPagina = 10;
  const totalPaginas = Math.max(1, Math.ceil(listaOrdenada.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginaClientes = listaOrdenada.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  useEffect(() => { setPagina(1); }, [buscar, tipo, compras, orden]);

  const borrarCliente = async (cliente) => {
    const tienePedidos = Number(cliente.compras) > 0;
    const confirmado = await confirmarEliminacion({
      titulo: `¿Eliminar a ${cliente.nombre}?`,
      texto: tienePedidos
        ? `Se borrará de la base de datos. Sus ${cliente.compras} pedido(s) se conservan, pero quedarán como "Compra como invitado". No podrás revertir esta acción.`
        : 'Se borrará de la base de datos. No podrás revertir esta acción.',
    });
    if (!confirmado) return;

    setEliminando(cliente.id);
    setError('');
    try {
      await eliminarCliente(cliente.id);
      setClientes((actuales) => actuales.filter((item) => item.id !== cliente.id));
      await avisoEliminado(
        tienePedidos
          ? `Cliente ${cliente.nombre} eliminado. Sus pedidos quedaron como "Compra como invitado".`
          : `Cliente ${cliente.nombre} eliminado.`
      );
    } catch (err) {
      await avisoError(err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setEliminando(null);
    }
  };

  // Los mayoristas ya no tienen cuenta externa: el administrador les asigna la clave.
  const asignarClave = async (cliente) => {
    const valor = window.prompt(`Nueva contraseña para ${cliente.nombre} (mínimo 8 caracteres):`, '');
    if (valor === null) return;
    const password = String(valor);
    if (password.length < 8 || password.length > 128) {
      await avisoError('La contraseña debe tener entre 8 y 128 caracteres.');
      return;
    }
    setAsignandoClave(cliente.id);
    try {
      await asignarClaveMayorista(cliente.id, password);
      await avisoExito({ titulo: 'Clave asignada', texto: `Compartila de forma segura con ${cliente.nombre}.` });
    } catch (err) {
      await avisoError(err.message || 'No se pudo asignar la clave.');
    } finally {
      setAsignandoClave(null);
    }
  };

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const crearMayorista = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const nuevo = await crearUsuarioMayorista(formulario);
      setClientes((actuales) => [nuevo, ...actuales]);
      setFormulario({ nombre: '', email: '', telefono: '', nit: '', password: '' });
      setMostrarFormulario(false);
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario mayorista.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="clients-admin">
      <header className="clients-heading"><div className="clients-heading-copy"><div className="clients-heading-title"><span className="clients-heading-icon"><Users size={28} /></span><h1>Directorio de clientes</h1></div><p>Gestiona tus clientes, mayoristas y control de compras.</p></div><button className="primary" type="button" onClick={() => setMostrarFormulario(true)}><UserPlus size={18} />Crear usuario mayorista</button></header>
      <section className="clients-kpis">
        <article className="clients-kpi clients-kpi--base"><span className="clients-kpi-icon"><Users size={28} /></span><div><small>Base consolidada</small><b>{clientes.length}</b><span>Clientes registrados</span></div><ArrowDownUp className="clients-kpi-watermark" size={32} /></article>
        <article className="clients-kpi clients-kpi--wholesale"><span className="clients-kpi-icon"><Crown size={28} /></span><div><small>Mayoristas</small><b>{clientes.filter((cliente) => cliente.rol === 'mayorista').length}</b><span>Con cuenta comercial</span></div><ArrowDownUp className="clients-kpi-watermark" size={32} /></article>
        <article className="clients-kpi clients-kpi--purchases"><span className="clients-kpi-icon"><ShoppingCart size={28} /></span><div><small>Con compras</small><b>{clientes.filter((cliente) => cliente.compras > 0).length}</b><span>Historial registrado</span></div><ArrowDownUp className="clients-kpi-watermark" size={32} /></article>
        <article className="clients-kpi clients-kpi--contact"><span className="clients-kpi-icon"><MessageCircle size={28} /></span><div><small>Contacto inmediato</small><b>{clientes.filter((cliente) => cliente.telefono).length}</b><span>Con teléfono</span></div><ArrowDownUp className="clients-kpi-watermark" size={32} /></article>
      </section>
      <section className="clients-filters"><label className="clients-search"><Search size={21} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar por nombre, NIT, teléfono o correo..." aria-label="Buscar por nombre, NIT, teléfono o correo" /></label><label className="clients-select"><Users size={18} /><select value={tipo} onChange={(event) => setTipo(event.target.value)} aria-label="Filtrar por tipo de cliente"><option value="todos">Todos los tipos</option><option value="mayorista">Solo mayoristas</option><option value="minorista">Solo minoristas</option></select></label><label className="clients-select"><ShoppingCart size={18} /><select value={compras} onChange={(event) => setCompras(event.target.value)} aria-label="Filtrar por compras"><option value="todas">Todas las compras</option><option value="con-compras">Con compras</option><option value="sin-compras">Sin compras</option></select></label><label className="clients-select"><ArrowDownUp size={18} /><select value={orden} onChange={(event) => setOrden(event.target.value)} aria-label="Ordenar clientes"><option value="recientes">Más recientes</option><option value="nombre">Nombre</option><option value="compras">Más compras</option><option value="gasto">Mayor gasto</option></select></label><button type="button" onClick={() => { setBuscar(''); setTipo('todos'); setCompras('todas'); setOrden('recientes'); }}><X size={17} />Limpiar</button></section>
      {error && <p className="error-box">{error}</p>}
      <section className="clients-layout">
        <section className="clients-table">
          <header><div className="clients-table-title"><span><Users size={23} /></span><div><h2>Registros de clientes</h2><p>Mostrando {listaOrdenada.length} clientes · Página {paginaSegura} de {totalPaginas}</p></div></div><div className="clients-pagination"><button type="button" aria-label="Página anterior" onClick={() => setPagina((actual) => Math.max(1, actual - 1))} disabled={paginaSegura <= 1}><ChevronLeft size={18} /></button><span>{paginaSegura}</span><button type="button" aria-label="Página siguiente" onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} disabled={paginaSegura >= totalPaginas}><ChevronRight size={18} /></button></div></header>
          <div className="clients-scroll"><table><thead><tr><th>Cliente</th><th>Tipo</th><th>Contacto</th><th>Compras</th><th>Gasto total</th><th>Última compra</th><th>Acciones</th></tr></thead><tbody>
            {paginaClientes.map((cliente) => <tr key={cliente.id}>
              <td><div className="client-name"><i>{iniciales(cliente.nombre)}</i><div><b>{cliente.nombre}</b><small>{cliente.nit ? `NIT: ${cliente.nit}` : 'NIT: Sin NIT'}</small></div></div></td>
              <td><span className={`client-type ${cliente.rol === 'mayorista' ? 'is-wholesale' : ''}`}>{cliente.rol === 'mayorista' ? 'Mayorista' : 'Minorista'}</span></td>
              <td><b>{cliente.telefono || 'Sin teléfono'}</b><small>{cliente.email || 'Sin correo'}</small></td>
              <td><span className="client-purchases">{cliente.compras || 0} {Number(cliente.compras) === 1 ? 'compra' : 'compras'}</span></td><td><b>{formatoMoneda(cliente.gasto || 0)}</b></td><td>{cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-BO') : 'Sin compras'}</td>
              <td><div className="client-table-actions">{esAdmin && cliente.rol === 'mayorista' && <button type="button" title="Asignar clave de acceso" aria-label={`Asignar clave a ${cliente.nombre}`} disabled={asignandoClave === cliente.id} onClick={() => asignarClave(cliente)}><KeyRound size={18} /></button>}<button type="button" className="client-delete" title="Eliminar cliente" aria-label={`Eliminar ${cliente.nombre}`} disabled={eliminando === cliente.id} onClick={() => borrarCliente(cliente)}><Trash2 size={18} /></button></div></td>
            </tr>)}
            {!paginaClientes.length && <tr><td className="clients-empty" colSpan="7">No se encontraron clientes con estos filtros.</td></tr>}
          </tbody></table></div>
        </section>
      </section>
      {mostrarFormulario && typeof document !== 'undefined' && createPortal(
        <div className="clients-modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-mayorista-titulo">
          <div className="clients-modal-backdrop" onClick={() => !guardando && setMostrarFormulario(false)} />
          <form onSubmit={crearMayorista} className="clients-modal-card">
            <header className="clients-modal-header">
              <div className="clients-modal-header-info">
                <span className="clients-modal-badge">
                  <Crown size={22} />
                </span>
                <div>
                  <h2 id="nuevo-mayorista-titulo">Crear usuario mayorista</h2>
                  <p>Registra un nuevo cliente comercial con acceso a precios por volumen y cotizaciones.</p>
                </div>
              </div>
              <button
                type="button"
                className="clients-modal-close"
                aria-label="Cerrar modal"
                onClick={() => !guardando && setMostrarFormulario(false)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="clients-form-grid">
              <label>
                <span className="clients-label-title">
                  Nombre completo / Razón Social <strong className="required">*</strong>
                </span>
                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={actualizarCampo}
                  required
                  minLength="2"
                  maxLength="120"
                  autoComplete="name"
                  placeholder="Ej. Distribuidora Santa Cruz S.R.L."
                />
              </label>

              <label>
                <span className="clients-label-title">
                  Correo electrónico <strong className="required">*</strong>
                </span>
                <input
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={actualizarCampo}
                  required
                  maxLength="150"
                  autoComplete="email"
                  placeholder="comercial@empresa.com"
                />
              </label>

              <label>
                <span className="clients-label-title">
                  Celular / WhatsApp <small className="optional">Opcional</small>
                </span>
                <input
                  name="telefono"
                  value={formulario.telefono}
                  onChange={actualizarCampo}
                  maxLength="30"
                  autoComplete="tel"
                  placeholder="70012345"
                />
              </label>

              <label>
                <span className="clients-label-title">
                  NIT / CI <small className="optional">Opcional</small>
                </span>
                <input
                  name="nit"
                  value={formulario.nit}
                  onChange={actualizarCampo}
                  inputMode="numeric"
                  pattern="[0-9]{5,20}"
                  maxLength="20"
                  placeholder="123456789"
                />
              </label>

              <label className="clients-form-wide">
                <span className="clients-label-title">
                  Contraseña temporal <strong className="required">*</strong>
                </span>
                <div className="clients-password-wrapper">
                  <input
                    name="password"
                    type={verPassword ? 'text' : 'password'}
                    value={formulario.password}
                    onChange={actualizarCampo}
                    required
                    minLength="8"
                    maxLength="128"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    className="clients-password-toggle"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    title={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <small className="clients-field-hint">
                  Mínimo 8 caracteres. Compártela de forma segura con el cliente para su primer ingreso.
                </small>
              </label>
            </div>

            <footer className="clients-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={guardando}
              >
                <UserPlus size={18} />
                <span>{guardando ? 'Creando cuenta…' : 'Crear usuario mayorista'}</span>
              </button>
            </footer>
          </form>
        </div>,
        document.body
      )}
    </main>
  );
}
