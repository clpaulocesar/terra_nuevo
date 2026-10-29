import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import TarjetaRelacionado from './TarjetaRelacionado.jsx';

// product-related: gancho de accesibilidad.css (grilla flexible con texto grande y
// foto fuera del fondo negro en alto contraste).
export default function ProductosRelacionados({ productos }) {
  if (!productos.length) return null;
  return (
    <section className="product-related my-12">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-terra-xl">Otros modelos que te pueden interesar</h2>
        <Link
          to="/catalogo"
          className="flex shrink-0 items-center text-terra-2xs font-extrabold whitespace-nowrap text-terra-acento no-underline"
        >
          Ver catálogo
          <ChevronRight size={16} />
        </Link>
      </header>
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 md:grid-cols-3">
        {productos.map((item) => (
          <TarjetaRelacionado producto={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
