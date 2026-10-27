import { Router } from 'express';
import { listarSucursalesConDisponibilidad } from '../controllers/sucursalController.js';

const router = Router();

router.get('/', listarSucursalesConDisponibilidad);

export default router;
