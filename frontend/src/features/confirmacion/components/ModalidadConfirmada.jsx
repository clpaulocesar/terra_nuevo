import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

// Recuadro verde (envío) o dorado (retiro) con la modalidad elegida y el enlace para cambiarla.
export default function ModalidadConfirmada({ quiereEnvio, direccion, referencia, enlaceCambio }) {
  return (
    <div
      className={`-mt-2.5 mb-6 flex items-start gap-2.75 rounded-terra-chico border p-4 ${quiereEnvio
        ? 'border-terra-ok-borde bg-terra-ok-fondo/60'
        : 'border-terra-oro-borde bg-terra-oro-fondo'}`}
    >
      <Truck
        size={21}
        aria-hidden="true"
        className={`mt-0.5 flex-none ${quiereEnvio ? 'text-terra-ok' : 'text-terra-oro-texto'}`}
      />
      <div>
        <b className={`block text-sm ${quiereEnvio ? 'text-terra-ok' : 'text-terra-aviso-texto'}`}>
          {quiereEnvio ? 'Envío a domicilio' : 'Retiro en tienda'}
        </b>
        <span className="mt-1 block text-terra-sm text-terra-texto-suave">
          {quiereEnvio ? direccion : 'Pagas y retiras tu pedido en el mostrador de la tienda.'}
        </span>
        {quiereEnvio && referencia && (
          <small className="mt-1 block text-terra-xs text-terra-texto-suave">Referencia: {referencia}</small>
        )}
        <Link
          to={enlaceCambio}
          className="mt-2 inline-block text-terra-xs font-extrabold text-terra-acento"
        >
          {quiereEnvio ? 'Cambiar dirección o modalidad' : 'Cambiar a envío a domicilio'}
        </Link>
      </div>
    </div>
  );
}
