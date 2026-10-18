import { apiRequest } from './api.js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export async function iniciarSesionCliente(email, password) {
  if (!supabaseUrl || !supabaseKey) throw new Error('Falta configurar Supabase para iniciar sesión.');
  const respuesta = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !data.access_token) throw new Error(data.error_description || 'Correo o contraseña incorrectos.');
  const perfil = await apiRequest('/clientes/sesion', { headers: { Authorization: `Bearer ${data.access_token}` } });
  return { ...perfil, token: data.access_token };
}

export async function listarMisPedidosMayorista(token) {
  if (!token) throw new Error('Inicia sesión como mayorista.');
  return apiRequest('/clientes/mis-pedidos', { headers: { Authorization: `Bearer ${token}` } });
}
