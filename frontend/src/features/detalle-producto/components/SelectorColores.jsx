import { useState } from 'react';

const ANILLO_ACTIVO = 'scale-105 ring-1 ring-terra-primario ring-offset-2 ring-offset-terra-superficie';

// Muestras de color sobre el borde derecho de la foto: las 4 primeras a la vista y
// el resto en un cuadro que se abre con "+". El color de cada muestra es dinámico.
export default function SelectorColores({ colores, color, onElegir }) {
  const [cuadrosAbiertos, setCuadrosAbiertos] = useState(false);
  const visibles = colores.slice(0, 4);
  const restantes = colores.slice(4);
  const elegirDelCuadro = (opcion) => {
    onElegir(opcion);
    setCuadrosAbiertos(false);
  };

  return (
    <div
      className="absolute top-1/2 right-0 z-2 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-terra-campo border
        border-r-0 border-terra-borde-suave bg-terra-superficie/95 px-1.75 py-2.25 shadow-[-8px_0_18px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col items-center gap-1.5">
        {visibles.map((opcion, indice) => (
          <button
            type="button"
            title={opcion.nombre}
            aria-label={opcion.nombre}
            key={`${opcion.nombre}-${opcion.valor}-${indice}`}
            onClick={() => onElegir(opcion)}
            className={`size-4.25 cursor-pointer rounded-full border-0 p-0 ${color?.nombre === opcion.nombre ? ANILLO_ACTIVO : ''}`}
            style={{ backgroundColor: opcion.valor }}
          />
        ))}
        {restantes.length > 0 && (
          <button
            type="button"
            className="inline-flex size-4.25 cursor-pointer items-center justify-center rounded-full border border-dashed
              border-terra-primario bg-terra-superficie p-0 text-terra-3xs font-extrabold text-terra-primario
              dark:bg-terra-superficie-2"
            onClick={() => setCuadrosAbiertos((abierto) => !abierto)}
            aria-expanded={cuadrosAbiertos}
            title="Más colores"
            aria-label="Más colores"
          >
            +
          </button>
        )}
      </div>
      {cuadrosAbiertos && restantes.length > 0 && (
        <div
          className="absolute top-1/2 right-full mr-1.75 grid -translate-y-1/2 grid-cols-3 gap-1.25 rounded-lg border
            border-terra-borde-suave bg-terra-superficie/95 p-1.75 shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
        >
          {restantes.map((opcion, indice) => (
            <button
              type="button"
              title={opcion.nombre}
              aria-label={opcion.nombre}
              key={`${opcion.nombre}-${opcion.valor}-${indice}`}
              onClick={() => elegirDelCuadro(opcion)}
              className={`size-5.5 cursor-pointer rounded-md border border-terra-borde-suave p-0
                ${color?.nombre === opcion.nombre ? ANILLO_ACTIVO : ''}`}
              style={{ backgroundColor: opcion.valor }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
