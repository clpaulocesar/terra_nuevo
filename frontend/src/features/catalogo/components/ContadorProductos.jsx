// Chip con la cantidad de productos y la página actual.
export default function ContadorProductos({ texto }) {
  return (
    <div
      className="inline-flex w-full items-center justify-center gap-1.25 rounded-terra-chico border border-terra-borde
        bg-terra-superficie-2 px-3 py-1.5 text-terra-sm font-extrabold text-terra-texto shadow-terra-control
        sm:w-auto sm:gap-1.5 sm:rounded-full sm:bg-terra-superficie sm:px-3.5 dark:bg-terra-superficie
        dark:shadow-none"
    >
      <span className="size-1.75 rounded-full bg-terra-primario sm:size-2" />
      <span>{texto}</span>
    </div>
  );
}
