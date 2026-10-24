import { Router } from 'express';
import { crearCotizacionErp, estadoConfiguracionErp, prepararIntegracionErp, probarConexionErp, sincronizarProductosErp } from '../controllers/erpController.js';
import { authAdmin, requiereRol } from '../middlewares/authAdmin.js';

const router = Router();
router.use(authAdmin, requiereRol('admin'));
router.get('/configuracion', estadoConfiguracionErp);
router.post('/conexion', probarConexionErp);
router.post('/preparar', prepararIntegracionErp);
router.post('/sincronizaciones/productos', sincronizarProductosErp);
router.post('/cotizaciones', crearCotizacionErp);
export default router;
