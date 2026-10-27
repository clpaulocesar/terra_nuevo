import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * TERRA Autoservicio - Script de Pruebas k6 para +1,000 Usuarios Concurrentes
 * Ejecución:
 *   k6 run k6_test.js
 *   k6 run -e BASE_URL=https://tu-backend.com/api k6_test.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Fase 1: Calentamiento hasta 100 usuarios
    { duration: '1m',  target: 500 },   // Fase 2: Rampa intermedia a 500 usuarios
    { duration: '1m',  target: 1000 },  // Fase 3: Pico de 1,000 usuarios concurrentes
    { duration: '1m',  target: 1000 },  // Fase 4: Mantener 1,000 usuarios sostenidos
    { duration: '30s', target: 0 },     // Fase 5: Enfriamiento a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 95% de las solicitudes deben tardar menos de 800ms
    http_req_failed: ['rate<0.01'],    // Tasa de error menor al 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://terratabletv2-0-k6zy.vercel.app/';

export default function () {
  // 1. Simular carga inicial de catálogo
  const resCatalogo = http.get(`${BASE_URL}/productos?pagina=1&limite=20&orden=recomendados`);
  check(resCatalogo, {
    'Catálogo status 200': (r) => r.status === 200,
    'Catálogo tiempo < 800ms': (r) => r.timings.duration < 800,
  });

  sleep(1);

  // 2. Simular búsqueda de producto
  const resBuscar = http.get(`${BASE_URL}/productos?buscar=colchon&pagina=1&limite=10`);
  check(resBuscar, {
    'Búsqueda status 200': (r) => r.status === 200,
  });

  sleep(1.5);

  // 3. Simular consulta de categorías
  const resCategorias = http.get(`${BASE_URL}/categorias`);
  check(resCategorias, {
    'Categorías status 200': (r) => r.status === 200,
  });

  sleep(2);
}
