
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import productoRoutes from './routes/productoRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { verificarConexion } from './config/database.js';

import {
  rutaNoEncontrada,
  errorHandler,
} from './middlewares/errorHandler.js';

const app = express();

// Permitir conexión desde React.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

// Permitir recibir JSON.
app.use(express.json({ limit: '50kb' }));

// Ruta principal.
app.get('/', (req, res) => {
  res.json({
    success: true,
    aplicacion: 'TERRA AUTOSERVICIO',
    mensaje: 'API funcionando correctamente',
    version: '1.0.0',
  });
});

// Verificar conexión con PostgreSQL.
app.get('/api/health', async (req, res, next) => {
  try {
    const conexion = await verificarConexion();

    res.json({
      success: true,
      mensaje: 'Servidor y base de datos funcionando',
      fecha: conexion.fecha,
    });
  } catch (error) {
    next(error);
  }
});

// Registrar rutas.
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/admin', adminRoutes);

// Manejo centralizado de errores.
app.use(rutaNoEncontrada);
app.use(errorHandler);

export default app;
