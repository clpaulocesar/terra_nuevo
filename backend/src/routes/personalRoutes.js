import { Router } from 'express';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';
import { crearPersonal, listarPersonal } from '../controllers/personalController.js';

const router = Router();

router.use(authAdmin);
router.use(requiereRol('admin'));
router.get('/', listarPersonal);
router.post('/', crearPersonal);

export default router;
