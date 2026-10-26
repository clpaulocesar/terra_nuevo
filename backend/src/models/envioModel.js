import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

export const TARIFAS_INICIALES = [
  ['centro-anillos-1-3', 'Centro, 1er, 2do y 3er anillo a la redonda', 60],
  ['anillos-3-5-tiendas', '3er, 4to y 5to anillo cerca a las tiendas', 50],
  ['anillos-4-6', '4to, 5to y 6to anillo a la redonda', 80],
  ['anillos-7-8', '7mo y 8vo anillo a la redonda', 130],
  ['g77-sevilla', 'Av. G77 y condominios Sevilla', 150],
  ['remanso-valle-sanchez', 'Remanso y Valle Sánchez', 170],
  ['guapuru-pocitos', 'Mercado Guapurú 1 y 2, Mercado Los Pocitos', 130],
  ['palmasola-lotes-plan-4000', 'Palmasola, Los Lotes, Plan 4000', 150],
  ['km-9-10', 'Km 9 y Km 10 Norte o doble vía a La Guardia', 140],
  ['urubo', 'Zona Urubó', 160],
  ['urubo-mar-adentro', 'Zona Urubó (Mar Adentro)', 180],
  ['la-guardia', 'La Guardia', 200],
  ['el-torno', 'El Torno', 250],
  ['satelite-norte', 'Satélite Norte', 200],
  ['warnes', 'Warnes', 230],
  ['montero', 'Montero', 350],
  ['cotoca', 'Cotoca', 190],
  ['el-quior', 'El Quior', 150],
  ['bateon-lujan', 'Bateón Luján', 130],
  ['mapaiso-soberania', 'Mapaiso, Soberanía', 130],
  ['final-moscu-tierras-nuevas', 'Final Moscú, Tierras Nuevas', 150],
];

let tablaLista;

export function asegurarTarifasEnvioBD() {
  if (!tablaLista) {
    tablaLista = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS delivery_zones (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          fee_minor INTEGER NOT NULL CHECK (fee_minor >= 0),
          display_order SMALLINT NOT NULL UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      for (const [id, nombre, costo, orden] of TARIFAS_INICIALES.map((fila, indice) => [...fila, indice + 1])) {
        await pool.query(
          `INSERT INTO delivery_zones (id, name, fee_minor, display_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [id, nombre, costo * 100, orden],
        );
      }
    })();
  }
  return tablaLista;
}

export async function listarTarifasEnvioBD() {
  await asegurarTarifasEnvioBD();
  const { rows } = await pool.query(
    `SELECT id, name AS nombre, fee_minor / 100.0 AS costo
     FROM delivery_zones WHERE is_active = TRUE ORDER BY display_order`,
  );
  return rows;
}

export async function listarTodasTarifasEnvioBD() {
  await asegurarTarifasEnvioBD();
  const { rows } = await pool.query(
    `SELECT id, name AS nombre, fee_minor / 100.0 AS costo, is_active AS activo,
            display_order AS orden
     FROM delivery_zones ORDER BY display_order`,
  );
  return rows;
}

export async function crearTarifaEnvioBD({ nombre, costo }) {
  await asegurarTarifasEnvioBD();
  const { rows } = await pool.query(
    `INSERT INTO delivery_zones (id, name, fee_minor, display_order)
     VALUES ($1, $2, $3, COALESCE((SELECT MAX(display_order) + 1 FROM delivery_zones), 1))
     RETURNING id, name AS nombre, fee_minor / 100.0 AS costo, is_active AS activo, display_order AS orden`,
    [randomUUID(), nombre, Math.round(costo * 100)],
  );
  return rows[0];
}

export async function actualizarTarifaEnvioBD(id, { nombre, costo, activo }) {
  await asegurarTarifasEnvioBD();
  const { rows } = await pool.query(
    `UPDATE delivery_zones
     SET name = $2, fee_minor = $3, is_active = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name AS nombre, fee_minor / 100.0 AS costo, is_active AS activo, display_order AS orden`,
    [id, nombre, Math.round(costo * 100), activo],
  );
  return rows[0] || null;
}

export async function eliminarTarifaEnvioBD(id) {
  await asegurarTarifasEnvioBD();
  const { rowCount } = await pool.query('DELETE FROM delivery_zones WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function obtenerTarifaEnvioBD(id, conexion = pool) {
  await asegurarTarifasEnvioBD();
  const { rows } = await conexion.query(
    `SELECT id, name AS nombre, fee_minor
     FROM delivery_zones WHERE id = $1 AND is_active = TRUE`,
    [id],
  );
  return rows[0] || null;
}
