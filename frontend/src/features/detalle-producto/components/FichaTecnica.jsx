import TituloConBarra from './TituloConBarra.jsx';

const CELDA = 'border-t border-terra-borde-suave p-2.5';
const ETIQUETA = `${CELDA} font-bold text-terra-texto-suave`;
const VALOR = `${CELDA} max-sm:pt-0`;

// Ficha técnica: etiqueta y valor en dos columnas desde 640 px; en teléfono, uno debajo del otro.
export default function FichaTecnica({ producto }) {
  return (
    <article className="rounded-terra-chico border border-terra-borde-suave bg-terra-superficie p-4.5 sm:p-6">
      <TituloConBarra>Ficha técnica y dimensiones</TituloConBarra>
      <dl className="text-terra-xs sm:grid sm:grid-cols-[36%_1fr]">
        {Boolean(producto.marca) && (
          <>
            <dt className={ETIQUETA}>Marca</dt>
            <dd className={VALOR}>{producto.marca}</dd>
          </>
        )}
        <dt className={ETIQUETA}>Modelo</dt>
        <dd className={VALOR}>{producto.nombre}</dd>
        <dt className={ETIQUETA}>Categoría</dt>
        <dd className={VALOR}>{producto.categoria}</dd>
        <dt className={ETIQUETA}>Medidas</dt>
        <dd className={VALOR}>{producto.medida || producto.detalle || 'Consultar medidas disponibles'}</dd>
        <dt className={ETIQUETA}>Disponibilidad</dt>
        <dd className={VALOR}>Entrega inmediata</dd>
        <dt className={ETIQUETA}>Garantía</dt>
        <dd className={VALOR}>
          Garantía oficial de:
          <b> GRUPO TERRA SRL.</b>
        </dd>
      </dl>
    </article>
  );
}
