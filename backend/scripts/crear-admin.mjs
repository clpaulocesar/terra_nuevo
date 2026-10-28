// Crea (o reactiva) una cuenta de administrador en `staff_accounts` sin depender del .env.
//
// Uso (desde la carpeta backend/):
//   node scripts/crear-admin.mjs
//
// Pide email, nombre y contraseña por consola. La contraseña se escribe oculta y
// nunca se acepta por argumento, para que no quede en el historial de la terminal.
import dotenv from 'dotenv';
import path from 'node:path';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env'), quiet: true });

if (process.argv.length > 2) {
  console.error('Este script no acepta argumentos: los datos se piden por consola.');
  process.exit(1);
}

const { pool } = await import('../src/config/database.js');
const { asegurarTablaPersonal } = await import('../src/models/personalModel.js');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_CLAVE = 12;

function preguntar(texto, { oculto = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      // Con la salida silenciada solo se muestra la pregunta; lo tecleado no se ve.
      const escribir = rl._writeToOutput.bind(rl);
      rl._writeToOutput = (cadena) => { if (cadena.startsWith(texto)) escribir(texto); };
    }
    rl.question(texto, (respuesta) => {
      rl.close();
      if (oculto) process.stdout.write('\n');
      resolve(respuesta);
    });
  });
}

try {
  const email = (await preguntar('Correo del administrador: ')).trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 150) throw new Error('Correo electrónico inválido.');
  const nombre = (await preguntar('Nombre: ')).trim();
  if (nombre.length < 2 || nombre.length > 120) throw new Error('El nombre debe tener entre 2 y 120 caracteres.');
  const clave = await preguntar(`Contraseña (mínimo ${MIN_CLAVE} caracteres, no se muestra): `, { oculto: true });
  if (clave.length < MIN_CLAVE || clave.length > 128) throw new Error(`La contraseña debe tener entre ${MIN_CLAVE} y 128 caracteres.`);
  const confirmacion = await preguntar('Repetí la contraseña: ', { oculto: true });
  if (confirmacion !== clave) throw new Error('Las contraseñas no coinciden.');

  await asegurarTablaPersonal();
  const passwordHash = await bcrypt.hash(clave, 12);
  const { rows } = await pool.query(
    `INSERT INTO staff_accounts (auth_user_id, name, email, password_hash, role, is_active)
     VALUES (gen_random_uuid(), $1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'admin', is_active = TRUE
     RETURNING id, email, (xmax = 0) AS creada`,
    [nombre, email, passwordHash]
  );
  const cuenta = rows[0];
  console.log(`${cuenta.creada ? 'Cuenta creada' : 'Cuenta actualizada y reactivada'}: ${cuenta.email} (id ${cuenta.id}).`);
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
