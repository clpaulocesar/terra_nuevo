import { Camera, ImageUp, X } from 'lucide-react';
import CamaraQr from './CamaraQr.jsx';
import ProductoEscaneadoQr from './ProductoEscaneadoQr.jsx';
import ResumenEscaneoQr from './ResumenEscaneoQr.jsx';

// Diálogo del escáner QR. En teléfono es una hoja inferior; desde tablet, centrado.
// Recibe el estado y las acciones de useEscanerQr, y por separado sus refs.
export default function EscanerQrModal({ escaner, refVideo, refArchivo }) {
  if (!escaner.escanerAbierto) return null;
  return (
    <div
      className="fixed inset-0 z-80 flex animate-terra-aparecer items-end justify-center bg-terra-velo backdrop-blur-[5px]
        motion-reduce:animate-none sm:items-center sm:p-[clamp(12px,3vw,32px)]"
      onClick={escaner.cerrarEscaner}
    >
      <section
        className="max-h-[min(92dvh,760px)] w-full max-w-155 overflow-auto rounded-t-terra-modal border border-terra-borde
          bg-terra-superficie p-4 text-left text-terra-texto shadow-terra sm:max-h-[calc(100dvh-24px)]
          sm:rounded-terra-modal sm:p-[clamp(1rem,3vw,1.75rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-qr-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-2 flex items-center justify-between">
          <div
            className="inline-flex size-10 items-center justify-center rounded-terra-boton bg-terra-primario-suave
              text-terra-primario-oscuro dark:text-terra-acento"
          >
            <Camera size={22} />
          </div>
          <button
            type="button"
            onClick={escaner.cerrarEscaner}
            aria-label="Cerrar cámara"
            className="inline-flex size-9 items-center justify-center rounded-terra-chico bg-transparent text-terra-texto-suave
              transition-colors hover:bg-terra-primario-suave hover:text-terra-acento"
          >
            <X size={20} />
          </button>
        </header>
        <h2 id="catalog-qr-title" className="mt-3 mb-1.5 text-[clamp(1.25rem,2.5vw,1.55rem)] font-black text-terra-texto">
          Escanea un producto
        </h2>
        <p className="mb-4 text-terra-md leading-normal text-terra-texto-suave">
          Usa la cámara o carga una foto del QR. Puedes sumar varios productos antes de confirmar.
        </p>
        <CamaraQr ref={refVideo} pausado={escaner.escaneoPausado} leyendoImagen={escaner.leyendoImagenQr} />
        <SubirImagenQr escaner={escaner} refArchivo={refArchivo} />
        <p
          className={`my-3 min-h-[2.5em] text-terra-sm font-bold ${escaner.errorEscaner ? 'text-terra-alerta' : 'text-terra-texto-suave'}`}
          role="status"
          aria-live="polite"
        >
          {escaner.estadoEscaner || 'La cámara se activará para leer el código.'}
        </p>
        {escaner.escaneoPausado && escaner.itemQrEscaneado && (
          <ProductoEscaneadoQr
            item={escaner.itemQrEscaneado}
            onCambiarCantidad={escaner.cambiarCantidadQr}
            onEscanearOtro={escaner.reanudarEscaneo}
          />
        )}
        <ResumenEscaneoQr
          unidades={escaner.unidadesQr}
          productos={escaner.carritoQr.length}
          total={escaner.totalQr}
          ultimoProductoId={escaner.ultimoProductoQrId}
          onConfirmar={escaner.confirmarCompraQr}
        />
      </section>
    </div>
  );
}

function SubirImagenQr({ escaner, refArchivo }) {
  const leyendo = escaner.leyendoImagenQr;
  return (
    <div
      className="mt-3 flex flex-col items-stretch justify-between gap-2.5 rounded-terra-boton border border-dashed
        border-terra-borde bg-terra-superficie-2 p-2.5 sm:flex-row sm:items-center sm:p-3"
    >
      <input
        ref={refArchivo}
        type="file"
        accept="image/*"
        aria-label="Seleccionar imagen con código QR"
        onChange={escaner.leerImagenQr}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => refArchivo.current?.click()}
        disabled={leyendo}
        className="inline-flex min-h-10.5 w-full flex-none items-center justify-center gap-1.5 rounded-terra-chico border
          border-terra-borde bg-terra-superficie px-3 text-terra-sm font-black text-terra-acento
          enabled:hover:border-terra-primario enabled:hover:bg-terra-primario-suave disabled:cursor-wait
          disabled:opacity-70 dark:bg-terra-control-hover dark:enabled:hover:border-terra-oferta
          dark:enabled:hover:bg-terra-primario-claro sm:w-auto"
      >
        <ImageUp size={18} /> {leyendo ? 'Leyendo imagen…' : 'Subir imagen QR'}
      </button>
      <small className="text-terra-2xs leading-snug text-terra-texto-suave">
        Elige una foto o captura donde el código se vea completo.
      </small>
    </div>
  );
}
