import { Router } from 'express';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';
import { recibirImagenes, subirImagenesProducto } from '../controllers/archivoController.js';

const router = Router();

// Imágenes de producto: multipart/form-data (campo `archivos`), solo administrador.
router.post('/productos', authAdmin, requiereRol('admin'), recibirImagenes, subirImagenesProducto);

export default router;
