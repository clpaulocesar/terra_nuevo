import { useState } from 'react';
import { Eye, EyeOff, Lock, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { iniciarSesionAdmin } from '../../services/adminService.js';
import './LoginVendedor.css';

export default function LoginVendedor() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [ver, setVer] = useState(false); const [error, setError] = useState(''); const [cargando, setCargando] = useState(false); const navigate = useNavigate();
  const enviar = async (event) => { event.preventDefault(); setCargando(true); setError(''); try { const usuario = await iniciarSesionAdmin(email, password); if (usuario.rol !== 'vendedor') throw new Error('Esta cuenta no corresponde al portal de vendedor.'); navigate('/vendedor', { replace: true }); } catch (e) { setError(e.message); } finally { setCargando(false); } };
  return <main className="seller-login"><form onSubmit={enviar}><img src="/logo-terra.png" alt="TERRA Autoservicio" /><span>PORTAL COMERCIAL</span><h1>Acceso de vendedor</h1><p>Ingresa con la cuenta creada por administración.</p><label>Correo corporativo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label><label>Contraseña<div><input type={ver ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /><button type="button" onClick={() => setVer((actual) => !actual)}>{ver ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p className="seller-login__error">{error}</p>}<button disabled={cargando} type="submit"><UserRound size={18} />{cargando ? 'Validando...' : 'Ingresar al portal'}</button><footer><Lock size={14} /> Acceso autorizado para personal TERRA</footer></form></main>;
}
