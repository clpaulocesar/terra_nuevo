import { useEffect, useMemo, useState } from 'react';
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

  // Escape cierra el modal del reporte (accesibilidad de teclado).
  useEffect(() => {
    if (!abierto) return undefined;
    const alEscape = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [abierto]);

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

  const descargarPDF = () => {
    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('Permite las ventanas emergentes para generar el PDF del reporte.');
      return;
    }
    const titulo = `Reporte General de Pedidos (${filtro === 'pagados' ? 'Cobrados' : filtro === 'pendientes' ? 'Sin Pagar' : 'Todos'})`;
    const fechaGeneracion = new Date().toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/La_Paz',
    });
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo} - TERRA Autoservicio</title>
  <style>
    @page { size: portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 16px; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #a6192e; padding-bottom: 12px; margin-bottom: 14px; }
    .logo-title h1 { margin: 0 0 4px 0; font-size: 19px; color: #a6192e; font-weight: 800; letter-spacing: -0.5px; }
    .logo-title p { margin: 0; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-box { text-align: right; font-size: 11px; color: #475569; }
    .kpis { display: flex; gap: 14px; margin-bottom: 14px; }
    .kpi-card { background: #fff5f6; border: 1px solid #f9d3d9; border-radius: 6px; padding: 8px 12px; flex: 1; }
    .kpi-card small { display: block; color: #842029; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
    .kpi-card b { font-size: 15px; color: #a6192e; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 7px 8px; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-other { background: #f1f5f9; color: #475569; }
    .total-row td { font-size: 11px; font-weight: 800; border-top: 2px solid #1e293b; background: #fff !important; }
    .footer { margin-top: 18px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-title">
      <h1>TERRA Autoservicio</h1>
      <p>Reporte General de Pedidos · Portal de Ventas</p>
    </div>
    <div class="meta-box">
      <div><strong>Filtro:</strong> ${filtro === 'pagados' ? 'Cobrados' : filtro === 'pendientes' ? 'Sin pagar' : 'Todos'}</div>
      <div><strong>Emisión:</strong> ${fechaGeneracion}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi-card">
      <small>Total de Pedidos</small>
      <b>${filas.length}</b>
    </div>
    <div class="kpi-card">
      <small>Total Registrado</small>
      <b>${formatoMoneda(total)}</b>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>N.º</th>
        <th>Código</th>
        <th>Fecha y Hora</th>
        <th>Cliente</th>
        <th>Teléfono</th>
        <th>NIT</th>
        <th>Estado</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map((p) => {
        const est = String(p.estado || '').toLowerCase();
        const badgeClass = PAGADOS.includes(est) ? 'badge-paid' : PENDIENTES.includes(est) ? 'badge-pending' : 'badge-other';
        const estadoEtiqueta = PAGADOS.includes(est) ? 'Cobrado' : PENDIENTES.includes(est) ? 'Pendiente' : p.estado;
        return `
        <tr>
          <td><b>${p.numero ? `#${p.numero}` : '—'}</b></td>
          <td><code style="font-weight:600;color:#64748b">${p.codigo || p.id}</code></td>
          <td>${new Date(p.fecha).toLocaleString('es-BO')}</td>
          <td><b>${p.cliente || 'Consumidor Final'}</b></td>
          <td>${p.cliente_telefono || '—'}</td>
          <td>${p.cliente_nit || '—'}</td>
          <td><span class="badge ${badgeClass}">${estadoEtiqueta}</span></td>
          <td class="text-right"><b>${formatoMoneda(p.total)}</b></td>
        </tr>`;
      }).join('')}
      <tr class="total-row">
        <td colspan="7" class="text-right">TOTAL GENERAL:</td>
        <td class="text-right">${formatoMoneda(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Documento generado por el sistema de TERRA Autoservicio · ${filas.length} pedidos incluidos.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  <\/script>
</body>
</html>`;
    ventana.document.write(html);
    ventana.document.close();
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
        <footer>
          <button type="button" onClick={() => setAbierto(false)}>Cancelar</button>
          <button type="button" className="seller-report__download is-csv" onClick={descargar} disabled={!filas.length}><Download size={17} /> Descargar CSV</button>
          <button type="button" className="seller-report__download is-pdf" onClick={descargarPDF} disabled={!filas.length}><FileText size={17} /> Exportar PDF</button>
        </footer>
      </section>
    </div>}
  </>;
}
