import { Link } from 'react-router-dom';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import { imagenDeProducto, usarImagenFallback } from '../../../utils/imagenProducto.js';

const MARGEN = 'mx-3.5';

// Fondo blanco detrás de la foto en todos los temas (las fotos tienen fondo blanco).
export default function TarjetaRelacionado({ producto }) {
  return (
    <Link
      to={`/productos/${producto.id}`}
      className="overflow-hidden rounded-terra-chico border border-terra-borde-suave bg-terra-superficie pb-3.75
        text-terra-texto no-underline"
    >
      <figure className="aspect-4/3 overflow-hidden bg-terra-fondo-imagen">
        <img
          className={`size-full object-contain ${producto.imagen_url ? '' : 'img-fallback'}`}
          src={imagenDeProducto(producto.imagen_url)}
          alt={producto.nombre}
          onError={usarImagenFallback}
        />
      </figure>
      <h3 className={`${MARGEN} mt-3 mb-1 text-terra-sm`}>{producto.nombre}</h3>
      <p className={`${MARGEN} mb-3 line-clamp-3 min-h-[3.1em] text-terra-2xs leading-normal text-terra-texto-suave`}>
        {producto.descripcion || producto.categoria}
      </p>
      <strong className={`${MARGEN} text-terra-md`}>{formatoMoneda(producto.precio)}</strong>
    </Link>
  );
}
