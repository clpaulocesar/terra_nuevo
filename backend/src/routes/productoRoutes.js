import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto,
} from '../controllers/productoController.js';

const router = Router();

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/stock', actualizarStock);
router.delete('/:id', eliminarProducto);

export default router;
