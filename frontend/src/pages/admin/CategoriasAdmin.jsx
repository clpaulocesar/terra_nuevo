import { useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, Edit3, FolderTree, Package, Plus, Search, Tags, Trash2, X } from 'lucide-react';
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias, listarProductos } from '../../services/productoService.js';
import { avisoEliminado, avisoError, avisoExito, confirmarEliminacion } from '../../utils/alertas.js';
import './CategoriasAdmin.css';

const texto = (valor) => String(valor ?? '').trim();

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState([]); const [productos, setProductos] = useState([]);
  const [buscar, setBuscar] = useState(''); const [seleccionada, setSeleccionada] = useState('Todas');
  const [cargando, setCargando] = useState(true); const [error, setError] = useState('');
  const [editor, setEditor] = useState(null); const [guardando, setGuardando] = useState(false);

  const cargar = async () => { setCargando(true); setError(''); try {
    const [listaCategorias, listaProductos] = await Promise.all([listarCategorias({ todas: true }), listarProductos({ todos: true, limite: 100 })]);
    setCategorias(listaCategorias.map((categoria) => ({ ...categoria, nombre: texto(categoria.nombre || categoria.nombre_categoria) })));
    setProductos(listaProductos);
  } catch (err) { setError(err.message || 'No se pudieron cargar las categorías.'); } finally { setCargando(false); } };
  useEffect(() => { cargar(); }, []);

  const resumen = useMemo(() => categorias.map((categoria) => { const asociados = productos.filter((p) => texto(p.categoria) === categoria.nombre); return { ...categoria, productos: asociados.length || Number(categoria.total || 0), unidades: asociados.reduce((t, p) => t + Number(p.showroom || p.stock || 0), 0) }; }), [categorias, productos]);
  const visibles = useMemo(() => resumen.filter((categoria) => (seleccionada === 'Todas' || categoria.nombre === seleccionada) && categoria.nombre.toLowerCase().includes(buscar.trim().toLowerCase())), [resumen, buscar, seleccionada]);
  const totalProductos = productos.length || resumen.reduce((total, categoria) => total + categoria.productos, 0);
  const abrirEditor = (categoria = null) => setEditor(categoria ? { ...categoria } : { nombre: '' });
  const guardarCategoria = async (event) => { event.preventDefault(); const nombre = texto(new FormData(event.currentTarget).get('nombre')); if (!nombre) return; const editando = Boolean(editor.id); setGuardando(true); try {
    const resultado = editando ? await actualizarCategoria(editor.id, { nombre }) : await crearCategoria({ nombre });
    setCategorias((lista) => editando ? lista.map((categoria) => categoria.id === editor.id ? { ...categoria, ...resultado, nombre } : categoria) : [...lista, { ...resultado, nombre, total: 0 }]);
    setEditor(null);
    await avisoExito({ titulo: editando ? '¡Categoría actualizada!' : '¡Categoría creada!', texto: `"${nombre}" se guardó correctamente.` });
  } catch (err) { await avisoError(err.message || 'No se pudo guardar la categoría.'); } finally { setGuardando(false); } };
  const borrarCategoria = async (categoria) => {
    const confirmado = await confirmarEliminacion({
      titulo: `¿Eliminar la categoría "${categoria.nombre}"?`,
      texto: 'Se borrará de la base de datos. No podrás revertir esta acción.',
    });
    if (!confirmado) return;
    try {
      await eliminarCategoria(categoria.id);
      setCategorias((lista) => lista.filter((item) => item.id !== categoria.id));
      if (seleccionada === categoria.nombre) setSeleccionada('Todas');
      await avisoEliminado(`Categoría "${categoria.nombre}" eliminada.`);
    } catch (err) {
      await avisoError(err.message || 'No se pudo eliminar la categoría.');
    }
  };

  return <main className="categories-admin">
    <header className="categories-heading"><div><div><h1>Categorías del catálogo</h1><b>{resumen.length} categorías registradas</b></div><p>Organiza los productos y consulta su disponibilidad por categoría.</p></div><button className="categories-add" type="button" onClick={() => abrirEditor()}><Plus size={18} /> Nueva categoría</button></header>
    <section className="categories-kpis"><article><Tags /><div><small>Categorías activas</small><b>{resumen.length}</b><span>Disponibles en el catálogo</span></div></article><article><Package /><div><small>Productos clasificados</small><b>{totalProductos}</b><span>En categorías registradas</span></div></article><article><FolderTree /><div><small>Con productos</small><b>{resumen.filter((c) => c.productos > 0).length}</b><span>Categorías con inventario</span></div></article><article><Box /><div><small>Unidades en showroom</small><b>{resumen.reduce((t, c) => t + c.unidades, 0)}</b><span>Disponibilidad inmediata</span></div></article></section>
    <section className="categories-filters"><label><Search size={21} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder="Buscar categoría" /></label><button type="button" onClick={() => { setBuscar(''); setSeleccionada('Todas'); }}>× Limpiar filtros</button><nav><button type="button" className={seleccionada === 'Todas' ? 'active' : ''} onClick={() => setSeleccionada('Todas')}>Todas</button>{resumen.map((c) => <button key={c.id} type="button" className={seleccionada === c.nombre ? 'active' : ''} onClick={() => setSeleccionada(c.nombre)}>{c.nombre}</button>)}</nav></section>
    <section className="categories-table"><header><div><h2>Listado de categorías</h2><span>Mostrando {visibles.length} de {resumen.length} registros</span></div></header>{cargando && <p className="categories-state">Cargando categorías…</p>}{error && <p className="categories-state categories-state--error">{error}</p>}{!cargando && !error && <div className="categories-scroll"><table><thead><tr><th>Categoría</th><th>Productos</th><th>Stock showroom</th><th>Visibilidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{visibles.map((c) => <tr key={c.id}><td><div className="category-name"><span>{c.emoji || '📦'}</span><div><b>{c.nombre}</b><small>Clasificación del catálogo</small></div></div></td><td><b>{c.productos} {c.productos === 1 ? 'producto' : 'productos'}</b></td><td><b className="category-stock">{c.unidades} unid.</b></td><td><span className="category-visible"><CheckCircle2 size={14} /> Disponible</span></td><td><span className="category-status">Activa</span></td><td><div className="category-actions"><button type="button" title="Editar" onClick={() => abrirEditor(c)}><Edit3 size={16} /></button><button className="delete" type="button" title="Eliminar" onClick={() => borrarCategoria(c)}><Trash2 size={16} /></button></div></td></tr>)}{!visibles.length && <tr><td className="categories-empty" colSpan="6">No se encontraron categorías con esos filtros.</td></tr>}</tbody></table></div>}</section>
    {editor && <div className="category-modal"><form onSubmit={guardarCategoria}><header><div><Tags size={20} /><div><h2>{editor.id ? 'Editar categoría' : 'Nueva categoría'}</h2><p>Este cambio se guardará en Supabase.</p></div></div><button type="button" onClick={() => setEditor(null)} aria-label="Cerrar"><X /></button></header><label>Nombre de la categoría<input name="nombre" defaultValue={editor.nombre} autoFocus maxLength="100" required placeholder="Ej. Colchones" /></label><footer><button type="button" onClick={() => setEditor(null)}>Cancelar</button><button className="primary" disabled={guardando} type="submit">{guardando ? 'Guardando…' : 'Guardar categoría'}</button></footer></form></div>}
  </main>;
}
