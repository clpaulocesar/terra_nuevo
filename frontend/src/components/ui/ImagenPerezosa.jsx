import { useEffect, useRef, useState } from 'react';

// Imagen que sólo se descarga cuando está en pantalla (o a `margen` de entrar).
// El `loading="lazy"` nativo precarga con mucho margen (Chrome pide imágenes que
// están a más de 1000 px por debajo del viewport), así que en el catálogo acaba
// bajando casi toda la página. Con IntersectionObserver controlamos ese margen.
// Si el navegador no tiene IntersectionObserver, se carga con el lazy nativo.

const soportaObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;

// GIF transparente de 1x1: evita el icono de imagen rota y el texto alternativo
// mientras la imagen real todavía no se pidió.
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function ImagenPerezosa({ src, alt, className = '', margen = '200px', onError, onLoad, ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!soportaObserver);
  // Se guarda la URL que terminó de cargar: si cambia `src` (otro producto en la
  // misma tarjeta), `cargada` vuelve a false sin necesidad de un efecto.
  const [srcCargada, setSrcCargada] = useState(null);
  const cargada = srcCargada === src;

  useEffect(() => {
    if (visible) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: margen });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, margen]);

  const manejarCarga = (event) => {
    if (event.currentTarget.src === PLACEHOLDER) return;
    setSrcCargada(src);
    onLoad?.(event);
  };

  // data-cargada permite estilizar la espera (esqueleto, fundido) con variantes data-* y has-*.
  return (
    <img
      ref={ref}
      data-cargada={cargada}
      className={className}
      alt={alt}
      src={visible ? src : PLACEHOLDER}
      loading="lazy"
      decoding="async"
      onLoad={manejarCarga}
      onError={visible ? onError : undefined}
      {...resto}
    />
  );
}
