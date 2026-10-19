import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto,
  seedProductos,
} from '../controllers/productoController.js';
import { listarCategorias } from '../controllers/categoriaController.js';

const router = Router();

router.get('/seed', seedProductos);
router.post('/seed', seedProductos);
router.get('/categorias', listarCategorias);
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/stock', actualizarStock);
router.delete('/:id', eliminarProducto);

export default router;
