import { useContext, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito.js';
import { SesionClienteContext } from '../../context/SesionClienteContext.jsx';
import AvisoPagoMostrador from '../compra/components/AvisoPagoMostrador.jsx';
import { useImportacionQr } from './hooks/useImportacionQr.js';
import EstadoCarrito from './components/EstadoCarrito.jsx';
import EncabezadoCarrito from './components/EncabezadoCarrito.jsx';
import EntregaMayorista from './components/EntregaMayorista.jsx';
import ListaArticulos from './components/ListaArticulos.jsx';
import ResumenCarrito from './components/ResumenCarrito.jsx';

const ERRORES_QR = {
  vacio: 'No encontramos productos escaneados. Vuelve a escanear los códigos QR y agrégalos antes de confirmar.',
  almacenamiento: 'No se pudo recuperar la compra QR. Habilita el almacenamiento del sitio y vuelve a intentarlo.',
};

// cart-page: gancho de la variante en-carrito (oculta los flotantes) y de accesibilidad.css.
// Desde 768 px deja libre a cada lado el ancho del botón de accesibilidad y de los flotantes.
export default function CarritoPage() {
  const {
    items,
    subtotal,
    cantidadTotal,
    actualizarCantidad,
    quitarProducto,
    vaciarCarrito,
    importarProductosQr,
    entregaDomicilio,
    setEntregaDomicilio,
  } = useCarrito();
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const { confirmarQr, errorQr } = useImportacionQr(importarProductosQr);
  const tieneDireccionEntrega = Boolean(sesion?.direccion?.trim());

  // Si el mayorista elige envío y luego borra su dirección del perfil, el
  // carrito no debe quedar apuntando a una entrega sin dirección.
  useEffect(() => {
    if (!tieneDireccionEntrega) setEntregaDomicilio(false);
  }, [tieneDireccionEntrega, setEntregaDomicilio]);

  if (confirmarQr) {
    return (
      <EstadoCarrito
        titulo="Preparando tu compra"
        mensaje="Estamos reuniendo los productos que agregaste al escanear los códigos QR."
      />
    );
  }

  if (!items.length) {
    const mensajeError = errorQr && Object.hasOwn(ERRORES_QR, errorQr) ? ERRORES_QR[errorQr] : '';
    return (
      <EstadoCarrito
        titulo={mensajeError ? 'No se pudo confirmar la compra QR' : 'Tu carrito está vacío'}
        mensaje={mensajeError || 'Explora el catálogo y elige los productos que más te gusten.'}
        esAlerta={Boolean(mensajeError)}
        enlace={mensajeError
          ? { to: '/catalogo?abrirQr=1', texto: 'Volver a escanear' }
          : { to: '/catalogo', texto: 'Explorar productos' }}
      />
    );
  }

  return (
    <section className="cart-page mx-auto md:max-w-terra-sin-flotantes">
      <EncabezadoCarrito />
      {esMayorista && (
        <EntregaMayorista
          sesion={sesion}
          entregaDomicilio={entregaDomicilio}
          onCambiarEntrega={setEntregaDomicilio}
        />
      )}
      {!esMayorista && (
        <AvisoPagoMostrador
          icono={ShoppingBag}
          titulo="Pago en mostrador presencial"
        >
          Tu pedido se generará para pagar en caja. No se realizará ningún cobro en este terminal de autoservicio.
        </AvisoPagoMostrador>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] con-resumen-fijo:gap-0">
        <ListaArticulos
          items={items}
          cantidadTotal={cantidadTotal}
          onCambiarCantidad={actualizarCantidad}
          onQuitar={quitarProducto}
          onVaciar={vaciarCarrito}
        />
        <ResumenCarrito
          subtotal={subtotal}
          destinoContinuar={esMayorista ? '/confirmacion' : '/identificacion'}
        />
      </div>
    </section>
  );
}
