import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import ModalQrPago from '../../components/ui/ModalQrPago.jsx';
import EnlaceVolver from '../../components/ui/EnlaceVolver.jsx';
import AvisoPagoMostrador from '../compra/components/AvisoPagoMostrador.jsx';
import { useConfirmacionPedido } from './hooks/useConfirmacionPedido.js';
import DetallePedido from './components/DetallePedido.jsx';
import ResumenConfirmacion from './components/ResumenConfirmacion.jsx';

// confirm-page: gancho de la fuente legible (accesibilidad.css).
// Desde 768 px la página deja libre a cada lado el ancho de los flotantes y del botón de
// accesibilidad, para que no tapen el medio de pago ni "Confirmar y generar pedido".
export default function ConfirmacionPage() {
  const pedido = useConfirmacionPedido();
  const [mostrarModalQr, setMostrarModalQr] = useState(false);
  const { cliente, sesion, esFlujoMayorista, quiereEnvio } = pedido;

  // Tiene prioridad sobre el carrito vacío luego de completar la compra.
  if (pedido.pedidoGenerado) return <Navigate to="/pedido" replace state={pedido.pedidoGenerado} />;
  if (!pedido.items.length) return <Navigate to="/carrito" replace />;

  const datos = esFlujoMayorista
    ? { nombre: sesion?.nombre || 'Cliente mayorista', telefono: sesion?.telefono, nit: sesion?.nit }
    : { nombre: cliente.nombre || 'Compra como invitado', telefono: cliente.telefono, nit: cliente.nit };
  const entrega = esFlujoMayorista
    ? { direccion: sesion?.direccion || 'Sin dirección registrada', referencia: sesion?.referencia }
    : { direccion: cliente.direccion, referencia: cliente.referencia };

  return (
    <section className="confirm-page mx-auto md:max-w-terra-sin-flotantes">
      <EnlaceVolver to={esFlujoMayorista ? '/mi-cuenta' : '/identificacion'}>
        {esFlujoMayorista ? 'Volver a mi perfil' : 'Volver a identificación'}
      </EnlaceVolver>
      <header className="my-6">
        <span className="text-xs font-extrabold text-terra-acento uppercase">Paso 3 de 3 · Confirmación</span>
        <h1 className="my-2 text-terra-titulo-movil sm:text-terra-titulo">Revisa y confirma tu pedido</h1>
        <p className="text-terra-texto-suave">
          {quiereEnvio
            ? 'Generamos el pedido para pagar en caja y coordinamos el envío a tu dirección.'
            : 'Generaremos un ticket para pagar en caja. No se cobra nada desde este terminal de autoservicio.'}
        </p>
      </header>
      <AvisoPagoMostrador
        icono={ReceiptText}
        titulo="Pago en mostrador presencial"
      >
        {quiereEnvio
          ? 'Presenta el código del pedido al cajero para efectuar el pago y coordinar el envío a domicilio.'
          : 'Presenta el código del pedido al cajero para efectuar el pago y coordinar la entrega.'}
      </AvisoPagoMostrador>
      {/* Datos y resumen en dos columnas solo con 48 rem o más de ancho: a 768 y 884 px (con
          la reserva de los flotantes) o con el texto al 150 %, van en una columna. */}
      <div className="@container mt-6">
        <div className="grid items-start gap-4 sm:gap-6 @3xl:grid-cols-[7fr_5fr]">
          <DetallePedido
            pedido={pedido}
            datos={datos}
            entrega={entrega}
          />
          <ResumenConfirmacion
            pedido={pedido}
            onAmpliarQr={() => setMostrarModalQr(true)}
          />
        </div>
      </div>
      <ModalQrPago
        abierto={mostrarModalQr}
        onCerrar={() => setMostrarModalQr(false)}
        monto={pedido.subtotal}
      />
    </section>
  );
}
