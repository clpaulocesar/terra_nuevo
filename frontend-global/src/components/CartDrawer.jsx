function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CartDrawer({
  isOpen,
  onClose,
  sucursalActiva,
  cartItems = [],
  totalArticulos,
  subtotalProductos,
  descuentoAutoservicio,
  totalPagar,
  cambiarCantidad,
  eliminarItem,
  vaciarCarrito,
  procederPago,
  onCambiarSucursalClick,
  onVerCarritoCompleto,
}) {
  return (
    <div
      className={`fixed inset-0 z-[100] transition-visibility duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel lateral offcanvas */}
      <aside
        id="cart-drawer-panel"
        aria-labelledby="cart-drawer-title"
        aria-modal="true"
        className={`cart-drawer-panel absolute top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
      >
        {/* ========================================================= */}
        {/* HEADER DEL CARRITO (Se adapta a Halloween / Normal / Navidad) */}
        {/* ========================================================= */}
        <div className="cart-drawer-header bg-[#8b001a] text-white px-5 pt-5 pb-4 relative flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="cart-drawer-icon-box w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-white leading-tight" id="cart-drawer-title">
                  Tu carrito
                </h2>
                <p className="text-[13px] text-white/85 font-normal mt-0.5">
                  {totalArticulos} {totalArticulos === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar carrito"
              className="cart-drawer-close-btn w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Sucursal retiro Chip */}
          <div className="cart-drawer-branch-chip bg-black/15 backdrop-blur-sm px-3.5 py-2.5 rounded-xl flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-[17px] text-white">storefront</span>
              <span className="text-white/95 truncate">
                Sucursal retiro: <strong className="font-bold text-white">{sucursalActiva?.nombreCompleto || 'Sucursal Central (Barrio Lindo)'}</strong>
              </span>
            </div>
            <button
              type="button"
              className="cart-drawer-change-btn text-white font-semibold underline text-[12px] hover:text-white/80 transition-colors shrink-0 ml-2 cursor-pointer"
              onClick={() => {
                onClose();
                onCambiarSucursalClick();
              }}
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODALIDAD DE ENTREGA                                      */}
        {/* ========================================================= */}
        <div className="cart-drawer-delivery bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 shrink-0">
          <div className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              <span>Retiro en showroom ({sucursalActiva?.nombre || 'Central'})</span>
            </span>
            <span className="font-bold text-tertiary">Sin costo</span>
          </div>
          <div className="flex items-center justify-between text-[12px] mt-1.5 pt-1.5 border-t border-outline-variant/20">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-tertiary">local_shipping</span>
              <span>Despacho a domicilio en Santa Cruz</span>
            </span>
            <span className="font-semibold text-on-surface">Con comisión</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTENEDOR DE PRODUCTOS (SCROLLABLE)                      */}
        {/* ========================================================= */}
        <div className="cart-drawer-items flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-surface">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">remove_shopping_cart</span>
              <p className="font-bold text-on-surface text-[16px]">Tu carrito está vacío</p>
              <p className="text-[13px] mt-1 text-on-surface-variant">Explora nuestro showroom y añade productos para continuar.</p>
            </div>
          ) : (
            cartItems.map((it) => (
              <div
                key={it.id}
                className="cart-drawer-item-card bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex gap-3.5 relative"
              >
                {/* Thumbnail */}
                <div className="cart-drawer-item-img w-20 h-20 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center p-1 border border-outline-variant/30">
                  <img
                    alt={it.nombre}
                    className="w-full h-full object-contain"
                    src={it.src || it.imagen}
                  />
                </div>

                {/* Info & Controles */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="cart-drawer-item-category inline-block px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                        {it.categoria || 'ALMOHADA ORTOPÉDICA'}
                      </span>
                      <span className="cart-drawer-item-total text-[15px] font-bold text-on-surface shrink-0">
                        {formatBs(it.precio * it.cantidad)}
                      </span>
                    </div>
                    <h3 className="cart-drawer-item-title text-[15px] font-bold text-on-surface tracking-tight mt-1 truncate">
                      {it.nombre}
                    </h3>
                    <p className="cart-drawer-item-unit text-[13px] text-on-surface-variant mt-0.5">
                      {formatBs(it.precio)} c/u
                    </p>
                  </div>

                  {/* Quantity pill & Trash */}
                  <div className="flex items-center justify-between mt-3 pt-2">
                    <div className="cart-drawer-qty-pill inline-flex items-center bg-surface-container rounded-full px-2.5 py-1 gap-2.5 border border-outline-variant/30">
                      <button
                        type="button"
                        aria-label="Disminuir cantidad"
                        className="w-5 h-5 flex items-center justify-center text-on-surface hover:text-primary font-bold text-[15px] cursor-pointer"
                        onClick={() => cambiarCantidad(it.id, -1)}
                      >
                        -
                      </button>
                      <span className="w-4 text-center text-[13px] font-bold text-on-surface">
                        {it.cantidad}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        className="w-5 h-5 flex items-center justify-center text-on-surface hover:text-primary font-bold text-[15px] cursor-pointer"
                        onClick={() => cambiarCantidad(it.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label="Eliminar producto"
                      className="text-on-surface-variant hover:text-red-500 p-1 transition-colors cursor-pointer"
                      onClick={() => eliminarItem(it.id)}
                      title="Eliminar producto"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================= */}
        {/* RESUMEN FINANCIERO & BOTONES                              */}
        {/* ========================================================= */}
        <div className="cart-drawer-summary bg-surface-container-lowest px-5 pt-4 pb-4 border-t border-outline-variant/30 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] space-y-3.5">
          {/* Breakdown Lines */}
          <div className="space-y-1.5 text-[14px]">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Subtotal productos</span>
              <span className="font-semibold text-on-surface">{formatBs(subtotalProductos)}</span>
            </div>
            <div className="flex items-center justify-between text-primary">
              <span className="flex items-center gap-1">
                <span>Descuento autoservicio web/sala</span>
                <span className="material-symbols-outlined text-[15px] text-primary" title="Promoción Santa Cruz activa">
                  info
                </span>
              </span>
              <span className="font-semibold text-primary">-{formatBs(descuentoAutoservicio)}</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Retiro en showroom</span>
              <span className="font-bold text-tertiary">Sin costo</span>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
              <span>Envío a domicilio</span>
              <span className="font-medium text-on-surface-variant">Con comisión / flete</span>
            </div>
          </div>

          {/* Total Line */}
          <div className="cart-drawer-total-row pt-2 border-t border-outline-variant/20 flex items-baseline justify-between">
            <div>
              <span className="text-[20px] font-bold text-on-surface block leading-tight">Total</span>
              <span className="text-[12px] text-on-surface-variant">Incluye impuestos de ley (Factura SCZ)</span>
            </div>
            <div className="text-right">
              <span className="cart-drawer-total-price text-[26px] font-bold text-primary tracking-tight">{formatBs(totalPagar)}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              className="cart-drawer-pay-btn w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-[15px] hover:bg-primary-container transition-all duration-200 shadow-md flex items-center justify-center gap-2 group cursor-pointer"
              onClick={procederPago}
            >
              <span>Continuar compra / Pagar</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>

            <button
              type="button"
              className="cart-drawer-full-btn w-full py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => {
                onClose();
                if (onVerCarritoCompleto) {
                  onVerCarritoCompleto();
                }
              }}
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>Ver Carrito Completo</span>
            </button>

            <div className="text-center pt-0.5">
              <button
                type="button"
                className="cart-drawer-clear-btn text-[13px] text-stone-500 hover:text-primary underline transition-colors cursor-pointer"
                onClick={vaciarCarrito}
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* Bottom Trust Pillars */}
          <div className="cart-drawer-trust-pillars pt-3 border-t border-outline-variant/30 grid grid-cols-3 gap-2 text-center text-[11px] text-on-surface-variant">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[18px] text-primary mb-0.5">qr_code_2</span>
              <span>Pago Seguro QR</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[18px] text-primary mb-0.5">verified_user</span>
              <span>Garantía Oficial</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[18px] text-primary mb-0.5">bolt</span>
              <span>Retiro en Sala</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
