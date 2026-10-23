// Interpreta una frase (voz o chat) y devuelve { destino, parametros }.
// Función pura: no toca el DOM ni el router, así se puede testear con `node --test`.
//
//   interpretarIntencion('mis pedidos', { ruta: '/catalogo', esMayorista: true })
//   -> { destino: 'misPedidos', parametros: {} }

import { DESTINOS, zonaDeDestino, zonaDeRuta } from './registroNavegacion.js';

// Chrome agrega puntuación automática al dictado ("Escanear.", "¿Ver ofertas?"):
// se quita la puntuación pegada al principio o al final de cada palabra, pero se
// conservan los puntos internos de tokens como correos (juan.perez@gmail.com).
export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,;:!?¡¿"'«»()]+(?=\s|$)/g, ' ')
    .replace(/(^|\s)[.,;:!?¡¿"'«»()]+/g, '$1')
    .replace(/[^a-z0-9ñ\s@._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARTICULOS = /^(un|una|unos|unas|el|la|los|las|al|del|de|a)\s+/;
const limpiarTermino = (termino) => String(termino || '').replace(ARTICULOS, '').trim();

// Comandos con parámetro. Se evalúan antes que los alias.
const CON_PARAMETRO = [
  // "ofertas de almohadas", "promociones en colchones", "almohadas en oferta":
  // búsqueda limitada a productos en oferta.
  { re: /^(?:ver\s+|mostrar\s+|mostrame\s+|quiero\s+)?(?:ofertas?|promociones?|promos?|descuentos?)\s+(?:de|en|para|del)\s+(.+)$/, destino: 'buscar', ofertas: true },
  { re: /^(?:ver\s+|mostrar\s+|mostrame\s+|quiero\s+|buscar\s+|busca\s+)?(.+?)\s+(?:en|con)\s+(?:ofertas?|promocion|descuento)$/, destino: 'buscar', ofertas: true },
  { re: /^(?:instrucciones|instruccion|manual)\s+(?:de\s+|del\s+|para\s+)?(.+)$/, destino: 'instrucciones' },
  { re: /^(?:como|cómo)\s+(?:se\s+)?(?:arma|armo|instalo|instala|monta|uso|usa)\s+(?:el\s+|la\s+|un\s+|una\s+|mi\s+)?(.+)$/, destino: 'instrucciones' },
  { re: /^(?:buscar|busca|buscame|encontrar|encuentra|quiero|mostrar|mostrame|muestrame|ver)\s+(.+)$/, destino: 'buscar' },
  { re: /^(?:categoria|linea)\s+(.+)$/, destino: 'categoria' },
];

// Palabras que, si aparecen como "ver X", no son búsqueda sino un destino.
const VER_DESTINO = ['ofertas', 'productos', 'catalogo', 'categorias', 'carrito', 'mis pedidos', 'mi cuenta', 'mi perfil', 'pedidos', 'clientes', 'reportes', 'almacen', 'personal', 'dashboard', 'resumen'];

// Preferencia por zona para alias repetidos (p. ej. "productos", "pedidos", "clientes").
function bonusZona(clave, contexto) {
  const zonaActual = zonaDeRuta(contexto.ruta);
  const zonaDestino = zonaDeDestino(clave);
  if (zonaActual === 'admin') return zonaDestino === 'admin' ? 5 : zonaDestino === 'vendedor' ? -5 : 0;
  if (zonaActual === 'vendedor') return zonaDestino === 'vendedor' ? 5 : zonaDestino === 'admin' ? -5 : 0;
  // Público o mayorista: nunca preferir el backoffice.
  if (zonaDestino === 'admin' || zonaDestino === 'vendedor') return -5;
  if (contexto.esMayorista && zonaDestino === 'mayorista') return 3;
  return 0;
}

export function interpretarIntencion(fraseOriginal, contexto = {}) {
  const frase = normalizar(fraseOriginal);
  if (!frase) return { destino: null, parametros: {} };

  // 1. Comandos con parámetro.
  for (const { re, destino, ofertas } of CON_PARAMETRO) {
    const m = frase.match(re);
    if (!m) continue;
    const termino = limpiarTermino(m[1]);
    if (!termino) continue;
    if (ofertas) return { destino: 'buscar', parametros: { termino, ofertas: true } };
    // "ver ofertas", "quiero ver mis pedidos", "ir al carrito": si lo que queda después
    // del verbo es un destino conocido (más palabras de relleno), no es una búsqueda.
    if (destino === 'buscar' && (VER_DESTINO.includes(termino) || esSoloDestino(termino))) break;
    if (destino === 'categoria' && Array.isArray(contexto.categorias) && contexto.categorias.length) {
      const coincide = contexto.categorias.find((c) => normalizar(c) === termino || normalizar(c).includes(termino));
      if (!coincide) return { destino: null, parametros: { categoriaDesconocida: termino } };
      return { destino: 'categoria', parametros: { categoria: coincide } };
    }
    return { destino, parametros: { termino } };
  }

  // 2. Alias: el más largo contenido en la frase, desempatado por zona.
  let mejor = null;
  for (const [clave, definicion] of Object.entries(DESTINOS)) {
    for (const alias of definicion.alias) {
      if (!contieneFrase(frase, alias)) continue;
      const puntaje = alias.length * 10 + bonusZona(clave, contexto);
      if (!mejor || puntaje > mejor.puntaje) mejor = { clave, alias, puntaje };
    }
  }
  if (!mejor) {
    // Sin destino conocido: una frase corta se toma como búsqueda de producto
    // ("almohadas", "colchón brillante"). Las largas no, para no buscar cualquier cosa.
    const palabras = frase.split(' ');
    if (palabras.length <= 4) return { destino: 'buscar', parametros: { termino: limpiarTermino(frase) } };
    return { destino: null, parametros: {} };
  }

  // "pedidos" para un mayorista con sesión en zona pública = sus pedidos.
  if (mejor.alias === 'pedidos' && contexto.esMayorista && zonaDeRuta(contexto.ruta) !== 'admin' && zonaDeRuta(contexto.ruta) !== 'vendedor') {
    return { destino: 'misPedidos', parametros: {} };
  }
  return { destino: mejor.clave, parametros: {} };
}

const RELLENO = new Set(['ver', 'ir', 'a', 'al', 'el', 'la', 'los', 'las', 'mi', 'mis', 'pagina', 'seccion', 'de', 'del', 'por', 'favor', 'abrir', 'abre', 'entrar', 'en']);

// true si el término es un alias de destino acompañado sólo de palabras de relleno.
function esSoloDestino(termino) {
  const f = ` ${termino} `;
  for (const definicion of Object.values(DESTINOS)) {
    for (const alias of definicion.alias) {
      if (!f.includes(` ${alias} `)) continue;
      const resto = f.replace(` ${alias} `, ' ').trim().split(/\s+/).filter(Boolean);
      if (resto.every((palabra) => RELLENO.has(palabra))) return true;
    }
  }
  return false;
}

// Coincidencia por palabras completas: "qr" no debe matchear dentro de "aqr...".
function contieneFrase(frase, alias) {
  const f = ` ${frase} `;
  const a = ` ${alias} `;
  return f.includes(a);
}

// "agregar al carrito confort lya", "añadir la segunda", "agregar" (sin nombre).
// Devuelve null si la frase no es un pedido de agregar; si no, { termino, ordinal }:
// termino = nombre del producto (puede ser ''), ordinal = posición 1..n si dijo
// "el primero", "la segunda", "el tercer producto"...
const ORDINALES = { primer: 1, primero: 1, primera: 1, segundo: 2, segunda: 2, tercer: 3, tercero: 3, tercera: 3, cuarto: 4, cuarta: 4, quinto: 5, quinta: 5, sexto: 6, sexta: 6 };
const RE_AGREGAR = /^(?:agregar|agrega|agregame|agregalo|añadir|añade|añadime|anadir|anade|anadime|poner|pone|poneme|sumar|suma|meter|mete)\b\s*(.*)$/;

export function interpretarAgregar(fraseOriginal) {
  const frase = normalizar(fraseOriginal);
  const m = frase.match(RE_AGREGAR);
  if (!m) return null;
  let resto = m[1]
    .replace(/^(?:al|a|en|en el|en mi|a mi|al mi)\s+carrito\b/, '')
    .replace(/\bal carrito\b|\ba mi carrito\b|\ben el carrito\b|\bcarrito\b/g, '')
    .replace(/\b(?:el|la|los|las|un|una|este|esta|ese|esa)\s+producto\b/g, '')
    .replace(/\bproducto\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const ordinalMatch = resto.match(/^(?:el|la)?\s*(primer|primero|primera|segundo|segunda|tercer|tercero|tercera|cuarto|cuarta|quinto|quinta|sexto|sexta)\b/);
  const ordinal = ordinalMatch ? ORDINALES[ordinalMatch[1]] : null;
  if (ordinal) resto = resto.replace(ordinalMatch[0], '').trim();
  resto = resto.replace(ARTICULOS, '').trim();
  return { termino: resto, ordinal };
}

// ---- Coincidencia tolerante entre lo dictado y el nombre de un producto ----
// El reconocedor escribe "Kit Lary" como "kit lari", "kit larry" o "quit lari". Se
// comparan versiones fonéticas (y/ll -> i, v -> b, z/ce/ci -> s, qu -> k, sin h ni
// letras repetidas) y se admite un error de una letra por palabra.
export function claveFonetica(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/qu/g, 'k').replace(/c([ei])/g, 's$1').replace(/c/g, 'k')
    .replace(/ll/g, 'i').replace(/y/g, 'i').replace(/v/g, 'b').replace(/z/g, 's')
    .replace(/h/g, '').replace(/x/g, 'ks').replace(/w/g, 'u').replace(/g([ei])/g, 'j$1')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function distancia(a, b) {
  if (a === b) return 0;
  const m = a.length; const n = b.length;
  if (!m) return n; if (!n) return m;
  let previa = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const actual = [i];
    for (let j = 1; j <= n; j += 1) {
      actual[j] = Math.min(previa[j] + 1, actual[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previa = actual;
  }
  return previa[n];
}

function palabraParecida(dicha, candidata) {
  if (!dicha || !candidata) return false;
  if (dicha === candidata || candidata.startsWith(dicha) && dicha.length >= 3) return true;
  const tolerancia = dicha.length >= 7 ? 2 : dicha.length >= 4 ? 1 : 0;
  return distancia(dicha, candidata) <= tolerancia;
}

// true si cada palabra dictada se parece a alguna palabra del nombre (o de la categoría).
export function coincideProducto(nombre, termino, extra = '') {
  const dichas = claveFonetica(termino).split(' ').filter(Boolean);
  if (!dichas.length) return false;
  const candidatas = claveFonetica(`${nombre} ${extra || ''}`).split(' ').filter(Boolean);
  if (!candidatas.length) return false;
  const nombreF = claveFonetica(nombre);
  if (nombreF === dichas.join(' ') || nombreF.includes(dichas.join(' '))) return true;
  return dichas.every((d) => candidatas.some((c) => palabraParecida(d, c)));
}

// Entre varios productos, el que mejor coincide (exacto > contiene > parecido).
export function elegirProducto(lista, termino, obtenerNombre = (p) => p.nombre, obtenerExtra = () => '') {
  const t = claveFonetica(termino);
  if (!t) return null;
  const exacto = lista.find((p) => claveFonetica(obtenerNombre(p)) === t);
  if (exacto) return exacto;
  const contiene = lista.find((p) => claveFonetica(obtenerNombre(p)).includes(t));
  if (contiene) return contiene;
  return lista.find((p) => coincideProducto(obtenerNombre(p), termino, obtenerExtra(p))) || null;
}
