import TarjetaProducto from './TarjetaProducto.jsx';
import ResumenPedidoMayorista from './ResumenPedidoMayorista.jsx';

// Grilla de tarjetas: 1 columna en teléfono, 2 desde 640 px y 3 desde 768 px. El
// mayorista suma la columna con el resumen del pedido desde 1024 px.
// terra-grid: gancho de accesibilidad.css (una columna en el modo accesible).
export default function GrillaProductos({
  productos, esMayorista, agregados, ventasMaximas, cantidadesMayorista, items, cantidadTotal, subtotal,
  onCambiarCantidad, onAgregar, onQuitar, onClickTarjeta, onTeclaTarjeta, onAbrirDetalle, stateTarjeta,
}) {
  const columnas = esMayorista
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 min-[84.375rem]:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  const grilla = (
    <div className={`terra-grid grid gap-3 md:gap-5 lg:gap-6 ${columnas}`}>
      {productos.map((producto, indice) => (
        <TarjetaProducto
          key={producto.id}
          producto={producto}
          indice={indice}
          esMayorista={esMayorista}
          stateTarjeta={stateTarjeta}
          recienAgregado={Boolean(agregados[producto.id])}
          esMasVendido={ventasMaximas > 0 && Number(producto.ventas || 0) === ventasMaximas}
          cantidadElegida={cantidadesMayorista[producto.id]}
          onCambiarCantidad={onCambiarCantidad}
          onAgregar={onAgregar}
          onClick={onClickTarjeta}
          onKeyDown={onTeclaTarjeta}
          onAbrirDetalle={onAbrirDetalle}
        />
      ))}
    </div>
  );
  if (!esMayorista) return grilla;
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {grilla}
      <ResumenPedidoMayorista items={items} cantidadTotal={cantidadTotal} subtotal={subtotal} onQuitar={onQuitar} />
    </div>
  );
}
