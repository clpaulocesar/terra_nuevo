import { apiRequest } from './api.js';
import { getAdminToken } from './adminService.js';

function encabezados() {
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión como administrador.');
  return { Authorization: `Bearer ${token}` };
}

export function prepararErp() {
  return apiRequest('/erp/preparar', { method: 'POST', headers: encabezados() });
}

export function sincronizarProductosErp(codigos, incluirImagenes) {
  return apiRequest('/erp/sincronizaciones/productos', {
    method: 'POST',
    headers: encabezados(),
    body: { codigos, incluirImagenes },
  });
}
