import { createContext, useCallback, useMemo, useState } from 'react';

export const ClienteContext = createContext(null);

const CLIENTE_VACIO = {
  nombre: '',
  telefono: '',
  nit: '',
  entregaDomicilio: false,
  direccion: '',
  referencia: '',
  zonaEnvioId: '',
  itemsEnvio: [],
};

export function ClienteProvider({ children }) {
  // No guardamos datos personales en localStorage: la tablet es compartida.
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const limpiarCliente = useCallback(() => setCliente(CLIENTE_VACIO), []);
  const valor = useMemo(() => ({ cliente, setCliente, limpiarCliente }),
    [cliente, limpiarCliente]);

  return <ClienteContext.Provider value={valor}>{children}</ClienteContext.Provider>;
}
