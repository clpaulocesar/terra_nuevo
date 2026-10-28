// Video en bucle y sin sonido en la esquina de la foto; al tocarlo se amplía.
export default function VideoMiniatura({ embed, src, url, titulo, onAmpliar }) {
  return (
    <button
      type="button"
      className="absolute bottom-3 left-3 z-2 aspect-video w-[32%] cursor-pointer overflow-hidden rounded-terra-chico
        border-2 border-terra-fondo-imagen bg-terra-pantalla p-0 shadow-[0_6px_18px_rgba(0,0,0,0.33)]"
      onClick={onAmpliar}
      aria-label="Ampliar video del producto"
    >
      {embed ? (
        <iframe
          className="pointer-events-none size-full border-0"
          src={src}
          title={titulo}
          tabIndex={-1}
        />
      ) : (
        <video
          className="pointer-events-none size-full"
          src={url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
    </button>
  );
}
