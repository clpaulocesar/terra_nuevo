import { Link } from 'react-router-dom';
import ImagenProducto from '../../../components/ui/ImagenProducto.jsx';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

const MARGEN = 'mx-3.5 block';

// Fondo blanco detrás de la foto en todos los temas (las fotos tienen fondo blanco).
export default function TarjetaRelacionado({ producto }) {
  return (
    <Link
      to={`/productos/${producto.id}`}
      className="overflow-hidden rounded-terra-chico border border-terra-borde-suave bg-terra-superficie pb-3.75
        text-terra-texto no-underline"
    >
      <figure className="aspect-4/3 overflow-hidden bg-terra-fondo-imagen">
        <ImagenProducto
          className="size-full object-contain"
          src={producto.imagen_url}
          alt={producto.nombre}
        />
      </figure>
      <h3 className={`${MARGEN} mt-3 mb-1 line-clamp-2 text-terra-sm`}>{producto.nombre}</h3>
      <p className={`${MARGEN} mb-3 line-clamp-2 min-h-[2.8em] text-terra-2xs leading-normal text-terra-texto-suave`}>
        {producto.descripcion || producto.categoria}
      </p>
      <strong className={`${MARGEN} text-terra-md`}>{formatoMoneda(producto.precio)}</strong>
    </Link>
  );
}
