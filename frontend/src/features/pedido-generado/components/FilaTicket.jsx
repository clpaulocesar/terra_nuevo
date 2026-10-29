// Dato del ticket: etiqueta a la izquierda y valor a la derecha (apilados en teléfono).
export default function FilaTicket({ etiqueta, children }) {
  return (
    <div className="my-3 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <span>{etiqueta}</span>
      <b className="wrap-anywhere text-terra-acento sm:text-right">{children}</b>
    </div>
  );
}
