import { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { formatoMoneda } from '../../utils/formatoMoneda.js';

export default function ModalQrPago({
  abierto,
  onCerrar,
  monto,
  codigoPedido,
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const copiarCodigoPedido = () => {
    if (!codigoPedido) return;
    navigator.clipboard?.writeText?.(codigoPedido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <QrCode size={20} />
            </span>
            <div>
              <h2 id="qr-modal-title" className="text-base font-bold text-stone-900 leading-tight">
                Pago con QR dinámico
              </h2>
              <p className="text-xs text-stone-500 font-medium">Integración con Baneco pendiente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCerrar}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Cerrar modal de pago QR"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Cuerpo */}
        <div className="p-5 sm:p-6 flex flex-col items-center text-center space-y-4 max-h-[82vh] overflow-y-auto">
          {monto !== undefined && monto !== null && (
            <div className="w-full bg-rose-50/80 border border-rose-100 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Monto del pedido</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-950 mt-0.5">
                {formatoMoneda(Number(monto))}
              </span>
            </div>
          )}

          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-terra-borde bg-terra-superficie-2 p-6 text-center">
            <QrCode size={40} className="text-terra-texto-suave" aria-hidden="true" />
            <p className="m-0 text-sm font-semibold text-terra-texto" role="status" aria-live="polite">
              No hay un QR disponible. La integración con Baneco aún no está habilitada.
            </p>
            <p className="m-0 text-xs text-terra-texto-suave">
              No presentes códigos estáticos ni confirmes el cobro sin verificar la transacción en el banco.
            </p>
          </div>

          {/* Código de pedido para identificarlo en caja */}
          {codigoPedido && (
            <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                  Código de pedido
                </span>
                <strong className="text-sm font-mono font-bold text-stone-900 tracking-wide">
                  {codigoPedido}
                </strong>
              </div>
              <button
                type="button"
                onClick={copiarCodigoPedido}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors min-h-[44px]"
                aria-label="Copiar código de pedido"
              >
                {copiado ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-colors min-h-[44px]"
          >
            Entendido / Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
