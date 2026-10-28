import { useState } from 'react';
import { LOGO_TERRA, SUCURSALES_DATA } from '../data/sucursalesData.js';
import { useVoz } from '../context/VozContext.jsx';

export default function Header({
  sucursalActiva,
  setSucursalActiva,
  onCambiarSucursalClick,
  paginaActual,
  onNavegar,
  totalArticulos,
  onAbrirCarrito,
  onToggleAccesibilidad,
  modoOscuro,
  temporada,
  festivoActual = 'halloween',
  onToggleModoOscuro,
  busqueda,
  setBusqueda,
  onEjecutarBusqueda,
  onAbrirMiCuenta,
}) {
  const [dropdownSucursales, setDropdownSucursales] = useState(false);
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);
  const {
    vozActiva,
    alternarVoz,
    escuchando,
    iniciarEscucha,
    detenerEscucha,
    textoEscuchado,
    setModalTutorialAbierto,
  } = useVoz();
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(30,20,15,0.06)]">
      <div className="w-full flex flex-col justify-between">
        {/* Top Info Bar */}
        <div className="min-h-[34px] sm:h-10 py-1 sm:py-0 bg-surface-container-high px-2 sm:px-margin flex items-center justify-between font-label-subtle text-label-subtle text-[11px] sm:text-[12px] overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-space-sm truncate">
            <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-primary shrink-0">storefront</span>
            <span className="text-on-surface font-semibold truncate">Red Sucursales SCZ:</span>
            <span className="text-on-surface-variant hidden lg:inline truncate">
              Central (Barrio Lindo) · Norte (Alemana / 2 de Agosto) · Sur (Radial 10)
            </span>
            <button
              type="button"
              className="ml-1 text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
              onClick={onCambiarSucursalClick}
            >
              <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>Ver horarios
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
            <a className="hidden md:flex items-center gap-1 text-on-surface-variant hover:text-on-surface" href="tel:+59133445500">
              <span className="material-symbols-outlined text-[15px] text-tertiary">call</span>
              <span>(3) 344-5500</span>
            </a>
            <a
              className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface"
              href="https://wa.me/59133445500"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">chat</span>
              <span className="hidden sm:inline">WhatsApp Showroom</span>
            </a>
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container hover:bg-surface-container-highest hover:text-on-surface flex items-center justify-center cursor-pointer shrink-0"
              title="Modo Accesibilidad / Kiosco"
              onClick={onToggleAccesibilidad}
              aria-label="Modo accesibilidad"
            >
              <span className="material-symbols-outlined text-[14px]">accessibility_new</span>
            </button>
          </div>
        </div>

        {/* Main Bar: Logo, Active Branch Pill, Search, Actions */}
        <div className="h-16 sm:h-20 px-2 sm:px-margin flex items-center justify-between gap-1 sm:gap-space-lg">
          <div className="flex items-center gap-1.5 sm:gap-space-lg shrink-0 min-w-0">
            <button
              type="button"
              className="flex select-none cursor-pointer bg-transparent border-0 p-0 text-left shrink-0 min-w-[70px] sm:min-w-[100px]"
              onClick={() => onNavegar('inicio')}
              title="Ir a Inicio"
            >
              <img
                alt="TERRA Muebles &amp; Colchones"
                className="h-8 sm:h-12 w-auto object-contain shrink-0 max-w-[85px] sm:max-w-none"
                src={LOGO_TERRA}
              />
            </button>

            <div className="relative shrink-0">
              <button
                type="button"
                className="flex items-center gap-1 sm:gap-space-sm bg-surface-container-low hover:bg-surface-container hover:text-on-surface py-1 sm:py-2 px-1.5 sm:px-space-md rounded-full text-left transition-all cursor-pointer max-w-[100px] xs:max-w-[140px] sm:max-w-none"
                onClick={() => setDropdownSucursales((prev) => !prev)}
                title="Cambiar sucursal activa en Santa Cruz"
              >
                <span className="material-symbols-outlined text-primary text-[17px] sm:text-[20px] shrink-0">location_on</span>
                <div className="leading-tight truncate">
                  <p className="font-label-subtle text-label-subtle text-on-surface-variant text-[10px] hidden sm:block">Estás comprando en:</p>
                  <p className="font-label-interactive text-label-interactive text-on-surface text-[11px] sm:text-[13px] flex items-center gap-0.5 sm:gap-1 truncate">
                    <span className="truncate">{sucursalActiva.nombre}</span>
                    <span className="text-primary text-[11px] font-normal hidden sm:inline">(Cambiar)</span>
                    <span className="material-symbols-outlined text-[13px] sm:text-[16px] text-on-surface-variant shrink-0">
                      {dropdownSucursales ? 'expand_less' : 'expand_more'}
                    </span>
                  </p>
                </div>
              </button>

              {dropdownSucursales && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-surface-container-high">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Seleccionar Sucursal
                    </span>
                    <span className="text-[11px] text-primary font-semibold">Stock en vivo</span>
                  </div>
                  <div className="space-y-1.5">
                    {SUCURSALES_DATA.map((s) => {
                      const esActiva = s.id === sucursalActiva.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                            esActiva
                              ? 'bg-primary/10 border border-primary/20 text-on-surface font-semibold'
                              : 'hover:bg-surface-container-low text-on-surface'
                          }`}
                          onClick={() => {
                            if (setSucursalActiva) setSucursalActiva(s);
                            setDropdownSucursales(false);
                          }}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] mt-0.5 ${
                              esActiva ? 'text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            {esActiva ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex-1 leading-tight">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-title-sm text-[14px] font-bold">{s.nombre}</span>
                              <span className="text-[11px] font-bold text-tertiary">{s.tag}</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{s.direccionCorta}</p>
                            <span className="text-[10px] text-primary font-medium block mt-1">
                              {s.stock}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-surface-container-high text-center">
                    <button
                      type="button"
                      className="text-[12px] text-primary hover:underline font-semibold flex items-center justify-center gap-1 w-full py-1 cursor-pointer"
                      onClick={() => {
                        setDropdownSucursales(false);
                        onCambiarSucursalClick();
                      }}
                    >
                      <span>Ver detalles de las 3 sucursales</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-xl mx-space-md hidden md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEjecutarBusqueda(busqueda);
              }}
              className="relative flex items-center"
            >
              <input
                className="w-full h-11 pl-11 pr-28 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Buscar sofás reclinables, colchones King, poltronas, mesas..."
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[20px]">search</span>
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={escuchando ? detenerEscucha : iniciarEscucha}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    escuchando
                      ? 'bg-red-600 text-white animate-pulse shadow-xs'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                  }`}
                  title={escuchando ? 'Escuchando tu voz... Clic para detener' : 'Búsqueda por voz'}
                  aria-label="Búsqueda por voz"
                >
                  <span className="material-symbols-outlined text-[19px]">mic</span>
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-on-primary rounded-full font-label-interactive text-label-interactive text-[13px] hover:bg-primary-container transition-all cursor-pointer"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>

          {/* Action Tools & Cart Button */}
          <div className="flex items-center gap-1 sm:gap-space-sm relative shrink-0">
            {/* Search Toggle Button on Mobile */}
            <button
              type="button"
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
              title="Buscar productos"
              aria-label="Buscar productos"
              onClick={() => setBusquedaMovilAbierta((v) => !v)}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            {/* Desktop Voice Controls */}
            <div className="hidden md:flex items-center gap-1 bg-surface-container-low p-1 rounded-full mr-space-xs">
              <button
                type="button"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  vozActiva
                    ? 'bg-primary text-on-primary shadow-sm hover:bg-primary-container'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
                title={vozActiva ? 'Audio / Voz Guía: Activada (Clic para apagar)' : 'Audio / Voz Guía: Desactivada (Clic para activar)'}
                aria-label={vozActiva ? 'Desactivar audio y voz guía' : 'Activar audio y voz guía'}
                aria-pressed={vozActiva}
                onClick={alternarVoz}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {vozActiva ? 'volume_up' : 'volume_off'}
                </span>
              </button>
              <button
                type="button"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  escuchando
                    ? 'bg-red-600 text-white animate-pulse shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                title={escuchando ? 'Escuchando tu voz... Clic para detener' : 'Búsqueda por Voz (Clic para dictar)'}
                aria-label="Búsqueda por voz"
                aria-pressed={escuchando}
                onClick={escuchando ? detenerEscucha : iniciarEscucha}
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                title="Tutorial Interactivo y Comandos de Voz"
                aria-label="Tutorial interactivo de sala"
                onClick={() => setModalTutorialAbierto(true)}
              >
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
              </button>
            </div>

            {/* THEME SWITCHER (MODO DÍA / HALLOWEEN) - VISIBLE ON ALL SCREENS */}
            <button
              type="button"
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer font-label-interactive text-[11px] sm:text-[12px] font-semibold border shrink-0 ${
                temporada === 'halloween'
                  ? 'bg-purple-950/60 border-amber-500/50 text-amber-400 shadow-sm'
                  : temporada === 'navidad'
                  ? 'bg-emerald-950/60 border-amber-400/50 text-amber-300 shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-high shadow-xs'
              }`}
              title={
                temporada !== 'normal'
                  ? `Modo Noche (${temporada === 'halloween' ? 'Halloween' : 'Festivo'}) activo. Clic para cambiar a Modo Día (Diseño normal).`
                  : `Modo Día activo. Clic para activar Modo Noche (${festivoActual === 'halloween' ? 'Halloween' : 'Festivo'}).`
              }
              onClick={onToggleModoOscuro}
              aria-label={
                temporada !== 'normal'
                  ? 'Cambiar a Modo Día normal'
                  : 'Cambiar a Modo Noche festivo'
              }
            >
              <span
                className={`material-symbols-outlined text-[16px] sm:text-[17px] shrink-0 ${
                  temporada === 'halloween'
                    ? 'text-amber-400'
                    : temporada === 'navidad'
                    ? 'text-amber-300'
                    : 'text-primary'
                }`}
              >
                {temporada === 'halloween'
                  ? 'dark_mode'
                  : temporada === 'navidad'
                  ? 'celebration'
                  : 'wb_sunny'}
              </span>
              <span className="hidden xs:inline">
                {temporada === 'halloween'
                  ? 'Halloween'
                  : temporada === 'navidad'
                  ? 'Navidad'
                  : 'Modo Día'}
              </span>
            </button>

            {/* Mi Cuenta Button */}
            <button
              type="button"
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer shrink-0"
              onClick={onAbrirMiCuenta}
              title="Mi Cuenta · Iniciar sesión o registrarse"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[15px] sm:text-[18px]">person</span>
              </div>
              <span className="font-label-interactive text-label-interactive text-on-surface hidden xl:inline">Mi Cuenta</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              className="relative flex items-center gap-1 sm:gap-2 bg-primary text-on-primary hover:bg-primary-container px-2.5 sm:px-space-md py-1.5 sm:py-2.5 rounded-full transition-all shadow-[0_4px_14px_-2px_rgba(179,19,41,0.35)] cursor-pointer shrink-0"
              onClick={onAbrirCarrito}
              title="Abrir Carrito"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_bag</span>
              <span className="font-label-interactive text-label-interactive hidden sm:inline">Carrito</span>
              <span
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-surface-container-lowest text-primary font-bold text-[10px] sm:text-[11px] flex items-center justify-center"
                id="header-cart-count"
              >
                {totalArticulos}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown Bar */}
        {busquedaMovilAbierta && (
          <div className="px-3 py-2 bg-surface-container-lowest border-t border-surface-container-high md:hidden animate-fadeIn">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEjecutarBusqueda(busqueda);
                setBusquedaMovilAbierta(false);
              }}
              className="relative flex items-center"
            >
              <input
                className="w-full h-10 pl-9 pr-20 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Buscar sofás, colchones, poltronas..."
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3 text-[18px]">search</span>
              <div className="absolute right-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={escuchando ? detenerEscucha : iniciarEscucha}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    escuchando ? 'bg-red-600 text-white animate-pulse' : 'text-on-surface-variant'
                  }`}
                  aria-label="Búsqueda por voz"
                >
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-primary text-on-primary rounded-full text-[12px] font-bold"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub Navigation Bar */}
        <div className="h-11 sm:h-14 px-2 sm:px-margin bg-surface-container-lowest flex items-center justify-between overflow-x-auto">
          <nav className="flex items-center gap-3 sm:gap-space-lg shrink-0 text-[12px] sm:text-[14px]">
            <button
              type="button"
              className={`font-label-interactive transition-colors py-1.5 sm:py-2 cursor-pointer ${
                paginaActual === 'inicio' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => onNavegar('inicio')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`font-label-interactive transition-colors py-1.5 sm:py-2 cursor-pointer ${
                paginaActual === 'catalogo' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => onNavegar('catalogo', 'todas')}
            >
              Catálogo Completo
            </button>
            <button
              type="button"
              className="font-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-1.5 sm:py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'sofas')}
            >
              Poltronas &amp; Sofás
            </button>
            <button
              type="button"
              className="font-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-1.5 sm:py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'colchones')}
            >
              Dormitorio &amp; Colchones
            </button>
            <button
              type="button"
              className="font-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-1.5 sm:py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'comedores')}
            >
              Comedores
            </button>
            <button
              type="button"
              className="font-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-1.5 sm:py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'almohadas')}
            >
              Accesorios &amp; Almohadas
            </button>
            <button
              type="button"
              className="font-label-interactive text-primary font-bold hover:text-primary transition-colors py-1.5 sm:py-2 flex items-center gap-1 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'ofertas')}
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">local_offer</span>Promociones
            </button>
          </nav>
          <div className="hidden lg:flex items-center gap-space-sm font-label-subtle text-label-subtle text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>Entrega express en 24h dentro de 4to Anillo SCZ</span>
          </div>
        </div>
      </div>

      {/* Floating Speech Recognition Feedback Banner */}
      {escuchando && (
        <div className="absolute top-[82px] left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-on-primary px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-outline-variant/40 pointer-events-auto max-w-[90vw]">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="text-body-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
            {textoEscuchado || 'Te escucho... Di un producto, "ofertas" o "ir al carrito"'}
          </span>
          <button
            type="button"
            onClick={detenerEscucha}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs cursor-pointer transition-colors shrink-0"
            title="Detener escucha"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
}
