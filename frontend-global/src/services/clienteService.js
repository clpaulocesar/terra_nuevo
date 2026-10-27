import { apiRequest } from './api.js';

export async function registrarClienteBackend(datos) {
  try {
    const res = await apiRequest('/clientes', {
      method: 'POST',
      body: datos,
    });
    return { success: true, cliente: res };
  } catch (err) {
    console.warn('Error al registrar cliente en backend:', err.message);
    return {
      success: false,
      mensaje: err.message,
    };
  }
}

export async function buscarClienteBackend(idOCi) {
  try {
    const res = await apiRequest(`/clientes/${idOCi}`);
    return res;
  } catch (err) {
    console.warn('Error al buscar cliente en backend:', err.message);
    return null;
  }
}
