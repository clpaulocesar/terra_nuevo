import { useEffect, useState } from 'react';
import { CheckCircle2, CloudDownload, Database, Image, Info, RefreshCw, Server, ShieldCheck, TriangleAlert } from 'lucide-react';
import { obtenerConfiguracionErp, prepararErp, sincronizarProductosErp } from '../../services/erpService.js';
import './Admin.css';
import './SincronizacionErpAdmin.css';

export default function SincronizacionErpAdmin() {
  const [codigos, setCodigos] = useState('');
  const [incluirImagenes, setIncluirImagenes] = useState(true);
  const [estado, setEstado] = useState('');
  const [ejecutando, setEjecutando] = useState(false);
  const [configuracion, setConfiguracion] = useState(null);
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(true);
  const lista = [...new Set(codigos.split(/[\s,;]+/).map((codigo) => codigo.trim()).filter(Boolean))];

  const cargarConfiguracion = async () => {
    setCargandoConfiguracion(true);
    try { setConfiguracion(await obtenerConfiguracionErp()); } catch (error) { setEstado(error.message); } finally { setCargandoConfiguracion(false); }
  };

  useEffect(() => { cargarConfiguracion(); }, []);

  const preparar = async () => {
    setEjecutando(true);
    setEstado('');
    try { await prepararErp(); setEstado('Estructura ERP preparada en Supabase.'); } catch (error) { setEstado(error.message); } finally { setEjecutando(false); }
  };
  const sincronizar = async () => {
    if (!lista.length || !lista.every((codigo) => /^[a-zA-Z0-9_-]+$/.test(codigo))) { setEstado('Ingresa códigos internos numéricos o códigos TERRA, separados por coma o una línea por código.'); return; }
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

  const listo = configuracion?.configurado === true;
  return <main className="erp-sync">
    <header className="erp-sync__hero"><div><span>INTEGRACIÓN DE CATÁLOGO</span><h1>Sincronización ERP TERRA</h1><p>Actualiza datos oficiales en Supabase usando códigos internos. Los precios, ofertas y visibilidad comercial permanecen bajo control de TERRA web.</p></div><button type="button" className="erp-sync__refresh" onClick={cargarConfiguracion} disabled={cargandoConfiguracion}><RefreshCw size={17} className={cargandoConfiguracion ? 'is-spinning' : ''} /> Actualizar estado</button></header>
    <section className="erp-sync__status" aria-label="Estado de configuración">
      <article className={listo ? 'is-ready' : 'is-pending'}><Server size={21} /><div><b>Servidor ERP</b><span>{configuracion?.servidor || 'IP aún no configurada'}</span></div><i>{configuracion?.credenciales ? 'Listo' : 'Pendiente'}</i></article>
      <article className={configuracion?.almacenamiento ? 'is-ready' : 'is-pending'}><Image size={21} /><div><b>Imágenes</b><span>Supabase Storage</span></div><i>{configuracion?.almacenamiento ? 'Listo' : 'Pendiente'}</i></article>
      <article className={listo ? 'is-ready' : 'is-pending'}><ShieldCheck size={21} /><div><b>Estado general</b><span>{listo ? 'Preparado para sincronizar' : 'Completa la configuración privada'}</span></div><i>{listo ? 'Activo' : 'Revisar'}</i></article>
    </section>
    {!listo && !cargandoConfiguracion && <p className="erp-sync__notice" role="status"><TriangleAlert size={18} /> Configura las variables ERP en el backend y reinicia el servidor antes de importar.</p>}
    <section className="erp-sync__workspace">
      <div className="erp-sync__card"><header><span><Database size={20} /></span><div><h2>Importación manual</h2><p>Pega códigos internos numéricos o códigos TERRA, uno por línea o separados por coma.</p></div></header><label className="erp-sync__codes"><span>Códigos de producto</span><textarea value={codigos} onChange={(evento) => setCodigos(evento.target.value)} placeholder={'1\nALMO00039\n...'} rows="10" /></label><div className="erp-sync__count"><b>{lista.length}</b><span>códigos preparados</span></div><label className="erp-sync__images"><input type="checkbox" checked={incluirImagenes} onChange={(evento) => setIncluirImagenes(evento.target.checked)} /><Image size={17} /><span><b>Incluir imágenes oficiales</b><small>Se guardan en Supabase Storage.</small></span></label><footer><button type="button" className="erp-sync__secondary" onClick={preparar} disabled={ejecutando}><Database size={17} /> Preparar tablas</button><button type="button" className="erp-sync__primary" onClick={sincronizar} disabled={ejecutando || !lista.length || !listo}><CloudDownload size={17} /> {ejecutando ? 'Sincronizando…' : 'Sincronizar productos'}</button></footer></div>
      <aside className="erp-sync__guide"><Info size={20} /><h2>Qué se actualiza</h2><ul><li>Códigos, nombre, medida, color, marca y grupo.</li><li>Stock total y por almacén.</li><li>Códigos de barras e imágenes oficiales.</li><li>Coincidencias de nombre como advertencias, sin fusionar variantes.</li></ul><p><CheckCircle2 size={16} /> La identidad del producto siempre se determina por sus códigos, no solo por el nombre.</p></aside>
    </section>
    {estado && <p className="erp-sync__result" role="status">{estado}</p>}
  </main>;
}
