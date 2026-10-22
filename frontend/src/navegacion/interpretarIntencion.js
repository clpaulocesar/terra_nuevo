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
