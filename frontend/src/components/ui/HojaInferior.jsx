import { X } from 'lucide-react';

// Panel que en pantallas anchas es una tarjeta más y por debajo de 761 px
// (con-resumen-fijo:) queda fijo abajo, sobre la barra inferior del teléfono: cerrado
// muestra 8.5rem y el asa lo abre. Abierto se cierra con el asa, con "Cerrar", tocando
// el velo de fondo o con Esc (useHojaInferior).
// El estado viene de useHojaInferior; quien lo usa decide qué ocultar con la hoja cerrada.
const HOJA = `con-resumen-fijo:fixed con-resumen-fijo:inset-x-0 con-resumen-fijo:bottom-terra-hoja-abajo
  con-resumen-fijo:z-30 con-resumen-fijo:rounded-t-terra-modal con-resumen-fijo:rounded-b-none
  con-resumen-fijo:border-b-0 con-resumen-fijo:px-4 con-resumen-fijo:pt-1.75 con-resumen-fijo:pb-terra-zona-segura
  con-resumen-fijo:shadow-terra-hoja con-resumen-fijo:transition-[max-height] con-resumen-fijo:duration-250
  motion-reduce:transition-none`;
const CERRADA = 'con-resumen-fijo:max-h-terra-hoja con-resumen-fijo:overflow-hidden';
// Abierta (y su velo) tapa también los flotantes y el botón de accesibilidad (z-index 1300),
// que si no quedarían encima de su contenido.
const ABIERTA = 'con-resumen-fijo:z-1310 con-resumen-fijo:max-h-terra-hoja-abierta con-resumen-fijo:overflow-y-auto';

export default function HojaInferior({ hoja, etiquetaAbrir, etiquetaCerrar, className = '', children }) {
  const { asaRef } = hoja;
  return (
    <>
      {hoja.abierta && (
        <button
          type="button"
          tabIndex={-1}
          className="fixed inset-0 z-1305 hidden border-0 bg-terra-velo p-0 con-resumen-fijo:block"
          onClick={hoja.cerrar}
          aria-label={etiquetaCerrar}
        />
      )}
      <aside className={`${className} ${HOJA} ${hoja.abierta ? ABIERTA : CERRADA}`}>
        {/* El asa se ve de 14 px pero se toca en 44: el ::before absoluto suma 7 px arriba (el
            relleno superior de la hoja) y 23 px abajo, sin ocupar lugar en la hoja cerrada. */}
        <button
          ref={asaRef}
          type="button"
          className="relative mb-1 hidden h-3.5 w-full cursor-grab items-center justify-center border-0 bg-transparent
            p-0 before:absolute before:inset-x-0 before:-top-1.75 before:-bottom-5.75 con-resumen-fijo:flex"
          aria-label={hoja.abierta ? etiquetaCerrar : etiquetaAbrir}
          aria-expanded={hoja.abierta}
          onClick={hoja.alternar}
          onTouchStart={hoja.iniciarArrastre}
          onTouchEnd={hoja.terminarArrastre}
        >
          <span
            aria-hidden="true"
            className="h-1 w-11 rounded-full bg-terra-borde-control"
          />
        </button>
        {hoja.abierta && (
          <button
            type="button"
            className="absolute top-1 right-2 hidden size-terra-toque items-center justify-center rounded-full border-0
              bg-terra-superficie-2 text-terra-texto hover:bg-terra-control-hover con-resumen-fijo:inline-flex"
            onClick={hoja.cerrar}
            aria-label="Cerrar resumen"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </aside>
    </>
  );
}
