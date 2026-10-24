import { asegurarTablasErpBD, completarCotizacionBD, fallarCotizacionBD, finalizarSincronizacionBD, guardarProductoErpBD, iniciarSincronizacionBD, reservarCotizacionBD } from '../models/erpIntegracionModel.js';
import { guardarImagenesErpEnSupabase, obtenerImagenesProductoErp, obtenerProductoErp, registrarCotizacionErp } from '../services/terraErpService.js';

function codigosValidos(lista) {
  if (!Array.isArray(lista) || !lista.length || lista.length > 500) return null;
  const codigos = [...new Set(lista.map((valor) => String(valor || '').trim()))];
  return codigos.every((codigo) => /^\d+$/.test(codigo)) ? codigos : null;
}

export async function prepararIntegracionErp(req, res, next) {
  try { await asegurarTablasErpBD(); return res.json({ success: true, mensaje: 'Tablas de integración ERP listas.' }); } catch (error) { return next(error); }
}

export async function sincronizarProductosErp(req, res, next) {
  const codigos = codigosValidos(req.body?.codigos);
  if (!codigos) return res.status(400).json({ success: false, mensaje: 'Envía entre 1 y 500 códigos internos numéricos.' });
  const incluirImagenes = req.body?.incluirImagenes !== false;
  try {
    const ejecucionId = await iniciarSincronizacionBD({ solicitante: req.admin?.email, cantidad: codigos.length });
    const detalles = [];
    for (const codigo of codigos) {
      try {
        const producto = await obtenerProductoErp(codigo);
        let imagenes = [];
        if (incluirImagenes) {
          const respuestaImagenes = await obtenerImagenesProductoErp(codigo);
          imagenes = await guardarImagenesErpEnSupabase(producto.codigoTerra, respuestaImagenes.imagenes || []);
        }
        const guardado = await guardarProductoErpBD(producto, { imagenes });
        detalles.push({
          codigo,
          ok: true,
          productoId: guardado.id,
          imagenes: imagenes.length,
          advertencias: guardado.coincidencias.map((coincidencia) => ({
            tipo: coincidencia.exacto ? 'nombre-medida-color-igual' : 'nombre-similar',
            codigo: coincidencia.codigo,
            nombre: coincidencia.nombre,
          })),
        });
      } catch (error) { detalles.push({ codigo, ok: false, mensaje: error.message, codigoErp: error.codigoErp || null }); }
    }
    await finalizarSincronizacionBD(ejecucionId, detalles);
    return res.json({ success: true, data: { ejecucionId, detalles } });
  } catch (error) { return next(error); }
}

export async function crearCotizacionErp(req, res, next) {
  const clave = String(req.get('Idempotency-Key') || req.body?.claveIdempotencia || '').trim();
  const productos = req.body?.productos;
  if (!clave || clave.length > 200 || !Array.isArray(productos) || !productos.length || productos.length > 100) return res.status(400).json({ success: false, mensaje: 'Envía clave de idempotencia y entre 1 y 100 productos.' });
  const normalizados = productos.map((producto) => ({ codigo: String(producto?.codigo || '').trim(), cantidad: Number(producto?.cantidad) }));
  if (!normalizados.every((producto) => /^\d+$/.test(producto.codigo) && Number.isSafeInteger(producto.cantidad) && producto.cantidad >= 1 && producto.cantidad <= 9999)) return res.status(400).json({ success: false, mensaje: 'Los productos de cotización son inválidos.' });
  try {
    const reserva = await reservarCotizacionBD(clave, normalizados);
    if (!reserva.nueva) return res.status(reserva.cotizacion.status === 'completed' ? 200 : 409).json({ success: reserva.cotizacion.status === 'completed', data: reserva.cotizacion, mensaje: reserva.cotizacion.status === 'pending' ? 'La cotización ya está en proceso.' : 'La cotización anterior falló; usa una nueva clave para reintentar.' });
    try {
      const respuesta = await registrarCotizacionErp(normalizados);
      return res.status(201).json({ success: true, data: await completarCotizacionBD(reserva.cotizacion.id, respuesta) });
    } catch (error) { await fallarCotizacionBD(reserva.cotizacion.id, error.message); throw error; }
  } catch (error) { return next(error); }
}
