import { useEffect } from 'react';
import { X } from 'lucide-react';

// Vista ampliada de la foto del producto. Se cierra con el botón, el fondo o Escape.
export default function ZoomImagen({ abierto, src, alt, onCerrar }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alEscape = (event) => {
      if (event.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar imagen ampliada"
        onClick={onCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Imagen ampliada de ${alt}`}
        className="relative flex max-w-[min(94vw,76rem)] items-center justify-center"
      >
        <button
          type="button"
          className="absolute -top-3 -right-3 z-1 flex size-12 cursor-pointer items-center justify-center
            rounded-full border border-white/65 bg-black/70 text-white shadow-lg backdrop-blur-sm
            hover:bg-black/85 focus-visible:outline-3 focus-visible:outline-offset-3
            focus-visible:outline-terra-primario/40 motion-reduce:transition-none"
          onClick={onCerrar}
          aria-label="Cerrar imagen ampliada"
        >
          <X size={22} />
        </button>
        <img
          src={src}
          alt={alt}
          className="block h-auto w-auto max-h-[min(84dvh,52rem)] max-w-[min(94vw,76rem)] rounded-xl
            bg-terra-superficie object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
