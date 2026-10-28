import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env');
}

// TLS solo con DB_SSL=true explícito; sin la variable se conecta sin TLS, como la base
// actual. Un valor distinto de true/false corta el arranque para que un error de tipeo
// no cambie el modo de conexión sin avisar.
function resolverSsl() {
  const valor = String(process.env.DB_SSL ?? '').trim().toLowerCase();
  if (valor === 'true') return { rejectUnauthorized: false };
  if (valor === '' || valor === 'false') return undefined;
  throw new Error(`DB_SSL debe ser "true" o "false" (valor actual: "${process.env.DB_SSL}").`);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolverSsl(),
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
