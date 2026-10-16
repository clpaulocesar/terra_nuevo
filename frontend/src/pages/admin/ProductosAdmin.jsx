import { useEffect, useMemo, useState } from 'react';
import { Box, CheckCircle2, ChevronLeft, ChevronRight, Download, Edit3, Eye, ImagePlus, Link2, PackagePlus, Play, Plus, Search, SlidersHorizontal, Star, Store, Trash2, Truck, X } from 'lucide-react';
import { listarProductos, listarCategorias, crearProducto, actualizarProducto, actualizarStock, eliminarProducto } from '../../services/productoService.js';
import { mediaDeVideo } from '../../utils/videoEmbed.js';
import { subirImagenProducto } from '../../services/storageService.js';
import { avisoEliminado, avisoError, avisoExito, confirmarEliminacion } from '../../utils/alertas.js';
import './Admin.css';
import './ProductosAdmin.css';
import './AdminViewsColorFix.css';
import './ProductosDb.css';
import './ProductosDelete.css';
import './ProductosCreateProfessional.css';
import './ProductosCreateMedium.css';
import './ColorAssistant.css';
import './ProductosModalReference.css';

const leerColor = (registro) => {
  if (registro && typeof registro === 'object') return registro;
  try {
    const dato = JSON.parse(String(registro));
    if (dato?.nombre && dato?.valor) return { ...dato, imagenes: Array.isArray(dato.imagenes) ? dato.imagenes : [] };
  } catch { /* formato anterior Nombre|#hex */ }
  const [nombre, valor] = String(registro).split('|');
  return { id: String(registro), nombre: valor ? nombre : (nombre || 'Color'), valor: valor || nombre, imagenes: [] };
};

const guardarColor = (color) => JSON.stringify({
  id: color.id,
  nombre: color.nombre,
  valor: color.valor,
  imagenes: Array.isArray(color.imagenes) ? color.imagenes : [],
});

// Nombres habituales para que el administrador no tenga que conocer códigos HEX.
const TONOS_SUGERIDOS = {
  'blanco': '#f5f5f3', 'negro': '#1f2022', 'gris': '#80858b', 'gris claro': '#c7c9c8',
  'gris grafito': '#54595f', 'gris oscuro': '#4c5054', 'beige': '#d4b48c', 'beige arena': '#cbb38a',
  'cafe': '#6f4e37', 'marron': '#76503d', 'chocolate': '#4b2e24', 'camel': '#b7794d',
  'lila': '#b7a2c8', 'lila claro': '#d7c9e6', 'morado': '#76529b', 'rosa': '#db9aaa',
  'terracota': '#a95f46', 'rojo': '#a6192e', 'bordo': '#7c1830', 'azul': '#365f91',
  'azul petroleo': '#455a64', 'verde': '#5e7652', 'verde oliva': '#68734d', 'mostaza': '#c38a28',
};
const normalizarNombreColor = (texto = '') => texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tonoSugerido = (nombre) => TONOS_SUGERIDOS[normalizarNombreColor(nombre)] || null;
const TONOS_RAPIDOS = ['Blanco', 'Negro', 'Gris grafito', 'Beige arena', 'Café', 'Lila claro', 'Terracota', 'Bordó', 'Azul petróleo', 'Verde oliva'];
const nombreColorDeImagen = (lista, imagen) => lista.map(leerColor).find((color) => color.imagenes?.includes(imagen))?.nombre || 'Galería general';
const buscarColorPorId = (lista, id) => lista.map(leerColor).find((color) => color.id === id) || null;

const productosIniciales = [
  {
    id: 1,
    nombre: 'Sommier Nórdico Bouclé Queen',
    sku: 'TRR-SOM-B160',
    categoria: 'Sommiers',
    precio: '3.950',
    showroom: 3,
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
  const [colorImagenNuevo, setColorImagenNuevo] = useState('');

  const [vistaProducto, setVistaProducto] = useState(null);
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);

  const [editarProducto, setEditarProducto] = useState(null);
  const [editImagenes, setEditImagenes] = useState([]);
  const [urlEdit, setUrlEdit] = useState('');
  const [coloresEdit, setColoresEdit] = useState([]);
  const [valorColorEdit, setValorColorEdit] = useState('#54595f');
  const [nombreColorEdit, setNombreColorEdit] = useState('');
  const [colorImagenEdit, setColorImagenEdit] = useState('');

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
  }, []);

  const visibles = useMemo(() => productos.filter(p =>
    `${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase().includes(buscar.toLowerCase()) &&
    (categoria === 'Todos' || p.categoria === categoria) &&
    (!soloKiosco || p.visible)
  ), [productos, buscar, categoria, soloKiosco]);

  // Cálculos dinámicos de KPIs sobre inventario real
  const totalShowroom = useMemo(() => productos.reduce((acc, p) => acc + (Number(p.showroom) || 0), 0), [productos]);
  const totalModelosKiosco = useMemo(() => productos.filter(p => p.visible).length, [productos]);
  const valorInventario = useMemo(() => {
    const total = productos.reduce((acc, p) => {
      const precioNum = Number(String(p.precio).replace(/\./g, '').replace(/,/g, '.')) || 0;
      const stockTotal = Number(p.showroom) || 0;
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
    setColoresEdit(Array.isArray(producto.colores) ? producto.colores : []);
    setColorImagenEdit(Array.isArray(producto.colores) && producto.colores.length ? leerColor(producto.colores[0]).id : '');
    setNombreColorEdit('');
  };

  const guardarAjuste = async () => {
    if (!ajuste) return;
    try {
      const showroom = Number(ajuste.showroom);
      await actualizarStock(ajuste.id, { showroom });
      setProductos(lista => lista.map(p => p.id === ajuste.id ? { ...p, showroom, stock: showroom } : p));
      setAjuste(null);
      avisar(`Stock de ${ajuste.sku} sincronizado en tiempo real con PostgreSQL y kioscos.`);
    } catch (err) {
      avisar('Error al actualizar inventario en el servidor.');
    }
  };

  // Manejo de imágenes en Nuevo Producto
  const asociarImagenesConColor = (setColores, colorSeleccionado, urls) => {
    if (!colorSeleccionado || !urls.length) return;
    setColores((lista) => lista.map((registro) => {
      const color = leerColor(registro);
      if (color.id !== colorSeleccionado) return registro;
      return guardarColor({ ...color, imagenes: [...new Set([...color.imagenes, ...urls])] });
    }));
  };

  const asignarImagenExistenteAColor = (setColores, colorSeleccionado, imagen) => {
    if (!colorSeleccionado || !imagen) return;
    setColores((lista) => lista.map((registro) => {
      const color = leerColor(registro);
      const sinImagen = color.imagenes.filter((src) => src !== imagen);
      return guardarColor({ ...color, imagenes: color.id === colorSeleccionado ? [...sinImagen, imagen] : sinImagen });
    }));
  };

  const agregarImagenesNuevoArchivos = async event => {
    const archivos = Array.from(event.target.files || []);
    if (!archivos.length) return;
    try {
      avisar(`Subiendo ${archivos.length} imagen${archivos.length > 1 ? 'es' : ''} a Supabase...`);
      const urls = await Promise.all(archivos.map(subirImagenProducto));
      setImagenesNuevo(prev => [...prev, ...urls]);
      asociarImagenesConColor(setColoresNuevo, colorImagenNuevo, urls);
      avisar('Imágenes guardadas permanentemente en Supabase.');
    } catch (err) { avisar(err.message || 'No se pudieron subir las imágenes.'); }
    finally { event.target.value = ''; }
  };

  const agregarUrlNuevo = () => {
    if (urlNuevo.trim()) {
      setImagenesNuevo(prev => [...prev, urlNuevo.trim()]);
      asociarImagenesConColor(setColoresNuevo, colorImagenNuevo, [urlNuevo.trim()]);
      setUrlNuevo('');
    }
  };

  const agregarColorNuevo = () => {
    const nombre = nombreColorNuevo.trim() || 'Color';
    const existe = coloresNuevo.some((registro) => leerColor(registro).valor.toLowerCase() === valorColorNuevo.toLowerCase() && leerColor(registro).nombre.toLowerCase() === nombre.toLowerCase());
    if (!/^#[0-9a-f]{6}$/i.test(valorColorNuevo) || existe) return;
    const registro = guardarColor({ id: `${nombre}-${valorColorNuevo}-${Date.now()}`, nombre, valor: valorColorNuevo, imagenes: [] });
    setColoresNuevo((lista) => [...lista, registro]);
    setColorImagenNuevo(leerColor(registro).id);
    setNombreColorNuevo('');
  };

  const actualizarNombreColorNuevo = (nombre) => {
    setNombreColorNuevo(nombre);
    const tono = tonoSugerido(nombre);
    if (tono) setValorColorNuevo(tono);
  };

  const elegirTonoNuevo = (nombre) => {
    const valor = tonoSugerido(nombre) || '#54595f';
    const existente = coloresNuevo.find((registro) => {
      const color = leerColor(registro);
      return normalizarNombreColor(color.nombre) === normalizarNombreColor(nombre);
    });
    if (existente) { setColorImagenNuevo(leerColor(existente).id); return; }
    const registro = guardarColor({ id: `${nombre}-${valor}-${Date.now()}`, nombre, valor, imagenes: [] });
    setColoresNuevo((lista) => [...lista, registro]);
    setColorImagenNuevo(leerColor(registro).id);
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

  const usarColorComoPortadaNuevo = () => {
    const foto = buscarColorPorId(coloresNuevo, colorImagenNuevo)?.imagenes?.[0];
    if (!foto) return avisar('Este color aún no tiene una imagen asignada.');
    setImagenesNuevo((lista) => [foto, ...lista.filter((item) => item !== foto)]);
    avisar('La primera imagen de este color ahora es la portada principal.');
  };

  const asignarColorAPortadaNuevo = () => {
    if (!imagenesNuevo[0]) return avisar('Primero agrega una imagen para usar como portada.');
    if (!colorImagenNuevo) return avisar('Primero selecciona una variante de color.');
    asignarImagenExistenteAColor(setColoresNuevo, colorImagenNuevo, imagenesNuevo[0]);
    avisar(`La portada ahora pertenece a ${buscarColorPorId(coloresNuevo, colorImagenNuevo)?.nombre || 'la variante elegida'}.`);
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
      setColorImagenNuevo('');
      setNombreColorNuevo('');
      setCategoria('Todos');
      await avisoExito({ titulo: '¡Producto creado!', texto: `${payload.nombre || payload.sku} se guardó correctamente en la base de datos.` });
    } catch (err) {
      await avisoError(`Error al registrar en servidor: ${err.message}`);
    }
  };

  // Manejo de imágenes en Editar Producto
  const agregarImagenesEditArchivos = async event => {
    const archivos = Array.from(event.target.files || []);
    if (!archivos.length) return;
    try {
      avisar(`Subiendo ${archivos.length} imagen${archivos.length > 1 ? 'es' : ''} a Supabase...`);
      const urls = await Promise.all(archivos.map(subirImagenProducto));
      setEditImagenes(prev => [...prev, ...urls]);
      asociarImagenesConColor(setColoresEdit, colorImagenEdit, urls);
      avisar('Imágenes guardadas permanentemente en Supabase.');
    } catch (err) { avisar(err.message || 'No se pudieron subir las imágenes.'); }
    finally { event.target.value = ''; }
  };

  const agregarUrlEdit = () => {
    if (urlEdit.trim()) {
      setEditImagenes(prev => [...prev, urlEdit.trim()]);
      asociarImagenesConColor(setColoresEdit, colorImagenEdit, [urlEdit.trim()]);
      setUrlEdit('');
    }
  };

  const agregarColorEdit = () => {
    const nombre = nombreColorEdit.trim() || 'Color';
    const existe = coloresEdit.some((registro) => leerColor(registro).valor.toLowerCase() === valorColorEdit.toLowerCase() && leerColor(registro).nombre.toLowerCase() === nombre.toLowerCase());
    if (!/^#[0-9a-f]{6}$/i.test(valorColorEdit) || existe) return;
    const registro = guardarColor({ id: `${nombre}-${valorColorEdit}-${Date.now()}`, nombre, valor: valorColorEdit, imagenes: [] });
    setColoresEdit((lista) => [...lista, registro]);
    setColorImagenEdit(leerColor(registro).id);
    setNombreColorEdit('');
  };

  const actualizarNombreColorEdit = (nombre) => {
    setNombreColorEdit(nombre);
    const tono = tonoSugerido(nombre);
    if (tono) setValorColorEdit(tono);
  };

  const elegirTonoEdit = (nombre) => {
    const valor = tonoSugerido(nombre) || '#54595f';
    const existente = coloresEdit.find((registro) => {
      const color = leerColor(registro);
      return normalizarNombreColor(color.nombre) === normalizarNombreColor(nombre);
    });
    if (existente) { setColorImagenEdit(leerColor(existente).id); return; }
    const registro = guardarColor({ id: `${nombre}-${valor}-${Date.now()}`, nombre, valor, imagenes: [] });
    setColoresEdit((lista) => [...lista, registro]);
    setColorImagenEdit(leerColor(registro).id);
    setNombreColorEdit('');
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

  const usarColorComoPortadaEdit = () => {
    const foto = buscarColorPorId(coloresEdit, colorImagenEdit)?.imagenes?.[0];
    if (!foto) return avisar('Este color aún no tiene una imagen asignada.');
    setEditImagenes((lista) => [foto, ...lista.filter((item) => item !== foto)]);
    avisar('La primera imagen de este color ahora es la portada principal.');
  };

  const asignarColorAPortadaEdit = () => {
    if (!editImagenes[0]) return avisar('Este producto todavía no tiene imagen de portada.');
    if (!colorImagenEdit) return avisar('Primero selecciona una variante de color.');
    asignarImagenExistenteAColor(setColoresEdit, colorImagenEdit, editImagenes[0]);
    avisar(`La portada ahora pertenece a ${buscarColorPorId(coloresEdit, colorImagenEdit)?.nombre || 'la variante elegida'}.`);
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
      activo: datos.get('visible') === 'on',
      imagen_url: editImagenes[0] || null,
      imagenes: editImagenes,
      video_url: String(datos.get('video_url') || '').trim() || null,
      colores: coloresEdit,
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
      await avisoExito({ titulo: '¡Producto actualizado!', texto: `${payload.nombre || payload.sku} se actualizó en la base de datos.` });
    } catch (err) {
      await avisoError(`Error al actualizar en servidor: ${err.message}`);
    }
  };

  const borrarProducto = async producto => {
    const confirmado = await confirmarEliminacion({
      titulo: `¿Eliminar "${producto.nombre}"?`,
      texto: 'Se borrará del catálogo y de la base de datos. No podrás revertir esta acción.',
    });
    if (!confirmado) return;
    try {
      await eliminarProducto(producto.id);
      setProductos(lista => lista.filter(item => item.id !== producto.id));
      if (vistaProducto?.id === producto.id) setVistaProducto(null);
      if (editarProducto?.id === producto.id) setEditarProducto(null);
      await avisoEliminado(`Producto ${producto.sku} eliminado.`);
    } catch (err) {
      await avisoError(`No se pudo eliminar el producto: ${err.message}`);
    }
  };

  return (
    <main className="products-admin">
      <datalist id="tonos-sugeridos">{Object.keys(TONOS_SUGERIDOS).map((nombre) => <option value={nombre.replace(/\b\w/g, (letra) => letra.toUpperCase())} key={nombre} />)}</datalist>
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
        </header>

        <div className="products-scroll">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Showroom</th>
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
                    {vistaProducto.showroom || 0} unidades
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
            <nav className="product-form-steps" aria-label="Secciones del formulario">
              <span><b>1</b> Información comercial</span><span><b>2</b> Variantes y colores</span><span><b>3</b> Galería multimedia</span><span><b>4</b> Publicación</span>
            </nav>

            <div className="product-form-grid">
              <div className="product-form-section-title"><div><span>Ficha técnica y comercial</span><small>Información que se mostrará en catálogo, kiosco y tienda web.</small></div><em>* Campos obligatorios</em></div>
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
                  {categoriasApi.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
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

              <label className="product-form-wide">
                Descripción para catálogo
                <textarea
                  name="descripcion"
                  defaultValue={editarProducto.descripcion || ''}
                  placeholder="Describe beneficios, materiales y garantía del producto."
                />
              </label>

              <label className="product-form-wide">
                Video promocional del producto <small>Opcional · general para todas las variantes; no se asigna a colores.</small>
                <input name="video_url" type="url" defaultValue={editarProducto.video_url || ''} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
              <fieldset className="product-form-wide product-color-picker">
                <legend>Variantes de color <small>Cada variante puede tener sus propias fotos.</small></legend>
                <div className="product-color-picker__create"><input aria-label="Nombre del color" list="tonos-sugeridos" value={nombreColorEdit} onChange={(event) => actualizarNombreColorEdit(event.target.value)} maxLength="40" placeholder="Ej. Beige arena" /><input aria-label="Elegir tono del color" title="Puedes ajustar manualmente el tono" type="color" value={valorColorEdit} onChange={(event) => setValorColorEdit(event.target.value)} /><button type="button" onClick={agregarColorEdit}><Plus size={16} /> Agregar color</button></div>
                <small>Color personalizado: escribe un nombre, ajusta el tono si quieres y pulsa “Agregar color”.</small>
                <b className="color-assistant__title">O agrega una variante rápida:</b>
                <div className="color-assistant" aria-label="Tonos sugeridos">{TONOS_RAPIDOS.map((nombre) => { const registro = coloresEdit.find((item) => normalizarNombreColor(leerColor(item).nombre) === normalizarNombreColor(nombre)); return <button type="button" key={nombre} onClick={() => elegirTonoEdit(nombre)} title={registro ? `${nombre} ya está registrado` : `Agregar ${nombre}`} className={`${registro ? 'is-registered' : ''} ${leerColor(registro).id === colorImagenEdit ? 'is-selected' : ''}`}><i style={{ backgroundColor: tonoSugerido(nombre) }} />{nombre}{registro && <em>Registrado</em>}</button>; })}</div>
                <div className="product-color-picker__list">{coloresEdit.map((registro) => { const color = leerColor(registro); return <span key={registro}><i style={{ backgroundColor: color.valor }} />{color.nombre}{color.imagenes.length > 0 && <em>{color.imagenes.length} foto{color.imagenes.length > 1 ? 's' : ''}</em>}<button type="button" aria-label={`Quitar ${color.nombre}`} onClick={() => { setColoresEdit((lista) => lista.filter((item) => item !== registro)); if (colorImagenEdit === color.id) setColorImagenEdit(''); }}><X size={13} /></button></span>; })}{!coloresEdit.length && <small>Aún no se registraron colores para este producto.</small>}</div>
              </fieldset>
            </div>

            {/* Galería de Imágenes en Edición */}
            <section className="product-gallery">
              <div>
                <b>Fotos de la variante ({editImagenes.length})</b>
                <small>
                  Elige un color y sus fotos se mostrarán al cliente cuando lo seleccione. La primera foto sigue siendo la portada general.
                </small>
              </div>
              <label className="product-color-image-target">Estoy cargando fotos para: 
                <select value={colorImagenEdit} onChange={(event) => setColorImagenEdit(event.target.value)} disabled={!coloresEdit.length}>
                  {!coloresEdit.length && <option value="">Primero registra un color</option>}
                  {coloresEdit.map((registro) => { const color = leerColor(registro); return <option value={color.id} key={registro}>{color.nombre}</option>; })}
                </select>
              </label>
              <button className="product-color-cover" type="button" disabled={!colorImagenEdit || !buscarColorPorId(coloresEdit, colorImagenEdit)?.imagenes?.length} onClick={usarColorComoPortadaEdit}>Usar la primera foto de este color como portada</button>
              <button className="product-color-cover product-color-cover--secondary" type="button" disabled={!colorImagenEdit || !editImagenes.length} onClick={asignarColorAPortadaEdit}>Asignar el color elegido a la portada actual</button>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                <label className="product-upload" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
                  <ImagePlus size={20} />
                  <span>Subir imágenes desde archivo</span>
                  <input type="file" accept="image/*" multiple disabled={!coloresEdit.length} onChange={agregarImagenesEditArchivos} />
                </label>
              </div>

              <div className="product-url-row">
                <input
                  type="url"
                  placeholder="O pega el enlace URL de una imagen (https://...)"
                  value={urlEdit} disabled={!coloresEdit.length}
                  onChange={e => setUrlEdit(e.target.value)}
                />
                <button type="button" disabled={!coloresEdit.length} onClick={agregarUrlEdit}>
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
                    <figcaption>{index === 0 ? '★ Portada' : `Foto ${index + 1}`} · {nombreColorDeImagen(coloresEdit, src)}</figcaption>
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
            <nav className="product-form-steps" aria-label="Secciones del formulario">
              <span><b>1</b> Información comercial</span><span><b>2</b> Variantes y colores</span><span><b>3</b> Galería multimedia</span><span><b>4</b> Publicación</span>
            </nav>

            <div className="product-form-grid">
              <div className="product-form-section-title"><div><span>Ficha técnica y comercial</span><small>Información que se mostrará en catálogo, kiosco y tienda web.</small></div><em>* Campos obligatorios</em></div>
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
                <select name="categoria" required defaultValue="" disabled={!categoriasApi.length}>
                  <option value="" disabled>Seleccionar categoría</option>
                  {categoriasApi.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
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
              <label className="product-form-wide">
                Descripción para catálogo
                <textarea
                  name="descripcion"
                  placeholder="Describe beneficios, materiales, medidas y garantía del producto."
                />
              </label>
              <label className="product-form-wide">
                Video promocional del producto <small>Opcional · general para todas las variantes; no se asigna a colores.</small>
                <input name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." />
              </label>
              <fieldset className="product-form-wide product-color-picker">
                <legend>Variantes de color <small>Cada variante puede tener sus propias fotos.</small></legend>
                <div className="product-color-picker__create"><input aria-label="Nombre del color" list="tonos-sugeridos" value={nombreColorNuevo} onChange={(event) => actualizarNombreColorNuevo(event.target.value)} maxLength="40" placeholder="Ej. Gris grafito" /><input aria-label="Elegir tono del color" title="Puedes ajustar manualmente el tono" type="color" value={valorColorNuevo} onChange={(event) => setValorColorNuevo(event.target.value)} /><button type="button" onClick={agregarColorNuevo}><Plus size={16} /> Agregar color</button></div>
                <small>Color personalizado: escribe un nombre, ajusta el tono si quieres y pulsa “Agregar color”.</small>
                <b className="color-assistant__title">O agrega una variante rápida:</b>
                <div className="color-assistant" aria-label="Tonos sugeridos">{TONOS_RAPIDOS.map((nombre) => { const registro = coloresNuevo.find((item) => normalizarNombreColor(leerColor(item).nombre) === normalizarNombreColor(nombre)); return <button type="button" key={nombre} onClick={() => elegirTonoNuevo(nombre)} title={registro ? `${nombre} ya está registrado` : `Agregar ${nombre}`} className={`${registro ? 'is-registered' : ''} ${leerColor(registro).id === colorImagenNuevo ? 'is-selected' : ''}`}><i style={{ backgroundColor: tonoSugerido(nombre) }} />{nombre}{registro && <em>Registrado</em>}</button>; })}</div>
                <div className="product-color-picker__list">{coloresNuevo.map((registro) => { const color = leerColor(registro); return <span key={registro}><i style={{ backgroundColor: color.valor }} />{color.nombre}{color.imagenes.length > 0 && <em>{color.imagenes.length} foto{color.imagenes.length > 1 ? 's' : ''}</em>}<button type="button" aria-label={`Quitar ${color.nombre}`} onClick={() => { setColoresNuevo((lista) => lista.filter((item) => item !== registro)); if (colorImagenNuevo === color.id) setColorImagenNuevo(''); }}><X size={13} /></button></span>; })}{!coloresNuevo.length && <small>Escribe un nombre, elige el tono y agrega el color.</small>}</div>
              </fieldset>
            </div>

            <section className="product-gallery">
              <div>
                <b>Fotos de la variante ({imagenesNuevo.length})</b>
                <small>
                  Primero elige el color y luego carga sus fotos. Al seleccionarlo, el cliente verá esas imágenes en el detalle.
                </small>
              </div>

              <label className="product-color-image-target">Estoy cargando fotos para: 
                <select value={colorImagenNuevo} onChange={(event) => setColorImagenNuevo(event.target.value)} disabled={!coloresNuevo.length}>
                  {!coloresNuevo.length && <option value="">Primero registra un color</option>}
                  {coloresNuevo.map((registro) => { const color = leerColor(registro); return <option value={color.id} key={registro}>{color.nombre}</option>; })}
                </select>
              </label>
              <button className="product-color-cover" type="button" disabled={!colorImagenNuevo || !buscarColorPorId(coloresNuevo, colorImagenNuevo)?.imagenes?.length} onClick={usarColorComoPortadaNuevo}>Usar la primera foto de este color como portada</button>
              <button className="product-color-cover product-color-cover--secondary" type="button" disabled={!colorImagenNuevo || !imagenesNuevo.length} onClick={asignarColorAPortadaNuevo}>Asignar el color elegido a la portada actual</button>

              <label className="product-upload">
                <ImagePlus size={22} />
                <span>Subir imágenes desde archivo</span>
                <input type="file" accept="image/*" multiple disabled={!coloresNuevo.length} onChange={agregarImagenesNuevoArchivos} />
              </label>

              <div className="product-url-row">
                <input
                  type="url"
                  placeholder="O pega el enlace URL de una imagen (https://...)"
                  value={urlNuevo} disabled={!coloresNuevo.length}
                  onChange={e => setUrlNuevo(e.target.value)}
                />
                <button type="button" disabled={!coloresNuevo.length} onClick={agregarUrlNuevo}>
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
                    <figcaption>{index === 0 ? '★ Portada' : `Foto ${index + 1}`} · {nombreColorDeImagen(coloresNuevo, src)}</figcaption>
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
