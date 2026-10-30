import TarjetaProducto from './TarjetaProducto.jsx';
import ResumenPedidoMayorista from './ResumenPedidoMayorista.jsx';

// Grilla de tarjetas: entran tantas columnas como quepan con el ancho mínimo de la tarjeta
// (--spacing-terra-tarjeta-min, en rem), sin cortes por breakpoint. Con el texto al 150 % o
// con la columna del resumen mayorista (desde 1024 px) entran menos, solas.
const COLUMNAS = 'grid-cols-[repeat(auto-fill,minmax(min(100%,var(--spacing-terra-tarjeta-min)),1fr))]';

export default function GrillaProductos({
  productos, esMayorista, agregados, ventasMaximas, cantidadesMayorista, items, cantidadTotal, subtotal,
  onCambiarCantidad, onAgregar, onQuitar, onClickTarjeta, onTeclaTarjeta, onAbrirDetalle, stateTarjeta,
}) {
  const grilla = (
    <div className={`grid gap-3 md:gap-5 lg:gap-6 ${COLUMNAS}`}>
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
