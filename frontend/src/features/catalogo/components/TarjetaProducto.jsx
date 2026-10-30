import { Link } from 'react-router-dom';
import ImagenPerezosa from '../../../components/ui/ImagenPerezosa.jsx';
import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import { imagenDeProducto, usarImagenFallback } from '../../../utils/imagenProducto.js';
import { coloresDeProducto } from '../utils/productoCatalogo.js';
import InsigniasProducto from './InsigniasProducto.jsx';
import PrecioTarjeta from './PrecioTarjeta.jsx';
import CantidadMayorista from './CantidadMayorista.jsx';
import BotonAgregarCarrito from './BotonAgregarCarrito.jsx';

// Las primeras tarjetas entran escalonadas (40 ms entre una y otra).
const TARJETAS_ESCALONADAS = 8;

// Tarjeta de producto del catálogo (cliente y mayorista).
// Clases terra-*: ganchos de accesibilidad.css (foco, contraste, lectura en voz); no tienen estilos propios.
export default function TarjetaProducto({
  producto, indice, esMayorista, recienAgregado, esMasVendido, cantidadElegida,
  onCambiarCantidad, onAgregar, onClick, onKeyDown, onAbrirDetalle, stateTarjeta,
}) {
  const tonos = coloresDeProducto(producto);
  const escalas = Array.isArray(producto.escalasMayorista) ? producto.escalasMayorista : [];
  const minimoMayorista = escalas[0]?.minCantidad || 1;
  const disponible = producto.stock >= (esMayorista ? minimoMayorista : 1);
  const cantidad = Math.min(producto.stock, Math.max(minimoMayorista, cantidadElegida || minimoMayorista));
  const precioMinorista = Number(producto.precio || 0);
  const tramo = escalas.filter((escala) => escala.minCantidad <= cantidad).at(-1);
  const precioMayorista = Number(tramo?.precio ?? producto.precioMayorista ?? producto.precio);
  const ahorroMayorista = precioMinorista > precioMayorista
    ? Math.round(((precioMinorista - precioMayorista) / precioMinorista) * 100)
    : 0;
  const precioLeido = formatoMoneda(esMayorista && Number.isFinite(Number(producto.precioMayorista))
    ? producto.precioMayorista
    : producto.precio);
  const lectura = [
    producto.nombre,
    producto.tagMedida || producto.medida,
    precioLeido,
    producto.nuevo_lanzamiento ? 'nuevo lanzamiento' : '',
    producto.en_oferta ? 'en oferta' : '',
    disponible ? '' : 'agotado',
  ].filter(Boolean).join(', ');

  const borde = recienAgregado
    ? 'border-terra-primario shadow-terra-anillo'
    : producto.en_oferta
      ? `terra-card--oferta border-terra-primario shadow-[0_0_0_3px_rgba(166,25,46,0.10)]
        hover:shadow-[0_0_0_3px_rgba(166,25,46,0.16),var(--terra-sombra-sm)] dark:border-terra-oferta
        dark:shadow-[0_0_0_3px_rgba(224,48,74,0.18)]`
      : 'border-terra-borde shadow-terra-tarjeta hover:border-terra-borde-hover hover:shadow-terra-tarjeta-hover';

  return (
    <article
      data-lectura={lectura}
      data-tour={indice === 0 ? 'producto' : undefined}
      tabIndex={0}
      aria-label={`${producto.nombre}, ${precioLeido}, ${disponible ? 'disponible' : 'agotado'}. Enter para ver el detalle.`}
      onKeyDown={(event) => onKeyDown(event, producto, disponible)}
      onClick={(event) => onClick(event, producto)}
      style={indice < TARJETAS_ESCALONADAS ? { animationDelay: `${(indice + 1) * 40}ms` } : undefined}
      className={`terra-card group flex animate-terra-entrada cursor-pointer flex-col overflow-hidden
        rounded-terra-tarjeta border bg-terra-superficie transition-[transform,box-shadow,border-color] duration-200
        hover:-translate-y-1 active:translate-y-0 motion-reduce:animate-none max-sm:active:scale-98
        ${disponible ? '' : 'pointer-events-none opacity-60'} ${borde}`}
    >
      <div
        className={`terra-card__media relative flex aspect-square max-h-terra-foto-tarjeta w-full items-center
          justify-center overflow-hidden bg-terra-fondo-imagen has-data-[cargada=false]:fondo-cargando
          ${esMayorista ? 'max-sm:aspect-16/10' : ''}`}
      >
        {/* img-fallback (logo de TERRA): también la agrega usarImagenFallback si la foto falla. */}
        <ImagenPerezosa
          className={`terra-card__img block h-full w-full object-contain transition-[transform,opacity] duration-400
            group-hover:scale-105 data-[cargada=false]:opacity-0 [&.img-fallback]:h-auto [&.img-fallback]:w-3/5
            [&.img-fallback]:opacity-90 [&.img-fallback]:group-hover:scale-100
            ${producto.imagen_url ? '' : 'img-fallback'}`}
          alt={producto.nombre}
          src={imagenDeProducto(producto.imagen_url)}
          onError={usarImagenFallback}
        />
        <InsigniasProducto producto={producto} esMasVendido={esMasVendido} />
        {producto.tagMedida && (
          <div
            className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.25 rounded-terra-chico border
              border-terra-borde bg-terra-superficie/92 px-2.25 py-1 text-xs font-extrabold text-terra-texto
              shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:gap-1.5 sm:px-2.5 sm:py-1.25 sm:text-terra-xs"
          >
            <IconoMaterial
              nombre={producto.tagMedidaIcon || 'verified'}
              className="text-2xl text-terra-primario"
            />
            {producto.tagMedida}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pt-2.5 pb-2 sm:gap-2.5 sm:px-4.5 sm:pt-4 sm:pb-2.5 lg:px-4">
        <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1">
          <span
            className="flex items-center gap-1 text-terra-2xs font-extrabold text-terra-estrella-texto sm:gap-1.25
              sm:text-terra-sm"
          >
            <span className="text-terra-estrella">★★★★★</span>
            <span>(calidad)</span>
          </span>
          <span
            className={`terra-card__stock rounded-full px-1.75 py-0.5 text-terra-2xs font-extrabold whitespace-nowrap
              sm:px-2.5 sm:py-0.75 sm:text-terra-sm ${disponible
              ? 'bg-terra-ok-fondo text-terra-ok'
              : 'bg-terra-primario-claro text-terra-alerta'}`}
          >
            {disponible ? '● Disponible' : '○ Agotado'}
          </span>
        </div>

        <Link
          to={`/productos/${producto.id}`}
          state={stateTarjeta}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.altKey ||
              event.ctrlKey ||
              event.shiftKey
            ) return;
            event.preventDefault();
            onAbrirDetalle(producto.id);
          }}
        >
          <h2
            className="terra-card__title m-0 line-clamp-2 text-terra-md leading-[1.3] font-black tracking-terra-ajustado
              text-terra-texto sm:text-terra-lg"
          >
            {Boolean(producto.marca) && (
              <span className="mb-0.5 block text-xs font-semibold tracking-wider text-terra-texto-suave uppercase">
                {producto.marca}
              </span>
            )}
            {producto.nombre}
          </h2>
        </Link>

        {Boolean(producto.descripcion) && (
          <p className="m-0 line-clamp-2 text-terra-sm leading-normal font-medium text-terra-texto-suave">
            {producto.descripcion}
          </p>
        )}

        {tonos.length > 0 && <MuestrasColor tonos={tonos} />}
      </div>

      <div
        className="mt-auto flex flex-col gap-2 border-t border-terra-borde bg-terra-superficie-2 p-2.5 sm:gap-2.5
          sm:px-4.5 sm:pt-3.5 sm:pb-4.5 lg:px-4"
      >
        <PrecioTarjeta
          producto={producto}
          esMayorista={esMayorista}
          precioMinorista={precioMinorista}
          precioMayorista={precioMayorista}
          ahorroMayorista={ahorroMayorista}
        />
        {esMayorista && (
          <CantidadMayorista
            nombre={producto.nombre}
            cantidad={cantidad}
            maximo={producto.stock}
            onCambiar={(nueva) => onCambiarCantidad(producto.id, nueva)}
          />
        )}
        <BotonAgregarCarrito
          agregado={recienAgregado}
          deshabilitado={!disponible}
          data-tour={indice === 0 ? 'agregar' : undefined}
          onClick={() => onAgregar(producto, esMayorista ? cantidad : 1)}
        />
      </div>
    </article>
  );
}

function MuestrasColor({ tonos }) {
  return (
    <div className="mt-0.75 flex flex-wrap gap-1.5 sm:mt-1">
      {tonos.slice(0, 4).map((tono) => (
        <span
          key={`${tono.nombre}-${tono.valor}`}
          title={tono.nombre}
          style={{ backgroundColor: tono.valor }}
          className="size-4.5 rounded-full border-2 border-terra-superficie shadow-[0_2px_6px_rgba(0,0,0,0.12)] sm:size-5"
        />
      ))}
      {tonos.length > 4 && (
        <span className="text-xs font-extrabold text-terra-texto-suave sm:text-terra-xs">+{tonos.length - 4}</span>
      )}
    </div>
  );
}
