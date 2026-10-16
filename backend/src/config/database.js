import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env');
}

const requiresSsl =
  process.env.DATABASE_URL.includes('supabase') ||
  process.env.DATABASE_URL.includes('pooler') ||
  process.env.DATABASE_SSL === 'true';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  // En Vercel cada instancia puede abrir su propio pool; mantenerlo pequeño.
  // Subido a 5 porque con 1 las peticiones paralelas admin+kiosco daban timeout 500.
  max: Number(process.env.DATABASE_POOL_MAX) || 5,
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
