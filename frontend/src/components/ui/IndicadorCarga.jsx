// Rueda de carga con un texto debajo (carga del catálogo y de las rutas lazy).
export default function IndicadorCarga({ texto, ...resto }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16" {...resto}>
      <div
        aria-hidden="true"
        className="mx-auto mb-3 size-10 animate-terra-giro rounded-full border-3 border-terra-esqueleto
          border-t-terra-primario motion-reduce:animate-none dark:border-terra-borde dark:border-t-terra-primario"
      />
      <p className="m-0 text-base font-extrabold text-terra-texto">{texto}</p>
    </div>
  );
}
