import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import './accesibilidad.css';

// Botones de la cabecera: lectura por voz (altavoz) y comandos de voz (micrófono).
export default function BotonesVoz({ className = '' }) {
  const { soportaVoz, soportaReconocimiento, vozActiva, escuchando, alternarVoz, escuchar } = useAccesibilidad();
  if (!soportaVoz && !soportaReconocimiento) return null;
  return (
    <div className={`terra-voz ${className}`.trim()} role="group" aria-label="Accesibilidad por voz">
      {soportaVoz && (
        <button
          type="button"
          className={`terra-theme-btn terra-voz__btn ${vozActiva ? 'terra-theme-btn--on' : ''}`}
          onClick={alternarVoz}
          aria-pressed={vozActiva}
          aria-label={vozActiva ? 'Desactivar lectura por voz' : 'Activar lectura por voz'}
          title={vozActiva ? 'Desactivar lectura por voz' : 'Activar lectura por voz'}
        >
          {vozActiva ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
      {soportaReconocimiento && (
        <button
          type="button"
          className={`terra-theme-btn terra-voz__btn ${escuchando ? 'terra-theme-btn--on terra-voz__btn--escuchando' : ''}`}
          onClick={escuchar}
          aria-pressed={escuchando}
          aria-label={escuchando ? 'Dejar de escuchar' : 'Decir un comando de voz'}
          title={escuchando ? 'Escuchando… tocá para cancelar' : 'Comando de voz: decí "ayuda" para conocer las opciones'}
        >
          {escuchando ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      )}
    </div>
  );
}
