const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validarPedidoIdParaQr(valor) {
  const pedidoId = String(valor ?? '').trim();

  if (!UUID.test(pedidoId)) {
    return { valido: false, mensaje: 'El ID del pedido no es válido.' };
  }

  return { valido: true, valor: pedidoId };
}

export function validarQrIdBaneco(valor) {
  const qrId = String(valor ?? '').trim();

  if (
    !qrId
    || qrId.length > 128
    || /[\\/?#\u0000-\u001f]/.test(qrId)
  ) {
    return { valido: false, mensaje: 'El ID del QR no es válido.' };
  }

  return { valido: true, valor: qrId };
}
