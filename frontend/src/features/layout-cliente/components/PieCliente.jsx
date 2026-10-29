// Pie de página corporativo de TERRA Autoservicio.
// Por debajo de 768 px reserva bajo el texto el alto de los flotantes y de la barra inferior;
// en Carrito y Confirmación, también el de la hoja del resumen (LayoutCliente sube
// --terra-flotante-abajo por encima de ella). Va en el flujo y sin z-index: nunca tapa la hoja.
// En el carrito no hay flotantes, pero sí el botón de accesibilidad a esa altura.
// site-footer: gancho de la hoja de impresión de PedidoGenerado.css.
export default function PieCliente({ enCarrito }) {
  const reserva = enCarrito
    ? 'max-md:pb-[calc(var(--terra-flotante-abajo)+var(--terra-a11y-reserva))]'
    : 'max-md:pb-[calc(var(--terra-flotante-abajo)+var(--terra-flotantes-alto)+var(--terra-flotante-separacion))]';

  return (
    <footer
      className={`site-footer mt-auto w-full border-t border-[#e5ded4] bg-[#f5f2eb] px-6 py-10 sm:px-12 lg:px-20 text-neutral-800 dark:border-terra-borde-suave dark:bg-terra-superficie dark:text-stone-300 ${reserva}`}
      data-purpose="reference-corporate-footer"
    >
      <div className="mx-auto max-w-[1720px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Columna 1: Contacto y Ubicación */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
              CONTACTO Y UBICACIÓN
            </h3>
            <div className="w-10 h-0.5 bg-terra-primario" />
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p>
                <strong className="font-semibold text-neutral-900 dark:text-white">Dirección:</strong>{' '}
                <span className="text-stone-700 dark:text-stone-300 ml-1">
                  Av. Carmelo Ortiz #3795 (entre 3.er y 4.º anillo, paralela a las rieles del tren, zona Nueva Feria Barrio Lindo)
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-emerald-600 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <p>
                <strong className="font-semibold text-neutral-900 dark:text-white">Teléfono / WhatsApp:</strong>{' '}
                <a
                  className="text-terra-primario hover:text-terra-primario-oscuro transition-colors ml-1 font-bold"
                  href="https://wa.me/59175335697"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  +591 75335697
                </a>
              </p>
            </div>
          </div>

          {/* Enlaces de Redes Sociales */}
          <div className="flex items-center gap-3 pt-2 text-stone-700 dark:text-stone-300">
            <a
              aria-label="YouTube de TERRA"
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 hover:bg-terra-primario hover:text-white dark:hover:bg-terra-primario flex items-center justify-center transition-all duration-200 text-stone-700 dark:text-stone-200 hover:border-terra-primario"
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            <a
              aria-label="Instagram de TERRA"
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 hover:bg-terra-primario hover:text-white dark:hover:bg-terra-primario flex items-center justify-center transition-all duration-200 text-stone-700 dark:text-stone-200 hover:border-terra-primario"
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect height="20" rx="5" width="20" x="2" y="2" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            <a
              aria-label="Facebook de TERRA"
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 hover:bg-terra-primario hover:text-white dark:hover:bg-terra-primario flex items-center justify-center transition-all duration-200 text-stone-700 dark:text-stone-200 hover:border-terra-primario"
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              aria-label="TikTok de TERRA"
              className="w-9 h-9 rounded-xl bg-white dark:bg-stone-800 shadow-xs border border-stone-200/80 dark:border-stone-700 hover:bg-terra-primario hover:text-white dark:hover:bg-terra-primario flex items-center justify-center transition-all duration-200 text-stone-700 dark:text-stone-200 hover:border-terra-primario"
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.54c0 1.94-.48 3.88-1.57 5.49-1.22 1.81-3.21 3.09-5.37 3.39-2.05.28-4.22-.19-5.91-1.39-2.03-1.44-3.2-3.8-3.15-6.28.05-2.58 1.4-5.02 3.55-6.39 1.85-1.18 4.16-1.5 6.27-.88v4.06c-.84-.33-1.78-.42-2.67-.25-1.07.21-2.01.88-2.5 1.84-.57 1.12-.49 2.53.19 3.57.65 1 1.79 1.63 2.99 1.63 1.25.01 2.45-.63 3.08-1.7.35-.6.5-1.3.5-2.01V.02z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Horarios de Atención */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
              HORARIOS DE ATENCIÓN
            </h3>
            <div className="w-10 h-0.5 bg-terra-primario" />
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Lunes a sábado:</p>
                <p className="text-stone-700 dark:text-stone-300 font-semibold mt-0.5">08:00 AM – 08:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect height="18" rx="2" width="18" x="3" y="4" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="3" y1="10" y2="10" />
              </svg>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Domingo:</p>
                <p className="text-stone-700 dark:text-stone-300 font-semibold mt-0.5">09:00 AM – 06:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna 3: Servicios Disponibles */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
              SERVICIOS DISPONIBLES
            </h3>
            <div className="w-10 h-0.5 bg-terra-primario" />
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Compra en tienda</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Entrega a domicilio (delivery)</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-terra-primario shrink-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Servicio el mismo día</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
