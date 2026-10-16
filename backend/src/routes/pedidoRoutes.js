
import { Router } from 'express';

import {
  crearPedido,
  registrarPagoPedido,
  obtenerPedido,
  listarPedidos,
  actualizarEstadoPedido,
} from '../controllers/pedidoController.js';

const router = Router();

router.post('/', crearPedido);
router.get('/', listarPedidos);
router.patch('/:id/estado', actualizarEstadoPedido);
router.patch('/:id/pago', registrarPagoPedido);
router.get('/:id', obtenerPedido);

export default router;
