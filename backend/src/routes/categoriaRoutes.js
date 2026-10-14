import { Router } from 'express';
import { listarCategorias } from '../controllers/categoriaController.js';

const router = Router();

router.get('/', listarCategorias);

export default router;
