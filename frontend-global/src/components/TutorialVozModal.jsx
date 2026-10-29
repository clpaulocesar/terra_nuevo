import { useEffect } from 'react';
import { useVoz } from '../context/VozContext.jsx';

export default function TutorialVozModal({
  abierto,
  onCerrar,
  onEjecutarComando,
}) {
  const {
    vozActiva,
    alternarVoz,
    escuchando,
    iniciarEscucha,
    soportaReconocimiento,
    soportaVoz,
  } = useVoz();

  useEffect(() => {
    if (!abierto) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const probarComando = (texto) => {
    onCerrar();
    if (onEjecutarComando) {
      onEjecutarComando(texto);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-voz-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onCerrar}
    >
      <div
        className="relative w-full max-w-2xl bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-surface-container-high border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div>
              <h2 id="tutorial-voz-titulo" className="text-title-md font-title-md font-bold text-on-surface leading-tight">
                Guía de Asistencia y Voz Guía Terra
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Autoservicio inteligente optimizado para sala táctil y web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Audio / Voz Guía */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  vozActiva ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {vozActiva ? 'volume_up' : 'volume_off'}
                  </span>
                </div>
                <div>
                  <h3 className="text-body-md font-bold text-on-surface">
                    Audio / Voz Guía Asistiva
                  </h3>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    Describe en voz alta los productos, precios y te acompaña al navegar o agregar artículos al carrito.
                  </p>
                  {!soportaVoz && (
                    <span className="text-error text-[12px] font-semibold mt-1 block">
                      (Tu navegador no soporta síntesis de voz)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={alternarVoz}
                className={`px-4 py-2 rounded-full font-label-interactive text-label-interactive text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  vozActiva
                    ? 'bg-primary text-on-primary shadow-sm hover:bg-primary-container'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {vozActiva ? 'check_circle' : 'toggle_on'}
                </span>
                <span>{vozActiva ? 'Activada' : 'Activar Voz'}</span>
              </button>
            </div>
          </div>

          {/* Búsqueda por Voz */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  escuchando ? 'bg-red-600 text-white animate-pulse' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </div>
                <div>
                  <h3 className="text-body-md font-bold text-on-surface">
                    Búsqueda por Voz y Navegación
                  </h3>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    Presiona el micrófono en el encabezado o en la barra de búsqueda y di el nombre de lo que buscas.
                  </p>
                  {!soportaReconocimiento && (
                    <span className="text-error text-[12px] font-semibold mt-1 block">
                      (Recomendado: Google Chrome o Microsoft Edge para dictado por voz)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCerrar();
                  iniciarEscucha();
                }}
                disabled={!soportaReconocimiento}
                className="px-4 py-2 rounded-full font-label-interactive text-label-interactive text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
                <span>Probar Micrófono</span>
              </button>
            </div>
          </div>

          {/* Comandos de Voz Recomendados */}
          <div>
            <h4 className="text-body-sm font-bold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">record_voice_over</span>
              Frases y comandos que puedes decir o probar:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'Buscar Colchón King', frase: 'buscar colchón king', icono: 'bed' },
                { label: 'Ver Promociones y Ofertas', frase: 'ver ofertas', icono: 'local_offer' },
                { label: 'Sofás y Poltronas', frase: 'ver sofás', icono: 'chair' },
                { label: 'Comedores y Mesas', frase: 'comedores', icono: 'table_restaurant' },
                { label: 'Almohadas y Accesorios', frase: 'almohadas', icono: 'shopping_bag' },
                { label: 'Abrir Mi Carrito', frase: 'abrir carrito', icono: 'shopping_cart' },
                { label: 'Ver Sucursales y Horarios', frase: 'ver sucursales', icono: 'storefront' },
                { label: 'Volver a Inicio', frase: 'inicio', icono: 'home' },
              ].map((cmd) => (
                <button
                  key={cmd.frase}
                  type="button"
                  onClick={() => probarComando(cmd.frase)}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                      {cmd.icono}
                    </span>
                    <span className="text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                      "{cmd.label}"
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">
                    play_arrow
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Retiro en Sala y Despacho */}
          <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">local_shipping</span>
            <span>
              Todos los pedidos cuentan con opción de retiro inmediato en salas de Santa Cruz (Barrio Lindo, Alemana o Radial 10) o entrega rápida en 24 horas.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container-high border-t border-outline-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container font-label-interactive text-label-interactive font-semibold text-sm transition-all cursor-pointer"
          >
            Entendido, continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
