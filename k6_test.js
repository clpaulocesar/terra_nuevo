
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = (
  __ENV.BASE_URL || 'https://terratabletv2-0-k6zy.vercel.app'
).replace(/\/+$/, '');

const API_URL = (__ENV.API_URL || '').replace(/\/+$/, '');

export default function () {
  // 1. Abrir el catálogo de TERRA.
  const pagina = http.get(`${BASE_URL}/catalogo`, {
    tags: { tipo: 'pagina_catalogo' },
  });

  check(pagina, {
    'Catálogo web responde 200': (r) => r.status === 200,
    'Catálogo devuelve HTML': (r) =>
      (r.headers['Content-Type'] || '').includes('text/html'),
  });

  // 2. Probar API e imágenes solo si se proporciona su URL real.
  if (API_URL) {
    const catalogo = http.get(
      `${API_URL}/productos?pagina=1&limite=20&orden=recomendados`,
      { tags: { tipo: 'api_catalogo' } }
    );

    const esJson = (catalogo.headers['Content-Type'] || '')
      .includes('application/json');

    check(catalogo, {
      'API responde 200': (r) => r.status === 200,
      'API devuelve JSON': () => esJson,
    });

    if (catalogo.status === 200 && esJson) {
      try {
        const imagenes = [...new Set(buscarImagenes(catalogo.json()))];

        if (imagenes.length > 0) {
          const respuestas = http.batch(
            imagenes.map((url) => ({
              method: 'GET',
              url,
              params: { tags: { tipo: 'imagen_producto' } },
            }))
          );

          for (const respuesta of respuestas) {
            check(respuesta, {
              'Imagen responde 200': (r) => r.status === 200,
              'Respuesta es una imagen': (r) =>
                (r.headers['Content-Type'] || '').startsWith('image/'),
            });
          }
        }
      } catch (e) {
        console.error(`Error procesando el catálogo: ${e}`);
      }
    }
  }

  sleep(1);
}

function buscarImagenes(obj, resultado = []) {
  if (!obj || typeof obj !== 'object') return resultado;

  if (Array.isArray(obj)) {
    for (const item of obj) buscarImagenes(item, resultado);
    return resultado;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === 'string' &&
      ['imagen_url', 'image_url', 'imageUrl', 'imagenUrl'].includes(key) &&
      /^https?:\/\//i.test(value)
    ) {
      resultado.push(value);
    } else if (value && typeof value === 'object') {
      buscarImagenes(value, resultado);
    }
  }

  return resultado;
}
