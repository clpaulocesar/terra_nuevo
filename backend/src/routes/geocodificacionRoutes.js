import { Router } from 'express';
import { geocodificarDireccion } from '../controllers/geocodificacionController.js';

const router = Router();

router.get('/reverse', geocodificarDireccion);

export default router;
