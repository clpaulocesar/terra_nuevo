import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import InsigniaEntrega from '../../compra/components/InsigniaEntrega.jsx';
import { tipoEntregaTicket } from '../utils/ticketPedido.js';

export default function ItemTicket({ item, conEnvio }) {
  const esEnvio = tipoEntregaTicket(item) === 'home_delivery';
  const color = item.color?.nombre || item.color;
  return (
    <div
      className="flex items-center justify-between gap-2.5 border-b border-dotted border-terra-borde-suave py-1.5
        last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate text-terra-sm font-bold text-terra-texto">
          {item.nombre || item.product_name || 'Producto'}
        </span>
        <small className="block text-terra-2xs text-terra-texto-suave">
          {item.cantidad} × {formatoMoneda(item.precio || item.precioUnitario || 0)}
          {color ? ` · ${color}` : ''}
        </small>
      </div>
      {conEnvio && (
        <InsigniaEntrega envio={esEnvio}>{esEnvio ? '🚚 Envío' : '🛍️ Retiro'}</InsigniaEntrega>
      )}
    </div>
  );
}
