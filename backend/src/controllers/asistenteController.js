import { buscarProductosChatBD, buscarInstruccionesChatBD } from '../models/asistenteModel.js';
import { crearPedidoBD } from '../models/pedidoModel.js';

export async function buscarProductosChat(req, res, next) {
  try {
    const termino = String(req.query.termino ?? req.body?.termino ?? '').trim();
    if (termino.length > 120) return res.status(400).json({ success: false, mensaje: 'El término no puede superar 120 caracteres.' });
    const soloOfertas = ['1', 'true'].includes(String(req.query.ofertas ?? req.body?.ofertas ?? '').toLowerCase());
    const productos = await buscarProductosChatBD(termino, { soloOfertas });
    return res.json({ success: true, termino, soloOfertas: soloOfertas || productos.every((p) => p.en_oferta), total: productos.length, data: productos });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(503).json({
        success: false,
        mensaje: 'No se encontró la tabla de productos en la base de datos.',
      });
    }
    if (error.code === '42703') {
      return res.status(503).json({
        success: false,
        mensaje: 'La tabla products no tiene las columnas esperadas por el asistente.',
      });
    }
    next(error);
  }
}

// Instrucciones de producto para el chatbot: GET|POST /api/asistente/instrucciones?termino=
// Devuelve [{ id, producto, sku, categoria, instrucciones, detalle_completo, colores, videos_url, imagenes_url }].
export async function buscarInstruccionesChat(req, res, next) {
  try {
    const termino = String(req.query.termino ?? req.body?.termino ?? '').trim();
    if (termino.length > 120) return res.status(400).json({ success: false, mensaje: 'El término no puede superar 120 caracteres.' });
    const instrucciones = await buscarInstruccionesChatBD(termino);
    return res.json({ success: true, termino, total: instrucciones.length, data: instrucciones });
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ success: false, mensaje: 'No se encontró la tabla product_instructions.' });
    next(error);
  }
}

// URL pública del frontend, para armar el enlace del ticket que va dentro del QR.
function urlFrontend(req) {
  const origin = req?.headers?.origin;
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/+$/, '');
  return String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

// Acepta los ítems en cualquiera de estas formas:
//   { items: [{ productoId, cantidad }] }
//   { productos: [{ id, cantidad }] }
//   { productoId, cantidad }            (un solo producto)
function extraerItems(body = {}) {
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.productos)) return body.productos;
  if (body.productoId || body.id) return [{ productoId: body.productoId ?? body.id, cantidad: body.cantidad ?? 1 }];
  return [];
}

// Pedido creado desde el chatbot: sin nombre ni teléfono del cliente. El precio y
// el total se recalculan en la base de datos (crearPedidoBD), nunca se confían al
// cliente. Devuelve el id y el código del ticket, más el enlace para el QR.
export async function crearPedidoChat(req, res, next) {
  try {
    const crudos = extraerItems(req.body);
    if (!crudos.length || crudos.length > 50) {
      return res.status(400).json({ success: false, mensaje: 'Debes enviar entre 1 y 50 productos en "items".' });
    }

    const agrupados = new Map();
    for (const item of crudos) {
      const productoId = String(item?.productoId ?? item?.id ?? '').trim();
      const cantidad = Number(item?.cantidad ?? 1);
      if (!productoId || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 100) {
        return res.status(400).json({ success: false, mensaje: 'Producto o cantidad inválida (cantidad entre 1 y 100).' });
      }
      const total = (agrupados.get(productoId) || 0) + cantidad;
      if (total > 100) return res.status(400).json({ success: false, mensaje: 'Máximo 100 unidades por producto.' });
      agrupados.set(productoId, total);
    }
    const items = Array.from(agrupados, ([productoId, cantidad]) => ({ productoId, cantidad }));

    let pedido;
    try {
      pedido = await crearPedidoBD(null, items, { precioMayorista: false });
    } catch (error) {
      const mensaje = String(error?.message || '');
      // Errores de negocio del modelo: se devuelven con su texto para que el chatbot
      // pueda explicárselos al cliente.
      if (/no encontrado|inactivo/i.test(mensaje)) return res.status(404).json({ success: false, mensaje });
      if (/stock insuficiente|compra m[ií]nima/i.test(mensaje)) return res.status(409).json({ success: false, mensaje });
      if (error?.code === '22P02') return res.status(400).json({ success: false, mensaje: 'El id de producto no tiene un formato válido.' });
      throw error;
    }

    const urlTicket = `${urlFrontend(req)}/pedido/${pedido.id}`;
    return res.status(201).json({
      success: true,
      mensaje: 'Pedido generado correctamente',
      data: {
        id: pedido.id,
        codigo: pedido.codigo,
        total: pedido.total,
        estado: pedido.estado,
        fecha: pedido.fecha,
        items: pedido.items,
        // `qr.contenido` es el texto a codificar en el QR: abre el ticket en el kiosco
        // y la caja puede escanear o digitar `codigo`.
        qr: { contenido: urlTicket, url: urlTicket, codigo: pedido.codigo },
      },
    });
  } catch (error) {
    next(error);
  }
}
