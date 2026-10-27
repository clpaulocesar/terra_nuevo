import { useEffect, useState } from 'react';
import { listarProductosDestacados } from '../services/api.js';

export default function useProductosDestacados() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controlador = new AbortController();

    const cargarProductos = async () => {
      try {
        setProductos(await listarProductosDestacados(controlador.signal));
      } catch (errorCarga) {
        if (errorCarga.name !== 'AbortError') {
          setError(errorCarga.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarProductos();
    return () => controlador.abort();
  }, []);

  return { productos, cargando, error };
}
