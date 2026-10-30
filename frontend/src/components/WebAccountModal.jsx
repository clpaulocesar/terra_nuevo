import { useContext, useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle, X } from 'lucide-react';
import { WHATSAPP_COMPROBANTES } from '../services/api.js';
import { iniciarSesionCliente } from '../services/sesionClienteService.js';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';

export default function WebAccountModal({ onClose }) {
  const [verClave, setVerClave] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const { iniciarSesion } = useContext(SesionClienteContext);

  const whatsapp = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent(
    'Hola, deseo información para acceder como cliente mayorista.'
  )}`;

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');
    try {
      const datos = new FormData(e.currentTarget);
      const resultado = await iniciarSesionCliente(datos.get('usuario'), datos.get('password'));
      iniciarSesion(resultado, { recordar });
      onClose();
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setCargando(false);
    }
  };

  // Escape cierra el modal (accesibilidad de teclado).
  useEffect(() => {
    const alEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-terra-aparecer"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-titulo"
        className="w-full max-w-md sm:max-w-lg bg-terra-superficie text-terra-texto rounded-t-[1.375rem] sm:rounded-terra-modal shadow-2xl overflow-hidden border border-terra-borde flex flex-col font-terra"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-terra-borde">
          <div className="flex items-center gap-3">
            <img src="/logo-terra.png" alt="TERRA" className="h-7 max-w-[5.75rem] object-contain" />
            <i className="w-px h-5.5 bg-terra-borde block" />
            <b className="font-extrabold text-terra-md text-terra-texto">Mi cuenta</b>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-terra-texto-suave hover:text-terra-texto hover:bg-terra-control transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={manejarEnvio} className="px-6 sm:px-7 py-5 flex flex-col gap-4">
          <h2 className="text-terra-texto font-bold text-xl tracking-tight" id="account-modal-titulo">
            Iniciar sesión
          </h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-usuario" className="text-terra-xs font-bold text-terra-texto">
              Correo electrónico
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3.5 text-terra-texto-suave pointer-events-none" />
              <input
                id="modal-usuario"
                name="usuario"
                required
                type="email"
                placeholder="ej. usuario@correo.com"
                className="w-full min-h-[3.25rem] pl-10 pr-4 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-password" className="text-terra-xs font-bold text-terra-texto">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setMensaje('La recuperación de contraseña estará disponible próximamente.')}
                className="text-terra-2xs sm:text-terra-xs font-bold text-terra-primario hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative flex items-center">
              <LockKeyhole size={18} className="absolute left-3.5 text-terra-texto-suave pointer-events-none" />
              <input
                id="modal-password"
                name="password"
                required
                minLength={6}
                type={verClave ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full min-h-[3.25rem] pl-10 pr-10 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 p-1 text-terra-texto-suave hover:text-terra-texto transition-colors cursor-pointer"
              >
                {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 text-terra-xs text-terra-texto-suave font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-terra-borde accent-terra-primario cursor-pointer"
            />
            Recordar mi sesión
          </label>

          {mensaje && (
            <p className="text-center text-terra-xs font-semibold px-3 py-2 rounded-terra-chico bg-terra-primario-claro text-terra-primario border border-terra-primario/20">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full min-h-[3.25rem] px-6 py-3 rounded-full text-white bg-terra-primario hover:bg-terra-primario-oscuro disabled:bg-terra-deshabilitado text-terra-sm font-extrabold uppercase tracking-wide shadow-terra-boton transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
          >
            {cargando ? 'Validando…' : 'Iniciar sesión'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-terra-borde" />
            <span className="text-terra-3xs sm:text-terra-2xs font-semibold text-terra-texto-suave uppercase tracking-wider text-center">
              ¿Eres mayorista? Comunícate con un asesor
            </span>
            <div className="flex-1 h-px bg-terra-borde" />
          </div>

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="w-full min-h-[2.75rem] px-4 py-2 rounded-terra-boton bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-terra-xs font-bold flex items-center justify-center gap-2 transition-colors no-underline"
          >
            <MessageCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            WhatsApp
          </a>
        </form>

        <footer className="px-6 sm:px-7 py-4 bg-terra-superficie-2 border-t border-terra-borde text-terra-texto-suave text-terra-xs text-center leading-relaxed font-medium">
          Seguimiento de pedidos, cotizaciones guardadas y garantías TERRA.
        </footer>
      </section>
    </div>
  );
}
