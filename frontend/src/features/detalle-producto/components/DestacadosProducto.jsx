import { Check, ShieldCheck, Sparkles, Truck } from 'lucide-react';

const DESTACADOS = [
  { Icono: Sparkles, titulo: 'Confort superior', detalle: 'Materiales seleccionados' },
  { Icono: Check, titulo: 'Calidad garantizada', detalle: 'Respaldo TERRA' },
  { Icono: Truck, titulo: 'Despacho coordinado', detalle: 'Atención personalizada' },
  { Icono: ShieldCheck, titulo: 'Compra segura', detalle: 'Soporte en showroom' },
];

export default function DestacadosProducto() {
  return (
    <div className="mt-8.75 grid grid-cols-2 gap-3.75 border-t border-terra-borde-suave pt-6.75 md:grid-cols-4">
      {DESTACADOS.map(({ Icono, titulo, detalle }) => (
        <article className="text-center" key={titulo}>
          <Icono size={23} className="text-terra-primario" />
          <b className="mt-1.5 mb-0.75 block text-terra-2xs">{titulo}</b>
          <small className="block text-terra-3xs text-terra-texto-suave">{detalle}</small>
        </article>
      ))}
    </div>
  );
}
