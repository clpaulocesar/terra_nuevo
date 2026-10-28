import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { describirCambioErp } from '../../utils/erpCambios.js';
import './AvisoErp.css';

// Estado de la verificación contra el ERP de TERRA dentro del modal de cobro:
// cargando, error con reintento, verificado sin cambios, o lista de ajustes con el total nuevo.
export default function AvisoErp({ verificando, aviso, listo, cambios = [], total, onReintentar }) {
  const hayCambios = cambios.length > 0;
  if (!verificando && !aviso && !listo && !hayCambios) return null;
  return (
    <section className="aviso-erp" aria-live="polite">
      {verificando && (
        <p className="aviso-erp__estado aviso-erp__estado--cargando">
          <RefreshCw size={15} className="aviso-erp__spin" aria-hidden="true" /> Verificando con TERRA…
        </p>
      )}
      {!verificando && aviso && (
        <p className="aviso-erp__estado aviso-erp__estado--error">
          <X size={15} aria-hidden="true" />
          <span>{aviso}</span>
          {onReintentar && (
            <button type="button" className="aviso-erp__reintentar" onClick={onReintentar}>
              Reintentar verificación
            </button>
          )}
        </p>
      )}
      {!verificando && !aviso && listo && !hayCambios && (
        <p className="aviso-erp__estado aviso-erp__estado--ok">
          <CheckCircle2 size={15} aria-hidden="true" /> Verificado con TERRA: precios y stock al día.
        </p>
      )}
      {hayCambios && (
        <div className="aviso-erp__cambios">
          <b>TERRA ajustó el pedido antes de cobrar:</b>
          <ul>
            {cambios.map((cambio, indice) => (
              <li key={cambio.itemId || `${cambio.productoId || 'item'}-${indice}`}>{describirCambioErp(cambio)}</li>
            ))}
          </ul>
          {total !== undefined && (
            <p className="aviso-erp__total">
              Nuevo total: <strong>{formatoMoneda(total)}</strong>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
