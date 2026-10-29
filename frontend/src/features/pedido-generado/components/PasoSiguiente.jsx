export default function PasoSiguiente({ numero, titulo, children }) {
  return (
    <div className="my-4.5 flex items-start gap-3">
      <i
        className="grid size-7 shrink-0 place-items-center rounded-full bg-terra-primario font-extrabold
          text-terra-sobre-primario not-italic"
      >
        {numero}
      </i>
      <p className="m-0">
        <b className="block">{titulo}</b>
        <span className="mt-1 block text-terra-sm text-terra-texto-suave">{children}</span>
      </p>
    </div>
  );
}
