import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react';
import './WebAccountModal.css';

export default function WebAccountModal({ onClose }) {
  const [crearCuenta, setCrearCuenta] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const enviar = (event) => { event.preventDefault(); setMensaje('El acceso en línea estará disponible próximamente.'); };
  return <div className="account-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="account-modal__panel" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <header><div><img src="/logo-terra.png" alt="TERRA" /><i /><b id="account-title">Mi cuenta</b></div><button type="button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button></header>
      <div className="account-modal__tabs"><button type="button" className={!crearCuenta ? 'active' : ''} onClick={() => { setCrearCuenta(false); setMensaje(''); }}>Iniciar sesión</button><button type="button" className={crearCuenta ? 'active' : ''} onClick={() => { setCrearCuenta(true); setMensaje(''); }}>Crear cuenta</button></div>
      <form onSubmit={enviar}>{crearCuenta && <label>Nombre completo<input required placeholder="Tu nombre y apellido" /></label>}<label>Correo electrónico o teléfono<input required type="text" placeholder="ej. usuario@correo.com o +591 ..." /><Mail size={16} /></label><label>Contraseña{!crearCuenta && <button className="account-modal__forgot" type="button" onClick={() => setMensaje('La recuperación de contraseña estará disponible próximamente.')}>¿Olvidaste tu contraseña?</button>}<input required minLength="6" type={verClave ? 'text' : 'password'} placeholder="••••••••" /><LockKeyhole size={16} /><button className="account-modal__eye" type="button" aria-label="Mostrar u ocultar contraseña" onClick={() => setVerClave((actual) => !actual)}>{verClave ? <EyeOff size={17} /> : <Eye size={17} />}</button></label>{!crearCuenta && <div className="account-modal__options"><label><input type="checkbox" /> Recordar mi sesión</label><small><ShieldCheck size={13} /> Conexión segura</small></div>}{mensaje && <p className="account-modal__message" role="status">{mensaje}</p>}<button className="account-modal__submit" type="submit">{crearCuenta ? 'Crear cuenta' : 'Iniciar sesión'}</button></form>
      <footer>Tus pedidos, cotizaciones y garantías estarán disponibles desde tu cuenta TERRA.</footer>
    </section>
  </div>;
}
