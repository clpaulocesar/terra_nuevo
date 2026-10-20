const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 250;
const cache = new Map();

function leerCache(clave) {
  const item = cache.get(clave);
  if (!item) return null;
  if (Date.now() - item.creadoEn > CACHE_TTL_MS) {
    cache.delete(clave);
    return null;
  }
  return item.datos;
}

function guardarCache(clave, datos) {
  if (cache.size >= CACHE_MAX) {
    const primeraClave = cache.keys().next().value;
    if (primeraClave) cache.delete(primeraClave);
  }
  cache.set(clave, { creadoEn: Date.now(), datos });
}

function armarDireccion(datos) {
  const partes = datos?.address || {};
  const via =
    partes.road ||
    partes.pedestrian ||
    partes.residential ||
    partes.footway ||
    partes.path ||
    partes.cycleway ||
    partes.neighbourhood ||
    '';
  const numero = partes.house_number ? ` #${partes.house_number}` : '';
  const zona = partes.neighbourhood || partes.suburb || '';

  if (via) {
    const direccionBase = `${via}${numero}`.trim();
    return zona && !via.toLowerCase().includes(zona.toLowerCase())
      ? `${direccionBase}, ${zona}`
      : direccionBase;
  }

  const respaldo = [partes.neighbourhood, partes.suburb, partes.city]
    .filter(Boolean)
    .join(', ');
  if (respaldo) return respaldo;

  return String(datos?.display_name || '')
    .split(',')
    .slice(0, 2)
    .join(',')
    .trim();
}

export async function geocodificarDireccion(req, res, next) {
  const lat = Number(req.query?.lat);
  const lng = Number(req.query?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ success: false, mensaje: 'Coordenadas GPS inválidas.' });
  }

  const clave = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const enCache = leerCache(clave);
  if (enCache) return res.json({ success: true, data: enCache });

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      addressdetails: '1',
      'accept-language': 'es',
    });
    const respuesta = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'TerraAutoservicio/1.0 (+https://terratabletv2-0-k6zy.vercel.app)',
        Accept: 'application/json',
        'Accept-Language': 'es',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      return res.status(502).json({
        success: false,
        mensaje: 'No se pudo detectar la dirección. Escribila manualmente.',
      });
    }

    const datos = await respuesta.json();
    const direccion = armarDireccion(datos);
    if (!direccion) {
      return res.status(404).json({
        success: false,
        mensaje: 'No se encontró una dirección para ese punto del mapa.',
      });
    }

    const resultado = {
      direccion,
      lat,
      lng,
      barrio: datos?.address?.neighbourhood || datos?.address?.suburb || '',
      ciudad: datos?.address?.city || datos?.address?.town || '',
    };
    guardarCache(clave, resultado);
    return res.json({ success: true, data: resultado });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        mensaje: 'La detección de dirección tardó demasiado. Escribila manualmente.',
      });
    }
    return next(error);
  }
}
