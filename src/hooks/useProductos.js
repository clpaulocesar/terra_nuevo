import { useEffect, useState } from 'react';
import { listarProductos } from '../services/productoService.js';

export function useProductos({ buscar = '', categoria = '' } = {}) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const resultado = await listarProductos({
          buscar, categoria, limite: 100, signal: controlador.signal,
        });
        if (!controlador.signal.aborted) setProductos(resultado);
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(err.message);
          setProductos([]);
        }
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }, 250);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [buscar, categoria]);

  return { productos, cargando, error };
}