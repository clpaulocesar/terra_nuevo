import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDetalleProducto } from './hooks/useDetalleProducto.js';
import { useColoresProducto } from './hooks/useColoresProducto.js';
import { useCompraProducto } from './hooks/useCompraProducto.js';
import EstadoDetalle from './components/EstadoDetalle.jsx';
import NavegacionDetalle from './components/NavegacionDetalle.jsx';
import GaleriaProducto from './components/GaleriaProducto.jsx';
import PanelCompra from './components/PanelCompra.jsx';
import DestacadosProducto from './components/DestacadosProducto.jsx';
import DescripcionCompleta from './components/DescripcionCompleta.jsx';
import FichaTecnica from './components/FichaTecnica.jsx';
import AvisoShowroom from './components/AvisoShowroom.jsx';
import ProductosRelacionados from './components/ProductosRelacionados.jsx';

// Ficha del producto: galería y compra (y abajo ficha técnica y showroom) en dos
// columnas cuando su contenedor mide 45 rem o más: desde ~930 px con texto normal,
// nunca con texto al 150 % en la tablet. Desde 768 px
// reserva a cada lado el ancho de los flotantes y del botón de accesibilidad, para
// que no tapen "Agregar al carrito" en la tablet del kiosco.
// product-detail y product-detail__card: ganchos de accesibilidad.css (fuente legible y borde en alto contraste).
export default function DetalleProductoPage() {
  const { id } = useParams();
  const { producto, relacionados, cargando, error } = useDetalleProducto(id);
  const { colores, color, setColor } = useColoresProducto(producto);
  const compra = useCompraProducto(producto, color);
  // Se guarda el id del producto con la descripción abierta: al abrir otro queda cerrada.
  const [descripcionAbiertaDe, setDescripcionAbiertaDe] = useState(null);
  const descripcionAbierta = descripcionAbiertaDe === id;

  const irADescripcion = () => {
    setDescripcionAbiertaDe(id);
    setTimeout(() => {
      document.getElementById('descripcion-completa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  if (cargando) {
    return (
      <EstadoDetalle>
        <p>Cargando producto…</p>
      </EstadoDetalle>
    );
  }
  if (error || !producto || producto.activo === false || producto.visible === false) {
    return (
      <EstadoDetalle>
        <p>{error || 'Este producto no se encuentra disponible actualmente.'}</p>
        <Link to="/catalogo" className="font-extrabold text-terra-acento">Volver al catálogo</Link>
      </EstadoDetalle>
    );
  }

  return (
    <div
      className="product-detail @container mx-auto max-w-240 text-terra-texto
        md:max-w-[min(60rem,calc(100vw-2*max(var(--terra-a11y-reserva),var(--terra-flotantes-reserva))))]"
      data-pagina="detalle"
    >
      <NavegacionDetalle nombre={producto.nombre} />
      <section
        className="product-detail__card @container rounded-terra border border-terra-borde-suave bg-terra-superficie p-4
          sm:p-5 md:p-5.5"
      >
        <div className="grid grid-cols-1 gap-6.5 @terra-ficha:grid-cols-2 @terra-ficha:gap-7">
          <GaleriaProducto
            producto={producto}
            colores={colores}
            color={color}
            onElegirColor={setColor}
          />
          <PanelCompra
            producto={producto}
            compra={compra}
            onVerDescripcion={irADescripcion}
          />
        </div>
        <DestacadosProducto />
      </section>
      <DescripcionCompleta
        descripcion={producto.descripcion}
        abierta={descripcionAbierta}
        onAlternar={() => setDescripcionAbiertaDe(descripcionAbierta ? null : id)}
      />
      <section className="my-7 grid grid-cols-1 gap-6 @terra-ficha:grid-cols-[1.8fr_0.85fr]">
        <FichaTecnica producto={producto} />
        <AvisoShowroom />
      </section>
      <ProductosRelacionados productos={relacionados} />
    </div>
  );
}
