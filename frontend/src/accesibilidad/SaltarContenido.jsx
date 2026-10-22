// Enlace "Saltar al contenido": primer elemento enfocable de cada layout. Es invisible
// hasta recibir foco con Tab y lleva a <main id="contenido">. Estilos en
// components/accesibilidad/accesibilidad.css (.terra-skip-link).
export default function SaltarContenido({ destino = 'contenido' }) {
  const alActivar = (evento) => {
    const objetivo = document.getElementById(destino);
    if (!objetivo) return;
    evento.preventDefault();
    if (!objetivo.hasAttribute('tabindex')) objetivo.setAttribute('tabindex', '-1');
    objetivo.focus({ preventScroll: false });
    objetivo.scrollIntoView?.({ block: 'start' });
  };
  return <a className="terra-skip-link" href={`#${destino}`} onClick={alActivar}>Saltar al contenido</a>;
}
