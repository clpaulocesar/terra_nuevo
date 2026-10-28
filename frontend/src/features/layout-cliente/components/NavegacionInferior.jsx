import { NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart } from 'lucide-react';

const claseItem = ({ isActive }) => `group/item flex flex-col items-center justify-center gap-0.75 text-terra-2xs
  font-bold transition ${isActive ? 'text-terra-acento' : 'text-terra-texto-suave'}`;
const ICONO = 'transition group-aria-[current=page]/item:scale-110';

// Barra de navegación fija inferior en teléfono (< 640 px). Respeta la zona segura.
export default function NavegacionInferior({ cantidadCarrito }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-60 grid h-[calc(var(--terra-barra-inferior-alto)+env(safe-area-inset-bottom,0px))]
        grid-cols-3 border-t border-terra-borde-suave bg-terra-encabezado pb-[env(safe-area-inset-bottom,0px)]
        shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden"
      aria-label="Navegación móvil"
    >
      <NavLink to="/catalogo" className={claseItem}>
        <Package size={20} className={ICONO} />
        <span>Catálogo</span>
      </NavLink>
      <NavLink to="/carrito" className={claseItem} data-tour="carrito">
        <div className="relative inline-flex">
          <ShoppingCart size={20} className={ICONO} />
          {cantidadCarrito > 0 && (
            <span
              className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full
                bg-terra-primario px-0.75 text-[0.65rem] font-extrabold text-terra-sobre-primario"
            >
              {cantidadCarrito}
            </span>
          )}
        </div>
        <span>Carrito</span>
      </NavLink>
      <NavLink to="/" end className={claseItem}>
        <Home size={20} className={ICONO} />
        <span>Inicio</span>
      </NavLink>
    </nav>
  );
}
