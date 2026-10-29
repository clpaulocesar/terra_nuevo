import ImagenTenida from './ImagenTenida.jsx';

// Miniatura cuadrada. "Vista N" queda solo para lectores de pantalla: antes se
// cortaba fuera del botón y nunca se vio.
export default function MiniaturaGaleria({ src, indice, activa, color, onElegir }) {
  return (
    <button
      type="button"
      onClick={onElegir}
      className={`cursor-pointer overflow-hidden rounded-lg border-2 bg-terra-superficie p-1 dark:bg-terra-superficie-2
        ${activa ? 'border-terra-primario shadow-[0_4px_12px_rgba(166,25,46,0.15)]' : 'border-terra-borde-suave'}`}
    >
      <ImagenTenida
        src={src}
        alt={`Vista ${indice + 1}`}
        color={color}
        className="aspect-square"
        claseImagen="aspect-square"
      />
      <span className="sr-only">Vista {indice + 1}</span>
    </button>
  );
}
