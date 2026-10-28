
import { Router } from 'express';

import {
  crearPedido,
  crearVentaDirecta,
  registrarPagoPedido,
  obtenerPedido,
  listarPedidos,
  obtenerAnaliticaHoraria,
  obtenerComparativaPeriodos,
  obtenerResumenPeriodo,
  actualizarEstadoPedido,
  actualizarEntregaPedido,
  actualizarItemsPedido,
  asignarRepartidorPedido,
  verificarPedidoErp,
  confirmarErpManual,
  reintentarErp,
} from '../controllers/pedidoController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/', crearPedido);
router.post('/venta-directa', authAdmin, crearVentaDirecta);
router.get('/', authAdmin, listarPedidos);
router.get('/analitica-horaria', authAdmin, obtenerAnaliticaHoraria);
router.get('/comparativa', authAdmin, obtenerComparativaPeriodos);
router.get('/resumen', authAdmin, obtenerResumenPeriodo);
router.put('/:id/items', authAdmin, actualizarItemsPedido);
router.patch('/:id/estado', authAdmin, requiereRol('admin', 'vendedor'), actualizarEstadoPedido);
router.patch('/:id/entrega', authAdmin, requiereRol('admin', 'vendedor', 'despacho'), actualizarEntregaPedido);
router.patch('/:id/repartidor', authAdmin, requiereRol('admin', 'vendedor'), asignarRepartidorPedido);
// El cobro manual altera el estado financiero del pedido. Nunca puede quedar
// expuesto al navegador del cliente; QR se confirmará por webhook del proveedor.
router.patch('/:id/pago', authAdmin, requiereRol('admin', 'vendedor'), registrarPagoPedido);
// Integración con el ERP de TERRA: verificación previa y conciliación de cotizaciones.
router.post('/:id/erp/verificar', authAdmin, requiereRol('admin', 'vendedor'), verificarPedidoErp);
router.patch('/:id/erp/manual', authAdmin, requiereRol('admin'), confirmarErpManual);
router.post('/:id/erp/reintentar', authAdmin, requiereRol('admin'), reintentarErp);
router.get('/:id', obtenerPedido);

export default router;
