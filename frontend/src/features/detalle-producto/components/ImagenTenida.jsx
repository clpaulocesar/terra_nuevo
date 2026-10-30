import ImagenProducto from '../../../components/ui/ImagenProducto.jsx';

// Foto del producto con el color elegido encima (máscara con la misma foto y mezcla
// multiply). El tinte solo aparece si hay color: hoy los colores están ocultos.
export default function ImagenTenida({ src, alt, color, className = '', claseImagen = '' }) {
  return (
    <span className={`relative block w-full ${className}`}>
      <ImagenProducto
        className={`block w-full object-contain ${claseImagen}`}
        src={src}
        alt={alt}
      />
      {color && (
        <i
          className="pointer-events-none absolute inset-0 block mix-blend-multiply mask-contain mask-center mask-no-repeat"
          style={{ backgroundColor: color.valor, WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
