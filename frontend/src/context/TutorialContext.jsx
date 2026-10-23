import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [solicitud, setSolicitud] = useState(0);
  const solicitarTutorial = useCallback(() => setSolicitud((valor) => valor + 1), []);
  const consumirSolicitudTutorial = useCallback(() => setSolicitud(0), []);
  const valor = useMemo(
    () => ({ solicitud, solicitarTutorial, consumirSolicitudTutorial }),
    [solicitud, solicitarTutorial, consumirSolicitudTutorial],
  );

  return <TutorialContext.Provider value={valor}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const contexto = useContext(TutorialContext);
  if (!contexto) throw new Error('useTutorial debe usarse dentro de TutorialProvider');
  return contexto;
}
