// Nombre accesible aproximado de un elemento, en el orden en que lo calculan
// los lectores de pantalla: aria-label, aria-labelledby, alt, title, texto visible.
const INTERACTIVOS = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="option"], [role="tab"], [role="menuitem"], [tabindex]:not([tabindex="-1"])';

export function esInteractivo(elemento) {
  return Boolean(elemento?.matches?.(INTERACTIVOS));
}

export function elementoInteractivoDesde(objetivo) {
  if (!objetivo || typeof objetivo.closest !== 'function') return null;
  return objetivo.closest(INTERACTIVOS);
}

function textoLimpio(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

const SIN_LECTURA = '.material-symbols-outlined, .material-symbols-rounded, .material-icons, svg, script, style, [aria-hidden="true"]';

// Omite ligaduras de iconos y contenido oculto al formar los avisos del lector propio.
export function textoVisible(elemento) {
  if (!elemento) return '';
  if (elemento.nodeType === 3) return elemento.textContent || '';
  if (elemento.nodeType !== 1 || elemento.matches?.(SIN_LECTURA)) return '';
  const partes = [];
  for (const hijo of elemento.childNodes) {
    if (hijo.nodeType === 3) partes.push(hijo.textContent || '');
    else if (hijo.nodeType === 1) {
      if (hijo.matches?.(SIN_LECTURA)) continue;
      const alt = hijo.matches?.('img') ? textoLimpio(hijo.getAttribute('alt')) : '';
      partes.push(alt || textoVisible(hijo));
    }
  }
  return partes.join(' ');
}

export function nombreAccesible(elemento) {
  if (!elemento) return '';
  const aria = textoLimpio(elemento.getAttribute?.('aria-label'));
  if (aria) return aria;
  const labelledBy = elemento.getAttribute?.('aria-labelledby');
  if (labelledBy) {
    const texto = labelledBy.split(/\s+/).map((id) => textoLimpio(document.getElementById(id)?.textContent)).filter(Boolean).join(' ');
    if (texto) return texto;
  }
  if (elemento.matches?.('input, select, textarea')) {
    const porId = elemento.id ? document.querySelector(`label[for="${CSS.escape(elemento.id)}"]`) : null;
    const etiqueta = textoLimpio(porId?.textContent || elemento.closest('label')?.textContent);
    if (etiqueta) return etiqueta;
    const placeholder = textoLimpio(elemento.getAttribute('placeholder'));
    if (placeholder) return placeholder;
  }
  const img = elemento.matches?.('img') ? elemento : elemento.querySelector?.('img[alt]');
  const alt = textoLimpio(img?.getAttribute?.('alt'));
  const visible = textoLimpio(textoVisible(elemento));
  if (visible) return visible;
  if (alt) return alt;
  return textoLimpio(elemento.getAttribute?.('title'));
}

// Rol en español para leer después del nombre ("Carrito, enlace").
export function rolLegible(elemento) {
  if (!elemento) return '';
  const rol = elemento.getAttribute?.('role');
  if (rol === 'option') return elemento.getAttribute('aria-selected') === 'true' ? 'opción, seleccionada' : 'opción';
  if (rol === 'tab') return 'pestaña';
  if (rol === 'menuitem') return 'opción de menú';
  if (elemento.matches?.('a[href], [role="link"]')) return 'enlace';
  if (elemento.matches?.('button, [role="button"], summary')) {
    const expandido = elemento.getAttribute('aria-expanded');
    const pulsado = elemento.getAttribute('aria-pressed');
    if (expandido === 'true') return 'botón, desplegado';
    if (expandido === 'false') return 'botón, contraído';
    if (pulsado === 'true') return 'botón, activado';
    return elemento.disabled ? 'botón, desactivado' : 'botón';
  }
  if (elemento.matches?.('input[type="checkbox"]')) return elemento.checked ? 'casilla, marcada' : 'casilla, sin marcar';
  if (elemento.matches?.('input[type="radio"]')) return elemento.checked ? 'opción, marcada' : 'opción';
  if (elemento.matches?.('input, textarea')) return 'campo de texto';
  if (elemento.matches?.('select')) return 'lista desplegable';
  if (elemento.matches?.('article')) return 'tarjeta';
  return '';
}
