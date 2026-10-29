import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import InsigniaEntrega from '../../compra/components/InsigniaEntrega.jsx';

export default function ArticuloConfirmado({ item, tipoEntrega, mostrarEntrega }) {
  const esEnvio = tipoEntrega === 'home_delivery';
  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-terra-chico border border-terra-borde bg-terra-superficie-2 p-4"
    >
      <span className="rounded-md bg-terra-primario-claro p-1.5 font-extrabold whitespace-nowrap text-terra-acento">
        {item.cantidad} ×
      </span>
      <div className="min-w-0 flex-1">
        <b>{item.nombre}</b>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <small className="block text-terra-texto-suave">
            {item.categoria || 'Producto'}{item.color?.nombre ? ` · ${item.color.nombre}` : ''}
          </small>
          {mostrarEntrega && (
            <InsigniaEntrega envio={esEnvio}>
              {esEnvio ? '🚚 Envío a domicilio' : '🛍️ Retiro en tienda (Llevado en mano)'}
            </InsigniaEntrega>
          )}
        </div>
      </div>
      <strong className="whitespace-nowrap">{formatoMoneda(item.precio * item.cantidad)}</strong>
    </div>
  );
}
