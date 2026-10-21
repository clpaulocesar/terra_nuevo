import { Router } from 'express';
import { buscarProductosChat, crearPedidoChat } from '../controllers/asistenteController.js';

const router = Router();

// Buscador para el chatbot: devuelve id y stock de cada producto.
router.get('/productos', buscarProductosChat);
router.post('/productos', buscarProductosChat);

// Pedido desde el chatbot: sin datos del cliente, responde con id, código y enlace del QR.
router.post('/pedidos', crearPedidoChat);

export default router;
