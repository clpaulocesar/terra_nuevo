export function normalizarCategoria(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function coincideCategoriaProducto(prod, categoriaFiltro) {
  if (!categoriaFiltro || categoriaFiltro === 'todas') return true;
  if (categoriaFiltro === 'ofertas') return Boolean(prod?.enOferta);

  const cFiltroNorm = normalizarCategoria(categoriaFiltro);
  const cProdNorm = normalizarCategoria(prod?.categoria);
  const cKeyNorm = normalizarCategoria(prod?.categoriaKey);
  const nombreNorm = normalizarCategoria(prod?.nombre);
  const sublineaNorm = normalizarCategoria(prod?.sublinea);
  const descNorm = normalizarCategoria(prod?.descripcion);

  // Coincidencia directa o contenida
  if (cProdNorm === cFiltroNorm || cKeyNorm === cFiltroNorm) return true;
  if (cProdNorm.includes(cFiltroNorm) || cFiltroNorm.includes(cProdNorm)) return true;
  if (cKeyNorm.includes(cFiltroNorm) || cFiltroNorm.includes(cKeyNorm)) return true;

  // Si el nombre, sublínea o descripción contiene la categoría
  if (cFiltroNorm.length >= 3) {
    if (nombreNorm.includes(cFiltroNorm) || sublineaNorm.includes(cFiltroNorm) || descNorm.includes(cFiltroNorm)) {
      return true;
    }
  }

  // Mapeos semánticos de compatibilidad para el catálogo TERRA
  const ALIASES = {
    colchon: ['colchon', 'sommier', 'somier', 'dormitorio', 'espaldar', 'cama', 'almohada'],
    somier: ['somier', 'sommier', 'colchon', 'base', 'cama', 'dormitorio'],
    sommier: ['somier', 'sommier', 'colchon', 'base', 'cama', 'dormitorio'],
    espaldar: ['espaldar', 'cabecero', 'respaldo', 'dormitorio'],
    recamier: ['recamier', 'banqueta', 'pie de cama', 'sofa', 'sala'],
    poltrona: ['poltrona', 'reclinable', 'sillon', 'sofa', 'sala', 'butaca'],
    sofas: ['sofa', 'poltrona', 'recamier', 'sala', 'living'],
    sofa: ['sofa', 'poltrona', 'recamier', 'sala', 'living'],
    accesorios: ['almohada', 'accesorio', 'toalla', 'alfombra', 'cojin', 'protector', 'cuadro', 'deco'],
    almohadas: ['almohada', 'accesorio', 'cojin', 'ergonomica', 'cervical'],
    almohada: ['almohada', 'accesorio', 'cojin', 'ergonomica', 'cervical'],
    toalla: ['toalla', 'bano', 'textil', 'accesorios'],
    alfombra: ['alfombra', 'tapete', 'decoracion', 'sala'],
    muebles: ['mueble', 'comedor', 'mesa', 'silla', 'estante', 'rack', 'escritorio', 'buffet'],
    comedores: ['comedor', 'mesa', 'silla', 'buffet', 'muebles'],
    comedor: ['comedor', 'mesa', 'silla', 'buffet', 'muebles'],
    cuadros: ['cuadro', 'arte', 'decoracion', 'espejo'],
    cuadrosydeco: ['cuadro', 'arte', 'decoracion', 'espejo', 'alfombra'],
    cuadrosydecoracion: ['cuadro', 'arte', 'decoracion', 'espejo', 'alfombra'],
    oficina: ['oficina', 'escritorio', 'estudio', 'librero', 'archivador'],
  };

  for (const [clave, sinonimos] of Object.entries(ALIASES)) {
    if (cFiltroNorm.includes(clave) || clave.includes(cFiltroNorm)) {
      if (sinonimos.some((s) => cProdNorm.includes(s) || cKeyNorm.includes(s) || nombreNorm.includes(s) || sublineaNorm.includes(s))) {
        return true;
      }
    }
  }

  return false;
}
