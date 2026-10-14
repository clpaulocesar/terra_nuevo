export const categorias = [
  { id: '', nombre: 'Todos', icon: 'apps', emoji: '✨' },
  { id: 'Colchones', nombre: 'Colchones', icon: 'bed', emoji: '🛏️' },
  { id: 'Sommiers', nombre: 'Sommiers', icon: 'layers', emoji: '🛋️' },
  { id: 'Camas', nombre: 'Camas', icon: 'bedroom_parent', emoji: '🛏️' },
  { id: 'Almohadas', nombre: 'Almohadas', icon: 'hotel', emoji: '☁️' },
  { id: 'Ropa de cama', nombre: 'Ropa de cama', icon: 'texture', emoji: '🧺' },
  { id: 'Muebles', nombre: 'Muebles', icon: 'chair', emoji: '🪑' },
  { id: 'Promociones', nombre: 'Promociones', icon: 'star', emoji: '⭐', especial: true },
];

export function emojiCategoria(nombre) {
  return categorias.find((item) => item.id === nombre)?.emoji || '📦';
}