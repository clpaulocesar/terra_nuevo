import { useContext, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  MapPin,
  Package,
  Repeat2,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { listarProductos } from '../services/productoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import ImagenProducto from '../components/ui/ImagenProducto.jsx';

const MES = new Intl.DateTimeFormat('es-BO', { month: 'short' });
const activo = (estado) => !['completed', 'delivered', 'cancelled'].includes(String(estado || '').toLowerCase());

export default function InicioMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!sesion?.token) return;

    Promise.all([
      listarMisPedidosMayorista(sesion.token),
      listarProductos({ limite: 100 }),
    ])
      .then(([ordenes, catalogo]) => {
        setPedidos(Array.isArray(ordenes) ? ordenes : []);
        setProductos(Array.isArray(catalogo) ? catalogo : []);
      })
      .catch(() => {
        setPedidos([]);
        setProductos([]);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [sesion?.token]);

  const analisis = useMemo(() => {
    const total = pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
    const meses = Array.from({ length: 6 }, (_, indice) => {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - (5 - indice));
      return {
        clave: `${fecha.getFullYear()}-${fecha.getMonth()}`,
        etiqueta: MES.format(fecha),
        valor: 0,
      };
    });

    pedidos.forEach((pedido) => {
      const fecha = new Date(pedido.fecha);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      const mes = meses.find((item) => item.clave === clave);
      if (mes) mes.valor += Number(pedido.total || 0);
    });

    const categorias = new Map();
    pedidos.forEach((pedido) => {
      String(pedido.items || '')
        .split(',')
        .forEach((item) => {
          const clave = item.trim().split(' ').slice(-2).join(' ') || 'Otros';
          categorias.set(clave, (categorias.get(clave) || 0) + 1);
        });
    });

    return {
      total,
      activos: pedidos.filter((pedido) => activo(pedido.estado)).length,
      meses,
      categorias: [...categorias.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  }, [pedidos]);

  const maximo = Math.max(1, ...analisis.meses.map((mes) => mes.valor));
  const frecuentes = [...productos]
    .sort((a, b) => Number(b.ventas || 0) - Number(a.ventas || 0))
    .slice(0, 3);

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  return (
    <main className="w-full max-w-7xl mx-auto pb-10 font-terra text-terra-texto flex flex-col gap-4">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:px-7 sm:py-6 rounded-terra-modal bg-gradient-to-r from-terra-superficie via-terra-superficie to-terra-primario-suave border border-terra-borde shadow-terra-sm">
        <div>
          <span className="text-terra-3xs font-black tracking-widest text-terra-primario dark:text-terra-acento uppercase flex items-center gap-1.5">
            Cuenta Mayorista Verificada
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-texto my-1.5 tracking-tight">
            ¡Bienvenido de nuevo, {sesion?.nombre || 'cliente'}!
          </h1>
          <small className="text-terra-xs text-terra-texto-suave block font-medium">
            NIT: {sesion?.nit || 'Pendiente de registro'}
          </small>
          <p className="text-terra-sm text-terra-texto-suave max-w-2xl mt-1.5 leading-relaxed">
            Administra tus compras por mayor, pedidos en tránsito y condiciones comerciales desde tu panel central.
          </p>
        </div>
        <Link
          to="/catalogo"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-xs font-bold whitespace-nowrap transition-colors shadow-terra-sm shrink-0 w-full sm:w-auto"
        >
          Comprar con precio B2B <ArrowRight size={18} />
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-1">
        <article className="flex items-center gap-3.5 p-4 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm">
          <div className="size-11 rounded-terra-campo bg-terra-primario-suave text-terra-primario dark:text-terra-acento flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <small className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider block">
              Compras realizadas
            </small>
            <b className="text-xl font-black text-terra-primario dark:text-terra-acento my-0.5 block">
              {cargando ? '—' : formatoMoneda(analisis.total)}
            </b>
            <em className="text-terra-3xs text-terra-texto-suave not-italic block">
              Acumulado de pedidos
            </em>
          </div>
        </article>

        <article className="flex items-center gap-3.5 p-4 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm">
          <div className="size-11 rounded-terra-campo bg-terra-primario-suave text-terra-primario dark:text-terra-acento flex items-center justify-center shrink-0">
            <ClipboardList size={22} />
          </div>
          <div>
            <small className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider block">
              Pedidos activos
            </small>
            <b className="text-xl font-black text-terra-primario dark:text-terra-acento my-0.5 block">
              {cargando ? '—' : analisis.activos}
            </b>
            <em className="text-terra-3xs text-terra-texto-suave not-italic block">
              En preparación o tránsito
            </em>
          </div>
        </article>

        <article className="flex items-center gap-3.5 p-4 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm">
          <div className="size-11 rounded-terra-campo bg-terra-primario-suave text-terra-primario dark:text-terra-acento flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div>
            <small className="text-terra-3xs text-terra-texto-suave font-bold uppercase tracking-wider block">
              Pedidos registrados
            </small>
            <b className="text-xl font-black text-terra-primario dark:text-terra-acento my-0.5 block">
              {cargando ? '—' : pedidos.length}
            </b>
            <em className="text-terra-3xs text-terra-texto-suave not-italic block">
              Historial comercial
            </em>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col justify-between">
          <header className="flex items-start justify-between gap-2">
            <div>
              <span className="text-terra-3xs font-extrabold text-terra-primario dark:text-terra-acento uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 size={15} /> Análisis comercial
              </span>
              <h2 className="text-terra-md font-bold text-terra-texto mt-1">
                Historial de compras B2B
              </h2>
              <p className="text-terra-xs text-terra-texto-suave mt-0.5">
                Volumen facturado durante los últimos seis meses.
              </p>
            </div>
            <b className="text-terra-3xs font-bold px-2.5 py-1 rounded-full bg-terra-primario-suave text-terra-primario dark:text-terra-acento whitespace-nowrap">
              Últimos 6 meses
            </b>
          </header>

          <div className="flex items-end gap-2 sm:gap-3 h-44 mt-4 pt-2 border-b border-terra-borde px-2">
            {analisis.meses.map((mes, idx) => {
              const esUltimo = idx === analisis.meses.length - 1;
              return (
                <div key={mes.clave} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                  <strong className="text-terra-3xs font-extrabold text-terra-primario dark:text-terra-acento mb-1 hidden sm:block whitespace-nowrap">
                    {mes.valor ? formatoMoneda(mes.valor) : ''}
                  </strong>
                  <i
                    style={{ height: `${Math.max(7, (mes.valor / maximo) * 100)}%` }}
                    className={`w-9/12 max-w-8 rounded-t-md transition-all ${
                      esUltimo
                        ? 'bg-terra-primario'
                        : 'bg-terra-control hover:bg-terra-primario-suave'
                    }`}
                  />
                  <small className="absolute -bottom-5 text-terra-3xs text-terra-texto-suave font-bold">
                    {mes.etiqueta}
                  </small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col justify-between">
          <div>
            <header>
              <span className="text-terra-3xs font-extrabold text-terra-primario dark:text-terra-acento uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={15} /> Preferencias
              </span>
              <h2 className="text-terra-md font-bold text-terra-texto mt-1">
                Categorías más solicitadas
              </h2>
            </header>

            <div className="flex flex-col gap-2.5 my-3">
              {analisis.categorias.length ? (
                analisis.categorias.map(([nombre, cantidad], indice) => (
                  <div key={nombre} className="grid grid-cols-[1fr_35%_auto] items-center gap-2 text-terra-xs">
                    <span className="font-bold text-terra-texto truncate">{nombre}</span>
                    <b
                      style={{ width: `${Math.max(20, 100 - indice * 27)}%` }}
                      className="bg-terra-primario h-2 rounded-full block"
                    />
                    <small className="text-terra-texto-suave text-terra-3xs text-right whitespace-nowrap">
                      {cantidad} pedidos
                    </small>
                  </div>
                ))
              ) : (
                <p className="text-terra-xs text-terra-texto-suave">
                  Las categorías aparecerán con tus compras.
                </p>
              )}
            </div>
          </div>

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-terra-xs font-bold text-terra-primario dark:text-terra-acento hover:underline mt-2"
          >
            Ver catálogo mayorista <ArrowRight size={15} />
          </Link>
        </article>
      </section>

      <section className="p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm overflow-hidden">
        <header className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-terra-3xs font-extrabold text-terra-primario dark:text-terra-acento uppercase tracking-wider block">
              Seguimiento de compra
            </span>
            <h2 className="text-terra-md font-bold text-terra-texto mt-0.5">
              Pedidos mayoristas recientes
            </h2>
          </div>
          <Link
            to="/mi-cuenta/pedidos"
            className="text-terra-xs font-bold text-terra-primario dark:text-terra-acento hover:underline inline-flex items-center gap-1"
          >
            Ver todos los pedidos <ArrowRight size={15} />
          </Link>
        </header>

        {cargando ? (
          <p className="text-terra-xs text-terra-texto-suave py-3">Cargando pedidos…</p>
        ) : pedidos.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[580px]">
              {pedidos.slice(0, 4).map((pedido) => (
                <div
                  key={pedido.id}
                  className="grid grid-cols-[1fr_0.9fr_1.8fr_1fr_1fr] items-center gap-2 py-3 border-t border-terra-borde text-terra-xs"
                >
                  <b className="font-bold text-terra-texto">{pedido.codigo || `Pedido #${pedido.id}`}</b>
                  <small className="text-terra-texto-suave">
                    {new Date(pedido.fecha).toLocaleDateString('es-BO')}
                  </small>
                  <span className="text-terra-texto truncate">{pedido.items || 'Sin artículos'}</span>
                  <strong className="font-extrabold text-terra-primario dark:text-terra-acento">
                    {formatoMoneda(pedido.total)}
                  </strong>
                  <em className="px-2 py-1 rounded-full text-terra-3xs font-black not-italic text-center uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    {pedido.estado || 'Pendiente'}
                  </em>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-terra-xs text-terra-texto-suave py-3">
            Aún no registras pedidos. Explora el catálogo para iniciar tu compra.
          </p>
        )}
      </section>

      <section className="p-5 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm">
        <header className="flex items-center justify-between gap-2 mb-3.5">
          <div>
            <span className="text-terra-3xs font-extrabold text-terra-primario dark:text-terra-acento uppercase tracking-wider flex items-center gap-1.5">
              <Repeat2 size={15} /> Compra rápida
            </span>
            <h2 className="text-terra-md font-bold text-terra-texto mt-0.5">
              Productos frecuentes de alta rotación
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="text-terra-xs font-bold text-terra-primario dark:text-terra-acento hover:underline inline-flex items-center gap-1"
          >
            Ver catálogo completo <ArrowRight size={15} />
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {frecuentes.map((producto) => (
            <article
              key={producto.id}
              className="p-3 rounded-terra-campo border border-terra-borde bg-terra-superficie-2 flex flex-col justify-between gap-2"
            >
              <div className="w-full h-28 flex items-center justify-center rounded-lg bg-terra-superficie p-1">
                <ImagenProducto src={producto.imagen_url} alt="" className="h-full object-contain" />
              </div>
              <small className="text-terra-3xs text-terra-texto-suave uppercase font-semibold">
                {producto.categoria || 'Producto TERRA'}
              </small>
              <b className="text-terra-xs font-bold text-terra-texto line-clamp-2 min-h-[2.5em]">
                {producto.nombre}
              </b>
              <strong className="text-terra-md font-extrabold text-terra-primario dark:text-terra-acento">
                {formatoMoneda(producto.precioMayorista ?? producto.precio)}
              </strong>
              <button
                type="button"
                onClick={() => window.location.assign(`/productos/${producto.id}`)}
                className="w-full py-2 px-3 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-xs font-bold cursor-pointer transition-colors"
              >
                Ver producto
              </button>
            </article>
          ))}
          {!frecuentes.length && (
            <p className="text-terra-xs text-terra-texto-suave col-span-3">
              No hay productos frecuentes disponibles.
            </p>
          )}
        </div>
      </section>

      <section>
        <Link
          to="/mi-cuenta/perfil"
          className="p-4 rounded-terra-campo bg-terra-superficie border border-terra-borde text-terra-xs font-bold text-terra-texto hover:text-terra-primario flex items-center justify-between gap-2 transition-colors shadow-terra-sm"
        >
          <span className="flex items-center gap-2">
            <MapPin size={18} className="text-terra-primario dark:text-terra-acento" />
            Actualizar perfil, facturación y dirección
          </span>
          <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
