export const categorias = [
  { id: '', nombre: 'Todos', icon: 'apps', emoji: '✨' },
];

export function obtenerIconoCategoria(nombre) {
  const n = (nombre || '').toLowerCase();
  if (!nombre || n === 'todos') return 'apps';
  if (n.includes('colch')) return 'bed';
  if (n.includes('somm') || n.includes('somier')) return 'layers';
  if (n.includes('cama') || n.includes('dorm')) return 'bedroom_parent';
  if (n.includes('almohad')) return 'hotel';
  if (n.includes('ropa') || n.includes('saban') || n.includes('textil')) return 'texture';
  if (n.includes('mueble') || n.includes('living') || n.includes('sofa') || n.includes('sillon')) return 'chair';
  if (n.includes('espald') || n.includes('cabec') || n.includes('respald')) return 'vertical_split';
  if (n.includes('recamier') || n.includes('banquet')) return 'weekend';
  if (n.includes('promo') || n.includes('oferta')) return 'star';
  return 'category';
}

export function emojiCategoria(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n.includes('colch')) return '🛏️';
  if (n.includes('somm') || n.includes('somier')) return '🛋️';
  if (n.includes('cama') || n.includes('dorm')) return '🛏️';
  if (n.includes('almohad')) return '☁️';
  if (n.includes('ropa') || n.includes('saban')) return '🧺';
  if (n.includes('mueble') || n.includes('living')) return '🪑';
  if (n.includes('espald') || n.includes('respald')) return '🖼️';
  if (n.includes('recamier')) return '🛋️';
  if (n.includes('promo')) return '⭐';
  return '📦';
}
