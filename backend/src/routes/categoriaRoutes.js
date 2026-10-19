import { Router } from 'express';
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias, listarCategoriasCrudo } from '../controllers/categoriaController.js';

const router = Router();

router.get('/', listarCategorias);
router.get('/todas', listarCategoriasCrudo);
router.post('/', crearCategoria);
router.put('/:id', actualizarCategoria);
router.delete('/:id', eliminarCategoria);

export default router;
