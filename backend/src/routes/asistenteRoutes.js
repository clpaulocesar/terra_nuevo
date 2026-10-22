import { Router } from 'express';
import { buscarInstruccionesChat, buscarProductosChat, crearPedidoChat } from '../controllers/asistenteController.js';

const router = Router();

// Buscador para el chatbot: devuelve id y stock de cada producto.
router.get('/productos', buscarProductosChat);
router.post('/productos', buscarProductosChat);

// Instrucciones de uso/armado: busca por nombre, SKU, marca o categoría (tolera acentos y letras repetidas).
router.get('/instrucciones', buscarInstruccionesChat);
router.post('/instrucciones', buscarInstruccionesChat);

// Pedido desde el chatbot: sin datos del cliente, responde con id, código y enlace del QR.
router.post('/pedidos', crearPedidoChat);

export default router;
