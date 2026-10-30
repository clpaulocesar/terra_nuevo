import { Router } from 'express';
import { obtenerAnaliticaVisitas, registrarVistaPublica } from '../controllers/visitaController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();

router.post('/publica', registrarVistaPublica);
router.get('/analitica', authAdmin, requiereRol('admin'), obtenerAnaliticaVisitas);

export default router;
