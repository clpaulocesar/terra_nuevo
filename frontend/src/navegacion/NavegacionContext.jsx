import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useAccesibilidad } from '../context/AccesibilidadContext.jsx';
import { useModoAccesibleOpcional } from '../accesibilidad/ModoAccesibleContext.jsx';
import { cerrarSesionAdmin, getAdminToken, getAdminUser } from '../services/adminService.js';
import { DESTINOS, guardarDestinoPendiente, puedeAcceder, zonaDeDestino, zonaDeRuta } from './registroNavegacion.js';

// Vive dentro del router (AppRoutes). Ejecuta las intenciones que producen el lector
// de voz y el chatbot: verifica sesión y rol, navega o abre el modal, y anuncia.
const NavegacionContext = createContext(null);

const rutaSinQuery = (ruta) => String(ruta || '').split('?')[0];

export function NavegacionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { anunciar } = useAccesibilidad();
  const { esMayorista, cerrarSesion: cerrarSesionMayorista } = useContext(SesionClienteContext);
  // Puede ser null en tests o pantallas montadas sin ModoAccesibleProvider.
  const modoAccesible = useModoAccesibleOpcional();

  // Modal de login mayorista: antes era estado local de Layout; ahora vive aquí para
  // que voz, chat y el parámetro ?login=1 puedan abrirlo.
  const [loginMayoristaAbierto, setLoginMayoristaAbierto] = useState(false);
  // Destino que pidió un visitante sin sesión mayorista; se navega al iniciar sesión.
  const pendienteMayoristaRef = useRef(null);
  // Confirmación por voz pendiente (hoy sólo "cerrar sesión").
  const [confirmacionPendiente, setConfirmacionPendiente] = useState(null);

  const contextoActual = useCallback(() => ({
    ruta: location.pathname,
    tokenAdmin: Boolean(getAdminToken()),
    rolAdmin: getAdminUser()?.rol || null,
    esMayorista: Boolean(esMayorista),
  }), [location.pathname, esMayorista]);

  const abrirLoginMayorista = useCallback(() => setLoginMayoristaAbierto(true), []);
  const cerrarLoginMayorista = useCallback(() => setLoginMayoristaAbierto(false), []);

  // ?login=1 en cualquier ruta pública abre el modal y limpia el parámetro.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('login') !== '1' || zonaDeRuta(location.pathname) === 'admin' || zonaDeRuta(location.pathname) === 'vendedor') return;
    params.delete('login');
    const resto = params.toString();
    navigate(`${location.pathname}${resto ? `?${resto}` : ''}`, { replace: true });
    if (!esMayorista) setLoginMayoristaAbierto(true);
  }, [location.pathname, location.search, navigate, esMayorista]);

  // Tras iniciar sesión como mayorista, ir al destino que había pedido.
  useEffect(() => {
    if (!esMayorista || !pendienteMayoristaRef.current) return;
    const clave = pendienteMayoristaRef.current;
    pendienteMayoristaRef.current = null;
    const destino = DESTINOS[clave];
    if (destino?.ruta) {
      navigate(destino.ruta);
      anunciar(`Sesión iniciada. Estás en ${destino.nombre}.`, { forzar: true });
    }
  }, [esMayorista, navigate, anunciar]);

  const cerrarSesionActual = useCallback(() => {
    const ctx = contextoActual();
    const zona = zonaDeRuta(ctx.ruta);
    if (zona === 'admin' || zona === 'vendedor' || ctx.tokenAdmin) cerrarSesionAdmin();
    if (ctx.esMayorista) cerrarSesionMayorista();
    navigate('/');
    anunciar('Sesión cerrada. Estás en Inicio.', { forzar: true });
  }, [contextoActual, cerrarSesionMayorista, navigate, anunciar]);

  // Respuesta a una confirmación pendiente ("sí" / "no"). Devuelve true si la consumió.
  const responderConfirmacion = useCallback((frase) => {
    if (!confirmacionPendiente) return false;
    const f = String(frase || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const si = /^(si|sí|dale|confirmo|confirmar|ok|claro|afirmativo)\b/.test(f);
    const no = /^(no|cancelar|cancela|negativo)\b/.test(f);
    if (!si && !no) { anunciar('Decí sí o no.', { forzar: true }); return true; }
    const pendiente = confirmacionPendiente;
    setConfirmacionPendiente(null);
    if (no) { anunciar('Cancelado.', { forzar: true }); return true; }
    if (pendiente === 'cerrarSesion') cerrarSesionActual();
    return true;
  }, [confirmacionPendiente, anunciar, cerrarSesionActual]);

  // Punto de entrada único para voz y chat.
  const ejecutarIntencion = useCallback(({ destino: clave, parametros = {} } = {}, { origen = 'voz' } = {}) => {
    const destino = DESTINOS[clave];
    if (!destino) return false;
    const ctx = contextoActual();

    // Acciones del modo accesible ("modo accesible", "letra más grande", "alto contraste").
    if (String(destino.accion || '').startsWith('a11y:')) {
      if (!modoAccesible) { anunciar('El modo accesible no está disponible en esta pantalla.', { forzar: true }); return true; }
      return modoAccesible.ejecutarAccionVoz(destino.accion);
    }

    if (destino.accion === 'abrirLoginMayorista') {
      if (ctx.esMayorista) {
        navigate('/mi-cuenta');
        anunciar('Ya tenés la sesión iniciada. Estás en Mi panel mayorista.', { forzar: true });
      } else {
        if (zonaDeRuta(ctx.ruta) === 'admin' || zonaDeRuta(ctx.ruta) === 'vendedor') navigate('/');
        setLoginMayoristaAbierto(true);
        anunciar('Ingresá tu correo y contraseña de mayorista.', { forzar: true });
      }
      return true;
    }

    if (destino.accion === 'cerrarSesion') {
      if (!puedeAcceder(clave, ctx)) { anunciar('No hay ninguna sesión iniciada.', { forzar: true }); return true; }
      if (origen === 'chat') { cerrarSesionActual(); return true; }
      setConfirmacionPendiente('cerrarSesion');
      anunciar('¿Cerrar sesión? Decí sí o no.', { forzar: true });
      return true;
    }

    // Permisos.
    if (!puedeAcceder(clave, ctx)) {
      const zona = zonaDeDestino(clave);
      if (zona === 'mayorista') {
        pendienteMayoristaRef.current = clave;
        setLoginMayoristaAbierto(true);
        anunciar(`Primero iniciá sesión como mayorista para ir a ${destino.nombre}.`, { forzar: true });
        return true;
      }
      if (zona === 'admin' || zona === 'vendedor') {
        if (ctx.tokenAdmin) {
          anunciar(`Tu usuario no tiene acceso a ${destino.nombre}.`, { forzar: true });
          return true;
        }
        guardarDestinoPendiente(clave);
        navigate(zona === 'vendedor' ? '/vendedor/login' : '/admin/login');
        anunciar(`Primero iniciá sesión. Ingresá tu correo y contraseña de ${zona === 'vendedor' ? 'vendedor' : 'administrador'}.`, { forzar: true });
        return true;
      }
      anunciar(`No tenés acceso a ${destino.nombre}.`, { forzar: true });
      return true;
    }

    const mismaRuta = rutaSinQuery(destino.ruta) === ctx.ruta && !destino.ruta.includes('?');
    if (mismaRuta) {
      anunciar(`Ya estás en ${destino.nombre}.`, { forzar: true });
      return true;
    }
    const ruta = parametros.ruta || destino.ruta;
    navigate(ruta);
    const aviso = clave === 'loginAdmin' || clave === 'loginVendedor'
      ? `Estás en ${destino.nombre}. Ingresá tu correo y contraseña.`
      : `Estás en ${destino.nombre}.`;
    anunciar(aviso, { forzar: true });
    return true;
  }, [contextoActual, navigate, anunciar, cerrarSesionActual, modoAccesible]);

  const valor = useMemo(() => ({
    ejecutarIntencion,
    contextoActual,
    abrirLoginMayorista,
    cerrarLoginMayorista,
    loginMayoristaAbierto,
    cerrarSesionActual,
    hayConfirmacionPendiente: Boolean(confirmacionPendiente),
    responderConfirmacion,
  }), [ejecutarIntencion, contextoActual, abrirLoginMayorista, cerrarLoginMayorista, loginMayoristaAbierto, cerrarSesionActual, confirmacionPendiente, responderConfirmacion]);

  return <NavegacionContext.Provider value={valor}>{children}</NavegacionContext.Provider>;
}

export function useNavegacion() {
  const contexto = useContext(NavegacionContext);
  if (!contexto) throw new Error('useNavegacion debe usarse dentro de <NavegacionProvider>.');
  return contexto;
}
