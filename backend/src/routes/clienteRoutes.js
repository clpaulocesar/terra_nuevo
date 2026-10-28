import { Router } from 'express';

import {
  crearCliente,
  crearUsuarioMayorista,
  iniciarSesionMayorista,
  asignarClaveMayorista,
  obtenerSesionCliente,
  actualizarPerfilMayorista,
  listarMisPedidosMayorista,
  obtenerMiPedidoMayorista,
  eliminarCliente,
  obtenerCliente,
  listarClientes,
} from '../controllers/clienteController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';
import { authMayorista } from '../middlewares/authMayorista.js';

const router = Router();

router.post('/', crearCliente);
// Cuenta mayorista: login propio (bcrypt + token HMAC) y alta/clave desde el backoffice.
router.post('/auth/login', iniciarSesionMayorista);
router.post('/mayoristas', authAdmin, crearUsuarioMayorista);
router.patch('/:id/clave', authAdmin, requiereRol('admin'), asignarClaveMayorista);
router.get('/sesion', authMayorista, obtenerSesionCliente);
router.put('/perfil', authMayorista, actualizarPerfilMayorista);
router.patch('/perfil', authMayorista, actualizarPerfilMayorista);
router.get('/mis-pedidos', authMayorista, listarMisPedidosMayorista);
router.get('/mis-pedidos/:id', authMayorista, obtenerMiPedidoMayorista);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.delete('/:id', eliminarCliente);

export default router;
