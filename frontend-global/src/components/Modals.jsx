import { useState } from 'react';
import { LOGO_TERRA } from '../data/sucursalesData.js';
import { registrarClienteBackend } from '../services/clienteService.js';

export default function Modals({
  sucursalActiva,
  qrModalOpen,
  onCloseQrModal,
  accountModalOpen,
  onCloseAccountModal,
  onLoginSuccess,
}) {
  // Tabs: 'login' | 'register'
  const [activeAccountTab, setActiveAccountTab] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('Por favor introduce tu correo/celular y contraseña.');
      return;
    }
    const nombreUsuario = loginEmail.includes('@') ? loginEmail.split('@')[0] : 'Cliente';
    if (onLoginSuccess) {
      onLoginSuccess({
        nombre: nombreUsuario,
        correo: loginEmail,
        tipo: 'Cliente Minorista',
      });
    } else {
      alert(`¡Bienvenido de nuevo, ${nombreUsuario}! Sesión iniciada con éxito.`);
    }
    onCloseAccountModal();
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword.trim()) {
      alert('Por favor completa todos los campos del registro.');
      return;
    }
    await registrarClienteBackend({
      nombre: regName.trim(),
      telefono: regPhone.trim(),
      email: regEmail.trim(),
    });
    if (onLoginSuccess) {
      onLoginSuccess({
        nombre: regName,
        correo: regEmail,
        telefono: regPhone,
        tipo: 'Cliente Minorista',
      });
    } else {
      alert(`¡Cuenta creada con éxito para ${regName}! Ya puedes realizar tus pedidos y acumular beneficios.`);
    }
    onCloseAccountModal();
  };

  return (
    <>
      {/* ========================================================= */}
      {/* MODAL MI CUENTA (Iniciar sesión / Crear cuenta minorista) */}
      {/* ========================================================= */}
      {accountModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 pointer-events-auto"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-md transition-opacity duration-300"
            onClick={onCloseAccountModal}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container overflow-hidden z-10 my-auto transform transition-all duration-300 animate-fadeIn">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-surface-container-low flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <img
                  alt="TERRA Muebles &amp; Colchones"
                  className="h-10 w-auto object-contain"
                  src={LOGO_TERRA}
                />
                <div className="leading-tight">
                  <h2 className="font-title-sm text-[16px] font-bold text-on-surface">Mi Cuenta</h2>
                  <p className="text-[11px] font-medium text-on-surface-variant font-label-subtle">
                    Portal Autoservicio Santa Cruz
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar ventana"
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                onClick={onCloseAccountModal}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Tabs: Iniciar sesión vs Crear cuenta */}
            <div className="px-6 pt-3 bg-surface-container-lowest">
              <div className="flex border-b border-surface-container">
                <button
                  type="button"
                  className={`flex-1 pb-3 text-center font-label-interactive text-[14px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeAccountTab === 'login'
                      ? 'font-bold text-primary border-b-2 border-primary'
                      : 'font-semibold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                  }`}
                  onClick={() => setActiveAccountTab('login')}
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className={`flex-1 pb-3 text-center font-label-interactive text-[14px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeAccountTab === 'register'
                      ? 'font-bold text-primary border-b-2 border-primary'
                      : 'font-semibold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                  }`}
                  onClick={() => setActiveAccountTab('register')}
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Crear cuenta
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* TAB 1: FORMULARIO INICIAR SESIÓN */}
              {activeAccountTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4" id="form-login-pane">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                      htmlFor="login-email"
                    >
                      Correo electrónico o celular
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                        mail
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        id="login-email"
                        placeholder="ej. usuario@correo.com o 77012345"
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                        htmlFor="login-password"
                      >
                        Contraseña
                      </label>
                      <button
                        type="button"
                        className="text-[12px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
                        onClick={() =>
                          alert(
                            'Te enviaremos un enlace de recuperación por correo o WhatsApp oficial de Terra.'
                          )
                        }
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                        lock
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-11 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        id="login-password"
                        placeholder="••••••••"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 text-on-surface-variant hover:text-on-surface focus:outline-none p-1 cursor-pointer"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showLoginPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-on-surface-variant hover:text-on-surface">
                      <input
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary/30 border-surface-container accent-primary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="font-medium">Recordar mi sesión en este dispositivo</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-interactive text-[14px] font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99]"
                  >
                    <span>INICIAR SESIÓN</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-surface-container"></div>
                    <span className="flex-shrink mx-3 text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold font-label-caps">
                      o ingresa con
                    </span>
                    <div className="flex-grow border-t border-surface-container"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container text-on-surface text-[12px] font-bold transition-colors cursor-pointer"
                      onClick={() =>
                        alert(
                          'Acceso rápido con WhatsApp en desarrollo. Conéctate con tus credenciales.'
                        )
                      }
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#25D366]">chat</span>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container text-on-surface text-[12px] font-bold transition-colors cursor-pointer"
                      onClick={() => alert('Acceso con Google activado para cuentas autorizadas.')}
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">account_circle</span>
                      <span>Google</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: FORMULARIO CREAR CUENTA */}
              {activeAccountTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4" id="form-register-pane">
                  <div className="space-y-1.5">
                    <label
                      className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                      htmlFor="reg-name"
                    >
                      Nombre y Apellido
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                        badge
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        id="reg-name"
                        placeholder="ej. Carlos Mendizábal"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                        htmlFor="reg-phone"
                      >
                        Celular (Santa Cruz)
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                          smartphone
                        </span>
                        <input
                          className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          id="reg-phone"
                          placeholder="+591 70000000"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                        htmlFor="reg-email"
                      >
                        Correo electrónico
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                          mail
                        </span>
                        <input
                          className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          id="reg-email"
                          placeholder="correo@ejemplo.com"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="block font-label-interactive text-[13px] font-semibold text-on-surface"
                      htmlFor="reg-password"
                    >
                      Crear Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 text-[18px]">
                        lock
                      </span>
                      <input
                        className="w-full h-11 pl-11 pr-11 rounded-xl bg-surface-container-low border border-surface-container text-on-surface placeholder:text-on-surface-variant font-body-sm text-[13px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        id="reg-password"
                        placeholder="Mínimo 6 caracteres"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 text-on-surface-variant hover:text-on-surface focus:outline-none p-1 cursor-pointer"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-interactive text-[14px] font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99]"
                  >
                    <span>REGISTRARSE Y ACTIVAR CUENTA</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              )}

              {/* B2B Commercial Advisory Footer Link */}
              <div className="mt-5 pt-4 border-t border-surface-container-low">
                <div className="bg-surface-container-low/80 rounded-2xl p-3.5 text-center flex flex-col items-center">
                  <p className="text-[12px] text-on-surface-variant mb-2">
                    ¿Eres distribuidor, arquitecto o compras por mayor?
                  </p>
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 font-label-interactive text-[12px] font-bold transition-colors"
                    href="https://wa.me/59175335697"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
                    <span>WhatsApp Asesor Comercial Mayorista</span>
                  </a>
                </div>
                <p className="text-center text-[10px] text-on-surface-variant mt-3 font-label-subtle">
                  Seguimiento de pedidos, cotizaciones guardadas y garantías TERRA.
                  <br />
                  Tus datos están protegidos conforme a las políticas de privacidad de TERRA Bolivia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL QR DE COMPRA / CONTINUAR EN MÓVIL                   */}
      {/* ========================================================= */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative animate-fadeIn">
            <button
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
              onClick={onCloseQrModal}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
            </div>
            <h3 className="font-title-sm text-title-sm text-on-surface font-bold mb-1">Continúa en tu Dispositivo</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
              Escanea desde tu cámara móvil para pagar en línea, guardar tu lista de deseos o retirar en caja con tu código.
            </p>
            <div className="p-3 bg-surface-container-lowest rounded-2xl shadow-inner mb-4">
              <svg className="w-48 h-48 text-on-surface" fill="currentColor" viewBox="0 0 100 100">
                <rect height="28" rx="4" width="28" x="10" y="10"></rect>
                <rect fill="#fff" height="20" rx="2" width="20" x="14" y="14"></rect>
                <rect height="12" rx="1" width="12" x="18" y="18"></rect>
                <rect height="28" rx="4" width="28" x="62" y="10"></rect>
                <rect fill="#fff" height="20" rx="2" width="20" x="66" y="14"></rect>
                <rect height="12" rx="1" width="12" x="70" y="18"></rect>
                <rect height="28" rx="4" width="28" x="10" y="62"></rect>
                <rect fill="#fff" height="20" rx="2" width="20" x="14" y="66"></rect>
                <rect height="12" rx="1" width="12" x="18" y="70"></rect>
                <rect height="6" rx="1" width="10" x="44" y="12"></rect>
                <rect height="12" rx="1" width="6" x="44" y="24"></rect>
                <rect fill="#8b001a" height="12" rx="2" width="12" x="44" y="44"></rect>
                <rect height="6" rx="1" width="14" x="62" y="44"></rect>
                <rect height="16" rx="1" width="8" x="44" y="64"></rect>
                <rect height="10" rx="1" width="10" x="62" y="76"></rect>
              </svg>
            </div>
            <span className="font-label-subtle text-label-subtle text-on-surface-variant">
              Código de sesión: <strong>#SCZ-{sucursalActiva.id.toUpperCase()}-9882</strong>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
