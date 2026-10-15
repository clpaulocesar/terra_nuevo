// Utilidad compartida por el detalle de cliente y la vista previa del admin
// para mostrar el video de un producto (YouTube, Vimeo o archivo directo).

export function mediaDeVideo(url) {
  const valor = String(url || '').trim();
  if (!valor) return null;

  // 1. YouTube Shorts
  const youtubeShorts = valor.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (youtubeShorts) {
    return { tipo: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtubeShorts[1]}?rel=0` };
  }

  // 2. YouTube estándar (watch?v=..., youtu.be/..., embed/...)
  const youtube = valor.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
  if (youtube) {
    return { tipo: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0` };
  }

  // 3. Vimeo
  const vimeo = valor.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return { tipo: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  // 4. Archivos directos de video (Cloudinary, Supabase, mp4, webm, ogg, mov, m4v)
  const esArchivoVideo =
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(valor) ||
    /cloudinary\.com\/.*\/video\/upload\//i.test(valor) ||
    /storage\/v1\/object\/public\/.*(video|\.mp4|\.webm|\.mov)/i.test(valor);

  if (esArchivoVideo) {
    let mime = 'video/mp4';
    if (/\.webm(\?.*)?$/i.test(valor)) mime = 'video/webm';
    else if (/\.ogg(\?.*)?$/i.test(valor)) mime = 'video/ogg';
    else if (/\.mov(\?.*)?$/i.test(valor)) mime = 'video/quicktime';
    return { tipo: 'archivo', src: valor, mime };
  }

  // 5. Fallback para cualquier URL http/https guardada en campo video_url
  if (/^https?:\/\//i.test(valor)) {
    return { tipo: 'archivo', src: valor, mime: 'video/mp4' };
  }

  return null;
}
