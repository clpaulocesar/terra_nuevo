import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumirDestinoPendiente } from '../../navegacion/registroNavegacion.js';
import { Badge, Eye, EyeOff, Headset, Lock, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import { iniciarSesionAdmin } from '../../services/adminService.js';
import './Admin.css';
import './LoginAdminTheme.css';
import '../../theme-dark-admin.css';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function enviar(event) {
    event.preventDefault();
    setCargando(true);
    setError('');
    try {
      const usuario = await iniciarSesionAdmin(email, password);
      // Si llegó aquí por voz/chat pidiendo una sección, se lo lleva ahí (si su rol lo permite).
      navigate(consumirDestinoPendiente(usuario?.rol, 'admin') || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="terra-login">
      <div className="terra-login-content">
        <aside className="terra-login-brand">
          <div className="terra-brand-top">
            <span className="terra-brand-logo-tile">
              <img src="/images/logo-terra.png" alt="TERRA Autoservicio" />
            </span>
            <span className="terra-brand-tag">Autoservicio</span>
          </div>

          <div className="terra-brand-copy">
            <h2>Cada pedido empieza en el showroom.</h2>
            <p>Colchones, sommiers y camas que el cliente arma y paga solo.</p>
          </div>

          <div className="terra-brand-meta">
            <span><MapPin size={16} />Sucursal 1 Central</span>
            <span><Wifi size={16} /> Red privada del showroom</span>
            <span><ShieldCheck size={16} /> Terminal EQ-01 · TERRA ERP v2.4.1</span>
          </div>
        </aside>

        <section className="terra-login-card">
          <header>
            <span className="terra-login-eyebrow">Panel de control</span>
            <h1>Acceso administrativo</h1>
            <p>Sucursal 1 Central · Santa Cruz de la Sierra</p>
          </header>

          <form onSubmit={enviar}>
            <label>
              Correo corporativo
              <small>@terra.bo</small>
              <div>
                <Badge size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerencia@terra.bo"
                  required
                  autoComplete="username"
                />
              </div>
            </label>

            <label>
              Contraseña
              <button
                type="button"
                onClick={() => alert('Contacte a soporte@terra.bo para recuperar el acceso.')}
              >
                ¿La olvidaste?
              </button>
              <div>
                <Lock size={20} />
                <input
                  type={visible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  className="terra-eye"
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            <div className="terra-login-options">
              <label>
                <input type="checkbox" defaultChecked />
                Recordar sesión en esta terminal
              </label>
              <span><Lock size={14} /> POS seguro</span>
            </div>

            {error && <p className="admin-error">{error}</p>}

            <button className="terra-login-submit" disabled={cargando}>
              {cargando ? 'Autenticando…' : 'Iniciar sesión'}
            </button>
          </form>

          <footer>
            <span><Headset size={16} /> Mesa de ayuda: <b>soporte@terra.bo</b></span>
          </footer>
        </section>
      </div>
    </main>
  );
}
