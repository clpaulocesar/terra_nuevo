import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const SesionClienteContext = createContext(null);

// Por defecto la sesión mayorista vive sólo en memoria (tablet compartida). Con la casilla
// "Recordar mi sesión" se guarda en localStorage hasta que vence el token de acceso.
const CLAVE_SESION = 'terra_sesion_mayorista';
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function leerSesionGuardada() {
  try {
    const raw = localStorage.getItem(CLAVE_SESION);
    if (!raw) return null;
    const guardada = JSON.parse(raw);
    if (!guardada?.token || !Number(guardada.expira) || Number(guardada.expira) <= Date.now()) {
      localStorage.removeItem(CLAVE_SESION);
      return null;
    }
    return guardada;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try { localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch { /* sin almacenamiento: sólo en memoria */ }
}

function borrarSesionGuardada() {
  try { localStorage.removeItem(CLAVE_SESION); } catch { /* nada que borrar */ }
}

export function SesionClienteProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionGuardada);
  // true cuando la sesión actual se guardó con "Recordar mi sesión".
  const recordarRef = useRef(Boolean(sesion));
  // Se enciende cuando la sesión caducó sola; NavegacionContext reabre el login.
  const [vencida, setVencida] = useState(false);

  const iniciarSesion = useCallback((perfil, { recordar } = {}) => {
    if (typeof recordar === 'boolean') recordarRef.current = recordar;
    setSesion(perfil);
    setVencida(false);
    if (recordarRef.current && perfil) guardarSesion(perfil);
    else borrarSesionGuardada();
  }, []);

  const cerrarSesion = useCallback(() => {
    recordarRef.current = false;
    setSesion(null);
    borrarSesionGuardada();
  }, []);

  const limpiarVencida = useCallback(() => setVencida(false), []);

  // Al vencer el token se limpia la sesión (memoria y almacenamiento) y se avisa.
  const expira = Number(sesion?.expira) || 0;
  useEffect(() => {
    if (!sesion || !expira) return undefined;
    const temporizador = window.setTimeout(() => {
      cerrarSesion();
      setVencida(true);
    }, Math.min(Math.max(0, expira - Date.now()), MAX_TIMEOUT_MS));
    return () => window.clearTimeout(temporizador);
  }, [sesion, expira, cerrarSesion]);

  const valor = useMemo(() => ({
    sesion,
    esMayorista: sesion?.rol === 'mayorista',
    iniciarSesion,
    cerrarSesion,
    sesionVencida: vencida,
    limpiarVencida,
  }), [sesion, iniciarSesion, cerrarSesion, vencida, limpiarVencida]);
  return <SesionClienteContext.Provider value={valor}>{children}</SesionClienteContext.Provider>;
}
