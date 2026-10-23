// Capturas de pantalla para docs/GUIA_USUARIO_TERRA_AUTOSERVICIO.md (una por marcador ![...](img/...)).
//
// Requisitos:
//   - Backend y frontend corriendo contra una base de datos LOCAL con los datos ficticios
//     de capturas (clientes, pedidos y personal inventados; nunca la base real):
//       1. Postgres 17 local (por ejemplo `docker run -d -e POSTGRES_PASSWORD=... -e POSTGRES_DB=terra_capturas -p 5433:5432 postgres:17`).
//       2. Restaurar el esquema `public` (pg_dump --schema-only) y los datos del catálogo
//          (categories, products, product_instructions, promotions) de la base de desarrollo.
//       3. Crear un stub `auth.uid()` que devuelva NULL y cargar `scripts/capturas-seed.sql`.
//       4. Levantar el backend con DATABASE_URL apuntando a esa base (por ejemplo PORT=3002) y
//          el frontend con VITE_API_URL hacia ese backend; pasar las URLs con CAPTURAS_*.
//   - `npm i -D playwright` y `npx playwright install chromium` en la raíz del repo.
//   - ADMIN_TOKEN_SECRET del backend en el entorno (para firmar los tokens de admin,
//     vendedor y despacho sin pasar por Supabase Auth):
//       node --env-file=backend/.env scripts/capturas-guia.mjs
//
// Variables opcionales:
//   CAPTURAS_BASE_URL  URL del frontend   (por defecto http://localhost:5173)
//   CAPTURAS_API_URL   URL del backend    (por defecto http://localhost:3001/api)
//   CAPTURAS_SOLO      lista separada por comas de nombres de captura a generar
//
// La sesión mayorista no usa Supabase Auth: se inyecta una sesión ficticia y se simulan
// las respuestas de "mis pedidos" con datos de ejemplo. El resto de pantallas usa la API real.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { crearTokenAdmin } from '../backend/src/middlewares/authAdmin.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR_IMG = path.join(RAIZ, 'docs', 'img');
const BASE = (process.env.CAPTURAS_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const API = (process.env.CAPTURAS_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const SOLO = String(process.env.CAPTURAS_SOLO || '').split(',').map((s) => s.trim()).filter(Boolean);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'capturas-terra-'));

// Datos del seed de capturas (todos ficticios).
const SEED = {
  vendedorEmail: 'vendedor.demo@terra.bo',
  despachoEmail: 'despacho.demo@terra.bo',
  ticketCobrar: 'TER-A1F3C7D2',      // pendiente de pago: modal "Cobrar"
  ticketCliente: 'TER-B8E24C19',     // pendiente de pago: pantalla del ticket
  skuAlmacen: 'COLN00541',           // ALPINO 2.5 PLZ: ingreso en Almacén y QR del kiosco
  clienteVentaDirecta: 'Carlos Mendoza',
};

const VIEWPORTS = { kiosco: { width: 1280, height: 800 }, mayorista: { width: 1280, height: 800 }, backoffice: { width: 1440, height: 900 }, celular: { width: 390, height: 844 } };

const MAYORISTA = {
  cliente_id: 'dddddddd-0000-4000-8000-000000000001', nombre: 'Mueblería Los Pinos SRL', titular: 'Andrea Vaca',
  email: 'compras@lospinos.example', telefono: '70011223', nit: '1023456017',
  direccion: 'Av. Banzer, 3er anillo, Santa Cruz', referencia: 'Portón verde, frente a la plaza',
  latitud: -17.7563, longitud: -63.185, gps: '-17.7563, -63.185', rol: 'mayorista', token: 'sesion-de-captura',
};

const hace = (dias, horas = 0) => new Date(Date.now() - (dias * 24 + horas) * 3600e3).toISOString();
const PEDIDOS_MAYORISTA = [
  { id: 'eeeeeeee-0000-4000-8000-000000000007', numero: 17, codigo: 'TER-0A5E7B2D', total: 10680, estado: 'out_for_delivery', fecha: hace(0, 3), metodo_pago: 'qr', tipo_entrega: 'home_delivery', direccion_entrega: MAYORISTA.direccion, referencia_entrega: MAYORISTA.referencia, items: '6x ALPINO 2 PLZ, 10x CONFORT LYA' },
  { id: 'eeeeeeee-0000-4000-8000-000000000009', numero: 14, codigo: 'TER-2C7A9D4F', total: 6000, estado: 'completed', fecha: hace(2, 3), metodo_pago: 'qr', tipo_entrega: 'home_delivery', direccion_entrega: MAYORISTA.direccion, referencia_entrega: MAYORISTA.referencia, items: '2x ALPINO 3.5 PLZ' },
  { id: 'eeeeeeee-0000-4000-8000-000000000020', numero: 12, codigo: 'TER-C1D2E3F4', total: 3980, estado: 'preparing', fecha: hace(1, 1), metodo_pago: 'efectivo', tipo_entrega: 'home_delivery', direccion_entrega: MAYORISTA.direccion, referencia_entrega: MAYORISTA.referencia, items: '2x ALPINO 2.5 PLZ' },
  { id: 'eeeeeeee-0000-4000-8000-000000000015', numero: 8, codigo: 'TER-8C3A5D0F', total: 21000, estado: 'completed', fecha: hace(12), metodo_pago: 'qr', tipo_entrega: 'store_pickup', direccion_entrega: null, referencia_entrega: null, items: '8x ALPINO 3 PLZ' },
  { id: 'eeeeeeee-0000-4000-8000-000000000017', numero: 3, codigo: 'TER-AE5C7F2B', total: 17500, estado: 'completed', fecha: hace(34), metodo_pago: 'qr', tipo_entrega: 'home_delivery', direccion_entrega: MAYORISTA.direccion, referencia_entrega: MAYORISTA.referencia, items: '10x ALPINO 2 PLZ' },
];

const resultados = [];
const registrar = (nombre, estado, motivo = '') => { resultados.push({ nombre, estado, motivo }); console.log(`${estado === 'OK' ? '✓' : '✗'} ${nombre}${motivo ? ` — ${motivo}` : ''}`); };

async function api(ruta, token) {
  const r = await fetch(`${API}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${ruta}: HTTP ${r.status} ${j?.mensaje || ''}`);
  return j?.data ?? j;
}

// Un contexto por rol: viewport, idioma, zona horaria, modo día y sesión inyectada.
async function nuevoContexto(browser, { viewport, sesionAdmin = null, sesionMayorista = null }) {
  const contexto = await browser.newContext({ viewport, locale: 'es-BO', timezoneId: 'America/La_Paz', colorScheme: 'light', permissions: ['camera'], deviceScaleFactor: 1 });
  await contexto.addInitScript(({ apiUrl, admin, mayorista }) => {
    // public/config.js asigna window.TERRA_CONFIG al cargar: este getter fija la API de capturas.
    const cfg = { API_URL: apiUrl, N8N_CHAT_URL: 'http://localhost:9/chat', WHATSAPP_COMPROBANTES: '59100000000', VOZ_DICTADO_CREDENCIALES: false };
    Object.defineProperty(window, 'TERRA_CONFIG', { configurable: true, get: () => cfg, set() {} });
    // El panel "Podés decir…" sólo existe si el navegador soporta reconocimiento de voz.
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      window.webkitSpeechRecognition = class { start() {} stop() {} abort() {} };
    }
    try { localStorage.setItem('terra_tema', 'light'); } catch { /* sin almacenamiento */ }
    if (admin) {
      sessionStorage.setItem('terra_admin_token', admin.token);
      sessionStorage.setItem('terra_admin_user', JSON.stringify(admin.usuario));
    }
    if (mayorista) {
      localStorage.setItem('terra_sesion_mayorista', JSON.stringify({ ...mayorista, expira: Date.now() + 3600e3 }));
    }
  }, { apiUrl: API, admin: sesionAdmin, mayorista: sesionMayorista });
  return contexto;
}

// Espera datos e imágenes: sin "Cargando…", todas las <img> completas, sin peticiones en vuelo.
async function listo(page, extraMs = 700) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => !/Cargando/i.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => Array.from(document.images).every((img) => !img.src || img.complete), null, { timeout: 25000 }).catch(() => {});
  await page.addStyleTag({ content: '.demo-banner{display:none!important}' }).catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function capturar(page, nombre) {
  await page.screenshot({ path: path.join(DIR_IMG, `${nombre}.png`), fullPage: false });
}

async function paso(nombre, fn) {
  if (SOLO.length && !SOLO.includes(nombre)) return;
  try { await fn(); registrar(nombre, 'OK'); } catch (error) { registrar(nombre, 'PENDIENTE', String(error.message || error).split('\n')[0].slice(0, 160)); }
}

function tokenDe(usuario) { return crearTokenAdmin({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email }); }

async function main() {
  fs.mkdirSync(DIR_IMG, { recursive: true });
  const admin = { id: undefined, rol: 'admin', nombre: 'Administrador Principal', email: 'gerencia@terra.bo' };
  const tokenAdmin = tokenDe(admin);
  const personal = await api('/personal', tokenAdmin);
  const vendedor = personal.find((p) => p.email === SEED.vendedorEmail);
  const despacho = personal.find((p) => p.email === SEED.despachoEmail);
  if (!vendedor || !despacho) throw new Error('Faltan las cuentas de vendedor/despacho del seed de capturas.');
  const pedidoTicket = (await api(`/pedidos?buscar=${SEED.ticketCliente}`, tokenAdmin))[0];
  if (!pedidoTicket) throw new Error(`No existe el pedido ${SEED.ticketCliente} del seed.`);

  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  let archivoQr = null;

  // ---------------- Backoffice: administrador (1440×900) ----------------
  {
    const ctx = await nuevoContexto(browser, { viewport: VIEWPORTS.backoffice, sesionAdmin: { token: tokenAdmin, usuario: admin } });
    const page = await ctx.newPage();

    await paso('admin-dashboard', async () => {
      await page.goto(`${BASE}/admin`); await listo(page, 1500);
      await page.getByText('Ventas cobradas').first().waitFor();
      await capturar(page, 'admin-dashboard');
    });

    await paso('admin-pedidos-cobrar-paso4', async () => {
      await page.goto(`${BASE}/admin/pedidos`); await listo(page);
      const fila = page.locator('.orders-list > article', { hasText: SEED.ticketCobrar });
      await fila.getByRole('button', { name: 'Cobrar' }).click();
      await page.getByText('Caja Equipetrol').waitFor();
      await listo(page, 500);
      await capturar(page, 'admin-pedidos-cobrar-paso4');
    });

    await paso('admin-ventas-directas-paso3', async () => {
      await page.goto(`${BASE}/admin/ventas-directas`); await listo(page);
      const agregar = page.getByRole('button', { name: 'Agregar', exact: true });
      await agregar.first().waitFor();
      for (let i = 0; i < 3; i += 1) await agregar.nth(i).click();
      const buscador = page.getByPlaceholder('Selecciona un cliente o busca por nombre o cédula...');
      await buscador.fill(SEED.clienteVentaDirecta.split(' ')[0]);
      await page.getByRole('option', { name: new RegExp(SEED.clienteVentaDirecta) }).first().click();
      await page.getByText('Total cobrado').waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
      await listo(page, 900);
      await capturar(page, 'admin-ventas-directas-paso3');
    });

    await paso('admin-productos-nuevo-paso2', async () => {
      await page.goto(`${BASE}/admin/productos`); await listo(page);
      await page.getByRole('button', { name: 'Nuevo producto' }).click();
      const modal = page.getByRole('dialog').filter({ hasText: 'Registrar nuevo producto' }).first();
      const form = (await modal.count()) ? modal : page;
      await form.getByLabel('Nombre comercial').first().fill('Sommier Nórdico Bouclé Queen');
      await form.getByLabel('Código Terra (SKU)').first().fill('SOMM00210');
      await form.getByLabel('Código interno').first().fill('INT-0210');
      const categoria = form.getByLabel('Categoría').first();
      const opciones = await categoria.locator('option').allTextContents();
      const somier = opciones.find((o) => /somier|sommier/i.test(o)) || opciones.find((o) => o && !/seleccionar/i.test(o));
      if (somier) await categoria.selectOption({ label: somier });
      await form.getByLabel('Precio de venta (Bs)').first().fill('3450');
      await form.getByLabel('Precio mayorista (Bs)').first().fill('2990');
      await form.getByLabel('Stock en sala').first().fill('8');
      await form.getByLabel(/Medidas/).first().fill('160 x 200 cm · Base de madera tapizada en bouclé');
      await form.getByLabel('Descripción para catálogo').first().fill('Sommier con estructura reforzada y tela bouclé color crema. Incluye patas de madera.');
      await listo(page, 400);
      await capturar(page, 'admin-productos-nuevo-paso2');
      await page.getByRole('button', { name: 'Cancelar' }).first().click().catch(() => {});
    });

    // QR del producto ALPINO 2.5 PLZ, para el escaneo del kiosco (se descarga desde Productos).
    await paso('qr-producto (auxiliar)', async () => {
      await page.goto(`${BASE}/admin/productos`); await listo(page);
      await page.getByPlaceholder('Buscar por SKU, modelo o acabado...').fill(SEED.skuAlmacen);
      await listo(page, 600);
      await page.getByTitle('Generar QR de la ficha').first().click();
      await page.getByText('QR del producto').waitFor();
      const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar PNG' }).click()]);
      archivoQr = path.join(TMP, 'qr-producto.png');
      await descarga.saveAs(archivoQr);
    });

    await paso('admin-almacen-paso3', async () => {
      await page.goto(`${BASE}/admin/almacen`); await listo(page);
      await page.getByPlaceholder('Código Terra, SKU o id del producto').fill(SEED.skuAlmacen);
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await page.getByText('Stock actual').waitFor();
      const cantidad = page.locator('input[type="number"]').first();
      if (await cantidad.count()) { await cantidad.fill('10'); await cantidad.dispatchEvent('change'); }
      await listo(page, 400);
      await capturar(page, 'admin-almacen-paso3');
    });

    await paso('admin-clientes-mayorista-paso2', async () => {
      await page.goto(`${BASE}/admin/clientes`); await listo(page);
      await page.getByRole('button', { name: 'Crear usuario mayorista' }).click();
      await page.getByRole('heading', { name: 'Crear usuario mayorista' }).waitFor();
      const form = page.getByRole('dialog').filter({ hasText: 'Crear usuario mayorista' }).first();
      const campos = (await form.count()) ? form : page;
      await campos.locator('input[name="nombre"]').fill('Ferretería El Progreso');
      await campos.locator('input[name="email"]').fill('compras@elprogreso.example');
      await campos.locator('input[name="telefono"]').fill('70123456');
      await campos.locator('input[name="nit"]').fill('1029384756');
      await campos.locator('input[name="password"]').fill('ClaveTemporal2026');
      await listo(page, 300);
      await capturar(page, 'admin-clientes-mayorista-paso2');
    });

    await paso('admin-repartidores-paso4', async () => {
      await page.goto(`${BASE}/admin/repartidores`); await listo(page);
      await page.getByRole('button', { name: 'Sin asignar', exact: true }).click().catch(() => {});
      const select = page.locator('select[aria-label^="Repartidor para el pedido"]').first();
      await select.waitFor();
      const valores = await select.locator('option').evaluateAll((ops) => ops.map((o) => ({ value: o.value, text: o.textContent })));
      const marcos = valores.find((o) => /Marcos/.test(o.text)) || valores.find((o) => o.value);
      await select.selectOption(marcos.value);
      await select.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 160));
      await listo(page, 300);
      await capturar(page, 'admin-repartidores-paso4');
    });

    await paso('admin-reportes-paso4', async () => {
      await page.goto(`${BASE}/admin/reportes`); await listo(page, 1500);
      await page.getByText('Ventas totales').first().waitFor();
      await capturar(page, 'admin-reportes-paso4');
    });

    await ctx.close();
  }

  // ---------------- Portal de ventas: vendedor (1440×900) ----------------
  {
    const usuario = { id: vendedor.id, rol: 'vendedor', nombre: vendedor.nombre, email: vendedor.email };
    const ctx = await nuevoContexto(browser, { viewport: VIEWPORTS.backoffice, sesionAdmin: { token: tokenDe(usuario), usuario } });
    const page = await ctx.newPage();

    await paso('vendedor-dashboard', async () => {
      await page.goto(`${BASE}/vendedor`); await listo(page, 1500);
      await page.getByText('Resumen operativo').first().waitFor();
      await capturar(page, 'vendedor-dashboard');
    });

    await paso('vendedor-reporte-paso2', async () => {
      await page.goto(`${BASE}/vendedor/pedidos`); await listo(page);
      await page.getByRole('button', { name: 'Reporte', exact: true }).click();
      await page.getByText('Reporte general de pedidos').waitFor();
      await listo(page, 300);
      await capturar(page, 'vendedor-reporte-paso2');
    });

    await ctx.close();
  }

  // ---------------- Despacho (celular 390×844) ----------------
  {
    const usuario = { id: despacho.id, rol: 'despacho', nombre: despacho.nombre, email: despacho.email };
    const ctx = await nuevoContexto(browser, { viewport: VIEWPORTS.celular, sesionAdmin: { token: tokenDe(usuario), usuario } });
    const page = await ctx.newPage();

    await paso('despacho-lista', async () => {
      await page.goto(`${BASE}/admin/despacho`); await listo(page, 1200);
      await page.locator('.dispatch-card').first().waitFor();
      await page.locator('.dispatch-card').first().scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -140));
      await listo(page, 300);
      await capturar(page, 'despacho-lista');
    });

    await paso('despacho-entrega-paso5', async () => {
      await page.getByRole('button', { name: /En camino/ }).first().click();
      const tarjeta = page.locator('.dispatch-card.is-en_camino').first();
      await tarjeta.waitFor();
      await tarjeta.getByRole('button', { name: 'Confirmar entrega' }).scrollIntoViewIfNeeded();
      await listo(page, 300);
      await capturar(page, 'despacho-entrega-paso5');
    });

    await ctx.close();
  }

  // ---------------- Kiosco / cliente en tienda (1280×800) ----------------
  {
    const ctx = await nuevoContexto(browser, { viewport: VIEWPORTS.kiosco });
    const page = await ctx.newPage();

    await paso('admin-login-paso2', async () => {
      await page.goto(`${BASE}/admin/login`); await listo(page);
      await page.locator('input[type="email"]').fill('gerencia@terra.bo');
      await page.locator('input[type="password"]').fill('ClaveSegura2026');
      await capturar(page, 'admin-login-paso2');
    });

    await paso('cliente-inicio', async () => {
      await page.goto(`${BASE}/`); await listo(page, 1200);
      await capturar(page, 'cliente-inicio');
    });

    await paso('cliente-catalogo-paso3', async () => {
      await page.goto(`${BASE}/catalogo`); await listo(page, 1000);
      await page.getByRole('button', { name: /^Categorías/ }).first().click();
      await page.getByRole('listbox', { name: 'Elegir categoría' }).waitFor();
      await listo(page, 300);
      await capturar(page, 'cliente-catalogo-paso3');
    });

    await paso('cliente-qr-paso3', async () => {
      if (!archivoQr) throw new Error('no se pudo descargar el QR del producto desde Productos');
      await page.goto(`${BASE}/catalogo?abrirQr=1`); await listo(page, 800);
      await page.getByText('Escaneá un producto').waitFor();
      await page.locator('input[aria-label="Seleccionar imagen con código QR"]').setInputFiles(archivoQr);
      await page.getByText('Código leído').waitFor({ timeout: 20000 });
      await page.getByRole('button', { name: 'Confirmar compra' }).scrollIntoViewIfNeeded();
      await listo(page, 500);
      await capturar(page, 'cliente-qr-paso3');
      // El borrador QR queda en localStorage: se limpia para no arrastrar la insignia a otras capturas.
      await page.evaluate(() => { try { localStorage.removeItem('terra_qr_cart_v1'); } catch { /* sin almacenamiento */ } });
    });

    await paso('cliente-carrito-paso2', async () => {
      await page.goto(`${BASE}/catalogo`); await listo(page, 800);
      const agregar = page.getByRole('button', { name: 'Agregar al carrito' });
      await agregar.nth(0).click(); await page.waitForTimeout(400);
      await agregar.nth(2).click(); await page.waitForTimeout(400);
      // Navegación interna: el carrito vive en memoria y una recarga lo vaciaría.
      await page.getByRole('link', { name: 'Carrito' }).first().click();
      await page.getByText('Revisá tu pedido').waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
      await listo(page, 500);
      await capturar(page, 'cliente-carrito-paso2');
    });

    await paso('cliente-ticket-paso4', async () => {
      await page.goto(`${BASE}/pedido/${pedidoTicket.id}`); await listo(page, 1000);
      await page.getByText('¡Tu ticket está listo!').waitFor();
      await capturar(page, 'cliente-ticket-paso4');
    });

    await paso('comun-accesibilidad-paso2', async () => {
      await page.goto(`${BASE}/catalogo`); await listo(page, 800);
      await page.getByTitle('Modo accesible (Alt + A)').click();
      await page.getByText('Activar modo accesible').waitFor();
      await listo(page, 300);
      await capturar(page, 'comun-accesibilidad-paso2');
    });

    await paso('comun-voz-panel', async () => {
      await page.goto(`${BASE}/`); await listo(page, 800);
      await page.getByRole('button', { name: 'Ver qué comandos de voz puedo decir' }).click();
      await page.getByText('Podés decir').waitFor();
      await listo(page, 300);
      await capturar(page, 'comun-voz-panel');
    });

    await paso('mayorista-login-paso2', async () => {
      await page.goto(`${BASE}/`); await listo(page, 600);
      await page.getByRole('button', { name: 'Iniciar sesión' }).first().click();
      await page.getByRole('dialog').waitFor();
      await page.locator('input[name="usuario"]').fill(MAYORISTA.email);
      await page.locator('input[name="password"]').fill('ClaveSegura2026');
      await listo(page, 300);
      await capturar(page, 'mayorista-login-paso2');
    });

    await ctx.close();
  }

  // ---------------- Cliente mayorista (1280×800, sesión ficticia) ----------------
  {
    const ctx = await nuevoContexto(browser, { viewport: VIEWPORTS.mayorista, sesionMayorista: MAYORISTA });
    await ctx.route('**/clientes/mis-pedidos**', async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/mis-pedidos/')[1];
      const data = id
        ? { ...(PEDIDOS_MAYORISTA.find((p) => p.id === decodeURIComponent(id)) || PEDIDOS_MAYORISTA[0]), cliente: MAYORISTA.nombre, cliente_telefono: MAYORISTA.telefono, cliente_nit: MAYORISTA.nit, estado_entrega: 'en_camino', repartidor_nombre: 'Marcos Quispe', repartidor_placa: 'SCZ-4521' }
        : PEDIDOS_MAYORISTA;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    });
    const page = await ctx.newPage();

    await paso('mayorista-menu', async () => {
      await page.goto(`${BASE}/`); await listo(page, 800);
      await page.locator('.terra-login-button--mayorista').first().click();
      await page.getByText('Mi panel mayorista').first().waitFor();
      await listo(page, 300);
      await capturar(page, 'mayorista-menu');
    });

    await paso('mayorista-perfil-paso3', async () => {
      await page.goto(`${BASE}/mi-cuenta/perfil`); await listo(page, 1500);
      await page.getByText('Dirección de Envío').first().waitFor();
      await page.locator('.leaflet-tile-loaded').first().waitFor({ timeout: 20000 }).catch(() => {});
      await page.locator('.leaflet-container').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await listo(page, 1200);
      await capturar(page, 'mayorista-perfil-paso3');
    });

    await paso('mayorista-catalogo-paso2', async () => {
      await page.goto(`${BASE}/catalogo`); await listo(page, 1000);
      await page.getByText('PVP').first().waitFor();
      await capturar(page, 'mayorista-catalogo-paso2');
    });

    await paso('mayorista-pedidos-paso3', async () => {
      await page.goto(`${BASE}/mi-cuenta/pedidos`); await listo(page, 1000);
      await page.getByRole('button', { name: 'Ver detalle' }).first().click();
      await page.getByText('Detalle del Pedido').first().waitFor();
      await listo(page, 500);
      await capturar(page, 'mayorista-pedidos-paso3');
    });

    await ctx.close();
  }

  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });

  console.log('\nResumen:');
  for (const r of resultados) console.log(`  ${r.estado.padEnd(9)} ${r.nombre}${r.motivo ? ` — ${r.motivo}` : ''}`);
  const pendientes = resultados.filter((r) => r.estado !== 'OK' && !r.nombre.includes('auxiliar'));
  process.exitCode = pendientes.length ? 1 : 0;
}

main().catch((error) => { console.error('Error general:', error); process.exitCode = 1; });
