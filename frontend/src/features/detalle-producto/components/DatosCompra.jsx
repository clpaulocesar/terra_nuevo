import { ShieldCheck, Star, Tag, Truck } from 'lucide-react';

const DATO = 'inline-flex items-center gap-1';
const ICONO = 'shrink-0 text-terra-primario';

// Garantía y envío; debajo, unidades vendidas (si es más vendido) y SKU.
export default function DatosCompra({ producto }) {
  return (
    <>
      <div
        className="mt-4 flex flex-col items-start gap-3 text-terra-2xs text-terra-texto-suave sm:flex-row
          sm:justify-between"
      >
        <span className={DATO}>
          <ShieldCheck size={15} className={ICONO} />
          Garantía oficial TERRA
        </span>
        <span className={DATO}>
          <Truck size={15} className={ICONO} />
          Envío seguro a Bolivia
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-terra-2xs text-terra-texto-suave">
        {producto.esMasVendido && (
          <span className={DATO}>
            <Star size={13} fill="currentColor" className={ICONO} />
            Más vendido: {producto.totalVendido} unidades vendidas
          </span>
        )}
        <span className={DATO}>
          <Tag size={13} className={ICONO} />
          SKU: {producto.sku}
        </span>
      </div>
    </>
  );
}
