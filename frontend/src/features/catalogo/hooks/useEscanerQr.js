import { useEffect, useRef, useState } from 'react';
import { obtenerProducto } from '../../../services/productoService.js';

function obtenerIdDelQr(texto) {
  const valor = String(texto || '').trim();
  try {
    const url = new URL(valor, window.location.origin);
    const id = url.searchParams.get('id') || url.searchParams.get('producto') || url.searchParams.get('p');
    if (id) return id.trim();
  } catch {
    // No es una URL: se prueba como id suelto.
  }
  return /^[a-zA-Z0-9_-]{1,100}$/.test(valor) ? valor : null;
}

// Escáner de QR del catálogo: cámara, lectura de una imagen y cantidad del producto
// leído. Suma directamente al carrito principal para no crear dos compras separadas.
export function useEscanerQr({ abrirAlEntrar, items, agregarProducto, actualizarCantidad, navigate }) {
  const [escanerAbierto, setEscanerAbierto] = useState(abrirAlEntrar);
  const [estadoEscaner, setEstadoEscaner] = useState('');
  const [errorEscaner, setErrorEscaner] = useState(false);
  const [ultimoProductoQrId, setUltimoProductoQrId] = useState('');
  // Tras leer un QR el escáner queda en pausa: así un mismo código no se suma
  // varias veces mientras sigue delante de la cámara. La cantidad se ajusta a
  // mano y "Escanear otro" reanuda la lectura.
  const [escaneoPausado, setEscaneoPausado] = useState(false);
  const [leyendoImagenQr, setLeyendoImagenQr] = useState(false);
  const escaneoPausadoRef = useRef(false);

  const videoEscanerRef = useRef(null);
  const imagenQrInputRef = useRef(null);
  const escanerProcesandoRef = useRef(false);

  useEffect(() => {
    if (abrirAlEntrar) {
      setEscanerAbierto(true);
      navigate('/catalogo', { replace: true });
    }
  }, [abrirAlEntrar, navigate]);

  const carritoQr = items;
  const unidadesQr = carritoQr.reduce((total, item) => total + Number(item.cantidad), 0);
  const totalQr = carritoQr.reduce((total, item) => total + Number(item.precio) * Number(item.cantidad), 0);

  const itemQrEscaneado = ultimoProductoQrId
    ? carritoQr.find((item) => item.id === ultimoProductoQrId && !item.color) || null
    : null;

  const reanudarEscaneo = () => {
    escaneoPausadoRef.current = false;
    escanerProcesandoRef.current = false;
    setEscaneoPausado(false);
    setErrorEscaner(false);
    setEstadoEscaner('Apuntá la cámara al siguiente código QR.');
  };

  const procesarContenidoQr = async (contenido) => {
    if (escanerProcesandoRef.current || escaneoPausadoRef.current) return;
    escanerProcesandoRef.current = true;
    const idProducto = obtenerIdDelQr(contenido);
    if (!idProducto) {
      setEstadoEscaner('El código no contiene un QR válido de producto TERRA.');
      setErrorEscaner(true);
      window.setTimeout(() => { escanerProcesandoRef.current = false; }, 1200);
      return;
    }

    setEstadoEscaner('Buscando producto…');
    setErrorEscaner(false);
    try {
      const producto = await obtenerProducto(idProducto);
      setUltimoProductoQrId(String(producto.id));
      const agregado = agregarProducto(producto);
      escaneoPausadoRef.current = true;
      setEscaneoPausado(true);
      if (!agregado) {
        setEstadoEscaner(`Ya agregaste todas las unidades disponibles de ${producto.nombre}.`);
        setErrorEscaner(true);
      } else {
        setEstadoEscaner(`${producto.nombre} agregado. Ajustá la cantidad, escaneá otro producto o confirmá la compra.`);
      }
    } catch (err) {
      setEstadoEscaner(err.message || 'No se pudo cargar el producto del QR.');
      setErrorEscaner(true);
    } finally {
      window.setTimeout(() => { escanerProcesandoRef.current = false; }, 1200);
    }
  };

  const leerImagenQr = async (event) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      setEstadoEscaner('Elegí una imagen que contenga el código QR.');
      setErrorEscaner(true);
      return;
    }

    escaneoPausadoRef.current = false;
    escanerProcesandoRef.current = false;
    setEscaneoPausado(false);
    setLeyendoImagenQr(true);
    setErrorEscaner(false);
    setEstadoEscaner('Leyendo el código QR de la imagen…');
    const urlImagen = URL.createObjectURL(archivo);
    try {
      const imagen = new Image();
      imagen.src = urlImagen;
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const resultado = await new BrowserQRCodeReader().decodeFromImageElement(imagen);
      await procesarContenidoQr(resultado.getText());
    } catch {
      setEstadoEscaner('No encontramos un QR legible en esa imagen. Probá con una foto más nítida.');
      setErrorEscaner(true);
    } finally {
      URL.revokeObjectURL(urlImagen);
      setLeyendoImagenQr(false);
    }
  };

  const cambiarCantidadQr = (id, cantidad) => {
    const item = items.find((linea) => linea.id === String(id) && !linea.color);
    if (!item) return;
    const nuevaCantidad = Math.min(Math.max(0, Math.floor(Number(cantidad) || 0)), item.stock);
    actualizarCantidad(item.lineaId, nuevaCantidad);

    if (!nuevaCantidad) {
      setUltimoProductoQrId('');
      reanudarEscaneo();
    }
  };

  const confirmarCompraQr = () => {
    if (!unidadesQr) return;
    setEscanerAbierto(false);
    navigate('/carrito');
  };

  // Al cerrar el diálogo se reinicia la pausa para la próxima apertura.
  useEffect(() => {
    if (escanerAbierto) return;
    escaneoPausadoRef.current = false;
    setEscaneoPausado(false);
    setUltimoProductoQrId('');
  }, [escanerAbierto]);

  // La cámara sólo está encendida mientras el diálogo está abierto y no hay
  // pausa: al leer un código el efecto se limpia (apaga la cámara) y al tocar
  // "Escanear otro" vuelve a ejecutarse (la enciende de nuevo).
  useEffect(() => {
    if (!escanerAbierto || escaneoPausado || leyendoImagenQr || !videoEscanerRef.current) return undefined;
    let cancelado = false;
    let controlesCamara;
    escanerProcesandoRef.current = false;
    setEstadoEscaner('Solicitando acceso a la cámara…');
    setErrorEscaner(false);
    const mostrarErrorCamara = (error) => {
      if (cancelado) return;
      const mensaje = error?.name === 'NotAllowedError'
        ? 'Permite el acceso a la cámara en tu navegador para escanear los productos.'
        : error?.name === 'NotFoundError'
        ? 'No se encontró una cámara disponible en este dispositivo.'
        : 'No se pudo iniciar la cámara. Verificá los permisos del navegador y volvé a intentar.';
      setEstadoEscaner(mensaje);
      setErrorEscaner(true);
    };
    const iniciarEscaner = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (cancelado || !videoEscanerRef.current) return;
        const lector = new BrowserQRCodeReader();
        const controles = await lector.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoEscanerRef.current,
          async (resultado) => {
            if (cancelado || !resultado || escanerProcesandoRef.current || escaneoPausadoRef.current) return;
            await procesarContenidoQr(resultado.getText());
          },
        );
        if (cancelado) { controles.stop(); return; }
        controlesCamara = controles;
        setEstadoEscaner((actual) => (actual === 'Solicitando acceso a la cámara…' ? 'Apuntá la cámara al código QR del producto.' : actual));
      } catch (error) {
        mostrarErrorCamara(error);
      }
    };
    iniciarEscaner();
    return () => {
      cancelado = true;
      controlesCamara?.stop();
      // Por si el lector no liberó el stream: se cortan las pistas a mano.
      const video = videoEscanerRef.current;
      const stream = video?.srcObject;
      if (stream && typeof stream.getTracks === 'function') stream.getTracks().forEach((pista) => pista.stop());
      if (video) video.srcObject = null;
    };
    // No se incluye procesarContenidoQr: cambia con el carrito y reiniciaría la cámara en cada lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escanerAbierto, escaneoPausado, leyendoImagenQr]);

  useEffect(() => {
    if (!escanerAbierto) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setEscanerAbierto(false);
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [escanerAbierto]);

  return {
    escanerAbierto,
    cerrarEscaner: () => setEscanerAbierto(false),
    estadoEscaner,
    errorEscaner,
    escaneoPausado,
    leyendoImagenQr,
    ultimoProductoQrId,
    itemQrEscaneado,
    carritoQr,
    unidadesQr,
    totalQr,
    videoEscanerRef,
    imagenQrInputRef,
    leerImagenQr,
    cambiarCantidadQr,
    reanudarEscaneo,
    confirmarCompraQr,
  };
}
