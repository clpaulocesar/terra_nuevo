import { Router } from 'express';
import { iniciarSesionAdmin, perfilAdmin } from '../controllers/adminController.js';
import { authAdmin } from '../middlewares/authAdmin.js';

const router = Router();
router.post('/auth/login', iniciarSesionAdmin);
router.get('/auth/me', authAdmin, perfilAdmin);
export default router;
