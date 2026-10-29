// Aviso dorado de Carrito y Confirmación: el pedido se paga en caja, no en el terminal.
export default function AvisoPagoMostrador({ icono: Icono, titulo, children }) {
  return (
    <div
      className="my-3 flex items-start gap-3.5 rounded-terra border border-terra-oro-borde bg-terra-oro-fondo px-4.5
        py-4 max-sm:gap-3 max-sm:px-4 max-sm:py-3"
    >
      <Icono
        size={24}
        aria-hidden="true"
        className="mt-0.5 flex-none text-terra-oro-texto"
      />
      <div>
        <b className="font-extrabold text-terra-aviso-texto">{titulo}</b>
        <p className="mt-0.5 mb-0 text-terra-md text-terra-aviso-texto/80">{children}</p>
      </div>
    </div>
  );
}
