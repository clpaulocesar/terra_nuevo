import { useEffect, useMemo, useState } from 'react';
import { Eye, MessageCircle, Search, Trash2, Users, X } from 'lucide-react';
import { eliminarCliente, listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { avisoEliminado, avisoError, confirmarEliminacion } from '../../utils/alertas.js';
import './Admin.css';
import './ClientesAdmin.css';
import './AdminViewsColorFix.css';

const iniciales = (nombre) => String(nombre || '?').split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [error, setError] = useState('');
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    listarClientes({ limite: 100 }).then(setClientes).catch((err) => setError(err.message));
  }, []);

  const lista = useMemo(() => clientes.filter((cliente) => (
    `${cliente.nombre} ${cliente.telefono || ''} ${cliente.nit || ''}`.toLowerCase().includes(buscar.toLowerCase())
  )), [clientes, buscar]);

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
            {lista.map((cliente) => <tr key={cliente.id}>
              <td><div className="client-name"><i>{iniciales(cliente.nombre)}</i><div><b>{cliente.nombre}</b><small>{new Date(cliente.fecha_registro).toLocaleDateString('es-BO')}</small></div></div></td>
              <td><b>{cliente.telefono || 'Sin teléfono'}</b><small>{cliente.nit ? `NIT ${cliente.nit}` : 'Sin NIT'}</small></td>
              <td><b>{cliente.compras || 0} compras</b></td><td><b>{formatoMoneda(cliente.gasto || 0)}</b></td>
              <td><div className="client-table-actions"><button type="button" className="client-delete" title="Eliminar cliente" aria-label={`Eliminar ${cliente.nombre}`} disabled={eliminando === cliente.id} onClick={() => borrarCliente(cliente)}><Trash2 size={18} /></button></div></td>
            </tr>)}
          </tbody></table></div>
        </section>
      </section>
    </main>
  );
}
