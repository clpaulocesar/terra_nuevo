// Colores de un producto para las muestras de la tarjeta. Acepta registros como
// objeto ({ nombre, valor }), JSON en texto o "Nombre|#hex". Solo devuelve colores
// con un hex válido y sin repetir.
export function coloresDeProducto(producto) {
  const registros = Array.isArray(producto?.colores) ? producto.colores : [];
  const lista = [];
  const vistos = new Set();
  for (const registro of registros) {
    let nombre = '';
    let valor = '';
    if (registro && typeof registro === 'object') {
      nombre = String(registro.nombre || registro.name || '').trim();
      valor = String(registro.valor || registro.color || '').trim();
    } else {
      const texto = String(registro || '').trim();
      try {
        const dato = JSON.parse(texto);
        nombre = String(dato?.nombre || dato?.name || '').trim();
        valor = String(dato?.valor || dato?.color || '').trim();
      } catch {
        const [parte1, parte2] = texto.split('|');
        nombre = (parte2 ? parte1 : parte1) || 'Color';
        valor = parte2 || parte1;
      }
    }
    const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor) ? valor : '';
    if (!hex) continue;
    const clave = (nombre || hex).toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push({ nombre: nombre || 'Color', valor: hex });
  }
  return lista;
}

// "oferta de toallas" / "ofertas en almohadas" / "toallas en oferta" -> { termino: 'toallas', ofertas: true }
export function separarOfertasDeBusqueda(texto) {
  const limpio = String(texto || '').trim();
  const sinAcento = limpio.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const delante = sinAcento.match(/^(?:ofertas?|promociones?|promos?|descuentos?)\s+(?:de|en|para|del)\s+(.+)$/);
  if (delante) return { termino: limpio.slice(limpio.length - delante[1].length).trim(), ofertas: true };
  const detras = sinAcento.match(/^(.+?)\s+(?:en|con)\s+(?:ofertas?|promocion|descuento)$/);
  if (detras) return { termino: limpio.slice(0, detras[1].length).trim(), ofertas: true };
  return { termino: limpio, ofertas: false };
}
