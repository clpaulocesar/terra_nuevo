import { useCallback, useState } from 'react';
import { IMAGEN_PRODUCTO_FALLBACK } from '../../../utils/imagenProducto.js';
import { urlVideoEnBucle, videoIncrustado } from '../utils/videoProducto.js';
import FotoPrincipal from './FotoPrincipal.jsx';
import MiniaturaGaleria from './MiniaturaGaleria.jsx';
import ModalVideo from './ModalVideo.jsx';
import ZoomImagen from './ZoomImagen.jsx';

const FOTOS_REEMPLAZO = [IMAGEN_PRODUCTO_FALLBACK];

// Galería: foto elegida, hasta 4 miniaturas y el video ampliado. Con la ficha en
// una columna ocupa el ancho de la tarjeta hasta 600 px.
export default function GaleriaProducto({ producto, colores, color, onElegirColor }) {
  const [foto, setFoto] = useState(0);
  const [videoAmpliado, setVideoAmpliado] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);
  const cerrarVideo = useCallback(() => setVideoAmpliado(false), []);
  const cerrarImagen = useCallback(() => setImagenAmpliada(false), []);
  const fotosPropias = producto.imagen_url ? [producto.imagen_url] : FOTOS_REEMPLAZO;
  const fotos = producto.imagenes?.length ? producto.imagenes : fotosPropias;
  const embed = producto.video_url ? videoIncrustado(producto.video_url) : null;
  const video = { embed, src: urlVideoEnBucle(embed), url: producto.video_url };

  return (
    <div className="mx-auto w-full max-w-150 @terra-ficha:max-w-none">
      <FotoPrincipal
        producto={producto}
        src={fotos[foto]}
        colores={colores}
        color={color}
        onElegirColor={onElegirColor}
        video={video}
        onAmpliarVideo={() => setVideoAmpliado(true)}
        onAmpliarImagen={() => setImagenAmpliada(true)}
      />
      <div className="mt-3.25 grid grid-cols-3 gap-2.75 sm:grid-cols-4">
        {fotos.slice(0, 4).map((src, indice) => (
          <MiniaturaGaleria
            key={`${src}-${indice}`}
            src={src}
            indice={indice}
            activa={foto === indice}
            color={color}
            onElegir={() => setFoto(indice)}
          />
        ))}
      </div>
      {producto.video_url && (
        <ModalVideo
          abierto={videoAmpliado}
          onCerrar={cerrarVideo}
          {...video}
          titulo={`Video de ${producto.nombre}`}
        />
      )}
      {fotos[foto] !== IMAGEN_PRODUCTO_FALLBACK && (
        <ZoomImagen
          abierto={imagenAmpliada}
          src={fotos[foto]}
          alt={producto.nombre}
          onCerrar={cerrarImagen}
        />
      )}
    </div>
  );
}
