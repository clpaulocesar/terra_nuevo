// Icono de Material Symbols (por ligadura: "search", "expand_more"...). La fuente la
// carga index.html; hasta que main.jsx confirma que está lista (clase iconos-listas)
// el icono queda invisible para que no se lea la palabra en inglés.
// No usa la clase material-symbols-outlined de Google: esa regla fija el tamaño en
// 24 px fuera de capas y anularía las utilidades. El tamaño va siempre en className.
export default function IconoMaterial({ nombre, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`invisible inline-block shrink-0 font-iconos leading-none font-normal not-italic normal-case
        tracking-normal whitespace-nowrap select-none iconos-listas:visible ${className}`}
    >
      {nombre}
    </span>
  );
}
