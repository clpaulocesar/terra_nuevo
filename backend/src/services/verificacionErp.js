import {
  obtenerItemsParaErpBD,
  obtenerCabeceraPedidoBD,
  obtenerPedidoBD,
  reclamarPedidoParaCobroBD,
  actualizarErpEstadoBD,
  aplicarVerificacionErpBD,
  completarPedidoConCotizacionBD,
  registrarPagoPedidoBD,
} from '../models/pedidoModel.js';
import {
  crearIntentoCotizacionBD,
  actualizarIntentoCotizacionBD,
  obtenerIntentoPendienteBD,
  hashRespuestaErp,
} from '../models/erpModel.js';
import {
  ErrorErp,
  erpHabilitado,
  consultarPorCodigoTerra,
  crearCotizacion,
  stockAlmacenVenta,
  enParalelo,
} from './erpTerra.js';

// Error con código HTTP y datos extra para la respuesta (cambios, pedido, detalles).
export class ErrorHttp extends Error {
  constructor(statusCode, mensaje, extra = {}) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

// Responde un ErrorHttp con su carga extra; cualquier otro error sigue al errorHandler.
export function responderErrorHttp(res, next, error) {
  if (error instanceof ErrorHttp) {
    return res.status(error.statusCode).json({ success: false, mensaje: error.message, ...error.extra });
  }
  return next(error);
}

// Traduce un fallo del cliente ERP durante la verificación a HTTP. Nunca se cobra.
function errorHttpDesdeErp(error, contexto = 'verificar') {
  if (!(error instanceof ErrorErp)) return error;
  if (error.tipo === 'bloqueado') return new ErrorHttp(503, 'El ERP de TERRA bloqueó temporalmente el acceso. Intentá en unos minutos.', { codigo: 'erp_bloqueado' });
  if (error.tipo === 'auth' || error.tipo === 'config') {
    console.error(`[ERP] Error de configuración al ${contexto}: ${error.codigo} - ${error.message}`);
    return new ErrorHttp(502, 'La conexión con el ERP de TERRA está mal configurada. Avisá al administrador.', { codigo: error.codigo || 'erp_config' });
  }
  return new ErrorHttp(503, 'No se pudo verificar con TERRA. Reintentá en unos segundos; no se cobró nada.', { codigo: 'erp_no_disponible', detalle: error.codigo || null });
}

const aMinor = (valor) => Math.round(Number(valor || 0) * 100);
const aMonto = (minor) => Number(minor || 0) / 100;

function precioMayoristaMinor(item, cantidad) {
  const escalas = Array.isArray(item.escalas) ? item.escalas : [];
  const tramo = escalas
    .map((e) => ({ minCantidad: Number(e?.minCantidad), precio: Number(e?.precio) }))
    .filter((e) => Number.isSafeInteger(e.minCantidad) && e.minCantidad <= cantidad && Number.isFinite(e.precio))
    .sort((a, b) => a.minCantidad - b.minCantidad)
    .at(-1);
  if (tramo) return aMinor(tramo.precio);
  const base = item.precio_mayorista === null || item.precio_mayorista === undefined || String(item.precio_mayorista).trim() === ''
    ? Number.NaN
    : Number(item.precio_mayorista);
  return Number.isFinite(base) ? aMinor(base) : null;
}

// Precio que corresponde cobrar: oferta local si está activa; si no, el precio
// público que acaba de informar el ERP. El mayorista conserva su escala/precio B2B
// (pendiente de definir con TERRA cómo se refleja en la cotización).
function precioValidoMinor(item, erp, cantidad, esMayorista) {
  if (esMayorista) {
    const mayorista = precioMayoristaMinor(item, cantidad);
    if (mayorista !== null) return mayorista;
  }
  const enOferta = item.en_oferta === true && Number(item.precio_oferta) > 0;
  if (enOferta) return aMinor(item.precio_oferta);
  const publico = Number(erp?.precioPublico);
  return Number.isFinite(publico) && publico >= 0 ? aMinor(publico) : Number(item.unit_price_minor);
}

// Verificación previa contra el ERP (§5): solo lectura en TERRA. Reescribe productos,
// ajusta el pedido si hace falta y devuelve { pedido, cambios, hayCambios, bloqueado }.
// `bloqueado` = algún producto no tiene `codigo_terra`: no se puede verificar ni cotizar
// hasta que el administrador complete el código; el ítem no se toca y el cobro se frena.
export async function verificarPedidoConErp(pedidoId) {
  const cabecera = await obtenerCabeceraPedidoBD(pedidoId);
  if (!cabecera) throw new ErrorHttp(404, 'Pedido no encontrado.');
  if (!erpHabilitado()) {
    return { pedido: await obtenerPedidoBD(cabecera.id), cambios: [], hayCambios: false, bloqueado: false, erpDeshabilitado: true };
  }
  const items = await obtenerItemsParaErpBD(cabecera.id);
  const esMayorista = cabecera.rol_cliente === 'mayorista';

  const productosDistintos = new Map();
  for (const item of items) {
    if (item.producto_id && String(item.codigo_terra || '').trim() && !productosDistintos.has(item.producto_id)) productosDistintos.set(item.producto_id, item);
  }

  let consultas;
  try {
    consultas = await enParalelo([...productosDistintos.values()], async (producto) => {
      const erp = await consultarPorCodigoTerra(String(producto.codigo_terra).trim());
      return { productoId: producto.producto_id, erp, stockVenta: stockAlmacenVenta(erp), hash: hashRespuestaErp(erp) };
    });
  } catch (error) {
    throw errorHttpDesdeErp(error, 'verificar el pedido');
  }
  const consultaPorProducto = new Map(consultas.map((c) => [c.productoId, c]));

  // Stock disponible compartido entre líneas del mismo producto (envío + retiro).
  const restante = new Map();
  for (const [productoId, c] of consultaPorProducto) restante.set(productoId, c.stockVenta);

  const cambios = [];
  const ajustes = [];
  let bloqueado = false;
  for (const item of items) {
    const base = { itemId: item.item_id, productoId: item.producto_id || null, nombre: item.nombre };
    if (item.producto_id && !String(item.codigo_terra || '').trim()) {
      bloqueado = true;
      cambios.push({ ...base, tipo: 'sin_codigo', antes: Number(item.cantidad), despues: Number(item.cantidad) });
      continue;
    }
    const erp = item.producto_id ? consultaPorProducto.get(item.producto_id)?.erp : null;
    if (!erp) {
      ajustes.push({ itemId: item.item_id, eliminar: true });
      cambios.push({ ...base, tipo: 'sin_stock', antes: Number(item.cantidad), despues: 0 });
      continue;
    }
    const disponible = restante.get(item.producto_id) || 0;
    const cantidad = Number(item.cantidad);
    const cantidadValida = Math.min(cantidad, disponible);
    restante.set(item.producto_id, disponible - cantidadValida);
    if (cantidadValida < 1) {
      ajustes.push({ itemId: item.item_id, eliminar: true });
      cambios.push({ ...base, tipo: 'sin_stock', antes: cantidad, despues: 0 });
      continue;
    }
    if (cantidadValida < cantidad) cambios.push({ ...base, tipo: 'cantidad_reducida', antes: cantidad, despues: cantidadValida });
    const precioMinor = precioValidoMinor(item, erp, cantidadValida, esMayorista);
    if (precioMinor !== Number(item.unit_price_minor)) {
      cambios.push({ ...base, tipo: 'precio_actualizado', antes: aMonto(item.unit_price_minor), despues: aMonto(precioMinor) });
    }
    ajustes.push({ itemId: item.item_id, cantidad: cantidadValida, precioUnitarioMinor: precioMinor, erpCodigo: erp.codigo ? String(erp.codigo) : null });
  }

  const pedido = await aplicarVerificacionErpBD(cabecera.id, {
    productos: [...consultaPorProducto.values()],
    ajustes,
  });
  const hayCambios = cambios.some((c) => c.tipo !== 'sin_codigo') || !pedido?.items?.length;
  return { pedido, cambios, hayCambios, bloqueado };
}

// Agrupa los ítems por código interno del ERP (cantidad 1–9999).
function agruparParaCotizacion(items) {
  const grupos = new Map();
  for (const item of items) {
    const codigo = String(item.erp_codigo || '').trim();
    if (!codigo) throw new ErrorHttp(502, `El producto «${item.nombre}» no tiene código del ERP. Verificá el pedido de nuevo.`, { codigo: 'producto_sin_codigo_erp' });
    grupos.set(codigo, (grupos.get(codigo) || 0) + Number(item.cantidad));
  }
  return [...grupos].map(([codigo, cantidad]) => ({ codigo, cantidad }));
}

// Relaciona los `detalles` del 422 con los ítems del pedido cuando traen `codigo`.
function mapearDetalles(detalles, items) {
  if (!Array.isArray(detalles)) return detalles ?? null;
  return detalles.map((detalle) => {
    if (!detalle || typeof detalle !== 'object') return { mensaje: String(detalle) };
    const codigo = String(detalle.codigo ?? detalle.producto ?? '').trim();
    const item = codigo ? items.find((i) => String(i.erp_codigo || '') === codigo) : null;
    return { ...detalle, productoId: item?.producto_id || null, nombre: item?.nombre || null };
  });
}

async function liberarReclamo(id) {
  await actualizarErpEstadoBD(id, { estado: null, soloSiEstado: 'enviando' });
}

// Flujo de cobro (§6): reclamo atómico → verificación → cotización → cierre.
// Cada POST /api/cotizaciones queda registrado como una fila de `erp_quotations`.
export async function confirmarPagoConErp(pedidoId, { metodoPago, comprobanteUrl = null, costoEnvio = null, fuente = 'manual' } = {}) {
  const cabecera = await obtenerCabeceraPedidoBD(pedidoId);
  if (!cabecera) throw new ErrorHttp(404, 'Pedido no encontrado.');
  if (['cancelled', 'cancelado'].includes(String(cabecera.status || '').toLowerCase())) throw new ErrorHttp(409, 'No se puede cobrar un pedido anulado.');
  const id = cabecera.id;

  if (!erpHabilitado()) {
    // Modo sin ERP (solo desarrollo): se cobra como antes, sin cotización ni descuento de stock.
    if (!(await reclamarPedidoParaCobroBD(id))) throw new ErrorHttp(409, 'El pedido ya fue cobrado o se está procesando.', { codigo: 'pedido_en_proceso' });
    try {
      const pedido = await registrarPagoPedidoBD(id, { metodoPago, comprobanteUrl, fuente, costoEnvio });
      return { pedido, erpDeshabilitado: true };
    } finally {
      await liberarReclamo(id);
    }
  }

  // Paso 1: reclamar.
  if (!(await reclamarPedidoParaCobroBD(id))) throw new ErrorHttp(409, 'El pedido ya fue cobrado o se está procesando.', { codigo: 'pedido_en_proceso' });

  // Paso 2: verificar siempre.
  let verificacion;
  try {
    verificacion = await verificarPedidoConErp(id);
  } catch (error) {
    await liberarReclamo(id);
    throw error;
  }
  if (verificacion.bloqueado) {
    await liberarReclamo(id);
    throw new ErrorHttp(409, 'Hay productos sin código TERRA: no se pueden verificar ni cotizar. Completá el código en Productos antes de cobrar.', {
      codigo: 'pedido_bloqueado', cambios: verificacion.cambios, pedido: verificacion.pedido,
    });
  }
  if (verificacion.hayCambios) {
    await liberarReclamo(id);
    throw new ErrorHttp(409, 'El pedido se ajustó con los datos del ERP. Revisá el nuevo total y confirmá el cobro de nuevo.', {
      codigo: 'pedido_ajustado', cambios: verificacion.cambios, pedido: verificacion.pedido,
    });
  }

  // Paso 3: cotización (un intento = una fila en erp_quotations).
  const items = await obtenerItemsParaErpBD(id);
  let grupos;
  try {
    grupos = agruparParaCotizacion(items);
  } catch (error) {
    await liberarReclamo(id);
    throw error;
  }
  const intento = await crearIntentoCotizacionBD(id, grupos);
  const resultado = await crearCotizacion(grupos);

  // Paso 4a: cotización creada.
  if (resultado.ok) {
    let pedido;
    try {
      pedido = await completarPedidoConCotizacionBD(id, {
        metodoPago, comprobanteUrl, fuente, costoEnvio, cotizacion: resultado, intentoId: intento.id, estadoPrevio: 'enviando',
      });
    } catch (error) {
      console.error(`[ERP] Cotización ${resultado.numero} creada pero no se pudo cerrar el pedido ${id}: ${error.message}`);
      await actualizarIntentoCotizacionBD(intento.id, { status: 'verificar', erpNumber: resultado.numero, response: resultado.respuesta, errorMessage: `Cierre local fallido: ${error.message}` }).catch(() => {});
      await actualizarErpEstadoBD(id, { estado: 'verificar', numero: resultado.numero }).catch(() => {});
      throw new ErrorHttp(500, `La cotización ${resultado.numero} quedó registrada en TERRA pero el pedido no se pudo cerrar. Conciliá manualmente.`, {
        codigo: 'cierre_local_fallido', numero: resultado.numero,
      });
    }
    if (!pedido) {
      await actualizarIntentoCotizacionBD(intento.id, { status: 'verificar', erpNumber: resultado.numero, response: resultado.respuesta, errorMessage: 'El pedido cambió de estado durante el cierre.' }).catch(() => {});
      await actualizarErpEstadoBD(id, { estado: 'verificar', numero: resultado.numero }).catch(() => {});
      throw new ErrorHttp(500, `La cotización ${resultado.numero} se registró en TERRA pero el pedido cambió de estado. Conciliá manualmente.`, {
        codigo: 'cierre_local_fallido', numero: resultado.numero,
      });
    }
    return { pedido, cotizacion: { numero: resultado.numero, fecha: resultado.fecha, total: resultado.total } };
  }

  // Paso 4b: 422, nada se grabó.
  if (resultado.tipo === 'rechazado') {
    await actualizarIntentoCotizacionBD(intento.id, { status: 'rechazado', response: { codigo: resultado.codigo, detalles: resultado.detalles }, errorMessage: resultado.mensaje, completado: true });
    await actualizarErpEstadoBD(id, { estado: 'rechazado' });
    throw new ErrorHttp(409, `TERRA rechazó la cotización: ${resultado.mensaje}`, {
      codigo: 'cotizacion_rechazada', detalles: mapearDetalles(resultado.detalles, items), pedido: await obtenerPedidoBD(id),
    });
  }

  // Paso 4c: resultado desconocido (timeout, red, 5xx). No se reintenta solo.
  if (resultado.tipo === 'desconocido') {
    console.error(`[ERP] Resultado desconocido al cotizar el pedido ${id}: ${resultado.codigo} - ${resultado.mensaje}`);
    await actualizarIntentoCotizacionBD(intento.id, { status: 'verificar', errorMessage: `${resultado.codigo}: ${resultado.mensaje}` });
    await actualizarErpEstadoBD(id, { estado: 'verificar' });
    throw new ErrorHttp(502, 'No se obtuvo respuesta de TERRA. Verificá en el ERP si se registró la cotización antes de reintentar.', {
      codigo: 'erp_resultado_desconocido',
    });
  }

  // Paso 4d: credenciales, bloqueo, 400/403: nada se grabó.
  await actualizarIntentoCotizacionBD(intento.id, { status: 'rechazado', errorMessage: `${resultado.codigo}: ${resultado.mensaje}`, completado: true });
  await liberarReclamo(id);
  console.error(`[ERP] Error de configuración al cotizar el pedido ${id}: ${resultado.codigo} - ${resultado.mensaje}`);
  if (resultado.tipoError === 'bloqueado') throw new ErrorHttp(503, 'El ERP de TERRA bloqueó temporalmente el acceso. Intentá en unos minutos.', { codigo: 'erp_bloqueado' });
  throw new ErrorHttp(502, 'La conexión con el ERP de TERRA está mal configurada. Avisá al administrador.', { codigo: resultado.codigo || 'erp_config' });
}

// La cotización sí existe en TERRA (estado `verificar`): cerrar el cobro con su número.
// Se completa el intento pendiente en lugar de crear otro.
export async function confirmarCotizacionManual(pedidoId, { numero, metodoPago, comprobanteUrl = null, costoEnvio = null, registradoPor = null }) {
  const cabecera = await obtenerCabeceraPedidoBD(pedidoId);
  if (!cabecera) throw new ErrorHttp(404, 'Pedido no encontrado.');
  if (cabecera.erp_estado !== 'verificar') throw new ErrorHttp(409, 'Solo se puede registrar manualmente una cotización cuando el pedido está pendiente de verificar en el ERP.', { codigo: 'estado_erp_invalido' });
  const pendiente = await obtenerIntentoPendienteBD(cabecera.id);
  const intento = pendiente || await crearIntentoCotizacionBD(cabecera.id, agruparParaCotizacion(await obtenerItemsParaErpBD(cabecera.id)));
  const pedido = await completarPedidoConCotizacionBD(cabecera.id, {
    metodoPago, comprobanteUrl, costoEnvio, fuente: 'manual',
    intentoId: intento.id,
    estadoPrevio: 'verificar',
    cotizacion: { numero, respuesta: { manual: true, numero, registradoPor, fecha: new Date().toISOString() } },
  });
  if (!pedido) throw new ErrorHttp(409, 'El pedido cambió de estado mientras se registraba la cotización.', { codigo: 'estado_erp_invalido' });
  return pedido;
}

// La cotización NO existe en TERRA: liberar el pedido para cobrarlo de nuevo.
export async function liberarPedidoVerificar(pedidoId, { registradoPor = null } = {}) {
  const cabecera = await obtenerCabeceraPedidoBD(pedidoId);
  if (!cabecera) throw new ErrorHttp(404, 'Pedido no encontrado.');
  if (cabecera.erp_estado !== 'verificar') throw new ErrorHttp(409, 'El pedido no está pendiente de verificar en el ERP.', { codigo: 'estado_erp_invalido' });
  const pendiente = await obtenerIntentoPendienteBD(cabecera.id);
  if (pendiente) {
    await actualizarIntentoCotizacionBD(pendiente.id, { status: 'rechazado', errorMessage: `Confirmado como inexistente en el ERP${registradoPor ? ` por ${registradoPor}` : ''}.`, completado: true });
  }
  await actualizarErpEstadoBD(cabecera.id, { estado: 'rechazado', soloSiEstado: 'verificar' });
  return obtenerPedidoBD(cabecera.id);
}
