// Registro único de destinos de navegación. Lo usan el lector de voz
// (LectorVoz.jsx) y el chatbot (ChatAsistente.jsx) a través de NavegacionContext.
// Cada destino tiene una clave estable; nunca se navega a una URL que no esté aquí.
//
//   acceso: 'publico' | 'mayorista' | 'sesion' (cualquier sesión) | [roles del backoffice]
//   ruta:   a dónde navegar.   accion: en vez de ruta, una acción del contexto.
//   alias:  frases (sin acentos, en minúsculas) que disparan el destino.

export const DESTINOS = {
  inicio:          { ruta: '/',                      nombre: 'Inicio',                       acceso: 'publico',   alias: ['inicio', 'principal', 'portada', 'volver al inicio', 'pagina principal'] },
  catalogo:        { ruta: '/catalogo',              nombre: 'Catálogo de productos',        acceso: 'publico',   alias: ['catalogo', 'productos', 'colchones', 'sommiers', 'somieres', 'camas', 'ver productos'] },
  ofertas:         { ruta: '/catalogo?ofertas=1',    nombre: 'Ofertas',                      acceso: 'publico',   alias: ['ofertas', 'promociones', 'en oferta', 'descuentos', 'ver ofertas', 'rebajas'] },
  categorias:      { ruta: '/categorias',            nombre: 'Líneas y categorías',          acceso: 'publico',   alias: ['categorias', 'lineas', 'lineas y categorias'] },
  carrito:         { ruta: '/carrito',               nombre: 'Carrito de compras',           acceso: 'publico',   alias: ['carrito', 'mi compra', 'mi pedido', 'finalizar', 'finalizar compra', 'confirmar compra', 'generar pedido', 'pagar'] },
  escanear:        { ruta: '/catalogo?abrirQr=1',    nombre: 'Escáner QR',                   acceso: 'publico',   alias: ['escanear', 'qr', 'camara', 'codigo qr', 'escaner'] },

  loginMayorista:  { accion: 'abrirLoginMayorista',  nombre: 'Inicio de sesión mayorista',   acceso: 'publico',   alias: ['soy mayorista', 'cliente mayorista', 'iniciar sesion', 'entrar a mi cuenta', 'login mayorista', 'ingresar como mayorista', 'mayorista'] },
  miCuenta:        { ruta: '/mi-cuenta',             nombre: 'Mi panel mayorista',           acceso: 'mayorista', alias: ['mi cuenta', 'mi panel', 'panel mayorista', 'mi panel mayorista'] },
  miPerfil:        { ruta: '/mi-cuenta/perfil',      nombre: 'Mi perfil',                    acceso: 'mayorista', alias: ['mi perfil', 'mis datos', 'datos de facturacion', 'mi perfil y datos'] },
  misPedidos:      { ruta: '/mi-cuenta/pedidos',     nombre: 'Mis pedidos',                  acceso: 'mayorista', alias: ['mis pedidos', 'historial de pedidos', 'mis compras'] },

  loginAdmin:      { ruta: '/admin/login',           nombre: 'Acceso de administrador',      acceso: 'publico',   alias: ['soy administrador', 'administrador', 'backoffice', 'panel de administracion', 'login administrador', 'soy admin', 'ingresar como administrador'] },
  loginVendedor:   { ruta: '/vendedor/login',        nombre: 'Acceso de vendedor',           acceso: 'publico',   alias: ['soy vendedor', 'vendedor', 'login vendedor', 'ingresar como vendedor', 'portal comercial'] },

  adminDashboard:  { ruta: '/admin',                 nombre: 'Dashboard',                    acceso: ['admin', 'vendedor'], alias: ['dashboard', 'resumen', 'tablero', 'panel principal'] },
  adminDespacho:   { ruta: '/admin/despacho',        nombre: 'Despacho a domicilio',          acceso: ['admin', 'despacho'], alias: ['despacho', 'envios', 'entregas', 'reparto', 'envios a domicilio', 'logistica', 'salir a entregar'] },
  adminRepartidores: { ruta: '/admin/repartidores',  nombre: 'Repartidores',                  acceso: ['admin'], alias: ['repartidores', 'choferes', 'vehiculos', 'placas', 'asignar envios', 'asignar repartidor'] },
  adminPedidos:    { ruta: '/admin/pedidos',         nombre: 'Pedidos',                      acceso: ['admin', 'vendedor'], alias: ['pedidos', 'ordenes'] },
  adminVentas:     { ruta: '/admin/ventas-directas', nombre: 'Ventas directas',              acceso: ['admin', 'vendedor'],             alias: ['ventas directas', 'venta en mostrador', 'cobrar', 'ventas'] },
  adminProductos:  { ruta: '/admin/productos',       nombre: 'Productos',                    acceso: ['admin'],                         alias: ['productos', 'inventario de productos', 'catalogo'] },
  adminCategorias: { ruta: '/admin/categorias',      nombre: 'Categorías',                   acceso: ['admin'],                         alias: ['categorias'] },
  adminAlmacen:    { ruta: '/admin/almacen',         nombre: 'Almacén',                      acceso: ['admin'],                         alias: ['almacen', 'ingresar mercaderia', 'ingreso de stock', 'stock', 'deposito'] },
  adminClientes:   { ruta: '/admin/clientes',        nombre: 'Clientes',                     acceso: ['admin', 'vendedor'],             alias: ['clientes', 'directorio de clientes'] },
  adminPersonal:   { ruta: '/admin/personal',        nombre: 'Personal',                     acceso: ['admin'],                         alias: ['personal', 'usuarios', 'empleados'] },
  adminReportes:   { ruta: '/admin/reportes',        nombre: 'Reportes',                     acceso: ['admin'],                         alias: ['reportes', 'informes', 'estadisticas'] },

  vendedorResumen: { ruta: '/vendedor',              nombre: 'Resumen operativo',            acceso: ['vendedor', 'admin'], alias: ['resumen', 'dashboard', 'resumen operativo'] },
  vendedorPedidos: { ruta: '/vendedor/pedidos',      nombre: 'Pedidos',                      acceso: ['vendedor', 'admin'], alias: ['pedidos', 'ordenes'] },
  vendedorVentas:  { ruta: '/vendedor/ventas',       nombre: 'Ventas directas',              acceso: ['vendedor', 'admin'], alias: ['ventas', 'ventas directas', 'cobrar'] },
  vendedorClientes:{ ruta: '/vendedor/clientes',     nombre: 'Clientes',                     acceso: ['vendedor', 'admin'], alias: ['clientes'] },

  cerrarSesion:    { accion: 'cerrarSesion',         nombre: 'Cerrar sesión',                acceso: 'sesion',    alias: ['cerrar sesion', 'salir', 'desconectar', 'cerrar la sesion'] },

  // Modo accesible (acciones, no rutas; las ejecuta ModoAccesibleContext).
  modoAccesible:          { accion: 'a11y:alternar',        nombre: 'Modo accesible',            acceso: 'publico', alias: ['modo accesible', 'accesibilidad', 'modo de accesibilidad'] },
  activarAccesibilidad:   { accion: 'a11y:activar',         nombre: 'Activar modo accesible',    acceso: 'publico', alias: ['activar modo accesible', 'activar accesibilidad', 'encender accesibilidad', 'activar la accesibilidad'] },
  desactivarAccesibilidad:{ accion: 'a11y:desactivar',      nombre: 'Desactivar modo accesible', acceso: 'publico', alias: ['desactivar modo accesible', 'desactivar accesibilidad', 'apagar accesibilidad', 'quitar modo accesible'] },
  letraMasGrande:         { accion: 'a11y:letraMasGrande',  nombre: 'Letra más grande',          acceso: 'publico', alias: ['letra mas grande', 'texto mas grande', 'agrandar letra', 'aumentar letra', 'agrandar texto'] },
  letraMasPequena:        { accion: 'a11y:letraMasPequena', nombre: 'Letra más pequeña',         acceso: 'publico', alias: ['letra mas pequena', 'letra mas chica', 'texto mas pequeno', 'achicar letra', 'reducir letra', 'achicar texto'] },
  altoContraste:          { accion: 'a11y:altoContraste',   nombre: 'Alto contraste',            acceso: 'publico', alias: ['alto contraste', 'contraste alto', 'mas contraste', 'modo contraste'] },
};

export const esAccionAccesibilidad = (clave) => String(DESTINOS[clave]?.accion || '').startsWith('a11y:');

// Claves que el chatbot (n8n) tiene permitido disparar. Nunca el backoffice.
export const CLAVES_CHAT = ['inicio', 'catalogo', 'ofertas', 'categorias', 'carrito', 'escanear', 'loginMayorista', 'miCuenta', 'misPedidos'];

// Zona de la app a la que pertenece cada destino (para desambiguar alias repetidos).
export function zonaDeDestino(clave) {
  if (clave.startsWith('admin')) return 'admin';
  if (clave.startsWith('vendedor')) return 'vendedor';
  if (['miCuenta', 'miPerfil', 'misPedidos'].includes(clave)) return 'mayorista';
  return 'publico';
}

export function zonaDeRuta(ruta = '/') {
  const path = String(ruta || '/');
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendedor')) return 'vendedor';
  if (path.startsWith('/mi-cuenta')) return 'mayorista';
  return 'publico';
}

// contexto: { ruta, rolAdmin, tokenAdmin, esMayorista }
export function puedeAcceder(clave, contexto = {}) {
  const destino = DESTINOS[clave];
  if (!destino) return false;
  const { acceso } = destino;
  if (acceso === 'publico') return true;
  if (acceso === 'mayorista') return Boolean(contexto.esMayorista);
  if (acceso === 'sesion') return Boolean(contexto.esMayorista || contexto.tokenAdmin);
  if (Array.isArray(acceso)) return Boolean(contexto.tokenAdmin) && acceso.includes(contexto.rolAdmin);
  return false;
}

// Destinos que tienen sentido anunciar en la ayuda según dónde está el usuario.
export function destinosDisponibles(contexto = {}) {
  const zona = zonaDeRuta(contexto.ruta);
  return Object.entries(DESTINOS)
    .filter(([clave]) => puedeAcceder(clave, contexto))
    .filter(([clave]) => {
      const z = zonaDeDestino(clave);
      // Las acciones de accesibilidad valen en todas las zonas.
      if (esAccionAccesibilidad(clave)) return true;
      if (zona === 'admin') return z === 'admin' || clave === 'cerrarSesion';
      if (zona === 'vendedor') return z === 'vendedor' || clave === 'cerrarSesion';
      // Público y mayorista: todo lo que no sea backoffice. Los logins sólo si no hay sesión.
      if (z === 'admin' || z === 'vendedor') return false;
      if (clave === 'loginMayorista' && contexto.esMayorista) return false;
      if ((clave === 'loginAdmin' || clave === 'loginVendedor') && contexto.tokenAdmin) return false;
      return true;
    })
    .map(([clave, destino]) => ({ clave, ...destino }));
}

// Nombres de página para el anuncio al cambiar de ruta. Primero las rutas que no son
// destinos de navegación (detalle, checkout, logins), después las del registro.
const NOMBRES_EXTRA = [
  [/^\/productos\//, 'Detalle de producto'],
  [/^\/identificacion/, 'Identificación del cliente'],
  [/^\/confirmacion/, 'Confirmación del pedido'],
  [/^\/pedido/, 'Pedido generado'],
  [/^\/admin\/login/, 'Acceso de administrador'],
  [/^\/vendedor\/login/, 'Acceso de vendedor'],
];

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const NOMBRES_PAGINA = [
  ...NOMBRES_EXTRA,
  ...Object.values(DESTINOS)
    .filter((d) => d.ruta)
    .map((d) => d.ruta.split('?')[0])
    .filter((ruta, i, lista) => lista.indexOf(ruta) === i)
    // Rutas más largas primero para que "/mi-cuenta/pedidos" gane a "/mi-cuenta".
    .sort((a, b) => b.length - a.length)
    .map((ruta) => {
      const destino = Object.values(DESTINOS).find((d) => d.ruta && d.ruta.split('?')[0] === ruta && !d.ruta.includes('?')) || Object.values(DESTINOS).find((d) => d.ruta && d.ruta.split('?')[0] === ruta);
      const re = ruta === '/' ? /^\/$/ : new RegExp(`^${escapar(ruta)}(\\/|$)`);
      return [re, destino.nombre];
    }),
  [/^\/admin/, 'Panel de administración'],
  [/^\/vendedor/, 'Panel de vendedor'],
];

export function nombreDePagina(pathname) {
  const par = NOMBRES_PAGINA.find(([re]) => re.test(pathname));
  return par ? par[1] : 'Página';
}

// ---- Destino pendiente tras un login del backoffice (sessionStorage) ----
export const CLAVE_NAV_PENDIENTE = 'terra_nav_pendiente';

export function guardarDestinoPendiente(clave) {
  try { sessionStorage.setItem(CLAVE_NAV_PENDIENTE, clave); } catch { /* sin almacenamiento */ }
}

// Devuelve la ruta a la que ir después de iniciar sesión en el backoffice, si el rol
// lo permite; limpia el pendiente en cualquier caso. `zona` acota a 'admin' o 'vendedor'.
export function consumirDestinoPendiente(rol, zona) {
  let clave = null;
  try { clave = sessionStorage.getItem(CLAVE_NAV_PENDIENTE); sessionStorage.removeItem(CLAVE_NAV_PENDIENTE); } catch { /* sin almacenamiento */ }
  if (!clave || !DESTINOS[clave]?.ruta) return null;
  if (zona && zonaDeDestino(clave) !== zona) return null;
  if (!puedeAcceder(clave, { tokenAdmin: true, rolAdmin: rol })) return null;
  return DESTINOS[clave].ruta;
}
