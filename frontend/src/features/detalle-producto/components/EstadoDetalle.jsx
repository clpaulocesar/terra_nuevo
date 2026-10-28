// Caja centrada para "Cargando producto…" y para el producto que no está disponible.
export default function EstadoDetalle({ children }) {
  return (
    <div
      className="mx-auto my-12.5 rounded-terra-boton border border-terra-borde-suave bg-terra-superficie p-12 text-center
        text-terra-texto"
    >
      {children}
    </div>
  );
}
