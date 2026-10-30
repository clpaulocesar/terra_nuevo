import { useState } from 'react';
import { fuenteImagenProducto } from '../../utils/imagenProducto.js';
import ImagenPerezosa from './ImagenPerezosa.jsx';

// Logo de reemplazo: centrado y con relleno sobre el fondo blanco de las fotos (el
// mismo en todos los temas: la caligrafía del logo es oscura y no se lee sobre el
// fondo del modo noche o del alto contraste; accesibilidad.css respeta este fondo).
const CLASES_REEMPLAZO = 'bg-terra-fondo-imagen object-contain p-[15%]';

// Foto de producto que nunca deja ver el texto alternativo: sin URL muestra el logo
// de TERRA directamente y, si la foto falla, lo pone en la misma caja. Si el logo
// también falla no se vuelve a intentar (sin onError ya no hay bucle).
// text-transparent: el alt sigue ahí para los lectores de pantalla, pero no se pinta.
// data-reemplazo: permite estilizar el logo desde quien lo usa (data-reemplazo:...).
export default function ImagenProducto({ src, alt, className = '', perezosa = false, ...resto }) {
  const [urlFallida, setUrlFallida] = useState(null);
  const fuente = fuenteImagenProducto(src, urlFallida);
  const Imagen = perezosa ? ImagenPerezosa : 'img';
  const manejarError = () => setUrlFallida(fuente.url);

  return (
    <Imagen
      {...resto}
      src={fuente.src}
      alt={alt}
      data-reemplazo={fuente.reemplazo || undefined}
      className={`text-transparent ${fuente.reemplazo ? CLASES_REEMPLAZO : ''} ${className}`}
      onError={fuente.reemplazo ? undefined : manejarError}
    />
  );
}
