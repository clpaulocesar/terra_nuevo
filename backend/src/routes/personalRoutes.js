import { Router } from 'express';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';
import {
  actualizarPersonal,
  crearPersonal,
  listarPersonal,
  listarRepartidores,
} from '../controllers/personalController.js';

const router = Router();

router.use(authAdmin);
router.use(requiereRol('admin'));
router.get('/', listarPersonal);
router.get('/repartidores', listarRepartidores);
router.post('/', crearPersonal);
router.patch('/:id', actualizarPersonal);

export default router;
