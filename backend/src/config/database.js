import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env');
}

// DB_SSL=true|false fuerza el uso de TLS. Si no se define, se deduce del host:
// Supabase y sus poolers exigen SSL; el resto de servidores, por defecto, no.
function resolverSsl(url) {
  const valor = String(process.env.DB_SSL ?? process.env.DATABASE_SSL ?? '').trim().toLowerCase();
  if (valor === 'true') return { rejectUnauthorized: false };
  if (valor === 'false') return undefined;
  return /supabase|pooler/.test(url) ? { rejectUnauthorized: false } : undefined;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolverSsl(process.env.DATABASE_URL),
  // En servidores con alta concurrencia se recomienda 20 a 50 conexiones.
  // Puede configurarse con DATABASE_POOL_MAX en .env.
  max: Number(process.env.DATABASE_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  console.error('Error de conexión PostgreSQL:', error.message);
});

export async function verificarConexion() {
  const resultado = await pool.query('SELECT NOW() AS fecha, current_database() as db');
  return resultado.rows[0];
}
