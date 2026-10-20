import { useEffect, useMemo, useState } from 'react';
import { Eye, MessageCircle, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { crearUsuarioMayorista, eliminarCliente, listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { avisoEliminado, avisoError, confirmarEliminacion } from '../../utils/alertas.js';
import './Admin.css';
import './ClientesAdmin.css';
import './AdminViewsColorFix.css';

const iniciales = (nombre) => String(nombre || '?').split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({ nombre: '', email: '', telefono: '', nit: '', password: '' });

  useEffect(() => {
    listarClientes({ limite: 100 }).then(setClientes).catch((err) => setError(err.message));
  }, []);

  const lista = useMemo(() => clientes.filter((cliente) => {
    const coincideBusqueda = `${cliente.nombre} ${cliente.telefono || ''} ${cliente.nit || ''} ${cliente.direccion || ''}`.toLowerCase().includes(buscar.toLowerCase());
    const esMayorista = cliente.rol === 'mayorista';
    return coincideBusqueda && (tipo === 'todos' || (tipo === 'mayorista' ? esMayorista : !esMayorista));
  }), [clientes, buscar, tipo]);

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
      <header className="clients-heading"><div><h1>Directorio de clientes</h1></div><button className="primary" type="button" onClick={() => setMostrarFormulario(true)}><UserPlus size={18} />Crear usuario mayorista</button></header>
      <section className="clients-kpis">
        <article><Users /><small>Base consolidada</small><b>{clientes.length}</b><span>Clientes en Supabase</span></article>
        <article><Users /><small>Mayoristas</small><b>{clientes.filter((cliente) => cliente.rol === 'mayorista').length}</b><span>Con cuenta comercial</span></article>
        <article><Eye /><small>Con compras</small><b>{clientes.filter((cliente) => cliente.compras > 0).length}</b><span>Historial registrado</span></article>
        <article><MessageCircle /><small>Contacto inmediato</small><b>{clientes.filter((cliente) => cliente.telefono).length}</b><span>Con teléfono</span></article>
      </section>
      <section className="clients-filters"><label><Search size={20} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar por nombre, NIT o celular..." /></label><select value={tipo} onChange={(event) => setTipo(event.target.value)} aria-label="Filtrar por tipo de cliente"><option value="todos">Todos los tipos</option><option value="mayorista">Solo mayoristas</option><option value="minorista">Solo minoristas</option></select><button onClick={() => { setBuscar(''); setTipo('todos'); }}><X size={17} />Limpiar</button></section>
      {error && <p className="error-box">{error}</p>}
      <section className="clients-layout">
        <section className="clients-table">
          <header><div><h2>Registros recientes</h2><span>{lista.length} clientes reales</span></div></header>
          <div className="clients-scroll"><table><thead><tr><th>Cliente</th><th>Tipo</th><th>Contacto</th><th>Compras</th><th>Gasto</th><th>Acciones</th></tr></thead><tbody>
            {lista.map((cliente) => <tr key={cliente.id}>
              <td><div className="client-name"><i>{iniciales(cliente.nombre)}</i><div><b>{cliente.nombre}</b><small>{new Date(cliente.fecha_registro).toLocaleDateString('es-BO')}</small></div></div></td>
              <td><span className={`client-type ${cliente.rol === 'mayorista' ? 'is-wholesale' : ''}`}>{cliente.rol === 'mayorista' ? 'Mayorista' : 'Minorista'}</span></td>
              <td><b>{cliente.telefono || 'Sin teléfono'}</b><small>{cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT'}</small>{cliente.direccion && <small title={cliente.direccion}>{cliente.direccion}</small>}</td>
              <td><b>{cliente.compras || 0} compras</b></td><td><b>{formatoMoneda(cliente.gasto || 0)}</b></td>
              <td><div className="client-table-actions"><button type="button" className="client-delete" title="Eliminar cliente" aria-label={`Eliminar ${cliente.nombre}`} disabled={eliminando === cliente.id} onClick={() => borrarCliente(cliente)}><Trash2 size={18} /></button></div></td>
            </tr>)}
          </tbody></table></div>
        </section>
      </section>
      {mostrarFormulario && <div className="clients-modal" role="dialog" aria-modal="true" aria-labelledby="nuevo-mayorista-titulo">
        <form onSubmit={crearMayorista}>
          <header><div><h2 id="nuevo-mayorista-titulo">Crear usuario mayorista</h2><p>Se creará su acceso y su ficha de cliente en Supabase.</p></div><button type="button" aria-label="Cerrar" onClick={() => !guardando && setMostrarFormulario(false)}><X /></button></header>
          <div className="clients-form-grid">
            <label>Nombre completo<input name="nombre" value={formulario.nombre} onChange={actualizarCampo} required minLength="2" maxLength="120" autoComplete="name" /></label>
            <label>Correo electrónico<input name="email" type="email" value={formulario.email} onChange={actualizarCampo} required maxLength="150" autoComplete="email" /></label>
            <label>Celular <small>Opcional</small><input name="telefono" value={formulario.telefono} onChange={actualizarCampo} maxLength="30" autoComplete="tel" /></label>
            <label>NIT <small>Opcional</small><input name="nit" value={formulario.nit} onChange={actualizarCampo} inputMode="numeric" pattern="[0-9]{5,20}" maxLength="20" /></label>
            <label className="clients-form-wide">Contraseña temporal<input name="password" type="password" value={formulario.password} onChange={actualizarCampo} required minLength="8" maxLength="128" autoComplete="new-password" /><small>Mínimo 8 caracteres. Compártela de forma segura con el cliente.</small></label>
          </div>
          <footer><button type="button" onClick={() => setMostrarFormulario(false)} disabled={guardando}>Cancelar</button><button className="primary" disabled={guardando}>{guardando ? 'Creando cuenta…' : 'Crear usuario'}</button></footer>
        </form>
      </div>}
    </main>
  );
}
