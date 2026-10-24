import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { formatoMoneda } from '../../utils/formatoMoneda.js';

export default function ModalQrPago({
  abierto,
  onCerrar,
  monto,
  codigoPedido,
  beneficiario = 'TERRA · Sucursal Feria Barrio'
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

  const copiarGlosa = () => {
    if (!codigoPedido) return;
    navigator.clipboard?.writeText?.(codigoPedido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <QrCode size={20} />
            </span>
            <div>
              <h2 id="qr-modal-title" className="text-base font-bold text-stone-900 leading-tight">
                Pago por QR Simple
              </h2>
              <p className="text-xs text-stone-500 font-medium">Banca Móvil Interoperable</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar modal de pago QR"
          >
            <X size={20} />
          </button>
        </header>

        {/* Cuerpo */}
        <div className="p-6 flex flex-col items-center text-center space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Monto destacado */}
          {monto !== undefined && monto !== null && (
            <div className="w-full bg-rose-50/80 border border-rose-100 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Monto exacto a transferir</span>
              <span className="text-2xl font-black text-rose-950 mt-0.5">
                {formatoMoneda(Number(monto))}
              </span>
            </div>
          )}

          {/* Imagen del QR oficial */}
          <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-sm flex items-center justify-center">
            <img
              src="/images/QRPAGO.jpeg"
              alt="Código QR oficial de pago TERRA"
              className="w-56 h-auto object-contain rounded-xl select-none"
            />
          </div>

          {/* Código de pedido / Glosa para copiar */}
          {codigoPedido && (
            <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                  Coloca en la glosa / concepto
                </span>
                <strong className="text-sm font-mono font-bold text-stone-900 tracking-wide">
                  {codigoPedido}
                </strong>
              </div>
              <button
                type="button"
                onClick={copiarGlosa}
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

          {/* Instrucciones claras paso a paso */}
          <div className="w-full text-left bg-stone-50/60 rounded-xl p-3.5 border border-stone-100 space-y-2 text-xs text-stone-600">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <span>Abre tu aplicación bancaria (BCP, Unión, BNB, Mercantil, GanaMóvil, etc.).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <span>Escanea este código QR e ingresa el monto exacto.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <span>Presenta tu comprobante en caja o envíalo por WhatsApp para confirmar tu pedido.</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400">
            Cuenta oficial: <strong>{beneficiario}</strong>
          </p>
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
