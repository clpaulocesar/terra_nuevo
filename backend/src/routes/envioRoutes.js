import { Router } from 'express';
import { actualizarTarifaEnvio, crearTarifaEnvio, eliminarTarifaEnvio, listarTarifasEnvio, listarTodasTarifasEnvio } from '../controllers/envioController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();

router.get('/tarifas', listarTarifasEnvio);
router.get('/tarifas/admin', authAdmin, requiereRol('admin'), listarTodasTarifasEnvio);
router.post('/tarifas', authAdmin, requiereRol('admin'), crearTarifaEnvio);
router.put('/tarifas/:id', authAdmin, requiereRol('admin'), actualizarTarifaEnvio);
router.delete('/tarifas/:id', authAdmin, requiereRol('admin'), eliminarTarifaEnvio);

export default router;
