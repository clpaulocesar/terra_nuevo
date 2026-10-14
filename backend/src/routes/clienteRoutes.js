
import { Router } from 'express';

import {
  crearCliente,
  obtenerCliente,
} from '../controllers/clienteController.js';

const router = Router();

router.post('/', crearCliente);
router.get('/:id', obtenerCliente);

export default router;
