import { Link } from 'react-router-dom';
import { Info, PackageOpen, Truck } from 'lucide-react';
import { TARJETA_COMPRA, TITULO_SECCION } from '../../compra/estilosCompra.js';
import OpcionEntrega from './OpcionEntrega.jsx';
import DireccionEntrega from './DireccionEntrega.jsx';

// Modalidad de entrega del cliente mayorista: retiro en tienda o envío a la dirección
// de su perfil (sin dirección registrada, el envío queda deshabilitado).
export default function EntregaMayorista({ sesion, entregaDomicilio, onCambiarEntrega }) {
  const tieneDireccion = Boolean(sesion?.direccion?.trim());
  return (
    <section
      className={`${TARJETA_COMPRA} my-3.5 p-3.5 sm:px-5 sm:py-4.5`}
      aria-labelledby="entrega-titulo"
    >
      <header className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2
            id="entrega-titulo"
            className={TITULO_SECCION}
          >
            ¿Cómo quieres recibir tu pedido?
          </h2>
          <p className="mt-1 mb-0 text-terra-sm text-terra-texto-suave">
            El envío a domicilio es opcional. Si prefieres, retira en tienda sin costo.
          </p>
        </div>
        <span
          className="shrink-0 self-start rounded-full bg-terra-primario-claro px-3 py-1.5 text-terra-2xs font-extrabold
            tracking-wider whitespace-nowrap text-terra-acento uppercase"
        >
          {entregaDomicilio ? 'Envío a domicilio' : 'Retiro en tienda'}
        </span>
      </header>
      <div
        className="grid gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-labelledby="entrega-titulo"
      >
        <OpcionEntrega
          icono={PackageOpen}
          titulo="Retiro en tienda"
          detalle="Pagas y retiras en el mostrador."
          elegida={!entregaDomicilio}
          onElegir={() => onCambiarEntrega(false)}
        />
        <OpcionEntrega
          icono={Truck}
          titulo="Envío a domicilio"
          detalle={tieneDireccion ? 'A la dirección de tu perfil mayorista.' : 'Necesitas registrar una dirección.'}
          elegida={entregaDomicilio}
          disabled={!tieneDireccion}
          onElegir={() => onCambiarEntrega(true)}
        />
      </div>
      {entregaDomicilio && tieneDireccion && (
        <DireccionEntrega
          direccion={sesion.direccion}
          referencia={sesion.referencia}
        />
      )}
      {!tieneDireccion && (
        <p className="mt-3 mb-0 flex items-center gap-1.5 text-terra-xs text-terra-aviso-texto/80">
          <Info
            size={16}
            aria-hidden="true"
            className="shrink-0"
          />
          <span>
            Para recibir a domicilio registra una dirección.{' '}
            <Link
              to="/mi-cuenta"
              className="font-extrabold text-terra-acento"
            >
              Registrar dirección
            </Link>
          </span>
        </p>
      )}
    </section>
  );
}
