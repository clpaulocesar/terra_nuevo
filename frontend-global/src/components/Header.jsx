import { useState } from 'react';
import { LOGO_TERRA, SUCURSALES_DATA } from '../data/sucursalesData.js';

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
  onToggleModoOscuro,
  busqueda,
  setBusqueda,
  onEjecutarBusqueda,
  onAbrirMiCuenta,
}) {
  const [dropdownSucursales, setDropdownSucursales] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(30,20,15,0.06)]">
      <div className="h-44 w-full flex flex-col justify-between">
        {/* Top Info Bar */}
        <div className="h-10 bg-surface-container-high px-margin flex items-center justify-between font-label-subtle text-label-subtle">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
            <span className="text-on-surface font-semibold">Red de Sucursales Santa Cruz:</span>
            <span className="text-on-surface-variant hidden md:inline">
              Central (Barrio Lindo) · Norte (Alemana / 2 de Agosto) · Sur (Radial 10)
            </span>
            <button
              type="button"
              className="ml-space-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              onClick={onCambiarSucursalClick}
            >
              <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>Ver horarios
            </button>
          </div>
          <div className="flex items-center gap-space-md">
            <a className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface" href="tel:+59133445500">
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
              <span>WhatsApp Showroom</span>
            </a>
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container hover:bg-surface-container-highest hover:text-on-surface flex items-center justify-center cursor-pointer"
              title="Modo Accesibilidad / Kiosco"
              onClick={onToggleAccesibilidad}
              aria-label="Modo accesibilidad"
            >
              <span className="material-symbols-outlined text-[14px]">accessibility_new</span>
            </button>
          </div>
        </div>

        {/* Main Bar: Logo, Active Branch Pill, Search, Actions */}
        <div className="h-20 px-margin flex items-center justify-between gap-space-lg">
          <div className="flex items-center gap-space-lg">
            <button
              type="button"
              className="flex flex-col select-none cursor-pointer bg-transparent border-0 p-0 text-left"
              onClick={() => onNavegar('inicio')}
              title="Ir a Inicio"
            >
              <img alt="TERRA Muebles &amp; Colchones" className="h-12 w-auto object-contain" src={LOGO_TERRA} />
            </button>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-space-sm bg-surface-container-low hover:bg-surface-container hover:text-on-surface py-2 px-space-md rounded-full text-left transition-all cursor-pointer"
                onClick={() => setDropdownSucursales((prev) => !prev)}
                title="Cambiar sucursal activa en Santa Cruz"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <div className="leading-tight">
                  <p className="font-label-subtle text-label-subtle text-on-surface-variant text-[11px]">Estás comprando en:</p>
                  <p className="font-label-interactive text-label-interactive text-on-surface flex items-center gap-1">
                    {sucursalActiva.nombre} <span className="text-primary text-[12px] font-normal">(Cambiar)</span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
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
                className="w-full h-11 pl-11 pr-24 rounded-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Buscar sofás reclinables, colchones King, poltronas, mesas..."
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[20px]">search</span>
              <button
                type="submit"
                className="absolute right-2 px-3 py-1 bg-primary text-on-primary rounded-full font-label-interactive text-label-interactive text-[13px] hover:bg-primary-container transition-all cursor-pointer"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Action Tools & Cart Button */}
          <div className="flex items-center gap-space-sm">
            <div className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-full mr-space-xs">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                title="Audio / Voz Guía"
                onClick={() => alert('Voz Guía activada')}
              >
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                title="Búsqueda por Voz"
                onClick={() => alert('Escuchando consulta de producto...')}
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                title="Tutorial Interactivo de Sala"
                onClick={() => alert('Iniciando tutorial interactivo de sala')}
              >
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
              </button>
              <button
                type="button"
                className={`h-9 px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 transition-all cursor-pointer font-label-interactive text-[12px] font-semibold border ${
                  modoOscuro
                    ? 'bg-surface-container-high border-outline-variant/60 text-amber-300 shadow-sm'
                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-high shadow-xs'
                }`}
                title={modoOscuro ? 'Cambiar a Modo Día (Normal)' : 'Cambiar a Modo Noche'}
                onClick={onToggleModoOscuro}
                aria-label={modoOscuro ? 'Cambiar a modo día normal' : 'Cambiar a modo noche'}
              >
                <span className={`material-symbols-outlined text-[17px] ${modoOscuro ? 'text-amber-300' : 'text-primary'}`}>
                  {modoOscuro ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="hidden sm:inline">
                  {modoOscuro ? 'Modo Día' : 'Modo Noche'}
                </span>
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              onClick={onAbrirMiCuenta}
              title="Mi Cuenta · Iniciar sesión o registrarse"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <span className="font-label-interactive text-label-interactive text-on-surface hidden sm:inline">Mi Cuenta</span>
            </button>

            <button
              type="button"
              className="relative flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2.5 rounded-full transition-all shadow-[0_4px_14px_-2px_rgba(179,19,41,0.35)] cursor-pointer"
              onClick={onAbrirCarrito}
              title="Abrir Carrito"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              <span className="font-label-interactive text-label-interactive hidden sm:inline">Carrito</span>
              <span
                className="w-5 h-5 rounded-full bg-surface-container-lowest text-primary font-bold text-[11px] flex items-center justify-center"
                id="header-cart-count"
              >
                {totalArticulos}
              </span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="h-14 px-margin bg-surface-container-lowest flex items-center justify-between overflow-x-auto">
          <nav className="flex items-center gap-space-lg shrink-0">
            <button
              type="button"
              className={`font-label-interactive text-label-interactive transition-colors py-2 cursor-pointer ${
                paginaActual === 'inicio' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => onNavegar('inicio')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`font-label-interactive text-label-interactive transition-colors py-2 cursor-pointer ${
                paginaActual === 'catalogo' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => onNavegar('catalogo', 'todas')}
            >
              Catálogo Completo
            </button>
            <button
              type="button"
              className="font-label-interactive text-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'sofas')}
            >
              Poltronas &amp; Sofás
            </button>
            <button
              type="button"
              className="font-label-interactive text-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'colchones')}
            >
              Dormitorio &amp; Colchones
            </button>
            <button
              type="button"
              className="font-label-interactive text-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'comedores')}
            >
              Comedores
            </button>
            <button
              type="button"
              className="font-label-interactive text-label-interactive text-on-surface-variant hover:text-on-surface transition-colors py-2 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'almohadas')}
            >
              Accesorios &amp; Almohadas
            </button>
            <button
              type="button"
              className="font-label-interactive text-label-interactive text-primary font-bold hover:text-primary transition-colors py-2 flex items-center gap-1 cursor-pointer"
              onClick={() => onNavegar('catalogo', 'ofertas')}
            >
              <span className="material-symbols-outlined text-[16px]">local_offer</span>Promociones Autoservicio
            </button>
          </nav>
          <div className="hidden lg:flex items-center gap-space-sm font-label-subtle text-label-subtle text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>Entrega express en 24h dentro de 4to Anillo SCZ</span>
          </div>
        </div>
      </div>
    </header>
  );
}
