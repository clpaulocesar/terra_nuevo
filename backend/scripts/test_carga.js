#!/usr/bin/env node
/**
 * TERRA Autoservicio - Suite de Pruebas de Carga y Concurrencia
 * Simula usuarios concurrentes accediendo a los endpoints críticos de la API.
 *
 * Uso:
 *   node scripts/test_carga.js
 *   node scripts/test_carga.js --url=http://localhost:3001 --usuarios=500 --peticiones=2000
 *   node scripts/test_carga.js --url=https://tu-backend.com --usuarios=1000 --peticiones=5000
 */

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

// Parámetros CLI
const args = process.argv.slice(2).reduce((acc, curr) => {
  const [k, v] = curr.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});

const BASE_URL = (args.url || process.env.API_TEST_URL || 'http://localhost:3001').replace(/\/$/, '');
const USUARIOS = Number(args.usuarios || args.concurrency || 1000);
const TOTAL_PETICIONES = Number(args.peticiones || args.requests || 2500);

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 500, rejectUnauthorized: false });

const ENDPOINTS = [
  { nombre: 'Health Check (Ping DB)', ruta: '/api/health' },
  { nombre: 'Catálogo de Productos (Paginado)', ruta: '/api/productos?pagina=1&limite=20' },
  { nombre: 'Búsqueda de Productos', ruta: '/api/productos?buscar=colchon' },
  { nombre: 'Listado de Categorías', ruta: '/api/categorias' },
];

function percentil(arr, p) {
  if (!arr.length) return 0;
  const index = Math.min(Math.floor((p / 100) * arr.length), arr.length - 1);
  return arr[index];
}

async function dispararPeticion(url) {
  const t0 = performance.now();
  try {
    const isHttps = url.startsWith('https');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const respuesta = await fetch(url, {
      signal: controller.signal,
      agent: isHttps ? httpsAgent : httpAgent,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TERRA-LoadTest-Agent/1.0',
      },
    });
    clearTimeout(timeout);
    await respuesta.arrayBuffer(); // Consumir respuesta
    const t1 = performance.now();
    return { duracion: t1 - t0, ok: respuesta.ok, status: respuesta.status, error: null };
  } catch (err) {
    const t1 = performance.now();
    return { duracion: t1 - t0, ok: false, status: 0, error: err.name === 'AbortError' ? 'TIMEOUT' : err.message };
  }
}

async function ejecutarFase(nombre, concurrencia, cantidadTotal) {
  console.log(`\n================================================================`);
  console.log(`⚡ Iniciando: ${nombre}`);
  console.log(`👥 Concurrencia (Usuarios simultáneos): ${concurrencia}`);
  console.log(`📦 Peticiones programadas: ${cantidadTotal}`);
  console.log(`🎯 URL Base: ${BASE_URL}`);
  console.log(`================================================================`);

  const latencias = [];
  let exitosas = 0;
  let fallidas = 0;
  const errores = {};

  let peticionesLanzadas = 0;
  let peticionesCompletadas = 0;
  const inicioGeneral = performance.now();

  async function worker() {
    while (peticionesLanzadas < cantidadTotal) {
      peticionesLanzadas++;
      // Distribuir equitativamente entre los endpoints
      const endpoint = ENDPOINTS[peticionesLanzadas % ENDPOINTS.length];
      const url = `${BASE_URL}${endpoint.ruta}`;
      const resultado = await dispararPeticion(url);

      peticionesCompletadas++;
      latencias.push(resultado.duracion);

      if (resultado.ok) {
        exitosas++;
      } else {
        fallidas++;
        const clave = resultado.error || `HTTP_${resultado.status}`;
        errores[clave] = (errores[clave] || 0) + 1;
      }

      // Progreso en consola cada 250 peticiones
      if (peticionesCompletadas % 250 === 0 || peticionesCompletadas === cantidadTotal) {
        const progreso = ((peticionesCompletadas / cantidadTotal) * 100).toFixed(0);
        process.stdout.write(`\r⏳ Progreso: ${peticionesCompletadas}/${cantidadTotal} (${progreso}%) | Éxito: ${exitosas} | Errores: ${fallidas}`);
      }
    }
  }

  // Lanzar pool de trabajadores concurrentes
  const trabajadores = [];
  const trabajadoresReales = Math.min(concurrencia, cantidadTotal);
  for (let i = 0; i < trabajadoresReales; i++) {
    trabajadores.push(worker());
  }

  await Promise.all(trabajadores);
  const finGeneral = performance.now();
  const duracionSegundos = (finGeneral - inicioGeneral) / 1000;
  process.stdout.write('\n');

  latencias.sort((a, b) => a - b);
  const rps = (peticionesCompletadas / duracionSegundos).toFixed(1);
  const p50 = percentil(latencias, 50).toFixed(1);
  const p90 = percentil(latencias, 90).toFixed(1);
  const p95 = percentil(latencias, 95).toFixed(1);
  const p99 = percentil(latencias, 99).toFixed(1);
  const promedio = (latencias.reduce((a, b) => a + b, 0) / (latencias.length || 1)).toFixed(1);

  console.log(`\n--- 📊 Resultados de la prueba ---`);
  console.log(`⏱️  Tiempo total:          ${duracionSegundos.toFixed(2)} segundos`);
  console.log(`🚀 Rendimiento (RPS):     ${rps} req/segundo`);
  console.log(`✅ Peticiones exitosas:   ${exitosas} (${((exitosas / peticionesCompletadas) * 100).toFixed(1)}%)`);
  console.log(`❌ Peticiones fallidas:   ${fallidas} (${((fallidas / peticionesCompletadas) * 100).toFixed(1)}%)`);

  console.log(`\n--- ⏱️  Latencias de respuesta ---`);
  console.log(`🔹 Promedio:              ${promedio} ms`);
  console.log(`🔹 Mediana (P50):         ${p50} ms`);
  console.log(`🔹 P90 (90% más rápidas): ${p90} ms`);
  console.log(`🔹 P95 (95% más rápidas): ${p95} ms`);
  console.log(`🔹 P99 (99% más rápidas): ${p99} ms`);

  if (fallidas > 0) {
    console.log(`\n⚠️  Detalle de errores registrados:`);
    Object.entries(errores).forEach(([k, v]) => {
      console.log(`   - ${k}: ${v} veces`);
    });
  }

  // Diagnóstico
  console.log(`\n--- 🎯 Evaluación de Capacidad ---`);
  const tasaError = (fallidas / peticionesCompletadas) * 100;
  if (tasaError === 0 && Number(p95) < 800) {
    console.log(`🟢 EXCELENTE: El servidor soporta la carga con latencias óptimas (<800ms) y cero errores.`);
  } else if (tasaError < 2 && Number(p95) < 1800) {
    console.log(`🟡 ACEPTABLE: El servidor procesó la carga pero la latencia subió bajo alta concurrencia.`);
  } else {
    console.log(`🔴 ATENCIÓN: Se detectó saturación o errores de conexión. Revisa el pool de conexiones de Postgres y el número de procesos de Node.js.`);
  }
}

async function main() {
  console.log(`\n================================================================`);
  console.log(`  🏢 TERRA AUTOSERVICIO - TEST DE ALTA CONCURRENCIA`);
  console.log(`================================================================`);
  console.log(`Probando conexión inicial con el servidor en ${BASE_URL}...`);

  const chequeo = await dispararPeticion(`${BASE_URL}/api/health`);
  if (!chequeo.ok && chequeo.status !== 200) {
    console.error(`\n❌ Error de conexión inicial:`);
    console.error(`No se pudo conectar a ${BASE_URL}. Asegúrate de que el backend esté encendido (npm start).`);
    console.error(`Detalle: ${chequeo.error || `HTTP ${chequeo.status}`}`);
    process.exit(1);
  }

  console.log(`✅ Servidor detectado y respondiendo correctamente.`);

  // Fase 1: Rampa de calentamiento
  await ejecutarFase('Fase 1: Calentamiento y carga moderada', 100, 500);

  // Fase 2: Prueba de alta concurrencia (hasta 1,000 usuarios)
  await ejecutarFase(`Fase 2: Concurrencia alta (${USUARIOS} usuarios simultáneos)`, USUARIOS, TOTAL_PETICIONES);

  console.log(`\n🎉 Pruebas de carga finalizadas.\n`);
}

main().catch((err) => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
