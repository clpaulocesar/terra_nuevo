
import { Router } from 'express';

import {
  crearPedido,
  obtenerPedido,
} from '../controllers/pedidoController.js';

const router = Router();

router.post('/', crearPedido);
router.get('/:id', obtenerPedido);

export default router;
