import { Eye, Star } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import SelectorCantidad from './SelectorCantidad.jsx';
import AccionesCompra from './AccionesCompra.jsx';
import DatosCompra from './DatosCompra.jsx';

const ESTRELLAS = [1, 2, 3, 4, 5];

// Columna de compra: marca, nombre, precio, resumen de la descripción, cantidad y botones.
// product-buy: gancho de accesibilidad.css (el nombre se corta en cualquier punto con texto grande).
export default function PanelCompra({ producto, compra, onVerDescripcion }) {
  const disponible = Number(producto.stock) > 0;
  return (
    <section className="product-buy">
      {Boolean(producto.marca) && (
        <span className="mb-1 block text-xs font-bold tracking-wider text-terra-texto-suave uppercase">
          {producto.marca}
        </span>
      )}
      <h1 className="mb-2.25 text-[clamp(1.7rem,2.7vw,2.5rem)] leading-[1.08] tracking-[-0.04em]">{producto.nombre}</h1>
      <div className="mb-4.5 flex items-center gap-2.25">
        <span className="flex text-terra-estrella">
          {ESTRELLAS.map((n) => (
            <Star size={15} fill="currentColor" key={n} />
          ))}
        </span>
        <small className="text-terra-2xs text-terra-texto-suave">Producto recomendado TERRA</small>
      </div>
      <div className="border-b border-terra-borde-suave pb-4">
        <strong className="block text-[2rem]">{formatoMoneda(producto.precio)}</strong>
        <small className="text-terra-2xs font-bold text-terra-ok">
          {disponible ? 'Disponible para entrega inmediata' : 'Consultar disponibilidad'}
        </small>
      </div>
      <div className="mt-3.5 mb-1">
        <p className="line-clamp-3 text-terra-xs leading-normal text-terra-texto-suave">{producto.descripcion}</p>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.25 border-0 bg-transparent py-1.5 text-terra-xs
            font-extrabold text-terra-acento"
          onClick={onVerDescripcion}
        >
          <Eye size={15} />
          Ver descripción completa
        </button>
      </div>
      <SelectorCantidad
        cantidad={compra.cantidad}
        maximo={Number(producto.stock)}
        onDisminuir={compra.disminuir}
        onAumentar={compra.aumentar}
      />
      <AccionesCompra
        disponible={disponible}
        agregado={compra.agregado}
        onAgregar={compra.agregar}
        onComprarAhora={compra.comprarAhora}
      />
      <DatosCompra producto={producto} />
    </section>
  );
}
