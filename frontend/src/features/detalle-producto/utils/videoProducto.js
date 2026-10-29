// Video del producto: YouTube se muestra en un iframe; cualquier otra URL, en <video>.

export function videoIncrustado(url) {
  const coincidencia = String(url || '').match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return coincidencia ? `https://www.youtube.com/embed/${coincidencia[1]}` : null;
}

// En bucle y sin sonido: YouTube solo repite un video si se lo pasa también como playlist.
export function urlVideoEnBucle(embed) {
  return embed ? `${embed}?autoplay=1&mute=1&loop=1&playlist=${embed.split('/').pop()}` : null;
}
