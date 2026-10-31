import { useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';

export default function TutorialInvitacion({ abierto, onComenzar, onOmitir }) {
  const botonComenzarRef = useRef(null);
  const tarjetaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonComenzarRef.current?.focus();

    const manejarTeclas = (evento) => {
      if (evento.key === 'Escape') {
        onOmitir();
        return;
      }
      if (evento.key !== 'Tab') return;
      const enfocables = Array.from(
        tarjetaRef.current?.querySelectorAll('button:not([disabled])') || [],
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', manejarTeclas);

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', manejarTeclas);
    };
  }, [abierto, onOmitir]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/65 animate-terra-aparecer">
      <button
        type="button"
        className="absolute inset-0 bg-transparent border-0 p-0 cursor-default"
        onClick={onOmitir}
        tabIndex={-1}
        aria-hidden="true"
      />
      <section
        ref={tarjetaRef}
        className="relative w-full max-w-[26rem] p-6 sm:p-8 rounded-[1.25rem] bg-terra-superficie border border-terra-borde shadow-2xl text-center text-terra-texto animate-terra-aparecer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-invite-titulo"
      >
        <span
          className="inline-flex items-center justify-center w-14 h-14 mb-3.5 rounded-2xl bg-terra-primario-suave text-terra-primario"
          aria-hidden="true"
        >
          <BookOpen size={32} />
        </span>
        <p className="text-terra-xs font-extrabold uppercase tracking-wider text-terra-primario mb-1.5">
          Guía rápida
        </p>
        <h2 className="text-terra-xl font-black leading-tight text-terra-texto mb-2.5" id="tutorial-invite-titulo">
          Tutorial: uso de la web
        </h2>
        <p className="text-terra-sm leading-relaxed text-terra-texto-suave mb-5">
          Te mostramos paso a paso cómo buscar productos, usar las categorías,
          aprovechar las ofertas, comprar por QR, usar el carrito y preguntarle
          al asistente virtual.
        </p>
        <div className="grid gap-2.5">
          <button
            ref={botonComenzarRef}
            type="button"
            className="inline-flex items-center justify-center min-h-12 px-4 rounded-xl bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-sm font-extrabold cursor-pointer transition-colors"
            onClick={onComenzar}
          >
            Comenzar tutorial
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-12 px-4 rounded-xl bg-terra-control hover:bg-terra-control-hover border border-terra-borde text-terra-texto hover:text-terra-primario text-terra-sm font-extrabold cursor-pointer transition-colors"
            onClick={onOmitir}
          >
            Ahora no
          </button>
        </div>
        <small className="block text-terra-xs text-terra-texto-suave mt-4 leading-normal">
          Puedes repetirlo cuando quieras desde el botón Tutorial.
        </small>
      </section>
    </div>
  );
}
