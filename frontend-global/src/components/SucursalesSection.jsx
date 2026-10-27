import { useEffect, useState } from 'react';
import { MapPin, Store } from 'lucide-react';
import { SUCURSALES } from '../data/sucursales.js';
import { listarSucursales } from '../services/api.js';

export default function SucursalesSection() {
  const [sucursalActiva, setSucursalActiva] = useState(SUCURSALES[0]);
  const [sucursalesReales, setSucursalesReales] = useState([]);

  useEffect(() => {
    const controlador = new AbortController();
    listarSucursales(controlador.signal)
      .then(setSucursalesReales)
      .catch(() => {});
    return () => controlador.abort();
  }, []);

  const central = sucursalesReales.find((sucursal) => sucursal.nombre === 'TERRA Central');

  return (
    <section className="cliente-sucursales" id="sucursales" aria-labelledby="titulo-sucursales">
      <div className="cliente-contexto-sucursal">
        <div className="cliente-contexto-sucursal__actual">
          <span className="cliente-contexto-sucursal__icono" aria-hidden="true">
            <Store size={19} />
          </span>
          <div>
            <small>Sucursal de referencia</small>
            <strong>{sucursalActiva.nombre}</strong>
            <span>{sucursalActiva.direccion}</span>
          </div>
        </div>
        <div className="cliente-contexto-sucursal__selector" aria-label="Seleccionar sucursal de referencia">
          {SUCURSALES.map((sucursal) => {
            const activa = sucursal.nombre === sucursalActiva.nombre;

            return (
              <button
                key={sucursal.nombre}
                type="button"
                className={activa ? 'is-activa' : undefined}
                aria-pressed={activa}
                onClick={() => setSucursalActiva(sucursal)}
              >
                {sucursal.nombre.replace('Showroom ', '')}
              </button>
            );
          })}
        </div>
      </div>
      <div className="cliente-seccion__cabecera">
        <div>
          <span className="cliente-eyebrow">Red de sucursales</span>
          <h2 id="titulo-sucursales">Nuestras tiendas en Santa Cruz</h2>
          <p>
            Conoce nuestras sucursales. La disponibilidad por tienda se habilitará
            próximamente; por ahora el catálogo corresponde a TERRA Central.
          </p>
          {central && (
            <p className="cliente-sucursales__estado">
              Central tiene {central.productos_asignados.toLocaleString('es-BO')} productos asociados.
            </p>
          )}
        </div>
      </div>
      <div className="cliente-sucursales__grid">
        {SUCURSALES.map((sucursal) => (
          <article className={`cliente-sucursal${sucursal.nombre === sucursalActiva.nombre ? ' is-activa' : ''}`} key={sucursal.nombre}>
            <div className="cliente-sucursal__cabecera">
              <span className="cliente-sucursal__departamento">Santa Cruz</span>
              <span className="cliente-sucursal__tipo">{sucursal.detalle}</span>
            </div>
            <h3>{sucursal.nombre}</h3>
            <p className="cliente-sucursal__ciudad">Santa Cruz de la Sierra</p>
            <p className="cliente-sucursal__direccion">
              <MapPin size={17} aria-hidden="true" />
              <span>{sucursal.direccion}</span>
            </p>
            <div className="cliente-sucursal__acciones">
              <button type="button" onClick={() => setSucursalActiva(sucursal)}>
                {sucursal.nombre === sucursalActiva.nombre ? 'Sucursal seleccionada' : 'Ver sucursal'}
              </button>
              <span className="cliente-sucursal__proximamente">Disponibilidad próximamente</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
