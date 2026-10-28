// Pie de página. Por debajo de 768 px reserva bajo el texto el alto de los
// flotantes y de la barra inferior: al final del scroll ningún botón tapa contenido.
// En el carrito no hay flotantes y solo se reserva la barra inferior.
// site-footer: gancho de la hoja de impresión de PedidoGenerado.css.
export default function PieCliente({ enCarrito }) {
  const reserva = enCarrito
    ? 'max-md:pb-terra-flotante-abajo'
    : 'max-md:pb-[calc(var(--terra-flotante-abajo)+var(--terra-flotantes-alto)+var(--terra-flotante-separacion))]';
  return (
    <footer
      className={`site-footer mt-auto border-t border-terra-borde-suave bg-terra-control-hover px-4 py-5 text-center
        text-terra-sm leading-normal text-terra-texto-suave dark:bg-terra-superficie ${reserva}`}
    >
      <div>TERRA AUTOSERVICIO · Sucursal Equipetrol, Santa Cruz</div>
      <small className="mt-1 block text-terra-2xs text-terra-texto-suave/80">
        Terminal táctil optimizado para celular, tablet y PC
      </small>
    </footer>
  );
}
