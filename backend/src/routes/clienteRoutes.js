
import { Router } from 'express';

import {
  crearCliente,
  crearUsuarioMayorista,
  eliminarCliente,
  obtenerCliente,
  listarClientes,
} from '../controllers/clienteController.js';
import { authAdmin } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/', crearCliente);
router.post('/mayoristas', authAdmin, crearUsuarioMayorista);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.delete('/:id', eliminarCliente);

export default router;
