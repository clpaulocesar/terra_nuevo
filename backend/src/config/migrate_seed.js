import 'dotenv/config';
import { pool } from './database.js';

async function migrateAndSeed() {
  console.log('Iniciando migración y sincronización de datos reales...');

  // 1. Alterar tabla productos si faltan columnas
  await pool.query(`
    ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS sku VARCHAR(60),
      ADD COLUMN IF NOT EXISTS medida VARCHAR(100),
      ADD COLUMN IF NOT EXISTS firmeza VARCHAR(50),
      ADD COLUMN IF NOT EXISTS showroom INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bodega INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS imagenes TEXT[],
      ADD COLUMN IF NOT EXISTS promocion BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS descuento VARCHAR(30),
      ADD COLUMN IF NOT EXISTS precio_original NUMERIC(12,2),
      ADD COLUMN IF NOT EXISTS detalle VARCHAR(150);
  `);

  console.log('Columnas de base de datos actualizadas con éxito.');

  // 2. Limpiar productos demo antiguos (id 1 a 5 si eran los del schema.sql)
  // o reemplazar con catálogo oficial TERRA
  await pool.query(`TRUNCATE TABLE pedido_detalles CASCADE;`);
  await pool.query(`TRUNCATE TABLE pedidos CASCADE;`);
  await pool.query(`TRUNCATE TABLE productos RESTART IDENTITY CASCADE;`);

  // 3. Insertar productos reales TERRA
  const productosReales = [
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

  for (const prod of productosReales) {
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

  const { rows } = await pool.query('SELECT id, sku, nombre, precio, stock FROM productos');
  console.log(`¡Éxito! Se sincronizaron ${rows.length} productos reales en PostgreSQL:`);
  console.table(rows);
  await pool.end();
}

migrateAndSeed().catch((err) => {
  console.error('Error durante migración y seed:', err);
  process.exit(1);
});
