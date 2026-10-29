import { useEffect, useState } from 'react';
import { listarProductos, obtenerProducto } from '../../../services/productoService.js';

// Carga el producto de la ruta y hasta 3 de la misma categoría para "Otros modelos".
export function useDetalleProducto(id) {
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    obtenerProducto(id)
      .then((dato) => {
        if (activo) setProducto(dato);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No fue posible cargar el producto.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!producto?.categoria) return undefined;
    let activo = true;
    listarProductos({ categoria: producto.categoria, limite: 4 })
      .then((lista) => {
        if (activo) setRelacionados(lista.filter((item) => String(item.id) !== String(producto.id)).slice(0, 3));
      })
      .catch(() => {
        if (activo) setRelacionados([]);
      });
    return () => {
      activo = false;
    };
  }, [producto]);

  return { producto, relacionados, cargando, error };
}
