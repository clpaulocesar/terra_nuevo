import { useState } from 'react';
import { CloudDownload, Database, Image } from 'lucide-react';
import { prepararErp, sincronizarProductosErp } from '../../services/erpService.js';
import './Admin.css';

export default function SincronizacionErpAdmin() {
  const [codigos, setCodigos] = useState('');
  const [incluirImagenes, setIncluirImagenes] = useState(true);
  const [estado, setEstado] = useState('');
  const [ejecutando, setEjecutando] = useState(false);
  const lista = [...new Set(codigos.split(/[\s,;]+/).map((codigo) => codigo.trim()).filter(Boolean))];

  const preparar = async () => {
    setEjecutando(true);
    setEstado('');
    try { await prepararErp(); setEstado('Estructura ERP preparada en Supabase.'); } catch (error) { setEstado(error.message); } finally { setEjecutando(false); }
  };
  const sincronizar = async () => {
    if (!lista.length || !lista.every((codigo) => /^\d+$/.test(codigo))) { setEstado('Ingresa códigos internos numéricos, separados por coma o una línea por código.'); return; }
    setEjecutando(true);
    setEstado('');
    try {
      const respuesta = await sincronizarProductosErp(lista, incluirImagenes);
      const detalles = respuesta?.detalles || [];
      const fallidos = detalles.filter((detalle) => !detalle.ok);
      const advertencias = detalles.flatMap((detalle) => detalle.advertencias || []);
      setEstado(`Sincronización terminada: ${detalles.length - fallidos.length} correctos, ${fallidos.length} con error y ${advertencias.length} coincidencia(s) de nombre revisable(s).${fallidos.length ? ` ${fallidos.map((detalle) => `${detalle.codigo}: ${detalle.mensaje}`).join(' · ')}` : ''}`);
    } catch (error) { setEstado(error.message); } finally { setEjecutando(false); }
  };

  return <main className="orders">
    <header className="orders-hero"><div><h1>Sincronización ERP TERRA</h1><p>Importa datos oficiales por código interno. Los precios, ofertas, descripciones comerciales y visibilidad se conservan en TERRA web.</p></div></header>
    <section className="orders-list">
      <h2>Importación manual inicial</h2>
      <p>Pega los códigos internos entregados por TERRA. El sistema actualiza código, nombre, medida, color, marca, grupo, códigos de barras, stock por almacén e imágenes.</p>
      <label><b>Códigos internos</b><textarea value={codigos} onChange={(evento) => setCodigos(evento.target.value)} placeholder="2&#10;55028&#10;..." rows="10" /></label>
      <p>{lista.length} código(s) preparado(s).</p>
      <label><input type="checkbox" checked={incluirImagenes} onChange={(evento) => setIncluirImagenes(evento.target.checked)} /> <Image size={16} /> Descargar y guardar imágenes en Supabase Storage</label>
      <p><button type="button" onClick={preparar} disabled={ejecutando}><Database size={17} /> Preparar tablas</button> <button type="button" onClick={sincronizar} disabled={ejecutando || !lista.length}><CloudDownload size={17} /> {ejecutando ? 'Sincronizando…' : 'Sincronizar ahora'}</button></p>
      {estado && <p className="orders-hint" role="status">{estado}</p>}
    </section>
  </main>;
}
