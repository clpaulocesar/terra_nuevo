
import { Router } from 'express';

import {
  crearPedido,
  crearVentaDirecta,
  registrarPagoPedido,
  obtenerPedido,
  listarPedidos,
  actualizarEstadoPedido,
} from '../controllers/pedidoController.js';
import { authAdmin } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/', crearPedido);
router.post('/venta-directa', authAdmin, crearVentaDirecta);
router.get('/', listarPedidos);
router.patch('/:id/estado', actualizarEstadoPedido);
router.patch('/:id/pago', registrarPagoPedido);
router.get('/:id', obtenerPedido);

export default router;
