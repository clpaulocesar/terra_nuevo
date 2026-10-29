import { forwardRef } from 'react';
import { CameraOff, Check, ImageUp } from 'lucide-react';

// Vista de la cámara del escáner. Mientras se lee una imagen o tras leer un código
// (pausa), el video se oculta y se muestra un aviso encima.
const CamaraQr = forwardRef(function CamaraQr({ pausado, leyendoImagen }, refVideo) {
  const sinVideo = pausado || leyendoImagen;
  return (
    <div
      className={`relative aspect-4/3 w-full overflow-hidden rounded-terra-campo sm:aspect-video
        ${sinVideo ? 'bg-terra-texto dark:bg-terra-superficie-2' : 'bg-black'}`}
    >
      <video
        ref={refVideo}
        autoPlay
        muted
        playsInline
        aria-label="Vista de cámara para escanear códigos QR"
        className={`size-full object-cover ${sinVideo ? 'invisible' : ''}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[12%] rounded-terra-boton border-2 border-white/60
          ${sinVideo ? 'invisible' : ''}`}
      />
      {leyendoImagen && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-terra-sm font-black text-white"
        >
          <ImageUp size={28} className="animate-terra-pulso text-terra-destello motion-reduce:animate-none" />
          <span>Analizando imagen…</span>
        </div>
      )}
      {pausado && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-terra-sm
            font-black text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]"
        >
          <Check size={28} className="size-10.5 rounded-full bg-terra-ok p-1.5" />
          <span>Código leído</span>
          <small className="inline-flex items-center gap-1.25 text-terra-2xs font-semibold opacity-85">
            <CameraOff size={14} /> Cámara apagada · tocá &quot;Escanear otro&quot; para seguir
          </small>
        </div>
      )}
    </div>
  );
});

export default CamaraQr;
