import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Modo día / noche de toda la app. La preferencia se guarda en localStorage:
// es una preferencia del dispositivo (no un dato personal), por eso sí puede
// persistir en la tablet compartida. Si no hay preferencia guardada se usa
// la del sistema (prefers-color-scheme).

export const CLAVE_TEMA = 'terra_tema';
const TEMAS = ['claro', 'oscuro'];

const TemaContext = createContext(null);

function leerTemaGuardado() {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return TEMAS.includes(valor) ? valor : null;
  } catch {
    return null;
  }
}

function temaDelSistema() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'claro';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

export function aplicarTemaAlDocumento(tema) {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  raiz.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
  raiz.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light';
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => leerTemaGuardado() || temaDelSistema());
  const [sigueSistema, setSigueSistema] = useState(() => leerTemaGuardado() === null);

  // Refleja el tema en <html data-theme="..."> para que el CSS lo aplique.
  useEffect(() => { aplicarTemaAlDocumento(tema); }, [tema]);

  // Mientras no haya elección manual, sigue los cambios del sistema.
  useEffect(() => {
    if (!sigueSistema || typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const actualizar = (e) => setTema(e.matches ? 'oscuro' : 'claro');
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, [sigueSistema]);

  const cambiarTema = useCallback((nuevo) => {
    const valor = TEMAS.includes(nuevo) ? nuevo : 'claro';
    setTema(valor);
    setSigueSistema(false);
    try { localStorage.setItem(CLAVE_TEMA, valor); } catch { /* almacenamiento bloqueado: sólo esta sesión */ }
  }, []);

  const alternarTema = useCallback(() => {
    cambiarTema(tema === 'oscuro' ? 'claro' : 'oscuro');
  }, [tema, cambiarTema]);

  const valor = useMemo(
    () => ({ tema, esOscuro: tema === 'oscuro', cambiarTema, alternarTema }),
    [tema, cambiarTema, alternarTema]
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const contexto = useContext(TemaContext);
  if (!contexto) throw new Error('useTema debe usarse dentro de <TemaProvider>.');
  return contexto;
}
