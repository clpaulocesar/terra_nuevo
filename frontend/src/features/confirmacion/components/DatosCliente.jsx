import { ShieldCheck } from 'lucide-react';

// Nombre, teléfono y NIT con los que se genera el pedido.
export default function DatosCliente({ nombre, telefono, nit }) {
  return (
    <div
      className="mb-6 flex items-center gap-2.75 rounded-terra-chico border border-terra-borde bg-terra-superficie-2
        p-4"
    >
      <ShieldCheck
        size={23}
        aria-hidden="true"
        className="shrink-0 text-terra-acento"
      />
      <div>
        <b>{nombre}</b>
        <span className="mt-1 block text-terra-sm text-terra-texto-suave">
          {telefono || 'Sin teléfono registrado'} {nit && `· NIT ${nit}`}
        </span>
      </div>
    </div>
  );
}
