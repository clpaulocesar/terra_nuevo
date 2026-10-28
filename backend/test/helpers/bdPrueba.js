// Esquema mínimo (con las columnas que tiene producción) para las pruebas contra un
// Postgres LOCAL desechable. Las columnas que el backend agrega en tiempo de ejecución
// (ALTER TABLE ... IF NOT EXISTS) y las tablas del ERP las crea el propio código.
export const TEST_DB = process.env.TEST_DATABASE_URL;
// Las pruebas borran y recrean tablas: solo se aceptan bases en esta misma máquina.
if (TEST_DB) {
  const host = new URL(TEST_DB).hostname.replace(/^\[|\]$/g, '');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`TEST_DATABASE_URL debe apuntar a un Postgres local (host recibido: ${host}).`);
  }
}

export const SALTAR_SIN_BD = TEST_DB ? false : 'Definí TEST_DATABASE_URL (Postgres local vacío) para correr estas pruebas.';

const TABLAS = ['payments', 'product_images', 'order_items', 'orders', 'products', 'customers', 'users', 'categories', 'wholesale_price_tiers', 'product_instructions',
  'producto_sucursales', 'sucursales', 'promotion_products', 'promotions',
  'erp_quotations', 'erp_product_sync_state', 'erp_warehouse_stocks', 'erp_sync_runs', 'delivery_zones', 'staff_accounts'];

const DDL = `
  CREATE TABLE IF NOT EXISTS categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT, is_active BOOLEAN DEFAULT TRUE);
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT, description TEXT, codigo_terra TEXT, internal_code TEXT,
    product_group TEXT, public_price NUMERIC(12,2) DEFAULT 0, precio_mayorista TEXT, stock_quantity NUMERIC DEFAULT 0, size TEXT, color TEXT,
    colors TEXT[], imagen_url TEXT, image_urls TEXT[], video_url TEXT, marca TEXT, activo BOOLEAN DEFAULT TRUE, is_active BOOLEAN DEFAULT TRUE,
    category_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), auth_user_id UUID, name TEXT, email TEXT, phone TEXT, nit TEXT, contact_name TEXT,
    delivery_address TEXT, delivery_reference TEXT, delivery_lat DOUBLE PRECISION, delivery_lng DOUBLE PRECISION, created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), auth_user_id UUID NOT NULL, name TEXT NOT NULL, email TEXT, role TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_type TEXT, subtotal_minor BIGINT DEFAULT 0, discount_minor BIGINT DEFAULT 0, delivery_fee_minor BIGINT DEFAULT 0, total_minor BIGINT DEFAULT 0,
    currency TEXT DEFAULT 'BOB', ticket_number TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID REFERENCES orders(id) ON DELETE CASCADE, product_variant_id UUID, product_name TEXT, sku TEXT,
    quantity INTEGER NOT NULL, unit_price_minor BIGINT NOT NULL, discount_minor BIGINT DEFAULT 0, total_minor BIGINT NOT NULL, currency TEXT DEFAULT 'BOB',
    created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS product_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    detalle_completo TEXT, intrucciones TEXT, colores TEXT, videos_url TEXT, imagenes_url TEXT);
  CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, image_url TEXT NOT NULL,
    alt_text TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_primary BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS sucursales (id_sucursal BIGSERIAL PRIMARY KEY, nombre VARCHAR(120) NOT NULL, direccion VARCHAR(200), activo BOOLEAN DEFAULT TRUE);
  CREATE TABLE IF NOT EXISTS producto_sucursales (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, sucursal_id BIGINT NOT NULL REFERENCES sucursales(id_sucursal),
    stock_disponible NUMERIC NOT NULL DEFAULT 0, activo BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, sucursal_id));
  CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ);
  CREATE TABLE IF NOT EXISTS promotion_products (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, product_id));
  CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT, provider TEXT, provider_transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0), currency VARCHAR(3) NOT NULL DEFAULT 'BOB' CHECK (currency = 'BOB'),
    paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
`;

// Recrea el esquema desde cero (base desechable) y devuelve el pool del proyecto.
export async function prepararBaseDePrueba() {
  process.env.DATABASE_URL = TEST_DB;
  process.env.DB_SSL = process.env.DB_SSL || 'false';
  const { pool } = await import('../../src/config/database.js');
  await pool.query(`DROP TABLE IF EXISTS ${TABLAS.join(', ')} CASCADE`);
  await pool.query(DDL);
  return pool;
}

export async function vaciarTablas(pool) {
  await pool.query('TRUNCATE payments, order_items, orders, products, customers, users RESTART IDENTITY CASCADE');
  await pool.query("DO $$ BEGIN IF to_regclass('public.erp_quotations') IS NOT NULL THEN TRUNCATE erp_quotations, erp_product_sync_state, erp_warehouse_stocks; END IF; END $$");
  await pool.query("DO $$ BEGIN IF to_regclass('public.staff_accounts') IS NOT NULL THEN TRUNCATE staff_accounts CASCADE; END IF; END $$");
}

// Cuenta de personal con clave en bcrypt (el login ya no acepta credenciales del .env).
export async function crearStaff(pool, { email, password, rol = 'admin', nombre = 'Personal de prueba', activo = true }) {
  const { asegurarTablaPersonal } = await import('../../src/models/personalModel.js');
  const { default: bcrypt } = await import('bcryptjs');
  await asegurarTablaPersonal();
  const { rows } = await pool.query(
    `INSERT INTO staff_accounts (auth_user_id, name, email, password_hash, role, is_active)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id, email, role`,
    [nombre, email, await bcrypt.hash(password, 4), rol, activo]
  );
  return rows[0];
}
