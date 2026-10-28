import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = typeof import.meta.dirname === 'string' ? import.meta.dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';

import productoRoutes from './routes/productoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import asistenteRoutes from './routes/asistenteRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import geocodificacionRoutes from './routes/geocodificacionRoutes.js';
import envioRoutes from './routes/envioRoutes.js';
import sucursalRoutes from './routes/sucursalRoutes.js';
import archivoRoutes from './routes/archivoRoutes.js';

import { verificarConexion } from './config/database.js';

import {
  rutaNoEncontrada,
  errorHandler,
} from './middlewares/errorHandler.js';

const app = express();

// Permitir conexiones cross-origin (incluyendo frontend en Vercel y local)
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Api-Version',
      'X-CSRF-Token',
    ],
  })
);
// CORS se aplica globalmente con app.use(cors()) arriba.

// Las imágenes viajan por multipart a /api/archivos, así que el JSON puede ser chico.
app.use(express.json({ limit: '1mb' }));

// Ruta principal requerida por la especificación
app.get('/', (req, res) => {
  res.json({
    service: 'TERRA Centralized Products API',
    status: 'online',
    endpoints: {
      productos: '/api/productos',
      seed: '/api/productos/seed',
      docs: '/docs',
      openapi: '/openapi',
    },
  });
});

// Especificación OpenAPI 3.0
app.get('/openapi', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'TERRA Centralized Products API',
      version: '1.0.0',
      description: 'API centralizada de productos y autoservicio TERRA conectada a PostgreSQL.',
    },
    paths: {
      '/': {
        get: {
          summary: 'Estado y endpoints del servicio',
          responses: { 200: { description: 'Información del servicio' } },
        },
      },
      '/api/productos': {
        get: {
          summary: 'Listar productos',
          parameters: [
            { name: 'buscar', in: 'query', schema: { type: 'string' } },
            { name: 'categoria', in: 'query', schema: { type: 'string' } },
            { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limite', in: 'query', schema: { type: 'integer', default: 100, maximum: 200 } },
            { name: 'orden', in: 'query', schema: { type: 'string', enum: ['recomendados', 'precio-asc', 'precio-desc', 'nombre'], default: 'recomendados' } },
            { name: 'todos', in: 'query', schema: { type: 'boolean', default: false } },
          ],
          responses: { 200: { description: 'Lista de productos paginada. Incluye `paginacion` con pagina, limite, total, totalPaginas, tieneAnterior y tieneSiguiente.' } },
        },
        post: {
          summary: 'Crear nuevo producto',
          responses: { 201: { description: 'Producto creado' } },
        },
      },
      '/api/productos/seed': {
        get: {
          summary: 'Sincronizar y sembrar catálogo TERRA en la base de datos',
          responses: { 200: { description: 'Catálogo sincronizado' } },
        },
        post: {
          summary: 'Sincronizar y sembrar catálogo TERRA en la base de datos',
          responses: { 200: { description: 'Catálogo sincronizado' } },
        },
      },
      '/api/productos/{id}': {
        get: { summary: 'Obtener detalle de un producto por ID' },
        put: { summary: 'Actualizar producto' },
        delete: { summary: 'Desactivar producto' },
      },
      '/api/productos/{id}/stock': {
        patch: { summary: 'Actualizar stock (showroom y bodega)' },
      },
      '/api/sucursales': {
        get: { summary: 'Listar sucursales activas con productos y stock asociados' },
      },
      '/api/pedidos': {
        post: { summary: 'Crear un nuevo pedido' },
      },
      '/api/clientes': {
        post: { summary: 'Registrar o buscar cliente' },
      },
      '/api/health': {
        get: { summary: 'Verificar salud y conexión a la base de datos' },
      },
    },
  });
});

// Documentación Swagger UI
app.get('/docs', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TERRA Centralized Products API - Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/openapi',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`);
});

// Verificar conexión con PostgreSQL.
app.get('/api/health', async (req, res, next) => {
  try {
    const conexion = await verificarConexion();
    res.json({
      success: true,
      mensaje: 'Servidor y base de datos PostgreSQL funcionando',
      baseDeDatos: conexion.db,
      fecha: conexion.fecha,
    });
  } catch (error) {
    next(error);
  }
});

// Registrar rutas.
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/asistente', asistenteRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/geocodificacion', geocodificacionRoutes);
app.use('/api/envios', envioRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/archivos', archivoRoutes);

// Manejo centralizado de errores.
app.use(rutaNoEncontrada);
app.use(errorHandler);

export default app;
