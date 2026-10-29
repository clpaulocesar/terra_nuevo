import { useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import './tutorial.css';

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
    <div className="tutorial-invite">
      <button
        type="button"
        className="tutorial-invite__fondo"
        onClick={onOmitir}
        tabIndex={-1}
        aria-hidden="true"
      />
      <section
        ref={tarjetaRef}
        className="tutorial-invite__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-invite-titulo"
      >
        <span className="tutorial-invite__icono" aria-hidden="true">
          <BookOpen size={36} />
        </span>
        <p className="tutorial-invite__etiqueta">Guía rápida</p>
        <h2 className="tutorial-invite__titulo" id="tutorial-invite-titulo">
          Tutorial: uso de la web
        </h2>
        <p className="tutorial-invite__texto">
          Te mostramos paso a paso cómo buscar productos, usar las categorías,
          aprovechar las ofertas, comprar por QR, usar el carrito y preguntarle
          al asistente virtual.
        </p>
        <div className="tutorial-invite__acciones">
          <button
            ref={botonComenzarRef}
            type="button"
            className="tutorial-invite__boton tutorial-invite__boton--principal"
            onClick={onComenzar}
          >
            Comenzar tutorial
          </button>
          <button
            type="button"
            className="tutorial-invite__boton"
            onClick={onOmitir}
          >
            Ahora no
          </button>
        </div>
        <small className="tutorial-invite__nota">
          Puedes repetirlo cuando quieras desde el botón Tutorial.
        </small>
      </section>
    </div>
  );
}
