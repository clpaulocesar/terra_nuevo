import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { leerCarritoQr, limpiarCarritoQr } from '../../../services/qrCartService.js';

// Compra por QR: el catálogo y la ficha QR (detalle-qr.html) llegan a
// /carrito?confirmarQr=1 con el borrador en localStorage. Se importa al carrito
// (memoria), se limpia el borrador y se quita el parámetro de la URL.
export function useImportacionQr(importarProductosQr) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const importacionProcesada = useRef(false);
  const confirmarQr = searchParams.get('confirmarQr') === '1';
  const errorQr = searchParams.get('errorQr');

  useEffect(() => {
    if (!confirmarQr || importacionProcesada.current) return;
    importacionProcesada.current = true;
    try {
      const productosQr = leerCarritoQr();
      if (!productosQr.length) {
        navigate('/carrito?errorQr=vacio', { replace: true });
        return;
      }
      importarProductosQr(productosQr);
      limpiarCarritoQr();
      navigate('/carrito', { replace: true });
    } catch {
      navigate('/carrito?errorQr=almacenamiento', { replace: true });
    }
  }, [confirmarQr, importarProductosQr, navigate]);

  return { confirmarQr, errorQr };
}
