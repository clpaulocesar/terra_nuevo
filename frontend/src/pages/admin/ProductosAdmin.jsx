import { useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, ChevronLeft, ChevronRight, Download, Edit3, Eye, ImagePlus, Link2, PackagePlus, Play, Plus, Search, SlidersHorizontal, Star, Store, Trash2, Truck, Warehouse, X } from 'lucide-react';
import { listarProductos, listarCategorias, crearProducto, actualizarProducto, actualizarStock, eliminarProducto } from '../../services/productoService.js';
import { mediaDeVideo } from '../../utils/videoEmbed.js';
import './Admin.css';
import './ProductosAdmin.css';
import './AdminViewsColorFix.css';
import './ProductosDb.css';
import './ProductosDelete.css';

const productosIniciales = [
  {
    id: 1,
    nombre: 'Sommier Nórdico Bouclé Queen',
    sku: 'TRR-SOM-B160',
    categoria: 'Sommiers',
    precio: '3.950',
    showroom: 3,
    bodega: 14,
    visible: true,
    detalle: 'Queen · 160 × 200 cm',
    tono: 'beige',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyRZJ4OejQFLhRxKI2zISkoOdXuUerVE0SIgqtA9DnUPDCw66KWDLT2oqYOrUIdOEGMoua3Bj-KgyODv5S6U89Lj632Te2t1nPU7gWDmnYlU8nWKyHch_HOpfQ-5faM8DlGHEAbmpRq5Lnzibg2-cZ87RQhTTKIofk6oSYmY48qL_fMT1CKNnOyDo6zBKVzJkiPDvHeoc8SFgrJckJcb1_0WedV4nd7I17Z8Y36nN66RQyH9KMxv_x',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyRZJ4OejQFLhRxKI2zISkoOdXuUerVE0SIgqtA9DnUPDCw66KWDLT2oqYOrUIdOEGMoua3Bj-KgyODv5S6U89Lj632Te2t1nPU7gWDmnYlU8nWKyHch_HOpfQ-5faM8DlGHEAbmpRq5Lnzibg2-cZ87RQhTTKIofk6oSYmY48qL_fMT1CKNnOyDo6zBKVzJkiPDvHeoc8SFgrJckJcb1_0WedV4nd7I17Z8Y36nN66RQyH9KMxv_x',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_',
    ],
  },
  {
    id: 2,
    nombre: 'Colchón Ortopédico Supreme King',
    sku: 'TRR-COL-K200',
    categoria: 'Colchones',
    precio: '4.890',
    showroom: 4,
    bodega: 28,
    visible: true,
    detalle: 'King · 200 × 200 cm',
    tono: 'green',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAA5rj2Ps0QijJsV3RmcBdEsz5td4d3QkcOvpDQLDsjyMmahvd61qSfR58oeyLER6LGD8M5QQOF9K2DMZj4dQEdzi0avUBsjWbOLot8w3w-JcyCXpztBL4MRJDWVwJH1s5z9Pr7bcKiqxs0YYhXgOJUKGjaluD9u5gsKUsbBi-oVTjwxXsht-FwplzS3EzsvUmJBtYgcBKu6tG2pYDmZze5-kP_lPhl1TiEb07pdsJyFAkOnRtWWb4U',
    ],
  },
  {
    id: 3,
    nombre: 'Almohada Cervical Ergonómica Gel',
    sku: 'TRR-ALM-G050',
    categoria: 'Almohadas',
    precio: '280',
    showroom: 18,
    bodega: 85,
    visible: true,
    detalle: 'Estándar · Gel Térmico',
    tono: 'blue',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRbyj3vDZl8Jfn1VHjv41mPs-75CSzXxDsM8sbcq1Bujy6gquGJ8aoqDC84yP010Jd_Ri6ht9_jH9fbKmerRsG0wC-WhP8RDUXQXW4SKbjtsST50x6hND1jkPU3o6AB1jhmtTCVpnJNLQzRCT-JANI4yFXC6kihnKArBswPWnwMGWgTXy0wtzcECoSpwWAoy8cEU6LLcXCSC_Pr8sfBS-Onfi23NGP5PbZYWCnq9eE3tEnKNW7JeBc',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRbyj3vDZl8Jfn1VHjv41mPs-75CSzXxDsM8sbcq1Bujy6gquGJ8aoqDC84yP010Jd_Ri6ht9_jH9fbKmerRsG0wC-WhP8RDUXQXW4SKbjtsST50x6hND1jkPU3o6AB1jhmtTCVpnJNLQzRCT-JANI4yFXC6kihnKArBswPWnwMGWgTXy0wtzcECoSpwWAoy8cEU6LLcXCSC_Pr8sfBS-Onfi23NGP5PbZYWCnq9eE3tEnKNW7JeBc',
    ],
  },
  {
    id: 4,
    nombre: 'Juego de Living Modular Roble & Lino',
    sku: 'TRR-LVG-MOD8',
    categoria: 'Living',
    precio: '7.200',
    showroom: 1,
    bodega: 4,
    visible: true,
    detalle: 'Configuración Completa · Lino Beige',
    tono: 'terra',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIWgZeIyWl1iiSfqgMcewJ1yCXm5B4RdvQRDkrgaAXMO7LYlQoKyxSyq9s3dWaQwLzEcjxDIMF1lLFn8em4oFupQ8kcKO9nFJfmVcf-A7cdKfuDYeKkD2V59VkccSOxKq8b65TtvBMzneqtkOxZ28ILUaMbB8z0FqjsRAc1RVeMSEgYH-t-7jp9eGf4bSbJbwu1lKEb03tet2mN2aTVGGLlotlRat2d0ErZpgDWH_pRPVvEZ5SOa-E',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBIWgZeIyWl1iiSfqgMcewJ1yCXm5B4RdvQRDkrgaAXMO7LYlQoKyxSyq9s3dWaQwLzEcjxDIMF1lLFn8em4oFupQ8kcKO9nFJfmVcf-A7cdKfuDYeKkD2V59VkccSOxKq8b65TtvBMzneqtkOxZ28ILUaMbB8z0FqjsRAc1RVeMSEgYH-t-7jp9eGf4bSbJbwu1lKEb03tet2mN2aTVGGLlotlRat2d0ErZpgDWH_pRPVvEZ5SOa-E',
    ],
  },
  {
    id: 5,
    nombre: 'Set Ropa de Cama Algodón Egipcio King',
    sku: 'TRR-LIN-K400',
    categoria: 'Ropa de cama',
    precio: '680',
    showroom: 2,
    bodega: 30,
    visible: true,
    detalle: 'King · 400 Hilos Satén Blanco',
    tono: 'linen',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzT-XQKQxqXQGRV4cM4MTI9dNop0n4-te7LnsgHOXtF82W0q9rbF4RfRjSnDihWPDvidwAakZgic4juIM8sAB1M3rNflotOf5eaIyeu5seJDPyrDjtM6irgdoUJteV4DccyUdzZACPtd1l4S3m6hWV6EFTjdfuuDOgIUGTMmL0NS75QKU2zJTSivsMN3QS4kEbXwSCsCxg5wadzhRZCIiobuQ2XfLSo0kRieTMBQnbqToD_Ry3ypm',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzT-XQKQxqXQGRV4cM4MTI9dNop0n4-te7LnsgHOXtF82W0q9rbF4RfRjSnDihWPDvidwAakZgic4juIM8sAB1M3rNflotOf5eaIyeu5seJDPyrDjtM6irgdoUJteV4DccyUdzZACPtd1l4S3m6hWV6EFTjdfuuDOgIUGTMmL0NS75QKU2zJTSivsMN3QS4kEbXwSCsCxg5wadzhRZCIiobuQ2XfLSo0kRieTMBQnbqToD_Ry3ypm',
    ],
  },
  {
    id: 6,
    nombre: 'Colchón TERRA BioRest 2 Plazas',
    sku: 'TRR-COL-B140',
    categoria: 'Colchones',
    precio: '2.450',
    showroom: 9,
    bodega: 22,
    visible: true,
    detalle: '2 Plazas · 140 × 190 cm',
    tono: 'green',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA5rj2Ps0QijJsV3RmcBdEsz5td4d3QkcOvpDQLDsjyMmahvd61qSfR58oeyLER6LGD8M5QQOF9K2DMZj4dQEdzi0avUBsjWbOLot8w3w-JcyCXpztBL4MRJDWVwJH1s5z9Pr7bcKiqxs0YYhXgOJUKGjaluD9u5gsKUsbBi-oVTjwxXsht-FwplzS3EzsvUmJBtYgcBKu6tG2pYDmZze5-kP_lPhl1TiEb07pdsJyFAkOnRtWWb4U',
    imagenes: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAA5rj2Ps0QijJsV3RmcBdEsz5td4d3QkcOvpDQLDsjyMmahvd61qSfR58oeyLER6LGD8M5QQOF9K2DMZj4dQEdzi0avUBsjWbOLot8w3w-JcyCXpztBL4MRJDWVwJH1s5z9Pr7bcKiqxs0YYhXgOJUKGjaluD9u5gsKUsbBi-oVTjwxXsht-FwplzS3EzsvUmJBtYgcBKu6tG2pYDmZze5-kP_lPhl1TiEb07pdsJyFAkOnRtWWb4U',
    ],
  },
];

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [soloKiosco, setSoloKiosco] = useState(false);
  const [ajuste, setAjuste] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Modales
  const [nuevoProducto, setNuevoProducto] = useState(false);
  const [imagenesNuevo, setImagenesNuevo] = useState([]);
  const [urlNuevo, setUrlNuevo] = useState('');
  const [coloresNuevo, setColoresNuevo] = useState([]);
  const [valorColorNuevo, setValorColorNuevo] = useState('#54595f');
  const [nombreColorNuevo, setNombreColorNuevo] = useState('');

  const [vistaProducto, setVistaProducto] = useState(null);
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);

  const [editarProducto, setEditarProducto] = useState(null);
  const [editImagenes, setEditImagenes] = useState([]);
  const [urlEdit, setUrlEdit] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  const [categoriasApi, setCategoriasApi] = useState([]);

  // Categorías reales desde la base de datos (endpoint /categorias)
  useEffect(() => {
    let activo = true;
    listarCategorias()
      .then((cats) => {
        if (!activo) return;
        setCategoriasApi(Array.isArray(cats) ? cats.map((c) => c?.nombre).filter(Boolean) : []);
      })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(['Todos']);
    for (const nombre of categoriasApi) set.add(nombre);
    for (const p of productos) {
      if (p.categoria) set.add(p.categoria);
    }
    return Array.from(set);
  }, [productos, categoriasApi]);

  // Opciones para los <select> de categoría (crear/editar): solo datos reales
  const opcionesCategoria = useMemo(() => {
    const set = new Set(categoriasApi);
    for (const p of productos) if (p.categoria) set.add(p.categoria);
    if (editarProducto?.categoria) set.add(editarProducto.categoria);
    return Array.from(set);
  }, [categoriasApi, productos, editarProducto]);

  const avisar = texto => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 3000);
  };

  // Cargar productos reales desde backend PostgreSQL
  const cargarProductos = async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const lista = await listarProductos({ todos: true, limite: 100, usarRespaldo: false });
      setProductos(lista.map(p => ({
        ...p,
        precio: typeof p.precio === 'number' ? p.precio.toLocaleString('es-BO') : p.precio,
        tono: p.tono || 'terra',
      })));
    } catch (err) {
      setProductos([]);
      setErrorCarga(err.message || 'No fue posible obtener los productos de PostgreSQL.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
    listarCategorias().then((lista) => setCategoriasDisponibles(Array.isArray(lista) ? lista : [])).catch(() => setCategoriasDisponibles([]));
  }, []);

  const visibles = useMemo(() => productos.filter(p =>
    `${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase().includes(buscar.toLowerCase()) &&
    (categoria === 'Todos' || p.categoria === categoria) &&
    (!soloKiosco || p.visible)
  ), [productos, buscar, categoria, soloKiosco]);

  // Cálculos dinámicos de KPIs sobre inventario real
  const totalShowroom = useMemo(() => productos.reduce((acc, p) => acc + (Number(p.showroom) || 0), 0), [productos]);
  const totalBodega = useMemo(() => productos.reduce((acc, p) => acc + (Number(p.bodega) || 0), 0), [productos]);
  const totalModelosKiosco = useMemo(() => productos.filter(p => p.visible).length, [productos]);
  const valorInventario = useMemo(() => {
    const total = productos.reduce((acc, p) => {
      const precioNum = Number(String(p.precio).replace(/\./g, '').replace(/,/g, '.')) || 0;
      const stockTotal = (Number(p.showroom) || 0) + (Number(p.bodega) || 0);
      return acc + (precioNum * stockTotal);
    }, 0);
    return total.toLocaleString('es-BO');
  }, [productos]);
  const modelosCriticos = useMemo(() => productos.filter(p => (Number(p.showroom) || 0) < 2).length, [productos]);

  const abrirVista = producto => {
    setVistaProducto(producto);
    setFotoActivaIndex(0);
  };

  const abrirEdicion = producto => {
    setEditarProducto(producto);
    const listaFotos = producto.imagenes?.length
      ? [...producto.imagenes]
      : (producto.imagen_url ? [producto.imagen_url] : []);
    setEditImagenes(listaFotos);
    setUrlEdit('');
  };

  const guardarAjuste = async () => {
    if (!ajuste) return;
    try {
      const showroom = Number(ajuste.showroom);
      const bodega = Number(ajuste.bodega);
      await actualizarStock(ajuste.id, { showroom, bodega });
      setProductos(lista => lista.map(p => p.id === ajuste.id ? { ...p, showroom, bodega, stock: showroom + bodega } : p));
      setAjuste(null);
      avisar(`Stock de ${ajuste.sku} sincronizado en tiempo real con PostgreSQL y kioscos.`);
    } catch (err) {
      avisar('Error al actualizar inventario en el servidor.');
    }
  };

  // Manejo de imágenes en Nuevo Producto
  const agregarImagenesNuevoArchivos = event => {
    const urls = Array.from(event.target.files).map(file => URL.createObjectURL(file));
    setImagenesNuevo(prev => [...prev, ...urls]);
  };

  const agregarUrlNuevo = () => {
    if (urlNuevo.trim()) {
      setImagenesNuevo(prev => [...prev, urlNuevo.trim()]);
      setUrlNuevo('');
    }
  };

  const agregarColorNuevo = () => {
    const registro = `${nombreColorNuevo.trim() || 'Color'}|${valorColorNuevo}`;
    if (!/^#[0-9a-f]{6}$/i.test(valorColorNuevo) || coloresNuevo.includes(registro)) return;
    setColoresNuevo((lista) => [...lista, registro]);
    setNombreColorNuevo('');
  };

  const eliminarImagenNuevo = index => {
    setImagenesNuevo(prev => prev.filter((_, i) => i !== index));
  };

  const establecerPortadaNuevo = index => {
    setImagenesNuevo(prev => {
      const nueva = [...prev];
      const [item] = nueva.splice(index, 1);
      return [item, ...nueva];
    });
    avisar('Imagen fijada como portada del producto.');
  };

  const moverImagenNuevo = (from, to) => {
    setImagenesNuevo(prev => {
      const arr = [...prev];
      if (to < 0 || to >= arr.length) return arr;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const registrarProducto = async event => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const payload = {
      nombre: datos.get('nombre'),
      sku: datos.get('sku'),
      categoria: datos.get('categoria'),
      precio: Number(datos.get('precio')),
      showroom: Number(datos.get('showroom')),
      bodega: Number(datos.get('bodega')),
      activo: datos.get('visible') === 'on',
      detalle: datos.get('detalle') || 'Especificación showroom',
      descripcion: datos.get('descripcion') || '',
      imagen_url: imagenesNuevo[0] || null,
      imagenes: imagenesNuevo,
      video_url: String(datos.get('video_url') || '').trim() || null,
      colores: coloresNuevo,
    };

    try {
      const creado = await crearProducto(payload);
      const formateado = {
        ...creado,
        precio: Number(creado.precio).toLocaleString('es-BO'),
        tono: 'green',
      };
      setProductos(lista => [formateado, ...lista]);
      setNuevoProducto(false);
      setImagenesNuevo([]);
      setUrlNuevo('');
      setColoresNuevo([]);
      setNombreColorNuevo('');
      setCategoria('Todos');
      avisar(`Producto ${payload.sku} guardado exitosamente en base de datos.`);
    } catch (err) {
      avisar(`Error al registrar en servidor: ${err.message}`);
    }
  };

  // Manejo de imágenes en Editar Producto
  const agregarImagenesEditArchivos = event => {
    const urls = Array.from(event.target.files).map(file => URL.createObjectURL(file));
    setEditImagenes(prev => [...prev, ...urls]);
  };

  const agregarUrlEdit = () => {
    if (urlEdit.trim()) {
      setEditImagenes(prev => [...prev, urlEdit.trim()]);
      setUrlEdit('');
    }
  };

  const eliminarImagenEdit = index => {
    setEditImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const establecerPortadaEdit = index => {
    setEditImagenes(prev => {
      const nueva = [...prev];
      const [item] = nueva.splice(index, 1);
      return [item, ...nueva];
    });
    avisar('Imagen fijada como portada del producto.');
  };

  const moverImagenEdit = (from, to) => {
    setEditImagenes(prev => {
      const arr = [...prev];
      if (to < 0 || to >= arr.length) return arr;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const guardarEdicion = async event => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const precioNumerico = Number(datos.get('precio'));
    const payload = {
      nombre: datos.get('nombre'),
      sku: datos.get('sku'),
      categoria: datos.get('categoria'),
      precio: precioNumerico > 0 ? precioNumerico : Number(String(editarProducto.precio).replace(/\./g, '').replace(/,/g, '.')),
      detalle: datos.get('detalle') || editarProducto.detalle,
      descripcion: datos.get('descripcion') || editarProducto.descripcion,
      showroom: Number(datos.get('showroom')),
      bodega: Number(datos.get('bodega')),
      activo: datos.get('visible') === 'on',
      imagen_url: editImagenes[0] || null,
      imagenes: editImagenes,
      video_url: String(datos.get('video_url') || '').trim() || null,
    };

    try {
      const actualizado = await actualizarProducto(editarProducto.id, payload);
      const formateado = {
        ...actualizado,
        precio: Number(actualizado.precio).toLocaleString('es-BO'),
        tono: editarProducto.tono || 'green',
      };
      setProductos(lista => lista.map(item => item.id === editarProducto.id ? formateado : item));
      setEditarProducto(null);
      avisar(`Producto ${payload.sku} actualizado en la base de datos real.`);
    } catch (err) {
      avisar(`Error al actualizar en servidor: ${err.message}`);
    }
  };

  const borrarProducto = async producto => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;
    try {
      await eliminarProducto(producto.id);
      setProductos(lista => lista.filter(item => item.id !== producto.id));
      if (vistaProducto?.id === producto.id) setVistaProducto(null);
      if (editarProducto?.id === producto.id) setEditarProducto(null);
      avisar(`Producto ${producto.sku} eliminado.`);
    } catch (err) {
      avisar(`No se pudo eliminar el producto: ${err.message}`);
    }
  };

  return (
    <main className="products-admin">
      {errorCarga && <section className="products-db-error"><b>No se cargaron datos reales.</b><span>{errorCarga}</span><button type="button" onClick={cargarProductos}>Reintentar conexión</button></section>}
      {false && <section className="products-alert">
        <div>
          <span><Box size={22} /></span>
          <div>
            <b>Atención de stock en showroom <em>{modelosCriticos} críticos</em></b>
            <p>Hay modelos con menos de 2 unidades disponibles para retiro inmediato.</p>
          </div>
        </div>
        <button onClick={() => avisar('Solicitud de traslado creada.')}>
          <Truck size={18} /> Solicitar traslado
        </button>
      </section>}

      <header className="products-heading">
        <div>
          <div>
            <h1>Catálogo de productos e inventario</h1>
            <b>{productos.length} productos registrados</b>
          </div>
          <p>Gestión de catálogo digital, inventario multialmacén y visibilidad en kioscos.</p>
        </div>
        <div className="products-toolbar">
          <button onClick={() => avisar('Exportación Excel preparada.')}>
            <Download size={17} /> Excel
          </button>
          <button onClick={() => avisar('Fichas PDF preparadas.')}>
            <Download size={17} /> PDF
          </button>
          <button onClick={() => productos.length > 0 && setAjuste({ ...productos[0] })}>
            <SlidersHorizontal size={18} /> Ajuste rápido
          </button>
          <button className="primary" onClick={() => setNuevoProducto(true)}>
            <Plus size={18} /> Nuevo producto
          </button>
        </div>
      </header>

      <section className="products-kpis">
        <article>
          <Store />
          <div>
            <small>Showroom Equipetrol</small>
            <b>{totalShowroom} unid.</b>
            <span>Disponible en sala</span>
          </div>
        </article>
        <article>
          <Warehouse />
          <div>
            <small>Bodega central</small>
            <b>{totalBodega} unid.</b>
            <span>Disponibilidad 24 h</span>
          </div>
        </article>
        <article>
          <Box />
          <div>
            <small>Activos en kioscos</small>
            <b>{totalModelosKiosco} modelos</b>
            <span>Sincronización continua</span>
          </div>
        </article>
        <article>
          <CheckCircle2 />
          <div>
            <small>Valor inventario</small>
            <b>Bs {valorInventario}</b>
            <span>Costo total en tienda</span>
          </div>
        </article>
      </section>

      <section className="products-filters">
        <label>
          <Search size={19} />
          <input
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por SKU, modelo o acabado..."
          />
        </label>
        <label className="products-switch">
          <span>Solo visibles en kiosco</span>
          <input
            checked={soloKiosco}
            onChange={e => setSoloKiosco(e.target.checked)}
            type="checkbox"
          />
        </label>
        <button onClick={() => { setBuscar(''); setCategoria('Todos'); setSoloKiosco(false); }}>
          <X size={17} /> Limpiar filtros
        </button>
        <nav>
          {categorias.map(item => (
            <button
              key={item}
              className={categoria === item ? 'active' : ''}
              onClick={() => setCategoria(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </section>

      <section className="products-table">
        <header>
          <div>
            <h2>Productos y stock por ubicación</h2>
            <span>Mostrando {visibles.length} de {productos.length} registros</span>
          </div>
          <button onClick={() => window.open('/catalogo', '_blank')}>
            <Eye size={18} /> Ver kiosco
          </button>
        </header>

        <div className="products-scroll">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Showroom</th>
                <th>Bodega central</th>
                <th>Kiosco</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-info">
                      <span className={`product-thumb ${p.tono || 'green'}`}>
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} />
                        ) : (
                          <Box size={22} />
                        )}
                      </span>
                      <div>
                        <b>{p.nombre}</b>
                        <small>{p.sku} · {p.detalle}</small>
                      </div>
                    </div>
                  </td>
                  <td>{p.categoria}</td>
                  <td><strong>Bs {p.precio}</strong></td>
                  <td>
                    <span className={p.showroom < 2 ? 'stock low' : 'stock'}>
                      {p.showroom} un.
                    </span>
                  </td>
                  <td>
                    <span className={p.bodega === 0 ? 'stock low' : 'stock'}>
                      {p.bodega} un.
                    </span>
                  </td>
                  <td>
                    <span className={p.visible ? 'kiosk visible' : 'kiosk'}>
                      {p.visible ? 'Activo' : 'Oculto'}
                    </span>
                  </td>
                  <td>
                    <div className="product-actions">
                      <button title="Vista previa / Ver fotos" onClick={() => abrirVista(p)}>
                        <Eye size={17} />
                      </button>
                      <button title="Ajustar stock" onClick={() => setAjuste({ ...p })}>
                        <SlidersHorizontal size={17} />
                      </button>
                      <button title="Editar producto y fotos" onClick={() => abrirEdicion(p)}>
                        <Edit3 size={17} />
                      </button>
                      <button className="product-action-delete" title="Eliminar producto" onClick={() => borrarProducto(p)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL VISTA PREVIA (VER PRODUCTO CON FOTOS) */}
      {vistaProducto && (
        <div className="products-modal product-view-modal">
          <section>
            <header>
              <div>
                <span><Eye size={20} /></span>
                <div>
                  <h2>Vista previa del producto</h2>
                  <p>{vistaProducto.sku} · {vistaProducto.categoria}</p>
                </div>
              </div>
              <button type="button" onClick={() => setVistaProducto(null)}><X /></button>
            </header>

            <div className="product-view-body">
              {/* Escenario de Fotos de Alta Calidad */}
              {(() => {
                const fotos = vistaProducto.imagenes?.length
                  ? vistaProducto.imagenes
                  : (vistaProducto.imagen_url ? [vistaProducto.imagen_url] : []);
                const video = mediaDeVideo(vistaProducto.video_url);
                const viendoVideo = Boolean(video) && fotoActivaIndex === 0;
                const indiceFoto = video ? fotoActivaIndex - 1 : fotoActivaIndex;

                return (
                  <div className="product-view-stage">
                    <div className={video ? 'product-view-stage-main product-view-stage-main--media' : 'product-view-stage-main'}>
                      {viendoVideo ? (
                        video.tipo === 'embed' ? (
                          <iframe src={video.src} title={`Video de ${vistaProducto.nombre}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (
                          <video key={video.src} src={video.src} controls playsInline preload="auto" poster={fotos[0]}><source src={video.src} type={video.mime || 'video/mp4'} /></video>
                        )
                      ) : fotos[indiceFoto] ? (
                        <img src={fotos[indiceFoto]} alt={vistaProducto.nombre} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#707974' }}>
                          <Box size={42} />
                          <small style={{ marginTop: '0.4rem' }}>Sin imagen registrada</small>
                        </div>
                      )}
                    </div>

                    {(fotos.length + (video ? 1 : 0)) > 1 && (
                      <div className="product-view-stage-thumbs">
                        {video && (
                          <button key="video" type="button" className={fotoActivaIndex === 0 ? 'product-view-stage-thumb-video active' : 'product-view-stage-thumb-video'} onClick={() => setFotoActivaIndex(0)}>
                            <Play size={16} />
                            <span>Video</span>
                          </button>
                        )}
                        {fotos.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            className={fotoActivaIndex === (video ? i + 1 : i) ? 'active' : ''}
                            onClick={() => setFotoActivaIndex(video ? i + 1 : i)}
                          >
                            <img src={src} alt={`Vista ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="product-view-main">
                <div className="product-view-info">
                  <h3>{vistaProducto.nombre}</h3>
                  <p>SKU: <b>{vistaProducto.sku}</b> · Categoría: <b>{vistaProducto.categoria}</b></p>
                  <p style={{ marginTop: '0.2rem' }}>Medidas / Especificación: <b>{vistaProducto.detalle || 'Estándar'}</b></p>
                </div>
                <div className="product-view-price">
                  <small>Precio Kiosco</small>
                  <strong>Bs {vistaProducto.precio}</strong>
                </div>
              </div>

              <div className="product-view-badges">
                <span>
                  <b>Visibilidad:</b>
                  <span className={vistaProducto.visible ? 'kiosk visible' : 'kiosk'}>
                    {vistaProducto.visible ? '✓ Publicado en Kioscos' : 'Oculto al público'}
                  </span>
                </span>
                <span>
                  <b>Inventario Total:</b>
                  <strong style={{ color: '#004230', marginLeft: '0.3rem' }}>
                    {(vistaProducto.showroom || 0) + (vistaProducto.bodega || 0)} unidades
                  </strong>
                </span>
              </div>

              <div className="product-view-stats">
                <article>
                  <small>Showroom Equipetrol</small>
                  <b style={{ color: vistaProducto.showroom < 2 ? '#ba1a1a' : '#004230' }}>
                    {vistaProducto.showroom} un.
                  </b>
                  <span style={{ fontSize: '11px', color: '#707974' }}>
                    {vistaProducto.showroom < 2 ? '⚠️ Stock crítico en sala' : 'Disponible en sala'}
                  </span>
                </article>

                <article>
                  <small>Bodega Central</small>
                  <b>{vistaProducto.bodega} un.</b>
                  <span style={{ fontSize: '11px', color: '#707974' }}>Despacho coordinado 24 h</span>
                </article>

                <article>
                  <small>Galería registrada</small>
                  <b style={{ color: '#004230' }}>
                    {(vistaProducto.imagenes?.length || (vistaProducto.imagen_url ? 1 : 0))} fotos
                  </b>
                  <span style={{ fontSize: '11px', color: '#707974' }}>Resolución showroom</span>
                </article>
              </div>
            </div>

            <footer>
              <button type="button" onClick={() => setVistaProducto(null)}>
                Cerrar
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => {
                  abrirEdicion(vistaProducto);
                  setVistaProducto(null);
                }}
              >
                <Edit3 size={17} /> Editar este producto
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO (INCLUYE GESTIÓN COMPLETA DE IMÁGENES) */}
      {editarProducto && (
        <div className="products-modal product-create-modal">
          <form onSubmit={guardarEdicion}>
            <header>
              <div>
                <span><Edit3 size={20} /></span>
                <div>
                  <h2>Editar producto · {editarProducto.sku}</h2>
                  <p>Modifica la información comercial, stock y galería fotográfica para kioscos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditarProducto(null)}><X /></button>
            </header>

            <div className="product-form-grid">
              <label>
                Nombre comercial
                <input
                  name="nombre"
                  required
                  defaultValue={editarProducto.nombre}
                  placeholder="Ej. Sommier Nórdico Bouclé Queen"
                />
              </label>

              <label>
                SKU / Código interno
                <input
                  name="sku"
                  required
                  defaultValue={editarProducto.sku}
                  placeholder="TRR-SOM-B160"
                />
              </label>

              <label>
                Categoría
                <select name="categoria" required defaultValue={editarProducto.categoria}>
<<<<<<< .merge_file_Tt5UWn
                  {opcionesCategoria.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
=======
                  {categoriasDisponibles.map((categoria) => <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>)}
>>>>>>> .merge_file_eekQM0
                </select>
              </label>

              <label>
                Precio de venta (Bs)
                <input
                  name="precio"
                  required
                  min="0"
                  type="number"
                  defaultValue={Number(String(editarProducto.precio).replace(/[^0-9]/g, '')) || 0}
                  placeholder="0.00"
                />
              </label>

              <label>
                Medidas / Especificación
                <input
                  name="detalle"
                  defaultValue={editarProducto.detalle}
                  placeholder="Ej. Queen · 160 × 200 cm"
                />
              </label>

              <label>
                Stock showroom
                <input
                  name="showroom"
                  required
                  min="0"
                  type="number"
                  defaultValue={editarProducto.showroom}
                />
              </label>

              <label>
                Stock bodega central
                <input
                  name="bodega"
                  required
                  min="0"
                  type="number"
                  defaultValue={editarProducto.bodega}
                />
              </label>

              <label className="product-form-wide">
                Descripción para catálogo
                <textarea
                  name="descripcion"
                  defaultValue={editarProducto.descripcion || ''}
                  placeholder="Describe beneficios, materiales y garantía del producto."
                />
              </label>

              <label className="product-form-wide">
                URL de video del producto <small>Opcional · YouTube, Vimeo o enlace directo MP4</small>
                <input name="video_url" type="url" defaultValue={editarProducto.video_url || ''} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
            </div>

            {/* Galería de Imágenes en Edición */}
            <section className="product-gallery">
              <div>
                <b>Galería de imágenes ({editImagenes.length})</b>
                <small>
                  Sube fotos desde tu computadora o agrega enlaces web directos (URLs). La primera foto será la portada principal.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                <label className="product-upload" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
                  <ImagePlus size={20} />
                  <span>Subir imágenes desde archivo</span>
                  <input type="file" accept="image/*" multiple onChange={agregarImagenesEditArchivos} />
                </label>
              </div>

              <div className="product-url-row">
                <input
                  type="url"
                  placeholder="O pega el enlace URL de una imagen (https://...)"
                  value={urlEdit}
                  onChange={e => setUrlEdit(e.target.value)}
                />
                <button type="button" onClick={agregarUrlEdit}>
                  <Link2 size={16} /> Agregar URL
                </button>
              </div>

              <div className="product-image-list" style={{ marginTop: '1rem' }}>
                {editImagenes.map((src, index) => (
                  <figure key={index} className={index === 0 ? 'is-cover' : ''}>
                    <img src={src} alt={`Foto ${index + 1}`} />
                    <div className="product-img-toolbar">
                      {index !== 0 && (
                        <button
                          type="button"
                          className="btn-star"
                          title="Hacer portada principal"
                          onClick={() => establecerPortadaEdit(index)}
                        >
                          <Star size={12} fill="#ffdb9b" />
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          title="Mover antes"
                          onClick={() => moverImagenEdit(index, index - 1)}
                        >
                          <ChevronLeft size={12} />
                        </button>
                      )}
                      {index < editImagenes.length - 1 && (
                        <button
                          type="button"
                          title="Mover después"
                          onClick={() => moverImagenEdit(index, index + 1)}
                        >
                          <ChevronRight size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-delete"
                        title="Eliminar foto"
                        onClick={() => eliminarImagenEdit(index)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <figcaption>{index === 0 ? '★ Portada Kiosco' : `Foto ${index + 1}`}</figcaption>
                  </figure>
                ))}
                {editImagenes.length === 0 && (
                  <p>Sin imágenes asignadas. Agrega al menos una para visibilidad en el kiosco.</p>
                )}
              </div>
            </section>

            <label className="product-kiosk-check">
              <input
                name="visible"
                type="checkbox"
                defaultChecked={editarProducto.visible}
              />
              Publicar y mantener visible este producto en los kioscos de autoservicio
            </label>

            <footer>
              <button type="button" onClick={() => setEditarProducto(null)}>
                Cancelar
              </button>
              <button className="primary" type="submit">
                <CheckCircle2 size={18} /> Guardar cambios y fotos
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO PRODUCTO */}
      {nuevoProducto && (
        <div className="products-modal product-create-modal">
          <form onSubmit={registrarProducto}>
            <header>
              <div>
                <span><PackagePlus size={20} /></span>
                <div>
                  <h2>Registrar nuevo producto</h2>
                  <p>Completa la ficha comercial, inventario y galería para kioscos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setNuevoProducto(false)}><X /></button>
            </header>

            <div className="product-form-grid">
              <label>
                Nombre comercial
                <input name="nombre" required placeholder="Ej. Colchón Terra Comfort King" />
              </label>
              <label>
                SKU / código interno
                <input name="sku" required placeholder="TRR-COL-K200" />
              </label>
              <label>
                Categoría
                <select name="categoria" required defaultValue="" disabled={!categoriasDisponibles.length}>
                  <option value="" disabled>Seleccionar categoría</option>
<<<<<<< .merge_file_Tt5UWn
                  {opcionesCategoria.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
=======
                  {categoriasDisponibles.map((categoria) => <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>)}
>>>>>>> .merge_file_eekQM0
                </select>
              </label>
              <label>
                Precio de venta (Bs)
                <input name="precio" required min="0" type="number" placeholder="0.00" />
              </label>
              <label>
                Medidas / Detalle
                <input name="detalle" placeholder="Ej. King · 200 × 200 cm" />
              </label>
              <label>
                Stock showroom
                <input name="showroom" required min="0" type="number" defaultValue="0" />
              </label>
              <label>
                Stock bodega central
                <input name="bodega" required min="0" type="number" defaultValue="0" />
              </label>
              <label className="product-form-wide">
                Descripción para catálogo
                <textarea
                  name="descripcion"
                  placeholder="Describe beneficios, materiales, medidas y garantía del producto."
                />
              </label>
              <label className="product-form-wide">
                URL de video del producto <small>Opcional · YouTube, Vimeo o enlace directo MP4</small>
                <input name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." />
              </label>
              <fieldset className="product-form-wide product-color-picker">
                <legend>Colores disponibles <small>Selecciona los tonos que el cliente podrá elegir</small></legend>
                <div className="product-color-picker__create"><input aria-label="Nombre del color" value={nombreColorNuevo} onChange={(event) => setNombreColorNuevo(event.target.value)} maxLength="40" placeholder="Ej. Gris grafito" /><input aria-label="Elegir tono del color" type="color" value={valorColorNuevo} onChange={(event) => setValorColorNuevo(event.target.value)} /><button type="button" onClick={agregarColorNuevo}><Plus size={16} /> Agregar color</button></div>
                <div className="product-color-picker__list">{coloresNuevo.map((registro) => { const [nombre, valor] = registro.split('|'); return <span key={registro}><i style={{ backgroundColor: valor }} />{nombre}<button type="button" aria-label={`Quitar ${nombre}`} onClick={() => setColoresNuevo((lista) => lista.filter((color) => color !== registro))}><X size={13} /></button></span>; })}{!coloresNuevo.length && <small>Escribe un nombre, elige el tono y agrega el color.</small>}</div>
              </fieldset>
            </div>

            <section className="product-gallery">
              <div>
                <b>Galería del producto ({imagenesNuevo.length})</b>
                <small>
                  Agrega imágenes mediante subida de archivos o URLs directas. La primera foto será la portada.
                </small>
              </div>

              <label className="product-upload">
                <ImagePlus size={22} />
                <span>Subir imágenes desde archivo</span>
                <input type="file" accept="image/*" multiple onChange={agregarImagenesNuevoArchivos} />
              </label>

              <div className="product-url-row">
                <input
                  type="url"
                  placeholder="O pega el enlace URL de una imagen (https://...)"
                  value={urlNuevo}
                  onChange={e => setUrlNuevo(e.target.value)}
                />
                <button type="button" onClick={agregarUrlNuevo}>
                  <Link2 size={16} /> Agregar URL
                </button>
              </div>

              <div className="product-image-list" style={{ marginTop: '1rem' }}>
                {imagenesNuevo.map((src, index) => (
                  <figure key={index} className={index === 0 ? 'is-cover' : ''}>
                    <img src={src} alt={`Producto ${index + 1}`} />
                    <div className="product-img-toolbar">
                      {index !== 0 && (
                        <button
                          type="button"
                          className="btn-star"
                          title="Hacer portada principal"
                          onClick={() => establecerPortadaNuevo(index)}
                        >
                          <Star size={12} fill="#ffdb9b" />
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          title="Mover antes"
                          onClick={() => moverImagenNuevo(index, index - 1)}
                        >
                          <ChevronLeft size={12} />
                        </button>
                      )}
                      {index < imagenesNuevo.length - 1 && (
                        <button
                          type="button"
                          title="Mover después"
                          onClick={() => moverImagenNuevo(index, index + 1)}
                        >
                          <ChevronRight size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-delete"
                        title="Eliminar foto"
                        onClick={() => eliminarImagenNuevo(index)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <figcaption>{index === 0 ? '★ Portada Kiosco' : `Foto ${index + 1}`}</figcaption>
                  </figure>
                ))}
                {imagenesNuevo.length === 0 && (
                  <p>Sin imágenes aún. Puedes agregar fotos locales o enlaces web.</p>
                )}
              </div>
            </section>

            <label className="product-kiosk-check">
              <input name="visible" type="checkbox" defaultChecked /> Publicar este producto en kioscos al guardarlo
            </label>

            <footer>
              <button type="button" onClick={() => setNuevoProducto(false)}>Cancelar</button>
              <button className="primary" type="submit">
                <CheckCircle2 size={18} /> Guardar producto
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* MODAL AJUSTE RÁPIDO */}
      {ajuste && (
        <div className="products-modal">
          <section>
            <header>
              <div>
                <span><SlidersHorizontal size={20} /></span>
                <div>
                  <h2>Ajuste rápido de inventario</h2>
                  <p>{ajuste.nombre} · {ajuste.sku}</p>
                </div>
              </div>
              <button onClick={() => setAjuste(null)}><X /></button>
            </header>
            <div className="adjust-row">
              <div>
                <b>Showroom Equipetrol</b>
                <small>Stock para venta inmediata</small>
              </div>
              <input
                min="0"
                type="number"
                value={ajuste.showroom}
                onChange={e => setAjuste({ ...ajuste, showroom: Number(e.target.value) })}
              />
            </div>
            <div className="adjust-row">
              <div>
                <b>Bodega central</b>
                <small>Stock matriz para reposición</small>
              </div>
              <input
                min="0"
                type="number"
                value={ajuste.bodega}
                onChange={e => setAjuste({ ...ajuste, bodega: Number(e.target.value) })}
              />
            </div>
            <footer>
              <button onClick={() => setAjuste(null)}>Cancelar</button>
              <button className="primary" onClick={guardarAjuste}>
                <PackagePlus size={18} /> Guardar y actualizar kioscos
              </button>
            </footer>
          </section>
        </div>
      )}

      {mensaje && (
        <div className="products-toast">
          <CheckCircle2 size={19} />{mensaje}
        </div>
      )}
    </main>
  );
}
