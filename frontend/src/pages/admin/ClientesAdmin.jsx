import { useEffect, useMemo, useState } from 'react';
import { Eye, MessageCircle, Search, Trash2, Users, X } from 'lucide-react';
import { eliminarCliente, listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './Admin.css';
import './ClientesAdmin.css';
import './AdminViewsColorFix.css';

const iniciales = (nombre) => String(nombre || '?').split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    listarClientes({ limite: 100 }).then(setClientes).catch((err) => setError(err.message));
  }, []);

  const lista = useMemo(() => clientes.filter((cliente) => (
    `${cliente.nombre} ${cliente.telefono || ''} ${cliente.nit || ''}`.toLowerCase().includes(buscar.toLowerCase())
  )), [clientes, buscar]);

  const borrarCliente = async (cliente) => {
    if (cliente.compras > 0) {
      setError('No se puede eliminar este cliente porque tiene pedidos registrados. El historial de ventas se conserva.');
      return;
    }
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;

    setEliminando(cliente.id);
    setError('');
    try {
      await eliminarCliente(cliente.id);
      setClientes((actuales) => actuales.filter((item) => item.id !== cliente.id));
      if (seleccion?.id === cliente.id) setSeleccion(null);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <main className="clients-admin">
      <header className="clients-heading"><div><h1>Directorio de clientes</h1></div></header>
      <section className="clients-kpis">
        <article><Users /><small>Base consolidada</small><b>{clientes.length}</b><span>Clientes en Supabase</span></article>
        <article><Eye /><small>Con compras</small><b>{clientes.filter((cliente) => cliente.compras > 0).length}</b><span>Historial registrado</span></article>
        <article><MessageCircle /><small>Contacto inmediato</small><b>{clientes.filter((cliente) => cliente.telefono).length}</b><span>Con teléfono</span></article>
      </section>
      <section className="clients-filters"><label><Search size={20} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar por nombre, NIT o celular..." /></label><button onClick={() => setBuscar('')}><X size={17} />Limpiar</button></section>
      {error && <p className="error-box">{error}</p>}
      <section className="clients-layout">
        <section className="clients-table">
          <header><div><h2>Registros recientes</h2><span>{lista.length} clientes reales</span></div></header>
          <div className="clients-scroll"><table><thead><tr><th>Cliente</th><th>Contacto</th><th>Compras</th><th>Gasto</th><th>Acciones</th></tr></thead><tbody>
            {lista.map((cliente) => <tr key={cliente.id} className={seleccion?.id === cliente.id ? 'selected' : ''} onClick={() => setSeleccion(cliente)}>
              <td><div className="client-name"><i>{iniciales(cliente.nombre)}</i><div><b>{cliente.nombre}</b><small>{new Date(cliente.fecha_registro).toLocaleDateString('es-BO')}</small></div></div></td>
              <td><b>{cliente.telefono || 'Sin teléfono'}</b><small>{cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT'}</small></td>
              <td><b>{cliente.compras || 0} compras</b></td><td><b>{formatoMoneda(cliente.gasto || 0)}</b></td>
              <td><div className="client-table-actions"><button type="button" title="Ver cliente" aria-label={`Ver ${cliente.nombre}`}><Eye size={18} /></button><button type="button" className="client-delete" title={cliente.compras > 0 ? 'No se puede eliminar: tiene pedidos' : 'Eliminar cliente'} aria-label={`Eliminar ${cliente.nombre}`} disabled={eliminando === cliente.id} onClick={(event) => { event.stopPropagation(); borrarCliente(cliente); }}><Trash2 size={18} /></button></div></td>
            </tr>)}
          </tbody></table></div>
        </section>
        {seleccion && <aside className="client-preview"><header><div className="client-profile"><i>{iniciales(seleccion.nombre)}</i><div><h2>{seleccion.nombre}</h2><small>{seleccion.nit ? `NIT ${seleccion.nit}` : 'Sin NIT'}</small></div></div><button onClick={() => setSeleccion(null)}><X size={18} /></button></header><section className="client-summary"><div><small>Gasto histórico</small><b>{formatoMoneda(seleccion.gasto || 0)}</b></div><div><small>Compras</small><b>{seleccion.compras || 0}</b></div></section>{seleccion.telefono && <section className="client-whatsapp"><b><MessageCircle size={18} />Contacto directo</b><span>{seleccion.telefono}</span><a href={`https://wa.me/${seleccion.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Enviar WhatsApp</a></section>}<button className="client-preview-delete" type="button" disabled={eliminando === seleccion.id} onClick={() => borrarCliente(seleccion)}><Trash2 size={17} /> Eliminar cliente</button></aside>}
      </section>
    </main>
  );
}
