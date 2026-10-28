import { useEffect } from 'react';
import { X } from 'lucide-react';

const MEDIO = 'aspect-video w-full rounded-terra-campo bg-terra-pantalla';

// Video ampliado sobre un telón oscuro. Se cierra con la X, tocando fuera o con Escape.
export default function ModalVideo({ abierto, onCerrar, embed, src, url, titulo }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alEscape = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-200 grid place-items-center bg-terra-telon p-6" onClick={onCerrar}>
      <div
        className="relative w-full max-w-230"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <button
          type="button"
          className="absolute -top-13 right-0 grid size-11 cursor-pointer place-items-center rounded-full border-0
            bg-terra-superficie text-terra-texto"
          onClick={onCerrar}
          aria-label="Cerrar video"
        >
          <X size={20} />
        </button>
        {embed ? (
          <iframe
            className={`${MEDIO} border-0`}
            src={src}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className={MEDIO}
            src={url}
            controls
            autoPlay
            playsInline
          />
        )}
      </div>
    </div>
  );
}
