import { MapPin } from 'lucide-react';
import TituloConBarra from './TituloConBarra.jsx';

export default function AvisoShowroom() {
  return (
    <aside className="rounded-terra-chico border border-terra-borde-suave bg-terra-superficie-2 p-4.5 sm:p-6">
      <MapPin size={24} className="size-9 rounded-md bg-terra-primario-claro p-1.5 text-terra-acento" />
      <TituloConBarra>Pruébalo en nuestro showroom</TituloConBarra>
      <p className="text-terra-xs leading-normal text-terra-texto-suave">
        Visita nuestro espacio de descanso para conocer el producto y recibir asesoramiento.
      </p>
    </aside>
  );
}
