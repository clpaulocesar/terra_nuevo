import { apiRequest } from './api.js';
import { getAdminToken } from './adminService.js';

export async function obtenerAnaliticaVisitas({ desde, hasta, signal }) {
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión como administrador para consultar las visitas.');

  const parametros = new URLSearchParams({ desde, hasta });
  return apiRequest(`/visitas/analitica?${parametros}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}
