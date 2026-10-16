
import { Router } from 'express';

import {
  crearCliente,
  eliminarCliente,
  obtenerCliente,
  listarClientes,
} from '../controllers/clienteController.js';

const router = Router();

router.post('/', crearCliente);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.delete('/:id', eliminarCliente);

export default router;
