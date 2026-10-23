export const SELECTORES_TUTORIAL = {
  buscador: '[data-tour="buscador"]',
  categorias: '[data-tour="categorias"]',
  ofertas: '[data-tour="ofertas"]',
  ordenar: '[data-tour="ordenar"]',
  producto: '[data-tour="producto"]',
  agregar: '[data-tour="agregar"]',
  carrito: ['[data-tour="carrito"]'],
  iniciarSesion: '[data-tour="iniciar-sesion"]',
  menuMovil: '[data-tour="menu-movil"]',
};

export function construirPasosTutorial({ esMovil = false, esMayorista = false } = {}) {
  const pasos = [
    {
      selectores: [SELECTORES_TUTORIAL.buscador],
      titulo: 'Buscador',
      descripcion: 'Escribe el nombre del producto que buscas. También puedes dictarlo con el micrófono.',
      lado: 'bottom',
    },
    {
      selectores: [SELECTORES_TUTORIAL.categorias],
      titulo: 'Categorías',
      descripcion: 'Explora el catálogo por categoría: colchones, almohadas, muebles y más.',
      lado: 'bottom',
    },
    {
      selectores: [SELECTORES_TUTORIAL.ofertas],
      titulo: 'Ofertas',
      descripcion: 'Aquí encuentras los productos con descuento y las promociones del momento.',
      lado: 'bottom',
    },
    {
      selectores: [SELECTORES_TUTORIAL.ordenar],
      titulo: 'Ordenar',
      descripcion: 'Organiza los productos por precio, nombre o los más recomendados.',
      lado: 'bottom',
    },
    {
      selectores: [SELECTORES_TUTORIAL.producto],
      titulo: 'Producto',
      descripcion: 'Toca un producto para ver sus imágenes, descripción, colores y precio.',
    },
    {
      selectores: [SELECTORES_TUTORIAL.agregar],
      titulo: 'Agregar al carrito',
      descripcion: 'Agrega el producto al carrito. Puedes ajustar la cantidad antes de continuar.',
    },
    {
      selectores: SELECTORES_TUTORIAL.carrito,
      titulo: 'Carrito',
      descripcion: 'Revisa tus productos, modifica cantidades y comprueba el total de tu compra.',
    },
  ];

  if (!esMayorista) {
    pasos.push({
      selectores: esMovil ? [SELECTORES_TUTORIAL.menuMovil] : [SELECTORES_TUTORIAL.iniciarSesion],
      titulo: 'Iniciar sesión',
      descripcion: esMovil
        ? 'Abre este menú y toca Iniciar sesión para entrar a tu cuenta.'
        : 'Ingresa a tu cuenta para comprar como mayorista y acceder a tus pedidos.',
    });
  }

  return pasos;
}
