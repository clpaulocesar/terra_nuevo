import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

// Secretos que firman los tokens de sesión. Son obligatorios y no tienen valor por
// defecto: con un secreto conocido cualquiera podría forjar una sesión, así que el
// servidor no arranca si faltan.
function exigirSecreto(nombre) {
  const valor = String(process.env[nombre] || '').trim();
  if (valor.length < 32) {
    throw new Error(`Falta ${nombre} en backend/.env (mínimo 32 caracteres aleatorios).`);
  }
  return valor;
}

export const ADMIN_TOKEN_SECRET = exigirSecreto('ADMIN_TOKEN_SECRET');
export const CLIENTE_TOKEN_SECRET = exigirSecreto('CLIENTE_TOKEN_SECRET');
