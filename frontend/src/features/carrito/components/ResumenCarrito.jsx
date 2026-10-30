import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { useHojaInferior } from '../../../hooks/useHojaInferior.js';
import HojaInferior from '../../../components/ui/HojaInferior.jsx';
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA_COMPRA, TITULO_SECCION } from '../../compra/estilosCompra.js';
import TotalesCompra from '../../compra/components/TotalesCompra.jsx';

// Liquidación del carrito: columna fija al costado desde 1024 px y hoja inferior en
// teléfono. cart-confirm y cart-back: ganchos del alto contraste (accesibilidad.css).
export default function ResumenCarrito({ subtotal, destinoContinuar }) {
  const hoja = useHojaInferior();
  const ocultoCerrada = hoja.abierta ? '' : 'con-resumen-fijo:hidden';
  return (
    <HojaInferior
      hoja={hoja}
      etiquetaAbrir="Expandir resumen del pedido"
      etiquetaCerrar="Contraer resumen del pedido"
      className={`${TARJETA_COMPRA} p-5 lg:sticky lg:top-21`}
    >
      <h2 className={`${TITULO_SECCION} mb-4 ${ocultoCerrada}`}>Liquidación final</h2>
      <TotalesCompra
        subtotal={subtotal}
        total={subtotal}
        hojaCerrada={!hoja.abierta}
      />
      <Link
        className={`cart-confirm ${BOTON_PRINCIPAL} mt-4 con-resumen-fijo:mt-2`}
        to={destinoContinuar}
      >
        <PackageOpen size={23} />
        Continuar y generar pedido
      </Link>
      <Link
        className={`cart-back ${BOTON_SECUNDARIO} mt-2.5 ${ocultoCerrada}`}
        to="/catalogo"
      >
        Seguir comprando
      </Link>
      <small className={`mt-4 block text-center text-xs text-terra-texto-suave ${ocultoCerrada}`}>
        Terminal seguro · Ticket inmediato en caja
      </small>
    </HojaInferior>
  );
}
