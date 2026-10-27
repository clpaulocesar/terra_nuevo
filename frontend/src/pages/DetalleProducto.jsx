import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useAccesibilidad } from "../context/AccesibilidadContext.jsx";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  CirclePlus,
  Eye,
  FileText,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import {
  obtenerProducto,
  listarProductos,
} from "../services/productoService.js";
import { useCarrito } from "../hooks/useCarrito.js";
import { formatoMoneda } from "../utils/formatoMoneda.js";
import {
  IMAGEN_PRODUCTO_FALLBACK,
  imagenDeProducto,
  usarImagenFallback,
} from "../utils/imagenProducto.js";
import "./DetalleProducto.css";
import "./DetalleProductoBack.css";

const COLORES_BASE = [
  { nombre: "Gris marengo", valor: "#54595f" },
  { nombre: "Gris perla", valor: "#9b9b9b" },
  { nombre: "Azul petróleo", valor: "#455a64" },
  { nombre: "Terracota", valor: "#8d5b4c" },
];
const COLORES_CUADROS = [
  { nombre: "Blanco humo", valor: "#f1efe9" },
  { nombre: "Negro azabache", valor: "#211d1d" },
  { nombre: "Grafito", valor: "#3a3f44" },
  { nombre: "Arena", valor: "#cbb894" },
  { nombre: "Chocolate", valor: "#5a3b2a" },
  { nombre: "Borgoña", valor: "#8e2828" },
  { nombre: "Azul noche", valor: "#233a63" },
  { nombre: "Celeste", valor: "#8fb8d8" },
  { nombre: "Verde bosque", valor: "#2f5233" },
  { nombre: "Verde oliva", valor: "#5d6b4f" },
  { nombre: "Mostaza", valor: "#cf8a2b" },
  { nombre: "Rosa empolvado", valor: "#d9a5a0" },
];
const fallbackFotos = [IMAGEN_PRODUCTO_FALLBACK];

// Los datos/selector de colores quedan OCULTOS a propósito (se trabaja solo con las imágenes).
// El código de colores se conserva: pone true para volver a mostrarlo.
const MOSTRAR_COLORES = false;

function videoIncrustado(url) {
  const coincidencia = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return coincidencia
    ? `https://www.youtube.com/embed/${coincidencia[1]}`
    : null;
}

function valorDeColor(nombre) {
  const texto = String(nombre || "").trim();
  if (!texto) return null;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(texto)) return texto;
  if (
    typeof CSS !== "undefined" &&
    CSS.supports &&
    CSS.supports("color", texto)
  )
    return texto;
  const base = [...COLORES_BASE, ...COLORES_CUADROS].find(
    (c) => c.nombre.toLowerCase() === texto.toLowerCase(),
  );
  return base?.valor || null;
}

export default function DetalleProducto() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoAgregar = searchParams.get("agregar") === "1";
  const { agregarProducto } = useCarrito();
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [foto, setFoto] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [videoAmpliado, setVideoAmpliado] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);
  const [color, setColor] = useState(null);
  const [cuadrosAbiertos, setCuadrosAbiertos] = useState(false);
  const [descripcionAbajoAbierta, setDescripcionAbajoAbierta] = useState(false);

  const irADescripcion = () => {
    setDescripcionAbajoAbierta(true);
    setTimeout(() => {
      document
        .getElementById("descripcion-completa")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };
  const [agregado, setAgregado] = useState(false);

  // Escape cierra la vista ampliada sin obligar a usar el puntero.
  useEffect(() => {
    if (!videoAmpliado && !imagenAmpliada) return undefined;
    const alEscape = (e) => {
      if (e.key === "Escape") {
        setVideoAmpliado(false);
        setImagenAmpliada(false);
      }
    };
    document.addEventListener("keydown", alEscape);
    return () => document.removeEventListener("keydown", alEscape);
  }, [videoAmpliado, imagenAmpliada]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");
    setFoto(0);
    setCantidad(1);
    setImagenAmpliada(false);
    setDescripcionAbajoAbierta(false);
    setCuadrosAbiertos(false);
    obtenerProducto(id)
      .then((dato) => {
        if (activo) setProducto(dato);
      })
      .catch((err) => {
        if (activo)
          setError(err.message || "No fue posible cargar el producto.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!producto?.categoria) return undefined;
    let activo = true;
    listarProductos({ categoria: producto.categoria, limite: 4 })
      .then((lista) => {
        if (activo)
          setRelacionados(
            lista
              .filter((item) => String(item.id) !== String(producto.id))
              .slice(0, 3),
          );
      })
      .catch(() => {
        if (activo) setRelacionados([]);
      });
    return () => {
      activo = false;
    };
  }, [producto]);

  // Colores: solo los registrados para el producto, sin paleta por defecto.
  // - Admin: `producto.colores` guarda { id, nombre, valor, imagenes } serializados en TEXT[].
  // - Variantes (product_variants): `producto.variantes` con la clave `color`.
  // Si el producto no tiene colores registrados, la ficha no muestra ninguno.
  const colores = useMemo(() => {
    if (!MOSTRAR_COLORES) return [];
    const registros = [
      ...(Array.isArray(producto?.colores) ? producto.colores : []),
      ...(Array.isArray(producto?.variantes) ? producto.variantes : []),
    ];
    const lista = [];
    const vistos = new Set();
    for (const registro of registros) {
      let nombre = "";
      let crudo = "";
      if (
        registro &&
        typeof registro === "object" &&
        typeof registro.valor === "string"
      ) {
        nombre =
          String(registro.nombre || registro.name || "").trim() || "Color";
        crudo = registro.valor || registro.color || nombre;
      } else if (registro && typeof registro === "object") {
        nombre =
          String(registro.color || registro.name || "").trim() || "Color";
        crudo = registro.color || registro.name || "";
      } else {
        const texto = String(registro || "").trim();
        try {
          const dato = JSON.parse(texto);
          nombre = String(dato?.nombre || dato?.name || "").trim() || "Color";
          crudo = dato?.valor || dato?.color || nombre;
        } catch {
          const [parte1, parte2] = texto.split("|");
          nombre = (parte2 ? parte1 : parte1) || "Color";
          crudo = parte2 || parte1;
        }
      }
      const valor = valorDeColor(crudo || nombre);
      if (!valor) continue;
      const clave = String(nombre).toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      lista.push({ nombre: String(nombre).trim() || "Color", valor });
    }
    return lista;
  }, [producto]);

  const coloresVisibles = colores.slice(0, 4);
  const coloresRestantes = colores.slice(4);

  useEffect(() => {
    setColor(colores.length ? colores[0] : null);
  }, [producto?.id, colores]);

  const fotos = useMemo(
    () =>
      producto?.imagenes?.length
        ? producto.imagenes
        : producto?.imagen_url
          ? [producto.imagen_url]
          : fallbackFotos,
    [producto],
  );

  const agregar = () => {
    for (let indice = 0; indice < cantidad; indice += 1)
      agregarProducto(producto, 1, color ? { color } : {});
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1800);
  };
  // Comando de voz "agregar" / "agregar al carrito" sobre el producto abierto.
  const { anunciar: anunciarVoz } = useAccesibilidad();
  const agregarRef = useRef(agregar);
  agregarRef.current = agregar;
  useEffect(() => {
    const alComando = (evento) => {
      const { accion } = evento.detail || {};
      if (accion !== "agregar") return;
      if (!producto) return;
      if (Number(producto.stock) <= 0) { anunciarVoz(`${producto.nombre} está agotado.`); return; }
      agregarRef.current();
      anunciarVoz(cantidad > 1 ? `${cantidad} unidades de ${producto.nombre} agregadas al carrito.` : `${producto.nombre} agregado al carrito.`);
    };
    window.addEventListener("terra:voz", alComando);
    return () => window.removeEventListener("terra:voz", alComando);
  }, [producto, cantidad, anunciarVoz]);

  const autoAgregadoRef = useRef(false);
  useEffect(() => {
    if (!autoAgregar || autoAgregadoRef.current) return;
    if (!producto || Number(producto.stock) <= 0) return;
    autoAgregadoRef.current = true;
    agregarProducto(producto, 1, color ? { color } : {});
    // Quita ?agregar=1 de la URL: si no, al refrescar la página se vuelve a agregar solo.
    setSearchParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        siguientes.delete("agregar");
        return siguientes;
      },
      { replace: true },
    );
  }, [autoAgregar, producto, color, agregarProducto, setSearchParams]);

  if (cargando) return <p className="detalle-status">Cargando producto…</p>;
  if (error || !producto || producto.activo === false || producto.visible === false)
    return (
      <div className="detalle-status">
        <p>{error || "Este producto no se encuentra disponible actualmente."}</p>
        <Link to="/catalogo">Volver al catálogo</Link>
      </div>
    );
  const disponible = Number(producto.stock) > 0;
  const videoEmbed = producto.video_url
    ? videoIncrustado(producto.video_url)
    : null;
  const videoSrc = videoEmbed
    ? `${videoEmbed}?autoplay=1&mute=1&loop=1&playlist=${videoEmbed.split("/").pop()}`
    : null;

  return (
    <main className="product-detail">
      <Link
        className="product-detail__back"
        to="/catalogo"
        state={location.state}
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </Link>
      <nav className="product-detail__crumb">
        <Link to="/">Inicio</Link>
        <ChevronRight size={14} />
        <Link to="/catalogo" state={location.state}>
          Catálogo
        </Link>
        <ChevronRight size={14} />
        <span>{producto.nombre}</span>
      </nav>
      <section className="product-detail__card">
        <div className="product-detail__layout">
          <div className="product-gallery">
            <div className="product-gallery__main">
              {fotos[foto] ? (
                <span className="tint-wrap">
                  <img
                    className={
                      fotos[foto] === IMAGEN_PRODUCTO_FALLBACK
                        ? "tint-base img-fallback"
                        : "tint-base"
                    }
                    src={imagenDeProducto(fotos[foto])}
                    alt={producto.nombre}
                    onError={usarImagenFallback}
                  />
                  {MOSTRAR_COLORES && color && (
                    <i
                      className="tint-overlay"
                      style={{
                        backgroundColor: color.valor,
                        WebkitMaskImage: `url("${fotos[foto]}")`,
                        maskImage: `url("${fotos[foto]}")`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </span>
              ) : null}
              {fotos[foto] !== IMAGEN_PRODUCTO_FALLBACK && (
                <button
                  type="button"
                  className="product-gallery__zoom"
                  onClick={() => setImagenAmpliada(true)}
                  aria-label={`Ampliar imagen de ${producto.nombre}`}
                >
                  <ZoomIn size={20} />
                </button>
              )}
              {producto.esMasVendido && (
                <b>
                  <Sparkles size={13} /> Más vendido
                </b>
              )}
              {color && (
                <span className="product-gallery__color-badge">
                  <i
                    style={{ backgroundColor: color.valor }}
                    aria-hidden="true"
                  />
                  {color.nombre}
                </span>
              )}
              {colores.length > 0 && (
                <div className="product-gallery__colors">
                  <div className="product-gallery__swatches">
                    {coloresVisibles.map((opcion, indice) => (
                      <button
                        type="button"
                        title={opcion.nombre}
                        aria-label={opcion.nombre}
                        key={`${opcion.nombre}-${opcion.valor}-${indice}`}
                        onClick={() => setColor(opcion)}
                        className={
                          color?.nombre === opcion.nombre ? "active" : ""
                        }
                        style={{ backgroundColor: opcion.valor }}
                      />
                    ))}
                    {coloresRestantes.length > 0 && (
                      <button
                        type="button"
                        className="paleta-custom"
                        onClick={() => setCuadrosAbiertos((v) => !v)}
                        aria-expanded={cuadrosAbiertos}
                        title="Más colores"
                        aria-label="Más colores"
                      >
                        +
                      </button>
                    )}
                  </div>
                  {cuadrosAbiertos && coloresRestantes.length > 0 && (
                    <div className="paleta-cuadros">
                      {coloresRestantes.map((opcion, indice) => (
                        <button
                          type="button"
                          title={opcion.nombre}
                          aria-label={opcion.nombre}
                          key={`${opcion.nombre}-${opcion.valor}-${indice}`}
                          onClick={() => {
                            setColor(opcion);
                            setCuadrosAbiertos(false);
                          }}
                          className={
                            color?.nombre === opcion.nombre ? "active" : ""
                          }
                          style={{ backgroundColor: opcion.valor }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {producto.video_url && (
                <button
                  type="button"
                  className="video-mini"
                  onClick={() => setVideoAmpliado(true)}
                  aria-label="Ampliar video del producto"
                >
                  {videoEmbed ? (
                    <iframe
                      src={videoSrc}
                      title={`Video de ${producto.nombre}`}
                      tabIndex={-1}
                    />
                  ) : (
                    <video
                      src={producto.video_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  )}
                </button>
              )}
            </div>
            <div className="product-gallery__thumbs">
              {fotos.slice(0, 4).map((src, indice) => (
                <button
                  className={foto === indice ? "active" : ""}
                  onClick={() => setFoto(indice)}
                  type="button"
                  key={`${src}-${indice}`}
                >
                  <span className="tint-wrap tint-thumb">
                    <img
                      className="tint-base"
                      src={imagenDeProducto(src)}
                      alt={`Vista ${indice + 1}`}
                      onError={usarImagenFallback}
                    />
                    {MOSTRAR_COLORES && color && (
                      <i
                        className="tint-overlay"
                        style={{
                          backgroundColor: color.valor,
                          WebkitMaskImage: `url("${src}")`,
                          maskImage: `url("${src}")`,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span>Vista {indice + 1}</span>
                </button>
              ))}
            </div>
            {videoAmpliado && producto.video_url && (
              <div
                className="video-modal"
                onClick={() => setVideoAmpliado(false)}
              >
                <div
                  className="video-box"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Video de ${producto.nombre}`}
                >
                  <button
                    type="button"
                    className="video-close"
                    onClick={() => setVideoAmpliado(false)}
                    aria-label="Cerrar video"
                  >
                    <X size={20} />
                  </button>
                  {videoEmbed ? (
                    <iframe
                      src={videoSrc}
                      title={`Video de ${producto.nombre}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={producto.video_url}
                      controls
                      autoPlay
                      playsInline
                    />
                  )}
                </div>
              </div>
            )}
            {imagenAmpliada && fotos[foto] !== IMAGEN_PRODUCTO_FALLBACK && (
              <div className="product-image-zoom">
                <button
                  type="button"
                  className="product-image-zoom__backdrop"
                  onClick={() => setImagenAmpliada(false)}
                  aria-label="Cerrar imagen ampliada"
                />
                <div
                  className="product-image-zoom__content"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Imagen ampliada de ${producto.nombre}`}
                >
                  <button
                    type="button"
                    className="product-image-zoom__close"
                    onClick={() => setImagenAmpliada(false)}
                    aria-label="Cerrar imagen ampliada"
                  >
                    <X size={22} />
                  </button>
                  <img
                    src={imagenDeProducto(fotos[foto])}
                    alt={producto.nombre}
                    onError={usarImagenFallback}
                  />
                </div>
              </div>
            )}
          </div>
          <section className="product-buy">
            {Boolean(producto.marca) && (
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1 block">
                {producto.marca}
              </span>
            )}
            <h1>{producto.nombre}</h1>
            <div className="product-buy__rating">
              <span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star size={15} fill="currentColor" key={n} />
                ))}
              </span>
              <small>Producto recomendado TERRA</small>
            </div>
            <div className="product-buy__price">
              <strong>{formatoMoneda(producto.precio)}</strong>
              <small>
                {disponible
                  ? "Disponible para entrega inmediata"
                  : "Consultar disponibilidad"}
              </small>
            </div>
            <div className="product-buy__desc-wrap">
              <p className="product-buy__description collapsed">
                {producto.descripcion}
              </p>
              <button
                type="button"
                className="product-buy__desc-toggle"
                onClick={irADescripcion}
              >
                <Eye size={15} /> Ver descripción completa
              </button>
            </div>
            <div className="product-buy__quantity">
              <b>Cantidad:</b>
              <div>
                <button
                  type="button"
                  aria-label="Disminuir"
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}
                >
                  <CircleMinus size={19} />
                </button>
                <span>{cantidad}</span>
                <button
                  type="button"
                  aria-label="Aumentar"
                  disabled={cantidad >= Number(producto.stock)}
                  onClick={() =>
                    setCantidad((valor) =>
                      Math.min(Number(producto.stock), valor + 1),
                    )
                  }
                >
                  <CirclePlus size={19} />
                </button>
              </div>
            </div>
            <button
              className="product-buy__add"
              disabled={!disponible}
              onClick={agregar}
              type="button"
            >
              {agregado ? (
                <>
                  <Check size={19} /> Agregado al carrito
                </>
              ) : (
                <>
                  <ShoppingCart size={19} /> Agregar al carrito
                </>
              )}
            </button>
            {disponible && (
              <Link
                className="product-buy__now"
                to="/carrito"
                onClick={() =>
                  agregarProducto(producto, cantidad, color ? { color } : {})
                }
              >
                Comprar ahora
              </Link>
            )}
            <div className="product-buy__guarantees">
              <span>
                <ShieldCheck size={15} /> Garantía oficial TERRA
              </span>
              <span>
                <Truck size={15} /> Envío seguro a Bolivia
              </span>
            </div>
            <div className="product-buy__extra">
              {producto.esMasVendido && (
                <span>
                  <Star size={13} fill="currentColor" /> Más vendido:{" "}
                  {producto.totalVendido} unidades vendidas
                </span>
              )}
              <span>
                <Tag size={13} /> SKU: {producto.sku}
              </span>
            </div>
          </section>
        </div>
        <div className="product-highlights">
          <article>
            <Sparkles size={23} />
            <b>Confort superior</b>
            <small>Materiales seleccionados</small>
          </article>
          <article>
            <Check size={23} />
            <b>Calidad garantizada</b>
            <small>Respaldo TERRA</small>
          </article>
          <article>
            <Truck size={23} />
            <b>Despacho coordinado</b>
            <small>Atención personalizada</small>
          </article>
          <article>
            <ShieldCheck size={23} />
            <b>Compra segura</b>
            <small>Soporte en showroom</small>
          </article>
        </div>
      </section>
      <section className="product-detail__accordion" id="descripcion-completa">
        <div
          className={`accordion-item ${descripcionAbajoAbierta ? "open" : ""}`}
        >
          <button
            type="button"
            className="accordion-header"
            onClick={() => setDescripcionAbajoAbierta((v) => !v)}
            aria-expanded={descripcionAbajoAbierta}
          >
            <span>
              <FileText size={17} /> Descripción completa
            </span>
            <ChevronDown
              size={18}
              className={`accordion-chevron ${descripcionAbajoAbierta ? "rotated" : ""}`}
            />
          </button>
          {descripcionAbajoAbierta && (
            <div className="accordion-body">
              <p>
                {producto.descripcion ||
                  "Diseño funcional y materiales de calidad para brindar confort a tu hogar todos los días."}
              </p>
            </div>
          )}
        </div>
      </section>
      <section className="product-detail__bottom">
        <article>
          <h2>Ficha técnica y dimensiones</h2>
          <dl>
            {Boolean(producto.marca) && (
              <>
                <dt>Marca</dt>
                <dd>{producto.marca}</dd>
              </>
            )}
            <dt>Modelo</dt>
            <dd>{producto.nombre}</dd>
            <dt>Categoría</dt>
            <dd>{producto.categoria}</dd>
            <dt>Medidas</dt>
            <dd>
              {producto.medida ||
                producto.detalle ||
                "Consultar medidas disponibles"}
            </dd>
            <dt>Disponibilidad</dt>
            <dd>
              Entrega inmediata
            </dd>
            <dt>Garantía</dt>
            <dd>Garantía oficial de:<b> GRUPO TERRA SRL.</b></dd>
          </dl>
        </article>
        <aside>
          <MapPin size={24} />
          <h2>Pruébalo en nuestro showroom</h2>
          <p>
            Visitá nuestro espacio de descanso para conocer el producto y
            recibir asesoramiento.
          </p>
          {/* <Link to="/catalogo">Coordinar visita por WhatsApp</Link> */}
        </aside>
      </section>
      {!!relacionados.length && (
        <section className="product-related">
          <header>
            <h2>Otros modelos que te pueden interesar</h2>
            <Link to="/catalogo">
              Ver catálogo <ChevronRight size={16} />
            </Link>
          </header>
          <div>
            {relacionados.map((item) => (
              <Link
                to={`/productos/${item.id}`}
                state={location.state}
                key={item.id}
              >
                <figure>
                  <img
                    className={item.imagen_url ? "" : "img-fallback"}
                    src={imagenDeProducto(item.imagen_url)}
                    alt={item.nombre}
                    onError={usarImagenFallback}
                  />
                </figure>
                <h3>{item.nombre}</h3>
                <p>{item.descripcion || item.categoria}</p>
                <strong>{formatoMoneda(item.precio)}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
