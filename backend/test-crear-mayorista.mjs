import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { pool } from './src/config/database.js';

const API = 'http://localhost:3001/api';
const email = `prueba.mapa.${randomUUID().slice(0, 8)}@example.com`;
const password = `Terra-${randomUUID().slice(0, 12)}-Aa1!`;

try {
  const login = await fetch(`${API}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  }).then((r) => r.json());
  const adminToken = login?.data?.token;
  if (!adminToken) throw new Error('No se obtuvo token admin.');

  const creado = await fetch(`${API}/clientes/mayoristas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      nombre: 'Mayorista Prueba Mapa',
      email,
      password,
      telefono: '70000001',
      nit: '7654321',
    }),
  }).then((r) => r.json());
  const clienteId = creado?.data?.id;
  if (!clienteId) throw new Error(creado?.mensaje || 'No se creó el cliente.');

  const q = await pool.query('SELECT auth_user_id FROM customers WHERE id=$1', [clienteId]);
  const authUserId = q.rows[0]?.auth_user_id;
  if (!authUserId) throw new Error('No se encontró auth_user_id.');

  const archivo = 'C:/Users/valde/AppData/Local/Temp/opencode/terra-test-user.json';
  writeFileSync(archivo, JSON.stringify({ email, password, clienteId, authUserId }, null, 2));
  console.log(JSON.stringify({ email, clienteId, authUserId, archivo }));
} catch (error) {
  console.error('ERROR:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
