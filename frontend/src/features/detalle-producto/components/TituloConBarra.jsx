// Título de las cajas de abajo, con una barra vino a la izquierda.
export default function TituloConBarra({ children }) {
  return (
    <h2
      className="mb-4.25 text-base before:mr-2 before:inline-block before:h-5 before:w-1 before:rounded-sm
        before:bg-terra-primario before:align-middle before:content-['']"
    >
      {children}
    </h2>
  );
}
