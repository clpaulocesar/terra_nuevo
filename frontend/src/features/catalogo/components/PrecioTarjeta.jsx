import { formatoMoneda } from '../../../utils/formatoMoneda.js';

// Precio de la tarjeta. Mayorista: precio de lista tachado, precio por cantidad y
// ahorro. Cliente: precio anterior tachado (si hay), precio y etiqueta de oferta.
export default function PrecioTarjeta({ producto, esMayorista, precioMinorista, precioMayorista, ahorroMayorista }) {
  const tachado = 'text-terra-sm font-bold text-terra-texto-suave line-through';
  // terra-card__precio-actual y terra-card__oferta-tag: ganchos del modo de alto contraste.
  const actual = `terra-card__precio-actual text-terra-xl font-black tracking-[-0.02em] text-terra-primario
    sm:text-2xl`;
  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-x-2
        ${esMayorista ? 'max-sm:flex-wrap max-sm:items-start' : ''}`}
    >
      {esMayorista ? (
        <>
          <span className={tachado}>PVP: {formatoMoneda(precioMinorista)}</span>
          <span className={actual}>{formatoMoneda(precioMayorista)}</span>
          {ahorroMayorista > 0 && (
            <span
              className="rounded-md bg-terra-ok-fondo px-1.75 py-1 text-terra-2xs font-black whitespace-nowrap
                text-terra-ok"
            >
              -{ahorroMayorista}% Mayorista
            </span>
          )}
        </>
      ) : (
        <>
          {producto.precioOriginal && <span className={tachado}>{formatoMoneda(producto.precioOriginal)}</span>}
          <span className={actual}>{formatoMoneda(producto.precio)}</span>
          {producto.en_oferta && (
            <span
              className="terra-card__oferta-tag ml-2 inline-flex items-center rounded-full bg-terra-primario-claro px-2.25
                py-0.75 align-middle text-terra-2xs font-black tracking-[0.04em] text-terra-acento uppercase"
            >
              En oferta
            </span>
          )}
        </>
      )}
    </div>
  );
}
