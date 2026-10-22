import { useMemo, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './ReportePedidosVendedor.css';

const PAGADOS = ['paid', 'completed', 'pagado'];
const PENDIENTES = ['pending', 'pendiente_pago'];

function csv(valor) {
  return `"${String(valor ?? '').replaceAll('"', '""')}"`;
}

export default function ReportePedidosVendedor({ pedidos }) {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const filas = useMemo(() => pedidos.filter((pedido) => {
    if (filtro === 'pagados') return PAGADOS.includes(String(pedido.estado || '').toLowerCase());
    if (filtro === 'pendientes') return PENDIENTES.includes(String(pedido.estado || '').toLowerCase());
    return true;
  }), [filtro, pedidos]);
  const total = filas.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);

  const descargar = () => {
    const contenido = [
      ['N.º Pedido', 'Código Ticket', 'Fecha y Hora', 'Cliente', 'Teléfono', 'NIT', 'Estado', 'Total'],
      ...filas.map((pedido) => [pedido.numero ? `#${pedido.numero}` : '', pedido.codigo, new Date(pedido.fecha).toLocaleString('es-BO'), pedido.cliente, pedido.cliente_telefono || '', pedido.cliente_nit || '', pedido.estado, Number(pedido.total || 0).toFixed(2)]),
    ].map((fila) => fila.map(csv).join(';')).join('\n');
    const archivo = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `reporte-pedidos-${filtro}-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  };

  return <>
    <button type="button" className="seller-report-trigger" onClick={() => setAbierto(true)}><FileText size={16} /> Reporte</button>
    {abierto && <div className="seller-report-backdrop" role="presentation" onMouseDown={() => setAbierto(false)}>
      <section className="seller-report" role="dialog" aria-modal="true" aria-labelledby="reporte-pedidos-titulo" onMouseDown={(evento) => evento.stopPropagation()}>
        <header><div><span>Portal de ventas</span><h2 id="reporte-pedidos-titulo">Reporte general de pedidos</h2><p>Exporta la actividad según el estado de pago.</p></div><button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar reporte"><X size={20} /></button></header>
        <div className="seller-report__filters">
          {[['todos', 'Todos'], ['pagados', 'Pagaron'], ['pendientes', 'Sin pagar']].map(([id, etiqueta]) => <button type="button" key={id} className={filtro === id ? 'active' : ''} onClick={() => setFiltro(id)}>{etiqueta}</button>)}
        </div>
        <div className="seller-report__summary"><div><small>Pedidos incluidos</small><b>{filas.length}</b></div><div><small>Total registrado</small><b>{formatoMoneda(total)}</b></div></div>
        <p className="seller-report__caption">El archivo incluye código, fecha, cliente, teléfono, NIT, estado y total.</p>
        <footer><button type="button" onClick={() => setAbierto(false)}>Cancelar</button><button type="button" className="seller-report__download" onClick={descargar} disabled={!filas.length}><Download size={17} /> Descargar CSV</button></footer>
      </section>
    </div>}
  </>;
}
