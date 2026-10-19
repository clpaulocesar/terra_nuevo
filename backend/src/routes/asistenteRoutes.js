import { Router } from 'express';
import { buscarProductosChat } from '../controllers/asistenteController.js';

const router = Router();
router.get('/productos', buscarProductosChat);
router.post('/productos', buscarProductosChat);

export default router;
