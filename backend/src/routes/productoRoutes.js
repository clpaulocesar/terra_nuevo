import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  eliminarProducto,
  cambiarVisibilidadProducto,
  seedProductos,
} from '../controllers/productoController.js';
import { listarCategorias } from '../controllers/categoriaController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();

router.get('/seed', authAdmin, requiereRol('admin'), seedProductos);
router.post('/seed', authAdmin, requiereRol('admin'), seedProductos);
router.get('/categorias', listarCategorias);
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', authAdmin, requiereRol('admin'), crearProducto);
router.put('/:id', authAdmin, requiereRol('admin'), actualizarProducto);
router.patch('/:id/stock', authAdmin, requiereRol('admin'), actualizarStock);
router.patch('/:id/visibilidad', authAdmin, requiereRol('admin'), cambiarVisibilidadProducto);
router.patch('/:id', authAdmin, requiereRol('admin'), cambiarVisibilidadProducto);
router.delete('/:id', authAdmin, requiereRol('admin'), eliminarProducto);

export default router;

