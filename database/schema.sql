
-- CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150) UNIQUE,
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(80) NOT NULL,
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id),
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente_pago',
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado_pedido
    CHECK (estado IN (
        'pendiente_pago',
        'pagado',
        'cancelado',
        'entregado'
    ))
);

-- DETALLE DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedido_detalles (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL
        REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL
        REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL
        CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12,2) NOT NULL
        CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria
ON productos(categoria);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente
ON pedidos(cliente_id);


INSERT INTO productos
(nombre, descripcion, categoria, precio, stock, imagen_url)
VALUES
('Sofá Cama Moderno', 'Sofá de 3 cuerpos tapizado en tela gris con sistema reclinable', 'Living', 450.00, 15, NULL),
('Mesa de Comedor Minimalista', 'Mesa de madera para 6 personas con patas metálicas', 'Comedor', 320.00, 10, NULL),
('Silla Ergonómica de Oficina', 'Silla giratoria ajustable con soporte lumbar y malla transpirable', 'Oficina', 120.00, 25, NULL),
('Cama King Size', 'Estructura de madera sólida para colchón de 2x2 metros', 'Dormitorio', 580.00, 8, NULL),
('Lámpara de Pie Nórdica', 'Lámpara de pie con pantalla de tela y base de madera natural', 'Iluminación', 45.00, 30, NULL);
