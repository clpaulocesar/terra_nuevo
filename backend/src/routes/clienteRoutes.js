
import { Router } from 'express';

import {
  crearCliente,
  crearUsuarioMayorista,
  obtenerSesionCliente,
  actualizarPerfilMayorista,
  listarMisPedidosMayorista,
  eliminarCliente,
  obtenerCliente,
  listarClientes,
} from '../controllers/clienteController.js';
import { authAdmin } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/', crearCliente);
router.post('/mayoristas', authAdmin, crearUsuarioMayorista);
router.get('/sesion', obtenerSesionCliente);
router.put('/perfil', actualizarPerfilMayorista);
router.patch('/perfil', actualizarPerfilMayorista);
router.get('/mis-pedidos', listarMisPedidosMayorista);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.delete('/:id', eliminarCliente);

export default router;
