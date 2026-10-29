// Colores de un producto (selector de la galería). La ficha los tiene ocultos a
// propósito (MOSTRAR_COLORES en useColoresProducto.js): se trabaja solo con imágenes.

export const COLORES_BASE = [
  { nombre: 'Gris marengo', valor: '#54595f' },
  { nombre: 'Gris perla', valor: '#9b9b9b' },
  { nombre: 'Azul petróleo', valor: '#455a64' },
  { nombre: 'Terracota', valor: '#8d5b4c' },
];

export const COLORES_CUADROS = [
  { nombre: 'Blanco humo', valor: '#f1efe9' },
  { nombre: 'Negro azabache', valor: '#211d1d' },
  { nombre: 'Grafito', valor: '#3a3f44' },
  { nombre: 'Arena', valor: '#cbb894' },
  { nombre: 'Chocolate', valor: '#5a3b2a' },
  { nombre: 'Borgoña', valor: '#8e2828' },
  { nombre: 'Azul noche', valor: '#233a63' },
  { nombre: 'Celeste', valor: '#8fb8d8' },
  { nombre: 'Verde bosque', valor: '#2f5233' },
  { nombre: 'Verde oliva', valor: '#5d6b4f' },
  { nombre: 'Mostaza', valor: '#cf8a2b' },
  { nombre: 'Rosa empolvado', valor: '#d9a5a0' },
];

export function valorDeColor(nombre) {
  const texto = String(nombre || '').trim();
  if (!texto) return null;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(texto)) return texto;
  if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('color', texto)) return texto;
  const base = [...COLORES_BASE, ...COLORES_CUADROS].find(
    (c) => c.nombre.toLowerCase() === texto.toLowerCase(),
  );
  return base?.valor || null;
}

// Un registro puede ser { nombre, valor } (admin), { color } (product_variants),
// un JSON serializado en TEXT[] o un texto "nombre|valor".
function leerRegistro(registro) {
  if (registro && typeof registro === 'object' && typeof registro.valor === 'string') {
    const nombre = String(registro.nombre || registro.name || '').trim() || 'Color';
    return { nombre, crudo: registro.valor || registro.color || nombre };
  }
  if (registro && typeof registro === 'object') {
    const nombre = String(registro.color || registro.name || '').trim() || 'Color';
    return { nombre, crudo: registro.color || registro.name || '' };
  }
  const texto = String(registro || '').trim();
  try {
    const dato = JSON.parse(texto);
    const nombre = String(dato?.nombre || dato?.name || '').trim() || 'Color';
    return { nombre, crudo: dato?.valor || dato?.color || nombre };
  } catch {
    const [parte1, parte2] = texto.split('|');
    return { nombre: parte1 || 'Color', crudo: parte2 || parte1 };
  }
}

// Solo los colores registrados para el producto (colores del admin y variantes),
// sin repetir nombres y descartando los que no se pueden pintar.
export function coloresDeProducto(producto) {
  const registros = [
    ...(Array.isArray(producto?.colores) ? producto.colores : []),
    ...(Array.isArray(producto?.variantes) ? producto.variantes : []),
  ];
  const lista = [];
  const vistos = new Set();
  for (const registro of registros) {
    const { nombre, crudo } = leerRegistro(registro);
    const valor = valorDeColor(crudo || nombre);
    if (!valor) continue;
    const clave = String(nombre).toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push({ nombre: String(nombre).trim() || 'Color', valor });
  }
  return lista;
}
