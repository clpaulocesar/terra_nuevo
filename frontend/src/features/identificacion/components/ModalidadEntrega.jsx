import { Store, Truck } from 'lucide-react';
import BotonModalidad from './BotonModalidad.jsx';

// Pregunta "¿Deseás envío a domicilio?" con sus dos opciones. Los campos del envío
// llegan como children y se muestran solo con el envío elegido.
export default function ModalidadEntrega({ entregaDomicilio, onElegirRetiro, onElegirEnvio, children }) {
  return (
    <section
      className="my-5 border-t border-dashed border-terra-borde pt-4.5"
      aria-labelledby="ident-delivery-title"
    >
      <span
        id="ident-delivery-title"
        className="mb-2.5 flex items-center gap-2 text-terra-md font-extrabold text-terra-texto"
      >
        <Truck
          size={18}
          aria-hidden="true"
          className="text-terra-acento"
        />
        ¿Deseás envío a domicilio?
      </span>
      <div
        className="mb-3 grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Modalidad de entrega"
      >
        <BotonModalidad
          icono={Store}
          titulo="No, retiro en tienda"
          detalle="Pagás y retirás en mostrador"
          elegido={!entregaDomicilio}
          onElegir={onElegirRetiro}
        />
        <BotonModalidad
          icono={Truck}
          titulo="Sí, envío a domicilio"
          detalle="Despacho directo a tu puerta"
          elegido={entregaDomicilio}
          onElegir={onElegirEnvio}
        />
      </div>
      {entregaDomicilio && (
        <div
          className="mt-2 grid grid-cols-1 gap-4 rounded-terra-campo border border-terra-borde bg-terra-superficie-2
            p-4"
        >
          {children}
        </div>
      )}
    </section>
  );
}
