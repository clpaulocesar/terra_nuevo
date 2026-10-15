// Utilidad compartida por el detalle de cliente y la vista previa del admin
// para mostrar el video de un producto (YouTube, Vimeo o archivo directo).

export function mediaDeVideo(url) {
  const valor = String(url || '').trim();
  if (!valor) return null;

  const youtube = valor.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&/]+)/i);
  if (youtube) return { tipo: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0` };

  const vimeo = valor.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { tipo: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}` };

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(valor)) return { tipo: 'archivo', src: valor };

  return null;
}
