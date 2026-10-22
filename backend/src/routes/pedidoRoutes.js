
import { Router } from 'express';

import {
  crearPedido,
  crearVentaDirecta,
  registrarPagoPedido,
  obtenerPedido,
  listarPedidos,
  obtenerAnaliticaHoraria,
  actualizarEstadoPedido,
  actualizarEntregaPedido,
  actualizarItemsPedido,
  asignarRepartidorPedido,
} from '../controllers/pedidoController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/', crearPedido);
router.post('/venta-directa', authAdmin, crearVentaDirecta);
router.get('/', authAdmin, listarPedidos);
router.get('/analitica-horaria', authAdmin, obtenerAnaliticaHoraria);
router.put('/:id/items', authAdmin, actualizarItemsPedido);
router.patch('/:id/estado', authAdmin, requiereRol('admin', 'vendedor'), actualizarEstadoPedido);
router.patch('/:id/entrega', authAdmin, requiereRol('admin', 'vendedor', 'despacho'), actualizarEntregaPedido);
router.patch('/:id/repartidor', authAdmin, requiereRol('admin', 'vendedor'), asignarRepartidorPedido);
router.patch('/:id/pago', registrarPagoPedido);
router.get('/:id', obtenerPedido);

export default router;
