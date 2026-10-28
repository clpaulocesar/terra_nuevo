import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { CLIENTE_TOKEN_SECRET } from '../config/secretos.js';
import { asegurarColumnasPerfilBD } from '../models/clienteModel.js';
import {
  asegurarColumnasUsuariosBD,
  buscarMayoristaPorEmailBD,
  registrarLoginMayoristaBD,
} from '../models/mayoristaModel.js';

// Sesión de clientes mayoristas con el mismo esquema que el personal (authAdmin.js):
// token `payload_base64url.firma_HMAC-SHA256`, 8 horas, firmado con CLIENTE_TOKEN_SECRET.
const DURACION_MS = 8 * 60 * 60 * 1000;

function firma(payload) {
  return createHmac('sha256', CLIENTE_TOKEN_SECRET).update(payload).digest('base64url');
}

export function crearTokenMayorista({ userId, customerId }) {
  const expira = Date.now() + DURACION_MS;
  const payload = Buffer.from(JSON.stringify({ tipo: 'mayorista', userId, customerId, exp: expira })).toString('base64url');
  return { token: `${payload}.${firma(payload)}`, expira };
}

// Devuelve los datos del token si la firma es válida, es de tipo mayorista y no venció.
export function verificarTokenMayorista(token) {
  const [payload, firmaRecibida] = String(token || '').split('.');
  if (!payload || !firmaRecibida) return null;
  const firmaEsperada = firma(payload);
  try {
    if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(Buffer.from(firmaRecibida), Buffer.from(firmaEsperada))) return null;
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (datos.tipo !== 'mayorista' || !datos.userId || !(Number(datos.exp) > Date.now())) return null;
    return datos;
  } catch {
    return null;
  }
}

const CAMPOS_PERFIL = `c.id AS cliente_id, c.name AS nombre, c.contact_name AS titular, c.email,
            c.phone AS telefono, c.nit, c.delivery_address AS direccion,
            c.delivery_reference AS referencia, c.delivery_lat AS latitud,
            c.delivery_lng AS longitud,
            CASE WHEN c.delivery_lat IS NOT NULL AND c.delivery_lng IS NOT NULL
              THEN c.delivery_lat::text || ', ' || c.delivery_lng::text END AS gps,
            u.id AS user_id, u.role AS rol`;

// Perfil del mayorista activo a partir del id de `users`.
export async function obtenerPerfilMayoristaBD(userId) {
  await Promise.all([asegurarColumnasPerfilBD(), asegurarColumnasUsuariosBD()]);
  const perfil = await pool.query(
    `SELECT ${CAMPOS_PERFIL}
       FROM users u
       LEFT JOIN customers c ON c.auth_user_id = u.auth_user_id
      WHERE u.id = $1 AND u.is_active = TRUE AND u.role = 'mayorista'
      LIMIT 1`,
    [userId]
  );
  return perfil.rows[0] || null;
}

// Cabecera `Authorization: Bearer <token>` -> perfil mayorista, o null si no es válido.
export async function obtenerMayoristaDesdeToken(authorization) {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '').trim();
  const datos = verificarTokenMayorista(token);
  if (!datos) return null;
  return obtenerPerfilMayoristaBD(datos.userId);
}

const errorConCodigo = (statusCode, mensaje) => Object.assign(new Error(mensaje), { statusCode });

// Valida correo y clave contra `users` y devuelve perfil + token.
export async function iniciarSesionMayorista(email, password) {
  const usuario = await buscarMayoristaPorEmailBD(email);
  const credencialesInvalidas = errorConCodigo(401, 'Correo o contraseña incorrectos.');
  if (!usuario || usuario.rol !== 'mayorista' || !usuario.activo || !usuario.password_hash) throw credencialesInvalidas;
  const coincide = await bcrypt.compare(String(password || ''), usuario.password_hash).catch(() => false);
  if (!coincide) throw credencialesInvalidas;
  const perfil = await obtenerPerfilMayoristaBD(usuario.id);
  if (!perfil) throw credencialesInvalidas;
  await registrarLoginMayoristaBD(usuario.id);
  const { token, expira } = crearTokenMayorista({ userId: usuario.id, customerId: perfil.cliente_id });
  return { ...perfil, token, expira };
}
