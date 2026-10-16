import { useEffect, useMemo, useState } from 'react';
import { Barcode, CheckCircle2, CreditCard, ExternalLink, ImagePlus, Package, QrCode, Search, Trash2 } from 'lucide-react';
import { listarPedidos, registrarPagoPedido } from '../../services/pedidoService.js';
import { subirComprobantePago } from '../../services/storageService.js';
import QRCode from 'react-qr-code';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './Admin.css';
import './PedidosAdmin.css';

const etiquetas = { pending: 'Pendiente de pago', pendiente_pago: 'Pendiente de pago', paid: 'Cobrado', completed: 'Cobrado', pagado: 'Cobrado', shipped: 'En despacho', delivered: 'Entregado', entregado: 'Entregado', cancelled: 'Cancelado', cancelado: 'Cancelado' };

export default function PedidosAdmin() {
  const [tab, setTab] = useState('todos'); const [buscar, setBuscar] = useState(''); const [pedidos, setPedidos] = useState([]); const [seleccion, setSeleccion] = useState(null); const [cargando, setCargando] = useState(true); const [error, setError] = useState(''); const [metodo, setMetodo] = useState('qr'); const [archivoComprobante, setArchivoComprobante] = useState(null); const [subiendoPago, setSubiendoPago] = useState(false);
  useEffect(() => { let activo = true; setCargando(true); listarPedidos({ limite: 100 }).then((data) => { if (activo) setPedidos(data); }).catch((err) => { if (activo) setError(err.message); }).finally(() => activo && setCargando(false)); return () => { activo = false; }; }, []);
  const vista = useMemo(() => pedidos.filter((pedido) => (tab === 'todos' || pedido.estado === tab) && `${pedido.codigo} ${pedido.cliente}`.toLowerCase().includes(buscar.toLowerCase())), [pedidos, tab, buscar]);
  const pendientes = pedidos.filter((pedido) => ['pending', 'pendiente_pago'].includes(pedido.estado)).length;
  const abrirPedido = (pedido) => { setSeleccion(pedido); setMetodo(pedido.metodo_pago || 'qr'); setArchivoComprobante(null); setError(''); };
  const registrarPago = async () => {
    if (!seleccion) return;
    setSubiendoPago(true); setError('');
    try {
      const comprobanteUrl = archivoComprobante ? await subirComprobantePago(archivoComprobante) : seleccion.comprobante_url || null;
      const actualizado = await registrarPagoPedido(seleccion.id, { metodoPago: metodo, comprobanteUrl });
      // Solo propagamos campos escalares: el backend devuelve items/cliente con otra forma que la lista.
      const cambios = {
        estado: actualizado?.estado ?? 'completed',
        comprobante_url: actualizado?.comprobante_url ?? comprobanteUrl,
        metodo_pago: actualizado?.metodo_pago ?? metodo,
      };
      setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, ...cambios } : pedido));
      setSeleccion(null); setArchivoComprobante(null);
    } catch (err) { setError(err.message || 'No se pudo registrar el pago.'); } finally { setSubiendoPago(false); }
  };
  const comprobanteActual = archivoComprobante ? URL.createObjectURL(archivoComprobante) : seleccion?.comprobante_url;
  const pendiente = seleccion && ['pending', 'pendiente_pago'].includes(seleccion.estado);

  return <main className="orders"><header className="orders-hero"><div><h1>Recepción y despacho de pedidos</h1></div><form onSubmit={(event) => event.preventDefault()}><Barcode size={25} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Escanear o digitar ticket" /><button>Buscar</button></form></header>
    <section className="orders-metrics"><article><b>{pendientes} pedidos</b><span>Por cobrar en caja</span></article><article><b>{pedidos.length} pedidos</b><span>Registrados en Supabase</span></article><article><b>{pedidos.filter((pedido) => ['shipped', 'entregado'].includes(pedido.estado)).length} pedidos</b><span>En despacho</span></article></section>
    <nav className="orders-tabs">{[['todos', 'Todos'], ['pending', 'Pendientes de pago'], ['completed', 'Cobrados'], ['shipped', 'En despacho']].map(([id, etiqueta]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>{etiqueta}</button>)}</nav>
    <section className="orders-list"><header><div><span>Órdenes de autoservicio</span><h2>Pedidos en operación</h2></div><label><Search size={18} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar pedido o cliente" /></label></header>{cargando && <p>Cargando pedidos reales...</p>}{error && <p className="error-box">{error}</p>}{!cargando && !error && vista.length === 0 && <p>No hay pedidos registrados todavía.</p>}{vista.map((pedido) => <article key={pedido.id}><div><b>#{pedido.codigo}</b><small>{new Date(pedido.fecha).toLocaleString('es-BO')}</small></div><div><b>{pedido.cliente}</b><small>{pedido.comprobante_url ? 'Comprobante adjunto' : 'Cliente registrado'}</small></div><p>{pedido.items || 'Sin artículos'}</p><strong>{formatoMoneda(pedido.total)}</strong><i className={pedido.estado}>{etiquetas[pedido.estado] || pedido.estado}</i><div className="order-actions"><button onClick={() => abrirPedido(pedido)}>{['pending', 'pendiente_pago'].includes(pedido.estado) ? <><CreditCard size={18} /> Cobrar</> : 'Ver detalle'}</button></div></article>)}</section>
    {seleccion && <div className="orders-modal"><section><header><div><span>Caja Equipetrol</span><h2>#{seleccion.codigo}</h2><p>Cliente: {seleccion.cliente}</p></div><button onClick={() => setSeleccion(null)}>×</button></header><div className="orders-total"><span>Monto a liquidar</span><b>{formatoMoneda(seleccion.total)}</b></div><h3>Artículos</h3><p>{seleccion.items || 'Sin artículos registrados'}</p><div className="orders-methods"><button className={metodo === 'qr' ? 'active' : ''} onClick={() => setMetodo('qr')}><QrCode />QR Simple</button><button className={metodo === 'efectivo' ? 'active' : ''} onClick={() => setMetodo('efectivo')}><Package />Efectivo</button><button className={metodo === 'tarjeta' ? 'active' : ''} onClick={() => setMetodo('tarjeta')}><CreditCard />Tarjeta</button></div>{metodo === 'qr' && <div className="orders-qr" title={`Contenido del QR: TERRA-PRUEBA|${seleccion.codigo}|${Number(seleccion.total)}`}><b>Imagen de prueba</b><QRCode value={`TERRA-PRUEBA|${seleccion.codigo}|${Number(seleccion.total)}`} size={200} /><p>Escanea el código para simular el pago del cliente</p><small>#{seleccion.codigo} · {formatoMoneda(seleccion.total)}</small></div>}{metodo === 'efectivo' && <p className="orders-hint">Cobra el monto en efectivo en caja y luego confirma el pago.</p>}{metodo === 'tarjeta' && <p className="orders-hint">Pasa la tarjeta por el POS y luego confirma el pago.</p>}
      <section className="orders-receipt"><div className="orders-receipt-head"><div><b><ImagePlus size={17} /> Comprobante de pago</b><span>Opcional · JPG, PNG o WEBP · máximo 8 MB</span></div>{comprobanteActual && <a href={comprobanteActual} target="_blank" rel="noreferrer" title="Abrir comprobante"><ExternalLink size={17} /></a>}</div><label className="orders-receipt-btn"><ImagePlus size={17} /> {archivoComprobante ? 'Cambiar imagen' : comprobanteActual ? 'Reemplazar imagen' : 'Cargar comprobante'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setArchivoComprobante(event.target.files?.[0] || null)} /></label>{comprobanteActual ? <div className="orders-receipt-preview"><img src={comprobanteActual} alt="Comprobante de pago" /><div><p>{archivoComprobante ? archivoComprobante.name : 'Comprobante guardado en Supabase'}</p>{archivoComprobante && <button type="button" className="orders-receipt-remove" onClick={() => setArchivoComprobante(null)}><Trash2 size={14} /> Quitar cambio</button>}</div></div> : <span className="orders-receipt-empty">Aún no se adjuntó una imagen.</span>}</section>
      {error && <p className="orders-alert is-error">{error}</p>}
      <footer><button onClick={() => setSeleccion(null)}>Cerrar</button><button onClick={registrarPago} disabled={subiendoPago}>{subiendoPago ? 'Guardando…' : pendiente ? <><CheckCircle2 /> Confirmar pago</> : <><CheckCircle2 /> Guardar comprobante</>}</button></footer></section></div>}
  </main>;
}
