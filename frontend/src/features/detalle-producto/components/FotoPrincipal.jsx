import { Sparkles } from 'lucide-react';
import { IMAGEN_PRODUCTO_FALLBACK } from '../../../utils/imagenProducto.js';
import ImagenTenida from './ImagenTenida.jsx';
import SelectorColores from './SelectorColores.jsx';
import VideoMiniatura from './VideoMiniatura.jsx';

// Foto grande de la galería con sus insignias, el selector de colores y el video.
// product-gallery__main: gancho de accesibilidad.css (fondo blanco en alto contraste).
// El logo de reemplazo lleva en modo noche una placa clara (la caligrafía es oscura).
export default function FotoPrincipal({ producto, src, colores, color, onElegirColor, video, onAmpliarVideo }) {
  const esReemplazo = src === IMAGEN_PRODUCTO_FALLBACK;
  return (
    <div
      className="product-gallery__main relative mx-auto aspect-square max-h-[min(60vh,520px)] w-full overflow-hidden
        rounded-terra-boton border border-terra-borde-suave bg-terra-superficie dark:bg-terra-superficie-2"
    >
      {src && (
        <ImagenTenida
          src={src}
          alt={producto.nombre}
          color={color}
          className="h-full"
          claseImagen={`h-full dark:[&.img-fallback]:rounded-3xl dark:[&.img-fallback]:bg-terra-placa
            dark:[&.img-fallback]:bg-clip-content dark:[&.img-fallback]:p-[20%] ${esReemplazo ? 'img-fallback' : ''}`}
        />
      )}
      {producto.esMasVendido && (
        <b
          className="absolute top-3.5 left-3.5 flex items-center gap-1.25 rounded-full bg-terra-primario px-2.5 py-1.75
            text-terra-2xs text-terra-sobre-primario uppercase"
        >
          <Sparkles size={13} />
          Más vendido
        </b>
      )}
      {color && (
        <span
          className="absolute top-3.5 right-3.5 z-2 inline-flex max-w-[62%] items-center gap-1.5 truncate rounded-full border
            border-terra-borde-suave bg-terra-superficie/95 px-3 py-1.75 text-terra-2xs font-bold text-terra-texto
            shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          <i
            className="block size-2.75 shrink-0 rounded-full border border-terra-borde-suave"
            style={{ backgroundColor: color.valor }}
            aria-hidden="true"
          />
          {color.nombre}
        </span>
      )}
      {colores.length > 0 && (
        <SelectorColores
          colores={colores}
          color={color}
          onElegir={onElegirColor}
        />
      )}
      {producto.video_url && (
        <VideoMiniatura
          {...video}
          titulo={`Video de ${producto.nombre}`}
          onAmpliar={onAmpliarVideo}
        />
      )}
    </div>
  );
}
