import { Fragment } from 'react';

// Renderizador mínimo del markdown que devuelve el agente de n8n:
// imágenes ![alt](url), enlaces [texto](url), negritas **t** / *t* y saltos de línea.
// No usa dangerouslySetInnerHTML: todo se construye como elementos React y
// solo se aceptan URLs http(s) para imágenes y enlaces.

const URL_SEGURA = /^https?:\/\//i;
const INLINE = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;

function renderInline(texto, keyBase) {
  const nodos = [];
  let ultimo = 0;
  let i = 0;

  for (const m of texto.matchAll(INLINE)) {
    if (m.index > ultimo) nodos.push(texto.slice(ultimo, m.index));
    const key = `${keyBase}-${i++}`;

    if (m[2] !== undefined) {
      // Imagen
      if (URL_SEGURA.test(m[2])) {
        nodos.push(
          <img
            key={key}
            className="block max-w-full max-h-[13.75rem] my-1.5 rounded-terra-boton border border-terra-borde object-cover bg-terra-superficie-2"
            src={m[2]}
            alt={m[1] || 'Imagen'}
            loading="lazy"
            referrerPolicy="no-referrer"
          />,
        );
      } else {
        nodos.push(m[1]);
      }
    } else if (m[4] !== undefined) {
      // Enlace
      if (URL_SEGURA.test(m[4])) {
        nodos.push(
          <a
            key={key}
            href={m[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terra-primario hover:underline font-semibold"
          >
            {m[3]}
          </a>,
        );
      } else {
        nodos.push(m[3]);
      }
    } else {
      // Negrita (** o *)
      nodos.push(<strong key={key}>{m[5] ?? m[6]}</strong>);
    }
    ultimo = m.index + m[0].length;
  }

  if (ultimo < texto.length) nodos.push(texto.slice(ultimo));
  return nodos;
}

export default function MensajeMarkdown({ texto }) {
  if (!texto) return null;
  const lineas = String(texto).replace(/\r\n/g, '\n').split('\n');

  return lineas.map((linea, idx) => (
    <Fragment key={idx}>
      {renderInline(linea, `l${idx}`)}
      {idx < lineas.length - 1 && '\n'}
    </Fragment>
  ));
}
