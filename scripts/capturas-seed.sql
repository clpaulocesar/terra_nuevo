-- Datos FICTICIOS para las capturas de la guía (base local terra_capturas).
-- Personas, teléfonos, NIT y direcciones son inventados.
BEGIN;

-- Columnas que el backend agrega en caliente (por si aún no corrió).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Personal -------------------------------------------------------------
INSERT INTO staff_accounts (id, auth_user_id, name, email, role, is_active, vehicle, plate, created_at) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', gen_random_uuid(), 'Lucía Fernández', 'vendedor.demo@terra.bo', 'vendedor', TRUE, NULL, NULL, NOW() - INTERVAL '40 days'),
  ('aaaaaaaa-0000-4000-8000-000000000002', gen_random_uuid(), 'Marcos Quispe',   'despacho.demo@terra.bo', 'despacho', TRUE, 'Moto',      'SCZ-4521', NOW() - INTERVAL '35 days'),
  ('aaaaaaaa-0000-4000-8000-000000000003', gen_random_uuid(), 'Daniela Rojas',   'reparto2.demo@terra.bo', 'despacho', TRUE, 'Furgoneta', 'XYZ-8830', NOW() - INTERVAL '20 days');

-- Clientes -------------------------------------------------------------
INSERT INTO users (id, auth_user_id, name, email, role, is_active, created_at) VALUES
  ('bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'Mueblería Los Pinos SRL', 'compras@lospinos.example', 'mayorista', TRUE, NOW() - INTERVAL '90 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', 'Hotel Jardín del Sur',    'admin@jardindelsur.example', 'mayorista', TRUE, NOW() - INTERVAL '60 days');

INSERT INTO customers (id, auth_user_id, name, email, phone, nit, contact_name, delivery_address, delivery_reference, delivery_lat, delivery_lng, created_at) VALUES
  ('dddddddd-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'Mueblería Los Pinos SRL', 'compras@lospinos.example', '70011223', '1023456017', 'Andrea Vaca', 'Av. Banzer, 3er anillo, Santa Cruz', 'Portón verde, frente a la plaza', -17.7563, -63.1850, NOW() - INTERVAL '90 days'),
  ('dddddddd-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', 'Hotel Jardín del Sur',    'admin@jardindelsur.example', '77654321', '3045678014', 'Rodrigo Paz', 'Av. Roca y Coronado 2200, Santa Cruz', 'Recepción del hotel', -17.8012, -63.1934, NOW() - INTERVAL '60 days'),
  ('dddddddd-0000-4000-8000-000000000003', NULL, 'Carlos Mendoza',        NULL, '77012345', '5123456', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '12 days'),
  ('dddddddd-0000-4000-8000-000000000004', NULL, 'María Luisa Terceros',  NULL, '76543210', NULL,      NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
  ('dddddddd-0000-4000-8000-000000000005', NULL, 'Jorge Saucedo',         NULL, NULL,       NULL,      NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  ('dddddddd-0000-4000-8000-000000000006', NULL, 'Valeria Añez',          NULL, '69001122', '7788990', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '8 days');

-- Pedidos --------------------------------------------------------------
-- Hoy en hora de Bolivia (UTC-4). "hoy" = fecha local actual.
CREATE TEMP TABLE hoy AS SELECT (date_trunc('day', NOW() AT TIME ZONE 'America/La_Paz')) AT TIME ZONE 'America/La_Paz' AS t;

INSERT INTO orders (id, customer_id, status, fulfillment_type, delivery_address, delivery_reference, delivery_lat, delivery_lng, subtotal_minor, discount_minor, delivery_fee_minor, total_minor, currency, ticket_number, payment_method, delivery_driver_id, delivery_assigned_at, delivery_started_at, delivery_status, delivered_at, created_at, updated_at)
SELECT * FROM (VALUES
  -- hoy, pendientes de pago (para la campana y el modal de cobro)
  ('eeeeeeee-0000-4000-8000-000000000001'::uuid, 'dddddddd-0000-4000-8000-000000000003'::uuid, 'pending',   'store_pickup',  NULL, NULL, NULL::float8, NULL::float8, 214000::bigint, 0::bigint, 0::bigint, 214000::bigint, 'BOB', 'TER-A1F3C7D2', NULL, NULL::uuid, NULL::timestamptz, NULL::timestamptz, NULL, NULL::timestamptz, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000002'::uuid, 'dddddddd-0000-4000-8000-000000000004'::uuid, 'pending',   'store_pickup',  NULL, NULL, NULL, NULL, 220000, 0, 0, 220000, 'BOB', 'TER-B8E24C19', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
  -- hoy, cobrados
  ('eeeeeeee-0000-4000-8000-000000000003'::uuid, 'dddddddd-0000-4000-8000-000000000005'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 276000, 0, 0, 276000, 'BOB', 'TER-C3D9A5E0', 'efectivo', NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) + INTERVAL '9 hours 15 minutes', (SELECT t FROM hoy) + INTERVAL '9 hours 20 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000004'::uuid, 'dddddddd-0000-4000-8000-000000000006'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL,  12000, 0, 0,  12000, 'BOB', 'TER-D7B1F6A4', 'qr',       NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) + INTERVAL '9 hours 40 minutes', (SELECT t FROM hoy) + INTERVAL '9 hours 45 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000005'::uuid, NULL,                                          'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 160000, 0, 0, 160000, 'BOB', 'TER-E2C8B3F7', 'tarjeta',  NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) + INTERVAL '10 hours 5 minutes', (SELECT t FROM hoy) + INTERVAL '10 hours 8 minutes'),
  -- hoy, anulado
  ('eeeeeeee-0000-4000-8000-000000000006'::uuid, 'dddddddd-0000-4000-8000-000000000003'::uuid, 'cancelled', 'store_pickup',  NULL, NULL, NULL, NULL,   4000, 0, 0,   4000, 'BOB', 'TER-F4A6D1C8', NULL, NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) + INTERVAL '8 hours 50 minutes', (SELECT t FROM hoy) + INTERVAL '9 hours'),
  -- hoy, envío a domicilio en camino (Marcos)
  ('eeeeeeee-0000-4000-8000-000000000007'::uuid, 'dddddddd-0000-4000-8000-000000000001'::uuid, 'completed', 'home_delivery', 'Av. Banzer, 3er anillo, Santa Cruz', 'Portón verde, frente a la plaza', -17.7563, -63.1850, 1068000, 0, 0, 1068000, 'BOB', 'TER-0A5E7B2D', 'qr', 'aaaaaaaa-0000-4000-8000-000000000002', (SELECT t FROM hoy) + INTERVAL '9 hours 30 minutes', (SELECT t FROM hoy) + INTERVAL '9 hours 50 minutes', 'en_camino', NULL, (SELECT t FROM hoy) + INTERVAL '8 hours 20 minutes', (SELECT t FROM hoy) + INTERVAL '9 hours 50 minutes'),
  -- hoy, envío a domicilio sin repartidor
  ('eeeeeeee-0000-4000-8000-000000000008'::uuid, 'dddddddd-0000-4000-8000-000000000002'::uuid, 'completed', 'home_delivery', 'Av. Roca y Coronado 2200, Santa Cruz', 'Recepción del hotel', -17.8012, -63.1934, 800000, 0, 0, 800000, 'BOB', 'TER-1B6F8C3E', 'efectivo', NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) + INTERVAL '10 hours 20 minutes', (SELECT t FROM hoy) + INTERVAL '10 hours 25 minutes'),
  -- antes de hoy
  ('eeeeeeee-0000-4000-8000-000000000009'::uuid, 'dddddddd-0000-4000-8000-000000000001'::uuid, 'completed', 'home_delivery', 'Av. Banzer, 3er anillo, Santa Cruz', 'Portón verde, frente a la plaza', -17.7563, -63.1850, 600000, 0, 0, 600000, 'BOB', 'TER-2C7A9D4F', 'qr', 'aaaaaaaa-0000-4000-8000-000000000002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 6 hours', 'entregado', NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '2 days 3 hours', NOW() - INTERVAL '1 day 4 hours'),
  ('eeeeeeee-0000-4000-8000-000000000010'::uuid, 'dddddddd-0000-4000-8000-000000000003'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 190000, 0, 0, 190000, 'BOB', 'TER-3D8B0E5A', 'efectivo', NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '11 hours', (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '11 hours 10 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000011'::uuid, 'dddddddd-0000-4000-8000-000000000006'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 320000, 0, 0, 320000, 'BOB', 'TER-4E9C1F6B', 'tarjeta',  NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '16 hours', (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '16 hours 5 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000012'::uuid, NULL,                                          'completed', 'store_pickup',  NULL, NULL, NULL, NULL,  10000, 0, 0,  10000, 'BOB', 'TER-5F0D2A7C', 'qr',       NULL, NULL, NULL, NULL, NULL, (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '18 hours', (SELECT t FROM hoy) - INTERVAL '1 day' + INTERVAL '18 hours 3 minutes'),
  ('eeeeeeee-0000-4000-8000-000000000013'::uuid, 'dddddddd-0000-4000-8000-000000000004'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 270000, 0, 0, 270000, 'BOB', 'TER-6A1E3B8D', 'qr',       NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('eeeeeeee-0000-4000-8000-000000000014'::uuid, 'dddddddd-0000-4000-8000-000000000002'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 1200000, 0, 0, 1200000, 'BOB', 'TER-7B2F4C9E', 'tarjeta', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('eeeeeeee-0000-4000-8000-000000000015'::uuid, 'dddddddd-0000-4000-8000-000000000001'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 2100000, 0, 0, 2100000, 'BOB', 'TER-8C3A5D0F', 'qr',       NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('eeeeeeee-0000-4000-8000-000000000016'::uuid, 'dddddddd-0000-4000-8000-000000000006'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 160000, 0, 0, 160000, 'BOB', 'TER-9D4B6E1A', 'efectivo', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
  ('eeeeeeee-0000-4000-8000-000000000017'::uuid, 'dddddddd-0000-4000-8000-000000000001'::uuid, 'completed', 'home_delivery', 'Av. Banzer, 3er anillo, Santa Cruz', 'Portón verde, frente a la plaza', -17.7563, -63.1850, 1750000, 0, 0, 1750000, 'BOB', 'TER-AE5C7F2B', 'qr', 'aaaaaaaa-0000-4000-8000-000000000003', NOW() - INTERVAL '33 days', NOW() - INTERVAL '32 days', 'entregado', NOW() - INTERVAL '32 days', NOW() - INTERVAL '34 days', NOW() - INTERVAL '32 days'),
  ('eeeeeeee-0000-4000-8000-000000000018'::uuid, 'dddddddd-0000-4000-8000-000000000003'::uuid, 'completed', 'store_pickup',  NULL, NULL, NULL, NULL, 280000, 0, 0, 280000, 'BOB', 'TER-BF6D8A3C', 'tarjeta',  NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '41 days', NOW() - INTERVAL '41 days')
) AS v;

INSERT INTO order_items (order_id, product_variant_id, product_name, sku, quantity, unit_price_minor, discount_minor, total_minor, currency) VALUES
  ('eeeeeeee-0000-4000-8000-000000000001', NULL, 'ALPINO 2.5 PLZ', 'COLN00541', 1, 210000, 0, 210000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000001', NULL, 'CONFORT LYA', 'ALMO00094', 2, 2000, 0, 4000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000002', NULL, 'BRISA 2.5 PLAZAS', 'COLN00591', 1, 220000, 0, 220000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000003', NULL, 'ALPINO 3 PLZ', 'COLN00544', 1, 270000, 0, 270000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000003', NULL, 'TERRA TERAPEUTICA', 'ALMO00166', 1, 6000, 0, 6000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000004', NULL, 'CUCA FRESCA + TEKA', 'ALMO00167', 2, 5000, 0, 10000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000004', NULL, 'COJIN PESEIRA', 'ALMO00151', 1, 2000, 0, 2000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000005', NULL, 'BRISA 1.5 PLAZAS', 'COLN00590', 1, 160000, 0, 160000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000006', NULL, 'PARE FIBRA COLOR', 'ALMO00089', 1, 4000, 0, 4000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000007', NULL, 'ALPINO 2 PLZ', 'COLN00543', 6, 175000, 0, 1050000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000007', NULL, 'CONFORT LYA', 'ALMO00094', 10, 1800, 0, 18000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000008', NULL, 'BRISA 2.5 PLAZAS', 'COLN00591', 4, 200000, 0, 800000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000009', NULL, 'ALPINO 3.5 PLZ', 'COLN00545', 2, 300000, 0, 600000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000010', NULL, 'ALPINO 2 PLZ', 'COLN00543', 1, 190000, 0, 190000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000011', NULL, 'ALPINO 3.5 PLZ', 'COLN00545', 1, 320000, 0, 320000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000012', NULL, 'CUCA FRESCA + TEKA', 'ALMO00167', 2, 5000, 0, 10000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000013', NULL, 'ALPINO 3 PLZ', 'COLN00544', 1, 270000, 0, 270000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000014', NULL, 'ALPINO 2.5 PLZ', 'COLN00541', 6, 200000, 0, 1200000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000015', NULL, 'ALPINO 3 PLZ', 'COLN00544', 8, 262500, 0, 2100000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000016', NULL, 'BRISA 1.5 PLAZAS', 'COLN00590', 1, 160000, 0, 160000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000017', NULL, 'ALPINO 2 PLZ', 'COLN00543', 10, 175000, 0, 1750000, 'BOB'),
  ('eeeeeeee-0000-4000-8000-000000000018', NULL, 'BRISA 3 PLAZAS', 'COLN00592', 1, 280000, 0, 280000, 'BOB');

-- Tramos mayoristas de ejemplo para que el catálogo B2B muestre precio por cantidad.
INSERT INTO wholesale_price_tiers (product_id, minimum_quantity, unit_price) VALUES
  ('cbd95b80-a217-4b2b-80fb-bae6f84605de', 2, 1990.00),
  ('cbd95b80-a217-4b2b-80fb-bae6f84605de', 6, 1890.00),
  ('f8a5ea7e-9619-410d-96e7-0162a35f8dc1', 2, 1790.00),
  ('f8a5ea7e-9619-410d-96e7-0162a35f8dc1', 6, 1690.00),
  ('04be0c3c-27b3-4158-b3d8-f758bc357429', 10, 18.00);

COMMIT;
