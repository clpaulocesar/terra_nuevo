import ItemTicket from './ItemTicket.jsx';

// Productos del ticket. Con envío, cada uno indica si va a domicilio o se retira.
export default function ItemsTicket({ items, conEnvio }) {
  return (
    <div className="my-4 border-y border-dashed border-terra-borde-control py-3">
      <span className="mb-2.5 block text-xs font-extrabold tracking-wider text-terra-texto-suave uppercase">
        Detalle de productos ({items.length})
      </span>
      {items.map((item, indice) => (
        <ItemTicket
          key={item.id || indice}
          item={item}
          conEnvio={conEnvio}
        />
      ))}
    </div>
  );
}
