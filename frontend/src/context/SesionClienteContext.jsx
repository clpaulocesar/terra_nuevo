import { createContext, useCallback, useMemo, useState } from 'react';

export const SesionClienteContext = createContext(null);

export function SesionClienteProvider({ children }) {
  // Sesión únicamente en memoria: la tablet compartida no conserva credenciales.
  const [sesion, setSesion] = useState(null);
  const iniciarSesion = useCallback((perfil) => setSesion(perfil), []);
  const cerrarSesion = useCallback(() => setSesion(null), []);
  const valor = useMemo(() => ({ sesion, esMayorista: sesion?.rol === 'mayorista', iniciarSesion, cerrarSesion }), [sesion, iniciarSesion, cerrarSesion]);
  return <SesionClienteContext.Provider value={valor}>{children}</SesionClienteContext.Provider>;
}
