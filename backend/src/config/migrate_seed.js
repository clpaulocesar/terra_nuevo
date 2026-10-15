import 'dotenv/config';
import { pool } from './database.js';

export async function migrateAndSeed({ closePool = false } = {}) {
  console.log('Iniciando migración y sincronización con Supabase / PostgreSQL...');

  // 1. Crear tablas necesarias si no existen (cada una individualmente para compatibilidad con PgBouncer/Supabase)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        telefono VARCHAR(30),
        email VARCHAR(150),
        fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(60),
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(80) NOT NULL,
        precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
        precio_original NUMERIC(12,2),
        descuento VARCHAR(30),
        promocion BOOLEAN DEFAULT FALSE,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        showroom INTEGER DEFAULT 0,
        bodega INTEGER DEFAULT 0,
        medida VARCHAR(100),
        firmeza VARCHAR(50),
        detalle VARCHAR(150),
        imagen_url TEXT,
        imagenes TEXT[],
        activo BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id BIGSERIAL PRIMARY KEY,
        codigo VARCHAR(60) NOT NULL UNIQUE,
        cliente_id INTEGER REFERENCES clientes(id),
        total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
        estado VARCHAR(30) NOT NULL DEFAULT 'pendiente_pago',
        fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_estado_pedido
        CHECK (estado IN ('pendiente_pago', 'pagado', 'cancelado', 'entregado'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedido_detalles (
        id BIGSERIAL PRIMARY KEY,
        pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
        subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[];`);
  await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS nit TEXT;`);
  await pool.query(`ALTER TABLE customers ALTER COLUMN nit TYPE TEXT;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);`);

  console.log('Estructura de tablas verificada.');

  // 2. Limpiar e inicializar productos
  await pool.query(`TRUNCATE TABLE pedido_detalles CASCADE;`);
  await pool.query(`TRUNCATE TABLE pedidos CASCADE;`);
  await pool.query(`TRUNCATE TABLE productos RESTART IDENTITY CASCADE;`);

  // 3. Catálogo oficial TERRA Showroom
  const productosOficiales = [
    {
      sku: 'TRR-SOM-B160',
      nombre: 'Sommier Nórdico Bouclé Queen',
      descripcion: 'Confort Suave • Memory Foam. Estructura de madera certificada con tapizado Bouclé de alta resistencia y durabilidad.',
      categoria: 'Sommiers',
      precio: 3950.00,
      precio_original: null,
      descuento: null,
      promocion: false,
      showroom: 3,
      bodega: 14,
      stock: 17,
      medida: 'Queen (160x200)',
      firmeza: 'Suave',
      detalle: 'Queen · 160 × 200 cm',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyRZJ4OejQFLhRxKI2zISkoOdXuUerVE0SIgqtA9DnUPDCw66KWDLT2oqYOrUIdOEGMoua3Bj-KgyODv5S6U89Lj632Te2t1nPU7gWDmnYlU8nWKyHch_HOpfQ-5faM8DlGHEAbmpRq5Lnzibg2-cZ87RQhTTKIofk6oSYmY48qL_fMT1CKNnOyDo6zBKVzJkiPDvHeoc8SFgrJckJcb1_0WedV4nd7I17Z8Y36nN66RQyH9KMxv_x',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDyRZJ4OejQFLhRxKI2zISkoOdXuUerVE0SIgqtA9DnUPDCw66KWDLT2oqYOrUIdOEGMoua3Bj-KgyODv5S6U89Lj632Te2t1nPU7gWDmnYlU8nWKyHch_HOpfQ-5faM8DlGHEAbmpRq5Lnzibg2-cZ87RQhTTKIofk6oSYmY48qL_fMT1CKNnOyDo6zBKVzJkiPDvHeoc8SFgrJckJcb1_0WedV4nd7I17Z8Y36nN66RQyH9KMxv_x',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_'
      ],
      activo: true,
    },
    {
      sku: 'TRR-COL-K200',
      nombre: 'Colchón TERRA Ortopédic Supreme King',
      descripcion: 'Firmeza Media Alta • Resortes Pocket individuales con capa de látex natural transpirable para descanso reparador.',
      categoria: 'Colchones',
      precio: 4890.00,
      precio_original: 5750.00,
      descuento: '15% OFF',
      promocion: true,
      showroom: 4,
      bodega: 28,
      stock: 32,
      medida: 'King (200x200)',
      firmeza: 'Media',
      detalle: 'King · 200 × 200 cm',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCoNTxK5mRu6-SaJMVLBifzSeRTbbS3NA51Yi4yH8vZiDg9-SYLgzVt2J_Sqa2zY9ogMQlFaJrXUbLzABazmnhboXeHoUajfSZvIIfoxQ7WRHxF5oRc0T-yvbzgVgam7S2PUp5-J02rwnIUlhtjHUbcRsnmROpOHvbwETCJS0QxqRKdcgNEFF7cEKrBIbNkLBLpiyCEwzXvfxOClRAOXX_dflpW95tm4IXaLOR36aZR2v6js0r8Cvy_',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDyRZJ4OejQFLhRxKI2zISkoOdXuUerVE0SIgqtA9DnUPDCw66KWDLT2oqYOrUIdOEGMoua3Bj-KgyODv5S6U89Lj632Te2t1nPU7gWDmnYlU8nWKyHch_HOpfQ-5faM8DlGHEAbmpRq5Lnzibg2-cZ87RQhTTKIofk6oSYmY48qL_fMT1CKNnOyDo6zBKVzJkiPDvHeoc8SFgrJckJcb1_0WedV4nd7I17Z8Y36nN66RQyH9KMxv_x'
      ],
      activo: true,
    },
    {
      sku: 'TRR-LIV-M300',
      nombre: 'Juego de Living TERRA Modular Roble & Lino',
      descripcion: 'Madera certificada • Tela repelente. Configuración modular de 3 cuerpos adaptable para living y salas de estar.',
      categoria: 'Muebles',
      precio: 7200.00,
      precio_original: null,
      descuento: null,
      promocion: false,
      showroom: 2,
      bodega: 3,
      stock: 5,
      medida: 'Exhibición en sala',
      firmeza: 'Media',
      detalle: 'Modular 3 Cuerpos · Lino Arena',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIWgZeIyWl1iiSfqgMcewJ1yCXm5B4RdvQRDkrgaAXMO7LYlQoKyxSyq9s3dWaQwLzEcjxDIMF1lLFn8em4oFupQ8kcKO9nFJfmVcf-A7cdKfuDYeKkD2V59VkccSOxKq8b65TtvBMzneqtkOxZ28ILUaMbB8z0FqjsRAc1RVeMSEgYH-t-7jp9eGf4bSbJbwu1lKEb03tet2mN2aTVGGLlotlRat2d0ErZpgDWH_pRPVvEZ5SOa-E',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBIWgZeIyWl1iiSfqgMcewJ1yCXm5B4RdvQRDkrgaAXMO7LYlQoKyxSyq9s3dWaQwLzEcjxDIMF1lLFn8em4oFupQ8kcKO9nFJfmVcf-A7cdKfuDYeKkD2V59VkccSOxKq8b65TtvBMzneqtkOxZ28ILUaMbB8z0FqjsRAc1RVeMSEgYH-t-7jp9eGf4bSbJbwu1lKEb03tet2mN2aTVGGLlotlRat2d0ErZpgDWH_pRPVvEZ5SOa-E'
      ],
      activo: true,
    },
    {
      sku: 'TRR-ALM-G070',
      nombre: 'Almohada Cervical Ergonómica TERRA Gel',
      descripcion: 'Funda Lavable • Antibacterial. Espuma viscoelástica moldeada con inserto de hidrogel refrescante.',
      categoria: 'Almohadas',
      precio: 280.00,
      precio_original: null,
      descuento: null,
      promocion: false,
      showroom: 6,
      bodega: 12,
      stock: 18,
      medida: 'Gel Térmico',
      firmeza: 'Media',
      detalle: 'Estándar · 70 × 40 cm',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRbyj3vDZl8Jfn1VHjv41mPs-75CSzXxDsM8sbcq1Bujy6gquGJ8aoqDC84yP010Jd_Ri6ht9_jH9fbKmerRsG0wC-WhP8RDUXQXW4SKbjtsST50x6hND1jkPU3o6AB1jhmtTCVpnJNLQzRCT-JANI4yFXC6kihnKArBswPWnwMGWgTXy0wtzcECoSpwWAoy8cEU6LLcXCSC_Pr8sfBS-Onfi23NGP5PbZYWCnq9eE3tEnKNW7JeBc',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDRbyj3vDZl8Jfn1VHjv41mPs-75CSzXxDsM8sbcq1Bujy6gquGJ8aoqDC84yP010Jd_Ri6ht9_jH9fbKmerRsG0wC-WhP8RDUXQXW4SKbjtsST50x6hND1jkPU3o6AB1jhmtTCVpnJNLQzRCT-JANI4yFXC6kihnKArBswPWnwMGWgTXy0wtzcECoSpwWAoy8cEU6LLcXCSC_Pr8sfBS-Onfi23NGP5PbZYWCnq9eE3tEnKNW7JeBc'
      ],
      activo: true,
    },
    {
      sku: 'TRR-COL-B140',
      nombre: 'Colchón TERRA BioRest 2 Plazas',
      descripcion: 'Media Ortopédica • Hipoalergénico. Fibras naturales de bambú y núcleo de espuma resiliente para postura lumbar.',
      categoria: 'Colchones',
      precio: 2450.00,
      precio_original: null,
      descuento: null,
      promocion: false,
      showroom: 9,
      bodega: 22,
      stock: 31,
      medida: '2 Plazas (140x190)',
      firmeza: 'Firme Ortopédica',
      detalle: '2 Plazas · 140 × 190 cm',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA5rj2Ps0QijJsV3RmcBdEsz5td4d3QkcOvpDQLDsjyMmahvd61qSfR58oeyLER6LGD8M5QQOF9K2DMZj4dQEdzi0avUBsjWbOLot8w3w-JcyCXpztBL4MRJDWVwJH1s5z9Pr7bcKiqxs0YYhXgOJUKGjaluD9u5gsKUsbBi-oVTjwxXsht-FwplzS3EzsvUmJBtYgcBKu6tG2pYDmZze5-kP_lPhl1TiEb07pdsJyFAkOnRtWWb4U',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAA5rj2Ps0QijJsV3RmcBdEsz5td4d3QkcOvpDQLDsjyMmahvd61qSfR58oeyLER6LGD8M5QQOF9K2DMZj4dQEdzi0avUBsjWbOLot8w3w-JcyCXpztBL4MRJDWVwJH1s5z9Pr7bcKiqxs0YYhXgOJUKGjaluD9u5gsKUsbBi-oVTjwxXsht-FwplzS3EzsvUmJBtYgcBKu6tG2pYDmZze5-kP_lPhl1TiEb07pdsJyFAkOnRtWWb4U'
      ],
      activo: true,
    },
    {
      sku: 'TRR-ROP-S400',
      nombre: 'Set Ropa de Cama Algodón Egipcio King',
      descripcion: 'Sábanas + Funda Nórdica King. Confeccionado en 400 hilos de satén blanco nieve, sedoso al tacto.',
      categoria: 'Ropa de cama',
      precio: 680.00,
      precio_original: null,
      descuento: null,
      promocion: false,
      showroom: 2,
      bodega: 30,
      stock: 32,
      medida: 'King (200x200)',
      firmeza: 'Suave',
      detalle: 'King · 400 Hilos Satén Blanco',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzT-XQKQxqXQGRV4cM4MTI9dNop0n4-te7LnsgHOXtF82W0q9rbF4RfRjSnDihWPDvidwAakZgic4juIM8sAB1M3rNflotOf5eaIyeu5seJDPyrDjtM6irgdoUJteV4DccyUdzZACPtd1l4S3m6hWV6EFTjdfuuDOgIUGTMmL0NS75QKU2zJTSivsMN3QS4kEbXwSCsCxg5wadzhRZCIiobuQ2XfLSo0kRieTMBQnbqToD_Ry3ypm',
      imagenes: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzT-XQKQxqXQGRV4cM4MTI9dNop0n4-te7LnsgHOXtF82W0q9rbF4RfRjSnDihWPDvidwAakZgic4juIM8sAB1M3rNflotOf5eaIyeu5seJDPyrDjtM6irgdoUJteV4DccyUdzZACPtd1l4S3m6hWV6EFTjdfuuDOgIUGTMmL0NS75QKU2zJTSivsMN3QS4kEbXwSCsCxg5wadzhRZCIiobuQ2XfLSo0kRieTMBQnbqToD_Ry3ypm'
      ],
      activo: true,
    },
  ];

  for (const prod of productosOficiales) {
    await pool.query(
      `INSERT INTO productos 
        (sku, nombre, descripcion, categoria, precio, precio_original, descuento, promocion, 
         showroom, bodega, stock, medida, firmeza, detalle, imagen_url, imagenes, activo)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        prod.sku,
        prod.nombre,
        prod.descripcion,
        prod.categoria,
        prod.precio,
        prod.precio_original,
        prod.descuento,
        prod.promocion,
        prod.showroom,
        prod.bodega,
        prod.stock,
        prod.medida,
        prod.firmeza,
        prod.detalle,
        prod.imagen_url,
        prod.imagenes,
        prod.activo,
      ]
    );
  }

  // 4. Si la tabla products (catálogo importado Supabase) existe, sincronizarla también
  try {
    const productsRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
      );
    `);

    if (productsRes.rows[0].exists) {
      const { rows: supProds } = await pool.query(`
        SELECT 
          p.id,
          COALESCE(p.codigo_terra, p.internal_code, 'TRR-' || SUBSTRING(p.id::text, 1, 6)) AS sku,
          p.name AS nombre,
          COALESCE(p.description, p.name || ' - ' || COALESCE(p.marca, 'TERRA')) AS descripcion,
          COALESCE(c.name, p.product_group, 'Colchones') AS categoria,
          COALESCE(p.public_price, 0) AS precio,
          COALESCE(p.stock_quantity::integer, 10) AS stock,
          p.size AS medida,
          COALESCE(p.color, '') AS detalle,
          p.imagen_url,
          COALESCE(p.activo, p.is_active, true) AS activo
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.codigo_terra NOT IN ('DEMO-MAT-01', 'DEMO-CAM-02');
      `);

      function normalizarCategoria(cat) {
        const c = (cat || '').trim().toUpperCase();
        if (c === 'COLCHON' || c === 'COLCHONES') return 'Colchones';
        if (c === 'SOMIER' || c === 'SOMMIERS') return 'Sommiers';
        if (c === 'ESPALDAR' || c === 'ESPALDARES' || c === 'RESPALDO' || c === 'RESPALDOS') return 'Espaldares';
        if (c === 'SET CAMA' || c === 'CAMA' || c === 'CAMAS') return 'Camas';
        if (c === 'RECAMIER' || c === 'RECAMIERS') return 'Recamier';
        if (c === 'LIVING') return 'Muebles';
        if (c === 'ALMOHADAS' || c === 'ALMOHADA') return 'Almohadas';
        if (c === 'ROPA DE CAMA') return 'Ropa de cama';
        if (c === 'MUEBLES' || c === 'MUEBLE') return 'Muebles';
        return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Varios';
      }

      for (const sp of supProds) {
        await pool.query(
          `INSERT INTO productos 
            (sku, nombre, descripcion, categoria, precio, showroom, bodega, stock, medida, detalle, imagen_url, imagenes, activo)
           VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            sp.sku,
            sp.nombre,
            sp.descripcion,
            normalizarCategoria(sp.categoria),
            Number(sp.precio) || 1000,
            Math.floor((Number(sp.stock) || 10) / 2),
            Math.ceil((Number(sp.stock) || 10) / 2),
            Number(sp.stock) || 10,
            sp.medida,
            sp.detalle,
            sp.imagen_url || null,
            sp.imagen_url ? [sp.imagen_url] : [],
            sp.activo,
          ]
        );
      }
      console.log(`Se sincronizaron ${supProds.length} productos adicionales desde tabla products.`);
    }
  } catch (err) {
    console.warn('Nota: sincronización adicional de products omitida:', err.message);
  }

  const { rows } = await pool.query('SELECT COUNT(*) AS total FROM productos');
  console.log(`¡Éxito! Total de productos en tabla productos: ${rows[0].total}`);

  if (closePool) {
    await pool.end();
  }

  return { total: Number(rows[0].total) };
}

// Si se ejecuta directamente desde node
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('migrate_seed.js')) {
  migrateAndSeed({ closePool: true }).catch((err) => {
    console.error('Error durante migración y seed:', err);
    process.exit(1);
  });
}
