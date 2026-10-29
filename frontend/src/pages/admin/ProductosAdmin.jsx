import { useEffect, useMemo, useRef, useState } from 'react';
import { Armchair, BarChart3, BedDouble, Box, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Download, Edit3, Eye, EyeOff, ImagePlus, LampDesk, Link2, PackagePlus, Palette, PanelTop, Play, Plus, Printer, QrCode, Search, SlidersHorizontal, Sofa, Star, Store, Tag, Trash2, Truck, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { listarProductosPaginado, listarCategorias, crearProducto, actualizarProducto, actualizarStock, eliminarProducto, cambiarVisibilidadProducto } from '../../services/productoService.js';
import { mediaDeVideo } from '../../utils/videoEmbed.js';
import { subirImagenProducto } from '../../services/storageService.js';
import { imprimirTicketProducto } from '../../utils/imprimirTicketProducto.js';
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
  const normalizar = (color) => ({
    ...color,
    id: color.id || `${color.nombre}-${color.valor}`,
    nombre: String(color.nombre),
    valor: String(color.valor),
    imagenes: Array.isArray(color.imagenes) ? color.imagenes : [],
    modo: color.modo === 'paleta' ? 'paleta' : 'variante',
  });
  if (registro && typeof registro === 'object') {
    if (registro.nombre && registro.valor) return normalizar(registro);
    return normalizar({ nombre: 'Color', valor: '#54595f' });
  }
  try {
    const dato = JSON.parse(String(registro));
    if (dato?.nombre && dato?.valor) return normalizar(dato);
  } catch { /* formato anterior Nombre|#hex */ }
  const [nombre, valor] = String(registro).split('|');
  return normalizar({ id: String(registro), nombre: valor ? nombre : (nombre || 'Color'), valor: valor || nombre || '#54595f' });
};

const guardarColor = (color) => JSON.stringify({
  id: color.id,
  nombre: color.nombre,
  valor: color.valor,
  imagenes: Array.isArray(color.imagenes) ? color.imagenes : [],
  modo: color.modo || 'variante',
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
// Un mismo producto puede combinar colores únicos (variantes separadas) y una
// paleta multicolor (varios tonos dentro de la misma pieza). El modo vive en
// cada registro de color, así que la base de datos no necesita cambios.
const PALETA_ID = '__paleta__';
const esColorPaleta = (color) => (color?.modo || 'variante') === 'paleta';
const esDestinoPaleta = (destino) => destino === PALETA_ID;
const coloresDePaleta = (lista) => lista.map(leerColor).filter(esColorPaleta);
const coloresUnicos = (lista) => lista.map(leerColor).filter((color) => !esColorPaleta(color));
const coincideDestino = (color, destino) => (esDestinoPaleta(destino) ? esColorPaleta(color) : color.id === destino);

// Asocia fotos nuevas al destino elegido: un color único o todos los tonos de la paleta.
const asociarImagenesConDestino = (setColores, destino, urls) => {
  if (!destino || !urls.length) return;
  setColores((lista) => lista.map((registro) => {
    const color = leerColor(registro);
    if (!coincideDestino(color, destino)) return registro;
    return guardarColor({ ...color, imagenes: [...new Set([...color.imagenes, ...urls])] });
  }));
};

const asignarImagenExistenteADestino = (setColores, destino, imagen) => {
  if (!destino || !imagen) return;
  setColores((lista) => lista.map((registro) => {
    const color = leerColor(registro);
    const sinImagen = color.imagenes.filter((src) => src !== imagen);
    return guardarColor({ ...color, imagenes: coincideDestino(color, destino) ? [...sinImagen, imagen] : sinImagen });
  }));
};

const fotosDeDestino = (lista, destino) => lista.map(leerColor).filter((color) => coincideDestino(color, destino)).flatMap((color) => color.imagenes || []);

const nombreDeDestino = (lista, destino) => {
  if (!destino) return '';
  if (esDestinoPaleta(destino)) return 'la paleta multicolor';
  return lista.map(leerColor).find((color) => color.id === destino)?.nombre || 'este color';
};

const nombreColorDeImagen = (lista, imagen) => {
  const conFoto = lista.map(leerColor).filter((color) => color.imagenes?.includes(imagen));
  if (!conFoto.length) return 'Galería general';
  const unico = conFoto.find((color) => !esColorPaleta(color));
  if (unico) return unico.nombre;
  return `Paleta: ${conFoto.map((color) => color.nombre).join(', ')}`;
};

// Bloque compartido por los modales de "Nuevo producto" y "Editar producto":
// registra colores únicos y tonos de la paleta multicolor sobre la misma ficha,
// y asigna la galería al destino elegido (un color o la paleta completa).
function SelectorColores({ colores, setColores, destino, setDestino }) {
  const siguienteId = useRef(0);
  const [tipo, setTipo] = useState('variante');
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('#54595f');

  const registrosPaleta = colores.filter((registro) => esColorPaleta(leerColor(registro)));
  const registrosUnicos = colores.filter((registro) => !esColorPaleta(leerColor(registro)));
  const esPaleta = tipo === 'paleta';

  const escribirNombre = (texto) => {
    setNombre(texto);
    const tono = tonoSugerido(texto);
    if (tono) setValor(tono);
  };

  const crearColor = (nombreColor, valorColor, tipoColor) => {
    const nuevo = { id: `${nombreColor}-${valorColor}-${siguienteId.current++}`, nombre: nombreColor, valor: valorColor, imagenes: [], modo: tipoColor };
    setColores((lista) => [...lista, guardarColor(nuevo)]);
    setDestino(tipoColor === 'paleta' ? PALETA_ID : nuevo.id);
    setNombre('');
  };

  const agregarColor = () => {
    const nombreColor = nombre.trim() || 'Color';
    const repetido = colores.some((registro) => {
      const color = leerColor(registro);
      return color.valor.toLowerCase() === valor.toLowerCase() && color.nombre.toLowerCase() === nombreColor.toLowerCase() && (color.modo || 'variante') === tipo;
    });
    if (!/^#[0-9a-f]{6}$/i.test(valor) || repetido) return;
    crearColor(nombreColor, valor, tipo);
  };

  const elegirTono = (nombreTono) => {
    const existente = colores.find((registro) => {
      const color = leerColor(registro);
      return (color.modo || 'variante') === tipo && normalizarNombreColor(color.nombre) === normalizarNombreColor(nombreTono);
    });
    if (existente) {
      setDestino(esPaleta ? PALETA_ID : leerColor(existente).id);
      return;
    }
    crearColor(nombreTono, tonoSugerido(nombreTono) || '#54595f', tipo);
  };

  const quitarColor = (registro) => {
    const color = leerColor(registro);
    const restantes = colores.filter((item) => item !== registro);
    setColores(restantes);
    const restantesPaleta = coloresDePaleta(restantes);
    const restantesUnicos = coloresUnicos(restantes);
    if (esDestinoPaleta(destino) && !restantesPaleta.length) {
      setDestino(restantesUnicos[0]?.id || '');
    } else if (!esDestinoPaleta(destino) && destino === color.id) {
      setDestino(restantesUnicos[0]?.id || (restantesPaleta.length ? PALETA_ID : ''));
    }
  };

  const chipColor = (registro) => {
    const color = leerColor(registro);
    return (
      <span key={color.id || `${color.nombre}-${color.valor}`}>
        <i style={{ backgroundColor: color.valor }} />
        {color.nombre}
        {color.imagenes.length > 0 && <em>{color.imagenes.length} foto{color.imagenes.length > 1 ? 's' : ''}</em>}
        <button type="button" aria-label={`Quitar ${color.nombre}`} onClick={() => quitarColor(registro)}><X size={13} /></button>
      </span>
    );
  };

  return (
    <fieldset className="product-form-wide product-color-picker">
      <legend>Colores del producto <small>Podés registrar colores únicos y una paleta multicolor en la misma ficha.</small></legend>
      <div className="product-color-type" role="group" aria-label="Tipo de color a registrar">
        <button type="button" className={esPaleta ? '' : 'active'} onClick={() => setTipo('variante')}>
          <b><Tag size={14} /> Color único</b>
          <small>Cada tono es una variante que el cliente elige por separado.</small>
        </button>
        <button type="button" className={esPaleta ? 'active' : ''} onClick={() => setTipo('paleta')}>
          <b><Palette size={14} /> Paleta multicolor</b>
          <small>Varios tonos combinados dentro de una sola pieza.</small>
        </button>
      </div>
      <div className="product-color-picker__create">
        <input aria-label="Nombre del color" list="tonos-sugeridos" value={nombre} onChange={(event) => escribirNombre(event.target.value)} maxLength="40" placeholder={esPaleta ? 'Ej. Verde turquesa' : 'Ej. Beige arena'} />
        <input aria-label="Elegir tono del color" title="Puedes ajustar manualmente el tono" type="color" value={valor} onChange={(event) => setValor(event.target.value)} />
        <button type="button" onClick={agregarColor}><Plus size={16} /> {esPaleta ? 'Agregar a la paleta' : 'Agregar color'}</button>
      </div>
      <small>{esPaleta ? 'Cada tono que agregues forma parte de la misma pieza multicolor.' : 'Cada color que agregues será una variante independiente con sus propias fotos.'} Escribe el nombre, ajusta el tono si quieres y pulsa el botón.</small>
      <b className="color-assistant__title">O agrega un tono rápido {esPaleta ? 'a la paleta:' : 'a los colores únicos:'}</b>
      <div className="color-assistant" aria-label="Tonos sugeridos">{TONOS_RAPIDOS.map((nombreTono) => {
        const registro = colores.find((item) => { const color = leerColor(item); return (color.modo || 'variante') === tipo && normalizarNombreColor(color.nombre) === normalizarNombreColor(nombreTono); });
        const seleccionado = registro ? (esPaleta ? destino === PALETA_ID : leerColor(registro).id === destino) : false;
        return <button type="button" key={nombreTono} onClick={() => elegirTono(nombreTono)} title={registro ? `${nombreTono} ya está registrado` : `Agregar ${nombreTono}`} className={`${registro ? 'is-registered' : ''} ${seleccionado ? 'is-selected' : ''}`}><i style={{ backgroundColor: tonoSugerido(nombreTono) }} />{nombreTono}{registro && <em>Registrado</em>}</button>;
      })}</div>
      <div className="product-color-groups">
        {registrosPaleta.length > 0 && <div className="product-color-group product-color-group--palette">
          <span>Paleta multicolor · {registrosPaleta.length} tono{registrosPaleta.length > 1 ? 's' : ''}</span>
          <div className="product-color-picker__list">{registrosPaleta.map(chipColor)}</div>
        </div>}
        {registrosUnicos.length > 0 && <div className="product-color-group">
          <span>Colores únicos · {registrosUnicos.length}</span>
          <div className="product-color-picker__list">{registrosUnicos.map(chipColor)}</div>
        </div>}
        {!colores.length && <small>Todavía no registraste colores para este producto.</small>}
      </div>
    </fieldset>
  );
}

function GaleriaProducto({ colores, setColores, imagenes, setImagenes, destino, setDestino, avisar }) {
  const [enlace, setEnlace] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const paleta = coloresDePaleta(colores);
  const unicos = coloresUnicos(colores);
  const destinoTexto = nombreDeDestino(colores, destino);
  const fotosDestino = fotosDeDestino(colores, destino);


  const subirArchivos = async (event) => {
    const archivos = Array.from(event.target.files || []);
    if (!archivos.length) return;
    setSubiendo(true);
    try {
      avisar(`Subiendo ${archivos.length} imagen${archivos.length > 1 ? 'es' : ''}...`);
      const urls = await Promise.all(archivos.map((archivo) => subirImagenProducto(archivo)));
      setImagenes((prev) => [...prev, ...urls]);
      asociarImagenesConDestino(setColores, destino, urls);
      avisar('Imágenes guardadas en el servidor de archivos.');
    } catch (err) {
      avisar(err.message || 'No se pudieron subir las imágenes.');
    } finally {
      setSubiendo(false);
      event.target.value = '';
    }
  };

  const agregarEnlace = () => {
    const url = enlace.trim();
    if (!url) return;
    setImagenes((prev) => [...prev, url]);
    asociarImagenesConDestino(setColores, destino, [url]);
    setEnlace('');
  };

  const eliminarImagen = (index) => {
    const imagenEliminada = imagenes[index];
    const restantes = imagenes.filter((_, i) => i !== index);
    setImagenes(restantes);
    if (imagenEliminada && !restantes.includes(imagenEliminada)) {
      setColores((lista) => lista.map((registro) => {
        const color = leerColor(registro);
        return guardarColor({ ...color, imagenes: color.imagenes.filter((src) => src !== imagenEliminada) });
      }));
    }
  };

  const establecerPortada = (index) => {
    setImagenes((prev) => {
      const nueva = [...prev];
      const [item] = nueva.splice(index, 1);
      return [item, ...nueva];
    });
    avisar('Imagen fijada como portada del producto.');
  };

  const moverImagen = (from, to) => {
    setImagenes((prev) => {
      const arr = [...prev];
      if (to < 0 || to >= arr.length) return arr;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const usarDestinoComoPortada = () => {
    const foto = fotosDestino[0];
    if (!foto) { avisar('Este destino todavía no tiene una imagen asignada.'); return; }
    setImagenes((lista) => [foto, ...lista.filter((item) => item !== foto)]);
    avisar('La primera imagen de este destino ahora es la portada principal.');
  };

  const asignarDestinoAPortada = () => {
    if (!imagenes[0]) { avisar('Primero agrega una imagen para usar como portada.'); return; }
    asignarImagenExistenteADestino(setColores, destino, imagenes[0]);
    avisar(`La portada ahora pertenece a ${destinoTexto}.`);
  };

  return (
    <section className="product-gallery">
      <div>
        <b>{destinoTexto ? `Fotos de ${destinoTexto} (${imagenes.length})` : `Galería del producto (${imagenes.length})`}</b>
        <small>Elegí si cargás fotos de un color único o de la paleta multicolor. Al elegir ese color, el cliente verá estas imágenes en el detalle.</small>
      </div>
      <label className="product-color-image-target">Estoy cargando fotos para:
        <select value={destino} onChange={(event) => setDestino(event.target.value)} disabled={!colores.length}>
          {!colores.length && <option value="">Primero registra un color</option>}
          {paleta.length > 0 && <option value={PALETA_ID}>Paleta multicolor ({paleta.length} {paleta.length === 1 ? 'tono' : 'tonos'})</option>}
          {unicos.map((color) => <option value={color.id} key={color.id}>{color.nombre}</option>)}
        </select>
      </label>
      <button className="product-color-cover" type="button" disabled={!fotosDestino.length} onClick={usarDestinoComoPortada}>Usar la primera foto de {destinoTexto || 'este color'} como portada</button>
      <button className="product-color-cover product-color-cover--secondary" type="button" disabled={!destino || !imagenes.length} onClick={asignarDestinoAPortada}>Asignar {destinoTexto || 'el destino'} a la portada actual</button>

      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        <label className="product-upload" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
          <ImagePlus size={20} />
          <span>{subiendo ? 'Subiendo imágenes…' : 'Subir imágenes desde archivo'}</span>
          <input type="file" accept="image/*" multiple disabled={!colores.length} onChange={subirArchivos} />
        </label>
      </div>

      <div className="product-url-row">
        <input
          type="url"
          placeholder="O pega el enlace URL de una imagen (https://...)"
          aria-label="Enlace URL de una imagen"
          value={enlace} disabled={!colores.length}
          onChange={(event) => setEnlace(event.target.value)}
        />
        <button type="button" disabled={!colores.length} onClick={agregarEnlace}>
          <Link2 size={16} /> Agregar URL
        </button>
      </div>

      <div className="product-image-list" style={{ marginTop: '1rem' }}>
        {imagenes.map((src, index) => (
          <figure key={`${src}-${index}`} className={index === 0 ? 'is-cover' : ''}>
            <img src={src} alt={`Foto ${index + 1}`} />
            <div className="product-img-toolbar">
              {index !== 0 && (
                <button type="button" className="btn-star" title="Hacer portada principal" aria-label={`Hacer portada principal la foto ${index + 1}`} onClick={() => establecerPortada(index)}>
                  <Star size={12} fill="#ffdb9b" />
                </button>
              )}
              {index > 0 && (
                <button type="button" title="Mover antes" aria-label={`Mover antes la foto ${index + 1}`} onClick={() => moverImagen(index, index - 1)}>
                  <ChevronLeft size={12} />
                </button>
              )}
              {index < imagenes.length - 1 && (
                <button type="button" title="Mover después" aria-label={`Mover después la foto ${index + 1}`} onClick={() => moverImagen(index, index + 1)}>
                  <ChevronRight size={12} />
                </button>
              )}
              <button type="button" className="btn-delete" title="Eliminar foto" aria-label={`Eliminar foto ${index + 1}`} onClick={() => eliminarImagen(index)}>
                <Trash2 size={12} />
              </button>
            </div>
            <figcaption>{index === 0 ? '★ Portada' : `Foto ${index + 1}`} · {nombreColorDeImagen(colores, src)}</figcaption>
          </figure>
        ))}
        {!imagenes.length && <p>Sin imágenes aún. Agrega fotos locales o enlaces web para publicarlas en el kiosco.</p>}
      </div>
    </section>
  );
}

function IconoCategoria({ categoria }) {
  const nombre = String(categoria || '').toLowerCase();
  if (nombre.includes('colchon') || nombre.includes('somier')) return <BedDouble size={17} aria-hidden="true" />;
  if (nombre.includes('sofa') || nombre.includes('sofá')) return <Sofa size={17} aria-hidden="true" />;
  if (nombre.includes('espaldar') || nombre.includes('reclamier') || nombre.includes('recliner') || nombre.includes('poltrona') || nombre.includes('silla')) return <Armchair size={17} aria-hidden="true" />;
  if (nombre.includes('alfombra') || nombre.includes('toalla')) return <PanelTop size={17} aria-hidden="true" />;
  if (nombre.includes('lampara') || nombre.includes('lámpara')) return <LampDesk size={17} aria-hidden="true" />;
  return <Tag size={17} aria-hidden="true" />;
}

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [soloKiosco, setSoloKiosco] = useState(false);
  const [ajuste, setAjuste] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [progresoCarga, setProgresoCarga] = useState(0);
  const [paginaTabla, setPaginaTabla] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [ordenCol, setOrdenCol] = useState('nombre');
  const [ordenDir, setOrdenDir] = useState('asc');

  // Modales
  const [nuevoProducto, setNuevoProducto] = useState(false);
  const [imagenesNuevo, setImagenesNuevo] = useState([]);
  const [coloresNuevo, setColoresNuevo] = useState([]);
  // Destino de las fotos: el id de un color único o PALETA_ID para la paleta multicolor.
  const [colorImagenNuevo, setColorImagenNuevo] = useState('');

  const [vistaProducto, setVistaProducto] = useState(null);
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);
  // QR para la ficha pública detalle-qr.html?id=...
  const [qrProducto, setQrProducto] = useState(null);
  const [qrCopiado, setQrCopiado] = useState(false);
  const [qrBase, setQrBase] = useState(() => {
    try { return localStorage.getItem('terra_qr_base') || ''; } catch { return ''; }
  });
  const [editarProducto, setEditarProducto] = useState(null);
  const [editImagenes, setEditImagenes] = useState([]);
  const [coloresEdit, setColoresEdit] = useState([]);
  const [colorImagenEdit, setColorImagenEdit] = useState('');

  const [categoriasApi, setCategoriasApi] = useState([]);

  // Categorías reales desde la base de datos (endpoint /categorias)
  useEffect(() => {
    let activo = true;
    listarCategorias({ todas: true })
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

  const avisar = texto => {
    setMensaje(texto);
    // Modo accesible "Más tiempo": el aviso queda hasta el siguiente.
    if (document.documentElement.classList.contains('a11y-mas-tiempo')) return;
    setTimeout(() => setMensaje(''), 3000);
  };

  // URL que lleva el QR: apunta a la ficha pública detalle-qr.html?id=...
  // Si qrBase está vacío se usa el mismo dominio, para que el QR impreso
  // funcione en los celulares de los clientes.
  const baseQr = (qrBase.trim().replace(/\/$/, '')) || (typeof window !== 'undefined' ? window.location.origin : '');
  const urlQrDe = producto => `${baseQr}/detalle-qr.html?id=${producto.id}`;
  const guardarBaseQr = valor => {
    setQrBase(valor);
    try { localStorage.setItem('terra_qr_base', valor); } catch { /* sin almacenamiento */ }
  };
  const copiarUrlQr = async () => {
    if (!qrProducto) return;
    try {
      await navigator.clipboard.writeText(urlQrDe(qrProducto));
      setQrCopiado(true);
      setTimeout(() => setQrCopiado(false), 2000);
    } catch { avisar('No se pudo copiar el enlace.'); }
  };
  const descargarQr = () => {
    if (!qrProducto) return;
    const svg = document.getElementById('qr-admin-svg');
    if (!svg) return;
    const datos = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 440; lienzo.height = 440;
      lienzo.getContext('2d').drawImage(img, 0, 0, 440, 440);
      const a = document.createElement('a');
      a.href = lienzo.toDataURL('image/png');
      a.download = `qr-${qrProducto.sku || qrProducto.id}.png`;
      a.click();
      avisar('QR descargado como PNG, listo para imprimir.');
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(datos)}`;
  };
  const imprimirQr = () => {
    if (!qrProducto) return;
    const svg = document.getElementById('qr-admin-svg');
    const ventana = window.open('', '_blank', 'width=480,height=640');
    if (!ventana) return;
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>QR ${qrProducto.nombre}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:24px}svg{width:320px;height:320px}small{color:#555;word-break:break-all}</style></head><body><h2>TERRA Autoservicio</h2><h3>${qrProducto.nombre}</h3>${svg ? svg.outerHTML : ''}<p>Escaneá para ver la ficha del producto</p><small>${urlQrDe(qrProducto)}</small><script>onload=()=>{print()}<\/script></body></html>`);
    ventana.document.close();
  };

  // Cargar productos reales desde backend PostgreSQL
  const cargarProductos = async () => {
    setCargando(true);
    setErrorCarga('');
    setProgresoCarga(0);
    try {
      const acumulado = [];
      let pagina = 1;
      const limite = 500;
      let total = null;
      do {
        const r = await listarProductosPaginado({ todos: true, limite, pagina, usarRespaldo: false });
        acumulado.push(...(r.productos || []));
        total = r.paginacion?.total ?? total;
        setProgresoCarga(acumulado.length);
        const tieneSiguiente = r.paginacion?.tieneSiguiente ?? (r.productos.length >= limite);
        if (!tieneSiguiente) break;
        pagina += 1;
        if (pagina > 100) break;
      } while (true);
      setProductos(acumulado.map(p => ({
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
  const visiblesOrdenados = useMemo(() => {
    const lista = [...visibles];
    const obtener = (p) => {
      switch (ordenCol) {
        case 'sku': return String(p.sku || '');
        case 'categoria': return String(p.categoria || '');
        case 'precio': return Number(String(p.precio || '0').replace(/\./g, '').replace(/,/g, '.')) || 0;
        case 'showroom': return Number(p.showroom || 0);
        case 'visible': return p.visible ? 1 : 0;
        default: return String(p.nombre || '').toLowerCase();
      }
    };
    lista.sort((a, b) => {
      const va = obtener(a), vb = obtener(b);
      if (va < vb) return ordenDir === 'asc' ? -1 : 1;
      if (va > vb) return ordenDir === 'asc' ? 1 : -1;
      return 0;
    });
    return lista;
  }, [visibles, ordenCol, ordenDir]);

  const totalPaginasTabla = Math.max(1, Math.ceil(visiblesOrdenados.length / porPagina));
  const paginaSegura = Math.min(paginaTabla, totalPaginasTabla);
  const visiblesPagina = visiblesOrdenados.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  useEffect(() => { setPaginaTabla(1); }, [buscar, categoria, soloKiosco, porPagina]);

  // Escape cierra el modal abierto (accesibilidad de teclado).
  useEffect(() => {
    if (!vistaProducto && !editarProducto && !nuevoProducto && !ajuste && !qrProducto) return undefined;
    const alEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (qrProducto) setQrProducto(null);
      else if (ajuste) setAjuste(null);
      else if (vistaProducto) setVistaProducto(null);
      else if (editarProducto) setEditarProducto(null);
      else if (nuevoProducto) setNuevoProducto(false);
    };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [vistaProducto, editarProducto, nuevoProducto, ajuste, qrProducto]);

  const alternarOrden = (col) => {
    if (ordenCol === col) setOrdenDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  // Enter / Espacio ordenan la columna desde el teclado.
  const teclaOrden = (col) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarOrden(col); }
  };
  const ariaOrden = (col) => (ordenCol === col ? (ordenDir === 'asc' ? 'ascending' : 'descending') : 'none');

  const indicadorOrden = (col) => (ordenCol === col ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : '');

  // ---------- Exportación ----------
  const columnasExport = [
    { titulo: 'SKU', valor: (p) => p.sku || p.id || '' },
    { titulo: 'Nombre', valor: (p) => p.nombre || '' },
    { titulo: 'Categoría', valor: (p) => p.categoria || '' },
    { titulo: 'Precio (Bs)', valor: (p) => p.precio || '' },
    { titulo: 'Stock', valor: (p) => p.stock ?? p.showroom ?? '' },
    { titulo: 'Visible en kiosco', valor: (p) => (p.visible ? 'Sí' : 'No') },
    { titulo: 'Detalle', valor: (p) => p.detalle || '' },
    { titulo: 'Colores', valor: (p) => (Array.isArray(p.colores) ? p.colores.join(', ') : '') },
    { titulo: 'Imagen URL', valor: (p) => p.imagen_url || '' },
  ];

  const descargarArchivo = (nombre, contenido, tipo) => {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportarExcelProductos = () => {
    const filas = [columnasExport.map((c) => c.titulo), ...visibles.map((p) => columnasExport.map((c) => c.valor(p)))];
    const [encabezado, ...cuerpo] = filas;
    const tabla = `<table border="1"><thead><tr>${encabezado.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${cuerpo.map((fila) => `<tr>${fila.map((celda) => `<td>${celda ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `\uFEFF<html><head><meta charset="utf-8" /><style>@page{size:landscape;} table{border-collapse:collapse;font-size:11px;} th,td{border:1px solid #999;padding:4px 6px;white-space:nowrap;} th{background:#a6192e;color:#fff;font-weight:700;} tr:nth-child(even) td{background:#f6f3f2;}</style></head><body><h2 style="color:#a6192e;margin:0 0 8px;">TERRA Autoservicio · Catálogo de productos</h2><p style="font-size:11px;color:#555;margin:0 0 10px;">${visibles.length} productos · ${new Date().toLocaleString('es-BO')}</p>${tabla}</body></html>`;
    descargarArchivo(`productos-${new Date().toISOString().slice(0, 10)}.xls`, html, 'application/vnd.ms-excel');
    setMensaje('Exportación Excel generada.');
  };

  const exportarPDFProductos = () => {
    const filas = visibles.map((p) => columnasExport.map((c) => c.valor(p)));
    const thead = columnasExport.map((c) => `<th>${c.titulo}</th>`).join('');
    const tbody = filas.map((fila) => `<tr>${fila.map((celda) => `<td>${celda ?? ''}</td>`).join('')}</tr>`).join('');
    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Productos TERRA</title><style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1b1c1c; margin: 0; }
      h1 { color: #a6192e; font-size: 18px; margin: 0 0 4px; }
      .meta { font-size: 10px; color: #56605c; margin: 0 0 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 9px; }
      th, td { border: 1px solid #d9d4d3; padding: 4px 6px; text-align: left; vertical-align: top; }
      th { background: #a6192e; color: #fff; font-weight: 700; }
      tr:nth-child(even) td { background: #f6f3f2; }
      td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>
      <h1>Catálogo de productos · TERRA Autoservicio</h1>
      <p class="meta">${visibles.length} productos · ${new Date().toLocaleString('es-BO')} · Filtro: ${buscar || 'Todos'}${categoria !== 'Todos' ? ' · ' + categoria : ''}</p>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
      <script>onload = () => { setTimeout(() => { window.print(); }, 250); };</script>
    </body></html>`;
    const ventana = window.open('', '_blank', 'width=1100,height=760');
    if (!ventana) { setMensaje('Permite las ventanas emergentes para generar el PDF.'); return; }
    ventana.document.write(html);
    ventana.document.close();
    setMensaje('PDF preparado (usa "Guardar como PDF").');
  };

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
    const colores = Array.isArray(producto.colores) ? producto.colores : [];
    setEditImagenes(listaFotos);
    setColoresEdit(colores);
    // Destino inicial de las fotos: el primer color único; si solo hay paleta, la paleta.
    setColorImagenEdit(coloresUnicos(colores)[0]?.id || (coloresDePaleta(colores).length ? PALETA_ID : ''));
  };

  const guardarAjuste = async () => {
    if (!ajuste) return;
    try {
      const showroom = Number(ajuste.showroom);
      await actualizarStock(ajuste.id, { showroom });
      setProductos(lista => lista.map(p => p.id === ajuste.id ? { ...p, showroom, stock: showroom } : p));
      setAjuste(null);
      avisar(`Stock de ${ajuste.sku} sincronizado en tiempo real con PostgreSQL y kioscos.`);
    } catch {
      avisar('Error al actualizar inventario en el servidor.');
    }
  };

  const registrarProducto = async event => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const generarQr = datos.get('generar_qr') === 'on';
    const precioOferta = datos.get('precio_oferta') === '' || datos.get('precio_oferta') === null ? null : Number(datos.get('precio_oferta'));
    const enOferta = datos.get('en_oferta') === 'on' && precioOferta > 0;
    const payload = {
      nombre: datos.get('nombre'),
      sku: datos.get('sku'),
      codigoInterno: datos.get('codigo_interno') || null,
      categoria: datos.get('categoria'),
      precio: Number(datos.get('precio')),
      precioMayorista: datos.get('precio_mayorista') === '' ? null : Number(datos.get('precio_mayorista')),
      precioFabrica: datos.get('precio_fabrica') === '' || datos.get('precio_fabrica') === null ? null : Number(datos.get('precio_fabrica')),
      precioOferta,
      enOferta,
      showroom: Number(datos.get('showroom')),
      activo: datos.get('visible') === 'on',
      medida: datos.get('medida') || null,
      descripcion: datos.get('descripcion') || '',
      imagen_url: imagenesNuevo[0] || null,
      imagenes: imagenesNuevo,
      video_url: String(datos.get('video_url') || '').trim() || null,
      colores: coloresNuevo.map((registro) => guardarColor(leerColor(registro))),
      instrucciones: {
        texto: String(datos.get('instrucciones') || '').trim(),
        detalle: String(datos.get('instrucciones_detalle') || '').trim(),
        video_url: String(datos.get('instrucciones_video') || '').trim(),
        imagenes_url: String(datos.get('instrucciones_imagen') || '').trim(),
      },
    };

    if (payload.enOferta && payload.precioOferta >= payload.precio) { await avisoError('El precio de oferta debe ser menor al precio de venta.'); return; }

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
      setColoresNuevo([]);
      setColorImagenNuevo('');
      setCategoria('Todos');
      // Abre el QR del producto nuevo para descargarlo, imprimirlo o copiar su enlace.
      // El QR apunta a la ficha pública y no necesita guardar una imagen en la base.
      if (generarQr) {
        setQrProducto(formateado);
        setQrCopiado(false);
      }
      await avisoExito({ titulo: '¡Producto creado!', texto: `${payload.nombre || payload.sku} se guardó correctamente en la base de datos.` });
    } catch (err) {
      await avisoError(`Error al registrar en servidor: ${err.message}`);
    }
  };

  const guardarEdicion = async event => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const precioNumerico = Number(datos.get('precio'));
    const precioOferta = datos.get('precio_oferta') === '' || datos.get('precio_oferta') === null ? null : Number(datos.get('precio_oferta'));
    const enOferta = datos.get('en_oferta') === 'on' && precioOferta > 0;
    const payload = {
      nombre: datos.get('nombre'),
      sku: datos.get('sku'),
      codigoInterno: datos.get('codigo_interno') || null,
      categoria: datos.get('categoria'),
      precio: precioNumerico > 0 ? precioNumerico : (editarProducto.precioLista ?? Number(String(editarProducto.precio).replace(/\./g, '').replace(/,/g, '.'))),
      precioMayorista: datos.get('precio_mayorista') === '' ? null : Number(datos.get('precio_mayorista')),
      precioFabrica: datos.get('precio_fabrica') === '' || datos.get('precio_fabrica') === null ? null : Number(datos.get('precio_fabrica')),
      precioOferta,
      enOferta,
      medida: datos.get('medida') || editarProducto.medida,
      descripcion: datos.get('descripcion') || editarProducto.descripcion,
      showroom: Number(datos.get('showroom')),
      activo: datos.get('visible') === 'on',
      imagen_url: editImagenes[0] || null,
      imagenes: editImagenes,
      video_url: String(datos.get('video_url') || '').trim() || null,
      colores: coloresEdit.map((registro) => guardarColor(leerColor(registro))),
      instrucciones: {
        texto: String(datos.get('instrucciones') || '').trim(),
        detalle: String(datos.get('instrucciones_detalle') || '').trim(),
        video_url: String(datos.get('instrucciones_video') || '').trim(),
        imagenes_url: String(datos.get('instrucciones_imagen') || '').trim(),
      },
    };

    if (payload.enOferta && payload.precioOferta >= payload.precio) { await avisoError('El precio de oferta debe ser menor al precio de venta.'); return; }

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

  const alternarVisibilidad = async (producto) => {
    const nuevoEstado = !producto.visible;
    try {
      const actualizado = await cambiarVisibilidadProducto(producto.id, nuevoEstado);
      const formateado = {
        ...actualizado,
        precio: typeof actualizado.precio === 'number' ? actualizado.precio.toLocaleString('es-BO') : actualizado.precio,
        tono: producto.tono || 'terra',
      };
      setProductos((lista) => lista.map((item) => (item.id === producto.id ? formateado : item)));
      if (vistaProducto?.id === producto.id) setVistaProducto(formateado);
      if (editarProducto?.id === producto.id) setEditarProducto(formateado);
      await avisoExito({
        titulo: nuevoEstado ? '¡Producto visible!' : '¡Producto oculto!',
        texto: nuevoEstado
          ? `"${producto.nombre || producto.sku}" ahora es visible en el catálogo de clientes.`
          : `"${producto.nombre || producto.sku}" fue ocultado y ya no se mostrará a los clientes.`,
      });
    } catch (err) {
      await avisoError(`No se pudo cambiar la visibilidad: ${err.message}`);
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
        <div className="products-heading-copy">
          <div className="products-heading-title">
            <span className="products-heading-icon"><Box size={27} /></span>
            <h1>Catálogo de productos e inventario</h1>
            <b>{productos.length} productos registrados{cargando ? ` · cargando ${progresoCarga}...` : ''}</b>
          </div>
          <p>Gestión de catálogo digital, inventario multialmacén y visibilidad en kioscos.</p>
        </div>
        <div className="products-toolbar">
          <button type="button" onClick={exportarExcelProductos}>
            <Download size={17} /> Excel
          </button>
          <button type="button" onClick={exportarPDFProductos}>
            <Download size={17} /> PDF
          </button>
          <button type="button" onClick={() => productos.length > 0 && setAjuste({ ...productos[0] })}>
            <SlidersHorizontal size={18} /> Ajuste rápido
          </button>
          <button type="button" className="primary" onClick={() => setNuevoProducto(true)}>
            <Plus size={18} /> Nuevo producto
          </button>
        </div>
      </header>

      <section className="products-kpis">
        <article className="products-kpi products-kpi--showroom">
          <span className="products-kpi-icon" aria-hidden="true"><Store size={29} /></span>
          <div className="products-kpi-copy">
            <small>Showroom Equipetrol</small>
            <b>{totalShowroom} unid.</b>
            <span>Disponible en sala</span>
          </div>
          <Store className="products-kpi-watermark" size={54} aria-hidden="true" />
        </article>
        <article className="products-kpi products-kpi--kiosk">
          <span className="products-kpi-icon" aria-hidden="true"><Box size={29} /></span>
          <div className="products-kpi-copy">
            <small>Activos en kioscos</small>
            <b>{totalModelosKiosco} modelos</b>
            <span>Sincronización continua</span>
          </div>
          <Box className="products-kpi-watermark" size={54} aria-hidden="true" />
        </article>
        <article className="products-kpi products-kpi--inventory">
          <span className="products-kpi-icon" aria-hidden="true"><CircleDollarSign size={29} /></span>
          <div className="products-kpi-copy">
            <small>Valor inventario</small>
            <b>Bs {valorInventario}</b>
            <span>Costo total en tienda</span>
          </div>
          <BarChart3 className="products-kpi-watermark" size={54} aria-hidden="true" />
        </article>
      </section>

      <section className="products-filters">
        <div className="products-filters-top">
          <label className="products-search">
            <Search size={21} />
            <input
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por SKU, modelo, nombre o categoría..."
              aria-label="Buscar por SKU, modelo, nombre o categoría"
            />
            {buscar && <button type="button" className="products-search-clear" onClick={() => setBuscar('')} aria-label="Borrar búsqueda"><X size={18} /></button>}
          </label>
          <label className="products-switch">
            <input
              checked={soloKiosco}
              onChange={e => setSoloKiosco(e.target.checked)}
              type="checkbox"
            />
            <span>Solo visibles en kiosco</span>
          </label>
          <button type="button" className="products-clear-filters" onClick={() => { setBuscar(''); setCategoria('Todos'); setSoloKiosco(false); }}>
            <SlidersHorizontal size={20} /> Limpiar filtros <ChevronDown size={17} />
          </button>
        </div>
        <nav>
          {categorias.map(item => (
            <button
              key={item}
              type="button"
              className={categoria === item ? 'active' : ''}
              onClick={() => setCategoria(item)}
            >
              {item !== 'Todos' && <IconoCategoria categoria={item} />}
              {item}
            </button>
          ))}
          <button type="button" className="products-categories-next" aria-label="Ver más categorías"><ChevronRight size={20} /></button>
        </nav>
      </section>

      <section className="products-table">
        <header>
          <div className="products-table-title">
            <span><Box size={23} /></span>
            <div>
              <h2>Productos y stock por ubicación</h2>
              <p>Mostrando {visiblesPagina.length} de {visiblesOrdenados.length} registros</p>
            </div>
          </div>
          <div className="products-table-controls">
            <label className="products-rows-control">Filas:
              <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button type="button" aria-label="Página anterior" onClick={() => setPaginaTabla((p) => Math.max(1, p - 1))} disabled={paginaSegura <= 1}><ChevronLeft size={18} /></button>
            <span className="page-pill">{paginaSegura}</span>
            <button type="button" aria-label="Página siguiente" onClick={() => setPaginaTabla((p) => Math.min(totalPaginasTabla, p + 1))} disabled={paginaSegura >= totalPaginasTabla}><ChevronRight size={18} /></button>
          </div>
        </header>

        <div className="products-scroll">
          <table>
            <thead>
              <tr>
                <th className="products-check-column"><input type="checkbox" aria-label="Seleccionar todos los productos" /></th>
                <th className="products-sortable" tabIndex={0} aria-sort={ariaOrden('nombre')} onKeyDown={teclaOrden('nombre')} onClick={() => alternarOrden('nombre')}>Producto{indicadorOrden('nombre')}</th>
                <th className="products-sortable" tabIndex={0} aria-sort={ariaOrden('categoria')} onKeyDown={teclaOrden('categoria')} onClick={() => alternarOrden('categoria')}>Categoría{indicadorOrden('categoria')}</th>
                <th className="products-sortable" tabIndex={0} aria-sort={ariaOrden('precio')} onKeyDown={teclaOrden('precio')} onClick={() => alternarOrden('precio')}>Precio{indicadorOrden('precio')}</th>
                <th>Stock total</th>
                <th className="products-sortable" tabIndex={0} aria-sort={ariaOrden('showroom')} onKeyDown={teclaOrden('showroom')} onClick={() => alternarOrden('showroom')}>Showroom{indicadorOrden('showroom')}</th>
                <th className="products-sortable" tabIndex={0} aria-sort={ariaOrden('visible')} onKeyDown={teclaOrden('visible')} onClick={() => alternarOrden('visible')}>Kiosco{indicadorOrden('visible')}</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visiblesPagina.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="products-empty">
                      <span><Box size={43} /></span>
                      <h3>No se encontraron productos</h3>
                      <p>Prueba con otros filtros o registra un producto para empezar.</p>
                      <button type="button" onClick={() => setNuevoProducto(true)}><Plus size={17} /> Nuevo producto</button>
                    </div>
                  </td>
                </tr>
              ) : visiblesPagina.map(p => (
                <tr key={p.id}>
                  <td className="products-check-column"><input type="checkbox" aria-label={`Seleccionar ${p.nombre}`} /></td>
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
                        <small>{p.marca ? `${p.marca} · ` : ''}{p.sku} · {p.detalle}</small>
                      </div>
                    </div>
                  </td>
                  <td>{p.categoria}</td>
                  <td><strong>Bs {p.precio}</strong></td>
                  <td><strong>{p.stock ?? p.showroom} un.</strong></td>
                  <td>
                    <span className={p.showroom < 2 ? 'stock low' : 'stock'}>
                      {p.showroom} un.
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="kiosk-badge-btn"
                      aria-label={p.visible ? `Ocultar ${p.nombre} del kiosco` : `Mostrar ${p.nombre} en el kiosco`}
                      title={p.visible ? 'Clic para ocultar este producto a los clientes' : 'Clic para mostrar este producto en catálogo'}
                      onClick={() => alternarVisibilidad(p)}
                    >
                      <span className={p.visible ? 'kiosk visible' : 'kiosk'}>
                        {p.visible ? 'Activo' : 'Oculto'}
                      </span>
                    </button>
                  </td>
                  <td><span className={p.visible ? 'products-status products-status--active' : 'products-status'}>{p.visible ? 'Publicado' : 'Borrador'}</span></td>
                  <td>
                    <div className="product-actions">
                      <button
                        className={`product-action-vis ${p.visible ? '' : 'is-hidden'}`}
                        title={p.visible ? 'Ocultar este producto (no mostrar a clientes)' : 'Mostrar este producto a clientes'}
                        aria-label={p.visible ? `Ocultar ${p.nombre}` : `Mostrar ${p.nombre}`}
                        onClick={() => alternarVisibilidad(p)}
                      >
                        {p.visible ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      <button title="Vista previa / Ver fotos" aria-label={`Vista previa de ${p.nombre}`} onClick={() => abrirVista(p)}>
                        <Eye size={17} />
                      </button>
                      <button title="Ajustar stock" aria-label={`Ajustar stock de ${p.nombre}`} onClick={() => setAjuste({ ...p })}>
                        <SlidersHorizontal size={17} />
                      </button>
                      <button title="Editar producto y fotos" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEdicion(p)}>
                        <Edit3 size={17} />
                      </button>
                      <button title="Generar QR de la ficha" aria-label={`Generar QR de ${p.nombre}`} onClick={() => { setQrProducto(p); setQrCopiado(false); }}>
                        <QrCode size={17} />
                      </button>
                      <button title="Imprimir ticket / etiqueta de producto" aria-label={`Imprimir ticket de ${p.nombre}`} onClick={() => imprimirTicketProducto(p)}>
                        <Printer size={17} />
                      </button>
                      <button className="product-action-delete" title="Eliminar producto" aria-label={`Eliminar ${p.nombre}`} onClick={() => borrarProducto(p)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="products-pagination">
          <span className="info">Página {paginaSegura} de {totalPaginasTabla} · {visiblesOrdenados.length} registros</span>
          <div className="controls">
            <button type="button" aria-label="Página anterior" onClick={() => setPaginaTabla((p) => Math.max(1, p - 1))} disabled={paginaSegura <= 1}><ChevronLeft size={18} /></button>
            <span className="page-pill">{paginaSegura}</span>
            <button type="button" aria-label="Página siguiente" onClick={() => setPaginaTabla((p) => Math.min(totalPaginasTabla, p + 1))} disabled={paginaSegura >= totalPaginasTabla}><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      {/* MODAL VISTA PREVIA (VER PRODUCTO CON FOTOS) */}
      {vistaProducto && (
        <div className="products-modal product-view-modal">
          <section role="dialog" aria-modal="true" aria-labelledby="producto-vista-titulo">
            <header>
              <div>
                <span><Eye size={20} /></span>
                <div>
                  <h2 id="producto-vista-titulo">Vista previa del producto</h2>
                  <p>{vistaProducto.sku} · {vistaProducto.categoria}</p>
                </div>
              </div>
              <button type="button" onClick={() => setVistaProducto(null)} aria-label="Cerrar"><X /></button>
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
                  <p style={{ marginTop: '0.2rem' }}>Medidas / Especificación: <b>{vistaProducto.medida || 'Estándar'}</b></p>
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
                type="button"
                className={vistaProducto.visible ? 'btn-ocultar-producto' : 'btn-mostrar-producto'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.6rem',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: vistaProducto.visible ? '1px solid #ffdad6' : '1px solid #b3efd5',
                  background: vistaProducto.visible ? '#fff1f0' : '#f0fdf4',
                  color: vistaProducto.visible ? '#ba1a1a' : '#004230',
                }}
                title={vistaProducto.visible ? 'Ocultar este producto para que no se muestre a los clientes' : 'Mostrar este producto en el catálogo de clientes'}
                onClick={() => alternarVisibilidad(vistaProducto)}
              >
                {vistaProducto.visible ? (
                  <>
                    <EyeOff size={17} /> Ocultar este producto
                  </>
                ) : (
                  <>
                    <Eye size={17} /> Mostrar este producto
                  </>
                )}
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
          <form onSubmit={guardarEdicion} role="dialog" aria-modal="true" aria-labelledby="producto-editar-titulo">
            <header>
              <div>
                <span><Edit3 size={20} /></span>
                <div>
                  <h2 id="producto-editar-titulo">Editar producto · {editarProducto.sku}</h2>
                  <p>Modifica la información comercial, stock y galería fotográfica para kioscos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditarProducto(null)} aria-label="Cerrar"><X /></button>
            </header>
            <nav className="product-form-steps" aria-label="Secciones del formulario">
              <span><b>1</b> Información comercial</span><span><b>2</b> Variantes y colores</span><span><b>3</b> Galería multimedia</span><span><b>4</b> Instrucciones</span><span><b>5</b> Publicación</span>
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
                Código Terra (SKU)
                <input
                  name="sku"
                  required
                  defaultValue={editarProducto.codigoTerra || editarProducto.sku}
                  placeholder="Ej. COLN00590"
                />
              </label>
              <label>
                Código interno
                <input
                  name="codigo_interno"
                  required
                  defaultValue={editarProducto.codigoInterno || editarProducto.sku}
                  placeholder="Ej. 9376"
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
                  defaultValue={editarProducto.precioLista ?? (Number(String(editarProducto.precio).replace(/[^0-9]/g, '')) || 0)}
                  placeholder="0.00"
                />
              </label>

              <label>
                Precio mayorista (Bs) <small>Opcional</small>
                <input
                  name="precio_mayorista"
                  min="0"
                  type="number"
                  defaultValue={editarProducto.precioMayorista ?? ''}
                  placeholder="0.00"
                />
              </label>
              <label>
                Precio de fábrica (Bs) <small>Opcional · costo, no se muestra al cliente</small>
                <input name="precio_fabrica" min="0" step="0.01" type="number" defaultValue={editarProducto.precioFabrica ?? ''} placeholder="0.00" />
              </label>
              <label>
                Precio de oferta (Bs) <small>Se cobra en lugar del precio de venta cuando "En oferta" está activo</small>
                <input name="precio_oferta" min="0" step="0.01" type="number" defaultValue={editarProducto.precioOferta ?? ''} placeholder="0.00" />
              </label>
              <label className="product-form-check">
                <input name="en_oferta" type="checkbox" defaultChecked={editarProducto.enOferta === true} />
                <span>En oferta <small>Muestra el precio de oferta y la etiqueta en el catálogo</small></span>
              </label>

              <label>
                Medidas / Especificación
                <input
                  name="medida"
                  defaultValue={editarProducto.medida}
                  placeholder="Ej. Queen · 160 × 200 cm"
                />
              </label>

              <label>
                Stock en sala
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
              <SelectorColores
                colores={coloresEdit}
                setColores={setColoresEdit}
                destino={colorImagenEdit}
                setDestino={setColorImagenEdit}
              />
            </div>

            <GaleriaProducto
              colores={coloresEdit}
              setColores={setColoresEdit}
              imagenes={editImagenes}
              setImagenes={setEditImagenes}
              destino={colorImagenEdit}
              setDestino={setColorImagenEdit}
              avisar={avisar}
            />

            <div className="product-form-grid product-instructions">
              <div className="product-form-section-title"><div><span>Instrucciones de armado y uso</span><small>Las usa el asistente (chatbot) y la ficha del producto. Un paso por línea.</small></div><em>Opcional</em></div>
              <label className="product-form-wide">
                Pasos de armado / uso
                <textarea name="instrucciones" rows="6" defaultValue={editarProducto.instrucciones || ''} placeholder={"1. Retira la malla con las manos.\n2. Revisa la bolsa del kit...\n3. ..."} />
              </label>
              <label className="product-form-wide">
                Detalle completo <small>Información adicional para el asistente</small>
                <textarea name="instrucciones_detalle" rows="3" defaultValue={editarProducto.instrucciones_detalle || ''} placeholder="Recomendaciones, cuidados, garantía..." />
              </label>
              <label>
                Video de instrucciones (URL)
                <input name="instrucciones_video" type="url" defaultValue={editarProducto.instrucciones_video || ''} placeholder="https://..." />
              </label>
              <label>
                Imagen de instrucciones (URL)
                <input name="instrucciones_imagen" type="url" defaultValue={editarProducto.instrucciones_imagenes || ''} placeholder="https://..." />
              </label>
            </div>

            <label className="product-kiosk-check">
              <input
                name="visible"
                type="checkbox"
                defaultChecked={editarProducto.visible}
              />
              Visible en autoservicio y catálogo de clientes (desmarca para ocultar este producto)
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
          <form onSubmit={registrarProducto} role="dialog" aria-modal="true" aria-labelledby="producto-nuevo-titulo">
            <header>
              <div>
                <span><PackagePlus size={20} /></span>
                <div>
                  <h2 id="producto-nuevo-titulo">Registrar nuevo producto</h2>
                  <p>Completa la ficha comercial, inventario y galería para kioscos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setNuevoProducto(false)} aria-label="Cerrar"><X /></button>
            </header>
            <nav className="product-form-steps" aria-label="Secciones del formulario">
              <span><b>1</b> Información comercial</span><span><b>2</b> Variantes y colores</span><span><b>3</b> Galería multimedia</span><span><b>4</b> Instrucciones</span><span><b>5</b> Publicación</span>
            </nav>

            <div className="product-form-grid">
              <div className="product-form-section-title"><div><span>Ficha técnica y comercial</span><small>Información que se mostrará en catálogo, kiosco y tienda web.</small></div><em>* Campos obligatorios</em></div>
              <label>
                Nombre comercial
                <input name="nombre" required placeholder="Ej. Colchón Terra Comfort King" />
              </label>
              <label>
                Código Terra (SKU)
                <input name="sku" required placeholder="Ej. COLN00590" />
              </label>
              <label>
                Código interno
                <input name="codigo_interno" required placeholder="Ej. 9376" />
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
                Precio mayorista (Bs) <small>Opcional</small>
                <input name="precio_mayorista" min="0" type="number" placeholder="0.00" />
              </label>
              <label>
                Precio de fábrica (Bs) <small>Opcional · costo, no se muestra al cliente</small>
                <input name="precio_fabrica" min="0" step="0.01" type="number" placeholder="0.00" />
              </label>
              <label>
                Precio de oferta (Bs) <small>Se cobra en lugar del precio de venta cuando "En oferta" está activo</small>
                <input name="precio_oferta" min="0" step="0.01" type="number" placeholder="0.00" />
              </label>
              <label className="product-form-check">
                <input name="en_oferta" type="checkbox" />
                <span>En oferta <small>Muestra el precio de oferta y la etiqueta en el catálogo</small></span>
              </label>
              <label>
                Medidas / Detalle
                <input name="medida" placeholder="Ej. King · 200 × 200 cm" />
              </label>
              <label>
                Stock en sala
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
              <SelectorColores
                colores={coloresNuevo}
                setColores={setColoresNuevo}
                destino={colorImagenNuevo}
                setDestino={setColorImagenNuevo}
              />
            </div>

            <GaleriaProducto
              colores={coloresNuevo}
              setColores={setColoresNuevo}
              imagenes={imagenesNuevo}
              setImagenes={setImagenesNuevo}
              destino={colorImagenNuevo}
              setDestino={setColorImagenNuevo}
              avisar={avisar}
            />

            <div className="product-form-grid product-instructions">
              <div className="product-form-section-title"><div><span>Instrucciones de armado y uso</span><small>Las usa el asistente (chatbot) y la ficha del producto. Un paso por línea.</small></div><em>Opcional</em></div>
              <label className="product-form-wide">
                Pasos de armado / uso
                <textarea name="instrucciones" rows="6" placeholder={"1. Retira la malla con las manos.\n2. Revisa la bolsa del kit...\n3. ..."} />
              </label>
              <label className="product-form-wide">
                Detalle completo <small>Información adicional para el asistente</small>
                <textarea name="instrucciones_detalle" rows="3" placeholder="Recomendaciones, cuidados, garantía..." />
              </label>
              <label>
                Video de instrucciones (URL)
                <input name="instrucciones_video" type="url" placeholder="https://..." />
              </label>
              <label>
                Imagen de instrucciones (URL)
                <input name="instrucciones_imagen" type="url" placeholder="https://..." />
              </label>
            </div>

            <label className="product-kiosk-check">
              <input name="visible" type="checkbox" defaultChecked /> Publicar este producto en kioscos al guardarlo
            </label>
            <label className="product-kiosk-check">
              <input name="generar_qr" type="checkbox" defaultChecked /> Generar QR del producto al guardarlo
              <small>Podrás descargarlo, imprimirlo o copiar el enlace de su ficha.</small>
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
          <section role="dialog" aria-modal="true" aria-labelledby="producto-ajuste-titulo">
            <header>
              <div>
                <span><SlidersHorizontal size={20} /></span>
                <div>
                  <h2 id="producto-ajuste-titulo">Ajuste rápido de inventario</h2>
                  <p>{ajuste.nombre} · {ajuste.sku}</p>
                </div>
              </div>
              <button onClick={() => setAjuste(null)} aria-label="Cerrar"><X /></button>
            </header>
            <div className="adjust-row">
              <div>
                <b>Showroom Equipetrol</b>
                <small>Stock para venta inmediata</small>
              </div>
              <input
                min="0"
                type="number"
                aria-label="Stock en showroom"
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

      {/* MODAL QR DE LA FICHA */}
      {qrProducto && (
        <div className="products-modal">
          <section style={{ maxWidth: '460px', textAlign: 'center' }} role="dialog" aria-modal="true" aria-labelledby="producto-qr-titulo">
            <header>
              <div>
                <span><QrCode size={20} /></span>
                <div style={{ textAlign: 'left' }}>
                  <h2 id="producto-qr-titulo">QR del producto</h2>
                  <p>{qrProducto.nombre} · {qrProducto.sku}</p>
                </div>
              </div>
              <button type="button" onClick={() => setQrProducto(null)} aria-label="Cerrar"><X /></button>
            </header>
            <div style={{ padding: '1rem 1.2rem', display: 'grid', gap: '0.7rem', justifyItems: 'center' }}>
              <QRCode id="qr-admin-svg" value={urlQrDe(qrProducto)} size={240} />
              <code style={{ fontSize: '12px', wordBreak: 'break-all', background: '#f4f4f4', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                {urlQrDe(qrProducto)}
              </code>
              <label style={{ fontSize: '12px', color: '#666', display: 'grid', gap: '4px', width: '100%', textAlign: 'left' }}>
                Dominio público de la tienda (vacío = usar este dominio)
                <input
                  type="url"
                  value={qrBase}
                  onChange={e => guardarBaseQr(e.target.value)}
                  placeholder="https://mi-tienda.com"
                  style={{ padding: '0.5rem 0.6rem', borderRadius: '8px', border: '1px solid #d4d4d4', width: '100%' }}
                />
              </label>
            </div>
            <footer style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="button" onClick={copiarUrlQr}>{qrCopiado ? '¡Copiado!' : 'Copiar enlace'}</button>
              <button type="button" onClick={imprimirQr}>Imprimir QR</button>
              <button type="button" onClick={() => imprimirTicketProducto(qrProducto)}>Imprimir ticket de góndola</button>
              <button className="primary" type="button" onClick={descargarQr}>
                <Download size={17} /> Descargar PNG
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

