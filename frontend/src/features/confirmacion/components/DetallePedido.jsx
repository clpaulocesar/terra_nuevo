import { TARJETA_COMPRA } from '../../compra/estilosCompra.js';
import DatosCliente from './DatosCliente.jsx';
import ModalidadConfirmada from './ModalidadConfirmada.jsx';
import SelectorTarifa from './SelectorTarifa.jsx';
import ArticuloConfirmado from './ArticuloConfirmado.jsx';

// Tarjeta "Datos del pedido": cliente, modalidad de entrega, zona del mayorista y productos.
// confirm-card: gancho del alto contraste (accesibilidad.css).
export default function DetallePedido({ pedido, datos, entrega }) {
  const { esFlujoMayorista, quiereEnvio } = pedido;
  return (
    <div className={`confirm-card ${TARJETA_COMPRA} min-w-0 p-6 con-resumen-fijo:p-4`}>
      <h2 className="m-0 mb-4">Datos del pedido</h2>
      <DatosCliente {...datos} />
      <ModalidadConfirmada
        quiereEnvio={quiereEnvio}
        {...entrega}
        enlaceCambio={esFlujoMayorista ? '/carrito' : '/identificacion'}
      />
      {esFlujoMayorista && quiereEnvio && (
        <SelectorTarifa
          tarifas={pedido.tarifasEnvio}
          zonaId={pedido.zonaEnvioId}
          cargando={pedido.cargandoTarifas}
          onElegir={pedido.elegirZona}
        />
      )}
      <h2 className="m-0 mb-4">Artículos seleccionados ({pedido.items.length})</h2>
      {pedido.items.map((item) => (
        <ArticuloConfirmado
          key={item.lineaId || item.id}
          item={item}
          tipoEntrega={pedido.tipoEntrega(item)}
          mostrarEntrega={quiereEnvio}
        />
      ))}
    </div>
  );
}
