import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useHojaInferior } from '../../../hooks/useHojaInferior.js';
import HojaInferior from '../../../components/ui/HojaInferior.jsx';
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA_COMPRA } from '../../compra/estilosCompra.js';
import TotalesCompra from '../../compra/components/TotalesCompra.jsx';
import MediosPago from './MediosPago.jsx';
import PagoQr from './PagoQr.jsx';

// Liquidación, medio de pago y botón para generar el pedido: columna al costado y hoja
// inferior en teléfono (cerrada solo muestra el total y el botón).
// confirm-summary: gancho del alto contraste (accesibilidad.css).
export default function ResumenConfirmacion({ pedido, onAmpliarQr }) {
  const hoja = useHojaInferior();
  const ocultoCerrada = hoja.abierta ? '' : 'con-resumen-fijo:hidden';
  const sinZona = pedido.esFlujoMayorista && pedido.quiereEnvio && (!pedido.zonaEnvioId || pedido.cargandoTarifas);
  return (
    <HojaInferior
      hoja={hoja}
      etiquetaAbrir="Expandir resumen del pedido"
      etiquetaCerrar="Contraer resumen del pedido"
      className={`confirm-summary ${TARJETA_COMPRA} p-6 lg:sticky lg:top-21`}
    >
      <h2 className={`m-0 mb-4 ${ocultoCerrada}`}>Liquidación final</h2>
      <TotalesCompra
        subtotal={pedido.subtotal}
        envio={pedido.quiereEnvio ? pedido.filaEnvio : null}
        total={pedido.totalConEnvio}
        hojaCerrada={!hoja.abierta}
      />
      <MediosPago
        metodo={pedido.metodoPago}
        onElegir={pedido.elegirMetodoPago}
        className={ocultoCerrada}
      />
      {pedido.metodoPago === 'qr' && (
        <PagoQr
          total={pedido.totalConEnvio}
          onAmpliar={onAmpliarQr}
          className={ocultoCerrada}
        />
      )}
      {pedido.error && (
        <p className={`text-terra-sm font-bold text-terra-acento ${ocultoCerrada}`}>{pedido.error}</p>
      )}
      {!pedido.metodoPago && (
        <p className={`m-0 mb-4 text-center text-terra-xs text-terra-texto-suave ${ocultoCerrada}`}>
          Selecciona un medio de pago para continuar.
        </p>
      )}
      <button
        className={`${BOTON_PRINCIPAL} mt-2 con-resumen-fijo:min-h-11.5`}
        disabled={pedido.procesando || !pedido.metodoPago || sinZona}
        onClick={pedido.confirmar}
        type="button"
      >
        <CheckCircle2 size={23} />
        {pedido.procesando ? 'Generando ticket…' : 'Confirmar y generar pedido'}
      </button>
      <Link
        className={`${BOTON_SECUNDARIO} mt-2.5 ${ocultoCerrada}`}
        to="/carrito"
      >
        Modificar carrito
      </Link>
      <small className={`mt-4 block text-center text-xs text-terra-texto-suave ${ocultoCerrada}`}>
        Terminal seguro · Ticket inmediato en caja
      </small>
    </HojaInferior>
  );
}
