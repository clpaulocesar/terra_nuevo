import { Link } from 'react-router-dom';
import { ArrowRight, PackageOpen } from 'lucide-react';

// Carrito sin productos: vacío, importando la compra QR o con error al importarla.
// cart-page: gancho de la variante en-carrito (oculta los flotantes) y de accesibilidad.css.
export default function EstadoCarrito({ titulo, mensaje, esAlerta = false, enlace }) {
  return (
    <section
      className="cart-page flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 py-8 text-center"
    >
      <div
        className="mx-auto mb-5 flex size-20 items-center justify-center rounded-terra-modal bg-terra-primario-claro
          text-terra-acento"
      >
        <PackageOpen
          aria-hidden="true"
          className="size-9"
        />
      </div>
      <h1 className="m-0 mb-2 text-3xl font-black tracking-terra-titulo">{titulo}</h1>
      <p
        className="mx-auto mb-7.5 max-w-115 text-base leading-normal text-terra-texto-suave"
        role={esAlerta ? 'alert' : undefined}
      >
        {mensaje}
      </p>
      {enlace && (
        <Link
          to={enlace.to}
          className="inline-flex items-center gap-2 rounded-terra-campo bg-terra-primario px-7 py-4 font-extrabold
            text-terra-sobre-primario shadow-terra-boton hover:bg-terra-primario-oscuro"
        >
          {enlace.texto}
          <ArrowRight size={18} />
        </Link>
      )}
    </section>
  );
}
