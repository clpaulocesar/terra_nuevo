// Ejecutar desde frontend/:  node --test src/navegacion/__tests__/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretarIntencion, normalizar } from '../interpretarIntencion.js';
import { consumirDestinoPendiente, destinosDisponibles, nombreDePagina, puedeAcceder } from '../registroNavegacion.js';

const publico = { ruta: '/catalogo', esMayorista: false, tokenAdmin: false, rolAdmin: null };
const mayorista = { ruta: '/catalogo', esMayorista: true, tokenAdmin: false, rolAdmin: null };
const admin = { ruta: '/admin/pedidos', esMayorista: false, tokenAdmin: true, rolAdmin: 'admin' };

test('normalizar quita acentos, mayúsculas y signos', () => {
  assert.equal(normalizar('  ¡Ver OFERTAS!  '), 'ver ofertas');
  assert.equal(normalizar('Catálogo'), 'catalogo');
});

test('la puntuación automática del dictado no rompe los comandos', () => {
  assert.equal(normalizar('Escanear.'), 'escanear');
  assert.equal(normalizar('¿Ver ofertas?'), 'ver ofertas');
  assert.equal(normalizar('juan.perez@gmail.com'), 'juan.perez@gmail.com');
  assert.equal(interpretarIntencion('Escanear.', publico).destino, 'escanear');
  assert.equal(interpretarIntencion('Mis pedidos.', mayorista).destino, 'misPedidos');
  assert.equal(interpretarIntencion('¡Carrito!', publico).destino, 'carrito');
});

test('caso 1: "ver ofertas" en kiosco va a ofertas', () => {
  assert.equal(interpretarIntencion('ver ofertas', publico).destino, 'ofertas');
});

test('caso 2: "soy mayorista" abre el login mayorista', () => {
  assert.equal(interpretarIntencion('soy mayorista', publico).destino, 'loginMayorista');
});

test('caso 4: "mis pedidos" con sesión mayorista', () => {
  assert.equal(interpretarIntencion('mis pedidos', mayorista).destino, 'misPedidos');
});

test('alias más largo gana: "mis pedidos" sobre "pedidos"', () => {
  assert.equal(interpretarIntencion('quiero ver mis pedidos', mayorista).destino, 'misPedidos');
  assert.equal(interpretarIntencion('mis pedidos', publico).destino, 'misPedidos');
});

test('caso 7: "productos" dentro del admin va a productos del admin', () => {
  assert.equal(interpretarIntencion('productos', admin).destino, 'adminProductos');
});

test('caso 8: "productos" en el catálogo público es el catálogo', () => {
  assert.equal(interpretarIntencion('productos', publico).destino, 'catalogo');
});

test('"pedidos" en zona pública con sesión mayorista son sus pedidos', () => {
  assert.equal(interpretarIntencion('pedidos', mayorista).destino, 'misPedidos');
});

test('"almacén" sin token sigue resolviendo al destino (el contexto decide el login)', () => {
  assert.equal(interpretarIntencion('Almacén', publico).destino, 'adminAlmacen');
  assert.equal(puedeAcceder('adminAlmacen', publico), false);
  assert.equal(puedeAcceder('adminAlmacen', { ...admin, rolAdmin: 'despacho' }), false);
  assert.equal(puedeAcceder('adminAlmacen', admin), true);
});

test('acentos y mayúsculas no importan', () => {
  assert.equal(interpretarIntencion('CATÁLOGO', publico).destino, 'catalogo');
  assert.equal(interpretarIntencion('Soy Administrador', publico).destino, 'loginAdmin');
});

test('búsqueda con parámetro', () => {
  const r = interpretarIntencion('buscar colchón brillante', publico);
  assert.equal(r.destino, 'buscar');
  assert.equal(r.parametros.termino, 'colchon brillante');
});

test('búsqueda limitada a ofertas: "ofertas de almohadas", "almohadas en oferta"', () => {
  assert.deepEqual(interpretarIntencion('ofertas de almohadas', publico), { destino: 'buscar', parametros: { termino: 'almohadas', ofertas: true } });
  assert.deepEqual(interpretarIntencion('almohadas en oferta', publico), { destino: 'buscar', parametros: { termino: 'almohadas', ofertas: true } });
  assert.deepEqual(interpretarIntencion('ver promociones en colchones', publico), { destino: 'buscar', parametros: { termino: 'colchones', ofertas: true } });
  // Una búsqueda normal no lleva la bandera: el catálogo quita el filtro de ofertas.
  assert.deepEqual(interpretarIntencion('buscar almohadas', publico), { destino: 'buscar', parametros: { termino: 'almohadas' } });
  assert.equal(interpretarIntencion('ofertas', publico).destino, 'ofertas');
});

test('instrucciones con parámetro', () => {
  assert.deepEqual(interpretarIntencion('cómo se arma la Betty', publico), { destino: 'instrucciones', parametros: { termino: 'betty' } });
  assert.equal(interpretarIntencion('instrucciones de bugatti', publico).parametros.termino, 'bugatti');
});

test('categoría validada contra la lista cargada', () => {
  const ctx = { ...publico, categorias: ['COLCHON', 'SOFA CAMA'] };
  assert.deepEqual(interpretarIntencion('categoría sofa cama', ctx), { destino: 'categoria', parametros: { categoria: 'SOFA CAMA' } });
  assert.equal(interpretarIntencion('categoría zapatos', ctx).destino, null);
});

test('frase sin destino: las cortas se buscan como producto, las largas no', () => {
  assert.equal(interpretarIntencion('quiero una pizza grande', publico).destino, 'buscar');
  assert.deepEqual(interpretarIntencion('almohadas', publico), { destino: 'buscar', parametros: { termino: 'almohadas' } });
  assert.equal(interpretarIntencion('xyz', publico).destino, 'buscar');
  assert.equal(interpretarIntencion('hola que tal como anda todo por ahi', publico).destino, null);
  assert.equal(interpretarIntencion('', publico).destino, null);
});

test('nombres de página cubren mayorista, admin y vendedor', () => {
  assert.equal(nombreDePagina('/mi-cuenta/pedidos'), 'Mis pedidos');
  assert.equal(nombreDePagina('/mi-cuenta'), 'Mi panel mayorista');
  assert.equal(nombreDePagina('/admin/almacen'), 'Almacén');
  assert.equal(nombreDePagina('/admin/login'), 'Acceso de administrador');
  assert.equal(nombreDePagina('/vendedor/ventas'), 'Ventas directas');
  assert.equal(nombreDePagina('/productos/abc'), 'Detalle de producto');
  assert.equal(nombreDePagina('/'), 'Inicio');
});

test('ayuda contextual: en el admin sólo destinos del admin', () => {
  const claves = destinosDisponibles(admin).map((d) => d.clave);
  assert.ok(claves.includes('adminAlmacen'));
  assert.ok(!claves.includes('catalogo'));
  assert.ok(claves.includes('cerrarSesion'));
  const publicas = destinosDisponibles(publico).map((d) => d.clave);
  assert.ok(publicas.includes('loginMayorista') && !publicas.includes('adminAlmacen'));
});

test('destino pendiente tras login respeta rol y zona', () => {
  const almacen = new Map();
  globalThis.sessionStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: (k) => almacen.delete(k) };
  almacen.set('terra_nav_pendiente', 'adminAlmacen');
  assert.equal(consumirDestinoPendiente('despacho', 'admin'), null);
  almacen.set('terra_nav_pendiente', 'adminAlmacen');
  assert.equal(consumirDestinoPendiente('admin', 'admin'), '/admin/almacen');
  almacen.set('terra_nav_pendiente', 'adminAlmacen');
  assert.equal(consumirDestinoPendiente('admin', 'vendedor'), null);
});
