import { Banknote, CreditCard } from 'lucide-react';

const MEDIOS = [
  { id: 'efectivo', etiqueta: 'Efectivo', icono: Banknote },
  { id: 'qr', etiqueta: 'QR/Transfer.', icono: CreditCard },
];

// Medio con el que el cliente piensa pagar en caja (se guarda en el pedido).
export default function MediosPago({ metodo, onElegir, className = '' }) {
  return (
    <section
      className={`mt-4 mb-3 ${className}`}
      aria-labelledby="confirm-payment-title"
    >
      <span
        id="confirm-payment-title"
        className="mb-1.5 block text-terra-2xs font-extrabold"
      >
        Medios de pago
      </span>
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="Seleccioná un medio de pago"
      >
        {MEDIOS.map(({ id, etiqueta, icono: Icono }) => {
          const elegido = metodo === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => onElegir(id)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border px-2 py-1
                transition-colors duration-150 motion-reduce:transition-none ${elegido
                  ? 'border-terra-primario bg-terra-primario text-terra-sobre-primario'
                  : 'border-terra-borde-suave bg-terra-superficie text-terra-texto hover:border-terra-primario'}`}
            >
              <span
                className={`flex size-5 flex-none items-center justify-center rounded-xs ${elegido
                  ? 'bg-terra-sobre-primario text-terra-primario'
                  : 'bg-terra-primario text-terra-sobre-primario'}`}
              >
                <Icono size={15} />
              </span>
              <b className="text-terra-xs leading-none font-bold whitespace-nowrap">{etiqueta}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
