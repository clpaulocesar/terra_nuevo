
import { Router } from 'express';

import {
  crearPedido,
  obtenerPedido,
  listarPedidos,
  actualizarEstadoPedido,
} from '../controllers/pedidoController.js';

const router = Router();

router.post('/', crearPedido);
router.get('/', listarPedidos);
router.patch('/:id/estado', actualizarEstadoPedido);
router.get('/:id', obtenerPedido);

export default router;
