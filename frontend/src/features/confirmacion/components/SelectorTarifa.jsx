import { formatoMoneda } from '../../../utils/formatoMoneda.js';

// Zona de entrega del mayorista: cada zona tiene su tarifa de envío.
export default function SelectorTarifa({ tarifas, zonaId, cargando, onElegir }) {
  return (
    <label className="my-4 grid gap-2">
      <span className="font-bold">Zona de entrega y tarifa</span>
      <select
        value={zonaId}
        onChange={(event) => onElegir(event.target.value)}
        disabled={cargando}
        className="min-h-11 rounded-lg border border-terra-borde bg-terra-superficie p-2 text-terra-texto"
      >
        <option value="">{cargando ? 'Cargando tarifas…' : 'Selecciona tu zona'}</option>
        {tarifas.map((tarifa) => (
          <option
            key={tarifa.id}
            value={tarifa.id}
          >
            {tarifa.nombre} — {formatoMoneda(tarifa.costo)}
          </option>
        ))}
      </select>
      <small className="text-terra-texto-suave">
        Bs. 50 aplica para sucursal central y Radial 10: 3 Pasos al Frente, Radial 10 y Av. Sudamericana.
      </small>
    </label>
  );
}
