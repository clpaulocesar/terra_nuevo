export default function FloatingActions({
  totalArticulos,
  onAbrirQr,
  onAbrirCarrito,
  onToggleAsistente,
  onToggleAccesibilidad,
}) {
  return (
    <>
      {/* Floating Right Action Cluster */}
      <div className="fixed right-3 sm:right-6 bottom-3 sm:bottom-8 z-40 flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto">
        {/* QR Shortcut */}
        <button
          type="button"
          aria-label="Escanear QR"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-on-primary hover:bg-primary-container shadow-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          onClick={onAbrirQr}
          title="Escanear QR de Sesión"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">qr_code_2</span>
        </button>

        {/* Floating Cart Badge Button */}
        <button
          type="button"
          aria-label="Carrito de Compras"
          className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-on-primary hover:bg-primary-container shadow-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          onClick={onAbrirCarrito}
          title="Ver Carrito Rápido"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">shopping_cart</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-surface-container-lowest text-primary font-bold text-[10px] sm:text-[11px] flex items-center justify-center shadow">
            {totalArticulos}
          </span>
        </button>

        {/* Floating Virtual Assistant */}
        <button
          type="button"
          aria-label="Asistente Virtual"
          className="flex items-center gap-1.5 sm:gap-2 bg-primary text-on-primary hover:bg-primary-container px-3 sm:px-5 py-2 sm:py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
          onClick={onToggleAsistente}
        >
          <span className="material-symbols-outlined text-[19px] sm:text-[22px]">smart_toy</span>
          <span className="font-label-interactive text-label-interactive text-[12px] sm:text-[14px] font-bold">Asistente</span>
        </button>
      </div>

      {/* Floating Left Accessibility */}
      <div className="fixed left-3 sm:left-6 bottom-3 sm:bottom-8 z-40 pointer-events-auto">
        <button
          type="button"
          aria-label="Opciones de accesibilidad"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-inverse-surface text-on-primary hover:bg-on-background shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
          onClick={onToggleAccesibilidad}
          title="Menú de Accesibilidad y Modo Táctil"
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">accessible_forward</span>
        </button>
      </div>
    </>
  );
}
