
import { Router } from 'express';

import {
  crearCliente,
  obtenerCliente,
  listarClientes,
} from '../controllers/clienteController.js';

const router = Router();

router.post('/', crearCliente);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);

export default router;
