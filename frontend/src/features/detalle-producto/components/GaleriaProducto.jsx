import { useCallback, useState } from 'react';
import { urlVideoEnBucle, videoIncrustado } from '../utils/videoProducto.js';
import FotoPrincipal from './FotoPrincipal.jsx';
import MiniaturaGaleria from './MiniaturaGaleria.jsx';
import ModalVideo from './ModalVideo.jsx';

// Galería: foto elegida, hasta 4 miniaturas y el video ampliado. Con la ficha en
// una columna ocupa el ancho de la tarjeta hasta 600 px.
export default function GaleriaProducto({ producto, colores, color, onElegirColor }) {
  const [foto, setFoto] = useState(0);
  const [videoAmpliado, setVideoAmpliado] = useState(false);
  const cerrarVideo = useCallback(() => setVideoAmpliado(false), []);
  // Sin fotos queda una sola entrada vacía: ImagenProducto muestra el logo de TERRA.
  const fotos = producto.imagenes?.length ? producto.imagenes : [producto.imagen_url];
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
    </div>
  );
}
