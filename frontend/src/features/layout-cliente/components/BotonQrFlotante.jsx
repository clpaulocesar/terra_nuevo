import { QrCode } from 'lucide-react';
import {
  BOTON_FLOTANTE, OCULTO_CON_ASISTENTE, OCULTO_CON_CARRITO, OCULTO_EN_CARRITO, POSICION_QR,
} from '../../../components/flotantes/estilosFlotantes.js';

// Botón flotante "Comprar por QR": abre la cámara del catálogo. Tiene un halo
// suave permanente y una onda que se expande desde el borde.
export default function BotonQrFlotante({ onClick }) {
  return (
    <button
      type="button"
      className={`z-74 inline-flex overflow-visible animate-terra-halo [&>svg]:size-5.5 motion-reduce:animate-none
        before:pointer-events-none before:absolute before:-inset-1.75 before:-z-1 before:rounded-full
        before:bg-terra-primario/14 ${BOTON_FLOTANTE} ${POSICION_QR} ${OCULTO_EN_CARRITO} ${OCULTO_CON_ASISTENTE}
        ${OCULTO_CON_CARRITO}`}
      onClick={onClick}
      aria-label="Comprar por QR, abrir cámara"
    >
      <QrCode size={21} />
    </button>
  );
}
