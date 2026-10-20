import { Router } from 'express';
import { authAdmin } from '../middlewares/authAdmin.js';
import { crearPersonal, listarPersonal } from '../controllers/personalController.js';

const router = Router();

router.use(authAdmin);
router.get('/', listarPersonal);
router.post('/', crearPersonal);

export default router;
