// Píldora que indica si un producto va por envío a domicilio o se retira en tienda
// (Identificación, Confirmación y ticket del pedido).
const COLORES = {
  envio: 'border-terra-primario/20 bg-terra-primario-claro text-terra-acento',
  retiro: 'border-terra-borde-control bg-terra-control-hover text-terra-texto-control',
};

export default function InsigniaEntrega({ envio, children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.25 py-0.75 text-terra-2xs
        leading-tight font-extrabold ${envio ? COLORES.envio : COLORES.retiro}`}
    >
      {children}
    </span>
  );
}
