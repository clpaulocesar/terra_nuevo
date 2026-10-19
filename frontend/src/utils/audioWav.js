// Conversión de audio grabado en el navegador (webm/ogg/mp4) a WAV PCM 16 bits.
// Los modelos de voz (OpenRouter/Whisper) exigen WAV o MP3; MediaRecorder no genera WAV,
// así que decodificamos con Web Audio, remuestreamos a mono 16 kHz y escribimos la cabecera RIFF.

export const WAV_SAMPLE_RATE = 16000;

function escribirTexto(vista, offset, texto) {
  for (let i = 0; i < texto.length; i += 1) vista.setUint8(offset + i, texto.charCodeAt(i));
}

// Convierte un AudioBuffer (ya mono) en un Blob WAV PCM 16 bits little-endian.
export function audioBufferAWav(audioBuffer) {
  const canales = audioBuffer.numberOfChannels;
  const frames = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;

  // Mezcla a mono promediando canales (si viniera estéreo).
  const muestras = new Float32Array(frames);
  for (let c = 0; c < canales; c += 1) {
    const datos = audioBuffer.getChannelData(c);
    for (let i = 0; i < frames; i += 1) muestras[i] += datos[i] / canales;
  }

  const bytesPorMuestra = 2;
  const tamanoDatos = frames * bytesPorMuestra;
  const buffer = new ArrayBuffer(44 + tamanoDatos);
  const vista = new DataView(buffer);

  escribirTexto(vista, 0, 'RIFF');
  vista.setUint32(4, 36 + tamanoDatos, true);
  escribirTexto(vista, 8, 'WAVE');
  escribirTexto(vista, 12, 'fmt ');
  vista.setUint32(16, 16, true); // tamaño del bloque fmt
  vista.setUint16(20, 1, true); // PCM
  vista.setUint16(22, 1, true); // mono
  vista.setUint32(24, sampleRate, true);
  vista.setUint32(28, sampleRate * bytesPorMuestra, true); // byte rate
  vista.setUint16(32, bytesPorMuestra, true); // block align
  vista.setUint16(34, 16, true); // bits por muestra
  escribirTexto(vista, 36, 'data');
  vista.setUint32(40, tamanoDatos, true);

  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    const s = Math.max(-1, Math.min(1, muestras[i]));
    vista.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += bytesPorMuestra;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Decodifica el blob grabado y lo remuestrea a mono `sampleRate` con un OfflineAudioContext.
export async function convertirAudioAWav(blob, { sampleRate = WAV_SAMPLE_RATE } = {}) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('Este navegador no permite procesar audio.');

  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new Ctx();
  let decodificado;
  try {
    decodificado = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close?.();
  }

  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let bufferFinal = decodificado;
  if (OfflineCtx && (decodificado.sampleRate !== sampleRate || decodificado.numberOfChannels !== 1)) {
    const frames = Math.ceil(decodificado.duration * sampleRate);
    const offline = new OfflineCtx(1, Math.max(frames, 1), sampleRate);
    const fuente = offline.createBufferSource();
    fuente.buffer = decodificado;
    fuente.connect(offline.destination);
    fuente.start(0);
    bufferFinal = await offline.startRendering();
  }

  return audioBufferAWav(bufferFinal);
}
