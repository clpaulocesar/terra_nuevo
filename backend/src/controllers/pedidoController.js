
import {
  crearPedidoBD,
  obtenerPedidoBD,
  ERP_ESTADOS_BLOQUEANTES,
  listarPedidosBD,
  obtenerAnaliticaHorariaBD,
  obtenerResumenPeriodoBD,
  actualizarEstadoPedidoBD,
  actualizarEntregaPedidoBD,
  asignarRepartidorBD,
  actualizarItemsPedidoBD,
} from '../models/pedidoModel.js';
import { obtenerPersonalBD } from '../models/personalModel.js';
import { pool } from '../config/database.js';
import { obtenerMayoristaDesdeToken } from '../services/sesionMayorista.js';
import {
  verificarPedidoConErp,
  confirmarPagoConErp,
  confirmarCotizacionManual,
  liberarPedidoVerificar,
  responderErrorHttp,
} from '../services/verificacionErp.js';

const UUID = /^[0-9a-f-]{36}$/i;

// Verificación previa contra el ERP de TERRA: la caja la pide al abrir el modal de cobro.
export async function verificarPedidoErp(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, mensaje: 'ID de pedido inválido.' });
    const actual = await obtenerPedidoBD(id);
    if (!actual) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado.' });
    if (['cancelled', 'cancelado'].includes(String(actual.estado || '').toLowerCase())) {
      return res.status(409).json({ success: false, mensaje: 'El pedido está anulado.' });
    }
    if (String(actual.estado || '') !== 'pending') {
      return res.json({ success: true, data: { pedido: actual, cambios: [], hayCambios: false, yaCobrado: true } });
    }
    if (ERP_ESTADOS_BLOQUEANTES.includes(String(actual.erp_estado || ''))) {
      return res.status(409).json({ success: false, mensaje: 'El pedido está en proceso de cobro con el ERP.', codigo: 'pedido_en_proceso', pedido: actual });
    }
    const resultado = await verificarPedidoConErp(actual.id);
    return res.json({ success: true, data: resultado });
  } catch (error) { return responderErrorHttp(res, next, error); }
}

// La cotización sí quedó en TERRA: el administrador cierra el cobro con su número.
export async function confirmarErpManual(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const numero = Number(req.body?.numero);
    const metodoPago = String(req.body?.metodoPago || 'efectivo').trim();
    if (!id) return res.status(400).json({ success: false, mensaje: 'ID de pedido inválido.' });
    if (!Number.isSafeInteger(numero) || numero < 1) return res.status(400).json({ success: false, mensaje: 'Ingresá el número de cotización de TERRA.' });
    if (!['efectivo', 'tarjeta', 'qr'].includes(metodoPago)) return res.status(400).json({ success: false, mensaje: 'Método de pago inválido.' });
    const pedido = await confirmarCotizacionManual(id, { numero, metodoPago, registradoPor: req.admin?.email || null });
    return res.json({ success: true, data: pedido, mensaje: `Cobro cerrado con la cotización TERRA Nº ${numero}.` });
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ success: false, mensaje: 'Ese número de cotización ya está asociado a otro pedido.' });
    return responderErrorHttp(res, next, error);
  }
}

// La cotización NO quedó en TERRA: habilitar el pedido para cobrarlo otra vez.
export async function reintentarErp(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, mensaje: 'ID de pedido inválido.' });
    if (req.body?.confirmoQueNoExiste !== true) {
      return res.status(400).json({ success: false, mensaje: 'Confirmá que la cotización no existe en el ERP (confirmoQueNoExiste: true).' });
    }
    const pedido = await liberarPedidoVerificar(id);
    return res.json({ success: true, data: pedido, mensaje: 'El pedido quedó habilitado para cobrarse de nuevo.' });
  } catch (error) { return responderErrorHttp(res, next, error); }
}

export async function registrarPagoPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const metodoPago = String(req.body?.metodoPago || '').trim();
    const comprobanteUrl = String(req.body?.comprobanteUrl || '').trim() || null;
    const costoEnvioCrudo = req.body?.costoEnvio;
    const costoEnvio = costoEnvioCrudo === undefined || costoEnvioCrudo === null || costoEnvioCrudo === '' ? null : Number(costoEnvioCrudo);
    if (!id || !['efectivo', 'tarjeta'].includes(metodoPago)) {
      return res.status(400).json({ success: false, mensaje: 'Datos de pago inválidos.' });
    }
    if (comprobanteUrl && (comprobanteUrl.length > 2000 || !/^https:\/\//i.test(comprobanteUrl))) {
      return res.status(400).json({ success: false, mensaje: 'La URL del comprobante no es válida.' });
    }
    if (costoEnvio !== null && (!Number.isFinite(costoEnvio) || costoEnvio < 0 || costoEnvio > 10000)) return res.status(400).json({ success: false, mensaje: 'Costo de envío inválido.' });
    const actual = await obtenerPedidoBD(id);
    if (!actual) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado.' });
    if (['cancelled', 'cancelado'].includes(String(actual.estado || '').toLowerCase())) {
      return res.status(409).json({ success: false, mensaje: 'No se puede cobrar un pedido anulado.' });
    }
    if (actual.tarifa_envio_pendiente && costoEnvio === null) return res.status(400).json({ success: false, mensaje: 'Ingresá el costo de envío antes de cobrar.' });
    // El cobro pasa por el ERP: verificación, cotización y cierre (services/verificacionErp.js).
    const { pedido, cotizacion } = await confirmarPagoConErp(actual.id, { metodoPago, comprobanteUrl, fuente: 'manual', costoEnvio });
    return res.json({ success: true, data: pedido, cotizacion: cotizacion || null });
  } catch (error) { return responderErrorHttp(res, next, error); }
}

export async function actualizarEstadoPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim(); const estado = String(req.body?.estado || '').trim();
    const permitidos = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
    if (!id || !permitidos.includes(estado)) return res.status(400).json({ success: false, mensaje: 'Estado inválido' });
    if (estado === 'cancelled') {
      const actual = await obtenerPedidoBD(id);
      if (!actual) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
      const estadoActual = String(actual.estado || '').toLowerCase();
      if (['completed', 'paid', 'pagado', 'shipped', 'delivered', 'entregado'].includes(estadoActual)) {
        return res.status(409).json({ success: false, mensaje: 'No se puede anular un pedido ya cobrado o entregado.' });
      }
      if (ERP_ESTADOS_BLOQUEANTES.includes(String(actual.erp_estado || ''))) {
        return res.status(409).json({ success: false, mensaje: 'El pedido está en proceso de cobro con el ERP de TERRA y no se puede anular.', codigo: 'pedido_en_proceso' });
      }
    }
    const pedido = await actualizarEstadoPedidoBD(id, estado);
    if (!pedido) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    return res.json({ success: true, data: pedido });
  } catch (error) { next(error); }
}

// Etapa del reparto a domicilio (en camino / entregado). Es independiente del
// pago: el pedido puede estar cobrado y seguir pendiente de entrega.
export async function actualizarEntregaPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const etapa = String(req.body?.etapa || '').trim();
    if (!id || !['en_camino', 'entregado', 'pendiente'].includes(etapa)) {
      return res.status(400).json({ success: false, mensaje: 'Etapa de entrega inválida' });
    }
    const actual = await obtenerPedidoBD(id);
    if (!actual) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    if (actual.tipo_entrega !== 'home_delivery') {
      return res.status(403).json({ success: false, mensaje: 'Este pedido se retira en tienda, no se envía a domicilio.' });
    }
    if (['cancelled', 'cancelado'].includes(String(actual.estado || '').toLowerCase())) {
      return res.status(409).json({ success: false, mensaje: 'El pedido está cancelado.' });
    }
    const pedido = await actualizarEntregaPedidoBD(id, etapa);
    return res.json({ success: true, data: pedido });
  } catch (error) { next(error); }
}

// Asigna un repartidor (rol despacho) al envío de un cliente mayorista.
export async function asignarRepartidorPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ success: false, mensaje: 'Pedido inválido' });

    const crudo = req.body?.repartidorId;
    const repartidorId = crudo === null || crudo === undefined || crudo === '' ? null : String(crudo).trim();
    if (repartidorId && !/^[0-9a-f-]{36}$/i.test(repartidorId)) {
      return res.status(400).json({ success: false, mensaje: 'Repartidor inválido' });
    }

    const actual = await obtenerPedidoBD(id);
    if (!actual) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    if (actual.tipo_entrega !== 'home_delivery') {
      return res.status(403).json({ success: false, mensaje: 'Este pedido se retira en tienda, no se envía a domicilio.' });
    }
    if (['cancelled', 'cancelado'].includes(String(actual.estado || '').toLowerCase())) {
      return res.status(409).json({ success: false, mensaje: 'El pedido está cancelado.' });
    }

    if (repartidorId) {
      const repartidor = await obtenerPersonalBD(repartidorId);
      if (!repartidor || repartidor.rol !== 'despacho') {
        return res.status(400).json({ success: false, mensaje: 'Selecciona un repartidor válido.' });
      }
      if (!repartidor.activo) {
        return res.status(409).json({ success: false, mensaje: 'Ese repartidor está inactivo.' });
      }
    }

    const pedido = await asignarRepartidorBD(id, repartidorId);
    if (!pedido) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    return res.json({
      success: true,
      data: pedido,
      mensaje: repartidorId ? 'Envío asignado al repartidor.' : 'El envío quedó sin repartidor.',
    });
  } catch (error) { next(error); }
}

export async function listarPedidos(req, res, next) {
  try {
    const limite = Number(req.query.limite ?? 100);
    if (!Number.isSafeInteger(limite) || limite < 1 || limite > 200) return res.status(400).json({ success: false, mensaje: 'Límite inválido' });
    const estado = String(req.query.estado ?? '').trim();
    const permitidos = ['', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
    if (!permitidos.includes(estado)) return res.status(400).json({ success: false, mensaje: 'Estado inválido' });
    const entregaSolicitada = String(req.query.entrega ?? '').trim();
    if (!['', 'domicilio', 'retiro'].includes(entregaSolicitada)) return res.status(400).json({ success: false, mensaje: 'Tipo de entrega inválido' });
    // Despacho solo ve lo que tiene que repartir a domicilio.
    const entrega = req.admin?.rol === 'despacho' ? 'domicilio' : entregaSolicitada;
    const repartidorId = req.admin?.rol === 'despacho' ? req.admin.id : null;
    const pedidos = await listarPedidosBD({ buscar: String(req.query.buscar ?? '').trim(), estado, entrega, repartidorId, limite });
    return res.json({ success: true, data: pedidos });
  } catch (error) { next(error); }
}

export async function obtenerAnaliticaHoraria(req, res, next) {
  try {
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
    const desde = String(req.query.desde || hoy);
    const hasta = String(req.query.hasta || desde);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta) return res.status(400).json({ success: false, mensaje: 'Rango de fechas inválido.' });
    const convertirHora = (valor) => valor === undefined || valor === '' ? null : Number(valor);
    const horaInicio = convertirHora(req.query.horaInicio);
    const horaFin = convertirHora(req.query.horaFin);
    if ((horaInicio !== null && (!Number.isInteger(horaInicio) || horaInicio < 0 || horaInicio > 23)) || (horaFin !== null && (!Number.isInteger(horaFin) || horaFin < 0 || horaFin > 23)) || (horaInicio !== null && horaFin !== null && horaInicio > horaFin)) return res.status(400).json({ success: false, mensaje: 'Franja horaria inválida.' });
    const analitica = await obtenerAnaliticaHorariaBD({ desde, hasta, horaInicio, horaFin });
    return res.json({ success: true, data: analitica });
  } catch (error) { next(error); }
}

// ---- Comparativa de períodos (hoy vs ayer, semana vs anterior, mes vs anterior, rango libre) ----
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaLaPaz = (fecha = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(fecha);
const sumarDias = (iso, dias) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); };
const fechaValida = (iso) => FORMATO_FECHA.test(String(iso || '')) && !Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime());

// Los períodos "a la fecha" se comparan con la misma porción del período anterior:
// semana = lunes..hoy vs lunes..mismo día de la semana pasada; mes = 1..hoy vs 1..mismo día del mes pasado.
function rangosComparativa(periodo, hoy) {
  if (periodo === 'dia') {
    const ayer = sumarDias(hoy, -1);
    return { actual: { desde: hoy, hasta: hoy }, anterior: { desde: ayer, hasta: ayer } };
  }
  if (periodo === 'semana') {
    const diaSemana = new Date(`${hoy}T00:00:00Z`).getUTCDay(); // 0 = domingo
    const lunes = sumarDias(hoy, -((diaSemana + 6) % 7));
    return { actual: { desde: lunes, hasta: hoy }, anterior: { desde: sumarDias(lunes, -7), hasta: sumarDias(hoy, -7) } };
  }
  if (periodo === 'mes') {
    const [anio, mes, dia] = hoy.split('-').map(Number);
    const primeroActual = `${hoy.slice(0, 8)}01`;
    const anioAnterior = mes === 1 ? anio - 1 : anio;
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const ultimoDiaAnterior = new Date(Date.UTC(anio, mes - 1, 0)).getUTCDate();
    const prefijo = `${anioAnterior}-${String(mesAnterior).padStart(2, '0')}-`;
    return { actual: { desde: primeroActual, hasta: hoy }, anterior: { desde: `${prefijo}01`, hasta: `${prefijo}${String(Math.min(dia, ultimoDiaAnterior)).padStart(2, '0')}` } };
  }
  return null;
}

// Totales de un rango de fechas para los indicadores del dashboard (hoy, ayer o rango libre).
export async function obtenerResumenPeriodo(req, res, next) {
  try {
    const desde = String(req.query.desde || fechaLaPaz());
    const hasta = String(req.query.hasta || desde);
    if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) return res.status(400).json({ success: false, mensaje: 'Rango de fechas inválido.' });
    return res.json({ success: true, data: await obtenerResumenPeriodoBD({ desde, hasta }) });
  } catch (error) { next(error); }
}

export async function obtenerComparativaPeriodos(req, res, next) {
  try {
    const periodo = String(req.query.periodo || 'dia');
    let rangos = rangosComparativa(periodo, fechaLaPaz());
    if (periodo === 'personalizado') {
      const { desde, hasta, desde2, hasta2 } = req.query;
      if (![desde, hasta, desde2, hasta2].every(fechaValida) || desde > hasta || desde2 > hasta2) return res.status(400).json({ success: false, mensaje: 'Rangos de fechas inválidos.' });
      rangos = { actual: { desde, hasta }, anterior: { desde: desde2, hasta: hasta2 } };
    }
    if (!rangos) return res.status(400).json({ success: false, mensaje: 'Período inválido. Usa dia, semana, mes o personalizado.' });
    const [actual, anterior] = await Promise.all([obtenerResumenPeriodoBD(rangos.actual), obtenerResumenPeriodoBD(rangos.anterior)]);
    return res.json({ success: true, data: { periodo, actual, anterior } });
  } catch (error) { next(error); }
}

export async function crearPedido(req, res, next) {
  try {
    let clienteId = req.body?.clienteId == null ? null : String(req.body.clienteId).trim();
    const mayorista = req.headers.authorization ? await obtenerMayoristaDesdeToken(req.headers.authorization) : null;
    if (req.headers.authorization && !mayorista) return res.status(403).json({ success: false, mensaje: 'La sesión mayorista no es válida.' });
    if (mayorista && !clienteId) clienteId = mayorista.cliente_id;

    const items = req.body?.items;
    const metodoPagoSolicitado = String(req.body?.metodoPago || '').trim();

    if (!['efectivo', 'qr'].includes(metodoPagoSolicitado)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Seleccioná un método de pago válido.',
      });
    }

    if (
      clienteId !== null &&
      !clienteId
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cliente inválido',
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debes enviar entre 1 y 50 productos',
      });
    }

    const entregaDomicilio = req.body?.entregaDomicilio === true;
    const agrupados = new Map();

    for (const item of items) {
      const productoId = String(item?.productoId || '').trim();
      const cantidad = Number(item?.cantidad);
      const tipoEntrega = entregaDomicilio
        ? (item?.tipoEntrega === 'store_pickup' ? 'store_pickup' : 'home_delivery')
        : 'store_pickup';

      if (
        !productoId ||
        !Number.isSafeInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 100
      ) {
        return res.status(400).json({
          success: false,
          mensaje: 'Producto o cantidad inválida',
        });
      }

      const clave = `${productoId}__${tipoEntrega}`;
      const cantidadTotal = (agrupados.get(clave) || 0) + cantidad;

      if (cantidadTotal > 100) {
        return res.status(400).json({
          success: false,
          mensaje: 'Máximo 100 unidades por producto',
        });
      }

      agrupados.set(clave, cantidadTotal);
    }

    const itemsNormalizados = Array.from(
      agrupados,
      ([clave, cantidad]) => {
        const [productoId, tipoEntrega] = clave.split('__');
        return { productoId, cantidad, tipoEntrega };
      }
    );
    let entrega = null;
    if (entregaDomicilio) {
      const zonaId = String(req.body?.zonaEnvioId || '').trim();
      const tarifaPendiente = !mayorista;
      if (!tarifaPendiente && (!zonaId || zonaId.length > 80)) {
        return res.status(400).json({ success: false, mensaje: 'Seleccioná una zona de envío válida.' });
      }
      const direccionDirecta = String(req.body?.direccion || req.body?.direccionEntrega || '').trim();
      const referenciaDirecta = String(req.body?.referencia || req.body?.referenciaEntrega || '').trim();

      if (direccionDirecta) {
        // Prioridad: dirección directa ingresada en el checkout (cliente minorista o mayorista con dirección explícita)
        entrega = {
          zonaId,
          tarifaPendiente,
          direccion: direccionDirecta,
          referencia: referenciaDirecta || null,
          latitud: null,
          longitud: null,
        };
      } else if (mayorista) {
        if (!mayorista.direccion) {
          return res.status(400).json({ success: false, mensaje: 'Registrá una dirección de entrega antes de solicitar el envío a domicilio.' });
        }
        entrega = {
          zonaId,
          tarifaPendiente: false,
          direccion: mayorista.direccion,
          referencia: mayorista.referencia || null,
          latitud: mayorista.latitud ?? null,
          longitud: mayorista.longitud ?? null,
        };
      } else {
        return res.status(400).json({ success: false, mensaje: 'Ingresá la dirección para el envío a domicilio.' });
      }
    }

    const pedido = await crearPedidoBD(
      clienteId,
      itemsNormalizados,
      {
        precioMayorista: Boolean(mayorista),
        entrega,
        metodoPagoSolicitado,
      }
    );

    return res.status(201).json({
      success: true,
      mensaje: 'Pedido generado correctamente',
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
}

export async function crearVentaDirecta(req, res, next) {
  try {
    const clienteId = req.body?.clienteId == null ? null : String(req.body.clienteId).trim();
    const metodoPago = String(req.body?.metodoPago || '').trim();
    const items = req.body?.items;
    if (!['qr', 'efectivo', 'tarjeta'].includes(metodoPago)) return res.status(400).json({ success: false, mensaje: 'Selecciona un método de pago válido.' });
    if (!Array.isArray(items) || !items.length || items.length > 50) return res.status(400).json({ success: false, mensaje: 'Debes agregar entre 1 y 50 productos.' });
    const agrupados = new Map();
    for (const item of items) {
      const productoId = String(item?.productoId || '').trim(); const cantidad = Number(item?.cantidad);
      if (!productoId || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 100) return res.status(400).json({ success: false, mensaje: 'Producto o cantidad inválida.' });
      const total = (agrupados.get(productoId) || 0) + cantidad;
      if (total > 100) return res.status(400).json({ success: false, mensaje: 'Máximo 100 unidades por producto.' });
      agrupados.set(productoId, total);
    }
    const tipoMayoristaManual = req.body?.tipoMayoristaManual === true;
    let precioMayorista = tipoMayoristaManual;
    if (clienteId) {
      const cliente = await pool.query(`SELECT u.role FROM customers c LEFT JOIN users u ON u.auth_user_id=c.auth_user_id WHERE c.id=$1`, [clienteId]);
      if (!cliente.rowCount) return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado.' });
      precioMayorista = cliente.rows[0].role === 'mayorista';
    }
    const pedido = await crearPedidoBD(clienteId, Array.from(agrupados, ([productoId, cantidad]) => ({ productoId, cantidad })), { precioMayorista });
    // Mismo flujo que la caja: verificar en el ERP, cotizar y cerrar. Si el ERP ajusta el
    // pedido, queda `pending` y el frontend lo reconfirma con PATCH /pedidos/:id/pago.
    const { pedido: cobrado, cotizacion } = await confirmarPagoConErp(pedido.id, { metodoPago, comprobanteUrl: null, fuente: 'manual' });
    return res.status(201).json({ success: true, mensaje: 'Venta directa registrada.', cotizacion: cotizacion || null, data: { ...cobrado, tipoCliente: precioMayorista ? 'mayorista' : 'minorista' } });
  } catch (error) { return responderErrorHttp(res, next, error); }
}

export async function obtenerPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de pedido inválido',
      });
    }

    const pedido = await obtenerPedidoBD(id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        mensaje: 'Pedido no encontrado',
      });
    }

    return res.json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
}

export async function actualizarItemsPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const items = req.body?.items;
    const direccion = req.body?.direccion;
    const referencia = req.body?.referencia;
    if (!id) {
      return res.status(400).json({ success: false, mensaje: 'ID de pedido inválido' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, mensaje: 'Debes enviar al menos un producto para el pedido' });
    }
    const pedido = await actualizarItemsPedidoBD(id, items, { direccion, referencia });
    return res.json({ success: true, mensaje: 'Pedido actualizado correctamente', data: pedido });
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ success: false, mensaje: error.message });
    next(error);
  }
}
