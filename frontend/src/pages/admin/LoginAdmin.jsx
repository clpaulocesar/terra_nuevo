import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumirDestinoPendiente } from '../../navegacion/registroNavegacion.js';
import { iniciarSesionAdmin } from '../../services/adminService.js';
import './LoginAdminTheme.css';
import '../../theme-dark-admin.css';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const navigate = useNavigate();

  async function enviar(event) {
    event.preventDefault();
    setCargando(true);
    setError('');
    try {
      const usuario = await iniciarSesionAdmin(email, password, { recordar });
      // Si llegó aquí por voz/chat pidiendo una sección, se lo lleva ahí (si su rol lo permite).
      const inicio = usuario?.rol === 'despacho' ? '/admin/despacho' : '/admin';
      navigate(consumirDestinoPendiente(usuario?.rol, 'admin') || inicio, { replace: true });
    } catch (err) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="admin-login-screen min-h-screen flex flex-col justify-between antialiased selection:bg-terra-800 selection:text-white relative">
      {/* Subtle Background Accent Graphic Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gradient-to-tr from-terra-100/40 to-transparent rounded-full blur-3xl opacity-60 transform -translate-y-12" />
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="w-full max-w-[440px] bg-surface-card rounded-3xl border border-surface-border shadow-terra-card p-8 sm:p-10 transition-all duration-300">
          {/* Brand & Section Heading */}
          <div className="text-center mb-8" data-purpose="brand-heading">
            {/* Logo Emblem */}
            <div className="flex justify-center mb-4">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4CzpQohgp0kgyePhIy9YzE2a3XJZaykwiqG4g9JUiRXVJWz4o4TeZ0TizJcgzmbjDGKN5vRZoZ5Lz4OOxwh4imL9mEwfhcY44wAW6ajWYinnbkznpHrYkBGk6fteKnMMHG75kk_7adYUH45KxV-h4-TrHSvftc8xJIcKNWgEAX80kOkvnEeB2MIOWynBgHtHBKlBDTQTS8WKKaxY3tfQXdE0p2FRUfuBfZ-p1KCDjWIYJocjqQnBVxe0pEgMWyTvUE_8"
                alt="Terrazzz - Colchones & Muebles"
                className="h-20 w-auto object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.src = '/logo-terra.png';
                }}
              />
            </div>

            {/* Subheader matching the "CENTRO DE CONTROL" / "Panel administrativo" structure */}
            <div className="mt-6 pt-5 border-t border-stone-100">
              <span className="text-[11px] font-bold tracking-wider text-terra-800 uppercase block mb-1">
                Centro de Control
              </span>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
                Panel Administrativo
              </h1>
              <p className="text-xs text-surface-muted mt-1">
                Ingresa tus credenciales autorizadas para continuar
              </p>
            </div>
          </div>

          {/* Login Form Element */}
          <form onSubmit={enviar} className="space-y-5" data-purpose="login-form" id="loginForm">
            {/* Email Input Field */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
                htmlFor="email"
              >
                Correo Electrónico
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@terra.com"
                  className="block w-full pl-10 pr-4 py-2.5 text-base rounded-xl border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-terra-800 focus:ring-2 focus:ring-terra-800/15 transition-all bg-stone-50/30"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-600"
                  htmlFor="password"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-11 py-2.5 text-base rounded-xl border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-terra-800 focus:ring-2 focus:ring-terra-800/15 transition-all bg-stone-50/30"
                />
                <button
                  type="button"
                  id="togglePasswordBtn"
                  onClick={() => setVisible((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                >
                  {visible ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600 hover:text-stone-800">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="w-4 h-4 rounded text-terra-800 border-stone-300 focus:ring-terra-800/20"
                />
                <span>Recordar sesión</span>
              </label>
              <a
                href="#recuperar"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Contacte al administrador o a soporte@terra.bo para recuperar sus credenciales.');
                }}
                className="font-medium text-terra-800 hover:text-terra-900 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={cargando}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terra-800 hover:bg-terra-700 active:bg-terra-900 text-white font-medium text-base tracking-wide shadow-md shadow-terra-800/25 focus:outline-none focus:ring-2 focus:ring-terra-800 focus:ring-offset-2 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>{cargando ? 'Iniciando sesión…' : 'Iniciar sesión'}</span>
              </button>
            </div>
          </form>

          {/* Security Notice Card */}
          <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-center text-[11px] text-stone-400 gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-stone-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Conexión cifrada de extremo a extremo SSL/TLS</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-stone-400 border-t border-[#f1eae8]/70 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            <span>
              © 2026 <strong>Terra Autoservicio</strong>. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center space-x-3 text-stone-400">
            <span>Versión 2.4.0</span>
            <span>•</span>
            <a
              href="#soporte"
              onClick={(e) => {
                e.preventDefault();
                alert('Mesa de ayuda: soporte@terra.bo');
              }}
              className="hover:text-terra-800 transition-colors"
            >
              Soporte TI
            </a>
            <span>•</span>
            <a
              href="#privacidad"
              onClick={(e) => {
                e.preventDefault();
                alert('Políticas de privacidad y seguridad de la información corporativa TERRA.');
              }}
              className="hover:text-terra-800 transition-colors"
            >
              Políticas de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
