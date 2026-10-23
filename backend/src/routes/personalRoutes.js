import { Router } from 'express';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';
import {
  actualizarPersonal,
  crearPersonal,
  eliminarPersonal,
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
router.delete('/:id', eliminarPersonal);

export default router;
