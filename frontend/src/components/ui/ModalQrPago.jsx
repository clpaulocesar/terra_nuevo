import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, ZoomIn, ZoomOut } from 'lucide-react';
import { formatoMoneda } from '../../utils/formatoMoneda.js';

export default function ModalQrPago({
  abierto,
  onCerrar,
  monto,
  codigoPedido,
  beneficiario = 'TERRA · Sucursal Feria Barrio'
}) {
  const [copiado, setCopiado] = useState(false);
  const [zoomMaximo, setZoomMaximo] = useState(false);

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

  const alternarZoom = () => setZoomMaximo((prev) => !prev);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className={`relative w-full ${zoomMaximo ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-200`}
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
                Código QR Oficial TERRA
              </h2>
              <p className="text-xs text-stone-500 font-medium">Banca Móvil de Bolivia · Todos los bancos</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={alternarZoom}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold"
              aria-label={zoomMaximo ? 'Reducir tamaño del QR' : 'Aumentar tamaño del QR'}
              title={zoomMaximo ? 'Reducir tamaño' : 'Aumentar tamaño'}
            >
              {zoomMaximo ? <ZoomOut size={17} /> : <ZoomIn size={17} />}
              <span className="hidden sm:inline">{zoomMaximo ? 'Normal' : 'Zoom +'}</span>
            </button>
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
          {/* Monto destacado */}
          {monto !== undefined && monto !== null && (
            <div className="w-full bg-rose-50/80 border border-rose-100 rounded-2xl p-3.5 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Monto exacto a transferir</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-950 mt-0.5">
                {formatoMoneda(Number(monto))}
              </span>
            </div>
          )}

          {/* Imagen del QR oficial con opción interactiva de zoom */}
          <div className="w-full relative p-3 sm:p-4 bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-sm flex flex-col items-center justify-center">
            <div
              className={`cursor-pointer overflow-hidden rounded-xl transition-transform duration-200 flex items-center justify-center ${zoomMaximo ? 'scale-102' : 'hover:scale-102'}`}
              onClick={alternarZoom}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarZoom(); } }}
              aria-label="Tocar para alternar zoom del código QR"
              title="Tocar para alternar zoom"
            >
              <img
                src="/images/QRPAGO.jpeg"
                alt="Código QR oficial de pago TERRA"
                className={`object-contain rounded-xl select-none transition-all duration-200 ${
                  zoomMaximo
                    ? 'w-80 sm:w-96 md:w-[440px] max-w-full'
                    : 'w-64 sm:w-72 md:w-80 max-w-full'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={alternarZoom}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors min-h-[44px]"
            >
              {zoomMaximo ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
              <span>{zoomMaximo ? 'Reducir tamaño' : 'Ampliar código QR (Zoom)'}</span>
            </button>
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
